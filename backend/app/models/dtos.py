"""
ForgeAI — Pydantic Request/Response DTOs
Strict validation for all API inputs and outputs.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Auth DTOs ────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    username: str = Field(..., min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = None
    organization: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    organization: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dataset DTOs ────────────────────────────────────────────────

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    file_size: Optional[int]
    format: str
    num_samples: Optional[int]
    is_validated: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int


# ─── Fine-Tuning Job DTOs ───────────────────────────────────────

class CreateJobRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    dataset_id: str
    base_model: str = Field(..., min_length=1)  # e.g. "meta-llama/Llama-3.1-8B"
    
    # LoRA config (all optional — defaults from settings)
    lora_r: Optional[int] = Field(None, ge=4, le=128)
    lora_alpha: Optional[int] = Field(None, ge=4, le=256)
    lora_dropout: Optional[float] = Field(None, ge=0.0, le=0.5)
    learning_rate: Optional[float] = Field(None, ge=1e-6, le=1e-2)
    num_epochs: Optional[int] = Field(None, ge=1, le=100)
    batch_size: Optional[int] = Field(None, ge=1, le=64)
    max_seq_length: Optional[int] = Field(None, ge=64, le=8192)
    gradient_accumulation_steps: Optional[int] = Field(None, ge=1, le=64)
    use_4bit: Optional[bool] = True


class JobResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    base_model: str
    
    # Config
    lora_r: int
    lora_alpha: int
    learning_rate: float
    num_epochs: int
    batch_size: int
    use_4bit: bool
    
    # Progress
    current_epoch: int
    current_step: int
    total_steps: Optional[int]
    progress_percent: float
    training_loss: Optional[float]
    eval_loss: Optional[float]
    
    # Meta
    error_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int


# ─── Deployment DTOs ─────────────────────────────────────────────

class CreateDeploymentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    job_id: str
    serving_backend: Optional[str] = "ollama"
    max_concurrent_requests: Optional[int] = 10
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7


class DeploymentResponse(BaseModel):
    id: str
    name: str
    base_model: str
    serving_backend: str
    endpoint_url: Optional[str]
    is_active: bool
    total_requests: int
    total_tokens_in: int
    total_tokens_out: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── API Key DTOs ────────────────────────────────────────────────

class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class APIKeyCreatedResponse(BaseModel):
    """Returned only once on creation — contains the raw key."""
    id: str
    name: str
    key: str  # Raw key — shown only once
    key_prefix: str
    created_at: datetime


# ─── Inference DTOs ──────────────────────────────────────────────

class InferenceRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=32000)
    max_tokens: Optional[int] = Field(512, ge=1, le=8192)
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(0.9, ge=0.0, le=1.0)
    stream: Optional[bool] = False


class InferenceResponse(BaseModel):
    text: str
    model: str
    tokens_in: int
    tokens_out: int
    latency_ms: int


# ─── Usage / Billing DTOs ───────────────────────────────────────

class UsageSummary(BaseModel):
    total_tokens_in: int
    total_tokens_out: int
    total_requests: int
    total_training_jobs: int
    active_deployments: int


# ─── Model Registry DTOs ────────────────────────────────────────

class AvailableModel(BaseModel):
    id: str
    name: str
    provider: str
    parameters: str
    description: str
    supported_tasks: List[str]
    requires_gpu: bool
    min_vram_gb: float


class ModelListResponse(BaseModel):
    models: List[AvailableModel]
