"""
ForgeAI — Dataset API Routes
Upload, list, validate, and delete datasets. Tenant-isolated.
"""
import os, json, csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.schemas import User, Dataset, DatasetFormat, AuditLog
from app.models.dtos import DatasetResponse, DatasetListResponse

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def _detect_format(filename: str) -> DatasetFormat:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    m = {"jsonl": DatasetFormat.JSONL, "csv": DatasetFormat.CSV, "parquet": DatasetFormat.PARQUET}
    if ext not in m:
        raise HTTPException(400, f"Unsupported: .{ext}")
    return m[ext]

@router.post("/upload", response_model=DatasetResponse, status_code=201)
async def upload_dataset(request: Request, file: UploadFile = File(...), name: str = Form(...),
    description: str = Form(None), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    fmt = _detect_format(file.filename or "data.jsonl")
    content = await file.read()
    if len(content) == 0: raise HTTPException(400, "Empty file")
    if len(content) > 500*1024*1024: raise HTTPException(400, "Max 500MB")
    num_samples, schema_info, errors = 0, [], []
    if fmt == DatasetFormat.JSONL:
        lines = content.decode("utf-8", errors="replace").strip().split("\n")
        for i, line in enumerate(lines):
            line = line.strip()
            if not line: continue
            try:
                obj = json.loads(line)
                if isinstance(obj, dict): schema_info = list(set(schema_info) | set(obj.keys())); num_samples += 1
                else: errors.append(f"Line {i+1}: not object")
            except: errors.append(f"Line {i+1}: bad JSON")
    elif fmt == DatasetFormat.CSV:
        reader = csv.reader(StringIO(content.decode("utf-8", errors="replace")))
        for i, row in enumerate(reader):
            if i == 0: schema_info = row; continue
            num_samples += 1
    dataset = Dataset(user_id=current_user.id, name=name, description=description, file_path="",
        file_size=len(content), format=fmt, num_samples=num_samples, schema_info={"columns": schema_info},
        is_validated=len(errors)==0, validation_errors=errors[:20] if errors else None)
    db.add(dataset); await db.flush()
    user_dir = os.path.join(settings.UPLOAD_DIR, current_user.id, dataset.id)
    os.makedirs(user_dir, exist_ok=True)
    fp = os.path.join(user_dir, file.filename or "data")
    with open(fp, "wb") as f: f.write(content)
    dataset.file_path = fp
    db.add(AuditLog(user_id=current_user.id, action="dataset.upload", resource_type="dataset",
        resource_id=dataset.id, details={"name": name, "size": len(content)},
        ip_address=request.client.host if request.client else None))
    return DatasetResponse.model_validate(dataset)

@router.get("/", response_model=DatasetListResponse)
async def list_datasets(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc()))
    ds = result.scalars().all()
    return DatasetListResponse(datasets=[DatasetResponse.model_validate(d) for d in ds], total=len(ds))

@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    d = result.scalar_one_or_none()
    if not d: raise HTTPException(404, "Dataset not found")
    return DatasetResponse.model_validate(d)

@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(dataset_id: str, request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    d = result.scalar_one_or_none()
    if not d: raise HTTPException(404, "Dataset not found")
    if d.file_path and os.path.exists(d.file_path): os.remove(d.file_path)
    db.add(AuditLog(user_id=current_user.id, action="dataset.delete", resource_type="dataset",
        resource_id=d.id, ip_address=request.client.host if request.client else None))
    await db.delete(d)
