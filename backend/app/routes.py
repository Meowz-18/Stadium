"""
API route handlers for the Stadium AI backend.

Defines all HTTP endpoints as an APIRouter, keeping route logic
separate from application initialization and middleware configuration.
"""

import hashlib
import logging

from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas import (
    AssistantQuery,
    AssistantResponse,
    CrowdQuery,
    CrowdResponse,
    TransportQuery,
    TransportResponse,
    SustainabilityInput,
    SustainabilityResponse,
    HealthResponse,
)
from app.services import (
    LRUCache,
    analyze_crowd,
    build_assistant_prompt,
    build_fallback_response,
    calculate_sustainability,
    estimate_routes,
)

logger = logging.getLogger("stadium_ai")

# Module-level cache instance shared across requests
response_cache = LRUCache(capacity=128)

# Route-level limiter (same key function; attached to app state in main.py)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["Stadium AI"])


@router.post("/assistant", response_model=AssistantResponse)
@limiter.limit("20/minute")
async def chat_assistant(request: Request, body: AssistantQuery):
    """Multilingual AI Assistant endpoint using Gemini for stadium queries.

    Checks the LRU cache first. On cache miss, builds a context-aware
    prompt (optionally injecting venue data) and calls the Gemini API.
    Falls back to keyword-matched local responses on API failure.
    """
    from main import model  # lazy import to avoid circular dependency

    cache_key = hashlib.sha256(
        f"{body.query.lower()}:{body.language}:{body.venue_id}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached:
        logger.info("Cache hit for query hash: %s", cache_key)
        return {"response": cached, "detected_language": body.language}

    try:
        prompt = build_assistant_prompt(
            body.query, body.language, body.venue_id
        )
        response = await model.generate_content_async(prompt)
        answer = response.text
        response_cache.put(cache_key, answer)
        logger.info("Gemini response generated for query hash: %s", cache_key)
        return {"response": answer, "detected_language": body.language}

    except Exception as exc:
        logger.warning(
            "Gemini API unavailable, using fallback. Error: %s", str(exc)
        )
        fallback = build_fallback_response(body.query.lower())
        response_cache.put(cache_key, fallback)
        return {"response": fallback, "detected_language": body.language}


@router.post("/crowd", response_model=CrowdResponse)
@limiter.limit("30/minute")
async def analyze_crowd_density(request: Request, body: CrowdQuery):
    """Analyze crowd density and generate AI recommendations.

    Delegates zone analysis to the service layer and optionally
    enriches recommendations with Gemini AI insights.
    """
    from main import model

    zones_data = [z.model_dump() for z in body.zones]
    result = analyze_crowd(body.venue_id, zones_data)

    # Generate AI recommendation for crowd management
    try:
        critical_zones = [
            z for z in result["zones"]
            if z["alert_level"] in ("high", "critical")
        ]
        if critical_zones:
            zone_summary = ", ".join(
                f"{z['zone_id']} ({z['density']}%)" for z in critical_zones
            )
            prompt = (
                "You are a stadium operations AI for FIFA World Cup 2026. "
                f"These zones have high crowd density: {zone_summary}. "
                "Provide 3 specific, actionable crowd management recommendations "
                "for venue staff. Be concise and practical."
            )
            response = await model.generate_content_async(prompt)
            result["ai_recommendation"] = response.text
        else:
            result["ai_recommendation"] = (
                "All zones operating within normal capacity. Continue standard "
                "monitoring procedures. Consider pre-positioning additional "
                "stewards near main entrances for upcoming peak periods."
            )
    except Exception:
        result["ai_recommendation"] = (
            "Crowd monitoring active. Deploy stewards to high-density zones "
            "and ensure emergency exits remain clear. Monitor gate throughput "
            "for incoming fan flow."
        )

    return result


@router.post("/transport", response_model=TransportResponse)
@limiter.limit("30/minute")
async def plan_transport(request: Request, body: TransportQuery):
    """Plan transportation routes to the stadium.

    Returns multi-modal route options with CO₂ estimates and
    AI-generated recommendations.
    """
    from main import model

    routes = estimate_routes(body.origin, body.venue_id)

    try:
        route_summary = "; ".join(
            f"{r['mode']}: {r['duration_min']}min, {r['co2_kg']}kg CO₂"
            for r in routes
        )
        prompt = (
            "You are a transportation advisor for FIFA World Cup 2026 fans. "
            f"Available routes from {body.origin}: {route_summary}. "
            "Recommend the best option considering time, cost, and "
            "environmental impact. Be brief and enthusiastic."
        )
        response = await model.generate_content_async(prompt)
        ai_rec = response.text
    except Exception:
        ai_rec = (
            "We recommend the Metro for the best balance of speed, cost, and "
            "sustainability. Arrive at least 90 minutes before kickoff to "
            "enjoy the pre-match atmosphere!"
        )

    from app.services import VENUES
    venue = VENUES.get(body.venue_id, VENUES["lusail"])

    return {
        "origin": body.origin,
        "destination": venue["name"],
        "routes": routes,
        "ai_recommendation": ai_rec,
    }


@router.post("/sustainability", response_model=SustainabilityResponse)
@limiter.limit("30/minute")
async def assess_sustainability(request: Request, body: SustainabilityInput):
    """Calculate sustainability score and generate reduction strategies.

    Delegates scoring to the service layer and enriches with
    Gemini AI recommendations.
    """
    from main import model

    result = calculate_sustainability(
        venue_id=body.venue_id,
        waste_kg=body.waste_kg,
        energy_kwh=body.energy_kwh,
        water_liters=body.water_liters,
        recycling_rate=body.recycling_rate,
        attendance=body.attendance,
    )

    try:
        prompt = (
            "You are a sustainability advisor for FIFA World Cup 2026 venues. "
            f"Venue scores: waste={result['breakdown']['waste_score']}/100, "
            f"energy={result['breakdown']['energy_score']}/100, "
            f"water={result['breakdown']['water_score']}/100, "
            f"recycling={result['breakdown']['recycling_score']}/100. "
            f"Overall grade: {result['grade']}. "
            "Provide 3 specific, actionable sustainability improvements. "
            "Focus on the lowest-scoring areas. Be concise."
        )
        response = await model.generate_content_async(prompt)
        result["ai_recommendations"] = response.text
    except Exception:
        result["ai_recommendations"] = (
            "Focus on improving waste reduction by deploying additional "
            "recycling stations, switching to compostable food containers, "
            "and implementing a digital ticketing system to reduce paper waste."
        )

    return result


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Return service health status and version metadata."""
    return {
        "status": "healthy",
        "service": "Stadium AI Backend",
        "version": "1.0.0",
        "ai_model": "gemini-pro",
    }
