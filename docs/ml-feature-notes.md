# ML Feature Extraction Notes

## 1. Acoustic Features
Acoustic feature extraction relies heavily on `librosa` to analyze raw audio arrays. Following ADR-005, we explicitly use `librosa.pyin` for fundamental frequency estimation to accurately isolate pitched vocal frequencies from background noise, adhering to the "build it yourself" rule instead of using off-the-shelf wrappers like Praat/Parselmouth.

### 1.1 Energy (RMS)
Energy represents the perceived loudness of the audio.
- Extracted via `librosa.feature.rms`.
- We convert the linear RMS values to Decibels (dB) using `librosa.amplitude_to_db`.
- **Thresholds**: Silence is defined as anything below `-45.0 dB`. Clipping happens near `0.0 dB`.

### 1.2 Pitch (F0)
Fundamental frequency tracking maps the user's vocal range.
- Extracted using `librosa.pyin` for probabilistic fundamental frequency estimation.
- **Voicing Decision Rule**: We rely on the built-in probabilistic model of `pyin` to generate the raw per-frame voicing decision (`voiced_probs > 0.5`). This is considered raw-signal extraction, allowing us to safely exclude noise (like white noise, which breaks simple energy thresholding on raw `yin`).
- The downstream aggregation (meanHz, stdHz, voicedRatio) and subsequent fluency confidence scoring are entirely hand-rolled in NumPy.

### 1.3 Pacing & Pauses
Speech rate is estimated by detecting onset envelopes.
- We use `librosa.onset.onset_detect` combined with silence detection to find spoken syllables versus pauses.
- Pauses longer than 1.5 seconds are tracked.

## 2. Geometry Features (Unscheduled)
Video processing using Dlib or MediaPipe to extract facial landmarks is currently unscheduled (pending team decision, see docs/week2-report.md).

### 2.1 Head Pose Estimation
- Uses the solvePnP algorithm to map 2D facial landmarks to a 3D model.
- Determines Yaw (left/right) and Pitch (up/down).
- **Thresholds**: `MAX_HEAD_YAW = 15.0` degrees; `MAX_HEAD_PITCH = 10.0` degrees.

## 3. Optimizations
- Features are extracted sequentially but could be parallelized using ThreadPoolExecutor.
- Audio should be resampled to 16kHz for normalized processing.

---

## 4. Technical Assessment Evaluation & Scoring Engine (Week 3)

The technical assessment module evaluates two distinct formats: **Coding Challenges** (executed against test cases) and **Conceptual Explanations** (evaluated via local NLP semantic similarity and concept graphs).

### 4.1 Code Execution Protocol (stdin / stdout)
All code evaluation follows a deterministic standard I/O protocol:
- **Input Delivery**: Test case `input` strings are piped directly into child process `stdin`.
- **Output Capture**: The user code processes input and writes results to standard output (`stdout`).
- **Assertion**: Captured `stdout` is stripped (`.strip()`) of leading/trailing whitespace and compared directly with the trimmed `expectedOutput`.
- **Seed Bank & Starter Code Alignment**:
  - Python starter code provides a standard input-reading boilerplate:
    ```python
    import sys

    def solve():
        input_data = sys.stdin.read().split()
        if not input_data:
            return
        # Solution logic here...
        print(result)

    if __name__ == '__main__':
        solve()
    ```
  - **Language Scope**: **Python 3 only** in Week 3. JavaScript execution is a documented stretch goal deferred to a later milestone with Node.js sandbox isolation as a prerequisite.

### 4.2 Honest Interim Runner Limits (SubprocessCodeRunner)
Ahead of the full Docker-based isolated container sandbox scheduled for **Week 5**, Week 3 employs a lightweight `SubprocessCodeRunner`. To maintain security transparency, its capabilities and limitations are explicitly documented:

| Dimension | What IS Enforced (Week 3) | What IS NOT Guaranteed (Deferred to Week 5 Docker Sandbox) |
|---|---|---|
| **Execution Time** | Strict wall-clock timeout (default: 3.0s, max: 10.0s) via `Popen.communicate(timeout=3.0)`. Process tree is terminated with `kill()` on timeout to stop infinite loops and eliminate orphans. | Fine-grained CPU instruction cycles or CPU quota scheduling. |
| **Output Volume** | Maximum output buffer limit of 10KB (10,240 bytes). Output exceeding this threshold is truncated to prevent stdout buffer flooding. | Protection against fork bombs or child process spawning before timeout triggers. |
| **Filesystem** | Runs inside an ephemeral directory (`tempfile.TemporaryDirectory`) deleted immediately in a `finally` block. | **No filesystem jail**: Code can read any file the OS user running the ML service can read (only the working directory is isolated). Host root protection is deferred to Week 5. |
| **Environment & Flag** | Executed using `python -I` (isolated mode: ignores `PYTHONPATH`, user site-packages, and script dir). Environment is fully stripped to minimal runtime paths (`PATH`, `SYSTEMROOT`). | Syscall sandboxing or kernel namespace isolation (no seccomp / gVisor). |
| **AST Denylist Mitigation** | Best-effort AST syntax analysis rejecting imports of `os`, `subprocess`, `socket`, `ctypes`, `shutil`, and calls to `open`. | **Documented as bypassable** (e.g. via dynamic reflection `__builtins__`, `getattr`, or string obfuscation). Hard syscall blocking requires Week 5 containerization. |
| **Memory** | **Not enforced in Week 3**. The runner notes `memoryLimitMb: 128` as informational metadata only. | Hard OS memory caps. Windows lacks the POSIX `resource` module, and process polling introduces race conditions. Hard memory caps are enforced via Docker `--memory` cgroup limits in Week 5. |
| **Network** | Best-effort environment sanitization (no proxy vars passed). | Kernel-level network packet drops or network namespace isolation. Code can theoretically attempt socket connections. |
| **Runner Gating** | Gated behind `ENABLE_INTERIM_RUNNER` env var (default: `false`; `true` in dev). If disabled, code evaluation returns HTTP 503. ML service binds to `127.0.0.1` by default. | Production-grade open-internet untrusted multi-tenant isolation. |
| **Hidden Redaction** | ML Service redacts `expectedOutput` and `actualOutput` (`null`) for all hidden test cases (`isHidden: true`) directly in its response. | Candidate guessing based on binary pass/fail and execution timing. |
| **Language** | Python 3.10 standard library only. | Multi-language polyglot sandboxing. (JavaScript is a stretch goal). |

### 4.3 Coding Challenge Scoring Formula
Coding evaluation translates raw test results into a normalized 0–100 integer score:
- **Test Pass Score ($S_{\text{tests}}$, Weight: 80%)**:
  $$S_{\text{tests}} = \text{passRatio} \times 100 = \left(\frac{\text{passedTests}}{\text{totalTests}}\right) \times 100$$
- **Runtime Efficiency Score ($S_{\text{runtime}}$, Weight: 20%)**:
  - $S_{\text{runtime}}$ **only counts when test cases pass** and is scaled strictly by $\text{passRatio}$. If $\text{passedTests} = 0$, $S_{\text{runtime}} = 0$.
  - **Python Startup Noise Tolerance**: Baseline initialization overhead ($T_{\text{startup}} = 60\text{ ms}$) is deducted. Target efficiency window is $T_{\text{target}} = 500\text{ ms}$.
  $$\text{netRuntime} = \max(0, \text{avgRuntimeMs} - T_{\text{startup}})$$
  $$\text{efficiencyFactor} = \max\left(0.0, \min\left(1.0, 1.0 - \frac{\text{netRuntime}}{T_{\text{target}}}\right)\right)$$
  $$S_{\text{runtime}} = \text{round}(\text{passRatio} \times \text{efficiencyFactor} \times 100)$$
- **Overall Score**:
  $$\text{overallScore} = \text{round}(0.80 \times S_{\text{tests}} + 0.20 \times S_{\text{runtime}})$$

### 4.4 NLP Conceptual Evaluation Pipeline
Conceptual responses are evaluated offline through a multi-stage NLP pipeline:
1. **Semantic Similarity**:
   - Model: `sentence-transformers/all-MiniLM-L6-v2` loaded locally on CPU.
   - Computes embedding vectors for the candidate's explanation and the question's golden `referenceAnswer`.
   - Calculates cosine similarity normalized to a 0–100 scale:
     $$\text{similarity} = \max(0, \cos(\mathbf{u}, \mathbf{v})) \times 100$$
2. **Concept Graph Coverage**:
   - Model: `spaCy en_core_web_sm` pipeline.
   - Extracts lemmatized tokens, technical noun phrases, and entities from the candidate's text.
   - Compares extracted lemmas against the question's curated `keyConcepts` list.
   - Generates explicit sets of `matchedConcepts` and `missingConcepts`:
     $$\text{conceptCoverage} = \left(\frac{|\text{matchedConcepts}|}{|\text{keyConcepts}|}\right) \times 100$$
3. **Structure & Length Heuristics**:
   - Penalizes extremely terse answers (e.g., under 15 words) or repetitive gibberish.
4. **Scoring Formula**:
   $$\text{overallScore} = \text{round}(0.55 \times \text{similarity} + 0.35 \times \text{conceptCoverage} + 0.10 \times \text{structure})$$

---

## 5. Score Schema Comparison (Side-by-Side)

All three evaluation domains (Fluency, Confidence, and Technical) share a unified structural envelope: an integer/float `score` (0–100), an `isSample` indicator, a breakdown dictionary with granular penalties/weights, and human-readable feedback.

```text
+------------------------------+------------------------------+------------------------------+
|     FluencyResult (Week 2)   |    ConfidenceResult (Week 2) |    TechnicalResult (Week 3)  |
+------------------------------+------------------------------+------------------------------+
| {                            | {                            | {                            |
|   "score": 85,               |   "score": 72.0,             |   "score": 92,               |
|   "isSample": false,         |   "isSample": true,          |   "isSample": false,         |
|   "version": "1.0.0",        |   "version": "1.0.0",        |   "version": "1.0.0",        |
|   "wpm": 142.0,              |   "eyeContactPercent": 68.0, |   "type": "conceptual",      |
|   "fillerWordCount": 2,      |   "headStability": "moderate"|   "metrics": {               |
|   "fillerWordBreakdown": {   |   "note": "Sample data...",  |     "semanticSimilarity":    |
|     "um": 1,                 |   "breakdown": {             |       94.2,                  |
|     "like": 1                |     "sampleBaseline": 72.0   |     "conceptCoverage":       |
|   },                         |   }                          |       100.0,                 |
|   "silenceRatio": 0.12,      | }                            |     "wordCount": 48          |
|   "breakdown": {             |                              |   },                         |
|     "wpmPenalty": 5.0,       |                              |   "breakdown": {             |
|     "fillerPenalty": 6.0,    |                              |     "similarityScore": 51.8, |
|     "silencePenalty": 4.0    |                              |     "conceptScore": 35.0,    |
|   }                          |                              |     "structureScore": 10.0   |
| }                            |                              |   },                         |
|                              |                              |   "matchedConcepts": [       |
|                              |                              |     "B-Tree",                |
|                              |                              |     "O(log N)"               |
|                              |                              |   ],                         |
|                              |                              |   "missingConcepts": [],     |
|                              |                              |   "feedback": "Strong answer"|
|                              |                              | }                            |
+------------------------------+------------------------------+------------------------------+
```

---

## 6. One-Time Offline Model Setup

To satisfy the strict offline and build-from-scratch policy, all weights and models must be downloaded once and cached locally prior to runtime execution.

### Setup Instructions

1. **Activate the Virtual Environment**:
   ```bash
   cd ml-service
   source .venv/bin/activate    # On Windows: .venv\Scripts\activate
   ```

2. **Install Required Packages**:
   Ensure `sentence-transformers`, `spacy`, and `torch` are installed:
   ```bash
   pip install sentence-transformers==3.0.1 spacy==3.7.5 torch==2.4.0 --extra-index-url https://download.pytorch.org/whl/cpu
   ```

3. **Download spaCy English Model**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

4. **Pre-Cache Sentence-Transformers Weights**:
   Run the following Python snippet to populate the local cache with `all-MiniLM-L6-v2` (approx. 80MB):
   ```python
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer('all-MiniLM-L6-v2')
   print("SentenceTransformer all-MiniLM-L6-v2 loaded and cached successfully.")
   ```
   Once cached, inference runs completely offline with zero outbound network calls.

