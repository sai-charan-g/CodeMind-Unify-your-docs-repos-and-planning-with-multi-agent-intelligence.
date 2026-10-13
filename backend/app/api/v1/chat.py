"""
CodeMind — Chat API Routes

Handles conversation CRUD and message sending with SSE streaming.
"""

import json
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationResponse,
    CreateConversationRequest,
    SendMessageRequest,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation."""
    conversation = Conversation(
        user_id=current_user.id,
        title=body.title,
        project_id=body.project_id,
        agent_type=body.agent_type,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the current user, newest first."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a conversation with all its messages."""
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("Conversation", str(conversation_id))
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("Conversation", str(conversation_id))

    await db.delete(conversation)
    await db.commit()


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a user message and stream the AI response via SSE.

    The response is streamed as Server-Sent Events with the following event types:
    - token: Individual tokens as they are generated
    - metadata: Agent execution metadata (agent_type, tokens_used, etc.)
    - done: Signals the end of the stream
    - error: Sent if an error occurs during generation
    """
    # Verify conversation exists and belongs to user
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("Conversation", str(conversation_id))

    user_uuid = current_user.id
    user_id_str = str(user_uuid)
    conv_agent_type = conversation.agent_type

    # Save user message
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=body.content,
    )
    db.add(user_message)
    await db.commit()

    async def event_generator():
        """Stream AI response tokens via SSE."""
        full_response = ""
        try:
            # Import agent graph here to avoid circular imports
            from agents.core.graph import invoke_agent

            async for event in invoke_agent(
                message=body.content,
                conversation_id=str(conversation_id),
                user_id=user_id_str,
                agent_type=conv_agent_type,
            ):
                if event["type"] == "token":
                    full_response += event["content"]
                    yield {
                        "event": "token",
                        "data": json.dumps({"content": event["content"]}),
                    }
                elif event["type"] == "metadata":
                    yield {
                        "event": "metadata",
                        "data": json.dumps(event["data"]),
                    }

            # Save complete assistant message and agent run
            from app.db.session import async_session_factory
            from app.models.agent_run import AgentRun

            async with async_session_factory() as save_db:
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                )
                save_db.add(assistant_message)

                agent_run = AgentRun(
                    user_id=user_uuid,
                    conversation_id=conversation_id,
                    agent_type=conv_agent_type or "general",
                    status="success",
                    prompt_tokens=max(1, len(body.content.split())),
                    completion_tokens=max(1, len(full_response.split())),
                )
                save_db.add(agent_run)
                await save_db.commit()

            yield {"event": "done", "data": json.dumps({"success": True})}

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }

    return EventSourceResponse(event_generator())
