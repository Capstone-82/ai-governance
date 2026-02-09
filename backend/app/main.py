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

@app.middleware("http")
async def add_streaming_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Accel-Buffering"] = "no"
    return response

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
        "https://ai-governance-liart.vercel.app",
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to AI Cloud Governance API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
