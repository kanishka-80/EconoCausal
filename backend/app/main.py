import logging
from typing import Any, List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.router import api_router
from backend.app.config import settings, setup_logging

setup_logging()
logger = logging.getLogger("econocausal.api")


def create_app() -> FastAPI:
    app = FastAPI(
        title=getattr(settings, "app_name", "EconoCausal API"),
        version=getattr(settings, "app_version", "0.1.0"),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    prefix = getattr(settings, "api_prefix", "/api")

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

    # 1. Standardized HTTPException handler (translates to contract error envelope)
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        logger.warning(f"HTTP exception on {request.method} {request.url.path}: status={exc.status_code}")

        if isinstance(exc.detail, dict):
            code = exc.detail.get("code", "BAD_REQUEST")
            message = exc.detail.get("message", "An error occurred processing the request.")
            details = exc.detail.get("details", [])
        else:
            code = "HTTP_ERROR"
            message = str(exc.detail)
            details = []

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error": {
                    "code": code,
                    "message": message,
                    "details": details if isinstance(details, list) else [details],
                },
            },
        )

    # 2. Schema validation error handler (FastAPI RequestValidationError -> HTTP 422)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        logger.warning(f"Validation error on {request.method} {request.url.path}: {len(exc.errors())} issues")
        clean_errors: List[str] = []
        for err in exc.errors():
            loc = " -> ".join(str(loc_item) for loc_item in err.get("loc", []))
            clean_errors.append(f"{loc}: {err.get('msg', 'invalid value')}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request payload validation failed.",
                    "details": clean_errors,
                },
            },
        )

    # 3. Unhandled generic exception handler (HTTP 500 without leaking stack traces)
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            f"Unhandled exception during {request.method} {request.url.path}: {exc.__class__.__name__} - {str(exc)}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal error occurred while processing the request.",
                    "details": [],
                },
            },
        )

    app.include_router(api_router, prefix=prefix)
    return app


app = create_app()