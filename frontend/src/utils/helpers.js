/**
 * @file Shared utility functions for the Stadium AI application.
 * Provides reusable helpers for formatting, sanitization, and calculations.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes a string to prevent XSS attacks.
 * @param {string} dirty - The untrusted input string.
 * @returns {string} The sanitized string.
 */
export const sanitizeInput = (dirty) => DOMPurify.sanitize(dirty);

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {Function} The debounced function with a cancel method.
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};

/**
 * Clamps a number between a min and max value.
 * @param {number} value - The number to clamp.
 * @param {number} min - Minimum bound.
 * @param {number} max - Maximum bound.
 * @returns {number} The clamped value.
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Formats a number with locale-aware separators.
 * @param {number} num - The number to format.
 * @returns {string} Formatted number string.
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
};

/**
 * Formats a CO₂ value into a human-readable string.
 * @param {number} kgCO2 - Amount of CO₂ in kilograms.
 * @returns {string} Formatted string (e.g. "2.5 kg CO₂").
 */
export const formatCO2 = (kgCO2) => {
  if (kgCO2 >= 1000) {
    return `${(kgCO2 / 1000).toFixed(1)}t CO₂`;
  }
  return `${kgCO2.toFixed(1)} kg CO₂`;
};

/**
 * Returns a crowd level label and color from density percentage.
 * @param {number} density - Occupancy percentage (0-100).
 * @returns {{ level: string, color: string }} Level and color.
 */
export const getCrowdLevel = (density) => {
  if (density <= 50) return { level: 'low', color: '#10b981' };
  if (density <= 75) return { level: 'moderate', color: '#f59e0b' };
  if (density <= 90) return { level: 'high', color: '#f97316' };
  return { level: 'critical', color: '#ef4444' };
};

/**
 * Generates a human-readable timestamp string.
 * @returns {string} The formatted time (e.g. "10:30 AM").
 */
export const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Formats a date string into a Google Calendar-compatible date range string.
 * @param {string} dateStr - A parseable date string.
 * @returns {string} The formatted date string for gcal URL.
 */
export const formatGoogleCalendarDate = (dateStr) => {
  const dateObj = new Date(dateStr);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T130000Z/${yyyy}${mm}${dd}T235900Z`;
};

/**
 * Opens a Google Calendar event creation page in a new tab.
 * @param {string} title - The event title.
 * @param {string} dates - The gcal-formatted date range string.
 * @param {string} [details=''] - Optional event details.
 */
export const openGoogleCalendarEvent = (title, dates, details = '') => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${title} - Stadium AI`,
    dates,
    details,
  });
  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    '_blank',
    'noopener,noreferrer'
  );
};

/**
 * Returns a sustainability grade from a score.
 * @param {number} score - The sustainability score (0-100).
 * @returns {string} Grade letter (A+, A, B, C, D).
 */
export const getSustainabilityGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};
