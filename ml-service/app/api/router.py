from fastapi import APIRouter
from app.api.endpoints import audio
from app.api.endpoints import evaluate

api_router = APIRouter()
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
api_router.include_router(evaluate.router, tags=["evaluate"])
