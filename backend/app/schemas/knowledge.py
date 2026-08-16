"""
DevPilot AI — Knowledge Base Schemas

Request/response models for document management.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID | None = None
    filename: str
    content_type: str
    status: str
    chunk_count: int
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChunkResponse(BaseModel):
    id: uuid.UUID
    chunk_index: int
    content: str
    metadata_: dict[str, Any] | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class DocumentDetailResponse(DocumentResponse):
    chunks: list[ChunkResponse] = []
