/**
 * @file Transportation planner page for Stadium AI.
 * Multi-modal route comparison with CO₂ estimates and Google Calendar sync.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bus, Leaf, Clock, DollarSign, Calendar, ArrowRight, TrendingDown } from 'lucide-react';
import { VENUES, TRANSPORT_MODES, API_BASE_URL, API_ENDPOINTS } from '../constants';
import { formatCO2, formatGoogleCalendarDate, openGoogleCalendarEvent } from '../utils/helpers';

const Transport = React.memo(() => {
  const [origin, setOrigin] = useState('City Center');
  const [venueId, setVenueId] = useState('lusail');
  const [routes, setRoutes] = useState(null);
  const [aiRec, setAiRec] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const venue = VENUES.find((v) => v.id === venueId) || VENUES[0];

  const planRoute = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSPORT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, venue_id: venueId }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setRoutes(data.routes);
      setAiRec(data.ai_recommendation);
    } catch {
      // Local fallback routes
      setRoutes(TRANSPORT_MODES.map((m) => ({
        mode: m.id,
        duration_min: m.id === 'walk' ? 60 : m.id === 'metro' ? 25 : m.id === 'bus' ? 45 : m.id === 'shuttle' ? 35 : 30,
        distance_km: m.id === 'walk' ? 5 : 15,
        co2_kg: m.id === 'walk' ? 0 : +(15 * m.co2Factor).toFixed(3),
        cost_usd: m.id === 'walk' ? 0 : m.id === 'metro' ? 1.80 : m.id === 'bus' ? 1.20 : m.id === 'shuttle' ? 0.75 : 12.75,
        description: `${m.label} to ${venue.name}`,
      })));
      setAiRec('We recommend the Metro for the best balance of speed, cost, and sustainability!');
    } finally {
      setIsLoading(false);
    }
  }, [origin, venueId, venue.name]);

  const handleCalendarSync = useCallback(() => {
    const dates = formatGoogleCalendarDate('2026-07-19');
    openGoogleCalendarEvent(
      `Travel to ${venue.name}`,
      dates,
      `Depart from ${origin}. Recommended mode: Metro.\n\nPowered by Stadium AI.`
    );
  }, [origin, venue.name]);

  const getModeInfo = (modeId) => TRANSPORT_MODES.find((m) => m.id === modeId) || { label: modeId, emoji: '🚌', color: '#64748b' };

  return (
    <article className="px-6 md:px-12 lg:px-20 pt-12 pb-24 relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
              <Bus size={20} className="text-blue-700" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transport Planner</h1>
          </div>
          <p className="text-slate-500 font-medium">Plan your route with CO₂ comparison and Google Calendar sync.</p>
        </motion.div>

        {/* Route Form */}
        <motion.div
          className="premium-card p-8 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="origin-input" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">From</label>
              <input
                id="origin-input"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Your location"
                className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-medium text-slate-700 shadow-sm focus-ring"
              />
            </div>
            <div>
              <label htmlFor="transport-venue" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">To (Venue)</label>
              <select
                id="transport-venue"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring"
              >
                {VENUES.map((v) => (
                  <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button onClick={planRoute} disabled={isLoading} className="btn-primary !py-3 flex-1 disabled:opacity-50">
                {isLoading ? 'Planning...' : 'Plan Route'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Route Results */}
        {routes && (
          <>
            <div className="space-y-4 mb-10" role="list" aria-label="Transportation options">
              {routes.map((route, i) => {
                const modeInfo = getModeInfo(route.mode);
                return (
                  <motion.div
                    key={route.mode}
                    className="premium-card p-6 flex flex-col md:flex-row items-start md:items-center gap-5 group hover:scale-[1.01] transition-transform"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    role="listitem"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border" style={{ backgroundColor: modeInfo.color + '15', borderColor: modeInfo.color + '30' }}>
                        {modeInfo.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">{modeInfo.label}</p>
                        <p className="text-xs text-slate-400 truncate">{route.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} className="text-slate-400" aria-hidden="true" />
                        <span className="font-bold">{route.duration_min} min</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <DollarSign size={14} className="text-slate-400" aria-hidden="true" />
                        <span className="font-bold">${route.cost_usd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Leaf size={14} className={route.co2_kg === 0 ? 'text-emerald-500' : 'text-slate-400'} aria-hidden="true" />
                        <span className={`font-bold ${route.co2_kg === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {route.co2_kg === 0 ? 'Zero CO₂' : formatCO2(route.co2_kg)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* AI Recommendation + Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="premium-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={18} className="text-emerald-600" aria-hidden="true" />
                  <h2 className="text-lg font-black text-slate-800">AI Recommendation</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{aiRec}</p>
              </motion.div>

              <motion.div
                className="premium-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-blue-600" aria-hidden="true" />
                  <h2 className="text-lg font-black text-slate-800">Calendar Sync</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">Add your travel plan to Google Calendar.</p>
                <button onClick={handleCalendarSync} className="btn-secondary !py-2.5 w-full justify-center">
                  <Calendar size={16} aria-hidden="true" />
                  Add to Google Calendar
                </button>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </article>
  );
});

Transport.displayName = 'Transport';
export default Transport;
