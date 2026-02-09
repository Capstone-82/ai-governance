from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    init_db()
    yield
    # Shutdown logic (if any)

from app.core.guardrail_middleware import BedrockGuardrailMiddleware

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Add Guardrail Middleware
# This runs BEFORE CORS, which is ok for blocking malicious content
app.add_middleware(
    BedrockGuardrailMiddleware,
    guardrail_id=settings.AWS_BEDROCK_GUARDRAIL_ID,
    guardrail_version=settings.AWS_BEDROCK_GUARDRAIL_VERSION
)

# Configure CORS - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
        "*",  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to AI Cloud Governance API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
