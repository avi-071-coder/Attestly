"""
ForgeAI — Fine-Tuning Jobs API Routes
Create, list, monitor, and cancel fine-tuning jobs. Tenant-isolated.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.schemas import User, Dataset, FineTuningJob, JobStatus, AuditLog
from app.models.dtos import CreateJobRequest, JobResponse, JobListResponse

router = APIRouter(prefix="/jobs", tags=["Fine-Tuning Jobs"])

SUPPORTED_MODELS = [
    {"id": "meta-llama/Llama-3.1-8B", "name": "Llama 3.1 8B", "provider": "Meta", "parameters": "8B", "min_vram_gb": 6},
    {"id": "meta-llama/Llama-3.1-70B", "name": "Llama 3.1 70B", "provider": "Meta", "parameters": "70B", "min_vram_gb": 40},
    {"id": "mistralai/Mistral-7B-v0.3", "name": "Mistral 7B v0.3", "provider": "Mistral AI", "parameters": "7B", "min_vram_gb": 6},
    {"id": "mistralai/Mixtral-8x7B-v0.1", "name": "Mixtral 8x7B", "provider": "Mistral AI", "parameters": "46.7B", "min_vram_gb": 32},
    {"id": "Qwen/Qwen2.5-7B", "name": "Qwen 2.5 7B", "provider": "Alibaba", "parameters": "7B", "min_vram_gb": 6},
    {"id": "Qwen/Qwen2.5-72B", "name": "Qwen 2.5 72B", "provider": "Alibaba", "parameters": "72B", "min_vram_gb": 40},
    {"id": "microsoft/Phi-3-mini-4k-instruct", "name": "Phi-3 Mini 4K", "provider": "Microsoft", "parameters": "3.8B", "min_vram_gb": 4},
    {"id": "microsoft/Phi-3.5-mini-instruct", "name": "Phi-3.5 Mini", "provider": "Microsoft", "parameters": "3.8B", "min_vram_gb": 4},
    {"id": "google/gemma-2-9b", "name": "Gemma 2 9B", "provider": "Google", "parameters": "9B", "min_vram_gb": 8},
    {"id": "google/gemma-2-27b", "name": "Gemma 2 27B", "provider": "Google", "parameters": "27B", "min_vram_gb": 20},
    {"id": "deepseek-ai/DeepSeek-V2-Lite", "name": "DeepSeek V2 Lite", "provider": "DeepSeek", "parameters": "16B", "min_vram_gb": 10},
    {"id": "tiiuae/falcon-7b", "name": "Falcon 7B", "provider": "TII", "parameters": "7B", "min_vram_gb": 6},
]

@router.get("/models")
async def list_available_models():
    """List all supported open-weight base models for fine-tuning."""
    return {"models": SUPPORTED_MODELS}

@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(data: CreateJobRequest, request: Request,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify dataset ownership
    result = await db.execute(select(Dataset).where(Dataset.id == data.dataset_id, Dataset.user_id == current_user.id))
    dataset = result.scalar_one_or_none()
    if not dataset: raise HTTPException(404, "Dataset not found")
    if not dataset.is_validated: raise HTTPException(400, "Dataset has validation errors")
    
    job = FineTuningJob(
        user_id=current_user.id, dataset_id=data.dataset_id, name=data.name,
        description=data.description, base_model=data.base_model, status=JobStatus.PENDING,
        lora_r=data.lora_r or settings.DEFAULT_LORA_R,
        lora_alpha=data.lora_alpha or settings.DEFAULT_LORA_ALPHA,
        lora_dropout=data.lora_dropout or settings.DEFAULT_LORA_DROPOUT,
        learning_rate=data.learning_rate or settings.DEFAULT_LEARNING_RATE,
        num_epochs=data.num_epochs or settings.DEFAULT_NUM_EPOCHS,
        batch_size=data.batch_size or settings.DEFAULT_BATCH_SIZE,
        max_seq_length=data.max_seq_length or settings.DEFAULT_MAX_SEQ_LENGTH,
        gradient_accumulation_steps=data.gradient_accumulation_steps or settings.DEFAULT_GRADIENT_ACCUMULATION_STEPS,
        use_4bit=data.use_4bit if data.use_4bit is not None else settings.USE_4BIT_QUANTIZATION,
        config=data.model_dump(exclude_none=True),
    )
    db.add(job); await db.flush()
    db.add(AuditLog(user_id=current_user.id, action="job.create", resource_type="job",
        resource_id=job.id, details={"model": data.base_model, "dataset": data.dataset_id},
        ip_address=request.client.host if request.client else None))
    
    # In production, dispatch to Celery worker here:
    # from app.workers.finetune_worker import run_finetune_job
    # task = run_finetune_job.delay(job.id)
    # job.celery_task_id = task.id
    # job.status = JobStatus.QUEUED
    
    return JobResponse.model_validate(job)

@router.get("/", response_model=JobListResponse)
async def list_jobs(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FineTuningJob).where(FineTuningJob.user_id == current_user.id).order_by(FineTuningJob.created_at.desc()))
    jobs = result.scalars().all()
    return JobListResponse(jobs=[JobResponse.model_validate(j) for j in jobs], total=len(jobs))

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FineTuningJob).where(FineTuningJob.id == job_id, FineTuningJob.user_id == current_user.id))
    job = result.scalar_one_or_none()
    if not job: raise HTTPException(404, "Job not found")
    return JobResponse.model_validate(job)

@router.post("/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(job_id: str, request: Request,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FineTuningJob).where(FineTuningJob.id == job_id, FineTuningJob.user_id == current_user.id))
    job = result.scalar_one_or_none()
    if not job: raise HTTPException(404, "Job not found")
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(400, f"Cannot cancel job in {job.status.value} state")
    job.status = JobStatus.CANCELLED; job.completed_at = datetime.now(timezone.utc)
    db.add(AuditLog(user_id=current_user.id, action="job.cancel", resource_type="job",
        resource_id=job.id, ip_address=request.client.host if request.client else None))
    return JobResponse.model_validate(job)
