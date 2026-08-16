# CodeMind — Deployment Guide

This document outlines the step-by-step process for deploying the CodeMind application to production. The architecture consists of a Next.js frontend, a FastAPI backend, and several data services (PostgreSQL, Redis, ChromaDB).

## Architecture Overview

- **Frontend**: Next.js 15 (React), deployed on Vercel.
- **Backend**: FastAPI (Python), deployed on Render or Railway.
- **Database**: PostgreSQL (managed via Neon or Supabase).
- **Cache / Messaging**: Redis (managed via Upstash).
- **Vector Store**: ChromaDB (deployed on Render/Railway or managed cloud).

## 1. Environment Variables

Before deploying, ensure you have the following secrets ready.

### Backend (`.env`)
```env
APP_NAME=CodeMind
APP_ENV=production
DEBUG=false
BACKEND_CORS_ORIGINS=["https://codemind.vercel.app"]

DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
DATABASE_URL_SYNC=postgresql://user:pass@host/dbname
REDIS_URL=redis://default:pass@host:port

JWT_SECRET_KEY=generate-a-secure-random-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_REDIRECT_URI=https://your-api-domain.com/api/v1/auth/github/callback

GOOGLE_API_KEY=your-gemini-api-key
CHROMA_HOST=your-chromadb-host
CHROMA_PORT=8000
ENCRYPTION_KEY=your-fernet-key-for-github-tokens
```

### Frontend (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

## 2. Deploying Data Services

1. **PostgreSQL**: Create a project in [Neon](https://neon.tech). Copy the connection strings for `DATABASE_URL` (asyncpg) and `DATABASE_URL_SYNC`.
2. **Redis**: Create a serverless Redis database in [Upstash](https://upstash.com/). Copy the `REDIS_URL`.
3. **ChromaDB**: Deploy the official ChromaDB Docker image to a platform like Render or Railway. Expose port 8000 and configure persistent storage (volume).

## 3. Deploying the Backend (FastAPI)

We recommend using Render or Railway for Python backends.

1. Create a new Web Service and connect your GitHub repository.
2. Set the Root Directory to `backend`.
3. Set the Build Command:
   ```bash
   pip install -r requirements.txt
   alembic upgrade head
   ```
4. Set the Start Command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add all required backend environment variables.
6. Deploy the service.

## 4. Deploying the Frontend (Next.js)

We recommend Vercel for Next.js applications.

1. Go to Vercel and create a new project.
2. Import your GitHub repository.
3. Set the Framework Preset to Next.js.
4. Set the Root Directory to `frontend`.
5. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your deployed backend.
6. Click Deploy.

## 5. Post-Deployment Configuration

1. **GitHub OAuth**: Go to your GitHub Developer Settings. Update the OAuth app's Homepage URL and Authorization callback URL to match your production domain.
2. **CORS**: Ensure the backend `BACKEND_CORS_ORIGINS` accurately reflects your exact frontend production URL.
3. **Smoke Test**: 
   - Register a new account.
   - Connect GitHub.
   - Upload a knowledge base document to verify ChromaDB and Redis background processing.
   - Send a chat message to verify Gemini integration.

## Troubleshooting

- **Database Migration Errors**: Ensure the `DATABASE_URL_SYNC` is correct. Alembic requires the sync driver for migrations.
- **CORS Errors**: Double-check the exact domain name (no trailing slashes) in `BACKEND_CORS_ORIGINS`.
- **WebSocket / SSE Issues**: If using a proxy (like Nginx), ensure headers for chunked transfer encoding and WebSockets are passed correctly.
