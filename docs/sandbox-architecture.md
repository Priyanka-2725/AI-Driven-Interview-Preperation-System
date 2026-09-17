# Sandbox Architecture

## Purpose
The Sandbox environment allows candidates to test their hardware and verify that the ML service can correctly process their audio/video feeds before initiating an actual recorded interview.

## 1. Frontend Integration
The sandbox UI accesses the candidate's local media devices via `navigator.mediaDevices.getUserMedia()`.
- **MediaRecorder API**: Used to capture short (e.g., 5-second) bursts of audio/video.
- **Polling**: Instead of WebSockets, the frontend sends binary blobs via POST requests to the backend proxy.

## 2. Backend Proxy Layer
The Node.js backend acts as a secure intermediary.
- Accepts `multipart/form-data` uploads.
- Validates file sizes and MIME types.
- Forwards the payload to the Python ML Service `HTTP POST /api/v1/audio/features`.

## 3. ML Service Processing
The Python service receives the payload synchronously.
- **Validation**: Rejects anything other than `.wav`.
- **Stateless Execution**: The ML service retains no state or memory of previous sandbox requests. It returns absolute feature arrays and scores for that specific clip.

## 4. Feedback Loop
- The backend relays the ML scores back to the frontend.
- The React UI parses `warnings` (e.g., "Too quiet", "Not facing camera") and provides visual cues to the user.
