"""
ForgeAI — API Keys Routes
Create, list, revoke API keys. Keys are shown only once on creation.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user, generate_api_key
from app.models.schemas import User, APIKey, AuditLog
from app.models.dtos import CreateAPIKeyRequest, APIKeyResponse, APIKeyCreatedResponse

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.post("/", response_model=APIKeyCreatedResponse, status_code=201)
async def create_api_key(data: CreateAPIKeyRequest, request: Request,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    raw_key, hashed_key = generate_api_key()
    api_key = APIKey(user_id=current_user.id, name=data.name, key_hash=hashed_key, key_prefix=raw_key[:12])
    db.add(api_key); await db.flush()
    db.add(AuditLog(user_id=current_user.id, action="apikey.create", resource_type="apikey",
        resource_id=api_key.id, ip_address=request.client.host if request.client else None))
    return APIKeyCreatedResponse(id=api_key.id, name=api_key.name, key=raw_key,
        key_prefix=api_key.key_prefix, created_at=api_key.created_at)

@router.get("/", response_model=list[APIKeyResponse])
async def list_api_keys(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc()))
    return [APIKeyResponse.model_validate(k) for k in result.scalars().all()]

@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(key_id: str, request: Request,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id, APIKey.user_id == current_user.id))
    key = result.scalar_one_or_none()
    if not key: raise HTTPException(404, "API key not found")
    key.is_active = False
    db.add(AuditLog(user_id=current_user.id, action="apikey.revoke", resource_type="apikey",
        resource_id=key.id, ip_address=request.client.host if request.client else None))
