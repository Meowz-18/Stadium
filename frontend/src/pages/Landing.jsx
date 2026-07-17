/**
 * @file Landing page for Stadium AI.
 * Hero section, feature showcase, venue stats, and CTA.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Landmark, LayoutDashboard, Map, MessageSquare, Bus, Leaf, ArrowRight, Users, Globe, Languages, Shield } from 'lucide-react';
import { VENUES, FEATURE_COLOR_CLASSES } from '../constants';

const features = [
  { icon: LayoutDashboard, title: 'Crowd Dashboard', desc: 'Real-time crowd density monitoring with AI-powered alerts and recommendations for venue staff.', path: '/dashboard', color: 'navy' },
  { icon: Map, title: 'Venue Navigator', desc: 'Interactive stadium maps with AI wayfinding, accessibility routes, and zone-level details.', path: '/navigate', color: 'green' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Multilingual Gemini-powered chatbot for instant answers about stadium, matches, and services.', path: '/assistant', color: 'gold' },
  { icon: Bus, title: 'Transport Planner', desc: 'Multi-modal route planning with CO₂ comparison, live transit info, and calendar sync.', path: '/transport', color: 'blue' },
  { icon: Leaf, title: 'Sustainability', desc: 'Track venue sustainability metrics, generate AI reduction strategies, and monitor green goals.', path: '/sustainability', color: 'teal' },
];

const stats = [
  { icon: Landmark, value: '16', label: 'Host Venues', suffix: 'across 3 countries' },
  { icon: Users, value: '5M+', label: 'Expected Fans', suffix: 'global attendance' },
  { icon: Languages, value: '10+', label: 'Languages', suffix: 'multilingual AI support' },
  { icon: Globe, value: '48', label: 'Nations', suffix: 'competing teams' },
];

const Landing = React.memo(() => {
  return (
    <article className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-20 pt-20 pb-24 overflow-hidden" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-800 text-xs font-black mb-8 border border-amber-500/20 shadow-sm">
                <Landmark size={14} className="text-amber-600 animate-pulse" aria-hidden="true" />
                <span>POWERED BY GOOGLE GEMINI AI</span>
              </div>

              <h1 id="hero-heading" className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
                Smart Stadium <br />
                <span className="font-display italic font-normal text-gradient pr-2">Operations</span>{' '}
                <span className="text-gradient-gold">2026</span>
              </h1>

              <p className="text-xl text-slate-600 max-w-lg mb-10 leading-relaxed mx-auto lg:mx-0">
                AI-powered platform for FIFA World Cup 2026 — navigate venues, manage crowds, plan transport, and drive sustainability.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/dashboard" className="btn-primary text-lg !px-10 !py-4 shadow-lg">
                  <LayoutDashboard size={20} aria-hidden="true" />
                  Operations Hub
                </Link>
                <Link to="/assistant" className="btn-secondary text-lg !px-10 !py-4">
                  <MessageSquare size={20} aria-hidden="true" />
                  Ask AI Assistant
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 flex justify-center"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative max-w-lg w-full rounded-[2.5rem] p-4 bg-white/20 backdrop-blur-xl border border-white/50 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                {/* Stadium visualization card */}
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-white rounded-md" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full" />
                  </div>
                  <div className="text-center relative z-10">
                    <Landmark size={64} className="text-amber-400 mx-auto mb-4 animate-float" />
                    <h3 className="text-2xl font-black text-white tracking-tight">FIFA World Cup 2026™</h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">USA • Mexico • Canada</p>
                  </div>
                </div>
                <div className="absolute bottom-7 left-7 right-7 p-4 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl text-left shadow-lg">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">GenAI Stadium Ops</p>
                  <h4 className="text-lg font-black text-white leading-snug">AI-Enhanced Fan Experience</h4>
                  <p className="text-xs text-slate-300 mt-1">Navigation • Crowd Mgmt • Multilingual • Sustainability</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="px-6 md:px-12 lg:px-20 py-14 bg-white/20 backdrop-blur-xl border-y border-white/30" aria-label="Platform Statistics">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900/10 flex items-center justify-center mx-auto mb-4 border border-slate-900/10">
                <stat.icon size={22} className="text-slate-700" aria-hidden="true" />
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-sm text-slate-500 font-bold mt-1">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.suffix}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 md:px-12 lg:px-20 py-24" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 id="features-heading" className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Smart Stadium <span className="text-gradient-gold">Operations</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A comprehensive AI-powered toolkit for fans, organizers, volunteers, and venue staff.
            </p>
          </div>

          <div className="bento-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <Link to={feature.path} className="block premium-card p-8 h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div className={`w-14 h-14 rounded-2xl ${FEATURE_COLOR_CLASSES[feature.color]} border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon size={24} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-800 transition-colors">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed mb-6 text-sm">{feature.desc}</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs group-hover:gap-3 transition-all uppercase tracking-wider">
                    <span>Explore</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Venues Showcase */}
      <section className="px-6 md:px-12 lg:px-20 py-20 bg-white/20 backdrop-blur-xl border-y border-white/30" aria-labelledby="venues-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="venues-heading" className="text-3xl font-black text-slate-900 tracking-tight mb-10 text-center">Host Venues</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VENUES.map((venue, i) => (
              <motion.div
                key={venue.id}
                className="premium-card p-6 flex items-center gap-4 group hover:scale-[1.02] transition-transform"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <span className="text-3xl" aria-hidden="true">{venue.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{venue.name}</p>
                  <p className="text-xs text-slate-400">{venue.city} • {venue.capacity.toLocaleString()} seats</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-20 py-24" aria-labelledby="cta-heading">
        <div className="max-w-5xl mx-auto text-center rounded-[3rem] p-12 md:p-16 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
          <Shield size={48} className="mx-auto mb-6 text-amber-400 relative z-10" aria-hidden="true" />
          <h2 id="cta-heading" className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 relative z-10">
            Ready for Matchday?
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
            Experience the FIFA World Cup 2026 like never before with AI-powered stadium intelligence.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="inline-flex items-center gap-3 px-12 py-5 bg-white text-slate-900 rounded-2xl font-extrabold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all">
              <LayoutDashboard size={22} aria-hidden="true" />
              Launch Dashboard
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-20 py-12 bg-slate-950 text-slate-500 text-sm text-center border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-amber-400" />
            <span className="font-bold text-white text-lg tracking-tight">Stadium<span className="text-amber-400">AI</span></span>
          </div>
          <p className="text-xs md:text-sm">Built with ❤️ for FIFA World Cup 2026 • Powered by Google Gemini AI & Firebase</p>
          <p className="text-xs font-bold text-amber-500/80 tracking-widest">#BUILDWITHAI #PROMPTWARSVIRTUAL</p>
        </div>
      </footer>
    </article>
  );
});

Landing.displayName = 'Landing';
export default Landing;
