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
    NavigationQuery,
    NavigationResponse,
    CrowdQuery,
    CrowdResponse,
    TransportQuery,
    TransportResponse,
    SustainabilityInput,
    SustainabilityResponse,
    OperationsQuery,
    OperationsResponse,
    HealthResponse,
)
from app.services import (
    LRUCache,
    analyze_crowd,
    build_assistant_prompt,
    build_fallback_response,
    build_navigation_prompt,
    build_navigation_fallback,
    build_operations_prompt,
    build_operations_fallback,
    calculate_sustainability,
    estimate_routes,
)

logger = logging.getLogger("stadium_ai")

# Module-level cache instance shared across requests
response_cache = LRUCache(capacity=128)

# Route-level limiter (same key function; attached to app state in main.py)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["Stadium AI"])


def _get_model(request: Request):
    """Retrieve the Gemini model from application state.

    Args:
        request: The incoming HTTP request.

    Returns:
        The configured GenerativeModel instance.
    """
    return request.app.state.model


@router.post("/assistant", response_model=AssistantResponse)
@limiter.limit("20/minute")
async def chat_assistant(request: Request, body: AssistantQuery):
    """Multilingual AI Assistant endpoint using Gemini for stadium queries.

    Checks the LRU cache first. On cache miss, builds a context-aware
    prompt (optionally injecting venue data and role) and calls the Gemini API.
    Falls back to keyword-matched local responses on API failure.
    """
    model = _get_model(request)

    cache_key = hashlib.sha256(
        f"{body.query.lower()}:{body.language}:{body.venue_id}:{body.role}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached:
        logger.info("Cache hit for query hash: %s", cache_key)
        return {"response": cached, "detected_language": body.language}

    try:
        prompt = build_assistant_prompt(
            body.query, body.language, body.venue_id, body.role
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


@router.post("/navigation", response_model=NavigationResponse)
@limiter.limit("20/minute")
async def navigate_zones(request: Request, body: NavigationQuery):
    """Generate step-by-step navigation instructions using Gemini AI.

    If accessibility mode is enabled, routes the user through accessible pathways.
    """
    model = _get_model(request)

    cache_key = hashlib.sha256(
        f"{body.venue_id}:{body.start_zone_id}:{body.end_zone_id}:{body.accessible}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached:
        logger.info("Cache hit for navigation hash: %s", cache_key)
        return {"directions": cached}

    try:
        prompt = build_navigation_prompt(
            body.venue_id, body.start_zone_id, body.end_zone_id, body.accessible
        )
        response = await model.generate_content_async(prompt)
        directions = response.text
        response_cache.put(cache_key, directions)
        logger.info("Gemini navigation generated for hash: %s", cache_key)
        return {"directions": directions}

    except Exception as exc:
        logger.warning(
            "Gemini API unavailable for navigation, using fallback. Error: %s", str(exc)
        )
        fallback = build_navigation_fallback(
            body.venue_id, body.start_zone_id, body.end_zone_id, body.accessible
        )
        response_cache.put(cache_key, fallback)
        return {"directions": fallback}



@router.post("/crowd", response_model=CrowdResponse)
@limiter.limit("30/minute")
async def analyze_crowd_density(request: Request, body: CrowdQuery):
    """Analyze crowd density and generate AI recommendations.

    Delegates zone analysis to the service layer and enriches
    recommendations with Gemini AI insights, memoized in the LRU cache.
    """
    model = _get_model(request)

    zones_data = [z.model_dump() for z in body.zones]
    zones_summary_str = ",".join(f"{z['zone_id']}:{z['density']}" for z in zones_data)
    cache_key = hashlib.sha256(
        f"crowd:{body.venue_id}:{zones_summary_str}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached and isinstance(cached, dict):
        logger.info("Cache hit for crowd hash: %s", cache_key)
        return cached

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

    response_cache.put(cache_key, result)
    return result


@router.post("/transport", response_model=TransportResponse)
@limiter.limit("30/minute")
async def plan_transport(request: Request, body: TransportQuery):
    """Plan transportation routes to the stadium.

    Returns multi-modal route options with CO₂ estimates and
    AI-generated recommendations, cached for performance.
    """
    model = _get_model(request)

    cache_key = hashlib.sha256(
        f"transport:{body.origin}:{body.venue_id}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached and isinstance(cached, dict):
        logger.info("Cache hit for transport hash: %s", cache_key)
        return cached

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

    response_data = {
        "origin": body.origin,
        "destination": venue["name"],
        "routes": routes,
        "ai_recommendation": ai_rec,
    }
    response_cache.put(cache_key, response_data)
    return response_data


@router.post("/sustainability", response_model=SustainabilityResponse)
@limiter.limit("30/minute")
async def assess_sustainability(request: Request, body: SustainabilityInput):
    """Calculate sustainability score and generate reduction strategies.

    Delegates scoring to the service layer and enriches with
    Gemini AI recommendations, cached in LRU.
    """
    model = _get_model(request)

    cache_key = hashlib.sha256(
        f"sus:{body.venue_id}:{body.waste_kg}:{body.energy_kwh}:{body.water_liters}:{body.recycling_rate}:{body.attendance}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached and isinstance(cached, dict):
        logger.info("Cache hit for sustainability hash: %s", cache_key)
        return cached

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

    response_cache.put(cache_key, result)
    return result


@router.post("/operations", response_model=OperationsResponse)
@limiter.limit("20/minute")
async def operational_briefing(request: Request, body: OperationsQuery):
    """Generate an AI-powered operational intelligence briefing.

    Provides real-time decision support for venue staff by analyzing
    current crowd conditions, event phase, and weather to produce
    actionable recommendations and a risk-level assessment.
    """
    model = _get_model(request)

    cache_key = hashlib.sha256(
        f"ops:{body.venue_id}:{body.event_phase}:{body.crowd_density_avg}"
        f":{body.critical_zone_count}:{body.weather}".encode()
    ).hexdigest()

    cached = response_cache.get(cache_key)
    if cached:
        logger.info("Cache hit for operations hash: %s", cache_key)
        if isinstance(cached, dict):
            return cached
        # Backward compatibility for string cached briefings
        fallback = build_operations_fallback(
            body.venue_id, body.event_phase,
            body.crowd_density_avg, body.critical_zone_count,
        )
        return {
            "venue_id": body.venue_id,
            "event_phase": body.event_phase,
            "briefing": str(cached),
            "decision_recommendations": fallback["decision_recommendations"],
            "risk_level": fallback["risk_level"],
        }

    try:
        prompt = build_operations_prompt(
            body.venue_id, body.event_phase,
            body.crowd_density_avg, body.critical_zone_count,
            body.weather, body.special_notes,
        )
        response = await model.generate_content_async(prompt)
        briefing_text = response.text

        # Extract risk level from AI response, default to heuristic
        risk = "Low"
        if body.critical_zone_count > 2:
            risk = "Critical"
        elif body.critical_zone_count > 0 or body.crowd_density_avg > 75:
            risk = "High"
        elif body.crowd_density_avg > 50:
            risk = "Moderate"

        response_data = {
            "venue_id": body.venue_id,
            "event_phase": body.event_phase,
            "briefing": briefing_text,
            "decision_recommendations": [
                "See full AI briefing above for detailed recommendations."
            ],
            "risk_level": risk,
        }
        response_cache.put(cache_key, response_data)
        logger.info("Gemini operations briefing generated for hash: %s", cache_key)
        return response_data

    except Exception as exc:
        logger.warning(
            "Gemini API unavailable for operations, using fallback. Error: %s", str(exc)
        )
        fallback = build_operations_fallback(
            body.venue_id, body.event_phase,
            body.crowd_density_avg, body.critical_zone_count,
        )
        response_data = {
            "venue_id": body.venue_id,
            "event_phase": body.event_phase,
            **fallback,
        }
        response_cache.put(cache_key, response_data)
        return response_data


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Return service health status and version metadata."""
    return {
        "status": "healthy",
        "service": "Stadium AI Backend",
        "version": "1.0.0",
        "ai_model": "gemini-pro",
    }
