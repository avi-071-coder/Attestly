"""
ForgeAI — Security & Authentication
JWT token creation/verification, password hashing, API key generation.
Tenant isolation is enforced at the service layer — every query is scoped to the authenticated user's ID.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer()


# ─── Password Hashing ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─── JWT Tokens ────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── API Key Generation ───────────────────────────────────────────

def generate_api_key() -> tuple[str, str]:
    """
    Generate a new API key. Returns (raw_key, hashed_key).
    The raw key is shown to the user once; only the hash is stored.
    """
    raw_key = f"fai_{secrets.token_urlsafe(48)}"
    hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, hashed_key


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


# ─── FastAPI Dependencies ─────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Extracts and validates the current user from a Bearer JWT token."""
    from app.models.schemas import User  # Lazy import to avoid circular dependency
    
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return user


async def get_current_user_from_api_key(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates a request using either a JWT token or an API key.
    API keys are prefixed with 'fai_' to distinguish them from JWTs.
    """
    from app.models.schemas import User, APIKey
    
    token = credentials.credentials
    
    # Check if it's an API key
    if token.startswith("fai_"):
        hashed = hash_api_key(token)
        result = await db.execute(select(APIKey).where(APIKey.key_hash == hashed, APIKey.is_active == True))
        api_key = result.scalar_one_or_none()
        if api_key is None:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        result = await db.execute(select(User).where(User.id == api_key.user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or disabled")
        return user
    
    # Otherwise treat as JWT
    return await get_current_user(credentials, db)
