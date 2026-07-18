/**
 * @file Venue navigator page for Stadium AI.
 * Interactive zone map, zone details, and accessibility features.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Map, MapPin, Accessibility, Eye, ArrowRight, Info, Sparkles, Navigation } from 'lucide-react';
import { useVenue } from '../hooks/useVenue';
import { formatNumber } from '../utils/helpers';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

const ZONE_COLORS = {
  seating: '#3b82f6',
  vip: '#c9a227',
  concourse: '#10b981',
  entry: '#f97316',
};

const Navigator = React.memo(() => {
  const { selectedVenue, selectedZone, showAccessible, selectVenue, selectZone, toggleAccessible, venues, zones } = useVenue();
  const [startZoneId, setStartZoneId] = React.useState('gate_area');
  const [directions, setDirections] = React.useState('');
  const [isNavLoading, setIsNavLoading] = React.useState(false);

  const getDirections = React.useCallback(async () => {
    if (!selectedZone) return;
    setIsNavLoading(true);
    setDirections('');
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NAVIGATION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: selectedVenue.id,
          start_zone_id: startZoneId,
          end_zone_id: selectedZone.id,
          accessible: showAccessible,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setDirections(data.directions);
    } catch {
      // Local fallback navigation
      if (startZoneId === selectedZone.id) {
        setDirections(`You are already at the ${selectedZone.name}. No transit is required.`);
      } else {
        const startName = startZoneId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const steps = [
          `1. Depart from ${startName} and locate the nearest concourse directory map.`,
          `2. Follow the directional signage towards the ${selectedZone.name} section.`
        ];
        if (showAccessible) {
          steps.push(`3. [Accessibility] Head to Elevator Block B/D, take the elevator to your destination level.`);
          steps.push(`4. [Accessibility] Use the wide-corridor accessible gates to enter the seating bowl.`);
        } else {
          steps.push(`3. Take the main escalators or staircases to the correct concourse tier.`);
          steps.push(`4. Proceed to the entry gates at the ${selectedZone.name}.`);
        }
        setDirections(`Fallback Route at ${selectedVenue.name}:\n` + steps.join('\n'));
      }
    } finally {
      setIsNavLoading(false);
    }
  }, [selectedVenue.id, selectedVenue.name, startZoneId, selectedZone, showAccessible]);

  return (
    <article className="px-6 md:px-12 lg:px-20 pt-12 pb-24 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Map size={20} className="text-emerald-700" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Venue Navigator</h1>
          </div>
          <p className="text-slate-500 font-medium">Interactive stadium maps with AI-powered wayfinding and accessibility routes.</p>
        </motion.div>

        {/* Venue Selector + Accessibility Toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <label htmlFor="nav-venue" className="sr-only">Select venue</label>
          <select
            id="nav-venue"
            value={selectedVenue.id}
            onChange={(e) => selectVenue(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
            ))}
          </select>
          <button
            onClick={toggleAccessible}
            className={`btn-secondary !py-2.5 !px-6 ${showAccessible ? '!bg-blue-600 !text-white !border-blue-600' : ''}`}
            aria-pressed={showAccessible}
          >
            <Accessibility size={16} aria-hidden="true" />
            {showAccessible ? 'Accessibility Mode ON' : 'Accessibility Mode'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stadium Map (SVG Visualization) */}
          <motion.div
            className="lg:col-span-2 premium-card p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">{selectedVenue.name}</h2>
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/50">
              {/* SVG Stadium Map */}
              <svg viewBox="0 0 400 300" className="w-full h-auto" role="img" aria-label={`Stadium map of ${selectedVenue.name}`}>
                {/* Field */}
                <rect x="120" y="90" width="160" height="120" rx="8" fill="#1b5e20" opacity="0.15" stroke="#1b5e20" strokeWidth="1.5" />
                <ellipse cx="200" cy="150" rx="30" ry="30" fill="none" stroke="#1b5e20" strokeWidth="1" opacity="0.3" />
                <line x1="200" y1="90" x2="200" y2="210" stroke="#1b5e20" strokeWidth="1" opacity="0.3" />

                {/* Zones as clickable areas */}
                {zones.map((zone, i) => {
                  const positions = [
                    { x: 140, y: 30, w: 120, h: 50 },   // north_stand
                    { x: 140, y: 220, w: 120, h: 50 },  // south_stand
                    { x: 290, y: 90, w: 50, h: 120 },   // east_wing
                    { x: 60, y: 90, w: 50, h: 120 },    // west_wing
                    { x: 310, y: 30, w: 80, h: 50 },    // vip_lounge
                    { x: 10, y: 30, w: 80, h: 50 },     // concourse_a
                    { x: 10, y: 220, w: 80, h: 50 },    // concourse_b
                    { x: 310, y: 220, w: 80, h: 50 },   // gate_area
                  ];
                  const pos = positions[i] || { x: 0, y: 0, w: 40, h: 40 };
                  const isSelected = selectedZone?.id === zone.id;
                  const fillColor = ZONE_COLORS[zone.type] || '#94a3b8';

                  return (
                    <g
                      key={zone.id}
                      onClick={() => selectZone(zone.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          selectZone(zone.id);
                        }
                      }}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${zone.name} - ${zone.type} zone`}
                    >
                      <rect
                        x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="8"
                        fill={fillColor} opacity={isSelected ? 0.4 : 0.15}
                        stroke={isSelected ? fillColor : 'transparent'}
                        strokeWidth={isSelected ? 2.5 : 0}
                        className="transition-all duration-200 hover:opacity-30"
                      />
                      <text
                        x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        className="text-[8px] font-bold fill-slate-600 pointer-events-none select-none"
                      >
                        {zone.name.length > 12 ? zone.name.slice(0, 11) + '…' : zone.name}
                      </text>
                    </g>
                  );
                })}

                {/* Accessibility markers */}
                {showAccessible && (
                  <>
                    <circle cx="75" cy="150" r="6" fill="#3b82f6" opacity="0.8" />
                    <text x="75" y="152" textAnchor="middle" dominantBaseline="middle" className="text-[7px] font-bold fill-white pointer-events-none">♿</text>
                    <circle cx="325" cy="150" r="6" fill="#3b82f6" opacity="0.8" />
                    <text x="325" y="152" textAnchor="middle" dominantBaseline="middle" className="text-[7px] font-bold fill-white pointer-events-none">♿</text>
                  </>
                )}
              </svg>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200/50">
                {Object.entries(ZONE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color, opacity: 0.4 }} />
                    <span className="text-xs font-bold text-slate-500 capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Wayfinding Guide Section */}
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-amber-500" aria-hidden="true" />
                <h3 className="text-lg font-black text-slate-800 tracking-tight">AI Wayfinding Guide</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-4">
                Get custom AI-generated step-by-step navigation instructions to your selected zone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="start-zone-select" className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Start Zone
                  </label>
                  <select
                    id="start-zone-select"
                    value={startZoneId}
                    onChange={(e) => setStartZoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-xs font-bold text-slate-700 shadow-sm focus-ring"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Destination Zone
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200/50 text-xs font-bold text-slate-600 truncate">
                    🎯 {selectedZone ? selectedZone.name : 'Select destination map zone'}
                  </div>
                </div>
              </div>

              <button
                onClick={getDirections}
                disabled={!selectedZone || isNavLoading}
                className="btn-primary !py-2.5 !px-5 !text-xs disabled:opacity-40"
              >
                <Navigation size={14} aria-hidden="true" />
                {isNavLoading ? 'Calculating route...' : 'Get AI Navigation'}
              </button>

              {directions && (
                <div className={`mt-5 p-4 rounded-2xl border bg-white/50 backdrop-blur-md transition-all ${showAccessible ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200/50'}`}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Navigation size={12} className="text-slate-500" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      Suggested Steps {showAccessible && '• Wheelchair Accessible'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {directions}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Zone Details Panel */}
          <motion.div
            className="premium-card p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Zone Details</h2>

            {selectedZone ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: ZONE_COLORS[selectedZone.type] + '15', borderColor: ZONE_COLORS[selectedZone.type] + '30' }}>
                    <MapPin size={18} style={{ color: ZONE_COLORS[selectedZone.type] }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{selectedZone.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{selectedZone.type} zone</p>
                  </div>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{formatNumber(selectedZone.capacity)}</p>
                </div>
                <div className="p-4 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <Info size={12} className="inline mr-1" aria-hidden="true" />Amenities
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span aria-hidden="true">🚻</span> Restrooms nearby</li>
                    <li className="flex items-center gap-2"><span aria-hidden="true">🍔</span> Food concessions</li>
                    <li className="flex items-center gap-2"><span aria-hidden="true">🚨</span> Emergency exit</li>
                    {showAccessible && <li className="flex items-center gap-2"><span aria-hidden="true">♿</span> Wheelchair accessible</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
                <Eye size={36} className="mb-3 text-slate-300" aria-hidden="true" />
                <p className="font-bold text-sm">Select a zone</p>
                <p className="text-xs mt-1">Click any zone on the map to see details.</p>
              </div>
            )}

            {/* Zone List */}
            <div className="mt-6 pt-6 border-t border-slate-200/50">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">All Zones</p>
              <div className="space-y-2" role="list" aria-label="Stadium zones">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => selectZone(zone.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm font-medium transition-all focus-ring ${
                      selectedZone?.id === zone.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{zone.name}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </article>
  );
});

Navigator.displayName = 'Navigator';
export default Navigator;
