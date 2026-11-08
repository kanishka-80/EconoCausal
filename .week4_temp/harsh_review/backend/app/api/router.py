from fastapi import APIRouter
from backend.app.api.routes import causal, data, health, optimization

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(data.router)
api_router.include_router(causal.router)
api_router.include_router(optimization.router)
