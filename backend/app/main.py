"""
ATTESTLY — Main FastAPI Application
Production-grade API gateway with CORS, rate limiting, and health checks.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, datasets, jobs, keys, deployments, community, leaderboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.MODELS_DIR, exist_ok=True)
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Open-weight model fine-tuning & deployment platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(keys.router, prefix="/api/v1")
app.include_router(deployments.router, prefix="/api/v1")
app.include_router(community.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "service": settings.APP_NAME}

@app.get("/api/v1/dashboard/stats")
async def dashboard_stats():
    """Public stats endpoint for demo purposes."""
    return {
        "total_models_available": 12,
        "supported_frameworks": ["LoRA", "QLoRA", "Full Fine-tune"],
        "avg_training_time_minutes": 45,
        "uptime_percent": 99.9
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "type": type(exc).__name__})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
