"""DevPilot AI — Schemas package."""

from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    SendMessageRequest,
)
from app.schemas.knowledge import (
    ChunkResponse,
    DocumentDetailResponse,
    DocumentResponse,
)
from app.schemas.project import (
    CreateProjectRequest,
    ProjectResponse,
    UpdateProjectRequest,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "RefreshTokenRequest",
    "TokenResponse",
    "UserResponse",
    "CreateConversationRequest",
    "SendMessageRequest",
    "ConversationResponse",
    "ConversationDetailResponse",
    "MessageResponse",
    "DocumentResponse",
    "DocumentDetailResponse",
    "ChunkResponse",
    "CreateProjectRequest",
    "UpdateProjectRequest",
    "ProjectResponse",
]
