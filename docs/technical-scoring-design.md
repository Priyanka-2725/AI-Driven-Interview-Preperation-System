# Technical Scoring Design

> **Architectural Reconciliation Note (Week 3)**:
> This document originally contained early Week 1 notes on acoustic and geometric heuristic features (Energy, Pitch, Pacing, Eye Contact). Those acoustic feature notes have been consolidated into [`docs/ml-feature-notes.md`](file:///d:/AI-INTERVIEW-COACH/docs/ml-feature-notes.md).
>
> As of **Week 3 (Technical Assessment Engine)**, this document defines the scoring design for **Technical Coding Challenges** and **Conceptual Technical Questions**, aligning directly with ADR-009, ADR-010, and ADR-011.

---

## 1. Coding Challenge Scoring Engine

The coding evaluation translates raw execution results into a normalized 0–100 integer score. It emphasizes correctness while rewarding execution efficiency and edge-case handling.

### 1.1 Component Breakdown
Coding evaluation combines two distinct sub-scores:
1. **Test Pass Score ($S_{\text{tests}}$, Weight: 80%)**:
   - Directly proportional to the fraction of passed test cases (both visible and hidden):
     $$S_{\text{tests}} = \left(\frac{\text{passedTests}}{\text{totalTests}}\right) \times 100$$
   - If any test case crashes with a syntax error, uncaught exception, or infinite loop timeout, that test receives 0 points.
2. **Runtime Efficiency Score ($S_{\text{runtime}}$, Weight: 20%)**:
   - $S_{\text{runtime}}$ **only counts when test cases pass** and is scaled strictly by $\text{passRatio} = \frac{\text{passedTests}}{\text{totalTests}}$. If zero test cases pass, $S_{\text{runtime}} = 0$.
   - **Python Startup Noise Tolerance**:
     - Python interpreter initialization and startup incurs baseline overhead ($T_{\text{startup}} = 60\text{ ms}$). This constant baseline is deducted so short scripts are not unfairly penalized.
     - Target efficiency window is $T_{\text{target}} = 500\text{ ms}$.
   - **Formula**:
     $$\text{netRuntime} = \max(0, \text{avgRuntimeMs} - T_{\text{startup}})$$
     $$\text{efficiencyFactor} = \max\left(0.0, \min\left(1.0, 1.0 - \frac{\text{netRuntime}}{T_{\text{target}}}\right)\right)$$
     $$S_{\text{runtime}} = \text{round}(\text{passRatio} \times \text{efficiencyFactor} \times 100)$$

### 1.2 Overall Coding Formula
$$\text{overallScore} = \begin{cases} 
0 & \text{if } \text{passedTests} = 0 \\
\text{round}(0.80 \times (\text{passRatio} \times 100) + 0.20 \times S_{\text{runtime}}) & \text{otherwise}
\end{cases}$$

---

## 2. Conceptual Answer NLP Scoring Engine

Conceptual answers evaluate the candidate's natural language explanation against golden reference answers and required concept graphs without third-party LLMs.

### 2.1 Component Breakdown
1. **Semantic Similarity ($S_{\text{semantic}}$, Weight: 55%)**:
   - Offline `sentence-transformers/all-MiniLM-L6-v2` produces dense embeddings $\mathbf{u}$ (candidate) and $\mathbf{v}$ (reference).
   - Cosine similarity maps to a 0–100 score:
     $$S_{\text{semantic}} = \max(0, \cos(\mathbf{u}, \mathbf{v})) \times 100$$
2. **Concept Coverage ($S_{\text{concept}}$, Weight: 35%)**:
   - Using `spaCy en_core_web_sm`, the candidate text is tokenized and lemmatized into technical n-grams.
   - Evaluated against the question's `keyConcepts`:
     $$S_{\text{concept}} = \left(\frac{|\text{matchedConcepts}|}{|\text{keyConcepts}|}\right) \times 100$$
3. **Structure & Depth ($S_{\text{structure}}$, Weight: 10%)**:
   - Baseline length verification:
     - Word count $< 15$ words: $S_{\text{structure}} = 0$ (prevents trivial/empty answers).
     - $15 \le \text{Word count} < 40$: $S_{\text{structure}} = 50$.
     - $\text{Word count} \ge 40$: $S_{\text{structure}} = 100$.

### 2.2 Overall Conceptual Formula
$$\text{overallScore} = \text{round}(0.55 \times S_{\text{semantic}} + 0.35 \times S_{\text{concept}} + 0.10 \times S_{\text{structure}})$$

---

## 3. Attempt Composite Scoring Engine

When an assessment `Attempt` is completed:
1. Every assigned question $q_i \in \text{questions}$ is scored based on the candidate's latest evaluated submission:
   - Evaluated submission exists $\implies \text{score}(q_i) = \text{Evaluation.overallScore}$.
   - **No submission exists (unanswered question) $\implies \text{score}(q_i) = 0$**.
2. Composite score is the arithmetic mean across all assigned questions:
   $$\text{compositeScore} = \text{round}\left(\frac{\sum_{i=1}^{N} \text{score}(q_i)}{N}\right)$$
   where $N = \text{questions.length}$.

---

## 4. Score Schema Alignment

The output schema conforms to the unified system envelope (`score`, `isSample`, `version`, `breakdown`, `feedback`):

```json
{
  "overallScore": 92,
  "isSample": false,
  "version": "1.0.0",
  "type": "coding",
  "breakdown": {
    "testPassScore": 80.0,
    "runtimeEfficiency": 12.0
  },
  "feedback": "4 of 5 test cases passed. Solution timed out on large edge case input."
}
```

---

## 5. Legacy Week 1 Feature Note Archive (Audio & Geometry)

For historical reference, the early Week 1 acoustic and geometry scoring formulas (Energy, Pitch std dev, Pacing syllable rate, EAR eye contact) have been relocated to [`docs/ml-feature-notes.md`](file:///d:/AI-INTERVIEW-COACH/docs/ml-feature-notes.md#L1-L30).

---

## 6. Known Calibration Drift & Week 6 QA Item

> [!NOTE]
> **Measured-Baseline Drift (Week 6 QA Item)**:
> In local Windows development environments, the dynamic interpreter startup baseline measurement (`get_startup_baseline_ms()`) observed startup overhead values around **293.4 ms** compared to the initial design baseline of **~150 ms** (and Linux targets of **~60 ms**). While the scoring engine dynamically subtracts the measured baseline once cached per process, the runtime efficiency target window ($T_{\text{target}} = 500\text{ ms}$) will be recalibrated and stabilized in Week 6 QA inside the containerized Docker sandbox environment.

