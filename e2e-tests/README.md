# End-to-End (E2E) Test Suite

This directory contains automated browser-driven E2E tests using Puppeteer to validate the complete candidate experience and error recovery workflows.

## Test Suites

1. **`test_phase4_flow.js`**:
   - Authentication (Registration / Login)
   - Topic browsing & workspace navigation (`/technical/workspace/two-sum`)
   - Non-graded test execution (`Run Visible Tests`)
   - Graded submission (`Submit Solution`)
   - Results page rendering and hidden test privacy verification (no secret inputs/outputs leaked)
   - Assessment history and attempt review (`/technical/attempts`)
   - **ML-Down Simulation & Retry Flow**: Targets and stops the process listening specifically on port 8000, triggers a submission to verify the HTTP 503 banner and "Retry Evaluation" button, restarts the ML service, clicks Retry, and verifies the submission recovers to `status: "evaluated"`.
   - **Correct Solution Submission**: Submits an optimal $O(N)$ Two Sum solution with ML up, confirming 100% test pass rate and proper rendering of `"Hidden test passed"`.

2. **`test_week2_recording.js`**:
   - Behavioral practice flow (`/record`)
   - Audio/video device permissions (via fake media streams)
   - Recording lifecycle (start, timer check, stop, audio preview)
   - Multipart audio upload (`/api/v1/recordings`)
   - Whisper transcription & librosa fluency analysis
   - Results display (`/results/:id`)

## Environment Variables

All base URLs and candidate credentials are parameterized via environment variables:

| Variable | Default | Description |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:5174` | Base URL of Vite frontend dev server |
| `BACKEND_URL` | `http://localhost:5000` | Base URL of Express backend API |
| `ML_URL` | `http://127.0.0.1:8000` | Base URL of FastAPI ML service |
| `TEST_USER_EMAIL` | Dynamic timestamped email | Candidate test account email |
| `TEST_USER_PASSWORD` | `Password123!` | Candidate test account password |
| `TEST_USER_NAME` | `E2E Candidate` | Candidate test account display name |

## Important Notice

The ML-down test in `test_phase4_flow.js` stops and restarts the local ML service on port 8000. Ensure the ML service virtual environment exists at `ml-service/.venv` before executing this suite.

