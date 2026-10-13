"""CodeMind — RAG Agent: Retrieves context from knowledge base and generates answers with citations."""

from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage
from app.core.config import get_settings

settings = get_settings()

RAG_SYSTEM_PROMPT = """You are a RAG (Retrieval-Augmented Generation) agent in CodeMind.
You answer questions using context retrieved from the user's uploaded documents.

Rules:
1. ONLY answer based on the provided context. If the context doesn't contain the answer, say so clearly.
2. Always cite your sources using [Source: filename, chunk N] format.
3. Be precise and technical.
4. Use markdown formatting for code blocks, lists, etc.

Context:
{context}
"""

def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key or "AIzaSy_dummy_key_for_testing",
        temperature=0,
        streaming=True,
    )


async def rag_node(state: dict) -> dict:
    """Search knowledge base and generate an answer with citations."""
    messages = state.get("messages", [])
    user_message = messages[-1].content if messages else ""
    user_id = state.get("user_id", "")

    # Step 1: Retrieve relevant chunks from ChromaDB
    context = await _retrieve_context(user_message, user_id)

    if not context:
        return {"messages": [AIMessage(content="I couldn't find any relevant information in your knowledge base. Please upload documents first, then try again.")]}

    # Step 2: Generate answer with citations
    llm = _get_llm()
    prompt = RAG_SYSTEM_PROMPT.format(context=context)
    
    # We pass the system prompt and the rest of the conversation history
    response = await llm.ainvoke([{"role": "system", "content": prompt}] + messages)
    return {"messages": [response]}


async def _retrieve_context(query: str, user_id: str, top_k: int = 5) -> str:
    """Retrieve relevant chunks from ChromaDB."""
    try:
        from agents.rag.retriever import search_documents
        results = await search_documents(query, user_id, top_k=top_k)

        if not results:
            return ""

        context_parts = []
        for i, result in enumerate(results):
            source = result.get("metadata", {}).get("filename", "Unknown")
            chunk_idx = result.get("metadata", {}).get("chunk_index", i)
            content = result.get("content", "")
            context_parts.append(f"[Source: {source}, chunk {chunk_idx}]\n{content}")

        return "\n\n---\n\n".join(context_parts)

    except Exception:
        return ""
