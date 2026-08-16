import json
import pytest
from httpx import AsyncClient

@pytest.fixture
async def auth_headers(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "chat@example.com", "password": "securepassword", "full_name": "Chat User"}
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "chat@example.com", "password": "securepassword"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_conversation(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/chat/conversations",
        headers=auth_headers,
        json={"title": "Test Chat", "agent_type": "planner"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Chat"
    assert data["agent_type"] == "planner"
    assert "id" in data

@pytest.mark.asyncio
async def test_list_conversations(client: AsyncClient, auth_headers):
    await client.post(
        "/api/v1/chat/conversations",
        headers=auth_headers,
        json={"title": "Chat 1"}
    )
    response = await client.get("/api/v1/chat/conversations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

@pytest.mark.asyncio
async def test_send_message_mocked(client: AsyncClient, auth_headers, mocker):
    # Create conversation first
    conv_resp = await client.post(
        "/api/v1/chat/conversations",
        headers=auth_headers,
        json={"title": "Test Chat"}
    )
    conv_id = conv_resp.json()["id"]

    # Mock the graph execution
    async def mock_invoke_agent(*args, **kwargs):
        yield {"type": "token", "content": "Hello"}
        yield {"type": "token", "content": " World!"}
        yield {"type": "metadata", "data": {"agent": "planner"}}
    
    mocker.patch("agents.core.graph.invoke_agent", mock_invoke_agent)

    # Test SSE response
    response = await client.post(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers=auth_headers,
        json={"content": "Hi there!"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    
    lines = response.text.strip().split("\n")
    events = []
    for line in lines:
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))
            
    assert len(events) >= 3
    assert "Hello" in response.text
