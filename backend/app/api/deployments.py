"""
ForgeAI — Deployments & Inference API
Deploy fine-tuned models and run inference against them.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import time, httpx
from app.core.database import get_db
from app.core.security import get_current_user_from_api_key
from app.core.config import settings
from app.models.schemas import User, FineTuningJob, Deployment, JobStatus, UsageRecord, AuditLog
from app.models.dtos import CreateDeploymentRequest, DeploymentResponse, InferenceRequest, InferenceResponse

router = APIRouter(prefix="/deployments", tags=["Deployments"])

@router.post("/", response_model=DeploymentResponse, status_code=201)
async def create_deployment(data: CreateDeploymentRequest, request: Request,
    current_user: User = Depends(get_current_user_from_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FineTuningJob).where(
        FineTuningJob.id == data.job_id, FineTuningJob.user_id == current_user.id))
    job = result.scalar_one_or_none()
    if not job: raise HTTPException(404, "Job not found")
    if job.status != JobStatus.COMPLETED: raise HTTPException(400, "Job not completed")
    depl = Deployment(user_id=current_user.id, job_id=data.job_id, name=data.name,
        model_path=job.output_model_path or "", base_model=job.base_model,
        serving_backend=data.serving_backend, max_concurrent_requests=data.max_concurrent_requests,
        max_tokens=data.max_tokens, temperature=data.temperature, is_active=True,
        endpoint_url=f"/v1/deployments/{data.name}/inference")
    db.add(depl); await db.flush()
    db.add(AuditLog(user_id=current_user.id, action="deployment.create", resource_type="deployment",
        resource_id=depl.id, ip_address=request.client.host if request.client else None))
    return DeploymentResponse.model_validate(depl)

@router.get("/", response_model=list[DeploymentResponse])
async def list_deployments(current_user: User = Depends(get_current_user_from_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(Deployment.user_id == current_user.id))
    return [DeploymentResponse.model_validate(d) for d in result.scalars().all()]

@router.post("/{deployment_id}/inference", response_model=InferenceResponse)
async def run_inference(deployment_id: str, data: InferenceRequest,
    current_user: User = Depends(get_current_user_from_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(
        Deployment.id == deployment_id, Deployment.user_id == current_user.id))
    depl = result.scalar_one_or_none()
    if not depl: raise HTTPException(404, "Deployment not found")
    if not depl.is_active: raise HTTPException(400, "Deployment is not active")
    
    start = time.time()
    # Route to serving backend
    try:
        if depl.serving_backend == "ollama":
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": depl.base_model.split("/")[-1], "prompt": data.prompt,
                          "options": {"temperature": data.temperature, "num_predict": data.max_tokens}, "stream": False})
                resp.raise_for_status()
                result_data = resp.json()
                text = result_data.get("response", "")
        else:
            # vLLM / TGI OpenAI-compatible endpoint
            base = settings.VLLM_BASE_URL
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(f"{base}/v1/completions",
                    json={"model": depl.base_model, "prompt": data.prompt,
                          "max_tokens": data.max_tokens, "temperature": data.temperature})
                resp.raise_for_status()
                text = resp.json()["choices"][0]["text"]
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Model serving error: {str(e)}")
    
    latency = int((time.time() - start) * 1000)
    tokens_in = len(data.prompt.split()) # Rough estimate
    tokens_out = len(text.split())
    
    # Record usage
    usage = UsageRecord(user_id=current_user.id, deployment_id=depl.id,
        tokens_in=tokens_in, tokens_out=tokens_out, latency_ms=latency, model_name=depl.base_model)
    db.add(usage)
    depl.total_requests += 1; depl.total_tokens_in += tokens_in; depl.total_tokens_out += tokens_out
    
    return InferenceResponse(text=text, model=depl.base_model,
        tokens_in=tokens_in, tokens_out=tokens_out, latency_ms=latency)

@router.delete("/{deployment_id}", status_code=204)
async def delete_deployment(deployment_id: str,
    current_user: User = Depends(get_current_user_from_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(
        Deployment.id == deployment_id, Deployment.user_id == current_user.id))
    depl = result.scalar_one_or_none()
    if not depl: raise HTTPException(404, "Deployment not found")
    await db.delete(depl)
