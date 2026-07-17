"""
HTTP middleware for the Stadium AI API.

Provides security header injection and CORS configuration.
Separated from route logic for clarity and reusability.
"""

from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

import os

# Allowed frontend origins for CORS
origins_env = os.getenv("ALLOWED_ORIGINS", "")
if origins_env:
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in origins_env.split(",") if origin.strip()
    ]
else:
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


async def add_security_headers(request: Request, call_next):
    """Inject security headers on every HTTP response.

    Headers applied:
        - X-Content-Type-Options: nosniff
        - X-Frame-Options: DENY
        - X-XSS-Protection: 1; mode=block
        - Content-Security-Policy: restrictive default policy
        - Strict-Transport-Security: 1-year HSTS with subdomains
        - Referrer-Policy: strict-origin-when-cross-origin
        - Permissions-Policy: disable camera, mic, geolocation
        - Cache-Control: prevent caching of API responses
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; object-src 'none';"
    )
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return response


def configure_cors(app) -> None:
    """Apply CORS middleware with restricted origins.

    Args:
        app: The FastAPI application instance.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
