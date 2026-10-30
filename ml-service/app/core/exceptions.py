from fastapi import HTTPException, status

class MLServiceException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message}
        )

class InterimRunnerDisabledException(MLServiceException):
    def __init__(self, message: str = "Interim code runner is disabled. Gated behind ENABLE_INTERIM_RUNNER=true."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="INTERIM_RUNNER_DISABLED",
            message=message
        )

class CodeExecutionBlockedException(MLServiceException):
    def __init__(self, message: str = "Code execution blocked by security denylist filter."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="CODE_EXECUTION_BLOCKED",
            message=message
        )

class OutputLimitExceededException(MLServiceException):
    def __init__(self, message: str = "Output limit exceeded (max 10,240 bytes)."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="OUTPUT_LIMIT_EXCEEDED",
            message=message
        )

class InvalidTestCasesException(MLServiceException):
    def __init__(self, message: str = "Test cases cannot be empty and must provide valid test case specifications."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_TEST_CASES",
            message=message
        )

class UnsupportedLanguageException(MLServiceException):
    def __init__(self, language: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="UNSUPPORTED_LANGUAGE",
            message=f"Unsupported programming language '{language}'. Week 3 supports 'python' only."
        )

class RequestTimeoutException(MLServiceException):
    def __init__(self, message: str = "Request-level execution timeout exceeded."):
        super().__init__(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            code="REQUEST_TIMEOUT",
            message=message
        )

class NLPEvaluationException(MLServiceException):
    def __init__(self, message: str = "NLP evaluation pipeline failed."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="NLP_EVALUATION_FAILED",
            message=message
        )

class QuestionGenerationException(MLServiceException):
    def __init__(self, message: str = "Question generation pipeline failed."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="QUESTION_GENERATION_FAILED",
            message=message
        )
