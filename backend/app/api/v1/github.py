"""
CodeMind — GitHub API Routes

Provides endpoints to fetch user repositories, PRs, and repo details
using the authenticated user's GitHub access token.
"""

import uuid

from fastapi import APIRouter, Depends
import httpx

from app.api.deps import get_current_user
from app.core.exceptions import AuthenticationError, ExternalServiceError
from app.core.security import decrypt_token
from app.models.user import User

router = APIRouter(prefix="/github", tags=["GitHub"])

GITHUB_API = "https://api.github.com"


def _get_github_headers(user: User) -> dict:
    if not user.github_access_token:
        raise AuthenticationError("GitHub account not connected.")
    token = decrypt_token(user.github_access_token)
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


@router.get("/repos")
async def list_repos(
    page: int = 1, per_page: int = 30, sort: str = "updated",
    current_user: User = Depends(get_current_user),
):
    headers = _get_github_headers(current_user)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API}/user/repos", headers=headers,
                                params={"page": page, "per_page": per_page, "sort": sort})
        if resp.status_code != 200:
            raise ExternalServiceError("GitHub", resp.text)
        return resp.json()


@router.get("/repos/{owner}/{repo}")
async def get_repo(owner: str, repo: str, current_user: User = Depends(get_current_user)):
    headers = _get_github_headers(current_user)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=headers)
        if resp.status_code != 200:
            raise ExternalServiceError("GitHub", resp.text)
        return resp.json()


@router.get("/repos/{owner}/{repo}/pulls")
async def list_pull_requests(
    owner: str, repo: str, state: str = "open", page: int = 1, per_page: int = 30,
    current_user: User = Depends(get_current_user),
):
    headers = _get_github_headers(current_user)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/pulls", headers=headers,
                                params={"state": state, "page": page, "per_page": per_page})
        if resp.status_code != 200:
            raise ExternalServiceError("GitHub", resp.text)
        return resp.json()


@router.get("/repos/{owner}/{repo}/pulls/{pull_number}")
async def get_pull_request(
    owner: str, repo: str, pull_number: int,
    current_user: User = Depends(get_current_user),
):
    headers = _get_github_headers(current_user)
    async with httpx.AsyncClient() as client:
        pr_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pull_number}", headers=headers)
        if pr_resp.status_code != 200:
            raise ExternalServiceError("GitHub", pr_resp.text)
        files_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pull_number}/files", headers=headers)
        pr_data = pr_resp.json()
        pr_data["files"] = files_resp.json() if files_resp.status_code == 200 else []
        return pr_data
