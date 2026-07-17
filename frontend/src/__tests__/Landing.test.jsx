/**
 * @file Test suite for Landing page.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing';

const renderLanding = () =>
  render(<BrowserRouter><Landing /></BrowserRouter>);

describe('Landing', () => {
  it('renders the hero heading', () => {
    renderLanding();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Smart Stadium');
  });

  it('renders the Gemini AI badge', () => {
    renderLanding();
    const badges = screen.getAllByText(/POWERED BY GOOGLE GEMINI AI/i);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders CTA buttons', () => {
    renderLanding();
    expect(screen.getByText(/Operations Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask AI Assistant/i)).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderLanding();
    expect(screen.getByText('Crowd Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Venue Navigator')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Transport Planner')).toBeInTheDocument();
  });

  it('renders venue list', () => {
    renderLanding();
    expect(screen.getByText(/MetLife Stadium/i)).toBeInTheDocument();
    expect(screen.getByText(/SoFi Stadium/i)).toBeInTheDocument();
  });

  it('renders stats section', () => {
    renderLanding();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
  });

  it('renders FIFA World Cup 2026 branding', () => {
    renderLanding();
    const matches = screen.getAllByText(/FIFA World Cup 2026/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the footer', () => {
    renderLanding();
    expect(screen.getByText(/#BUILDWITHAI/i)).toBeInTheDocument();
  });

  it('has proper heading hierarchy with single h1', () => {
    renderLanding();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
  });
});
