# Database Schema

We are using MongoDB with Mongoose. The system organizes data into normalized, user-isolated collections.

---

## 1. `users` Collection

Stores authentication and profile information for candidates.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | MongoDB primary key. |
| `email` | String | Yes | Yes | Normalized user email. Validated via regex. |
| `password` | String | Yes | No | Bcrypt hashed password (salt rounds: 12). |
| `createdAt` | Date | Yes | No | Timestamp of account creation (default: `Date.now`). |
| `updatedAt` | Date | Yes | No | Timestamp of last document modification. |
| `__v` | Number | Yes | No | Mongoose document version key. |

### Indexes
- `email` (Unique, 1)

### Document Transformation
When serialized via `toJSON`, the `User` model automatically:
- Maps `_id` to `id` (String).
- Deletes `password`, `_id`, and `__v`.

---

## 2. `recordings` Collection (Week 2)

Stores audio recordings and fluency/confidence evaluation results.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary key. |
| `userId` | ObjectId | Yes | No | Foreign key ref to `User`. |
| `originalFilename` | String | Yes | No | Original client upload filename. |
| `storagePath` | String | Yes | No | Local filesystem path (`select: false`). |
| `durationSeconds` | Number | Yes | No | Duration of the audio clip. |
| `status` | String | Yes | No | `uploaded`, `processing`, `analyzed`, or `failed`. |
| `failureReason` | String | No | No | Error details if analysis failed. |
| `fluencyResult` | Mixed | No | No | Scored fluency payload. |
| `confidenceResult` | Mixed | No | No | Sample confidence payload. |
| `analyzedAt` | Date | No | No | Timestamp of ML evaluation. |
| `createdAt` / `updatedAt` | Date | Yes | No | Timestamps. |

### Indexes
- `userId` (1, `createdAt`: -1)

---

## 3. `questions` Collection (Week 3)

Stores technical interview questions (coding challenges and conceptual questions).

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary key. |
| `title` | String | Yes | No | Display title (e.g., "Two Sum", "Database Indexing"). |
| `slug` | String | Yes | Yes | URL-safe unique slug (e.g., "two-sum", "b-tree-indexing"). |
| `topic` | String | Yes | No | `arrays`, `trees`, `graphs`, `strings`, `system-design`, `javascript`, `python`, `databases`. |
| `difficulty` | String | Yes | No | `easy`, `medium`, or `hard`. |
| `type` | String | Yes | No | `coding` or `conceptual`. |
| `description` | String | Yes | No | Problem statement and instructions (Markdown). |
| `starterCode` | Object | No | No | Map of language to starter boilerplate: `{ python?: String }`. (JavaScript is a stretch goal). |
| `testCases` | Array | No | No | Array of test case objects: `[{ input: String, expectedOutput: String, isHidden: Boolean }]`. |
| `referenceAnswer` | String | No | No | Golden reference explanation for conceptual questions (`select: false`). |
| `keyConcepts` | [String] | No | No | Required concept phrases/keywords for NLP evaluation (e.g., `["B-Tree", "O(log N)"]`). |
| `timeLimitSeconds` | Number | Yes | No | Subprocess execution timeout in seconds (default: 3.0, max: 10.0). |
| `memoryLimitMb` | Number | Yes | No | Target memory constraint (default: 128). *Note: Informational metadata in Week 3; not enforced until Week 5 Docker Sandbox.* |
| `isCurated` | Boolean | Yes | No | `true` for seed bank questions, `false` for generated variants. |
| `createdAt` / `updatedAt` | Date | Yes | No | Timestamps. |

### Indexes
- `slug` (Unique, 1)
- `topic` (1, `difficulty`: 1, `type`: 1)

### Security & Sanitization Rules
- **`referenceAnswer`**: Marked `select: false` on the schema. Never loaded in standard queries and never returned by candidate-facing endpoints.
- **Hidden Test Cases**: Stored in MongoDB with `isHidden: true`. At serialization (`toJSON` / controller response formatting), any test case with `isHidden: true` is stripped or has `expectedOutput` redacted before transmission to the frontend.

---

## 4. `submissions` Collection (Week 3)

Records candidate code or conceptual answer submissions.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary key. |
| `userId` | ObjectId | Yes | No | Foreign key ref to `User`. |
| `questionId` | ObjectId | Yes | No | Foreign key ref to `Question`. |
| `attemptId` | ObjectId | No | No | Foreign key ref to `Attempt` (single source of truth for attempt sessions). |
| `type` | String | Yes | No | `coding` or `conceptual`. |
| `code` | String | No | No | Submitted source code (max 64 KB). |
| `language` | String | No | No | Programming language: `python` only in Week 3 (JS is a stretch goal). |
| `answerText` | String | No | No | Submitted explanation for conceptual questions (max 5,000 chars). |
| `status` | String | Yes | No | `pending`, `evaluating`, `evaluated`, or `failed`. |
| `evaluationId` | ObjectId | No | No | Foreign key ref to `Evaluation`. |
| `failureReason` | String | No | No | Error explanation if evaluation failed (enables retry). |
| `createdAt` / `updatedAt` | Date | Yes | No | Timestamps. |

### Indexes
- `userId` (1, `createdAt`: -1)
- `questionId` (1)
- `attemptId` (1)

---

## 5. `evaluations` Collection (Week 3)

Stores technical assessment evaluation results generated by the ML Service.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary key. |
| `submissionId` | ObjectId | Yes | Yes | Foreign key ref to `Submission` (one-to-one). |
| `userId` | ObjectId | Yes | No | Foreign key ref to `User` for ownership filtering. |
| `questionId` | ObjectId | Yes | No | Foreign key ref to `Question`. |
| `overallScore` | Number | Yes | No | Normalized 0–100 integer score. |
| `isSample` | Boolean | Yes | No | `false` (real ML/execution evaluation). |
| `version` | String | Yes | No | Evaluator version (e.g., `"1.0.0"`). |
| `type` | String | Yes | No | `coding` or `conceptual`. |
| `codingResult` | Object | No | No | Test execution summary (see below). |
| `nlpResult` | Object | No | No | NLP conceptual evaluation summary (see below). |
| `breakdown` | Object | Yes | No | Component scores and weights (see structure below). |
| `feedback` | String | Yes | No | Actionable summary feedback. |
| `evaluatedAt` | Date | Yes | No | Evaluation timestamp. |

#### `breakdown` Structure (Coding vs Conceptual)
For `type: "coding"`:
```json
{
  "testPassScore": 80.0,
  "runtimeEfficiency": 12.0
}
```
*Note on scoring logic: $S_{\text{runtime}}$ only counts when test cases pass, scaled strictly by $\text{passRatio} = \frac{\text{passedTests}}{\text{totalTests}}$. Python startup noise ($T_{\text{startup}} = 60\text{ ms}$) is subtracted before computing efficiency against $T_{\text{target}} = 500\text{ ms}$. If $\text{passedTests} = 0$, both $S_{\text{tests}}$ and $S_{\text{runtime}}$ are 0.0, yielding `overallScore = 0`.*

For `type: "conceptual"`:
```json
{
  "similarityScore": 51.8,
  "conceptScore": 35.0,
  "structureScore": 10.0
}
```
*Note on scoring logic: 55% Sentence-BERT cosine similarity, 35% spaCy concept graph coverage, 10% structural/length heuristic (0 for <15 words, 50 for 15-39 words, 100 for 40+ words).*

#### `codingResult` Structure
```json
{
  "allPassed": true,
  "passRatio": 1.0,
  "totalTests": 5,
  "passedTests": 5,
  "failedTests": 0,
  "testResults": [
    {
      "testIndex": 0,
      "passed": true,
      "runtimeMs": 42.5,
      "input": "2 7 11 15\n9",
      "expected": "0 1",
      "actual": "0 1",
      "isHidden": false
    }
  ]
}
```
*(Note: For hidden test cases, `input`, `expected`, and `actual` are omitted or redacted in candidate-facing views).*

#### `nlpResult` Structure
```json
{
  "semanticSimilarity": 88.5,
  "conceptCoverage": 83.3,
  "matchedConcepts": ["B-Tree", "logarithmic lookup", "disk I/O reduction"],
  "missingConcepts": ["page fill factor"],
  "wordCount": 142
}
```

---

## 6. `attempts` Collection (Week 3)

Represents a multi-question or single-topic technical assessment interview session.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary key. |
| `userId` | ObjectId | Yes | No | Foreign key ref to `User`. |
| `title` | String | Yes | No | Title of assessment session. |
| `topic` | String | Yes | No | Selected assessment topic. |
| `difficulty` | String | Yes | No | Selected difficulty level. |
| `status` | String | Yes | No | `in_progress`, `completed`, or `abandoned`. |
| `questions` | [ObjectId] | Yes | No | Array of `Question` ObjectIds assigned to this attempt. |
| `compositeScore` | Number | No | No | Aggregated score (0–100) calculated upon completion. |
| `completedAt` | Date | No | No | Timestamp of completion. |
| `createdAt` / `updatedAt` | Date | Yes | No | Timestamps. |

### Attempt-Submission Relationship (Single Source of Truth)
- `Attempt` **does NOT store a `submissions` array**.
- `Submission.attemptId` is the single source of truth.
- An attempt's submissions are derived dynamically via query: `Submission.find({ attemptId: attempt._id })`.

### Composite Score Calculation Rule
When an attempt is finalized (or queried when complete):
1. For each assigned question $q_i \in \text{questions}$:
   - Find the latest evaluated submission for that question within this attempt.
   - If a valid submission exists with an `overallScore`, score for $q_i$ is that score.
   - **If no evaluated submission exists for $q_i$ (unanswered question), its score is strictly `0`**.
2. The `compositeScore` is the arithmetic mean across all assigned questions:
   $$\text{compositeScore} = \text{round}\left(\frac{\sum_{i=1}^{N} \text{score}(q_i)}{N}\right)$$
   where $N = \text{questions.length}$.
