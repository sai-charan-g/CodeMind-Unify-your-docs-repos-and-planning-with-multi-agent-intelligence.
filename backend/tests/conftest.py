import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.session import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    # We use ASGITransport implicitly or provide transport=ASGITransport(app=app)
    async with AsyncClient(app=app, base_url="http://testserver") as test_client:
        yield test_client
        
    app.dependency_overrides.clear()

@pytest.fixture
def mock_gemini(mocker):
    return mocker.patch("app.api.v1.chat.chat_agent.arun", return_value={"output": "Mocked LLM response", "messages": []})

@pytest.fixture
def mock_github(mocker):
    return mocker.patch("app.services.github_service.GitHubService.get_user_repos", return_value=[{"id": 1, "name": "mock-repo", "full_name": "user/mock-repo"}])
