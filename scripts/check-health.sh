#!/bin/bash

echo "Checking ML Service (http://127.0.0.1:8000/health)..."
curl -s http://127.0.0.1:8000/health || echo "ML Service is DOWN"

echo -e "\n\nChecking Backend Service (http://localhost:5000/api/v1/system/health)..."
curl -s http://localhost:5000/api/v1/system/health || echo "Backend is DOWN"

echo -e "\n\nChecking Frontend Service (http://localhost:5173)..."
curl -s -I http://localhost:5173 | head -n 1 || echo "Frontend is DOWN"

echo -e "\n\nHealth check complete."
