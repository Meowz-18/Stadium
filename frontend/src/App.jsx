/**
 * @file Root application component for Stadium AI.
 * Provides routing, layout shell (header + nav), accessibility landmarks,
 * lazy-loaded pages, ErrorBoundary wrapping, and ambient background blobs.
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Landmark, LayoutDashboard, Map, MessageSquare, Bus, Leaf, Menu, X } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { NAV_ITEMS } from './constants';

// Lazy-loaded pages for optimal code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Navigator = lazy(() => import('./pages/Navigator'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Transport = lazy(() => import('./pages/Transport'));
const Sustainability = lazy(() => import('./pages/Sustainability'));

const NAV_ICONS = {
  '/': Landmark,
  '/dashboard': LayoutDashboard,
  '/navigate': Map,
  '/assistant': MessageSquare,
  '/transport': Bus,
  '/sustainability': Leaf,
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <BrowserRouter>
      {/* Skip-to-content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Ambient background blobs */}
      <div className="blob-navy" style={{ top: '-200px', right: '-200px' }} aria-hidden="true" />
      <div className="blob-gold" style={{ bottom: '-150px', left: '-150px' }} aria-hidden="true" />

      {/* Glass Header */}
      <header className="sticky top-0 z-50 px-6 md:px-12 lg:px-20 py-4 bg-white/60 backdrop-blur-2xl border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group" aria-label="Stadium AI Home">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Landmark size={18} className="text-amber-400" aria-hidden="true" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Stadium<span className="text-amber-600">AI</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav role="navigation" aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.filter((item) => item.path !== '/').map((item) => {
              const Icon = NAV_ICONS[item.path];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  id={item.id}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all focus-ring ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {Icon && <Icon size={16} aria-hidden="true" />}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors focus-ring"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav role="navigation" aria-label="Mobile navigation" className="md:hidden mt-4 pb-2 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.path];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  id={`mobile-${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 relative z-10">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div role="status" aria-label="Page loading" className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
                  <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">Loading...</p>
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/navigate" element={<Navigator />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/sustainability" element={<Sustainability />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        role="navigation"
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 px-2 py-2 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = NAV_ICONS[item.path];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    isActive ? 'text-slate-900' : 'text-slate-400'
                  }`
                }
              >
                {Icon && <Icon size={20} aria-hidden="true" />}
                <span>{item.label === 'AI Assistant' ? 'AI' : item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </BrowserRouter>
  );
};

export default App;
