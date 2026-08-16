"""
CodeMind — Project Model

Projects group conversations, knowledge documents, and GitHub repos
under a single logical workspace.
"""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    github_repo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="projects")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Project {self.name}>"
