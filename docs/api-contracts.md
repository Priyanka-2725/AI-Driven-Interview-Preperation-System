# API Contracts

## System Limits & Evaluation Constraints

| Parameter | Enforced Value | Description |
|---|---|---|
| **Max Code Size** | `65,536 bytes` (64 KB) | Maximum submitted code payload size; requests exceeding this trigger `CODE_TOO_LARGE` (413). |
| **Max Answer Text Length** | `5,000 characters` | Maximum length for conceptual answers; requests exceeding trigger `ANSWER_TOO_LONG` (400). |
| **Submission Rate Limit** | `10 requests / minute` | Per-user rate limit on `POST /api/v1/submissions` to protect grading workers. |
| **Run Endpoint Rate Limit** | `20 requests / minute` | Per-user rate limit on `POST /api/v1/submissions/run` for non-graded test executions. |
| **Default Execution Timeout** | `3.0 seconds` | Default wall-clock execution time limit per test case. |
| **Max Execution Timeout** | `10.0 seconds` | Absolute ceiling for `timeLimitSeconds` on custom questions. |
| **Output Buffer Cap** | `10,240 bytes` (10 KB) | Stdout truncation limit per test case execution. |
| **Max Test Cases per Question** | `25 test cases` | Maximum allowed test cases per question (e.g. up to 5 visible, 20 hidden). |
| **Supported Language** | `python` (Python 3.10) | **Python-only in Week 3**. JavaScript execution is a documented stretch goal deferred to a later release with Node.js sandbox isolation as a stated prerequisite. |

---

## Standard Error Codes

### Backend Gateway Error Codes (`backend/src/config/constants.js`)
| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed Zod validation schema. |
| `EMAIL_ALREADY_REGISTERED` | 409 | Attempting to register an email that already exists. |
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect. |
| `MISSING_TOKEN` | 401 | Authorization header missing on protected route. |
| `INVALID_TOKEN` | 401 | Bearer token malformed or signature invalid. |
| `TOKEN_EXPIRED` | 401 | Access token expired. |
| `USER_NOT_FOUND` | 404 | User account does not exist. |
| `ROUTE_NOT_FOUND` | 404 | Requested URL path not mapped. |
| `ML_SERVICE_UNAVAILABLE` | 503 | ML Service failed healthcheck or connection refused. |
| `RATE_LIMIT_EXCEEDED` | 429 | Exceeded general gateway rate limits. |
| `INTERNAL_ERROR` | 500 | Unhandled server error. |
| `RECORDING_TOO_LARGE` | 413 | Audio file upload exceeds 25MB limit. |
| `RECORDING_TOO_LONG` | 400 | Audio duration exceeds 120s limit. |
| `UNSUPPORTED_AUDIO_FORMAT` | 422 | File is not valid webm/ogg. |
| `CONVERSION_FAILED` | 422 | ffmpeg conversion to 16kHz WAV failed. |
| `ANALYSIS_FAILED` | 500 | ML audio analysis pipeline returned error. |
| `RECORDING_NOT_FOUND` | 404 | Recording ID does not exist or belongs to another user. |
| `QUESTION_NOT_FOUND` | 404 | Question ID or slug does not exist. |
| `SUBMISSION_NOT_FOUND` | 404 | Submission ID does not exist or belongs to another user. |
| `ATTEMPT_NOT_FOUND` | 404 | Attempt ID does not exist or belongs to another user. |
| `CODE_TOO_LARGE` | 413 | Code payload exceeds 64KB limit. |
| `ANSWER_TOO_LONG` | 400 | Answer text exceeds 5,000 characters. |
| `UNSUPPORTED_LANGUAGE` | 422 | Requested language is not `python` (JS is deferred stretch goal). |
| `SUBMISSION_RATE_LIMIT_EXCEEDED` | 429 | Exceeded 10 submissions per minute. |
| `RUN_RATE_LIMIT_EXCEEDED` | 429 | Exceeded 20 runs per minute. |
| `SUBMISSION_NOT_RETRYABLE` | 400 | Submission status is `evaluated` and does not need retry. |
| `ATTEMPT_ALREADY_COMPLETED` | 400 | Attempt session has already been finalized. |
| `EXECUTION_TIMEOUT` | 422 | Code execution exceeded allotted timeLimitSeconds. |
| `EXECUTION_ERROR` | 422 | Code threw runtime exception or syntax error during evaluation. |

### ML Service Internal Error Codes (`ml-service/app/core/exceptions.py`)
| Code | HTTP Status | Meaning |
|---|---|---|
| `REQUEST_TIMEOUT` | 408 | Overall cumulative request-level execution exceeded timeout. *(Note: Individual test timeouts do NOT raise 408; they return HTTP 200 with `passed: false` and `error: "timeout"`).* |
| `INTERIM_RUNNER_DISABLED` | 503 | `ENABLE_INTERIM_RUNNER=false` on the server; code evaluation is rejected until Week 5 Docker Sandbox. |
| `CODE_EXECUTION_BLOCKED` | 422 | Security violation detected by AST denylist (prohibited imports: `os`, `subprocess`, `socket`, `ctypes`, `shutil`, `open`). |
| `OUTPUT_LIMIT_EXCEEDED` | 422 | Request-level payload exceeded processing limit. *(Note: Test stdout exceeding 10KB is truncated without failing the HTTP request).* |
| `INVALID_TEST_CASES` | 422 | Test cases list is empty or missing expected fields. |
| `NLP_EVALUATION_FAILED` | 500 | Sentence-BERT or spaCy pipeline execution error. |
| `QUESTION_GENERATION_FAILED` | 500 | Template variation or seed bank indexing error. |
| `UNSUPPORTED_LANGUAGE` | 422 | Non-Python execution requested. |

---

## Backend API Gateway (Port 5000)

### 1. `POST /api/v1/auth/register`
**Description:** Registers a new user account.
**Auth:** None
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-09-17T00:00:00.000Z"
    }
  },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```
*(Also sets `refreshToken` HTTP-only cookie)*

### 2. `POST /api/v1/auth/login`
**Description:** Authenticates a user.
**Auth:** None
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "accessToken": "jwt_string"
  },
  "meta": { "requestId": "uuid" }
}
```
*(Also sets `refreshToken` HTTP-only cookie)*

### 3. `POST /api/v1/auth/refresh`
**Description:** Rotates the refresh token and issues a new access token.
**Auth:** HTTP-only `refreshToken` Cookie
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "accessToken": "new_jwt_string" },
  "meta": { "requestId": "uuid" }
}
```

### 4. `POST /api/v1/auth/logout`
**Description:** Clears the refresh token cookie.
**Auth:** None (Cookie)
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "meta": { "requestId": "uuid" }
}
```

### 5. `GET /api/v1/auth/me`
**Description:** Returns the current authenticated user's profile.
**Auth:** Bearer Token (Access Token)
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com" },
  "meta": { "requestId": "uuid" }
}
```

### 6. `GET /api/v1/system/health`
**Description:** Verifies backend and database health.
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 123.45,
    "database": "connected",
    "version": "1.0.0"
  },
  "meta": { "requestId": "uuid" }
}
```

### 7. `GET /api/v1/system/ml-health`
**Description:** Proxies a health check to the internal ML service.
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backend": "online",
    "mlService": "online"
  },
  "meta": { "requestId": "uuid" }
}
```

### 8. `POST /api/v1/recordings` (Week 2)
**Description:** Uploads audio recording (`webm`/`ogg`), converts to 16kHz WAV, invokes ML evaluation, and returns created `Recording` document.
**Auth:** Bearer Token
**Request:** `multipart/form-data` with `audio` file (max 25MB, max 120s).
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "rec_id",
    "originalFilename": "recording.webm",
    "durationSeconds": 15.2,
    "status": "analyzed",
    "fluencyResult": { "score": 85, "wpm": 142.0, "fillerWordCount": 2 },
    "confidenceResult": { "isSample": true, "score": 72.0 }
  },
  "meta": { "requestId": "uuid" }
}
```

> [!NOTE]
> **Week 6 QA Item (Cold-Start Preloading)**:
> In cold-start scenarios, the initial audio evaluation can take up to ~60s due to JIT initialization and on-demand model/librosa feature loading. The frontend timeout (`180,000 ms` in `recordingService.ts`) and backend `ML_EVALUATE_TIMEOUT_MS` (`180,000 ms`) accommodate this, while warm executions complete in ~5s. In Week 6 QA, the Whisper model and feature extractors will be eagerly preloaded and warmed during ML service startup lifespan (`lifespan` in `app/main.py`) to reduce first-request latency.

### 9. `GET /api/v1/recordings` (Week 2)
**Description:** Returns paginated list of user's recordings (user-isolated).
**Auth:** Bearer Token

### 10. `GET /api/v1/recordings/:id` (Week 2)
**Description:** Returns single recording by ID (user-isolated).
**Auth:** Bearer Token

### 11. `DELETE /api/v1/recordings/:id` (Week 2)
**Description:** Deletes recording document and removes physical file from disk.
**Auth:** Bearer Token

---

### 12. `GET /api/v1/questions` (Week 3)
**Description:** Returns paginated list of questions matching filters.
**Auth:** Bearer Token
**Query Parameters:**
- `topic`: Optional (`arrays`, `trees`, `graphs`, `strings`, `system-design`, `javascript`, `python`, `databases`)
- `difficulty`: Optional (`easy`, `medium`, `hard`)
- `type`: Optional (`coding`, `conceptual`)
- `page`: Optional (default 1)
- `limit`: Optional (default 20)
**Security Note:** `referenceAnswer` and hidden test cases (`isHidden: true`) are strictly stripped from all returned questions.
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q_id",
        "title": "Two Sum",
        "slug": "two-sum",
        "topic": "arrays",
        "difficulty": "easy",
        "type": "coding",
        "description": "Find two numbers...",
        "starterCode": { "python": "import sys\n# Read from stdin, write to stdout\n..." },
        "testCases": [
          { "input": "2 7 11 15\n9", "expectedOutput": "0 1", "isHidden": false }
        ],
        "timeLimitSeconds": 3,
        "isCurated": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 15 }
  },
  "meta": { "requestId": "uuid" }
}
```

### 13. `GET /api/v1/questions/:id` (Week 3)
**Description:** Retrieves a single question by ID or slug. Strips `referenceAnswer` and hidden test cases.
**Auth:** Bearer Token

### 14. `POST /api/v1/questions/generate` (Week 3)
**Description:** Generates or selects a question variant based on requested topic and difficulty. Parameterized variations compute outputs via reference solution. Prevents duplicates using slug hash and persists with `isCurated: false`.
**Auth:** Bearer Token
**Request Body:**
```json
{
  "topic": "arrays",
  "difficulty": "medium",
  "type": "coding"
}
```
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "q_new_id",
      "title": "Two Sum (Variant)",
      "slug": "two-sum-variant-a8f1",
      "topic": "arrays",
      "difficulty": "medium",
      "type": "coding",
      "description": "...",
      "starterCode": { "python": "..." },
      "testCases": [{ "input": "...", "expectedOutput": "...", "isHidden": false }]
    }
  },
  "meta": { "requestId": "uuid" }
}
```

### 15. `POST /api/v1/submissions/run` (Week 3 - Non-Graded Run)
**Description:** Executes code against **visible test cases only**. 
- **ML Endpoint Reuse**: The backend reuses the ML Service endpoint `POST /api/v1/assessment/evaluate-code`. The backend fetches the question from MongoDB, filters test cases to visible only (`testCases.filter(t => !t.isHidden)`), and forwards only visible test cases to the ML service with `visibleOnly: true`.
- **Zero Data Leak**: Hidden test cases and expectations are never transmitted or evaluated in this flow.
- **No Graded Record**: Does NOT create a graded `Submission` record in MongoDB.
**Auth:** Bearer Token
**Rate Limit:** 20 requests per minute per user
**Request Body:**
```json
{
  "questionId": "q_id",
  "code": "import sys\n...",
  "language": "python"
}
```
*(Note: `language` must be `"python"`. JavaScript is a documented stretch goal).*
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "allPassed": true,
    "passRatio": 1.0,
    "totalTests": 2,
    "passedTests": 2,
    "failedTests": 0,
    "testResults": [
      {
        "testIndex": 0,
        "passed": true,
        "runtimeMs": 45.2,
        "input": "2 7 11 15\n9",
        "expected": "0 1",
        "actual": "0 1",
        "error": null,
        "isHidden": false
      }
    ]
  },
  "meta": { "requestId": "uuid" }
}
```

### 16. `POST /api/v1/submissions` (Week 3 - Graded Submit)
**Description:** Submits code or conceptual answer for grading. Persists `Submission`, evaluates against visible and hidden test cases / NLP semantic reference, embeds evaluation details, and updates status to `evaluated`. If ML service is offline, stores as `failed` with 503 status allowing retry.
**Auth:** Bearer Token
**Request Body (Coding):**
```json
{
  "questionId": "q_id",
  "attemptId": "attempt_id_optional",
  "type": "coding",
  "code": "import sys\nlines = sys.stdin.read().split()\n...",
  "language": "python"
}
```
**Request Body (Conceptual):**
```json
{
  "questionId": "q_id",
  "attemptId": "attempt_id_optional",
  "type": "conceptual",
  "answerText": "Database indexing uses balanced B-Trees to keep lookup times logarithmic O(log N)..."
}
```
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "sub_id",
      "questionId": "q_id",
      "attemptId": "attempt_id_optional",
      "type": "coding",
      "status": "evaluated",
      "evaluation": {
        "id": "eval_id",
        "overallScore": 100,
        "isSample": false,
        "version": "1.0.0",
        "type": "coding",
        "breakdown": {
          "testPassWeight": 80,
          "runtimeEfficiency": 20
        },
        "codingResult": {
          "allPassed": true,
          "passRatio": 1.0,
          "totalTests": 5,
          "passedTests": 5,
          "failedTests": 0,
          "testResults": [
            {
              "testIndex": 0,
              "passed": true,
              "runtimeMs": 42.1,
              "input": "2 7 11 15\n9",
              "expected": "0 1",
              "actual": "0 1",
              "isHidden": false
            },
            {
              "testIndex": 1,
              "passed": true,
              "runtimeMs": 38.0,
              "isHidden": true
            }
          ]
        },
        "feedback": "All 5 test cases passed successfully."
      }
    }
  },
  "meta": { "requestId": "uuid" }
}
```

### 17. `POST /api/v1/submissions/:id/retry` (Week 3)
**Description:** Retries evaluation for a `failed` or `pending` submission without requiring the candidate to resubmit code. Checks user ownership.
**Auth:** Bearer Token
**Success Response (200 OK):** Same schema as `POST /api/v1/submissions`.

### 18. `GET /api/v1/submissions` (Week 3)
**Description:** Returns paginated list of user's past submissions (user-isolated).
**Auth:** Bearer Token

### 19. `GET /api/v1/submissions/:id` (Week 3)
**Description:** Returns details of a specific submission and its embedded evaluation.
**Auth:** Bearer Token

### 20. `POST /api/v1/attempts` (Week 3)
**Description:** Starts a technical assessment attempt session.
**Auth:** Bearer Token
**Request Body:**
```json
{
  "topic": "arrays",
  "difficulty": "medium",
  "questionCount": 3
}
```
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "att_id",
      "title": "Technical Assessment - Arrays (Medium)",
      "topic": "arrays",
      "difficulty": "medium",
      "status": "in_progress",
      "questions": ["q1_id", "q2_id", "q3_id"],
      "createdAt": "..."
    }
  },
  "meta": { "requestId": "uuid" }
}
```

### 21. `GET /api/v1/attempts` (Week 3)
**Description:** Lists user's past attempts.
**Auth:** Bearer Token

### 22. `GET /api/v1/attempts/:id` (Week 3)
**Description:** Retrieves attempt details. Dynamically queries submissions via `Submission.find({ attemptId })` (no `submissions[]` array in `Attempt`). Calculates `compositeScore` treating unanswered questions as 0.
**Auth:** Bearer Token

---

## ML Service (Port 8000 - Internal)

### 1. `GET /health`
**Description:** Verifies ML service health.

### 2. `GET /api/v1/version`
**Description:** Returns Python and ML environment details.

### 3. `POST /api/v1/audio/features` (Week 1)
**Description:** Computes Week 1 metrics (RMS, Pitch, Silence gating).

### 4. `POST /api/v1/evaluate` (Week 2)
**Description:** Evaluates speech audio for fluency and mock confidence.

### 5. `POST /api/v1/assessment/generate-questions` (Week 3)
**Description:** Returns curated questions or parameterized variations from the local seed bank.
*(Note: Responses contain `referenceSolution` and hidden tests and are for internal backend consumption only, never to be forwarded to clients).*
**Request Body:**
```json
{
  "topic": "arrays",
  "difficulty": "medium",
  "type": "coding",
  "count": 1
}
```
**Success Response (200 OK):**
```json
{
  "questions": [
    {
      "title": "Two Sum",
      "slug": "two-sum",
      "topic": "arrays",
      "difficulty": "medium",
      "type": "coding",
      "description": "...",
      "starterCode": { "python": "..." },
      "testCases": [
        { "input": "2 7 11 15\n9", "expectedOutput": "0 1", "isHidden": false }
      ],
      "referenceSolution": "...",
      "timeLimitSeconds": 3
    }
  ]
}
```

### 6. `POST /api/v1/assessment/evaluate-code` (Week 3)
**Description:** Executes Python code against test cases using stdin/stdout protocol via `SubprocessCodeRunner`.
- **Dual Gateway Use**: This endpoint is reused by both `POST /api/v1/submissions/run` (sending only visible test cases with `visibleOnly: true`) and `POST /api/v1/submissions` (sending the full suite including hidden tests with `visibleOnly: false`). The ML service executes the supplied test array without DB side-effects; the backend controls test visibility and persistence.
- **Language**: `python` only in Week 3 (JavaScript execution is a documented stretch goal).
**Request Body:**
```json
{
  "code": "import sys\n...",
  "language": "python",
  "testCases": [
    { "input": "2 7 11 15\n9", "expectedOutput": "0 1", "isHidden": false }
  ],
  "timeLimitSeconds": 3.0,
  "visibleOnly": false
}
```
**Success Response (200 OK):**
```json
{
  "allPassed": false,
  "passRatio": 0.5,
  "totalTests": 2,
  "passedTests": 1,
  "failedTests": 1,
  "results": [
    {
      "testIndex": 0,
      "passed": true,
      "runtimeMs": 35.4,
      "input": "2 7 11 15\n9",
      "expectedOutput": "0 1",
      "actualOutput": "0 1",
      "error": null,
      "isHidden": false
    },
    {
      "testIndex": 1,
      "passed": false,
      "runtimeMs": 3000.0,
      "input": null,
      "expectedOutput": null,
      "actualOutput": null,
      "error": "timeout",
      "isHidden": true
    }
  ]
}
```
*(Security Note: For hidden test cases, `input`, `expectedOutput`, and `actualOutput` are redacted directly to `null` by the ML service to prevent candidate leakage. Individual test timeouts return `HTTP 200` with `passed: false` and `error: "timeout"`).*

### 7. `POST /api/v1/assessment/evaluate-answer` (Week 3)
**Description:** Evaluates conceptual candidate explanation against golden reference answer using Sentence-BERT and spaCy concept coverage.
**Request Body:**
```json
{
  "questionText": "Explain database indexing and B-Trees.",
  "referenceAnswer": "Database indexes use balanced B-Trees...",
  "keyConcepts": ["B-Tree", "lookup time", "O(log N)", "disk I/O"],
  "candidateAnswer": "A database index organizes data in a B-Tree structure to achieve O(log N) search times and reduce disk I/O operations."
}
```
**Success Response (200 OK):**
```json
{
  "score": 92,
  "semanticSimilarity": 94.2,
  "conceptCoverage": 100.0,
  "matchedConcepts": ["B-Tree", "lookup time", "O(log N)", "disk I/O"],
  "missingConcepts": [],
  "wordCount": 24,
  "feedback": "Strong answer covering all core indexing principles."
}
```

### 8. `POST /api/v1/assessment/score` (Week 3)
**Description:** Aggregates raw evaluation metrics into normalized 0–100 score, adhering to standard score schema.
**Request Body:**
```json
{
  "type": "coding",
  "difficulty": "medium",
  "codingResult": {
    "passRatio": 1.0,
    "totalTests": 5,
    "passedTests": 5,
    "failedTests": 0,
    "avgRuntimeMs": 40.0
  }
}
```
**Success Response (200 OK):**
```json
{
  "overallScore": 100,
  "isSample": false,
  "version": "1.0.0",
  "type": "coding",
  "breakdown": {
    "testPassScore": 80.0,
    "runtimeEfficiency": 20.0
  },
  "feedback": "All test cases passed efficiently."
}
```

