/**
 * @file Sustainability metrics dashboard for Stadium AI.
 * Tracks waste, energy, water, and recycling with AI recommendations.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Leaf, Trash2, Zap, Droplets, Recycle, TrendingUp, Award } from 'lucide-react';
import { VENUES, SUSTAINABILITY_COLORS, API_BASE_URL, API_ENDPOINTS } from '../constants';


const Sustainability = React.memo(() => {
  const [venueId, setVenueId] = useState('lusail');
  const [waste, setWaste] = useState(500);
  const [energy, setEnergy] = useState(2000);
  const [water, setWater] = useState(8000);
  const [recycling, setRecycling] = useState(60);
  const [attendance, setAttendance] = useState(50000);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const assess = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUSTAINABILITY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venueId,
          waste_kg: waste,
          energy_kwh: energy,
          water_liters: water,
          recycling_rate: recycling,
          attendance,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setResult(await res.json());
    } catch {
      // Local fallback scoring
      const per1000 = Math.max(attendance, 1) / 1000;
      const ws = Math.max(0, Math.min(100, 100 * (1 - (waste / per1000) / 150)));
      const es = Math.max(0, Math.min(100, 100 * (1 - (energy / per1000) / 500)));
      const wts = Math.max(0, Math.min(100, 100 * (1 - (water / per1000) / 2000)));
      const rs = Math.min(100, (recycling / 75) * 100);
      const overall = +(ws * 0.3 + es * 0.25 + wts * 0.2 + rs * 0.25).toFixed(1);
      setResult({
        venue_id: venueId,
        overall_score: overall,
        grade: overall >= 90 ? 'A+' : overall >= 80 ? 'A' : overall >= 70 ? 'B' : overall >= 60 ? 'C' : 'D',
        breakdown: { waste_score: +ws.toFixed(1), energy_score: +es.toFixed(1), water_score: +wts.toFixed(1), recycling_score: +rs.toFixed(1) },
        per_capita: {
          waste_kg_per_1000: +(waste / per1000).toFixed(2),
          energy_kwh_per_1000: +(energy / per1000).toFixed(2),
          water_liters_per_1000: +(water / per1000).toFixed(2),
        },
        ai_recommendations: 'Focus on waste reduction by switching to compostable containers, increasing recycling station density, and implementing digital-only ticketing.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [venueId, waste, energy, water, recycling, attendance]);

  const gradeColors = {
    'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'A': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'B': 'text-blue-600 bg-blue-50 border-blue-200',
    'C': 'text-amber-600 bg-amber-50 border-amber-200',
    'D': 'text-red-600 bg-red-50 border-red-200',
  };

  const scoreData = result ? [
    { name: 'Waste', value: result.breakdown.waste_score, color: SUSTAINABILITY_COLORS.waste },
    { name: 'Energy', value: result.breakdown.energy_score, color: SUSTAINABILITY_COLORS.energy },
    { name: 'Water', value: result.breakdown.water_score, color: SUSTAINABILITY_COLORS.water },
    { name: 'Recycling', value: result.breakdown.recycling_score, color: SUSTAINABILITY_COLORS.recycling },
  ] : [];

  const categories = [
    { key: 'waste', label: 'Waste (kg)', value: waste, setValue: setWaste, max: 10000, icon: Trash2, color: SUSTAINABILITY_COLORS.waste },
    { key: 'energy', label: 'Energy (kWh)', value: energy, setValue: setEnergy, max: 50000, icon: Zap, color: SUSTAINABILITY_COLORS.energy },
    { key: 'water', label: 'Water (liters)', value: water, setValue: setWater, max: 100000, icon: Droplets, color: SUSTAINABILITY_COLORS.water },
    { key: 'recycling', label: 'Recycling Rate (%)', value: recycling, setValue: setRecycling, max: 100, icon: Recycle, color: SUSTAINABILITY_COLORS.recycling },
  ];

  return (
    <article className="px-6 md:px-12 lg:px-20 pt-12 pb-24 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Leaf size={20} className="text-emerald-700" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sustainability</h1>
          </div>
          <p className="text-slate-500 font-medium">Track venue sustainability metrics and get AI-powered reduction strategies.</p>
        </motion.div>

        {/* Input Form */}
        <motion.div className="premium-card p-8 mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="sus-venue" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Venue</label>
              <select id="sus-venue" value={venueId} onChange={(e) => setVenueId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring">
                {VENUES.map((v) => <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="attendance" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Attendance</label>
              <input id="attendance" type="number" min={0} max={200000} value={attendance} onChange={(e) => setAttendance(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" aria-label="Sustainability inputs">
            {categories.map((cat) => (
              <div key={cat.key}>
                <label htmlFor={`input-${cat.key}`} className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                  <cat.icon size={12} style={{ color: cat.color }} aria-hidden="true" />
                  {cat.label}
                </label>
                <input id={`input-${cat.key}`} type="number" min={0} max={cat.max} value={cat.value}
                  onChange={(e) => cat.setValue(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring" />
              </div>
            ))}
          </div>

          <button onClick={assess} disabled={isLoading} className="btn-primary disabled:opacity-50">
            <TrendingUp size={16} aria-hidden="true" />
            {isLoading ? 'Assessing...' : 'Assess Sustainability'}
          </button>
        </motion.div>

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Card */}
            <motion.div className="premium-card p-8 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Award size={32} className="mx-auto mb-4 text-amber-500" aria-hidden="true" />
              <p className="text-5xl font-black text-slate-900 tracking-tight mb-2">{result.overall_score}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Overall Score</p>
              <span className={`inline-flex items-center px-5 py-2 rounded-full text-lg font-black border ${gradeColors[result.grade] || ''}`}>
                {result.grade}
              </span>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={scoreData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {scoreData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div className="premium-card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Breakdown</h2>
              <div className="space-y-5">
                {scoreData.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                      <span className="text-sm font-black text-slate-900">{cat.value}/100</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={cat.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.name} score`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {result.per_capita && (
                <div className="mt-6 pt-6 border-t border-slate-200/50">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Per 1,000 Attendees</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="stat-card !p-3">
                      <p className="text-lg font-black text-slate-900">{result.per_capita.waste_kg_per_1000}</p>
                      <p className="text-[10px] text-slate-400 font-bold">kg waste</p>
                    </div>
                    <div className="stat-card !p-3">
                      <p className="text-lg font-black text-slate-900">{result.per_capita.energy_kwh_per_1000}</p>
                      <p className="text-[10px] text-slate-400 font-bold">kWh energy</p>
                    </div>
                    <div className="stat-card !p-3">
                      <p className="text-lg font-black text-slate-900">{result.per_capita.water_liters_per_1000}</p>
                      <p className="text-[10px] text-slate-400 font-bold">L water</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* AI Recommendations */}
            <motion.div className="premium-card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={18} className="text-emerald-600" aria-hidden="true" />
                <h2 className="text-xl font-black text-slate-800">AI Strategies</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{result.ai_recommendations}</p>
            </motion.div>
          </div>
        )}
      </div>
    </article>
  );
});

Sustainability.displayName = 'Sustainability';
export default Sustainability;
