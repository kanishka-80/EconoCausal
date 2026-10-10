from fastapi import FastAPI
from backend.app.api.router import api_router
from backend.app.config import settings


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    application.include_router(api_router, prefix=settings.api_prefix)
    return application


app = create_app()
