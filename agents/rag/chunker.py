"""CodeMind — Document Chunker: Splits documents into chunks for embedding."""

import os
from pathlib import Path
from loguru import logger


async def process_document(document_id: str, file_path: str, file_ext: str) -> None:
    """Process a document: extract text, chunk it, generate embeddings, store in ChromaDB."""
    from app.db.session import async_session_factory
    from app.models.knowledge import KnowledgeDocument, KnowledgeChunk

    async with async_session_factory() as db:
        try:
            # Update status to processing
            from sqlalchemy import select
            result = await db.execute(select(KnowledgeDocument).where(KnowledgeDocument.id == document_id))
            doc = result.scalar_one_or_none()
            if not doc:
                return
            doc.status = "processing"
            await db.commit()

            # Extract text
            text = _extract_text(file_path, file_ext)
            if not text:
                doc.status = "error"
                doc.error_message = "Could not extract text from file"
                await db.commit()
                return

            # Chunk text
            chunks = _chunk_text(text, chunk_size=1000, overlap=200)

            # Save chunks and generate embeddings
            for i, chunk_text in enumerate(chunks):
                chunk = KnowledgeChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk_text,
                    metadata_={"filename": doc.filename, "chunk_index": i},
                )
                db.add(chunk)

            doc.chunk_count = len(chunks)
            doc.status = "ready"
            await db.commit()

            # Store embeddings in ChromaDB
            await _store_embeddings(document_id, chunks, doc.filename)

            logger.info(f"Processed document {doc.filename}: {len(chunks)} chunks")

        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            doc.status = "error"
            doc.error_message = str(e)[:500]
            await db.commit()


def _extract_text(file_path: str, file_ext: str) -> str:
    """Extract plain text from a file based on its extension."""
    if file_ext in (".md", ".txt"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    elif file_ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return ""

    elif file_ext == ".docx":
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(para.text for para in doc.paragraphs)
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return ""

    return ""


def _chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks by character count."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


async def _store_embeddings(document_id: str, chunks: list[str], filename: str) -> None:
    """Store chunk embeddings in ChromaDB."""
    try:
        from agents.rag.retriever import add_documents
        await add_documents(document_id, chunks, filename)
    except Exception as e:
        logger.error(f"ChromaDB storage failed for {document_id}: {e}")
