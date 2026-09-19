# Week 1 Status Report

**Status:** Complete

## Objectives Met
- Monorepo scaffolded (Frontend React/Vite, Backend Node/Express, ML Service Python/FastAPI).
- Hand-rolled JWT Authentication system implemented with bcrypt hashing and HTTP-only refresh cookies. Circular dependencies resolved.
- Backend API Gateway pattern established.
- ML Service (Audio Evaluation) implemented with NumPy/librosa for from-scratch signal extraction (RMS energy, pyin-based pitch estimation, silence thresholding).
- E2E Integration and fault tolerance (503 handling) proven and verified on Windows with `.ps1` automation scripts.

## Architectural Decisions
- ADR-001: Backend Split (Node gateway + Python ML service).
- ADR-002: MongoDB database selection.
- ADR-004: Python 3.10.11 selected due to 3.11/3.12 availability/venv issues.
- ADR-005: `librosa.pyin` restored for raw voicing detection due to raw `yin`'s inability to isolate voiced periods without confidence thresholds. Downstream logic remains NumPy.

## Blockers Resolved
- Fixed CRLF/shell issues on Windows by creating native PowerShell scripts for health checks and stack booting.
- Fixed circular dependency between `apiClient` and `authService` in frontend token refresh logic.
- Resolved bcrypt truncation bug on 72+ character JWT signatures.

## Readiness for Week 2
The repository is fully stabilized and integrated. Phase 6 acceptance tests have passed. We are ready for Week 2 (Vision & Recording).
