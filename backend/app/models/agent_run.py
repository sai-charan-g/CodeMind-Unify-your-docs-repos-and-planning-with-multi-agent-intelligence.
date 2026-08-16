"""
DevPilot AI — Agent Run Model

Tracks every agent invocation for analytics, debugging, and cost tracking.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class AgentRun(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "agent_runs"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_type: Mapped[str] = mapped_column(
        String(50), nullable=False  # "planner", "rag", "github", "supervisor"
    )
    task_plan: Mapped[dict | None] = mapped_column(
        JSON, nullable=True  # Planner output / task breakdown
    )
    status: Mapped[str] = mapped_column(
        String(20), default="running", nullable=False
        # running → completed → failed
    )
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="agent_runs")
    user = relationship("User", back_populates="agent_runs")

    def __repr__(self) -> str:
        return f"<AgentRun {self.agent_type} [{self.status}]>"
