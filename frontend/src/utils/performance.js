/**
 * @file Performance monitoring utilities for Stadium AI.
 * Core Web Vitals (LCP, CLS, FCP, TTFB) measurement and reporting.
 */

const observe = (type, callback) => {
  if (typeof PerformanceObserver === 'undefined') return null;
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(callback);
    });
    observer.observe({ type, buffered: true });
    return observer;
  } catch {
    return null;
  }
};

export const measureLCP = (onReport) => {
  const observer = observe('largest-contentful-paint', (entry) => {
    onReport({ name: 'LCP', value: Math.round(entry.startTime) });
  });
  return () => observer?.disconnect();
};

export const measureCLS = (onReport) => {
  let clsValue = 0;
  const observer = observe('layout-shift', (entry) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      onReport({ name: 'CLS', value: clsValue });
    }
  });
  return () => observer?.disconnect();
};

export const measureFCP = (onReport) => {
  const observer = observe('paint', (entry) => {
    if (entry.name === 'first-contentful-paint') {
      onReport({ name: 'FCP', value: Math.round(entry.startTime) });
    }
  });
  return () => observer?.disconnect();
};

export const measureTTFB = (onReport) => {
  if (typeof performance === 'undefined') return;
  const [navEntry] = performance.getEntriesByType('navigation');
  if (navEntry) {
    onReport({ name: 'TTFB', value: Math.round(navEntry.responseStart) });
  }
};

export const reportWebVitals = (onReport) => {
  if (typeof onReport !== 'function') return () => {};
  const cleanupFns = [measureLCP(onReport), measureCLS(onReport), measureFCP(onReport)];
  measureTTFB(onReport);
  return () => cleanupFns.forEach((fn) => fn?.());
};
