from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    init_db()
    yield
    # Shutdown logic (if any)

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to AI Cloud Governance API"}
