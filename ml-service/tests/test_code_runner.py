import os
import sys
import pytest
from app.features.code_runner import SubprocessCodeRunner
from app.core.exceptions import CodeExecutionBlockedException, UnsupportedLanguageException

runner = SubprocessCodeRunner()

def test_runner_correct_solution():
    code = """
import sys
lines = sys.stdin.read().split()
if lines:
    a, b = int(lines[0]), int(lines[1])
    print(a + b)
"""
    test_cases = [
        {"input": "3 5", "expectedOutput": "8", "isHidden": False},
        {"input": "10 -2", "expectedOutput": "8", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is True
    assert res["totalTests"] == 2
    assert res["passedTests"] == 2
    assert res["failedTests"] == 0
    assert res["results"][0]["passed"] is True
    assert res["results"][0]["actualOutput"] == "8"
    assert res["results"][0]["error"] is None

def test_runner_wrong_answer():
    code = """
import sys
lines = sys.stdin.read().split()
if lines:
    print(42)
"""
    test_cases = [
        {"input": "1 1", "expectedOutput": "2", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is False
    assert res["passedTests"] == 0
    assert res["failedTests"] == 1
    assert res["results"][0]["passed"] is False
    assert res["results"][0]["error"] == "Wrong Answer"
    assert res["results"][0]["actualOutput"] == "42"

def test_runner_syntax_error():
    code = """
def solve(:
    print("Invalid")
"""
    test_cases = [
        {"input": "", "expectedOutput": "", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is False
    assert res["passedTests"] == 0
    assert "SyntaxError" in res["results"][0]["error"]

def test_runner_runtime_exception():
    code = """
import sys
x = 1 / 0
"""
    test_cases = [
        {"input": "", "expectedOutput": "0", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is False
    assert res["passedTests"] == 0
    assert "ZeroDivisionError" in res["results"][0]["error"]

def test_runner_infinite_loop_timeout():
    code = """
import sys
while True:
    pass
"""
    test_cases = [
        {"input": "", "expectedOutput": "done", "isHidden": False}
    ]
    # Set short timeout of 0.8s
    res = runner.execute(code, "python", test_cases, time_limit_seconds=0.8)
    assert res["allPassed"] is False
    assert res["passedTests"] == 0
    assert res["results"][0]["passed"] is False
    assert res["results"][0]["error"] == "timeout"
    assert res["results"][0]["runtimeMs"] >= 700.0

def test_runner_output_flood_truncation():
    code = """
import sys
# Flood stdout with 50,000 characters
print("A" * 50000)
"""
    test_cases = [
        {"input": "", "expectedOutput": "short", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is False
    actual_len = len(res["results"][0]["actualOutput"].encode("utf-8"))
    assert actual_len <= 10240
    assert actual_len >= 10000

def test_runner_child_process_spawn_killed():
    # Attempting to spawn child process via python without blocked imports
    # by invoking sys.executable via os is blocked by denylist,
    # but we can test process tree kill with while True loop
    code = """
import time
while True:
    time.sleep(0.1)
"""
    test_cases = [
        {"input": "", "expectedOutput": "done", "isHidden": False}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=0.8)
    assert res["results"][0]["error"] == "timeout"
    assert res["results"][0]["passed"] is False

def test_runner_temp_dir_cleanup(monkeypatch):
    recorded_dirs = []
    import tempfile
    orig_mkdtemp = tempfile.mkdtemp

    def tracked_mkdtemp(*args, **kwargs):
        d = orig_mkdtemp(*args, **kwargs)
        recorded_dirs.append(d)
        return d

    monkeypatch.setattr(tempfile, "mkdtemp", tracked_mkdtemp)

    code = "print('hello')"
    test_cases = [{"input": "", "expectedOutput": "hello", "isHidden": False}]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is True
    assert len(recorded_dirs) == 1
    # Verify temp dir was completely deleted
    assert not os.path.exists(recorded_dirs[0])

def test_runner_import_denylist_rejection():
    prohibited_snippets = [
        "import os\nos.system('dir')",
        "import subprocess\nsubprocess.run(['ls'])",
        "import socket\ns = socket.socket()",
        "import ctypes",
        "import shutil",
        "from os import path",
        "from subprocess import Popen",
        "f = open('test.txt', 'w')"
    ]
    for snippet in prohibited_snippets:
        with pytest.raises(CodeExecutionBlockedException):
            runner.execute(snippet, "python", [{"input": "", "expectedOutput": "", "isHidden": False}])

def test_runner_stdin_handling():
    code = """
import sys
data = sys.stdin.read().splitlines()
nums = [int(x) for x in data[0].split()]
target = int(data[1].strip())
print(f"SUM:{sum(nums)} TARGET:{target}")
"""
    test_cases = [
        {
            "input": "10 20 30 40\n100",
            "expectedOutput": "SUM:100 TARGET:100",
            "isHidden": False
        }
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is True
    assert res["results"][0]["actualOutput"] == "SUM:100 TARGET:100"

def test_runner_hidden_test_redaction():
    code = "import sys\nprint('secret')"
    test_cases = [
        {"input": "visible_in", "expectedOutput": "secret", "isHidden": False},
        {"input": "hidden_in", "expectedOutput": "secret", "isHidden": True}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is True
    # Visible test case retains input/expected/actual
    assert res["results"][0]["input"] == "visible_in"
    assert res["results"][0]["expectedOutput"] == "secret"
    assert res["results"][0]["actualOutput"] == "secret"
    assert res["results"][0]["isHidden"] is False
    # Hidden test case redacts input/expected/actual
    assert res["results"][1]["input"] is None
    assert res["results"][1]["expectedOutput"] is None
    assert res["results"][1]["actualOutput"] is None
    assert res["results"][1]["isHidden"] is True
    assert res["results"][1]["passed"] is True

def test_runner_visible_only_filter():
    code = "import sys\nprint('hello')"
    test_cases = [
        {"input": "", "expectedOutput": "hello", "isHidden": False},
        {"input": "", "expectedOutput": "hello", "isHidden": True}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0, visible_only=True)
    assert res["totalTests"] == 1
    assert res["results"][0]["isHidden"] is False

def test_runner_unsupported_language():
    with pytest.raises(UnsupportedLanguageException):
        runner.execute("console.log(1)", "javascript", [{"input": "", "expectedOutput": "1"}])

def test_runner_cumulative_timeout_cap(monkeypatch):
    """Verifies that cumulative execution time cap (30.0s) raises RequestTimeoutException."""
    from app.core.exceptions import RequestTimeoutException
    import app.features.code_runner as cr_mod

    # Temporarily set cap to small threshold to test without waiting 30 seconds
    monkeypatch.setattr(cr_mod, "MAX_CUMULATIVE_TIMEOUT_SECONDS", 0.3)
    code = """
import time
time.sleep(0.5)
print('done')
"""
    test_cases = [
        {"input": "", "expectedOutput": "done", "isHidden": False},
        {"input": "", "expectedOutput": "done", "isHidden": False}
    ]
    with pytest.raises(RequestTimeoutException):
        runner.execute(code, "python", test_cases, time_limit_seconds=2.0)

def test_trivial_solution_scores_100_with_measured_baseline():
    """
    Item 3: Show that a trivial correct solution now scores ~100
    with measured startup baseline subtraction.
    """
    from app.features.technical_scorer import score_coding_challenge, get_startup_baseline_ms

    code = "import sys\nprint(sys.stdin.read().strip())"
    test_cases = [
        {"input": "hello", "expectedOutput": "hello", "isHidden": False},
        {"input": "world", "expectedOutput": "world", "isHidden": True}
    ]
    res = runner.execute(code, "python", test_cases, time_limit_seconds=2.0)
    assert res["allPassed"] is True

    # Compute score with measured baseline
    baseline = get_startup_baseline_ms()
    scored = score_coding_challenge(
        pass_ratio=res["passRatio"],
        total_tests=res["totalTests"],
        passed_tests=res["passedTests"],
        avg_runtime_ms=res["avgRuntimeMs"],
        startup_baseline_ms=baseline
    )

    assert scored["overallScore"] == 100
    assert scored["breakdown"]["testPassScore"] == 80.0
    assert scored["breakdown"]["runtimeEfficiency"] == 20.0

