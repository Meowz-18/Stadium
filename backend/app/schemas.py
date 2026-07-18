"""
Pydantic request/response schemas for the Stadium AI API.

Centralizes all data validation models used across endpoints,
enforcing strict input constraints and typed API contracts.

Uses the ``Annotated`` pattern recommended by Pydantic v2 for
field-level constraints (replaces deprecated ``constr``/``confloat``/``conint``).
"""

from typing import Annotated, Optional
from enum import Enum
from pydantic import BaseModel, Field


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
# Reusable Annotated Types
# ---------------------------------------------------------------------------

VenueIdStr = Annotated[str, Field(min_length=1, max_length=50)]
ZoneIdStr = Annotated[str, Field(min_length=1, max_length=50)]


# ---------------------------------------------------------------------------
# Assistant Endpoint Schemas
# ---------------------------------------------------------------------------

class AssistantQuery(BaseModel):
    """Request body for ``POST /api/assistant``.

    Attributes:
        query: The user's natural-language question (1-1000 chars).
        language: ISO 639-1 language code for multilingual support.
        venue_id: Optional venue identifier for context-aware responses.
        role: Optional user role to tailor responses.
    """

    query: Annotated[str, Field(min_length=1, max_length=1000)]
    language: Annotated[str, Field(min_length=2, max_length=5)] = "en"
    venue_id: Optional[str] = None
    role: Optional[Annotated[str, Field(min_length=2, max_length=20)]] = "fan"


class AssistantResponse(BaseModel):
    """Response body for ``POST /api/assistant``."""

    response: str
    detected_language: str = "en"


# ---------------------------------------------------------------------------
# Navigation Endpoint Schemas
# ---------------------------------------------------------------------------

class NavigationQuery(BaseModel):
    """Request body for ``POST /api/navigation``.

    Enables AI wayfinding requests between stadium zones.
    """

    venue_id: VenueIdStr = "lusail"
    start_zone_id: ZoneIdStr
    end_zone_id: ZoneIdStr
    accessible: bool = False


class NavigationResponse(BaseModel):
    """Response body for ``POST /api/navigation``."""

    directions: str


# ---------------------------------------------------------------------------
# Crowd Management Schemas
# ---------------------------------------------------------------------------

class ZoneReport(BaseModel):
    """A single zone's crowd density report."""

    zone_id: ZoneIdStr
    density: Annotated[int, Field(ge=0, le=100)]
    count: Annotated[int, Field(ge=0, le=200000)] = 0


class CrowdQuery(BaseModel):
    """Request body for ``POST /api/crowd``.

    Submits crowd density readings for one or more stadium zones.
    """

    venue_id: VenueIdStr = "lusail"
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

    origin: Annotated[str, Field(min_length=1, max_length=200)] = "City Center"
    venue_id: VenueIdStr = "lusail"
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

    venue_id: VenueIdStr = "lusail"
    waste_kg: Annotated[float, Field(ge=0, le=1000000)] = 0
    energy_kwh: Annotated[float, Field(ge=0, le=10000000)] = 0
    water_liters: Annotated[float, Field(ge=0, le=10000000)] = 0
    recycling_rate: Annotated[float, Field(ge=0, le=100)] = 0
    attendance: Annotated[int, Field(ge=0, le=200000)] = 0


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
# Operational Intelligence Schemas
# ---------------------------------------------------------------------------

class OperationsQuery(BaseModel):
    """Request body for ``POST /api/operations``.

    Accepts venue state data for AI-generated operational intelligence
    and real-time decision support briefings.

    Attributes:
        venue_id: Target venue identifier.
        event_phase: Current phase of the event lifecycle.
        crowd_density_avg: Average crowd density across all zones (0-100).
        critical_zone_count: Number of zones above 90% density.
        weather: Current weather conditions at the venue.
        special_notes: Additional context for the AI briefing.
    """

    venue_id: VenueIdStr = "lusail"
    event_phase: Annotated[str, Field(min_length=1, max_length=50)] = "pre_match"
    crowd_density_avg: Annotated[int, Field(ge=0, le=100)] = 0
    critical_zone_count: Annotated[int, Field(ge=0, le=50)] = 0
    weather: Annotated[str, Field(min_length=1, max_length=100)] = "clear"
    special_notes: Optional[Annotated[str, Field(max_length=500)]] = None


class OperationsResponse(BaseModel):
    """Response body for ``POST /api/operations``.

    Provides an AI-generated operational briefing covering staffing,
    emergency readiness, resource allocation, and real-time decisions.
    """

    venue_id: str
    event_phase: str
    briefing: str
    decision_recommendations: list[str]
    risk_level: str


# ---------------------------------------------------------------------------
# Health Endpoint Schema
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response body for ``GET /api/health``."""

    status: str
    service: str
    version: str
    ai_model: str
