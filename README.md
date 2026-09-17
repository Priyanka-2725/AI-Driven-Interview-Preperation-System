# AI Interview Coach

Status: Week 1 — Foundation complete.

AI Interview Coach is a three-service application designed to evaluate user interviews across confidence, fluency, and technical accuracy.

## What This System Does

**Confidence Evaluation**
Evaluates visual confidence cues during the interview. It measures eye contact via eye aspect ratio, blinking patterns, and head pose (yaw/pitch/roll) to heuristically gauge if the candidate maintains a steady, engaged presence.

**Fluency Evaluation**
Analyzes the audio track to measure speaking fluency. It calculates words per minute (WPM), counts filler words, and detects awkward pauses using RMS silence gating to provide feedback on pacing and delivery.

**Technical Evaluation**
Evaluates the candidate's answers against a golden baseline for technical accuracy. It uses a Siamese bi-encoder to compute semantic similarity, extracts asymptotic complexities (e.g., O(n), O(1)), and verifies required concepts via TF-IDF concept graphs.

## Build-From-Scratch Policy

This project strictly adheres to a build-from-scratch policy.

**FORBIDDEN — no exceptions:**
- Any hosted AI API: OpenAI, Anthropic, Google Gemini, Cohere, Hugging Face Inference API, AssemblyAI, Deepgram, Azure Cognitive Services, AWS Transcribe/Rekognition.
- Any LLM used as a scorer, grader, or judge.
- Any paid or metered third-party scoring/analysis SaaS.
- Any API_KEY for an external AI vendor in `.env`, `.env.example`, or code comments.
- Auth-as-a-service (Firebase Auth, Auth0, Clerk, Supabase). Authentication is hand-written with jsonwebtoken and bcrypt.
- Pre-built UI kits that own the design system (MUI, Chakra, Ant Design, shadcn/ui, DaisyUI). Components are hand-written with Tailwind utility classes.

**PERMITTED:**
- Open-source libraries that run locally on our own hardware: librosa, numpy, scipy, opencv-python, soundfile, scikit-learn, dlib, faster-whisper, torch, spaCy.
- Pretrained open weights that we download and run offline (Whisper weights, Dlib's shape_predictor_68_face_landmarks.dat, sentence-transformer weights). These are permitted because inference is local and free.

Every feature extractor, scoring formula, threshold, aggregation rule, and decision boundary is written by us, in our repo, with the maths visible in the code. We may use a library to get a spectrogram; we may not use a library that returns "confidence: 7.4/10".

## Architecture Overview

```text
+-------------------+        +-------------------+        +-------------------+
|                   |        |                   |        |                   |
|     frontend/     |        |     backend/      |        |    ml-service/    |
| (React/Vite)      +------->+ (Node/Express)    +------->+ (Python/FastAPI)  |
| Port 5173         | HTTP   | Port 5000         | HTTP   | Port 8000         |
|                   |        |                   |        |                   |
+-------------------+        +-------------------+        +-------------------+
```

- **ADR-001:** The backend is split between an Express gateway/orchestrator (Member 2) and a Python FastAPI stateless computation service (Members 3 & 4), overriding the originally proposed single FastAPI monolith with Celery/Redis/PostgreSQL.
- **ADR-002:** MongoDB with Mongoose is the only database utilized across the system.
- **ADR-003:** Facial landmark extraction utilizes Dlib's 68-point predictor with OpenCV solvePnP for head pose, to be installed in Week 2.

## Technology Stack

| Layer | Technology | Version | Why We Chose It |
|---|---|---|---|
| Frontend | React + Vite | 18.3.1 / 5.4.1 | Fast local development and robust type-safe UI construction. |
| Backend API | Node.js + Express | 20.x / 4.19.2 | Excellent orchestration capabilities, async handling, and ecosystem. |
| Database | MongoDB + Mongoose | 7.x / 8.5.1 | Flexible document storage matching our JSON-heavy payload requirements. |
| ML Service | Python + FastAPI | 3.11.x / 0.115.0 | Best-in-class support for scientific computing (numpy, librosa, opencv) and async APIs. |
| Styling | Tailwind CSS | 3.4.10 | Enforces a strict, custom design system from scratch without pre-built UI library bloat. |

## Repository Map

### Folders

| Path | Responsibility | Owner |
|---|---|---|
| `docs/` | Technical documentation and architectural decisions. | All Members |
| `scripts/` | Developer utility scripts for booting and health checks. | All Members |
| `frontend/` | React single-page application and browser media capture. | Member 1 |
| `frontend/src/` | Frontend source code root. | Member 1 |
| `frontend/src/config/` | Environment variables and configuration logic. | Member 1 |
| `frontend/src/routes/` | Application routing definitions. | Member 1 |
| `frontend/src/pages/` | Top-level React page components. | Member 1 |
| `frontend/src/components/` | Reusable React components. | Member 1 |
| `frontend/src/components/layout/` | Shell, navigation, and core layout components. | Member 1 |
| `frontend/src/components/ui/` | Primitive UI components (buttons, inputs, cards). | Member 1 |
| `frontend/src/context/` | React context providers (e.g., Auth). | Member 1 |
| `frontend/src/hooks/` | Custom React hooks. | Member 1 |
| `frontend/src/services/` | API clients and external communication layers. | Member 1 |
| `frontend/src/types/` | TypeScript interfaces and type definitions. | Member 1 |
| `frontend/src/utils/` | Helper functions and pure utility logic. | Member 1 |
| `backend/` | Express API gateway, database models, and auth server. | Member 2 |
| `backend/src/` | Backend source code root. | Member 2 |
| `backend/src/config/` | Environment, database connections, and constants. | Member 2 |
| `backend/src/models/` | Mongoose schema definitions. | Member 2 |
| `backend/src/controllers/` | Request handlers and HTTP logic. | Member 2 |
| `backend/src/services/` | Business logic and integrations (token, mlClient). | Member 2 |
| `backend/src/routes/` | Express route definitions. | Member 2 |
| `backend/src/middleware/` | Express middleware (auth, validation, errors). | Member 2 |
| `backend/src/validators/` | Request validation schemas. | Member 2 |
| `backend/src/utils/` | Utility classes and helpers. | Member 2 |
| `ml-service/` | Python FastAPI application for ML computations. | Members 3 & 4 |
| `ml-service/app/` | ML Service source code root. | Members 3 & 4 |
| `ml-service/app/api/` | API routers and endpoints. | Members 3 & 4 |
| `ml-service/app/api/endpoints/` | Specific HTTP endpoint implementations. | Members 3 & 4 |
| `ml-service/app/core/` | Constants, exceptions, and core configuration. | Members 3 & 4 |
| `ml-service/app/schemas/` | Pydantic validation models. | Members 3 & 4 |
| `ml-service/app/features/` | Signal processing and math computations. | Members 3 & 4 |
| `ml-service/tests/` | Pytest test suites. | Members 3 & 4 |

### Files: Root & Docs
| File | What It Contains | Depends On |
|---|---|---|
| `README.md` | Primary entry point and architectural overview of the project. | None |
| `.gitignore` | Standard git exclusions for node, python, environment, and OS files. | None |
| `.editorconfig` | Cross-editor formatting rules. | None |
| `.nvmrc` | Pins Node.js version to 20.x. | None |
| `docs/architecture.md` | Detailed architectural decisions, data flows, and ADRs. | None |
| `docs/api-contracts.md` | Comprehensive endpoint contracts with request/response schemas and errors. | None |
| `docs/database-schema.md` | Mongoose schema documentation, including the Week 1 User model. | None |
| `docs/ml-feature-notes.md` | Formulas, thresholds, and theoretical basis for audio/visual evaluation logic. | None |
| `docs/technical-scoring-design.md` | Detailed design for the Siamese bi-encoder technical evaluation pipeline. | None |
| `docs/sandbox-architecture.md` | Docker-based isolated code execution sandbox security constraints and flow. | None |
| `docs/setup-guide.md` | Step-by-step local development setup instructions across all OSs. | None |
| `docs/week1-report.md` | End-of-week status report, completion tracking, and blockers. | None |
| `scripts/dev-all.sh` | Bash script to boot all three services concurrently with color-coded logging. | None |
| `scripts/check-health.sh` | Bash script verifying the readiness of all three endpoints. | None |

### Files: Frontend
| File | What It Contains | Depends On |
|---|---|---|
| `frontend/package.json` | Dependencies, scripts, and package metadata. | None |
| `frontend/vite.config.ts` | Vite bundler configuration. | None |
| `frontend/tsconfig.json` | TypeScript compiler options. | None |
| `frontend/tailwind.config.js` | Custom design system tokens and color palette. | None |
| `frontend/postcss.config.js` | PostCSS configuration for Tailwind integration. | None |
| `frontend/index.html` | Entry HTML file and Google Fonts inclusion. | None |
| `frontend/.env.example` | Template for required frontend environment variables. | None |
| `frontend/.eslintrc.cjs` | ESLint configuration for React and TypeScript. | None |
| `frontend/src/main.tsx` | React DOM rendering entry point. | `App.tsx`, `index.css` |
| `frontend/src/App.tsx` | Root component wrapping contexts and router. | `AppRoutes.tsx`, `AuthContext.tsx` |
| `frontend/src/index.css` | Global styles injecting Tailwind directives. | None |
| `frontend/src/vite-env.d.ts` | Vite environment type declarations. | None |
| `frontend/src/config/env.ts` | Environment variable validation and central export. | None |
| `frontend/src/routes/AppRoutes.tsx` | Route definitions mapping paths to page components. | Pages, `ProtectedRoute.tsx` |
| `frontend/src/routes/ProtectedRoute.tsx` | Route wrapper redirecting unauthenticated users to login. | `AuthContext.tsx` |
| `frontend/src/pages/LandingPage.tsx` | Public marketing and feature explanation page. | UI components |
| `frontend/src/pages/LoginPage.tsx` | User authentication form page. | `AuthContext.tsx`, UI components |
| `frontend/src/pages/RegisterPage.tsx` | New user account creation page. | `AuthContext.tsx`, UI components |
| `frontend/src/pages/DashboardPage.tsx` | Protected user dashboard with system status indicators. | `AppShell.tsx`, `useSystemHealth.ts` |
| `frontend/src/pages/NotFoundPage.tsx` | 404 error page. | UI components |
| `frontend/src/components/layout/AppShell.tsx` | Master layout wrapper containing navigation elements. | `Navbar.tsx`, `Sidebar.tsx` |
| `frontend/src/components/layout/Navbar.tsx` | Top navigation bar with branding and user actions. | `AuthContext.tsx` |
| `frontend/src/components/layout/Sidebar.tsx` | Side navigation drawer for application sections. | None |
| `frontend/src/components/layout/Footer.tsx` | Application footer component. | None |
| `frontend/src/components/ui/Button.tsx` | Styled, accessible button primitive with loading states. | None |
| `frontend/src/components/ui/Input.tsx` | Styled, accessible text input primitive with validation states. | None |
| `frontend/src/components/ui/Card.tsx` | Container primitive utilizing shadow and border tokens. | None |
| `frontend/src/components/ui/Alert.tsx` | Informational callout primitive for errors and warnings. | None |
| `frontend/src/components/ui/Spinner.tsx` | Loading indicator primitive. | None |
| `frontend/src/components/ui/StatusBadge.tsx` | Colored dot indicator for system health representation. | None |
| `frontend/src/context/AuthContext.tsx` | Global state provider for user session and authentication operations. | `apiClient.ts`, `authService.ts` |
| `frontend/src/hooks/useAuth.ts` | Convenience hook for accessing the Auth context. | `AuthContext.tsx` |
| `frontend/src/hooks/useSystemHealth.ts` | Hook polling backend health endpoints on an interval. | `systemService.ts` |
| `frontend/src/services/apiClient.ts` | Configured Axios instance with request IDs and 401 interceptors. | `env.ts`, `tokenStorage.ts` |
| `frontend/src/services/authService.ts` | API calls related to registration, login, and token refreshing. | `apiClient.ts` |
| `frontend/src/services/systemService.ts` | API calls for retrieving overall system health. | `apiClient.ts` |
| `frontend/src/types/auth.types.ts` | Interfaces for User objects, login payloads, and auth responses. | None |
| `frontend/src/types/api.types.ts` | Interfaces for standardized API response envelopes and errors. | None |
| `frontend/src/utils/validators.ts` | Client-side input validation matching backend rules. | None |
| `frontend/src/utils/tokenStorage.ts` | In-memory storage module for the access token to prevent XSS. | None |

### Files: Backend
| File | What It Contains | Depends On |
|---|---|---|
| `backend/package.json` | Dependencies, scripts, and package metadata. | None |
| `backend/.env.example` | Template for required backend environment variables. | None |
| `backend/.eslintrc.cjs` | ESLint configuration for Node.js. | None |
| `backend/nodemon.json` | Watcher configuration for local development. | None |
| `backend/src/server.js` | Entry point handling server boot and teardown. | `app.js`, `database.js` |
| `backend/src/app.js` | Express application setup, middleware composition, and route mounting. | Middleware, Routes |
| `backend/src/config/env.js` | Zod schema validating and exporting environment variables. | None |
| `backend/src/config/database.js` | Mongoose connection logic. | `env.js` |
| `backend/src/config/constants.js` | Error codes and standard constants. | None |
| `backend/src/models/User.js` | Mongoose schema, bcrypt pre-save hook, and JSON transform for Users. | None |
| `backend/src/controllers/authController.js` | Express route handlers for registration, login, refresh, logout, and me. | `authService.js`, `tokenService.js` |
| `backend/src/controllers/systemController.js` | Express route handlers for health checks. | `mlClient.js` |
| `backend/src/services/authService.js` | Business logic for user creation and authentication. | `User.js` |
| `backend/src/services/tokenService.js` | Logic for generating, verifying, and hashing JWT tokens. | `env.js` |
| `backend/src/services/mlClient.js` | Axios instance handling communication with the ML service. | `env.js`, `ApiError.js` |
| `backend/src/routes/index.js` | Main router aggregating all modular routes. | `authRoutes.js`, `systemRoutes.js` |
| `backend/src/routes/authRoutes.js` | Route definitions for authentication endpoints. | `authController.js`, `authenticate.js` |
| `backend/src/routes/systemRoutes.js` | Route definitions for health endpoints. | `systemController.js` |
| `backend/src/middleware/authenticate.js` | Express middleware verifying JWT access tokens. | `tokenService.js`, `User.js` |
| `backend/src/middleware/validate.js` | Express middleware running Zod validation schemas against requests. | `ApiResponse.js` |
| `backend/src/middleware/errorHandler.js` | Global error handler constructing standardized ApiResponse structures. | `ApiError.js`, `logger.js` |
| `backend/src/middleware/notFound.js` | Fallback middleware responding with ROUTE_NOT_FOUND. | `ApiError.js` |
| `backend/src/middleware/requestId.js` | Middleware generating and attaching UUID v4 for request tracing. | None |
| `backend/src/validators/authValidators.js` | Zod schemas defining allowed registration and login payloads. | None |
| `backend/src/utils/ApiError.js` | Custom Error class storing specific error codes and details. | None |
| `backend/src/utils/ApiResponse.js` | Helper classes for standardizing JSON response envelopes. | None |
| `backend/src/utils/asyncHandler.js` | Wrapper forwarding async controller errors to express next(). | None |
| `backend/src/utils/logger.js` | Custom logger printing timestamped output reflecting LOG_LEVEL. | `env.js` |

### Files: ML Service
| File | What It Contains | Depends On |
|---|---|---|
| `ml-service/requirements.txt` | Explicitly pinned Python dependencies. | None |
| `ml-service/.env.example` | Template for required ML service environment variables. | None |
| `ml-service/pytest.ini` | Pytest runner configuration. | None |
| `ml-service/app/__init__.py` | Package marker. | None |
| `ml-service/app/main.py` | FastAPI application instantiation and CORS setup. | `router.py`, `logging_config.py` |
| `ml-service/app/config.py` | Environment variable validation via Pydantic BaseSettings. | None |
| `ml-service/app/api/__init__.py` | Package marker. | None |
| `ml-service/app/api/router.py` | Central API router mounting all endpoint modules. | `health.py`, `audio.py` |
| `ml-service/app/api/endpoints/__init__.py` | Package marker. | None |
| `ml-service/app/api/endpoints/health.py` | Root and version health check endpoints. | `config.py` |
| `ml-service/app/api/endpoints/audio.py` | Audio processing endpoint initiating feature extraction. | `audio_loader.py`, `energy.py`, `pitch.py` |
| `ml-service/app/core/__init__.py` | Package marker. | None |
| `ml-service/app/core/constants.py` | Global maths thresholds and constants. | None |
| `ml-service/app/core/exceptions.py` | Custom exception classes for ML pipeline failures. | None |
| `ml-service/app/core/logging_config.py` | Standardized Python logger setup. | None |
| `ml-service/app/schemas/__init__.py` | Package marker. | None |
| `ml-service/app/schemas/common.py` | Shared Pydantic models for responses and errors. | None |
| `ml-service/app/schemas/audio.py` | Pydantic response models for extracted audio features. | None |
| `ml-service/app/features/__init__.py` | Package marker. | None |
| `ml-service/app/features/audio_loader.py` | Function resolving audio files into numpy arrays. | `constants.py` |
| `ml-service/app/features/energy.py` | Functions calculating RMS and gating silent segments. | `constants.py` |
| `ml-service/app/features/pitch.py` | Functions calculating fundamental frequency and voiced ratios. | `constants.py` |
| `ml-service/app/features/geometry.py` | Math functions for Euclidean distance and Eye Aspect Ratio. | `constants.py` |
| `ml-service/tests/__init__.py` | Package marker. | None |
| `ml-service/tests/test_health.py` | Tests ensuring the ML service boots and replies 200. | `health.py` |
| `ml-service/tests/test_energy.py` | Synthetic tests for RMS computation and silence detection. | `energy.py` |
| `ml-service/tests/test_pitch.py` | Synthetic tests evaluating pitch estimation accuracy. | `pitch.py` |
| `ml-service/tests/test_geometry.py` | Tests asserting accuracy of EAR formulas on artificial polygons. | `geometry.py` |

## Getting Started

### Prerequisites
- Node.js 20.x
- npm 10.x
- Python 3.11.x
- MongoDB 7.x

### 1. Database Setup
Ensure MongoDB is running locally on port 27017:
`mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with secure JWT secrets
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. ML Service Setup
```bash
cd ml-service
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 5. Running All Services
From the root directory:
```bash
./scripts/dev-all.sh
```

### 6. Verification
To verify the system is running correctly:
```bash
./scripts/check-health.sh
```
Expected output:
```
[ML-SERVICE] GET http://localhost:8000/health -> 200 OK
[BACKEND] GET http://localhost:5000/api/v1/system/health -> 200 OK (Database: connected)
[BACKEND] GET http://localhost:5000/api/v1/system/ml-health -> 200 OK (ML Service: online)
```

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Required | Example | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api/v1` | URL of the backend API gateway. |
| `VITE_APP_NAME` | Yes | `AI Interview Coach` | Used in the UI. |

### Backend (`backend/.env`)
| Variable | Required | Example | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Server environment (development/production). |
| `PORT` | Yes | `5000` | Port for the Express server. |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/ai_interview_coach` | MongoDB connection string. |
| `JWT_ACCESS_SECRET` | Yes | `64_char_random_hex` | Key to sign access tokens. |
| `JWT_REFRESH_SECRET` | Yes | `another_64_char_random_hex` | Key to sign refresh tokens. |
| `JWT_ACCESS_EXPIRY` | Yes | `15m` | Access token lifespan. |
| `JWT_REFRESH_EXPIRY` | Yes | `7d` | Refresh token lifespan. |
| `BCRYPT_SALT_ROUNDS` | Yes | `12` | Rounds for password hashing. |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed frontend origin. |
| `ML_SERVICE_URL` | Yes | `http://127.0.0.1:8000` | URL of the internal ML service. |
| `ML_SERVICE_TIMEOUT_MS` | Yes | `10000` | Timeout for requests to the ML service. |
| `LOG_LEVEL` | Yes | `debug` | Logging verbosity (debug, info, warn, error). |

### ML Service (`ml-service/.env`)
*(No required `.env` variables specified in Week 1, standard setup placeholder)*

## API Reference

| Method | Path | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Creates a new user account. |
| `POST` | `/api/v1/auth/login` | No | Authenticates user and sets session. |
| `POST` | `/api/v1/auth/refresh` | Cookie | Rotates refresh token and issues new access token. |
| `POST` | `/api/v1/auth/logout` | Yes | Destroys current user session. |
| `GET` | `/api/v1/auth/me` | Yes | Returns current authenticated user. |
| `GET` | `/api/v1/system/health` | No | Returns backend and database health. |
| `GET` | `/api/v1/system/ml-health` | No | Returns health of ML service via backend. |
| `GET` | `/health` (ML) | No | Returns ML service status. |
| `GET` | `/api/v1/version` (ML) | No | Returns ML Python environment details. |
| `POST` | `/api/v1/audio/features` (ML) | No | Extracts Week 1 metrics from `.wav` upload. |

Full API request and response schemas can be found in `docs/api-contracts.md`.

## Testing

### Backend
```bash
cd backend
npm run test
```

### ML Service
```bash
cd ml-service
pytest
```

## Week-by-Week Roadmap

| Week | Phase | Focus | Status |
|---|---|---|---|
| 1 | Foundation | Monorepo scaffolding, Authentication, ML audio extraction skeleton. | Complete |
| 2 | Vision & Recording | MediaRecorder integration, Dlib landmarks, head pose calculations. | Planned |
| 3 | Audio & ASR | Audio extraction pipelines, Whisper transcriptions, fluency metrics. | Planned |
| 4 | Technical Scoring | Siamese bi-encoder inference, TF-IDF concept extraction. | Planned |
| 5 | Code Sandbox | Docker-based isolated code execution. | Planned |
| 6 | Feedback Aggregation | Scoring logic, overall analytics, UI polish. | Planned |
| 7 | Deployment | Production deployment, CI/CD, final testing. | Planned |

## Team

| Member | Role | Week 1 Scope |
|---|---|---|
| Member 1 | Frontend Lead | React scaffold, UI primitives, routing, Auth pages. |
| Member 2 | Backend Lead | Express server, Auth flow, DB models, system routes. |
| Member 3 | ML Engineer (Vision) | ML FastAPI setup, geometry features, tests. |
| Member 4 | ML Engineer (Audio/NLP) | Audio features, RMS/Pitch logic, tests. |

## Troubleshooting

- **MongoDB connection refused**: Ensure MongoDB service is running locally on port 27017. Restart via `brew services restart mongodb-community` (macOS) or system services (Windows/Linux).
- **Port already in use**: A previous process is holding a port. Use `lsof -i :5000` or `netstat -ano` to find the PID and kill it.
- **Python version mismatch**: The ML service requires exactly Python 3.11.x due to `numba`/`librosa` limitations. Do not use 3.12 or 3.13.
- **CORS error**: Ensure the frontend is running on `http://localhost:5173` and `CORS_ORIGIN` in the backend `.env` matches exactly.
- **401 loop on refresh**: Ensure cookies are enabled and no browser extensions are blocking the `refreshToken` cookie. Clear application storage and login again.
