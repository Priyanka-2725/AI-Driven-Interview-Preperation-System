# Architecture Decisions

## ADR-004: Python Version Selection
Python 3.11 unavailable on dev machine (confirmed via `py -0p` and a failed `py -3.11 -m venv` attempt), 3.12 venv confirmed broken in Phase 1, 3.10.11 approved as the practical alternative.

## ADR-005: Pitch Extraction and Voicing Decision
We originally attempted to use `librosa.yin` for fundamental frequency estimation to adhere strictly to the "build it yourself" rule for scoring and decision boundaries. However, `librosa.yin` forces a pitch estimate for every frame, regardless of periodicity. Using a simple energy threshold (RMS > -45 dB) proved insufficient for voicing detection, as demonstrated by a test where white noise was erroneously classified as 97% voiced speech.

**Decision**: We restored `librosa.pyin` scoped strictly to raw signal extraction (f0 and probability-based voicing detection). The probabilistic model in `pyin` reliably isolates true voiced pitch. The downstream aggregation (meanHz, stdHz, voicedRatio) and future confidence scoring remain entirely hand-rolled in NumPy, preserving the intent of the from-scratch policy.

## ADR-009: Question Generation & Selection Strategy
- **Context**: Candidates require technical questions across topics (*Arrays, Trees, Graphs, System Design, JavaScript, Python, Databases*) and difficulties (*Easy, Medium, Hard*), categorized as `coding` or `conceptual`.
- **Options Considered**:
  - *Option 1*: External generative AI APIs (OpenAI/Gemini/Anthropic). **Rejected**: Violates the build-from-scratch policy.
  - *Option 2*: Large local LLMs (e.g. 7B parameter models). **Rejected**: High latency, resource-heavy, and unfeasible for standard CPU laptops.
  - *Option 3*: **Curated Seed Bank + Parameterized Variations with Reference Solutions**.
- **Decision**: Adopt Option 3.
  - Questions originate from a curated, vetted seed bank (`questions_seed.json`).
  - For coding question variations, inputs are parameterized (e.g., array bounds, target values), and expected outputs are computed **strictly by executing a verified reference solution**. No synthetic test cases with invented outputs are ever generated.
  - For conceptual question variations, prompt templates rephrase the context deterministically while preserving golden reference answers and required concept graphs.
  - Questions created via `POST /api/v1/questions/generate` compute a deterministic slug hash to avoid duplicates and persist as `isCurated: false`.

## ADR-010: NLP Technical Evaluation Pipeline (Conceptual Answers)
- **Context**: Conceptual answers require objective semantic accuracy assessment and concept coverage analysis without hosted LLM grader APIs.
- **Decision**: Adopt a **Multi-Stage Semantic & Concept Graph Evaluation Engine**:
  1. **Semantic Similarity**: Offline local Sentence-Transformers (`all-MiniLM-L6-v2` running locally on CPU) computing cosine similarity between candidate explanations and curated golden reference answers.
  2. **Concept Coverage**: Lemmatized token and n-gram extraction (via offline `spaCy en_core_web_sm`) verifying presence of required technical concepts from the question's `keyConcepts` list (returning `matchedConcepts` and `missingConcepts`).
  3. **Structure & Length Heuristics**: Baseline validation checking for minimum substantive word count and non-trivial structure to prevent empty or repetitive cheating.
  4. **Output Schema**: Normalized 0–100 technical score with full breakdown aligned with Week 2's fluency and confidence schemas.

## ADR-011: Swappable `CodeRunner` Interface & Interim Subprocess Sandbox
- **Context**: Candidate code submissions must be executed against test cases. A full Docker-based isolated container sandbox with gVisor / seccomp / cgroups is scheduled for **Week 5**. Week 3 requires a working interim code runner.
- **Execution Protocol**:
  - All test cases follow a strict **stdin / stdout** format: test inputs are piped to child process `stdin`, user code writes to `stdout`, and `expectedOutput` is compared against trimmed `stdout`.
  - **Language Scope**: **Python 3 only** in Week 3. JavaScript execution is a documented stretch goal deferred to a later milestone with Node.js sandbox isolation as a stated prerequisite.
- **Interim Limits & Honest Security Assessment**:
  - **What IS Enforced**:
    - Strict execution wall-clock timeout (default: 3.0s, max: 10.0s) via `subprocess.run(timeout=...)` or `Popen.communicate(timeout=...)`; hung processes are terminated.
    - Output buffer truncation cap (max 10KB / 10,240 bytes) to prevent stdout memory bloat and terminal flooding.
    - Ephemeral working directory created per execution (`tempfile.TemporaryDirectory`) and removed immediately in a `finally` block.
    - Stripped environment variables (only minimal runtime paths; secrets and app environment variables are scrubbed).
    - Best-effort cleanup using process tree termination.
  - **What IS NOT Guaranteed (Deferred to Week 5 Docker Sandbox)**:
    - *Memory Limiting*: **Not enforced in Week 3**. Windows lacks the POSIX `resource` module, and process polling introduces race conditions. Hard memory caps are enforced via Docker `--memory` cgroup limits in Week 5.
    - *No OS-level network isolation*: On Windows and standard user-space Linux without root/namespaces, plain subprocesses cannot guarantee complete socket blocking without root firewall or network namespaces.
    - *No syscall or filesystem jail*: Code can theoretically inspect local filesystem paths accessible to the executing user outside the temp dir.
- **Decision**: Implement a clean `CodeRunner` abstract interface (`SubprocessCodeRunner` for Week 3). In Week 5, `DockerCodeRunner` will drop into this exact interface, replacing the interim runner with true kernel containerization.
