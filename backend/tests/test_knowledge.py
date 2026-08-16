import pytest
from httpx import AsyncClient

@pytest.fixture
async def auth_headers(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "knowledge@example.com", "password": "securepassword", "full_name": "Knowledge User"}
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "knowledge@example.com", "password": "securepassword"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def project_id(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Knowledge Project"}
    )
    return resp.json()["id"]

@pytest.mark.asyncio
async def test_upload_document(client: AsyncClient, auth_headers, project_id, mocker):
    # Mock the background task
    mock_process = mocker.patch("app.api.v1.knowledge.process_document")
    
    file_content = b"This is a test document."
    files = {"file": ("test.txt", file_content, "text/plain")}
    data = {"project_id": str(project_id)}
    
    response = await client.post(
        "/api/v1/knowledge/documents/upload",
        headers=auth_headers,
        data=data,
        files=files
    )
    
    assert response.status_code == 201
    resp_data = response.json()
    assert resp_data["filename"] == "test.txt"
    assert resp_data["project_id"] == project_id
    assert resp_data["status"] == "pending"
    
    # Check if background task was called
    mock_process.assert_called_once()

@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient, auth_headers, project_id, mocker):
    mocker.patch("app.api.v1.knowledge.process_document")
    
    # Upload first
    await client.post(
        "/api/v1/knowledge/documents/upload",
        headers=auth_headers,
        data={"project_id": str(project_id)},
        files={"file": ("doc1.txt", b"content", "text/plain")}
    )
    
    response = await client.get(
        f"/api/v1/knowledge/documents?project_id={project_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    resp_data = response.json()
    assert len(resp_data) >= 1
    assert resp_data[0]["filename"] == "doc1.txt"

@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, auth_headers, project_id, mocker):
    mocker.patch("app.api.v1.knowledge.process_document")
    
    upload_resp = await client.post(
        "/api/v1/knowledge/documents/upload",
        headers=auth_headers,
        data={"project_id": str(project_id)},
        files={"file": ("todelete.txt", b"content", "text/plain")}
    )
    doc_id = upload_resp.json()["id"]
    
    # Mock chromadb deletion
    mocker.patch("agents.rag.retriever.delete_documents")
    
    delete_resp = await client.delete(
        f"/api/v1/knowledge/documents/{doc_id}",
        headers=auth_headers
    )
    
    assert delete_resp.status_code == 204
