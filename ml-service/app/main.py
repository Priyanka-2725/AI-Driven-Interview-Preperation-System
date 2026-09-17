from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.router import api_router
from app.api.endpoints import health

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check at root and /health
    app.include_router(health.router)
    
    # API endpoints
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app

app = create_app()
