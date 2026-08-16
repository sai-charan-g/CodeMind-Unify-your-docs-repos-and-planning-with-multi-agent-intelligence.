"""
CodeMind — Agent State Schema

Defines the shared state that flows through the LangGraph graph.
All agent nodes read from and write to this state.
"""

from typing import Annotated, Any, TypedDict
from operator import add
from langgraph.graph.message import AnyMessage, add_messages


class AgentState(TypedDict):
    """Shared state schema for the multi-agent graph."""
    
    # Standard LangGraph message tracking
    messages: Annotated[list[AnyMessage], add_messages]

    # Input Metadata
    conversation_id: str
    user_id: str
    agent_type: str | None

    # Routing
    intent: str

    # Planner output
    tasks: list[dict[str, Any]]

    # Final output
    final_response: str

    # Metadata
    tokens_used: int
    agent_history: Annotated[list[str], add]

    # Streaming
    stream_tokens: bool
