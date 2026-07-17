/**
 * @file Custom hook for venue selection and zone navigation state.
 * Persists venue preference in localStorage.
 */

import { useState, useCallback } from 'react';
import { VENUES, STADIUM_ZONES } from '../constants';

const STORAGE_KEY = 'stadium_ai_venue';

/**
 * Hook for managing venue selection and zone navigation.
 * @returns {Object} Venue state and actions.
 */
export const useVenue = () => {
  const [selectedVenue, setSelectedVenue] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const venue = VENUES.find((v) => v.id === stored);
        if (venue) return venue;
      }
    } catch {
      // localStorage unavailable
    }
    return VENUES[0];
  });

  const [selectedZone, setSelectedZone] = useState(null);
  const [showAccessible, setShowAccessible] = useState(false);

  const selectVenue = useCallback((venueId) => {
    const venue = VENUES.find((v) => v.id === venueId);
    if (venue) {
      setSelectedVenue(venue);
      setSelectedZone(null);
      try {
        localStorage.setItem(STORAGE_KEY, venueId);
      } catch {
        // Silent fail
      }
    }
  }, []);

  const selectZone = useCallback((zoneId) => {
    const zone = STADIUM_ZONES.find((z) => z.id === zoneId);
    setSelectedZone(zone || null);
  }, []);

  const toggleAccessible = useCallback(() => {
    setShowAccessible((prev) => !prev);
  }, []);

  return {
    selectedVenue,
    selectedZone,
    showAccessible,
    selectVenue,
    selectZone,
    toggleAccessible,
    venues: VENUES,
    zones: STADIUM_ZONES,
  };
};
