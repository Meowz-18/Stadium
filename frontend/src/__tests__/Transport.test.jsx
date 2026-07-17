/**
 * @file Test suite for Transport page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Transport from '../pages/Transport';

const renderTransport = () =>
  render(<BrowserRouter><Transport /></BrowserRouter>);

describe('Transport', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('renders page heading', () => {
    renderTransport();
    expect(screen.getByText('Transport Planner')).toBeInTheDocument();
  });

  it('renders origin input', () => {
    renderTransport();
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
  });

  it('renders venue selector', () => {
    renderTransport();
    expect(screen.getByLabelText(/to \(venue\)/i)).toBeInTheDocument();
  });

  it('renders Plan Route button', () => {
    renderTransport();
    expect(screen.getByText('Plan Route')).toBeInTheDocument();
  });

  it('no routes visible initially', () => {
    renderTransport();
    expect(screen.queryByText('AI Recommendation')).not.toBeInTheDocument();
  });

  it('allows typing an origin', () => {
    renderTransport();
    const input = screen.getByLabelText(/from/i);
    fireEvent.change(input, { target: { value: 'Times Square' } });
    expect(input.value).toBe('Times Square');
  });
});
