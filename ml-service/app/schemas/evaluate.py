from pydantic import BaseModel

class FluencyResult(BaseModel):
    score: float
    wpm: float

class ConfidenceResult(BaseModel):
    isSample: bool
    score: float

class EvaluateResponse(BaseModel):
    fluency: FluencyResult
    confidence: ConfidenceResult
