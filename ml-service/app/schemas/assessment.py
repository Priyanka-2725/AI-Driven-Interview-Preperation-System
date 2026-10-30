from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- 1. Question Generation ---
class GenerateQuestionsRequest(BaseModel):
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    type: Optional[str] = None  # "coding" or "conceptual"
    count: int = Field(default=1, ge=1, le=25)
    generateVariations: bool = False

class TestCaseSchema(BaseModel):
    input: str
    expectedOutput: str
    isHidden: bool = False

class QuestionSchema(BaseModel):
    id: Optional[str] = None
    title: str
    slug: str
    topic: str
    difficulty: str
    type: str
    description: str
    questionText: Optional[str] = None
    starterCode: Optional[Dict[str, str]] = None
    testCases: Optional[List[TestCaseSchema]] = None
    referenceSolution: Optional[str] = None
    referenceAnswer: Optional[str] = None
    keyConcepts: Optional[List[str]] = None
    timeLimitSeconds: Optional[float] = 3.0

class GenerateQuestionsResponse(BaseModel):
    questions: List[QuestionSchema]

# --- 2. Code Evaluation ---
class EvaluateCodeRequest(BaseModel):
    code: str
    language: str = "python"
    testCases: List[TestCaseSchema]
    timeLimitSeconds: float = Field(default=3.0, ge=0.5, le=10.0)
    visibleOnly: bool = False

class TestCaseResultSchema(BaseModel):
    testIndex: int
    passed: bool
    runtimeMs: float
    input: Optional[str] = None
    expectedOutput: Optional[str] = None
    actualOutput: Optional[str] = None
    error: Optional[str] = None
    isHidden: bool = False

class EvaluateCodeResponse(BaseModel):
    allPassed: bool
    passRatio: float
    totalTests: int
    passedTests: int
    failedTests: int
    avgRuntimeMs: float
    results: List[TestCaseResultSchema]

# --- 3. Conceptual Answer Evaluation ---
class EvaluateAnswerRequest(BaseModel):
    questionText: str
    referenceAnswer: str
    keyConcepts: List[str]
    candidateAnswer: str

class EvaluateAnswerResponse(BaseModel):
    score: int
    semanticSimilarity: float
    conceptCoverage: float
    matchedConcepts: List[str]
    missingConcepts: List[str]
    wordCount: int
    feedback: str
    engine: str = "neural"  # "neural" or "fallback"

# --- 4. Scoring ---
class CodingMetrics(BaseModel):
    passRatio: float
    totalTests: int
    passedTests: int
    failedTests: int
    avgRuntimeMs: float

class ConceptualMetrics(BaseModel):
    semanticSimilarity: float
    conceptCoverage: float
    wordCount: int
    matchedConcepts: Optional[List[str]] = None
    missingConcepts: Optional[List[str]] = None

class ScoreRequest(BaseModel):
    type: str  # "coding" or "conceptual"
    difficulty: Optional[str] = "medium"
    codingResult: Optional[CodingMetrics] = None
    nlpResult: Optional[ConceptualMetrics] = None

class ScoreResponse(BaseModel):
    overallScore: int
    isSample: bool = False
    version: str = "1.0.0"
    type: str
    breakdown: Dict[str, float]
    feedback: str
