"""
Business logic and service layer for the Stadium AI API.

Contains the LRU cache, venue metadata, crowd analysis,
transportation routing, sustainability scoring, and AI
fallback response generation. Decoupled from HTTP concerns
for independent testability.

Data sources:
- FIFA World Cup 2026 official venue list
- CO₂ transport factors: IPCC AR6 (2023), US EPA
"""

from collections import OrderedDict

from app.schemas import AlertLevel


# ---------------------------------------------------------------------------
# Response Cache
# ---------------------------------------------------------------------------

class LRUCache:
    """Least-Recently-Used cache for memoizing AI responses.

    Reduces redundant Gemini API calls for repeated identical queries.
    Thread-safe for single-worker async usage (OrderedDict operations
    are atomic in CPython).

    Attributes:
        _cache: Internal ordered dictionary storing key-value pairs.
        _capacity: Maximum number of entries before eviction.
    """

    def __init__(self, capacity: int = 128) -> None:
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._capacity = capacity

    def get(self, key: str) -> str | None:
        """Retrieve a cached value, promoting it to most-recent."""
        if key not in self._cache:
            return None
        self._cache.move_to_end(key)
        return self._cache[key]

    def put(self, key: str, value: str) -> None:
        """Insert or update a cache entry, evicting LRU if at capacity."""
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        if len(self._cache) > self._capacity:
            self._cache.popitem(last=False)


# ---------------------------------------------------------------------------
# FIFA World Cup 2026 Venue Data
# ---------------------------------------------------------------------------

VENUES: dict[str, dict] = {
    "lusail": {
        "name": "Lusail Iconic Stadium",
        "city": "New York / New Jersey",
        "country": "USA",
        "capacity": 80000,
        "zones": ["north_stand", "south_stand", "east_wing", "west_wing",
                  "vip_lounge", "concourse_a", "concourse_b", "gate_area"],
    },
    "metlife": {
        "name": "MetLife Stadium",
        "city": "East Rutherford, NJ",
        "country": "USA",
        "capacity": 82500,
        "zones": ["lower_bowl", "mezzanine", "upper_deck", "field_level",
                  "concourse_main", "gate_area", "vip_suites", "press_box"],
    },
    "sofi": {
        "name": "SoFi Stadium",
        "city": "Los Angeles, CA",
        "country": "USA",
        "capacity": 70240,
        "zones": ["lower_bowl", "club_level", "upper_deck", "suites",
                  "concourse_main", "gate_area", "fan_zone", "media_center"],
    },
    "azteca": {
        "name": "Estadio Azteca",
        "city": "Mexico City",
        "country": "Mexico",
        "capacity": 87523,
        "zones": ["tribuna", "cabecera_norte", "cabecera_sur", "preferente",
                  "palcos", "general", "concourse", "gate_area"],
    },
    "bmo": {
        "name": "BMO Field",
        "city": "Toronto",
        "country": "Canada",
        "capacity": 45000,
        "zones": ["north_stand", "south_stand", "east_stand", "west_stand",
                  "concourse", "gate_area", "vip_area", "fan_zone"],
    },
}

ZONE_CAPACITIES: dict[str, int] = {
    "north_stand": 12000, "south_stand": 12000,
    "east_wing": 10000, "west_wing": 10000,
    "east_stand": 8000, "west_stand": 8000,
    "vip_lounge": 2000, "vip_suites": 3000, "vip_area": 2500,
    "concourse_a": 5000, "concourse_b": 5000, "concourse_main": 8000,
    "concourse": 6000,
    "gate_area": 4000, "fan_zone": 6000,
    "lower_bowl": 25000, "mezzanine": 15000, "upper_deck": 20000,
    "field_level": 5000, "press_box": 500, "media_center": 800,
    "club_level": 8000, "suites": 4000,
    "tribuna": 20000, "cabecera_norte": 15000, "cabecera_sur": 15000,
    "preferente": 12000, "palcos": 5000, "general": 20000,
}


# ---------------------------------------------------------------------------
# Transport CO₂ Emission Factors (kg CO₂ per passenger-km)
# Sources: IPCC AR6 WG3 (2023), US EPA GHG Equivalencies
# ---------------------------------------------------------------------------

BASE_DISTANCE_KM: float = 15.0
"""Default distance from origin to venue in km when no GPS data available."""

WALK_DISTANCE_CAP_KM: float = 5.0
"""Maximum distance offered for walking routes."""

TRANSPORT_FACTORS: dict[str, dict] = {
    "metro": {"co2_per_km": 0.033, "avg_speed_kmh": 35, "cost_per_km": 0.12},
    "bus": {"co2_per_km": 0.089, "avg_speed_kmh": 20, "cost_per_km": 0.08},
    "rideshare": {"co2_per_km": 0.170, "avg_speed_kmh": 30, "cost_per_km": 0.85},
    "walk": {"co2_per_km": 0.0, "avg_speed_kmh": 5, "cost_per_km": 0.0},
    "shuttle": {"co2_per_km": 0.045, "avg_speed_kmh": 25, "cost_per_km": 0.05},
}


# ---------------------------------------------------------------------------
# Sustainability Benchmarks (per event, per 1000 attendees)
# ---------------------------------------------------------------------------

SUSTAINABILITY_TARGETS: dict[str, float] = {
    "waste_kg_per_1000": 150.0,
    "energy_kwh_per_1000": 500.0,
    "water_liters_per_1000": 2000.0,
    "recycling_rate_target": 75.0,
}


# ---------------------------------------------------------------------------
# Crowd Analysis Service
# ---------------------------------------------------------------------------

def get_alert_level(density: int) -> AlertLevel:
    """Determine alert level from zone density percentage.

    Args:
        density: Occupancy percentage (0-100).

    Returns:
        AlertLevel enum value.
    """
    if density <= 50:
        return AlertLevel.LOW
    if density <= 75:
        return AlertLevel.MODERATE
    if density <= 90:
        return AlertLevel.HIGH
    return AlertLevel.CRITICAL


def get_zone_recommendation(zone_id: str, density: int) -> str:
    """Generate a zone-specific operational recommendation.

    Args:
        zone_id: The zone identifier.
        density: Current occupancy percentage.

    Returns:
        A recommendation string for venue staff.
    """
    level = get_alert_level(density)
    zone_name = zone_id.replace("_", " ").title()

    if level == AlertLevel.CRITICAL:
        return (
            f"URGENT: {zone_name} at {density}% capacity. "
            "Activate overflow protocols, open additional exits, "
            "and redirect incoming fans to adjacent zones."
        )
    if level == AlertLevel.HIGH:
        return (
            f"WARNING: {zone_name} approaching capacity ({density}%). "
            "Deploy additional stewards and prepare to redirect foot traffic."
        )
    if level == AlertLevel.MODERATE:
        return (
            f"{zone_name} at moderate occupancy ({density}%). "
            "Monitor closely and ensure concession stands are fully staffed."
        )
    return f"{zone_name} operating normally at {density}% capacity."


def analyze_crowd(venue_id: str, zones: list[dict]) -> dict:
    """Analyze crowd density across all zones and generate recommendations.

    Args:
        venue_id: Venue identifier.
        zones: List of zone reports with zone_id, density, count.

    Returns:
        Dictionary with zone analyses, totals, and overall alert.
    """
    venue = VENUES.get(venue_id, VENUES["lusail"])
    zone_analyses = []
    total_occupancy = 0
    max_density = 0

    for zone in zones:
        zid = zone["zone_id"]
        density = zone["density"]
        count = zone.get("count", 0)
        total_occupancy += count
        max_density = max(max_density, density)

        zone_analyses.append({
            "zone_id": zid,
            "density": density,
            "alert_level": get_alert_level(density),
            "recommendation": get_zone_recommendation(zid, density),
        })

    overall_alert = get_alert_level(max_density)

    return {
        "venue_id": venue_id,
        "total_occupancy": total_occupancy,
        "capacity": venue["capacity"],
        "overall_alert": overall_alert,
        "zones": zone_analyses,
    }


# ---------------------------------------------------------------------------
# Transportation Service
# ---------------------------------------------------------------------------

def estimate_routes(origin: str, venue_id: str) -> list[dict]:
    """Estimate transportation routes from origin to venue.

    Args:
        origin: Starting location description.
        venue_id: Destination venue identifier.

    Returns:
        List of route options with mode, duration, distance, CO₂, cost.
    """
    venue = VENUES.get(venue_id, VENUES["lusail"])

    routes = []
    for mode, factors in TRANSPORT_FACTORS.items():
        distance = BASE_DISTANCE_KM if mode != "walk" else min(BASE_DISTANCE_KM, WALK_DISTANCE_CAP_KM)
        duration = round(distance / factors["avg_speed_kmh"] * 60)
        co2 = round(distance * factors["co2_per_km"], 3)
        cost = round(distance * factors["cost_per_km"], 2)

        descriptions = {
            "metro": f"Take the metro to {venue['city']} stadium station. "
                     "Fast, affordable, and eco-friendly.",
            "bus": f"City bus route to {venue['name']}. "
                   "Multiple stops, budget-friendly option.",
            "rideshare": f"Direct rideshare to {venue['name']} drop-off zone. "
                         "Most convenient, door-to-door service.",
            "walk": f"Walk to {venue['name']} via main pedestrian route. "
                    "Zero emissions, enjoy the fan atmosphere.",
            "shuttle": f"Official FIFA shuttle from {origin} to {venue['name']}. "
                       "Dedicated lanes for fastest arrival.",
        }

        routes.append({
            "mode": mode,
            "duration_min": duration,
            "distance_km": distance,
            "co2_kg": co2,
            "cost_usd": cost,
            "description": descriptions.get(mode, f"{mode} to {venue['name']}"),
        })

    return routes


# ---------------------------------------------------------------------------
# Sustainability Service
# ---------------------------------------------------------------------------

def calculate_sustainability(
    venue_id: str,
    waste_kg: float = 0,
    energy_kwh: float = 0,
    water_liters: float = 0,
    recycling_rate: float = 0,
    attendance: int = 1,
) -> dict:
    """Calculate sustainability score for a venue event.

    Scores each category 0-100 based on per-capita performance
    against FIFA sustainability targets. Overall score is a
    weighted average.

    Args:
        venue_id: Venue identifier.
        waste_kg: Total waste generated in kg.
        energy_kwh: Total energy consumed in kWh.
        water_liters: Total water consumed in liters.
        recycling_rate: Recycling rate as percentage (0-100).
        attendance: Total event attendance.

    Returns:
        Dictionary with scores, breakdown, per-capita metrics,
        and a letter grade.
    """
    per_1000 = max(attendance, 1) / 1000

    waste_per = waste_kg / per_1000 if per_1000 > 0 else 0
    energy_per = energy_kwh / per_1000 if per_1000 > 0 else 0
    water_per = water_liters / per_1000 if per_1000 > 0 else 0

    targets = SUSTAINABILITY_TARGETS
    waste_score = max(0, min(100, 100 * (1 - waste_per / targets["waste_kg_per_1000"])))
    energy_score = max(0, min(100, 100 * (1 - energy_per / targets["energy_kwh_per_1000"])))
    water_score = max(0, min(100, 100 * (1 - water_per / targets["water_liters_per_1000"])))
    recycling_score = min(100, recycling_rate / targets["recycling_rate_target"] * 100)

    overall = round(
        waste_score * 0.30
        + energy_score * 0.25
        + water_score * 0.20
        + recycling_score * 0.25,
        1,
    )

    if overall >= 90:
        grade = "A+"
    elif overall >= 80:
        grade = "A"
    elif overall >= 70:
        grade = "B"
    elif overall >= 60:
        grade = "C"
    else:
        grade = "D"

    return {
        "venue_id": venue_id,
        "overall_score": overall,
        "grade": grade,
        "breakdown": {
            "waste_score": round(waste_score, 1),
            "energy_score": round(energy_score, 1),
            "water_score": round(water_score, 1),
            "recycling_score": round(recycling_score, 1),
        },
        "per_capita": {
            "waste_kg_per_1000": round(waste_per, 2),
            "energy_kwh_per_1000": round(energy_per, 2),
            "water_liters_per_1000": round(water_per, 2),
        },
    }


# ---------------------------------------------------------------------------
# AI Prompt Builder
# ---------------------------------------------------------------------------

def build_assistant_prompt(query: str, language: str, venue_id: str | None, role: str = "fan") -> str:
    """Build a context-aware prompt for the Gemini AI model.

    Injects venue-specific context when a venue_id is provided and customizes instructions
    based on the user's role (fan, volunteer, staff).

    Args:
        query: The user's question.
        language: ISO 639-1 language code.
        venue_id: Optional venue identifier.
        role: The user's role (e.g. fan, volunteer, staff).

    Returns:
        A structured prompt string for Gemini.
    """
    venue_context = ""
    if venue_id and venue_id in VENUES:
        venue = VENUES[venue_id]
        venue_context = (
            f" You are stationed at {venue['name']} in {venue['city']}, "
            f"{venue['country']} (capacity: {venue['capacity']:,}). "
            f"Available zones: {', '.join(venue['zones'])}."
        )

    lang_instruction = ""
    if language != "en":
        lang_instruction = (
            f" IMPORTANT: Respond in the language with ISO code '{language}'. "
            "If unsure, respond in English."
        )

    role_instruction = ""
    if role == "volunteer":
        role_instruction = (
            " The user is a Volunteer. Focus on volunteering logistics, shift guidelines, volunteer dining areas, "
            "helping fans, and how to contact the volunteer coordinator. Keep the tone helpful, professional, and team-oriented."
        )
    elif role in ("staff", "organizer"):
        role_instruction = (
            " The user is a Stadium Staff / Organizer. Provide details relevant to stadium operations, "
            "security protocols, crowd-monitoring tasks, safety procedures, and administrative duties. Keep the tone professional, precise, and operational."
        )
    else:
        role_instruction = (
            " The user is a Fan. Focus on amenities, restroom locations, food concessions, match schedules, "
            "merchandise shops, public transportation, and general fan experience. Keep the tone enthusiastic, welcoming, and informative."
        )

    return (
        "You are Stadium AI, an intelligent assistant for the FIFA World Cup "
        "2026. You help fans navigate stadiums, find amenities, understand "
        "match schedules, plan transportation, and learn about sustainability "
        "initiatives. Be helpful, concise, and enthusiastic about football. "
        "Provide practical, actionable information."
        f"{venue_context}{role_instruction}{lang_instruction}"
        f" Answer the following query accurately and concisely: {query}"
    )


# ---------------------------------------------------------------------------
# Navigation Prompt Builder & Fallback
# ---------------------------------------------------------------------------

def build_navigation_prompt(venue_id: str, start_zone_id: str, end_zone_id: str, accessible: bool) -> str:
    """Build a prompt for the Gemini AI model to generate navigation instructions.

    Args:
        venue_id: Venue identifier.
        start_zone_id: Starting zone identifier.
        end_zone_id: Destination zone identifier.
        accessible: If true, enforce wheelchair/accessible pathways.

    Returns:
        Structured prompt string.
    """
    venue_name = VENUES.get(venue_id, {}).get("name", "the stadium")
    start_name = start_zone_id.replace("_", " ").title()
    end_name = end_zone_id.replace("_", " ").title()

    access_instr = (
        " Accessibility Mode is ENABLED. The route MUST be fully wheelchair-accessible, "
        "relying strictly on elevators, ramps, and flat level pathways. Do NOT route "
        "through stairs, escalators, or narrow turnstiles, and explicitly state that the "
        "route is accessible."
        if accessible
        else " Standard navigation. You may route through stairs, escalators, and regular corridors."
    )

    return (
        f"You are Stadium AI Navigation, an assistant for FIFA World Cup 2026. "
        f"Provide a clear, step-by-step navigation guide from the '{start_name}' to the '{end_name}' "
        f"at {venue_name}."
        f"{access_instr}"
        f" Keep instructions extremely clear, concise (under 4 steps), and direct for a fan or steward."
    )


def build_navigation_fallback(venue_id: str, start_zone_id: str, end_zone_id: str, accessible: bool) -> str:
    """Generate a high-quality fallback navigation response when Gemini is down.

    Args:
        venue_id: Venue identifier.
        start_zone_id: Starting zone identifier.
        end_zone_id: Destination zone identifier.
        accessible: If true, enforce wheelchair/accessible pathways.

    Returns:
        Fallback navigation string.
    """
    venue = VENUES.get(venue_id, VENUES["lusail"])
    start_name = start_zone_id.replace("_", " ").title()
    end_name = end_zone_id.replace("_", " ").title()

    if start_zone_id == end_zone_id:
        return f"You are currently at the {start_name}. No transit is required."

    steps = [
        f"1. Depart from {start_name} and locate the nearest concourse directory map.",
        f"2. Follow the directional signage towards the {end_name} section."
    ]

    if accessible:
        steps.append(
            "3. [Accessibility] Head to Elevator Block B/D, take the elevator to your destination level."
        )
        steps.append(
            "4. [Accessibility] Use the wide-corridor accessible gates to enter the seating bowl."
        )
    else:
        steps.append(
            "3. Take the main escalators or staircases to the correct concourse tier."
        )
        steps.append(
            f"4. Proceed to the entry gates at the {end_name}."
        )

    return (
        f"Fallback Route at {venue['name']}:\n" + "\n".join(steps)
    )



# ---------------------------------------------------------------------------
# AI Fallback Response Generator
# ---------------------------------------------------------------------------

def build_fallback_response(user_query: str) -> str:
    """Generate a structured fallback when the Gemini API is unavailable.

    Matches keyword patterns against the lowercased query and returns
    a relevant, informative response about stadium operations.

    Args:
        user_query: The lowercased user query string.

    Returns:
        A contextually relevant response string.
    """
    if any(kw in user_query for kw in ("accessible", "wheelchair", "disability", "assist")):
        return (
            "Accessibility services: Wheelchair-accessible seating is in Sections "
            "A1-A4 and C1-C4. Elevators are at Gates A, C, and E. Audio description "
            "headsets are available at the Fan Services desk. Service animals welcome. "
            "Sensory rooms are located near Gate B on Level 2."
        )
    if any(kw in user_query for kw in ("sustain", "green", "recycle", "environment", "waste")):
        return (
            "Sustainability at the venue: This stadium operates on 40% renewable "
            "energy. Recycling bins (blue) and compost bins (green) are at every "
            "concourse intersection. Single-use plastics are prohibited — beverages "
            "are served in reusable FIFA cups with a refundable deposit."
        )
    if any(kw in user_query for kw in ("food", "drink", "eat", "restaurant", "concession")):
        return (
            "Food & beverages: Concession stands are located on every level. "
            "Halal, vegetarian, and allergen-free options are available at stands "
            "marked with green flags. Water refill stations are free and located "
            "near every restroom block. Mobile ordering is available via the app."
        )
    if any(kw in user_query for kw in ("transport", "bus", "metro", "taxi", "parking")):
        return (
            "Transportation options: Metro Line 2 runs directly to the stadium "
            "(every 5 minutes on match days). Official FIFA shuttles depart from "
            "City Center every 15 minutes starting 3 hours before kickoff. "
            "Rideshare drop-off is at Gate E. Parking lots open 4 hours early."
        )
    if any(kw in user_query for kw in ("crowd", "busy", "wait", "queue", "line")):
        return (
            "To avoid crowds: Arrive 90 minutes before kickoff. Use Gates B or D "
            "which typically have shorter lines. Concession stands on the upper "
            "concourse are usually less busy. Half-time rush peaks at minutes 46-52."
        )
    if any(kw in user_query for kw in ("match", "score", "team", "schedule", "kick")):
        return (
            "Match information: Check the giant LED screens for live scores and "
            "upcoming fixtures. The FIFA World Cup 2026 features 48 teams across "
            "16 venues in the USA, Mexico, and Canada. Group stage runs June 11 to "
            "June 29, knockout rounds begin July 1, and the Final is July 19, 2026."
        )
    if any(kw in user_query for kw in ("navigate", "find", "where", "map", "direction")):
        return (
            "For stadium navigation: Follow the color-coded signage system — "
            "blue for gates, green for concessions, red for emergency exits. "
            "Check the overhead LED screens for real-time directions. "
            "Accessibility routes are marked with yellow floor strips."
        )
    return (
        f"As your Stadium AI assistant, I can help with your question about "
        f"'{user_query}'. I provide information about stadium navigation, "
        f"crowd conditions, transportation, food services, accessibility, "
        f"sustainability, and match schedules. What would you like to know?"
    )


# ---------------------------------------------------------------------------
# Operational Intelligence Prompt Builder & Fallback
# ---------------------------------------------------------------------------

def build_operations_prompt(
    venue_id: str,
    event_phase: str,
    crowd_density_avg: int,
    critical_zone_count: int,
    weather: str,
    special_notes: str | None = None,
) -> str:
    """Build a prompt for the Gemini AI model to generate an operational briefing.

    Produces a comprehensive decision-support briefing covering staffing,
    emergency preparedness, resource allocation, and crowd flow.

    Args:
        venue_id: Venue identifier.
        event_phase: Current event lifecycle phase (e.g. pre_match, halftime).
        crowd_density_avg: Average crowd density across all zones.
        critical_zone_count: Number of zones above 90% density.
        weather: Current weather conditions.
        special_notes: Optional additional context.

    Returns:
        Structured prompt string for Gemini.
    """
    venue = VENUES.get(venue_id, VENUES["lusail"])
    phase_label = event_phase.replace("_", " ").title()

    notes_section = ""
    if special_notes:
        notes_section = f" Additional context: {special_notes}."

    return (
        "You are Stadium AI Operations, the real-time decision support system for "
        "FIFA World Cup 2026 venue staff. Generate a concise operational intelligence "
        "briefing based on the following venue state:\n"
        f"- Venue: {venue['name']} in {venue['city']}, {venue['country']} "
        f"(capacity: {venue['capacity']:,})\n"
        f"- Event Phase: {phase_label}\n"
        f"- Average Crowd Density: {crowd_density_avg}%\n"
        f"- Critical Zones (>90%%): {critical_zone_count}\n"
        f"- Weather: {weather}\n"
        f"{notes_section}\n\n"
        "Provide:\n"
        "1. A brief situational summary (2-3 sentences)\n"
        "2. Exactly 3 actionable decision recommendations for venue operations staff\n"
        "3. A risk level assessment (Low, Moderate, High, Critical)\n\n"
        "Be specific, practical, and concise. Format as plain text."
    )


def build_operations_fallback(
    venue_id: str,
    event_phase: str,
    crowd_density_avg: int,
    critical_zone_count: int,
) -> dict:
    """Generate a fallback operational briefing when Gemini is unavailable.

    Args:
        venue_id: Venue identifier.
        event_phase: Current event lifecycle phase.
        crowd_density_avg: Average crowd density across all zones.
        critical_zone_count: Number of zones above 90% density.

    Returns:
        Dictionary with briefing, recommendations, and risk level.
    """
    venue = VENUES.get(venue_id, VENUES["lusail"])
    phase_label = event_phase.replace("_", " ").title()

    if critical_zone_count > 2:
        risk = "Critical"
    elif critical_zone_count > 0 or crowd_density_avg > 75:
        risk = "High"
    elif crowd_density_avg > 50:
        risk = "Moderate"
    else:
        risk = "Low"

    briefing = (
        f"{venue['name']} is currently in {phase_label} phase. "
        f"Average crowd density stands at {crowd_density_avg}% with "
        f"{critical_zone_count} zone(s) in critical status. "
        f"Overall operational risk level: {risk}."
    )

    recommendations = [
        f"Deploy additional stewards to the {critical_zone_count} critical zone(s) and activate overflow routing protocols."
        if critical_zone_count > 0
        else "Maintain standard steward deployment across all zones; no immediate escalation needed.",
        "Ensure all emergency exits remain clear and accessible. Verify communication channels with medical and security teams.",
        "Monitor gate throughput rates and pre-position crowd management resources for the next anticipated surge period.",
    ]

    return {
        "briefing": briefing,
        "decision_recommendations": recommendations,
        "risk_level": risk,
    }
