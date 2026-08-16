"""DevPilot AI — GitHub Agent: Analyzes repos and PRs using LLM."""

import httpx
from typing import Any
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from app.core.config import get_settings

settings = get_settings()

GITHUB_SYSTEM_PROMPT = """You are a GitHub Analysis agent in DevPilot AI.
You help developers understand their repositories and pull requests.

When analyzing code or PRs:
1. Provide clear, actionable insights
2. Point out potential issues, bugs, or improvements
3. Follow best practices for code review
4. Use markdown with code blocks for examples
5. Be constructive and specific
"""

@tool
async def get_github_repo(owner: str, repo: str) -> dict:
    """Fetch details about a GitHub repository."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to fetch repo: {response.status_code}"}

@tool
async def get_pull_request(owner: str, repo: str, pull_number: int) -> dict:
    """Fetch details about a specific pull request."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}")
        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to fetch PR: {response.status_code}"}


def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=0,
        streaming=True,
    )


# Create the React Agent for GitHub
github_agent = create_react_agent(_get_llm(), tools=[get_github_repo, get_pull_request], state_modifier=GITHUB_SYSTEM_PROMPT)

async def github_node(state: dict) -> dict:
    """GitHub node for the LangGraph graph."""
    # Run the react agent and return the new messages
    result = await github_agent.ainvoke({"messages": state["messages"]})
    # Return the new messages appended by the agent
    return {"messages": result["messages"][len(state["messages"]):]}
