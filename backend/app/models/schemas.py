"""
ForgeAI — SQLAlchemy ORM Models
All database tables with tenant isolation enforced via user_id foreign keys.
Every model links back to the owning user — no cross-tenant data leakage is possible.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    ForeignKey, Enum, JSON, BigInteger
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


# ─── Enums ─────────────────────────────────────────────────────────

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    DOWNLOADING_MODEL = "downloading_model"
    PREPARING_DATA = "preparing_data"
    TRAINING = "training"
    SAVING_MODEL = "saving_model"
    DEPLOYING = "deploying"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DatasetFormat(str, enum.Enum):
    JSONL = "jsonl"
    CSV = "csv"
    PARQUET = "parquet"
    HF_DATASET = "hf_dataset"


class ServingBackend(str, enum.Enum):
    OLLAMA = "ollama"
    VLLM = "vllm"
    TGI = "tgi"


# ─── User ──────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    jobs = relationship("FineTuningJob", back_populates="owner", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="owner", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="user", cascade="all, delete-orphan")


# ─── Dataset ──────────────────────────────────────────────────────

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)  # Path in object storage
    file_size = Column(BigInteger, nullable=True)  # Bytes
    format = Column(Enum(DatasetFormat), nullable=False)
    num_samples = Column(Integer, nullable=True)
    schema_info = Column(JSON, nullable=True)  # Column names, types, sample data
    is_validated = Column(Boolean, default=False)
    validation_errors = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    owner = relationship("User", back_populates="datasets")
    jobs = relationship("FineTuningJob", back_populates="dataset")


# ─── Fine-Tuning Job ─────────────────────────────────────────────

class FineTuningJob(Base):
    __tablename__ = "finetuning_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(String, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    
    # Job identity
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True)
    
    # Base model
    base_model = Column(String(255), nullable=False)  # e.g., "meta-llama/Llama-3-8B"
    base_model_source = Column(String(50), default="huggingface")  # "huggingface" | "local" | "ollama"
    
    # LoRA / QLoRA Config
    config = Column(JSON, nullable=False, default=dict)  # Full training config
    lora_r = Column(Integer, default=16)
    lora_alpha = Column(Integer, default=32)
    lora_dropout = Column(Float, default=0.05)
    learning_rate = Column(Float, default=2e-4)
    num_epochs = Column(Integer, default=3)
    batch_size = Column(Integer, default=4)
    max_seq_length = Column(Integer, default=512)
    gradient_accumulation_steps = Column(Integer, default=4)
    use_4bit = Column(Boolean, default=True)
    
    # Progress tracking
    current_epoch = Column(Integer, default=0)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, nullable=True)
    training_loss = Column(Float, nullable=True)
    eval_loss = Column(Float, nullable=True)
    progress_percent = Column(Float, default=0.0)
    
    # Output
    output_model_path = Column(String(500), nullable=True)
    celery_task_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
    
    # Public Community Sharing
    is_public = Column(Boolean, default=False, index=True)
    public_title = Column(String(255), nullable=True)
    public_description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    public_usage_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utcnow)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="jobs")
    dataset = relationship("Dataset", back_populates="jobs")
    deployment = relationship("Deployment", back_populates="job", uselist=False)


# ─── Deployment (Model Endpoint) ──────────────────────────────────

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("finetuning_jobs.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(255), nullable=False)
    model_path = Column(String(500), nullable=False)
    base_model = Column(String(255), nullable=False)
    serving_backend = Column(Enum(ServingBackend), default=ServingBackend.OLLAMA)
    endpoint_url = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    
    # Resource config
    max_concurrent_requests = Column(Integer, default=10)
    max_tokens = Column(Integer, default=2048)
    temperature = Column(Float, default=0.7)
    
    # Stats
    total_requests = Column(BigInteger, default=0)
    total_tokens_in = Column(BigInteger, default=0)
    total_tokens_out = Column(BigInteger, default=0)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    owner = relationship("User", back_populates="deployments")
    job = relationship("FineTuningJob", back_populates="deployment")


# ─── API Key ──────────────────────────────────────────────────────

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA-256
    key_prefix = Column(String(12), nullable=False)  # First 12 chars for identification
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    owner = relationship("User", back_populates="api_keys")


# ─── Usage Record (Metering) ─────────────────────────────────────

class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="SET NULL"), nullable=True)
    
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    model_name = Column(String(255), nullable=True)
    
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)


# ─── Audit Log (Immutable) ───────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")


# ─── Model Benchmark (Public Leaderboard) ─────────────────────────

class ModelBenchmark(Base):
    __tablename__ = "model_benchmarks"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_name = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)
    parameters = Column(String(50), nullable=False)
    context_window = Column(String(50), nullable=False)
    
    # Standard Benchmark Scores (0.0 to 100.0)
    mmlu = Column(Float, nullable=False)
    gsm8k = Column(Float, nullable=False)
    humaneval = Column(Float, nullable=False)
    legalbench = Column(Float, nullable=False)
    biommlu = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)

    updated_at = Column(DateTime(timezone=True), default=utcnow)

