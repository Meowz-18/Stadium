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
    build_fallback_response,
    get_alert_level,
    get_zone_recommendation,
    analyze_crowd,
    estimate_routes,
    calculate_sustainability,
    build_assistant_prompt,
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

        with patch("main.model.generate_content_async", return_value=mock_response) as mock_gen:
            res = client.post("/api/assistant", json={"query": "find gate B"})
            assert res.status_code == 200
            assert res.json()["response"] == "Gate B is located on the east side of the stadium."
            mock_gen.assert_called_once()

    def test_gemini_failure_fallback(self):
        """Assistant falls back gracefully when Gemini raises an exception."""
        response_cache._cache.clear()
        with patch("main.model.generate_content_async", side_effect=Exception("API key error")):
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
