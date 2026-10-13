import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "securepassword", "full_name": "Login User"}
    )
    
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    # Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "securepassword", "full_name": "Me User"}
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "securepassword"}
    )
    access_token = login_resp.json()["access_token"]
    
    # Get Me
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"

@pytest.mark.asyncio
async def test_change_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "pwd@example.com", "password": "oldpassword123", "full_name": "Pwd User"}
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwd@example.com", "password": "oldpassword123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Successful change
    resp = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "oldpassword123", "new_password": "newpassword456"}
    )
    assert resp.status_code == 200

    # Verify old password no longer works
    fail_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwd@example.com", "password": "oldpassword123"}
    )
    assert fail_login.status_code == 401

    # Verify new password works
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwd@example.com", "password": "newpassword456"}
    )
    assert new_login.status_code == 200
