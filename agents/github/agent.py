"""CodeMind — GitHub Agent: Analyzes repos and PRs using LLM with OAuth authentication."""

import httpx
from typing import Any
from contextvars import ContextVar
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from app.core.config import get_settings

settings = get_settings()

_current_github_token: ContextVar[str | None] = ContextVar("_current_github_token", default=None)

GITHUB_SYSTEM_PROMPT = """You are a GitHub Analysis agent in CodeMind.
You help developers understand their repositories and pull requests.

When analyzing code or PRs:
1. Provide clear, actionable insights
2. Review changed files, diffs, potential bugs, edge cases, and performance or security improvements
3. Follow best practices for code review
4. Use markdown with syntax-highlighted code blocks for recommendations
5. Be constructive, concise, and specific
"""

def _build_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = _current_github_token.get()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


@tool
async def get_github_repo(owner: str, repo: str) -> dict:
    """Fetch details about a GitHub repository."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=_build_headers(),
        )
        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to fetch repo: {response.status_code} - {response.text}"}


@tool
async def list_repo_pull_requests(owner: str, repo: str, state: str = "open") -> list[dict] | dict:
    """Fetch recent pull requests for a repository."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls",
            headers=_build_headers(),
            params={"state": state, "per_page": 10},
        )
        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to list PRs: {response.status_code} - {response.text}"}


@tool
async def get_pull_request(owner: str, repo: str, pull_number: int) -> dict:
    """Fetch details about a specific pull request."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}",
            headers=_build_headers(),
        )
        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to fetch PR: {response.status_code} - {response.text}"}


@tool
async def get_pull_request_files(owner: str, repo: str, pull_number: int) -> list[dict] | dict:
    """Fetch modified files and diff patches in a pull request for review."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files",
            headers=_build_headers(),
        )
        if response.status_code == 200:
            files_data = response.json()
            return [
                {
                    "filename": f.get("filename"),
                    "status": f.get("status"),
                    "additions": f.get("additions"),
                    "deletions": f.get("deletions"),
                    "patch": f.get("patch", "")[:3000],
                }
                for f in files_data[:15]
            ]
        return {"error": f"Failed to fetch PR files: {response.status_code} - {response.text}"}


def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key or "AIzaSy_dummy_key_for_testing",
        temperature=0,
        streaming=True,
    )


_github_agent = None


def get_github_agent():
    global _github_agent
    if _github_agent is None:
        _github_agent = create_react_agent(
            _get_llm(),
            tools=[get_github_repo, list_repo_pull_requests, get_pull_request, get_pull_request_files],
            state_modifier=GITHUB_SYSTEM_PROMPT,
        )
    return _github_agent


class _LazyGithubAgent:
    def __getattr__(self, name: str) -> Any:
        return getattr(get_github_agent(), name)


github_agent = _LazyGithubAgent()


async def _get_user_token(user_id: str | None) -> str | None:
    if not user_id:
        return None
    try:
        import uuid
        from app.db.session import async_session_factory
        from app.models.user import User
        from app.core.security import decrypt_token
        from sqlalchemy import select

        async with async_session_factory() as db:
            result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            if user and user.github_access_token:
                return decrypt_token(user.github_access_token)
    except Exception:
        pass
    return None


async def github_node(state: dict) -> dict:
    """GitHub node for the LangGraph graph with user token context."""
    user_id = state.get("user_id")
    token = await _get_user_token(user_id)
    token_reset = _current_github_token.set(token)
    try:
        result = await github_agent.ainvoke({"messages": state["messages"]})
        return {"messages": result["messages"][len(state["messages"]):]}
    finally:
        _current_github_token.reset(token_reset)
