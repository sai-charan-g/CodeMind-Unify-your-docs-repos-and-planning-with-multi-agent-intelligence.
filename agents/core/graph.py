"""
DevPilot AI — Main Agent Graph

Builds the LangGraph StateGraph that orchestrates all agents.
Provides the invoke_agent() async generator for SSE streaming.
"""

from typing import Any, AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

from app.core.config import get_settings
from agents.core.state import AgentState
from agents.core.supervisor import supervisor_node
from agents.github.agent import github_node
from agents.planner.agent import planner_node
from agents.rag.agent import rag_node

settings = get_settings()

def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=0.7,
        streaming=True,
    )

async def general_node(state: dict) -> dict:
    """General conversation node when no specialist is needed."""
    llm = _get_llm()
    system_prompt = (
        "You are DevPilot AI, a helpful engineering assistant. "
        "Provide clear, concise, and technically accurate responses. "
        "Use markdown formatting when appropriate."
    )
    messages = [{"role": "system", "content": system_prompt}] + state.get("messages", [])
    response = await llm.ainvoke(messages)
    return {"messages": [response]}


def route_after_supervisor(state: dict) -> str:
    """Route to the correct specialist based on the classified intent."""
    intent = state.get("intent", "general")
    if intent in {"github", "rag", "planner"}:
        return intent
    return "general"


# Build the Graph
builder = StateGraph(AgentState)

# Add nodes
builder.add_node("supervisor", supervisor_node)
builder.add_node("github", github_node)
builder.add_node("rag", rag_node)
builder.add_node("planner", planner_node)
builder.add_node("general", general_node)

# Add edges
builder.add_edge(START, "supervisor")
builder.add_conditional_edges("supervisor", route_after_supervisor)
builder.add_edge("github", END)
builder.add_edge("rag", END)
builder.add_edge("planner", END)
builder.add_edge("general", END)

# Compile
graph = builder.compile()


async def invoke_agent(
    message: str,
    conversation_id: str,
    user_id: str,
    agent_type: str | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Main entry point for agent invocation.
    Yields streaming events for SSE consumption.
    """
    from langchain_core.messages import HumanMessage
    
    # Initialize the state
    initial_state = {
        "messages": [HumanMessage(content=message)],
        "conversation_id": conversation_id,
        "user_id": user_id,
        "agent_type": agent_type,
    }

    # Stream the graph execution events
    async for event in graph.astream_events(initial_state, version="v2"):
        kind = event["event"]
        
        # When the supervisor finishes, emit the metadata event for the frontend
        if kind == "on_chain_end" and event["name"] == "supervisor":
            output = event["data"].get("output", {})
            if output:
                intent = output.get("intent", "general")
                yield {"type": "metadata", "data": {"intent": intent, "agent": intent}}
        
        # When any chat model streams a chunk, yield it as a token
        elif kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content and isinstance(chunk.content, str):
                yield {"type": "token", "content": chunk.content}
