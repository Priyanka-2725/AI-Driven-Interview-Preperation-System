import sys
from typing import Dict, Any, Optional

TARGET_EFFICIENCY_WINDOW_MS = 500.0
_MEASURED_STARTUP_BASELINE_MS: Optional[float] = None

def get_startup_baseline_ms() -> float:
    """
    Measures actual subprocess interpreter startup overhead for a no-op script.
    On Windows, python -I process startup typically measures ~145-165ms.
    """
    global _MEASURED_STARTUP_BASELINE_MS
    if _MEASURED_STARTUP_BASELINE_MS is not None:
        return _MEASURED_STARTUP_BASELINE_MS
    try:
        import subprocess
        import time
        runs = []
        for _ in range(3):
            t0 = time.perf_counter()
            subprocess.run([sys.executable, "-I", "-c", "pass"], capture_output=True, check=False)
            runs.append((time.perf_counter() - t0) * 1000.0)
        runs.sort()
        _MEASURED_STARTUP_BASELINE_MS = round(runs[len(runs) // 2], 1)
    except Exception:
        _MEASURED_STARTUP_BASELINE_MS = 155.0 if sys.platform == "win32" else 60.0
    return _MEASURED_STARTUP_BASELINE_MS

def score_coding_challenge(
    pass_ratio: float,
    total_tests: int,
    passed_tests: int,
    avg_runtime_ms: float,
    startup_baseline_ms: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes normalized 0-100 score for coding challenges.
    S_runtime only counts when tests pass (scaled strictly by passRatio).
    Startup noise (dynamically measured baseline, ~155ms on Windows) is subtracted.
    If 0 tests pass, overallScore is 0.
    """
    if total_tests <= 0 or passed_tests <= 0:
        return {
            "overallScore": 0,
            "isSample": False,
            "version": "1.0.0",
            "type": "coding",
            "breakdown": {
                "testPassScore": 0.0,
                "runtimeEfficiency": 0.0
            },
            "feedback": "0 test cases passed. Code must pass test cases to earn correctness and runtime points."
        }

    # S_tests: 0 - 100
    s_tests = (passed_tests / total_tests) * 100.0

    # Measured startup noise deduction
    baseline = startup_baseline_ms if startup_baseline_ms is not None else get_startup_baseline_ms()
    net_runtime = max(0.0, avg_runtime_ms - baseline)
    efficiency_factor = max(0.0, min(1.0, 1.0 - (net_runtime / TARGET_EFFICIENCY_WINDOW_MS)))
    
    # S_runtime scaled by passRatio
    s_runtime = pass_ratio * efficiency_factor * 100.0

    test_pass_score = round(0.80 * s_tests, 1)
    runtime_efficiency = round(0.20 * s_runtime, 1)
    overall_score = min(100, max(0, round(test_pass_score + runtime_efficiency)))

    if passed_tests == total_tests:
        feedback = f"All {total_tests} test cases passed. Average runtime: {avg_runtime_ms:.1f}ms."
    else:
        failed = total_tests - passed_tests
        feedback = f"{passed_tests} of {total_tests} test cases passed ({failed} failed). Average runtime: {avg_runtime_ms:.1f}ms."

    return {
        "overallScore": overall_score,
        "isSample": False,
        "version": "1.0.0",
        "type": "coding",
        "breakdown": {
            "testPassScore": test_pass_score,
            "runtimeEfficiency": runtime_efficiency
        },
        "feedback": feedback
    }

def score_conceptual_answer(
    semantic_similarity: float,
    concept_coverage: float,
    word_count: int,
    matched_concepts: list,
    missing_concepts: list
) -> Dict[str, Any]:
    """
    Computes normalized 0-100 score for conceptual natural language explanations.
    Weights: 55% semantic similarity, 35% concept coverage, 10% structure.
    """
    # Structure heuristic: 0 for <15 words, 50 for 15-39 words, 100 for 40+ words
    # If the answer is completely off-topic (0 concept coverage and low similarity), structure points are 0.
    if concept_coverage == 0.0 and semantic_similarity < 25.0:
        structure = 0.0
    elif word_count < 15:
        structure = 0.0
    elif word_count < 40:
        structure = 50.0
    else:
        structure = 100.0

    similarity_score = round(0.55 * max(0.0, min(100.0, semantic_similarity)), 1)
    concept_score = round(0.35 * max(0.0, min(100.0, concept_coverage)), 1)
    structure_score = round(0.10 * structure, 1)
    overall_score = min(100, max(0, round(similarity_score + concept_score + structure_score)))

    if overall_score >= 80:
        if missing_concepts:
            missing_str = ", ".join(missing_concepts)
            feedback = f"Strong conceptual explanation. To make it complete, consider also discussing: {missing_str}."
        else:
            feedback = "Strong conceptual explanation demonstrating thorough understanding of core topics."
    elif overall_score >= 40:
        missing_str = ", ".join(missing_concepts) if missing_concepts else "further details"
        feedback = f"Partial explanation. Missing core concepts: {missing_str}."
    else:
        missing_str = ", ".join(missing_concepts) if missing_concepts else "all core concepts"
        feedback = f"Off-topic or incomplete explanation. Missing required concepts: {missing_str}."

    return {
        "overallScore": overall_score,
        "isSample": False,
        "version": "1.0.0",
        "type": "conceptual",
        "breakdown": {
            "similarityScore": similarity_score,
            "conceptScore": concept_score,
            "structureScore": structure_score
        },
        "matchedConcepts": matched_concepts,
        "missingConcepts": missing_concepts,
        "wordCount": word_count,
        "feedback": feedback
    }
