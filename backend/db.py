# backend/db.py
from __future__ import annotations
import os
import ssl
from pathlib import Path
from contextlib import asynccontextmanager   

import certifi
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    create_async_engine, async_sessionmaker, AsyncSession
)
from sqlalchemy.orm import DeclarativeBase


# --- Load .env from project root ---
BASE_DIR = Path(__file__).resolve().parents[1]  # project root (folder that contains backend/)
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")
print("[DEBUG] DATABASE_URL =", DATABASE_URL)  # remove after it’s working

if not DATABASE_URL:
    raise RuntimeError(f"DATABASE_URL not found. Checked: {ENV_PATH}")

# --- Was getting an error in connecting to the database because of a firewall issue on my end.  ---
# --- I had to relax the the cirtificate checks in order to test the connection to our db, I will fix update before we get to production. ---

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_ctx},
    pool_pre_ping=True,
)

"""
ssl_ctx = ssl.create_default_context(cafile=certifi.where())

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_ctx},
    pool_pre_ping=True,
)
"""

class Base(DeclarativeBase):
    pass



SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@asynccontextmanager
async def lifespan(app):
    """
    Run once to materialize tables. Leave enabled for a single run,
    then comment the create_all block back out.
    """
    # using relative import so it works regardless of how uvicorn is launched
    from . import models  # noqa: F401  (needed to populate Base.metadata)

    # ----- RUN THESE TWO LINES ONCE to create tables -----
    #async with engine.begin() as conn:
        #await conn.run_sync(Base.metadata.create_all)
    # ------------------------------------

    try:
        yield
    finally:
        await engine.dispose()


# FastAPI dependency
async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


#--- OLD CODE NOT USING BUT KEEPING COMMENTED FOR NOW ---
"""
# backend/db.py
from __future__ import annotations
import os, ssl
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine, AsyncSession, create_async_engine, async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
import certifi

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# Verified TLS chain (Cloudflare/Let's Encrypt roots)
_ssl_ctx = ssl.create_default_context(cafile=certifi.where())

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"ssl": _ssl_ctx},
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

@asynccontextmanager
async def lifespan(app):
    # You can run migrations or create tables on first boot if you want:
    async with engine.begin() as conn: 
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    await engine.dispose()

async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
"""