"""
CodeMind — Knowledge Base API Routes

Handles document upload, listing, and deletion.
Document processing (chunking + embedding) is triggered asynchronously.
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError, ValidationError
from app.db.session import get_db
from app.models.knowledge import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge import DocumentDetailResponse, DocumentResponse

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

# Supported file types
ALLOWED_EXTENSIONS = {".pdf", ".md", ".txt", ".docx"}
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/documents/upload", response_model=DocumentResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    project_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document for RAG indexing.
    Returns 202 Accepted — processing happens asynchronously.
    """
    if not file.filename:
        raise ValidationError("Filename is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save file to disk
    file_id = uuid.uuid4()
    safe_filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / safe_filename

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create document record
    document = KnowledgeDocument(
        user_id=current_user.id,
        project_id=project_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        storage_path=str(file_path),
        status="pending",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Trigger async processing (chunking + embedding)
    # In V1, we process inline. In V2, this moves to Celery.
    from agents.rag.chunker import process_document
    import asyncio
    asyncio.create_task(process_document(str(document.id), str(file_path), ext))

    return document


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    project_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for the current user, optionally filtered by project."""
    query = select(KnowledgeDocument).where(
        KnowledgeDocument.user_id == current_user.id
    )
    if project_id:
        query = query.where(KnowledgeDocument.project_id == project_id)

    query = query.order_by(KnowledgeDocument.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details with its chunks."""
    result = await db.execute(
        select(KnowledgeDocument)
        .options(selectinload(KnowledgeDocument.chunks))
        .where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError("Document", str(document_id))
    return document


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document, its chunks, and ChromaDB vectors."""
    result = await db.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError("Document", str(document_id))

    # Delete file from disk
    if os.path.exists(document.storage_path):
        os.remove(document.storage_path)

    # Delete from ChromaDB
    try:
        from agents.rag.retriever import delete_document_vectors
        await delete_document_vectors(str(document_id))
    except Exception:
        pass  # Log but don't fail if ChromaDB cleanup fails

    await db.delete(document)
    await db.commit()
