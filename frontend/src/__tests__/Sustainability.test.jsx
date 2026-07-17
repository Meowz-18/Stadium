/**
 * @file Test suite for Sustainability page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sustainability from '../pages/Sustainability';

const renderSustainability = () =>
  render(<BrowserRouter><Sustainability /></BrowserRouter>);

describe('Sustainability', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('renders page heading', () => {
    renderSustainability();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sustainability');
  });

  it('renders venue selector', () => {
    renderSustainability();
    expect(screen.getByLabelText(/venue/i)).toBeInTheDocument();
  });

  it('renders attendance input', () => {
    renderSustainability();
    expect(screen.getByLabelText(/attendance/i)).toBeInTheDocument();
  });

  it('renders sustainability category inputs', () => {
    renderSustainability();
    expect(screen.getByLabelText(/Waste/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Energy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Water/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recycling/i)).toBeInTheDocument();
  });

  it('renders Assess button', () => {
    renderSustainability();
    expect(screen.getByText('Assess Sustainability')).toBeInTheDocument();
  });

  it('no results visible initially', () => {
    renderSustainability();
    expect(screen.queryByText('AI Strategies')).not.toBeInTheDocument();
  });

  it('allows typing attendance', () => {
    renderSustainability();
    const input = screen.getByLabelText(/attendance/i);
    fireEvent.change(input, { target: { value: '75000' } });
    expect(input.value).toBe('75000');
  });
});
