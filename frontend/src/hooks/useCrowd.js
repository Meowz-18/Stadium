/**
 * @file Custom hook for crowd management state.
 * Manages zone density data, alert levels, and API communication.
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS, STADIUM_ZONES } from '../constants';

/**
 * @typedef {Object} ZoneState
 * @property {string} id - Zone identifier.
 * @property {string} name - Human-readable zone name.
 * @property {number} capacity - Maximum capacity.
 * @property {string} type - Zone type (seating, vip, concourse, entry).
 * @property {number} density - Current density percentage (0-100).
 * @property {number} count - Current occupant count.
 */

/**
 * @typedef {Object} CrowdAnalysis
 * @property {string} venue_id - Venue identifier.
 * @property {number} total_occupancy - Sum of all zone counts.
 * @property {number} capacity - Total venue capacity.
 * @property {string} overall_alert - Highest alert level across zones.
 * @property {Array} zones - Per-zone analysis results.
 * @property {string} ai_recommendation - AI-generated recommendation text.
 */

/**
 * Hook for managing crowd density data, zone analysis, and API communication.
 *
 * Initializes all stadium zones with zero density, provides controls to
 * update individual zone densities, and submits data to the /api/crowd
 * endpoint for AI-powered analysis. Falls back to local analysis when
 * the backend is unavailable.
 *
 * @returns {{
 *   zones: ZoneState[],
 *   analysis: CrowdAnalysis|null,
 *   isLoading: boolean,
 *   venueId: string,
 *   setVenueId: Function,
 *   updateZoneDensity: (zoneId: string, density: number) => void,
 *   analyzeCrowd: () => Promise<void>,
 *   resetZones: () => void
 * }} Crowd state and actions.
 */
export const useCrowd = () => {
  const [zones, setZones] = useState(() =>
    STADIUM_ZONES.map((z) => ({ ...z, density: 0, count: 0 }))
  );
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [venueId, setVenueId] = useState('lusail');

  const updateZoneDensity = useCallback((zoneId, density) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, density, count: Math.round((density / 100) * z.capacity) }
          : z
      )
    );
  }, []);

  const analyzeCrowd = useCallback(async () => {
    setIsLoading(true);
    try {
      const zoneData = zones.map((z) => ({
        zone_id: z.id,
        density: z.density,
        count: z.count,
      }));

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CROWD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: venueId, zones: zoneData }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch {
      // Generate local analysis as fallback
      const totalOccupancy = zones.reduce((sum, z) => sum + z.count, 0);
      const maxDensity = Math.max(...zones.map((z) => z.density), 0);
      setAnalysis({
        venue_id: venueId,
        total_occupancy: totalOccupancy,
        capacity: 80000,
        overall_alert: maxDensity > 90 ? 'critical' : maxDensity > 75 ? 'high' : maxDensity > 50 ? 'moderate' : 'low',
        zones: zones.map((z) => ({
          zone_id: z.id,
          density: z.density,
          alert_level: z.density > 90 ? 'critical' : z.density > 75 ? 'high' : z.density > 50 ? 'moderate' : 'low',
          recommendation: `${z.name} at ${z.density}% capacity.`,
        })),
        ai_recommendation: 'Crowd monitoring active. Deploy stewards to high-density zones and ensure emergency exits remain clear.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [zones, venueId]);

  const resetZones = useCallback(() => {
    setZones(STADIUM_ZONES.map((z) => ({ ...z, density: 0, count: 0 })));
    setAnalysis(null);
  }, []);

  return {
    zones,
    analysis,
    isLoading,
    venueId,
    setVenueId,
    updateZoneDensity,
    analyzeCrowd,
    resetZones,
  };
};
