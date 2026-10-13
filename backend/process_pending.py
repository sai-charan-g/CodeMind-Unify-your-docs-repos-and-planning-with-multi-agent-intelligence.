import asyncio
import sys
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))
from agents.rag.chunker import process_document
from app.db.session import async_session_factory
from sqlalchemy import select
from app.models.knowledge import KnowledgeDocument

async def main():
    async with async_session_factory() as db:
        res = await db.execute(select(KnowledgeDocument).where(KnowledgeDocument.status == 'pending'))
        docs = res.scalars().all()
        print(f'Found {len(docs)} pending docs')
        tasks = [process_document(str(d.id), d.storage_path, '.pdf') for d in docs]
        if tasks:
            await asyncio.gather(*tasks)
        print('Done')

if __name__ == '__main__':
    asyncio.run(main())
