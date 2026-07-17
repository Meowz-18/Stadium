/**
 * @file Test suite for centralized constants.
 */

import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  NAV_ITEMS,
  VENUES,
  STADIUM_ZONES,
  CROWD_LEVELS,
  TRANSPORT_MODES,
  SUSTAINABILITY_TARGETS,
  QUICK_QUESTIONS,
  SUPPORTED_LANGUAGES,
} from '../constants';

describe('API constants', () => {
  it('API_BASE_URL is a string', () => { expect(typeof API_BASE_URL).toBe('string'); });
  it('API_ENDPOINTS has all keys', () => {
    expect(API_ENDPOINTS).toHaveProperty('ASSISTANT');
    expect(API_ENDPOINTS).toHaveProperty('CROWD');
    expect(API_ENDPOINTS).toHaveProperty('TRANSPORT');
    expect(API_ENDPOINTS).toHaveProperty('SUSTAINABILITY');
    expect(API_ENDPOINTS).toHaveProperty('HEALTH');
  });
  it('API_ENDPOINTS are frozen', () => { expect(Object.isFrozen(API_ENDPOINTS)).toBe(true); });
});

describe('NAV_ITEMS', () => {
  it('has at least 5 items', () => { expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(5); });
  it('each item has path, label, id', () => {
    NAV_ITEMS.forEach((item) => {
      expect(item).toHaveProperty('path');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('id');
    });
  });
  it('is frozen', () => { expect(Object.isFrozen(NAV_ITEMS)).toBe(true); });
});

describe('VENUES', () => {
  it('has at least 3 venues', () => { expect(VENUES.length).toBeGreaterThanOrEqual(3); });
  it('each venue has id, name, capacity', () => {
    VENUES.forEach((v) => {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.capacity).toBeGreaterThan(0);
    });
  });
  it('all venue IDs are unique', () => {
    const ids = VENUES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('STADIUM_ZONES', () => {
  it('has at least 5 zones', () => { expect(STADIUM_ZONES.length).toBeGreaterThanOrEqual(5); });
  it('each zone has a type', () => {
    STADIUM_ZONES.forEach((z) => {
      expect(['seating', 'vip', 'concourse', 'entry']).toContain(z.type);
    });
  });
});

describe('CROWD_LEVELS', () => {
  it('has low, moderate, high, critical', () => {
    expect(CROWD_LEVELS).toHaveProperty('low');
    expect(CROWD_LEVELS).toHaveProperty('moderate');
    expect(CROWD_LEVELS).toHaveProperty('high');
    expect(CROWD_LEVELS).toHaveProperty('critical');
  });
  it('each level has label and color', () => {
    Object.values(CROWD_LEVELS).forEach((l) => {
      expect(l.label).toBeTruthy();
      expect(l.color).toBeTruthy();
    });
  });
});

describe('TRANSPORT_MODES', () => {
  it('has at least 4 modes', () => { expect(TRANSPORT_MODES.length).toBeGreaterThanOrEqual(4); });
  it('walk has zero CO2 factor', () => {
    const walk = TRANSPORT_MODES.find((m) => m.id === 'walk');
    expect(walk.co2Factor).toBe(0);
  });
});

describe('SUSTAINABILITY_TARGETS', () => {
  it('has all target keys', () => {
    expect(SUSTAINABILITY_TARGETS).toHaveProperty('waste_kg_per_1000');
    expect(SUSTAINABILITY_TARGETS).toHaveProperty('energy_kwh_per_1000');
    expect(SUSTAINABILITY_TARGETS).toHaveProperty('water_liters_per_1000');
    expect(SUSTAINABILITY_TARGETS).toHaveProperty('recycling_rate_target');
  });
});

describe('QUICK_QUESTIONS', () => {
  it('has at least 3 questions', () => { expect(QUICK_QUESTIONS.length).toBeGreaterThanOrEqual(3); });
  it('all are non-empty strings', () => {
    QUICK_QUESTIONS.forEach((q) => {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(5);
    });
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('has at least 5 languages', () => { expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(5); });
  it('includes English', () => {
    expect(SUPPORTED_LANGUAGES.find((l) => l.code === 'en')).toBeTruthy();
  });
  it('each language has code, label, flag', () => {
    SUPPORTED_LANGUAGES.forEach((l) => {
      expect(l.code.length).toBeGreaterThanOrEqual(2);
      expect(l.label).toBeTruthy();
      expect(l.flag).toBeTruthy();
    });
  });
});
