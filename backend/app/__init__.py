"""
Stadium AI Backend Application Package.

Modular FastAPI application for the FIFA World Cup 2026
stadium operations platform. Organized into schemas, services,
routes, and middleware submodules for maintainability and testability.

Submodules:
    schemas     — Pydantic request/response models with Annotated types.
    services    — Pure business logic, prompt builders, and caching.
    routes      — FastAPI APIRouter endpoint handlers.
    middleware  — Security headers and CORS configuration.
"""

__all__ = ["schemas", "services", "routes", "middleware"]
