"""
CodeMind — Chat Schemas

Request/response models for conversations and messages.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Request Schemas ---

class CreateConversationRequest(BaseModel):
    title: str = Field(default="New Conversation", max_length=500)
    project_id: uuid.UUID | None = None
    agent_type: str | None = None


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


# --- Response Schemas ---

class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    metadata_: dict[str, Any] | None = Field(None, alias="metadata_")
    token_count: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ConversationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID | None = None
    title: str
    agent_type: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
