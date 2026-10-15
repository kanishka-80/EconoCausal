from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.router import api_router
from backend.app.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=getattr(settings, "app_name", getattr(settings, "APP_NAME", "EconoCausal API")),
        version=getattr(settings, "app_version", getattr(settings, "APP_VERSION", "0.1.0")),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    prefix = getattr(settings, "api_prefix", getattr(settings, "API_PREFIX", "/api"))

    # Configure CORS for frontend dev servers
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=prefix)
    return app


app = create_app()
