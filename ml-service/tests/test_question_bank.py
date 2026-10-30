import pytest
from app.features.question_bank import (
    load_seed_questions,
    get_questions,
    generate_parameterized_variation,
    run_reference_solution
)

def test_load_seed_questions():
    questions = load_seed_questions()
    assert len(questions) >= 6
    # Ensure coding and conceptual types both exist
    types = {q["type"] for q in questions}
    assert "coding" in types
    assert "conceptual" in types

def test_get_questions_filter():
    coding_q = get_questions(type="coding", count=2)
    assert len(coding_q) <= 2
    for q in coding_q:
        assert q["type"] == "coding"

    conceptual_q = get_questions(type="conceptual", count=2)
    for q in conceptual_q:
        assert q["type"] == "conceptual"

def test_run_reference_solution():
    ref_code = """
import sys
line = sys.stdin.read().strip()
print(f"ECHO:{line}")
"""
    out = run_reference_solution(ref_code, "test_input")
    assert out == "ECHO:test_input"

def test_generate_parameterized_variation():
    two_sum_q = next((q for q in load_seed_questions() if q["slug"] == "two-sum"), None)
    assert two_sum_q is not None

    varied = generate_parameterized_variation(two_sum_q)
    assert len(varied["testCases"]) >= len(two_sum_q["testCases"])
    # Ensure new hidden test cases have valid expectedOutput computed by reference solution
    for tc in varied["testCases"]:
        assert "input" in tc
        assert "expectedOutput" in tc
        assert tc["expectedOutput"] is not None

def test_all_seed_reference_solutions_pass():
    """
    Iterates over ALL seed coding questions, runs each reference solution
    through the runner against all its test cases (visible and hidden),
    and asserts every single one passes.
    """
    from app.features.code_runner import SubprocessCodeRunner
    runner = SubprocessCodeRunner()
    questions = load_seed_questions()
    coding_questions = [q for q in questions if q["type"] == "coding"]

    assert len(coding_questions) >= 6

    for q in coding_questions:
        ref_solution = q.get("referenceSolution")
        test_cases = q.get("testCases", [])
        time_limit = q.get("timeLimitSeconds", 3.0)

        assert ref_solution is not None, f"Question {q['slug']} missing referenceSolution"
        assert len(test_cases) > 0, f"Question {q['slug']} has no test cases"

        result = runner.execute(
            code=ref_solution,
            language="python",
            test_cases=test_cases,
            time_limit_seconds=time_limit,
            visible_only=False
        )

        assert result["allPassed"] is True, (
            f"Reference solution for '{q['slug']}' failed. Results: {result['results']}"
        )
        assert result["passRatio"] == 1.0
        assert result["failedTests"] == 0
        assert result["passedTests"] == len(test_cases)

def test_seed_questions_schema_validity():
    """
    Validates schema compliance for all seed questions: required fields,
    documented enum constraints, and test case limits (max 25).
    """
    ALLOWED_TOPICS = {
        "arrays", "trees", "graphs", "strings",
        "system-design", "javascript", "python", "databases"
    }
    ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}
    ALLOWED_TYPES = {"coding", "conceptual"}

    questions = load_seed_questions()
    assert len(questions) >= 12

    for q in questions:
        # 1. Required core fields
        for field in ("id", "title", "slug", "topic", "difficulty", "type", "description"):
            assert field in q, f"Question {q.get('slug')} missing required field '{field}'"
            assert q[field], f"Field '{field}' in {q.get('slug')} is empty"

        # 2. Enum validations
        assert q["topic"] in ALLOWED_TOPICS, (
            f"Topic '{q['topic']}' in {q['slug']} not in allowed enum {ALLOWED_TOPICS}"
        )
        assert q["difficulty"] in ALLOWED_DIFFICULTIES, (
            f"Difficulty '{q['difficulty']}' in {q['slug']} not in {ALLOWED_DIFFICULTIES}"
        )
        assert q["type"] in ALLOWED_TYPES, (
            f"Type '{q['type']}' in {q['slug']} not in {ALLOWED_TYPES}"
        )

        # 3. Type-specific validations
        if q["type"] == "coding":
            assert "starterCode" in q and isinstance(q["starterCode"], dict)
            assert "python" in q["starterCode"]
            assert "referenceSolution" in q and len(q["referenceSolution"].strip()) > 0
            assert "testCases" in q and isinstance(q["testCases"], list)
            assert 1 <= len(q["testCases"]) <= 25, (
                f"Question {q['slug']} must have between 1 and 25 test cases (got {len(q['testCases'])})"
            )
            for tc in q["testCases"]:
                assert "input" in tc
                assert "expectedOutput" in tc
                assert isinstance(tc.get("isHidden", False), bool)
        elif q["type"] == "conceptual":
            assert "questionText" in q and len(q["questionText"].strip()) > 0
            assert "referenceAnswer" in q and len(q["referenceAnswer"].strip()) > 0
            assert "keyConcepts" in q and isinstance(q["keyConcepts"], list)
            assert len(q["keyConcepts"]) >= 1, f"Conceptual question {q['slug']} must have keyConcepts"
