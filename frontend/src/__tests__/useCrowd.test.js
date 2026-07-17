/**
 * @file Test suite for useCrowd hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrowd } from '../hooks/useCrowd';

describe('useCrowd', () => {
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('initializes zones with zero density', () => {
    const { result } = renderHook(() => useCrowd());
    result.current.zones.forEach((z) => {
      expect(z.density).toBe(0);
      expect(z.count).toBe(0);
    });
  });

  it('defaults venueId to lusail', () => {
    const { result } = renderHook(() => useCrowd());
    expect(result.current.venueId).toBe('lusail');
  });

  it('updates zone density', () => {
    const { result } = renderHook(() => useCrowd());
    act(() => { result.current.updateZoneDensity('north_stand', 75); });
    const zone = result.current.zones.find((z) => z.id === 'north_stand');
    expect(zone.density).toBe(75);
    expect(zone.count).toBe(Math.round(0.75 * zone.capacity));
  });

  it('resets zones', () => {
    const { result } = renderHook(() => useCrowd());
    act(() => { result.current.updateZoneDensity('north_stand', 80); });
    act(() => { result.current.resetZones(); });
    result.current.zones.forEach((z) => expect(z.density).toBe(0));
    expect(result.current.analysis).toBeNull();
  });

  it('generates local fallback on API error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useCrowd());
    act(() => { result.current.updateZoneDensity('vip_lounge', 95); });
    await act(async () => { await result.current.analyzeCrowd(); });
    expect(result.current.analysis).not.toBeNull();
    expect(result.current.analysis.overall_alert).toBe('critical');
  });

  it('sets analysis from API response', async () => {
    const mockResponse = {
      venue_id: 'lusail',
      total_occupancy: 5000,
      capacity: 80000,
      overall_alert: 'low',
      zones: [],
      ai_recommendation: 'All good',
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    const { result } = renderHook(() => useCrowd());
    await act(async () => { await result.current.analyzeCrowd(); });
    expect(result.current.analysis.venue_id).toBe('lusail');
  });
});
