"""
CodeMind — Project Schemas

Request/response models for project management.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    github_repo_url: str | None = None


class UpdateProjectRequest(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    github_repo_url: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    github_repo_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
