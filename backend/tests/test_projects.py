import pytest
import pytest_asyncio
from httpx import AsyncClient

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "project@example.com", "password": "securepassword", "full_name": "Project User"}
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "project@example.com", "password": "securepassword"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Test Project", "description": "A test project", "github_repo": "user/repo"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert "id" in data

@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Project 1", "description": "First project"}
    )
    await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Project 2", "description": "Second project"}
    )
    
    response = await client.get("/api/v1/projects/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

@pytest.mark.asyncio
async def test_get_project(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Get Project", "description": "To be fetched"}
    )
    project_id = create_resp.json()["id"]
    
    response = await client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Get Project"

@pytest.mark.asyncio
async def test_update_project(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "Old Name", "description": "Old desc"}
    )
    project_id = create_resp.json()["id"]
    
    response = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers=auth_headers,
        json={"name": "New Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["description"] == "Old desc"

@pytest.mark.asyncio
async def test_delete_project(client: AsyncClient, auth_headers):
    create_resp = await client.post(
        "/api/v1/projects/",
        headers=auth_headers,
        json={"name": "To be deleted"}
    )
    project_id = create_resp.json()["id"]
    
    response = await client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 204
    
    get_resp = await client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_resp.status_code == 404
