# 🚀 CodeMind — Multi-Agent Engineering Workspace

> A production-ready multi-agent AI engineering workspace that helps software developers understand codebases, review pull requests, search technical documentation using RAG, and plan complex tasks.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat&logo=langchain&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## Architecture

```
Frontend (Next.js 15) ──→ FastAPI Backend ──→ LangGraph Agents ──→ Gemini 2.5 Flash
                                │                    │
                                ▼                    ▼
                          PostgreSQL             ChromaDB
                            (Neon)           (Vector Store)
```

## Features (V1)

- **🧠 Planner Agent** — Decomposes complex requests into executable subtasks
- **📚 RAG Agent** — Searches uploaded documents with citations
- **🐙 GitHub Agent** — Analyzes repositories and pull requests
- **💬 Real-time Streaming** — Token-by-token AI responses via SSE
- **🔐 Authentication** — JWT + GitHub OAuth
- **📊 Dashboard** — Stats, recent activity, quick actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| AI | LangGraph, LangChain, Google Gemini 2.5 Flash |
| Vector DB | ChromaDB |
| Database | PostgreSQL (Neon) |
| Cache | Redis (Upstash) |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- Google Gemini API key

### 1. Clone and configure
```bash
git clone https://github.com/yourusername/codemind.git
cd codemind
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start infrastructure
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Project Structure

```
codemind/
├── frontend/          Next.js 15 App
├── backend/           FastAPI Backend
│   ├── app/
│   │   ├── api/v1/    REST endpoints
│   │   ├── core/      Config, security, exceptions
│   │   ├── models/    SQLAlchemy ORM models
│   │   ├── schemas/   Pydantic schemas
│   │   └── db/        Database session
│   └── alembic/       Migrations
├── agents/            LangGraph Agents
│   ├── core/          Supervisor, state, graph
│   ├── planner/       Task decomposition
│   ├── rag/           Document retrieval
│   └── github/        Repo analysis
└── docker/            Docker Compose configs
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register |
| `/api/v1/auth/login` | POST | Login (JWT) |
| `/api/v1/auth/github/callback` | GET | GitHub OAuth |
| `/api/v1/chat/conversations` | POST/GET | Manage chats |
| `/api/v1/chat/conversations/{id}/messages` | POST | Send message (SSE) |
| `/api/v1/knowledge/documents/upload` | POST | Upload docs |
| `/api/v1/github/repos` | GET | List repos |
| `/api/v1/projects/` | CRUD | Manage projects |

## License

MIT
