import pytest
from app.features.technical_scorer import (
    score_coding_challenge,
    score_conceptual_answer
)

def test_score_coding_zero_passed_tests():
    # Condition A: Zero passing tests means zero runtime points and zero overall score
    res = score_coding_challenge(
        pass_ratio=0.0,
        total_tests=5,
        passed_tests=0,
        avg_runtime_ms=25.0
    )
    assert res["overallScore"] == 0
    assert res["breakdown"]["testPassScore"] == 0.0
    assert res["breakdown"]["runtimeEfficiency"] == 0.0

def test_score_coding_all_passed_fast_runtime():
    # Fast runtime within startup noise window (<= 60ms)
    res = score_coding_challenge(
        pass_ratio=1.0,
        total_tests=5,
        passed_tests=5,
        avg_runtime_ms=50.0  # Under 60ms startup noise -> netRuntime 0 -> 100% efficiency
    )
    assert res["overallScore"] == 100
    assert res["breakdown"]["testPassScore"] == 80.0
    assert res["breakdown"]["runtimeEfficiency"] == 20.0

def test_score_coding_partial_pass():
    # 2 of 4 tests pass -> passRatio = 0.5
    # S_tests = 50.0 -> testPassScore = 0.80 * 50 = 40.0
    # S_runtime scaled by passRatio 0.5
    res = score_coding_challenge(
        pass_ratio=0.5,
        total_tests=4,
        passed_tests=2,
        avg_runtime_ms=60.0
    )
    assert res["breakdown"]["testPassScore"] == 40.0
    # Efficiency is 1.0 (since netRuntime = 0), but scaled by passRatio (0.5) -> s_runtime = 50 -> 20% * 50 = 10.0
    assert res["breakdown"]["runtimeEfficiency"] == 10.0
    assert res["overallScore"] == 50

def test_score_conceptual_full_marks():
    res = score_conceptual_answer(
        semantic_similarity=100.0,
        concept_coverage=100.0,
        word_count=50,  # >= 40 words -> structure 100.0
        matched_concepts=["B-Tree", "disk I/O"],
        missing_concepts=[]
    )
    assert res["breakdown"]["similarityScore"] == 55.0
    assert res["breakdown"]["conceptScore"] == 35.0
    assert res["breakdown"]["structureScore"] == 10.0
    assert res["overallScore"] == 100

def test_score_conceptual_short_answer():
    res = score_conceptual_answer(
        semantic_similarity=80.0,
        concept_coverage=50.0,
        word_count=10,  # < 15 words -> structure 0.0
        matched_concepts=["B-Tree"],
        missing_concepts=["disk I/O"]
    )
    # 0.55 * 80 = 44.0
    # 0.35 * 50 = 17.5
    # 0.10 * 0 = 0.0
    # Total = 44.0 + 17.5 = 61.5 -> 62
    assert res["breakdown"]["structureScore"] == 0.0
    assert res["overallScore"] == 62
