from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.core.exceptions import (
    InterimRunnerDisabledException,
    InvalidTestCasesException
)
from app.schemas.assessment import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    EvaluateCodeRequest,
    EvaluateCodeResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    ScoreRequest,
    ScoreResponse
)
from app.features.question_bank import get_questions
from app.features.code_runner import SubprocessCodeRunner
from app.features.nlp_evaluator import evaluate_conceptual_answer
from app.features.technical_scorer import (
    score_coding_challenge,
    score_conceptual_answer
)

router = APIRouter()
runner = SubprocessCodeRunner()

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions_endpoint(payload: GenerateQuestionsRequest):
    questions = get_questions(
        topic=payload.topic,
        difficulty=payload.difficulty,
        type=payload.type,
        count=payload.count,
        generate_variations=payload.generateVariations
    )
    return GenerateQuestionsResponse(questions=questions)

from starlette.concurrency import run_in_threadpool

@router.post("/evaluate-code", response_model=EvaluateCodeResponse)
async def evaluate_code_endpoint(payload: EvaluateCodeRequest):
    # Condition D: Gate the runner behind ENABLE_INTERIM_RUNNER
    if not settings.ENABLE_INTERIM_RUNNER:
        raise InterimRunnerDisabledException()

    test_dicts = [t.model_dump() for t in payload.testCases]
    # Offload blocking subprocess execution to threadpool so event loop remains non-blocking
    result = await run_in_threadpool(
        runner.execute,
        code=payload.code,
        language=payload.language,
        test_cases=test_dicts,
        time_limit_seconds=payload.timeLimitSeconds,
        visible_only=payload.visibleOnly
    )
    return EvaluateCodeResponse(**result)

@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer_endpoint(payload: EvaluateAnswerRequest):
    # Offload CPU-bound SentenceTransformer & spaCy inference to threadpool
    result = await run_in_threadpool(
        evaluate_conceptual_answer,
        question_text=payload.questionText,
        reference_answer=payload.referenceAnswer,
        key_concepts=payload.keyConcepts,
        candidate_answer=payload.candidateAnswer
    )
    return EvaluateAnswerResponse(**result)

@router.post("/score", response_model=ScoreResponse)
async def score_endpoint(payload: ScoreRequest):
    if payload.type == "coding":
        if not payload.codingResult:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="codingResult is required when type is 'coding'"
            )
        cr = payload.codingResult
        scored = score_coding_challenge(
            pass_ratio=cr.passRatio,
            total_tests=cr.totalTests,
            passed_tests=cr.passedTests,
            avg_runtime_ms=cr.avgRuntimeMs
        )
        return ScoreResponse(**scored)

    elif payload.type == "conceptual":
        if not payload.nlpResult:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="nlpResult is required when type is 'conceptual'"
            )
        nr = payload.nlpResult
        scored = score_conceptual_answer(
            semantic_similarity=nr.semanticSimilarity,
            concept_coverage=nr.conceptCoverage,
            word_count=nr.wordCount,
            matched_concepts=nr.matchedConcepts or [],
            missing_concepts=nr.missingConcepts or []
        )
        return ScoreResponse(**scored)

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown assessment type '{payload.type}'"
        )
