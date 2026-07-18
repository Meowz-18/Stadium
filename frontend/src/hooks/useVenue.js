/**
 * @file Custom hook for venue selection and zone navigation state.
 * Persists venue preference in localStorage.
 */

import { useState, useCallback } from 'react';
import { VENUES, STADIUM_ZONES } from '../constants';

const STORAGE_KEY = 'stadium_ai_venue';

/**
 * @typedef {Object} Venue
 * @property {string} id - Unique venue identifier.
 * @property {string} name - Venue display name.
 * @property {string} city - Host city.
 * @property {string} country - Host country.
 * @property {number} capacity - Seating capacity.
 * @property {string} emoji - Visual emoji identifier.
 */

/**
 * Hook for managing venue selection and zone navigation state.
 *
 * Persists the selected venue preference in localStorage so it
 * survives page reloads. Provides zone selection and accessibility
 * toggle controls.
 *
 * @returns {{
 *   selectedVenue: Venue,
 *   selectedZone: Object|null,
 *   showAccessible: boolean,
 *   selectVenue: (venueId: string) => void,
 *   selectZone: (zoneId: string) => void,
 *   toggleAccessible: () => void,
 *   venues: Venue[],
 *   zones: Object[]
 * }} Venue state and actions.
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
