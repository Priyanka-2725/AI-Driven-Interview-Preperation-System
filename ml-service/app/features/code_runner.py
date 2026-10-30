import abc
import ast
import os
import subprocess
import sys
import tempfile
import time
from typing import List, Dict, Any, Optional

from app.core.exceptions import (
    CodeExecutionBlockedException,
    UnsupportedLanguageException,
    InvalidTestCasesException,
    RequestTimeoutException
)

DENYLIST_MODULES = {"os", "subprocess", "socket", "ctypes", "shutil"}
DENYLIST_BUILTINS = {"open"}
MAX_OUTPUT_BYTES = 10240  # 10 KB
MAX_CUMULATIVE_TIMEOUT_SECONDS = 30.0  # Cumulative request timeout cap

def kill_process_tree(proc: subprocess.Popen) -> None:
    """Terminates process and any spawned child processes using psutil and platform fallbacks."""
    try:
        import psutil
        parent = psutil.Process(proc.pid)
        for child in parent.children(recursive=True):
            try:
                child.kill()
            except Exception:
                pass
        parent.kill()
    except Exception:
        pass

    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True,
                check=False
            )
        proc.kill()
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

def check_ast_security(code: str) -> None:
    """
    Best-effort AST check to reject direct imports of sensitive modules
    and sensitive builtin function calls.
    Documented as bypassable (hard isolation deferred to Week 5 Docker container).
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # If code has syntax errors, let execution run so the runner captures the syntax error cleanly
        return

    for node in ast.walk(tree):
        # Check imports: import os, import subprocess, etc.
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod_name = alias.name.split(".")[0]
                if mod_name in DENYLIST_MODULES:
                    raise CodeExecutionBlockedException(
                        f"Importing '{alias.name}' is prohibited by security policy."
                    )
        # Check from imports: from os import path, etc.
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                mod_name = node.module.split(".")[0]
                if mod_name in DENYLIST_MODULES:
                    raise CodeExecutionBlockedException(
                        f"Importing from '{node.module}' is prohibited by security policy."
                    )
        # Check direct calls to open()
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in DENYLIST_BUILTINS:
                    raise CodeExecutionBlockedException(
                        f"Calling '{node.func.id}()' is prohibited by security policy."
                    )

class CodeRunner(abc.ABC):
    @abc.abstractmethod
    def execute(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        time_limit_seconds: float = 3.0,
        visible_only: bool = False
    ) -> Dict[str, Any]:
        """Executes code against test cases and returns structured evaluation results."""
        pass

class SubprocessCodeRunner(CodeRunner):
    """
    Interim code runner executing Python code via subprocess with python -I,
    stripped environment, AST denylist filter, and stdin/stdout matching.
    """

    def execute(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        time_limit_seconds: float = 3.0,
        visible_only: bool = False
    ) -> Dict[str, Any]:
        if language.lower() != "python":
            raise UnsupportedLanguageException(language)

        if not test_cases:
            raise InvalidTestCasesException("Test cases list cannot be empty.")

        # Filter if visible_only requested
        target_tests = [t for t in test_cases if not (visible_only and t.get("isHidden", False))]
        if not target_tests:
            raise InvalidTestCasesException("No visible test cases available for execution.")

        # 1. AST Security Analysis
        check_ast_security(code)

        # 2. Ephemeral Temporary Directory Execution
        temp_dir = tempfile.mkdtemp(prefix="interim_run_")
        script_path = os.path.join(temp_dir, "solution.py")
        
        try:
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Minimal stripped environment
            env = {}
            for k in ("PATH", "SYSTEMROOT", "SystemDrive", "TEMP", "TMP"):
                if k in os.environ:
                    env[k] = os.environ[k]

            results = []
            timeout_limit = min(max(time_limit_seconds, 0.5), 10.0)
            request_start_time = time.perf_counter()

            for idx, tc in enumerate(target_tests):
                if (time.perf_counter() - request_start_time) > MAX_CUMULATIVE_TIMEOUT_SECONDS:
                    raise RequestTimeoutException(
                        f"Cumulative execution time exceeded the request limit of {MAX_CUMULATIVE_TIMEOUT_SECONDS}s."
                    )

                inp = tc.get("input", "")
                expected = str(tc.get("expectedOutput", "")).strip()
                is_hidden = bool(tc.get("isHidden", False))

                start_time = time.perf_counter()
                passed = False
                error = None
                actual_output = None
                runtime_ms = 0.0

                try:
                    proc = subprocess.Popen(
                        [sys.executable, "-I", "solution.py"],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        cwd=temp_dir,
                        env=env,
                        text=True
                    )

                    stdout_data, stderr_data = proc.communicate(
                        input=inp,
                        timeout=timeout_limit
                    )
                    end_time = time.perf_counter()
                    runtime_ms = round((end_time - start_time) * 1000.0, 2)

                    # Output buffer cap (10 KB)
                    if len(stdout_data.encode("utf-8")) > MAX_OUTPUT_BYTES:
                        # Truncate at 10KB
                        stdout_data = stdout_data.encode("utf-8")[:MAX_OUTPUT_BYTES].decode("utf-8", errors="ignore")

                    actual_output = stdout_data.strip()
                    stderr_stripped = stderr_data.strip()

                    if proc.returncode != 0:
                        passed = False
                        error = stderr_stripped if stderr_stripped else f"Process exited with code {proc.returncode}"
                    else:
                        if actual_output == expected:
                            passed = True
                            error = None
                        else:
                            passed = False
                            error = "Wrong Answer"

                except subprocess.TimeoutExpired:
                    end_time = time.perf_counter()
                    runtime_ms = round(timeout_limit * 1000.0, 2)
                    kill_process_tree(proc)
                    passed = False
                    error = "timeout"
                    actual_output = ""
                except Exception as ex:
                    end_time = time.perf_counter()
                    runtime_ms = round((end_time - start_time) * 1000.0, 2)
                    kill_process_tree(proc)
                    passed = False
                    error = str(ex)
                    actual_output = ""

                # Redact hidden test details directly in ML service response (Condition E)
                if is_hidden:
                    result_entry = {
                        "testIndex": idx,
                        "passed": passed,
                        "runtimeMs": runtime_ms,
                        "input": None,
                        "expectedOutput": None,
                        "actualOutput": None,
                        "error": error,
                        "isHidden": True
                    }
                else:
                    result_entry = {
                        "testIndex": idx,
                        "passed": passed,
                        "runtimeMs": runtime_ms,
                        "input": inp,
                        "expectedOutput": expected,
                        "actualOutput": actual_output,
                        "error": error,
                        "isHidden": False
                    }
                results.append(result_entry)

            total_tests = len(results)
            passed_tests = sum(1 for r in results if r["passed"])
            failed_tests = total_tests - passed_tests
            pass_ratio = round(passed_tests / total_tests, 4) if total_tests > 0 else 0.0
            all_passed = (failed_tests == 0 and total_tests > 0)
            avg_runtime_ms = round(sum(r["runtimeMs"] for r in results) / total_tests, 2) if total_tests > 0 else 0.0

            return {
                "allPassed": all_passed,
                "passRatio": pass_ratio,
                "totalTests": total_tests,
                "passedTests": passed_tests,
                "failedTests": failed_tests,
                "avgRuntimeMs": avg_runtime_ms,
                "results": results
            }

        finally:
            # Ephemeral temp directory cleanup
            try:
                for root, dirs, files in os.walk(temp_dir, topdown=False):
                    for name in files:
                        os.remove(os.path.join(root, name))
                    for name in dirs:
                        os.rmdir(os.path.join(root, name))
                os.rmdir(temp_dir)
            except Exception:
                pass
