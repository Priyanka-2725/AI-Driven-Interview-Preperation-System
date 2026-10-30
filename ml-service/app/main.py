import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.router import api_router
from app.api.endpoints import health
from app.features.technical_scorer import get_startup_baseline_ms

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Condition 2: Cache measured startup baseline once per process and log at startup
    baseline = get_startup_baseline_ms()
    logger.info(f"Subprocess code runner startup baseline measured & cached: {baseline:.1f}ms")
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
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
