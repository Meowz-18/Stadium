"""
Test suite for the Stadium AI backend API.

Covers all endpoints, security headers, caching, CORS, rate limiting,
input validation, Gemini mock success/failure, and service-layer logic.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from main import app
from app.routes import response_cache, limiter
from app.services import (
    LRUCache,
    VENUES,
    TRANSPORT_FACTORS,
    SUSTAINABILITY_TARGETS,
    BASE_DISTANCE_KM,
    WALK_DISTANCE_CAP_KM,
    build_fallback_response,
    get_alert_level,
    get_zone_recommendation,
    analyze_crowd,
    estimate_routes,
    calculate_sustainability,
    build_assistant_prompt,
    build_navigation_prompt,
    build_navigation_fallback,
    build_operations_prompt,
    build_operations_fallback,
)
from app.schemas import AlertLevel

client = TestClient(app)
limiter.enabled = False


# ---------------------------------------------------------------------------
# Assistant Endpoint Tests
# ---------------------------------------------------------------------------

class TestAssistantEndpoint:
    """Tests for ``POST /api/assistant``."""

    def test_navigation_query(self):
        """Navigation queries should return wayfinding information."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={"query": "where is gate B?"})
        assert res.status_code == 200
        body = res.json()["response"].lower()
        assert "gate" in body or "navigat" in body or "direction" in body

    def test_crowd_query(self):
        """Crowd queries should return crowd management info."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={"query": "how busy is the stadium?"})
        assert res.status_code == 200
        assert len(res.json()["response"]) > 20

    def test_multilingual_param(self):
        """Language parameter should be preserved in response."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={
            "query": "where are the restrooms?",
            "language": "es",
        })
        assert res.status_code == 200
        assert res.json()["detected_language"] == "es"

    def test_venue_context(self):
        """Venue ID should provide context-aware responses."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={
            "query": "tell me about this stadium",
            "venue_id": "metlife",
        })
        assert res.status_code == 200
        assert len(res.json()["response"]) > 20

    def test_general_query(self):
        """General queries should return a branded response."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={"query": "hello"})
        assert res.status_code == 200
        assert "Stadium AI" in res.json()["response"]

    def test_gemini_success_mock(self):
        """Assistant returns Gemini response when API succeeds."""
        response_cache._cache.clear()
        mock_response = AsyncMock()
        mock_response.text = "Gate B is located on the east side of the stadium."

        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_model
            res = client.post("/api/assistant", json={"query": "find gate B"})
            assert res.status_code == 200
            assert res.json()["response"] == "Gate B is located on the east side of the stadium."

    def test_gemini_failure_fallback(self):
        """Assistant falls back gracefully when Gemini raises an exception."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("API key error"))
            mock_get.return_value = mock_model
            res = client.post("/api/assistant", json={"query": "where to eat food?"})
            assert res.status_code == 200
            body = res.json()["response"].lower()
            assert "food" in body or "concession" in body

    def test_response_caching(self):
        """Identical queries should return the same response (cache hit)."""
        response_cache._cache.clear()
        query = {"query": "what time is kickoff?"}
        first = client.post("/api/assistant", json=query).json()["response"]
        second = client.post("/api/assistant", json=query).json()["response"]
        assert first == second

    def test_assistant_role_tailoring(self):
        """Assistant queries should accept role and generate context-aware prompts."""
        response_cache._cache.clear()
        res = client.post("/api/assistant", json={
            "query": "what is my schedule?",
            "role": "volunteer",
        })
        assert res.status_code == 200
        assert len(res.json()["response"]) > 0


# ---------------------------------------------------------------------------
# Navigation Endpoint Tests
# ---------------------------------------------------------------------------

class TestNavigationEndpoint:
    """Tests for ``POST /api/navigation``."""

    def test_navigation_success_mock(self):
        """Navigation returns Gemini response when API succeeds."""
        response_cache._cache.clear()
        mock_response = AsyncMock()
        mock_response.text = "Walk past Concourse A, then take the ramp on the left."

        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_model
            res = client.post("/api/navigation", json={
                "venue_id": "metlife",
                "start_zone_id": "gate_area",
                "end_zone_id": "vip_suites",
                "accessible": True,
            })
            assert res.status_code == 200
            assert res.json()["directions"] == "Walk past Concourse A, then take the ramp on the left."

    def test_navigation_failure_fallback(self):
        """Navigation falls back to local routing when Gemini fails."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("Gemini Offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/navigation", json={
                "venue_id": "metlife",
                "start_zone_id": "gate_area",
                "end_zone_id": "vip_suites",
                "accessible": True,
            })
            assert res.status_code == 200
            directions = res.json()["directions"]
            assert "Fallback" in directions
            assert "[Accessibility]" in directions

    def test_navigation_same_zone(self):
        """Navigation returns early if start and end zones are identical."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/navigation", json={
                "venue_id": "metlife",
                "start_zone_id": "gate_area",
                "end_zone_id": "gate_area",
                "accessible": False,
            })
            assert res.status_code == 200
            assert "currently at" in res.json()["directions"]

    def test_navigation_non_accessible(self):
        """Non-accessible fallback should mention escalators/staircases."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/navigation", json={
                "venue_id": "lusail",
                "start_zone_id": "north_stand",
                "end_zone_id": "south_stand",
                "accessible": False,
            })
            assert res.status_code == 200
            directions = res.json()["directions"]
            assert "escalator" in directions.lower() or "staircase" in directions.lower()


# ---------------------------------------------------------------------------
# Crowd Endpoint Tests
# ---------------------------------------------------------------------------


class TestCrowdEndpoint:
    """Tests for ``POST /api/crowd``."""

    def test_basic_crowd_analysis(self):
        """Crowd endpoint should return zone analyses."""
        res = client.post("/api/crowd", json={
            "venue_id": "lusail",
            "zones": [
                {"zone_id": "north_stand", "density": 75, "count": 9000},
                {"zone_id": "south_stand", "density": 40, "count": 4800},
            ],
        })
        assert res.status_code == 200
        data = res.json()
        assert data["venue_id"] == "lusail"
        assert len(data["zones"]) == 2
        assert data["total_occupancy"] == 13800

    def test_critical_alert(self):
        """Zones above 90% should trigger critical alert."""
        res = client.post("/api/crowd", json={
            "venue_id": "lusail",
            "zones": [{"zone_id": "vip_lounge", "density": 95, "count": 1900}],
        })
        assert res.status_code == 200
        data = res.json()
        assert data["zones"][0]["alert_level"] == "critical"
        assert data["overall_alert"] == "critical"

    def test_empty_zones(self):
        """Empty zones list should return valid response."""
        res = client.post("/api/crowd", json={"venue_id": "lusail", "zones": []})
        assert res.status_code == 200
        data = res.json()
        assert data["total_occupancy"] == 0
        assert len(data["zones"]) == 0


# ---------------------------------------------------------------------------
# Transport Endpoint Tests
# ---------------------------------------------------------------------------

class TestTransportEndpoint:
    """Tests for ``POST /api/transport``."""

    def test_basic_transport(self):
        """Transport endpoint should return multiple route options."""
        res = client.post("/api/transport", json={
            "origin": "Downtown",
            "venue_id": "sofi",
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["routes"]) == 5
        assert data["destination"] == "SoFi Stadium"

    def test_co2_ordering(self):
        """Walking should have zero CO₂ emissions."""
        res = client.post("/api/transport", json={
            "origin": "Hotel",
            "venue_id": "lusail",
        })
        data = res.json()
        walk_route = next(r for r in data["routes"] if r["mode"] == "walk")
        assert walk_route["co2_kg"] == 0.0

    def test_walk_distance_cap(self):
        """Walking distance should be capped at 5 km."""
        res = client.post("/api/transport", json={"origin": "Far Away"})
        data = res.json()
        walk_route = next(r for r in data["routes"] if r["mode"] == "walk")
        assert walk_route["distance_km"] <= 5.0


# ---------------------------------------------------------------------------
# Sustainability Endpoint Tests
# ---------------------------------------------------------------------------

class TestSustainabilityEndpoint:
    """Tests for ``POST /api/sustainability``."""

    def test_perfect_sustainability(self):
        """Zero waste/energy/water with max recycling should score high."""
        res = client.post("/api/sustainability", json={
            "venue_id": "lusail",
            "waste_kg": 0,
            "energy_kwh": 0,
            "water_liters": 0,
            "recycling_rate": 100,
            "attendance": 50000,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["overall_score"] >= 90
        assert data["grade"] in ("A+", "A")

    def test_poor_sustainability(self):
        """Excessive consumption should score low."""
        res = client.post("/api/sustainability", json={
            "venue_id": "lusail",
            "waste_kg": 50000,
            "energy_kwh": 500000,
            "water_liters": 1000000,
            "recycling_rate": 5,
            "attendance": 10000,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["grade"] == "D"

    def test_breakdown_present(self):
        """Response should include per-category breakdown."""
        res = client.post("/api/sustainability", json={
            "waste_kg": 100,
            "energy_kwh": 200,
            "water_liters": 1000,
            "recycling_rate": 50,
            "attendance": 1000,
        })
        data = res.json()
        breakdown = data["breakdown"]
        assert "waste_score" in breakdown
        assert "energy_score" in breakdown
        assert "water_score" in breakdown
        assert "recycling_score" in breakdown


# ---------------------------------------------------------------------------
# Operations Endpoint Tests
# ---------------------------------------------------------------------------

class TestOperationsEndpoint:
    """Tests for ``POST /api/operations``."""

    def test_operations_success_mock(self):
        """Operations returns Gemini briefing when API succeeds."""
        response_cache._cache.clear()
        mock_response = AsyncMock()
        mock_response.text = "Situational briefing: All systems nominal."

        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_model
            res = client.post("/api/operations", json={
                "venue_id": "metlife",
                "event_phase": "pre_match",
                "crowd_density_avg": 40,
                "critical_zone_count": 0,
                "weather": "clear",
            })
            assert res.status_code == 200
            data = res.json()
            assert data["venue_id"] == "metlife"
            assert "briefing" in data
            assert data["risk_level"] == "Low"

    def test_operations_failure_fallback(self):
        """Operations falls back gracefully when Gemini raises."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("API down"))
            mock_get.return_value = mock_model
            res = client.post("/api/operations", json={
                "venue_id": "lusail",
                "event_phase": "halftime",
                "crowd_density_avg": 80,
                "critical_zone_count": 3,
                "weather": "rain",
            })
            assert res.status_code == 200
            data = res.json()
            assert data["risk_level"] == "Critical"
            assert len(data["decision_recommendations"]) == 3

    def test_operations_moderate_risk(self):
        """Operations with moderate density should report moderate risk."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/operations", json={
                "venue_id": "sofi",
                "event_phase": "match_live",
                "crowd_density_avg": 60,
                "critical_zone_count": 0,
                "weather": "hot",
            })
            assert res.status_code == 200
            data = res.json()
            assert data["risk_level"] == "Moderate"

    def test_operations_with_special_notes(self):
        """Operations should accept and process special_notes field."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/operations", json={
                "venue_id": "azteca",
                "event_phase": "post_match",
                "crowd_density_avg": 30,
                "critical_zone_count": 0,
                "weather": "clear",
                "special_notes": "VIP event in progress",
            })
            assert res.status_code == 200
            assert res.json()["venue_id"] == "azteca"

    def test_operations_default_values(self):
        """Operations should work with all default values."""
        response_cache._cache.clear()
        with patch("app.routes._get_model") as mock_get:
            mock_model = AsyncMock()
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("offline"))
            mock_get.return_value = mock_model
            res = client.post("/api/operations", json={})
            assert res.status_code == 200
            data = res.json()
            assert data["venue_id"] == "lusail"
            assert data["risk_level"] == "Low"


# ---------------------------------------------------------------------------
# Input Validation Tests
# ---------------------------------------------------------------------------

class TestInputValidation:
    """Tests for Pydantic request body validation."""

    def test_empty_query_rejected(self):
        """Empty assistant query should be rejected with 422."""
        res = client.post("/api/assistant", json={"query": ""})
        assert res.status_code == 422

    def test_too_long_query_rejected(self):
        """Excessively long query should be rejected with 422."""
        res = client.post("/api/assistant", json={"query": "x" * 1001})
        assert res.status_code == 422

    def test_negative_density_rejected(self):
        """Negative crowd density should be rejected with 422."""
        res = client.post("/api/crowd", json={
            "zones": [{"zone_id": "test", "density": -10}],
        })
        assert res.status_code == 422

    def test_density_over_100_rejected(self):
        """Crowd density over 100 should be rejected with 422."""
        res = client.post("/api/crowd", json={
            "zones": [{"zone_id": "test", "density": 150}],
        })
        assert res.status_code == 422

    def test_negative_waste_rejected(self):
        """Negative sustainability values should be rejected with 422."""
        res = client.post("/api/sustainability", json={"waste_kg": -100})
        assert res.status_code == 422

    def test_operations_density_over_100_rejected(self):
        """Operations crowd_density_avg over 100 should be rejected with 422."""
        res = client.post("/api/operations", json={"crowd_density_avg": 150})
        assert res.status_code == 422

    def test_operations_empty_event_phase_rejected(self):
        """Operations with empty event_phase should be rejected with 422."""
        res = client.post("/api/operations", json={"event_phase": ""})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Security & Infrastructure Tests
# ---------------------------------------------------------------------------

class TestSecurityAndInfrastructure:
    """Tests for security headers, CORS, rate limiting, and health check."""

    def test_security_headers(self):
        """All responses should include required security headers."""
        res = client.get("/api/health")
        assert res.headers.get("x-content-type-options") == "nosniff"
        assert res.headers.get("x-frame-options") == "DENY"
        assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert res.headers.get("permissions-policy") == "camera=(), microphone=(), geolocation=()"
        assert "no-store" in res.headers.get("cache-control", "")

    def test_security_csp_header(self):
        """Responses should include Content-Security-Policy header."""
        res = client.get("/api/health")
        csp = res.headers.get("content-security-policy", "")
        assert "default-src" in csp
        assert "'self'" in csp

    def test_security_hsts_header(self):
        """Responses should include Strict-Transport-Security header."""
        res = client.get("/api/health")
        hsts = res.headers.get("strict-transport-security", "")
        assert "max-age=" in hsts
        assert "includeSubDomains" in hsts

    def test_security_xss_protection(self):
        """Responses should include X-XSS-Protection header."""
        res = client.get("/api/health")
        assert res.headers.get("x-xss-protection") == "1; mode=block"

    def test_health_endpoint_fields(self):
        """Health endpoint should return all required metadata fields."""
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Stadium AI Backend"
        assert "version" in data
        assert data["ai_model"] == "gemini-pro"

    def test_cors_preflight(self):
        """CORS preflight should allow the Vite dev server origin."""
        res = client.options("/api/assistant", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        })
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"

    def test_rate_limiting(self):
        """Sustained bursts of requests should trigger a 429 rate limit."""
        limiter.enabled = True
        try:
            hit_limit = False
            for _ in range(25):
                res = client.post("/api/assistant", json={"query": "test"})
                if res.status_code == 429:
                    hit_limit = True
                    break
                assert res.status_code == 200
            assert hit_limit, "Rate limit of 429 was never reached"
        finally:
            limiter.enabled = False


# ---------------------------------------------------------------------------
# Service Layer Unit Tests
# ---------------------------------------------------------------------------

class TestServiceLayer:
    """Direct tests for business logic in ``app.services``."""

    def test_lru_cache_basic(self):
        """LRU cache should store and retrieve values."""
        cache = LRUCache(capacity=2)
        cache.put("a", "alpha")
        assert cache.get("a") == "alpha"
        assert cache.get("missing") is None

    def test_lru_cache_eviction(self):
        """LRU cache should evict the least-recently-used entry at capacity."""
        cache = LRUCache(capacity=2)
        cache.put("a", "1")
        cache.put("b", "2")
        cache.put("c", "3")  # should evict "a"
        assert cache.get("a") is None
        assert cache.get("b") == "2"
        assert cache.get("c") == "3"

    def test_lru_cache_promotion(self):
        """Accessing an entry should promote it, preventing eviction."""
        cache = LRUCache(capacity=2)
        cache.put("a", "1")
        cache.put("b", "2")
        cache.get("a")  # promote "a"
        cache.put("c", "3")  # should evict "b", not "a"
        assert cache.get("a") == "1"
        assert cache.get("b") is None

    def test_alert_level_low(self):
        """Density <=50 should be LOW alert."""
        assert get_alert_level(30) == AlertLevel.LOW
        assert get_alert_level(50) == AlertLevel.LOW

    def test_alert_level_critical(self):
        """Density >90 should be CRITICAL alert."""
        assert get_alert_level(91) == AlertLevel.CRITICAL
        assert get_alert_level(100) == AlertLevel.CRITICAL

    def test_alert_level_moderate(self):
        """Density 51-75 should be MODERATE alert."""
        assert get_alert_level(51) == AlertLevel.MODERATE
        assert get_alert_level(75) == AlertLevel.MODERATE

    def test_alert_level_high(self):
        """Density 76-90 should be HIGH alert."""
        assert get_alert_level(76) == AlertLevel.HIGH
        assert get_alert_level(90) == AlertLevel.HIGH

    def test_sustainability_scoring(self):
        """Sustainability scoring should produce valid output."""
        result = calculate_sustainability(
            "lusail", waste_kg=500, energy_kwh=2000,
            water_liters=8000, recycling_rate=60, attendance=5000,
        )
        assert 0 <= result["overall_score"] <= 100
        assert result["grade"] in ("A+", "A", "B", "C", "D")
        assert result["venue_id"] == "lusail"

    def test_transport_routes_count(self):
        """Transport should return one route per available mode."""
        routes = estimate_routes("Downtown", "lusail")
        assert len(routes) == len(TRANSPORT_FACTORS)
        modes = {r["mode"] for r in routes}
        assert modes == set(TRANSPORT_FACTORS.keys())

    def test_fallback_navigation(self):
        """Navigation keywords should return wayfinding advice."""
        result = build_fallback_response("where is the nearest gate?")
        assert "gate" in result.lower() or "navigat" in result.lower() or "signage" in result.lower()

    def test_fallback_food(self):
        """Food keywords should return concession info."""
        result = build_fallback_response("where can I get food?")
        assert "food" in result.lower() or "concession" in result.lower()

    def test_fallback_generic(self):
        """Unknown queries should return a branded generic response."""
        result = build_fallback_response("something random xyz")
        assert "Stadium AI" in result

    def test_fallback_accessibility(self):
        """Accessibility keywords should return accessibility info."""
        result = build_fallback_response("where is the wheelchair entrance?")
        assert "accessibility" in result.lower() or "wheelchair" in result.lower()

    def test_fallback_sustainability(self):
        """Sustainability keywords should return green info."""
        result = build_fallback_response("tell me about recycling")
        assert "recycle" in result.lower() or "sustain" in result.lower()

    def test_prompt_builder_with_venue(self):
        """Prompt builder should include venue context when venue_id is valid."""
        prompt = build_assistant_prompt("hello", "en", "metlife")
        assert "MetLife Stadium" in prompt
        assert "East Rutherford" in prompt

    def test_prompt_builder_without_venue(self):
        """Prompt builder should work without venue context."""
        prompt = build_assistant_prompt("hello", "en", None)
        assert "Stadium AI" in prompt
        assert "MetLife" not in prompt

    def test_prompt_builder_multilingual(self):
        """Prompt builder should include language instruction for non-English."""
        prompt = build_assistant_prompt("hola", "es", None)
        assert "'es'" in prompt

    def test_prompt_builder_role_volunteer(self):
        """Prompt builder should include volunteer context for volunteer role."""
        prompt = build_assistant_prompt("schedule", "en", None, role="volunteer")
        assert "Volunteer" in prompt

    def test_prompt_builder_role_staff(self):
        """Prompt builder should include staff context for staff role."""
        prompt = build_assistant_prompt("duties", "en", None, role="staff")
        assert "Staff" in prompt or "Organizer" in prompt

    def test_operations_prompt_builder(self):
        """Operations prompt builder should include venue and phase context."""
        prompt = build_operations_prompt(
            "metlife", "halftime", 70, 1, "rain",
            special_notes="VIP guests arriving"
        )
        assert "MetLife Stadium" in prompt
        assert "Halftime" in prompt
        assert "70%" in prompt
        assert "rain" in prompt
        assert "VIP guests arriving" in prompt

    def test_operations_fallback_critical(self):
        """Operations fallback should return Critical risk with 3+ critical zones."""
        result = build_operations_fallback("lusail", "match_live", 85, 3)
        assert result["risk_level"] == "Critical"
        assert len(result["decision_recommendations"]) == 3
        assert "briefing" in result

    def test_operations_fallback_low(self):
        """Operations fallback should return Low risk with low density."""
        result = build_operations_fallback("lusail", "pre_match", 20, 0)
        assert result["risk_level"] == "Low"

    def test_named_constants_values(self):
        """Named constants should have expected values."""
        assert BASE_DISTANCE_KM == 15.0
        assert WALK_DISTANCE_CAP_KM == 5.0

    def test_zone_recommendation_critical(self):
        """Critical density should produce urgent recommendation."""
        rec = get_zone_recommendation("north_stand", 95)
        assert "URGENT" in rec

    def test_zone_recommendation_low(self):
        """Low density should produce normal recommendation."""
        rec = get_zone_recommendation("north_stand", 30)
        assert "normally" in rec.lower()
