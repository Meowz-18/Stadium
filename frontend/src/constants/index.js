/**
 * @file Centralized application constants for Stadium AI.
 *
 * All static data, configuration, and UI constants are defined here
 * as a single source of truth. Components import from this file
 * instead of defining their own inline data.
 *
 * Data sources:
 * - FIFA World Cup 2026 official venue list
 * - CO₂ transport factors: IPCC AR6 (2023), US EPA GHG Equivalencies
 * - Sustainability targets: FIFA Green 2026 initiative benchmarks
 */

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = Object.freeze({
  ASSISTANT: '/api/assistant',
  NAVIGATION: '/api/navigation',
  CROWD: '/api/crowd',
  TRANSPORT: '/api/transport',
  SUSTAINABILITY: '/api/sustainability',
  OPERATIONS: '/api/operations',
  HEALTH: '/api/health',
});

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------

export const NAV_ITEMS = Object.freeze([
  { path: '/', label: 'Home', id: 'nav-home' },
  { path: '/dashboard', label: 'Dashboard', id: 'nav-dashboard' },
  { path: '/navigate', label: 'Navigate', id: 'nav-navigate' },
  { path: '/assistant', label: 'AI Assistant', id: 'nav-assistant' },
  { path: '/transport', label: 'Transport', id: 'nav-transport' },
  { path: '/sustainability', label: 'Sustainability', id: 'nav-sustainability' },
]);

// ---------------------------------------------------------------------------
// FIFA World Cup 2026 Venues
// ---------------------------------------------------------------------------

export const VENUES = Object.freeze([
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'USA', capacity: 82500, emoji: '🏟️' },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Los Angeles, CA', country: 'USA', capacity: 70240, emoji: '🌴' },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: 87523, emoji: '🇲🇽' },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 45000, emoji: '🍁' },
  { id: 'lusail', name: 'Lusail Iconic Stadium', city: 'New York / New Jersey', country: 'USA', capacity: 80000, emoji: '⭐' },
]);

// ---------------------------------------------------------------------------
// Stadium Zones
// ---------------------------------------------------------------------------

export const STADIUM_ZONES = Object.freeze([
  { id: 'north_stand', name: 'North Stand', capacity: 12000, type: 'seating' },
  { id: 'south_stand', name: 'South Stand', capacity: 12000, type: 'seating' },
  { id: 'east_wing', name: 'East Wing', capacity: 10000, type: 'seating' },
  { id: 'west_wing', name: 'West Wing', capacity: 10000, type: 'seating' },
  { id: 'vip_lounge', name: 'VIP Lounge', capacity: 2000, type: 'vip' },
  { id: 'concourse_a', name: 'Concourse A', capacity: 5000, type: 'concourse' },
  { id: 'concourse_b', name: 'Concourse B', capacity: 5000, type: 'concourse' },
  { id: 'gate_area', name: 'Gate Area', capacity: 4000, type: 'entry' },
]);

// ---------------------------------------------------------------------------
// Crowd Density Levels
// ---------------------------------------------------------------------------

export const CROWD_LEVELS = Object.freeze({
  low: { label: 'Low', color: '#10b981', bgClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  moderate: { label: 'Moderate', color: '#f59e0b', bgClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  high: { label: 'High', color: '#f97316', bgClass: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  critical: { label: 'Critical', color: '#ef4444', bgClass: 'bg-red-500/10 text-red-700 border-red-500/20' },
});

// ---------------------------------------------------------------------------
// Transport Modes
// ---------------------------------------------------------------------------

export const TRANSPORT_MODES = Object.freeze([
  { id: 'metro', label: 'Metro', emoji: '🚇', co2Factor: 0.033, color: '#3b82f6' },
  { id: 'bus', label: 'Bus', emoji: '🚌', co2Factor: 0.089, color: '#22c55e' },
  { id: 'shuttle', label: 'FIFA Shuttle', emoji: '🚐', co2Factor: 0.045, color: '#8b5cf6' },
  { id: 'rideshare', label: 'Rideshare', emoji: '🚗', co2Factor: 0.170, color: '#f59e0b' },
  { id: 'walk', label: 'Walk', emoji: '🚶', co2Factor: 0.0, color: '#10b981' },
]);

// ---------------------------------------------------------------------------
// Sustainability Targets
// ---------------------------------------------------------------------------

export const SUSTAINABILITY_TARGETS = Object.freeze({
  waste_kg_per_1000: 150,
  energy_kwh_per_1000: 500,
  water_liters_per_1000: 2000,
  recycling_rate_target: 75,
});

// ---------------------------------------------------------------------------
// AI Quick Questions
// ---------------------------------------------------------------------------

export const QUICK_QUESTIONS = Object.freeze([
  'Where are the nearest restrooms?',
  'How do I get to my seat?',
  'What food options are available?',
  'Where is the accessibility entrance?',
  'What\'s the match schedule today?',
  'How do I get to the stadium by metro?',
  'What wheelchair-accessible services are available?',
]);

// ---------------------------------------------------------------------------
// Supported Languages
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
]);

// ---------------------------------------------------------------------------
// Feature Color Classes (for Landing page feature cards)
// ---------------------------------------------------------------------------

export const FEATURE_COLOR_CLASSES = Object.freeze({
  navy: 'bg-slate-800/10 text-slate-700 border-slate-800/20',
  gold: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  teal: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
});

// ---------------------------------------------------------------------------
// Sustainability Categories Colors
// ---------------------------------------------------------------------------

export const SUSTAINABILITY_COLORS = Object.freeze({
  waste: '#ef4444',
  energy: '#f59e0b',
  water: '#3b82f6',
  recycling: '#10b981',
});
