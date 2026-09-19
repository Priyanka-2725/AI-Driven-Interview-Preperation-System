#!/bin/bash
set -e

echo "Starting ML Service..."
cd ml-service
source .venv/Scripts/activate
uvicorn app.main:app --port 8000 &
ML_PID=$!
cd ..

echo "Starting Backend Service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "Starting Frontend Service..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "All services started!"
echo "ML Service PID: $ML_PID"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

function cleanup() {
  echo "Shutting down all services..."
  kill -9 $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit
}

trap cleanup SIGINT SIGTERM

wait
