"""
Stadium AI Backend — Application Entry Point.

Assembles the FastAPI application from modular subpackages:
- ``app.routes``     — API endpoint handlers
- ``app.middleware``  — Security headers and CORS
- ``app.schemas``     — Pydantic request/response models
- ``app.services``    — Business logic and caching

Run with: ``uvicorn main:app --reload``
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai
from dotenv import load_dotenv

from app.middleware import add_security_headers, configure_cors
from app.routes import router, limiter

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("stadium_ai")

# ---------------------------------------------------------------------------
# Google Gemini AI Configuration
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY not set. AI features will use fallback responses. "
        "Set the key in a .env file or as an environment variable."
    )
    # Use a dummy key so genai.configure does not raise on import;
    # actual API calls will fail gracefully via the fallback logic.
    GEMINI_API_KEY = "NOT_SET"

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-pro")

# ---------------------------------------------------------------------------
# Application Lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle events."""
    logger.info("Stadium AI backend starting up...")
    # Attach the Gemini model to app state for dependency-injection style access
    app.state.model = model
    yield
    logger.info("Stadium AI backend shutting down.")


# ---------------------------------------------------------------------------
# Application Assembly
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Stadium AI Backend",
    description=(
        "Gemini-powered FIFA World Cup 2026 stadium operations API "
        "for navigation, crowd management, sustainability, and "
        "operational intelligence."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security headers (must be added before CORS)
app.middleware("http")(add_security_headers)

# CORS
configure_cors(app)

# Attach model to state immediately (for TestClient which skips lifespan)
app.state.model = model

# Routes
app.include_router(router)


# ---------------------------------------------------------------------------
# Development Runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
