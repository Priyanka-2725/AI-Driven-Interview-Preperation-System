from pydantic import BaseModel
from typing import Dict

class FluencyBreakdown(BaseModel):
    wpmPenalty: float
    fillerPenalty: float
    silencePenalty: float

class FluencyResult(BaseModel):
    score: int
    wpm: float
    fillerWordCount: int
    fillerWordBreakdown: Dict[str, int]
    silenceRatio: float
    breakdown: FluencyBreakdown

class ConfidenceResult(BaseModel):
    isSample: bool
    score: float
    eyeContactPercent: float
    headStability: str
    note: str

class EvaluateResponse(BaseModel):
    fluency: FluencyResult
    confidence: ConfidenceResult
