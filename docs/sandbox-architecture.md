# Sandbox Architecture

> **Architectural Reconciliation Note (Week 3)**:
> In this repository, the term "Sandbox" has two distinct contexts:
> 1. **Device Pre-Check Sandbox (Weeks 1 & 2)**: Hardware verification for browser audio/video input before mock interviews.
> 2. **Code Execution Sandbox (Weeks 3 & 5)**: Secure execution of candidate-submitted code against test cases.
>
> This document details both systems, their interface boundaries, and the evolutionary path from Week 3's interim runner to Week 5's Docker container sandbox.

---

## Part 1: Device Pre-Check Sandbox (Hardware Testing)

### 1. Purpose
Allows candidates to test their hardware and verify that the ML service can correctly process their audio feed before initiating an actual recorded interview.

### 2. Frontend Integration
The sandbox UI accesses the candidate's local media devices via `navigator.mediaDevices.getUserMedia()`.
- **MediaRecorder API**: Used to capture short (e.g., 5-second) bursts of audio.
- **Webcam Preview**: Live `<video>` element for user self-preview only (video is strictly never recorded or uploaded per ADR-007).
- **HTTP Transport**: Instead of WebSockets, the frontend sends audio blobs via `POST /api/v1/recordings` to the backend gateway.

### 3. Backend & ML Processing
- **Backend**: Validates MIME type and file size, converts to 16kHz WAV, proxies to ML service.
- **ML Service**: Stateless computation returning RMS energy, pitch, silence stats, and mock confidence.

---

## Part 2: Code Execution Sandbox Architecture (Week 3 & Week 5)

The code execution subsystem evaluates candidate-submitted source code against deterministic test cases using a standard **stdin / stdout** protocol.

### 1. The Swappable `CodeRunner` Interface
To decouple API endpoints from the underlying execution runtime, all code evaluation runs through an abstract Python base class:

```python
class CodeRunner(ABC):
    @abstractmethod
    def execute(
        self,
        code: str,
        language: str,
        test_cases: List[TestCase],
        time_limit_seconds: float = 3.0
    ) -> ExecutionResult:
        pass
```

### 2. Week 3 Implementation: `SubprocessCodeRunner` (Interim Runner)
In Week 3, code execution is performed locally via Python's `subprocess` module:
- **Execution Protocol**: For each test case, test `input` is fed to child process `stdin`. Output is read from `stdout`, trimmed, and compared against `expectedOutput`.
- **Interim Runner Limits & Security Posture**:

| Dimension | What IS Enforced (Week 3 Mitigations) | What IS NOT Guaranteed (Documented Limitations) |
|---|---|---|
| **Execution Time** | Strict wall-clock timeout (default 3.0s, max 10.0s). The child process and its process tree are terminated with `kill()` on timeout to eliminate orphans. | Instruction cycle counting or kernel CPU scheduling quotas. |
| **Output Volume** | Maximum output buffer limit of 10KB (10,240 bytes). Stdout exceeding 10KB is truncated to prevent buffer flooding. | Protection against rapid memory allocation before output cap triggers. |
| **Filesystem & Host Access** | Runs in an ephemeral directory (`tempfile.TemporaryDirectory()`) deleted in `finally`. | **No filesystem jail**: Code can read any file the OS user running the ML service can read (only the working directory is isolated). Host read protection is deferred to Week 5. |
| **Environment & Flag** | Executed using `python -I` (isolated mode: ignores `PYTHONPATH`, user site-packages, and script dir). Stripped env (`PATH`, `SYSTEMROOT` only). | Syscall filtering (no seccomp/eBPF). |
| **AST Import Denylist** | Best-effort AST syntax analysis rejecting imports of `os`, `subprocess`, `socket`, `ctypes`, `shutil`, and calls to `open`. | **Documented as bypassable** (e.g. via dynamic reflection `__builtins__`, `getattr`, or string obfuscation). Hard isolation requires Week 5 containerization. |
| **Memory Limiting** | **Not enforced in Week 3**. (Windows lacks POSIX `resource.setrlimit`, and process polling introduces race conditions). | Hard OS memory caps. Hard memory caps are enforced via Docker `--memory 128m` cgroups in Week 5. |
| **Network** | Stripped environment prevents inherited proxy credentials. | Kernel-level network packet drops or network namespace isolation. |
| **Runner Gating & Binding**| Gated behind `ENABLE_INTERIM_RUNNER` env var (default: `false`; `true` in dev config/.env.example). If disabled, `evaluate-code` returns HTTP 503 (`INTERIM_RUNNER_DISABLED`). ML service binds to `127.0.0.1` by default. | Internet-facing multi-tenant untrusted execution. |
| **Hidden Redaction** | ML Service redacts `input`, `expectedOutput`, and `actualOutput` (`null`) for all hidden test cases (`isHidden: true`) directly in its own responses. | Zero information leakage on execution timing. |
| **Language Support** | **Python 3 only** in Week 3. | Multi-language sandboxing (JavaScript execution via Node is a documented stretch goal). |

### 3. Week 5 Target: `DockerCodeRunner` (Isolated Production Sandbox)
In Week 5, `DockerCodeRunner` will implement the `CodeRunner` interface without modifying controller or API logic:
- Ephemeral Docker containers spun up per submission (or warm container pool).
- Kernel isolation via Linux namespaces and cgroups:
  - `--network none`: Complete physical network disablement.
  - `--memory 128m --memory-swap 128m`: Kernel-enforced OOM termination.
  - `--cpus 1.0`: Strict CPU core allocation.
  - `--read-only`: Read-only container rootfs with isolated tmpfs mount.
  - Non-root user execution (`--user 1000:1000`) and dropped capabilities (`--cap-drop ALL`).
