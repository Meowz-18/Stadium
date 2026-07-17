/**
 * @file Test suite for utility helper functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeInput,
  debounce,
  clamp,
  formatNumber,
  formatCO2,
  getCrowdLevel,
  getTimestamp,
  formatGoogleCalendarDate,
  openGoogleCalendarEvent,
  getSustainabilityGrade,
} from '../utils/helpers';

describe('sanitizeInput', () => {
  it('strips script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
  });
  it('preserves safe text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });
  it('strips event handlers', () => {
    expect(sanitizeInput('<img onerror="alert(1)" />')).not.toContain('onerror');
  });
});

describe('debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });
  it('cancels pending calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
  it('only fires the last call in rapid sequence', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('c');
  });
});

describe('clamp', () => {
  it('clamps value below min', () => { expect(clamp(-5, 0, 100)).toBe(0); });
  it('clamps value above max', () => { expect(clamp(150, 0, 100)).toBe(100); });
  it('returns value within range', () => { expect(clamp(50, 0, 100)).toBe(50); });
  it('handles equal min and max', () => { expect(clamp(50, 10, 10)).toBe(10); });
});

describe('formatNumber', () => {
  it('formats thousands', () => { expect(formatNumber(1000)).toBe('1,000'); });
  it('formats millions', () => { expect(formatNumber(1234567)).toBe('1,234,567'); });
  it('returns "0" for NaN', () => { expect(formatNumber(NaN)).toBe('0'); });
  it('returns "0" for non-numbers', () => { expect(formatNumber('abc')).toBe('0'); });
  it('handles zero', () => { expect(formatNumber(0)).toBe('0'); });
});

describe('formatCO2', () => {
  it('formats small values in kg', () => { expect(formatCO2(0.5)).toBe('0.5 kg CO₂'); });
  it('formats large values in tonnes', () => { expect(formatCO2(1500)).toBe('1.5t CO₂'); });
  it('formats zero', () => { expect(formatCO2(0)).toBe('0.0 kg CO₂'); });
});

describe('getCrowdLevel', () => {
  it('returns low for <=50', () => { expect(getCrowdLevel(30).level).toBe('low'); });
  it('returns moderate for 51-75', () => { expect(getCrowdLevel(60).level).toBe('moderate'); });
  it('returns high for 76-90', () => { expect(getCrowdLevel(85).level).toBe('high'); });
  it('returns critical for >90', () => { expect(getCrowdLevel(95).level).toBe('critical'); });
  it('returns color string', () => { expect(getCrowdLevel(50).color).toBe('#10b981'); });
});

describe('getTimestamp', () => {
  it('returns a string with colon', () => {
    expect(getTimestamp()).toMatch(/:/);
  });
});

describe('formatGoogleCalendarDate', () => {
  it('formats a date string into gcal format', () => {
    const result = formatGoogleCalendarDate('2026-07-19');
    expect(result).toContain('20260719');
    expect(result).toContain('/');
  });
});

describe('openGoogleCalendarEvent', () => {
  it('opens a new window with calendar URL', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => {});
    openGoogleCalendarEvent('Test Event', '20260719T130000Z/20260719T235900Z', 'Details');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('calendar.google.com');
    spy.mockRestore();
  });
});

describe('getSustainabilityGrade', () => {
  it('returns A+ for >=90', () => { expect(getSustainabilityGrade(95)).toBe('A+'); });
  it('returns A for 80-89', () => { expect(getSustainabilityGrade(85)).toBe('A'); });
  it('returns B for 70-79', () => { expect(getSustainabilityGrade(75)).toBe('B'); });
  it('returns C for 60-69', () => { expect(getSustainabilityGrade(65)).toBe('C'); });
  it('returns D for <60', () => { expect(getSustainabilityGrade(40)).toBe('D'); });
});
