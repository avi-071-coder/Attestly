"""
ATTESTLY — Public Benchmark Leaderboard API
Compares open-weight base models (Llama, Mistral, Qwen, Phi, Gemma) on standard domain benchmarks:
- MMLU (General Reasoning)
- GSM8K (Math Reasoning)
- HumanEval (Code Generation)
- LegalBench (Legal Domain Tasks)
- BioMMLU (Medical & Healthcare Tasks)
Fast, static/database driven endpoint requiring ZERO authentication!
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.schemas import ModelBenchmark

router = APIRouter(prefix="/leaderboard", tags=["Benchmark Leaderboard"])

class BenchmarkModelResponse(BaseModel):
    id: str
    model_name: str
    provider: str
    parameters: str
    context_window: str
    mmlu: float
    gsm8k: float
    humaneval: float
    legalbench: float
    biommlu: float
    overall_score: float

# Initial seed benchmarks for open-weight models
DEFAULT_BENCHMARKS = [
    {
        "id": "llama-3.1-70b",
        "model_name": "Llama 3.1 70B Instruct",
        "provider": "Meta AI",
        "parameters": "70B",
        "context_window": "128k",
        "mmlu": 86.0,
        "gsm8k": 93.4,
        "humaneval": 80.5,
        "legalbench": 87.2,
        "biommlu": 84.1,
        "overall_score": 86.2
    },
    {
        "id": "qwen-2.5-72b",
        "model_name": "Qwen 2.5 72B Instruct",
        "provider": "Alibaba",
        "parameters": "72B",
        "context_window": "128k",
        "mmlu": 86.2,
        "gsm8k": 95.1,
        "humaneval": 86.6,
        "legalbench": 85.0,
        "biommlu": 83.5,
        "overall_score": 87.3
    },
    {
        "id": "mistral-large-2",
        "model_name": "Mistral Large 2 (123B)",
        "provider": "Mistral AI",
        "parameters": "123B",
        "context_window": "128k",
        "mmlu": 84.0,
        "gsm8k": 91.2,
        "humaneval": 92.0,
        "legalbench": 84.8,
        "biommlu": 82.0,
        "overall_score": 86.8
    },
    {
        "id": "gemma-2-27b",
        "model_name": "Gemma 2 27B",
        "provider": "Google",
        "parameters": "27B",
        "context_window": "8k",
        "mmlu": 75.2,
        "gsm8k": 78.4,
        "humaneval": 61.6,
        "legalbench": 76.5,
        "biommlu": 74.0,
        "overall_score": 73.1
    },
    {
        "id": "llama-3.1-8b",
        "model_name": "Llama 3.1 8B Instruct",
        "provider": "Meta AI",
        "parameters": "8B",
        "context_window": "128k",
        "mmlu": 69.4,
        "gsm8k": 84.5,
        "humaneval": 72.6,
        "legalbench": 71.0,
        "biommlu": 68.2,
        "overall_score": 73.1
    },
    {
        "id": "qwen-2.5-7b",
        "model_name": "Qwen 2.5 7B Instruct",
        "provider": "Alibaba",
        "parameters": "7B",
        "context_window": "128k",
        "mmlu": 74.2,
        "gsm8k": 83.1,
        "humaneval": 79.9,
        "legalbench": 73.4,
        "biommlu": 71.8,
        "overall_score": 76.5
    },
    {
        "id": "mistral-7b-v0.3",
        "model_name": "Mistral 7B Instruct v0.3",
        "provider": "Mistral AI",
        "parameters": "7B",
        "context_window": "32k",
        "mmlu": 65.5,
        "gsm8k": 62.0,
        "humaneval": 46.3,
        "legalbench": 69.0,
        "biommlu": 64.2,
        "overall_score": 61.4
    },
    {
        "id": "phi-3.5-mini",
        "model_name": "Phi-3.5 Mini Instruct",
        "provider": "Microsoft",
        "parameters": "3.8B",
        "context_window": "128k",
        "mmlu": 69.0,
        "gsm8k": 83.8,
        "humaneval": 73.8,
        "legalbench": 67.5,
        "biommlu": 66.0,
        "overall_score": 72.0
    }
]

@router.get("", response_model=dict)
async def get_leaderboard(
    category: Optional[str] = Query(None, description="Filter by param size, e.g., '<10B', '>10B'"),
    sort_by: Optional[str] = Query("overall_score", description="Column to sort by"),
    db: AsyncSession = Depends(get_db)
):
    """
    Public Endpoint: Get benchmark scores for base open-weight models.
    Supports filtering and sorting. Zero authentication required.
    """
    benchmarks = list(DEFAULT_BENCHMARKS)

    if category == "<10B":
        benchmarks = [b for b in benchmarks if "7B" in b["parameters"] or "8B" in b["parameters"] or "3.8B" in b["parameters"]]
    elif category == ">10B":
        benchmarks = [b for b in benchmarks if "70B" in b["parameters"] or "72B" in b["parameters"] or "123B" in b["parameters"] or "27B" in b["parameters"]]

    # Sort
    valid_cols = ["overall_score", "mmlu", "gsm8k", "humaneval", "legalbench", "biommlu"]
    sort_key = sort_by if sort_by in valid_cols else "overall_score"
    benchmarks.sort(key=lambda x: x.get(sort_key, 0), reverse=True)

    return {
        "benchmarks": benchmarks,
        "total": len(benchmarks),
        "last_updated": "2026-08-01"
    }
