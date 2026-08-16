"""
CodeMind — Auth API Routes

Handles user registration, login, token refresh, and GitHub OAuth.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    encrypt_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise ConflictError("A user with this email already exists")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise AuthenticationError("Invalid email or password")

    if not verify_password(body.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    if not user.is_active:
        raise AuthenticationError("Account is deactivated")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest):
    """Get a new access token using a refresh token."""
    payload = decode_token(body.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise AuthenticationError("Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token")

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


# --- GitHub OAuth ---

@router.get("/github/authorize")
async def github_authorize():
    """Return the GitHub OAuth authorization URL."""
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user user:email repo",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {"authorization_url": f"https://github.com/login/oauth/authorize?{query}"}


@router.get("/github/callback", response_model=TokenResponse)
async def github_callback(
    code: str = Query(...), db: AsyncSession = Depends(get_db)
):
    """Handle GitHub OAuth callback — exchange code for token, create/update user."""
    # Exchange authorization code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()

    github_token = token_data.get("access_token")
    if not github_token:
        raise AuthenticationError("Failed to obtain GitHub access token")

    # Fetch GitHub user profile
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}"},
        )
        github_user = user_resp.json()

        # Fetch primary email if not public
        email = github_user.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {github_token}"},
            )
            emails = emails_resp.json()
            primary = next((e for e in emails if e.get("primary")), None)
            email = primary["email"] if primary else f"{github_user['login']}@github.local"

    # Find or create user
    result = await db.execute(
        select(User).where(
            (User.github_username == github_user["login"]) | (User.email == email)
        )
    )
    user = result.scalar_one_or_none()

    if user:
        # Update existing user with latest GitHub data
        user.github_username = github_user["login"]
        user.github_access_token = encrypt_token(github_token)
        user.avatar_url = github_user.get("avatar_url")
        if not user.full_name and github_user.get("name"):
            user.full_name = github_user["name"]
    else:
        # Create new user from GitHub profile
        user = User(
            email=email,
            full_name=github_user.get("name") or github_user["login"],
            avatar_url=github_user.get("avatar_url"),
            github_username=github_user["login"],
            github_access_token=encrypt_token(github_token),
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
