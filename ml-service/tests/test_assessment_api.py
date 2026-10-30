import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def enable_runner():
    orig = settings.ENABLE_INTERIM_RUNNER
    settings.ENABLE_INTERIM_RUNNER = True
    yield
    settings.ENABLE_INTERIM_RUNNER = orig

def test_api_generate_questions():
    res = client.post("/api/v1/assessment/generate-questions", json={
        "topic": "arrays",
        "difficulty": "easy",
        "type": "coding",
        "count": 1
    })
    assert res.status_code == 200
    data = res.json()
    assert "questions" in data
    assert len(data["questions"]) == 1
    assert data["questions"][0]["type"] == "coding"
    assert "testCases" in data["questions"][0]

def test_api_evaluate_code_success():
    payload = {
        "code": "import sys\nline = sys.stdin.read().strip()\nprint(int(line) * 2)\n",
        "language": "python",
        "testCases": [
            {"input": "5", "expectedOutput": "10", "isHidden": False},
            {"input": "12", "expectedOutput": "24", "isHidden": True}
        ],
        "timeLimitSeconds": 2.0,
        "visibleOnly": False
    }
    res = client.post("/api/v1/assessment/evaluate-code", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["allPassed"] is True
    assert data["totalTests"] == 2
    assert data["passedTests"] == 2
    # Condition E: hidden test case is redacted in ML service response
    assert data["results"][0]["input"] == "5"
    assert data["results"][0]["expectedOutput"] == "10"
    assert data["results"][0]["actualOutput"] == "10"
    assert data["results"][1]["input"] is None
    assert data["results"][1]["expectedOutput"] is None
    assert data["results"][1]["actualOutput"] is None
    assert data["results"][1]["isHidden"] is True

def test_api_evaluate_code_per_test_timeout():
    # Condition B: per-test timeout returns HTTP 200 with passed:false and error "timeout"
    payload = {
        "code": "import time\nwhile True:\n    time.sleep(0.1)\n",
        "language": "python",
        "testCases": [
            {"input": "1", "expectedOutput": "1", "isHidden": False}
        ],
        "timeLimitSeconds": 0.8
    }
    res = client.post("/api/v1/assessment/evaluate-code", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["allPassed"] is False
    assert data["results"][0]["passed"] is False
    assert data["results"][0]["error"] == "timeout"

def test_api_evaluate_code_runner_gating(monkeypatch):
    # Condition D: If ENABLE_INTERIM_RUNNER is false, returns clear error 503
    monkeypatch.setattr(settings, "ENABLE_INTERIM_RUNNER", False)
    payload = {
        "code": "print(1)",
        "language": "python",
        "testCases": [{"input": "", "expectedOutput": "1"}]
    }
    res = client.post("/api/v1/assessment/evaluate-code", json=payload)
    assert res.status_code == 503
    assert res.json()["detail"]["code"] == "INTERIM_RUNNER_DISABLED"

def test_api_evaluate_code_ast_blocked():
    payload = {
        "code": "import os\nos.system('echo hacked')\n",
        "language": "python",
        "testCases": [{"input": "", "expectedOutput": ""}]
    }
    res = client.post("/api/v1/assessment/evaluate-code", json=payload)
    assert res.status_code == 422
    assert res.json()["detail"]["code"] == "CODE_EXECUTION_BLOCKED"

def test_api_evaluate_answer():
    payload = {
        "questionText": "Explain database indexing and B-Trees.",
        "referenceAnswer": "Database indexes use balanced B-Trees to provide O(log N) lookup times and reduce disk I/O.",
        "keyConcepts": ["B-Tree", "O(log N)", "disk I/O"],
        "candidateAnswer": "Database indexing creates a B-Tree structure for O(log N) searching and minimizes disk I/O operations."
    }
    res = client.post("/api/v1/assessment/evaluate-answer", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert "semanticSimilarity" in data
    assert "conceptCoverage" in data
    assert "B-Tree" in data["matchedConcepts"]
    assert data["score"] > 50
    assert data["engine"] == "neural"

@pytest.mark.anyio
async def test_api_evaluate_code_non_blocking_event_loop():
    """
    Confirms evaluate-code does not block the asyncio event loop.
    A background coroutine advances concurrently while code evaluation runs in threadpool.
    """
    import asyncio
    from httpx import AsyncClient, ASGITransport

    heartbeat_count = 0

    async def heartbeat():
        nonlocal heartbeat_count
        for _ in range(5):
            await asyncio.sleep(0.05)
            heartbeat_count += 1

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        heartbeat_task = asyncio.create_task(heartbeat())
        response = await ac.post("/api/v1/assessment/evaluate-code", json={
            "code": "import time\ntime.sleep(0.25)\nprint('ok')",
            "language": "python",
            "testCases": [{"input": "", "expectedOutput": "ok", "isHidden": False}],
            "timeLimitSeconds": 2.0
        })
        await heartbeat_task

    assert response.status_code == 200
    assert response.json()["allPassed"] is True
    # The heartbeat coroutine must have progressed during the 0.25s execution
    assert heartbeat_count >= 2, f"Event loop was blocked: heartbeat count={heartbeat_count}"

def test_api_score_coding():
    payload = {
        "type": "coding",
        "codingResult": {
            "passRatio": 1.0,
            "totalTests": 5,
            "passedTests": 5,
            "failedTests": 0,
            "avgRuntimeMs": 45.0
        }
    }
    res = client.post("/api/v1/assessment/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overallScore"] == 100
    assert data["type"] == "coding"
    assert data["breakdown"]["testPassScore"] == 80.0
    assert data["breakdown"]["runtimeEfficiency"] == 20.0

def test_api_score_conceptual():
    payload = {
        "type": "conceptual",
        "nlpResult": {
            "semanticSimilarity": 90.0,
            "conceptCoverage": 100.0,
            "wordCount": 45,
            "matchedConcepts": ["B-Tree", "disk I/O"],
            "missingConcepts": []
        }
    }
    res = client.post("/api/v1/assessment/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "conceptual"
    assert data["overallScore"] >= 90
    assert "similarityScore" in data["breakdown"]
    assert "conceptScore" in data["breakdown"]
    assert "structureScore" in data["breakdown"]
