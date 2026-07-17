/**
 * @file Test suite for useVenue hook.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVenue } from '../hooks/useVenue';

describe('useVenue', () => {
  it('initializes with first venue', () => {
    const { result } = renderHook(() => useVenue());
    expect(result.current.selectedVenue.id).toBeTruthy();
  });

  it('has no selected zone initially', () => {
    const { result } = renderHook(() => useVenue());
    expect(result.current.selectedZone).toBeNull();
  });

  it('accessibility mode defaults to false', () => {
    const { result } = renderHook(() => useVenue());
    expect(result.current.showAccessible).toBe(false);
  });

  it('selects a venue by ID', () => {
    const { result } = renderHook(() => useVenue());
    act(() => { result.current.selectVenue('sofi'); });
    expect(result.current.selectedVenue.id).toBe('sofi');
  });

  it('clears selected zone on venue change', () => {
    const { result } = renderHook(() => useVenue());
    act(() => { result.current.selectZone('north_stand'); });
    expect(result.current.selectedZone).not.toBeNull();
    act(() => { result.current.selectVenue('azteca'); });
    expect(result.current.selectedZone).toBeNull();
  });

  it('selects a zone by ID', () => {
    const { result } = renderHook(() => useVenue());
    act(() => { result.current.selectZone('vip_lounge'); });
    expect(result.current.selectedZone.id).toBe('vip_lounge');
  });

  it('toggles accessibility mode', () => {
    const { result } = renderHook(() => useVenue());
    act(() => { result.current.toggleAccessible(); });
    expect(result.current.showAccessible).toBe(true);
    act(() => { result.current.toggleAccessible(); });
    expect(result.current.showAccessible).toBe(false);
  });

  it('exposes venues and zones arrays', () => {
    const { result } = renderHook(() => useVenue());
    expect(result.current.venues.length).toBeGreaterThan(0);
    expect(result.current.zones.length).toBeGreaterThan(0);
  });
});
