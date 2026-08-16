"""
DevPilot AI — Supervisor Node

The supervisor classifies user intent and routes to the appropriate
specialist agent. It serves as the entry point of the agent graph.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings

settings = get_settings()

SUPERVISOR_SYSTEM_PROMPT = """You are the DevPilot AI Supervisor. Your job is to classify user requests
and route them to the correct specialist agent.

Classify the user's intent into exactly ONE of these categories:
- "rag": User wants to search documentation, ask about uploaded files, or find information from the knowledge base.
- "github": User wants to analyze repositories, review pull requests, view commits, or anything GitHub-related.
- "planner": User has a complex multi-step request that needs task decomposition (e.g., "review my PR and generate tests").
- "general": Simple questions, greetings, or general conversation that doesn't need a specialist.

Respond with ONLY the category name, nothing else."""


async def classify_intent(user_message: str) -> str:
    """Use LLM to classify the user's intent into an agent category."""
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=0,
    )

    response = await llm.ainvoke([
        {"role": "system", "content": SUPERVISOR_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ])

    intent = response.content.strip().lower()

    # Validate the classification
    valid_intents = {"rag", "github", "planner", "general"}
    if intent not in valid_intents:
        intent = "general"

    return intent


async def supervisor_node(state: dict) -> dict:
    """
    Supervisor node for the LangGraph graph.
    Classifies intent and sets routing direction.
    """
    messages = state.get("messages", [])
    user_message = messages[-1].content if messages else ""
    forced_agent = state.get("agent_type")

    if forced_agent and forced_agent in {"rag", "github", "planner"}:
        intent = forced_agent
    else:
        intent = await classify_intent(user_message)

    return {
        "intent": intent,
        "agent_history": [f"supervisor → classified as '{intent}'"],
    }
