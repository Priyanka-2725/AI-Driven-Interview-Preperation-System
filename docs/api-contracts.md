# API Contracts

## Backend API Gateway (Port 5000)

### 1. `POST /api/v1/auth/register`
**Description:** Registers a new user account.
**Auth:** None
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-09-17T00:00:00.000Z"
    }
  },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```
*(Also sets `refreshToken` HTTP-only cookie)*

### 2. `POST /api/v1/auth/login`
**Description:** Authenticates a user.
**Auth:** None
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "accessToken": "jwt_string"
  },
  "meta": { "requestId": "uuid" }
}
```
*(Also sets `refreshToken` HTTP-only cookie)*

### 3. `POST /api/v1/auth/refresh`
**Description:** Rotates the refresh token and issues a new access token.
**Auth:** HTTP-only `refreshToken` Cookie
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "accessToken": "new_jwt_string" },
  "meta": { "requestId": "uuid" }
}
```

### 4. `POST /api/v1/auth/logout`
**Description:** Clears the refresh token cookie.
**Auth:** None (Cookie)
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "meta": { "requestId": "uuid" }
}
```

### 5. `GET /api/v1/auth/me`
**Description:** Returns the current authenticated user's profile.
**Auth:** Bearer Token (Access Token)
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com" },
  "meta": { "requestId": "uuid" }
}
```

### 6. `GET /api/v1/system/health`
**Description:** Verifies backend and database health.
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 123.45,
    "database": "connected",
    "version": "1.0.0"
  },
  "meta": { "requestId": "uuid" }
}
```

### 7. `GET /api/v1/system/ml-health`
**Description:** Proxies a health check to the internal ML service.
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backend": "online",
    "mlService": "online"
  },
  "meta": { "requestId": "uuid" }
}
```

---

## ML Service (Port 8000 - Internal)

### 1. `GET /health`
**Description:** Verifies ML service health.
**Success Response (200 OK):**
```json
{ "status": "ok" }
```

### 2. `GET /api/v1/version`
**Description:** Returns Python and ML environment details.
**Success Response (200 OK):**
```json
{
  "python_version": "3.10.11",
  "librosa_version": "0.10.2.post1",
  "numpy_version": "1.26.4"
}
```

### 3. `POST /api/v1/audio/features`
**Description:** Computes Week 1 metrics (RMS, Pitch, Silence gating).
**Request:** `multipart/form-data` with `file` (a `.wav` file).
**Success Response (200 OK):**
```json
{
  "durationSeconds": 2.5,
  "sampleRate": 16000,
  "rms": {
    "meanDb": -25.4,
    "minDb": -45.0,
    "maxDb": -10.0,
    "frameCount": 100
  },
  "silence": {
    "segmentCount": 1,
    "totalSilentSeconds": 0.5,
    "longestSilentSeconds": 0.5
  },
  "pitch": {
    "meanHz": 210.5,
    "stdHz": 15.2,
    "voicedRatio": 0.85
  }
}
```
