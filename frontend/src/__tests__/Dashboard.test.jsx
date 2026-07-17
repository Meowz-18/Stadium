/**
 * @file Test suite for Dashboard page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

const renderDashboard = () =>
  render(<BrowserRouter><Dashboard /></BrowserRouter>);

describe('Dashboard', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('renders page heading', () => {
    renderDashboard();
    expect(screen.getByText('Crowd Dashboard')).toBeInTheDocument();
  });

  it('renders venue selector', () => {
    renderDashboard();
    expect(screen.getByLabelText(/select venue/i)).toBeInTheDocument();
  });

  it('renders Analyze button', () => {
    renderDashboard();
    expect(screen.getByText('Analyze Crowd')).toBeInTheDocument();
  });

  it('renders Reset button', () => {
    renderDashboard();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('renders zone sliders', () => {
    renderDashboard();
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(4);
  });

  it('updates density on slider change', () => {
    renderDashboard();
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '80' } });
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('renders chart headings', () => {
    renderDashboard();
    expect(screen.getByText('Zone Distribution')).toBeInTheDocument();
    expect(screen.getByText('Zone Comparison')).toBeInTheDocument();
  });
});
