"""
CodeMind — Knowledge Base Models

KnowledgeDocument tracks uploaded files (PDF, MD, etc.).
KnowledgeChunk stores the chunked text with references to ChromaDB vectors.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class KnowledgeDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "knowledge_documents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(100), nullable=False  # "application/pdf", "text/markdown", etc.
    )
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
        # pending → processing → ready → error
    )
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="knowledge_documents")
    project = relationship("Project", back_populates="knowledge_documents")
    chunks = relationship(
        "KnowledgeChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<KnowledgeDocument {self.filename} [{self.status}]>"


class KnowledgeChunk(Base, UUIDMixin):
    __tablename__ = "knowledge_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSON, nullable=True  # Page number, section title, etc.
    )
    chroma_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True  # Reference to ChromaDB document ID
    )

    # Relationships
    document = relationship("KnowledgeDocument", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<KnowledgeChunk doc={self.document_id} idx={self.chunk_index}>"
