/**
 * @file Test suite for performance monitoring utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import { reportWebVitals, measureTTFB } from '../utils/performance';

describe('reportWebVitals', () => {
  it('returns a cleanup function', () => {
    const cleanup = reportWebVitals(vi.fn());
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
  it('returns noop cleanup for non-function', () => {
    const cleanup = reportWebVitals(null);
    expect(typeof cleanup).toBe('function');
  });
});

describe('measureTTFB', () => {
  it('calls onReport with TTFB metric', () => {
    const originalPerformance = global.performance;
    global.performance = {
      getEntriesByType: vi.fn().mockReturnValue([{ responseStart: 42 }]),
    };
    const onReport = vi.fn();
    measureTTFB(onReport);
    expect(onReport).toHaveBeenCalledWith({ name: 'TTFB', value: 42 });
    global.performance = originalPerformance;
  });
  it('does nothing when no nav entry', () => {
    const originalPerformance = global.performance;
    global.performance = {
      getEntriesByType: vi.fn().mockReturnValue([]),
    };
    const onReport = vi.fn();
    measureTTFB(onReport);
    expect(onReport).not.toHaveBeenCalled();
    global.performance = originalPerformance;
  });
});
