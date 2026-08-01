"""
ForgeAI — Core Configuration
Centralized settings using pydantic-settings for type-safe environment variable parsing.
All secrets are loaded from .env file or environment variables — never hardcoded.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # ─── Application ───────────────────────────────────────────────
    APP_NAME: str = "ATTESTLY"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ─── Database ──────────────────────────────────────────────────
    # SQLite for local dev; swap to PostgreSQL connection string for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./attestly.db"

    # ─── Auth / JWT ────────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_urlsafe(64)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ─── Redis (Celery broker) ─────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # ─── MinIO / Object Storage ────────────────────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_DATASETS: str = "datasets"
    MINIO_BUCKET_MODELS: str = "models"

    # ─── Hugging Face ──────────────────────────────────────────────
    HF_TOKEN: Optional[str] = None
    HF_CACHE_DIR: str = "./hf_cache"

    # ─── Model Serving ─────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    VLLM_BASE_URL: str = "http://localhost:8001"
    DEFAULT_SERVING_BACKEND: str = "ollama"  # "ollama" | "vllm" | "tgi"

    # ─── Fine-Tuning Defaults ──────────────────────────────────────
    DEFAULT_LORA_R: int = 16
    DEFAULT_LORA_ALPHA: int = 32
    DEFAULT_LORA_DROPOUT: float = 0.05
    DEFAULT_LEARNING_RATE: float = 2e-4
    DEFAULT_NUM_EPOCHS: int = 3
    DEFAULT_BATCH_SIZE: int = 4
    DEFAULT_MAX_SEQ_LENGTH: int = 512
    DEFAULT_GRADIENT_ACCUMULATION_STEPS: int = 4
    USE_4BIT_QUANTIZATION: bool = True  # QLoRA by default

    # ─── Storage Paths ─────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MODELS_DIR: str = "./trained_models"

    # ─── Rate Limiting ─────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ─── CORS ──────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
