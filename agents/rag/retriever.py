"""CodeMind — ChromaDB Retriever: Manages vector storage and semantic search."""

import chromadb
from loguru import logger
from app.core.config import get_settings

settings = get_settings()

_client = None
_collection = None


def _get_collection():
    """Get or create the ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        _client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        _collection = _client.get_or_create_collection(
            name="codemind_knowledge",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def add_documents(document_id: str, chunks: list[str], filename: str) -> None:
    """Add document chunks to ChromaDB with auto-generated embeddings."""
    collection = _get_collection()
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    logger.info(f"Added {len(chunks)} chunks to ChromaDB for doc {document_id}")


async def search_documents(query: str, user_id: str, top_k: int = 5) -> list[dict]:
    """Search ChromaDB for relevant chunks."""
    try:
        collection = _get_collection()
        results = collection.query(query_texts=[query], n_results=top_k)

        if not results or not results["documents"] or not results["documents"][0]:
            return []

        output = []
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            output.append({"content": doc, "metadata": metadata, "distance": results["distances"][0][i] if results["distances"] else 0})
        return output
    except Exception as e:
        logger.error(f"ChromaDB search failed: {e}")
        return []


async def delete_document_vectors(document_id: str) -> None:
    """Delete all vectors for a document from ChromaDB."""
    try:
        collection = _get_collection()
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        logger.error(f"ChromaDB delete failed: {e}")
