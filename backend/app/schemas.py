"""
Pydantic request/response schemas for the Stadium AI API.

Centralizes all data validation models used across endpoints,
enforcing strict input constraints and typed API contracts.
"""

from typing import Optional
from enum import Enum
from pydantic import BaseModel, constr, confloat, conint


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class AlertLevel(str, Enum):
    """Crowd density alert severity levels."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class TransportMode(str, Enum):
    """Supported transportation modes."""

    METRO = "metro"
    BUS = "bus"
    RIDESHARE = "rideshare"
    WALK = "walk"
    SHUTTLE = "shuttle"


# ---------------------------------------------------------------------------
# Assistant Endpoint Schemas
# ---------------------------------------------------------------------------

class AssistantQuery(BaseModel):
    """Request body for ``POST /api/assistant``.

    Attributes:
        query: The user's natural-language question (1-1000 chars).
        language: ISO 639-1 language code for multilingual support.
        venue_id: Optional venue identifier for context-aware responses.
    """

    query: constr(min_length=1, max_length=1000)
    language: constr(min_length=2, max_length=5) = "en"
    venue_id: Optional[str] = None


class AssistantResponse(BaseModel):
    """Response body for ``POST /api/assistant``."""

    response: str
    detected_language: str = "en"


# ---------------------------------------------------------------------------
# Crowd Management Schemas
# ---------------------------------------------------------------------------

class ZoneReport(BaseModel):
    """A single zone's crowd density report."""

    zone_id: constr(min_length=1, max_length=50)
    density: conint(ge=0, le=100)
    count: conint(ge=0, le=200000) = 0


class CrowdQuery(BaseModel):
    """Request body for ``POST /api/crowd``.

    Submits crowd density readings for one or more stadium zones.
    """

    venue_id: constr(min_length=1, max_length=50) = "lusail"
    zones: list[ZoneReport] = []


class ZoneAnalysis(BaseModel):
    """Analysis result for a single zone."""

    zone_id: str
    density: int
    alert_level: AlertLevel
    recommendation: str


class CrowdResponse(BaseModel):
    """Response body for ``POST /api/crowd``."""

    venue_id: str
    total_occupancy: int
    capacity: int
    overall_alert: AlertLevel
    zones: list[ZoneAnalysis]
    ai_recommendation: str


# ---------------------------------------------------------------------------
# Transportation Schemas
# ---------------------------------------------------------------------------

class TransportQuery(BaseModel):
    """Request body for ``POST /api/transport``."""

    origin: constr(min_length=1, max_length=200) = "City Center"
    venue_id: constr(min_length=1, max_length=50) = "lusail"
    match_time: Optional[str] = None
    preferences: Optional[list[str]] = None


class RouteOption(BaseModel):
    """A single transportation route option."""

    mode: TransportMode
    duration_min: int
    distance_km: float
    co2_kg: float
    cost_usd: float
    description: str


class TransportResponse(BaseModel):
    """Response body for ``POST /api/transport``."""

    origin: str
    destination: str
    routes: list[RouteOption]
    ai_recommendation: str


# ---------------------------------------------------------------------------
# Sustainability Schemas
# ---------------------------------------------------------------------------

class SustainabilityInput(BaseModel):
    """Request body for ``POST /api/sustainability``."""

    venue_id: constr(min_length=1, max_length=50) = "lusail"
    waste_kg: confloat(ge=0, le=1000000) = 0
    energy_kwh: confloat(ge=0, le=10000000) = 0
    water_liters: confloat(ge=0, le=10000000) = 0
    recycling_rate: confloat(ge=0, le=100) = 0
    attendance: conint(ge=0, le=200000) = 0


class SustainabilityBreakdown(BaseModel):
    """Per-category sustainability scores."""

    waste_score: float
    energy_score: float
    water_score: float
    recycling_score: float


class SustainabilityResponse(BaseModel):
    """Response body for ``POST /api/sustainability``."""

    venue_id: str
    overall_score: float
    grade: str
    breakdown: SustainabilityBreakdown
    per_capita: dict
    ai_recommendations: str


# ---------------------------------------------------------------------------
# Health Endpoint Schema
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response body for ``GET /api/health``."""

    status: str
    service: str
    version: str
    ai_model: str
