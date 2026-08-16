"""CodeMind — Planner Agent: Decomposes complex requests into subtasks."""

from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings

settings = get_settings()

PLANNER_SYSTEM_PROMPT = """You are a Task Planner agent in CodeMind.
Your role is to break down complex user requests into clear, sequential, executable tasks.

For each task, output:
- Task number
- Description
- Which specialist agent should handle it (rag, github, or general)

Format your response in markdown with numbered tasks.
Be specific and actionable. Example:

## Task Plan

1. **Fetch PR #42 from repository** (agent: github)
2. **Analyze changed files for code quality** (agent: general)
3. **Search documentation for best practices** (agent: rag)
4. **Generate summary with recommendations** (agent: general)
"""

def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=0,
        streaming=True,
    )

async def planner_node(state: dict) -> dict:
    """Planner node that generates a task plan."""
    llm = _get_llm()
    messages = [{"role": "system", "content": PLANNER_SYSTEM_PROMPT}] + state["messages"]
    response = await llm.ainvoke(messages)
    
    return {"messages": [response]}
