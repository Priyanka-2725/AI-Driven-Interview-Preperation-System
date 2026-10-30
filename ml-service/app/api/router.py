from fastapi import APIRouter
from app.api.endpoints import audio
from app.api.endpoints import evaluate
from app.api.endpoints import assessment

api_router = APIRouter()
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
api_router.include_router(evaluate.router, tags=["evaluate"])
api_router.include_router(assessment.router, prefix="/assessment", tags=["assessment"])
