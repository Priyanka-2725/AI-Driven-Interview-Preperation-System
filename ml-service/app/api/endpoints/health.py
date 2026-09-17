import time
from fastapi import APIRouter
from app.config import settings

router = APIRouter()
START_TIME = time.time()

@router.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptimeSeconds": round(time.time() - START_TIME, 2)
    }

@router.get("/api/v1/version", tags=["system"])
async def get_version():
    import sys
    return {
        "version": settings.VERSION,
        "pythonVersion": sys.version.split(" ")[0],
        "dependencies": {
            "fastapi": "0.112.1",
            "librosa": "0.10.2"
        }
    }
