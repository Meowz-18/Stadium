/**
 * @file Crowd management dashboard for Stadium AI.
 * Zone density monitoring, alert levels, charts, AI recommendations,
 * and operational intelligence briefings for real-time decision support.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { LayoutDashboard, AlertTriangle, Users, Activity, Zap, RefreshCw, Shield, BrainCircuit } from 'lucide-react';
import { useCrowd } from '../hooks/useCrowd';
import { CROWD_LEVELS, VENUES, API_BASE_URL, API_ENDPOINTS } from '../constants';
import { formatNumber } from '../utils/helpers';

/**
 * Risk level badge color mappings for operational briefings.
 * @type {Object.<string, string>}
 */
const RISK_COLORS = {
  Low: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  Moderate: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  High: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  Critical: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const Dashboard = React.memo(() => {
  const { zones, analysis, isLoading, venueId, setVenueId, updateZoneDensity, analyzeCrowd, resetZones } = useCrowd();
  const [opsBriefing, setOpsBriefing] = useState(null);
  const [opsLoading, setOpsLoading] = useState(false);

  const pieData = zones.filter((z) => z.density > 0).map((z) => ({
    name: z.name,
    value: z.density,
    color: z.density > 90 ? '#ef4444' : z.density > 75 ? '#f97316' : z.density > 50 ? '#f59e0b' : '#10b981',
  }));

  const barData = zones.map((z) => ({ name: z.name.replace(' ', '\n'), density: z.density }));

  /**
   * Fetch an AI-powered operational intelligence briefing.
   * Calls the /api/operations endpoint with current zone data and
   * falls back to a local briefing if the server is unavailable.
   */
  const fetchOpsBriefing = useCallback(async () => {
    setOpsLoading(true);
    const avgDensity = zones.length > 0
      ? Math.round(zones.reduce((sum, z) => sum + z.density, 0) / zones.length)
      : 0;
    const criticalCount = zones.filter((z) => z.density > 90).length;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OPERATIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venueId,
          event_phase: 'match_live',
          crowd_density_avg: avgDensity,
          critical_zone_count: criticalCount,
          weather: 'clear',
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setOpsBriefing(await res.json());
    } catch {
      // Local fallback briefing
      const risk = criticalCount > 2 ? 'Critical' : criticalCount > 0 || avgDensity > 75 ? 'High' : avgDensity > 50 ? 'Moderate' : 'Low';
      const venue = VENUES.find((v) => v.id === venueId) || VENUES[0];
      setOpsBriefing({
        venue_id: venueId,
        event_phase: 'match_live',
        briefing: `${venue.name} is currently in Match Live phase. Average crowd density stands at ${avgDensity}% with ${criticalCount} zone(s) in critical status. Overall operational risk level: ${risk}.`,
        decision_recommendations: [
          criticalCount > 0
            ? `Deploy additional stewards to the ${criticalCount} critical zone(s) and activate overflow routing protocols.`
            : 'Maintain standard steward deployment across all zones; no immediate escalation needed.',
          'Ensure all emergency exits remain clear and accessible. Verify communication channels with medical and security teams.',
          'Monitor gate throughput rates and pre-position crowd management resources for the next anticipated surge period.',
        ],
        risk_level: risk,
      });
    } finally {
      setOpsLoading(false);
    }
  }, [zones, venueId]);

  return (
    <article className="px-6 md:px-12 lg:px-20 pt-12 pb-24 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900/10 flex items-center justify-center border border-slate-900/10 shadow-sm">
              <LayoutDashboard size={20} className="text-slate-700" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crowd Dashboard</h1>
          </div>
          <p className="text-slate-500 font-medium">Real-time crowd density monitoring with AI-powered operational recommendations and decision support.</p>
        </motion.div>

        {/* Venue Selector + Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <label htmlFor="venue-select" className="sr-only">Select venue</label>
          <select
            id="venue-select"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring"
          >
            {VENUES.map((v) => (
              <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
            ))}
          </select>
          <button onClick={analyzeCrowd} disabled={isLoading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
            <Activity size={16} aria-hidden="true" />
            {isLoading ? 'Analyzing...' : 'Analyze Crowd'}
          </button>
          <button onClick={fetchOpsBriefing} disabled={opsLoading} className="btn-secondary !py-2.5 !px-6 disabled:opacity-50">
            <BrainCircuit size={16} aria-hidden="true" />
            {opsLoading ? 'Generating...' : 'AI Ops Briefing'}
          </button>
          <button onClick={resetZones} className="btn-secondary !py-2.5 !px-6">
            <RefreshCw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        {/* Zone Density Sliders */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12" aria-label="Zone density controls">
          {zones.map((zone, i) => {
            const level = zone.density > 90 ? 'critical' : zone.density > 75 ? 'high' : zone.density > 50 ? 'moderate' : 'low';
            const levelInfo = CROWD_LEVELS[level];
            return (
              <motion.div
                key={zone.id}
                className="premium-card p-5 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: levelInfo.color }} />
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">{zone.name}</p>
                  <span className={`category-badge ${levelInfo.bgClass} border`}>{levelInfo.label}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">{zone.density}%</p>
                <p className="text-xs text-slate-400 mb-3">{formatNumber(zone.count)} / {formatNumber(zone.capacity)}</p>
                <label htmlFor={`slider-${zone.id}`} className="sr-only">{zone.name} density</label>
                <input
                  id={`slider-${zone.id}`}
                  type="range"
                  min="0"
                  max="100"
                  value={zone.density}
                  onChange={(e) => updateZoneDensity(zone.id, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${levelInfo.color} ${zone.density}%, #e2e8f0 ${zone.density}%)`,
                  }}
                  aria-valuenow={zone.density}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </motion.div>
            );
          })}
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div className="premium-card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Zone Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}% density`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Users size={40} className="mb-3 text-slate-300" aria-hidden="true" />
                <p className="font-bold">No density data</p>
                <p className="text-sm text-center max-w-xs mt-1">Adjust the zone sliders above to simulate crowd density.</p>
              </div>
            )}
          </motion.div>

          <motion.div className="premium-card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Zone Comparison</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 500 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="density" radius={[0, 8, 8, 0]} barSize={22}>
                  {barData.map((entry, i) => (
                    <Cell key={`bar-${i}`} fill={entry.density > 90 ? '#ef4444' : entry.density > 75 ? '#f97316' : entry.density > 50 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* AI Analysis Results */}
        {analysis && (
          <motion.section
            className="premium-card p-8 md:p-10 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            aria-labelledby="analysis-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm">
                <Zap size={20} className="text-amber-700" aria-hidden="true" />
              </div>
              <h2 id="analysis-heading" className="text-xl font-black text-slate-800 tracking-tight">AI Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Occupancy</p>
                <p className="text-2xl font-black text-slate-900">{formatNumber(analysis.total_occupancy)}</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Venue Capacity</p>
                <p className="text-2xl font-black text-slate-900">{formatNumber(analysis.capacity)}</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Overall Alert</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase ${CROWD_LEVELS[analysis.overall_alert]?.bgClass || ''}`}>
                  {analysis.overall_alert === 'critical' || analysis.overall_alert === 'high' ? <AlertTriangle size={12} aria-hidden="true" /> : null}
                  {analysis.overall_alert}
                </span>
              </div>
            </div>
            <div className="p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">AI Recommendation</p>
              <p className="text-slate-700 font-medium leading-relaxed text-sm">{analysis.ai_recommendation}</p>
            </div>
          </motion.section>
        )}

        {/* AI Operational Intelligence Briefing */}
        {opsBriefing && (
          <motion.section
            className="premium-card p-8 md:p-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            aria-labelledby="ops-briefing-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-sm">
                <Shield size={20} className="text-violet-700" aria-hidden="true" />
              </div>
              <div>
                <h2 id="ops-briefing-heading" className="text-xl font-black text-slate-800 tracking-tight">AI Operational Briefing</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Real-Time Decision Support • Operational Intelligence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="stat-card text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Level</p>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black border uppercase ${RISK_COLORS[opsBriefing.risk_level] || ''}`}>
                  {opsBriefing.risk_level === 'Critical' || opsBriefing.risk_level === 'High'
                    ? <AlertTriangle size={14} aria-hidden="true" />
                    : <Shield size={14} aria-hidden="true" />}
                  {opsBriefing.risk_level}
                </span>
              </div>
              <div className="stat-card text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Event Phase</p>
                <p className="text-lg font-black text-slate-900 capitalize">{opsBriefing.event_phase.replace('_', ' ')}</p>
              </div>
              <div className="stat-card text-center md:col-span-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Venue</p>
                <p className="text-lg font-black text-slate-900">{VENUES.find((v) => v.id === opsBriefing.venue_id)?.name || opsBriefing.venue_id}</p>
              </div>
            </div>

            <div className="p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm mb-5">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Situational Briefing</p>
              <p className="text-slate-700 font-medium leading-relaxed text-sm whitespace-pre-wrap">{opsBriefing.briefing}</p>
            </div>

            <div className="p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Decision Recommendations</p>
              <ul className="space-y-2.5" aria-label="Operational decision recommendations">
                {opsBriefing.decision_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/10 text-violet-700 flex items-center justify-center text-xs font-black border border-violet-500/20">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        )}
      </div>
    </article>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
