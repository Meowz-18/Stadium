/**
 * @file Test suite for Navigator page.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigator from '../pages/Navigator';

const renderNavigator = () =>
  render(<BrowserRouter><Navigator /></BrowserRouter>);

describe('Navigator', () => {
  it('renders page heading', () => {
    renderNavigator();
    expect(screen.getByText('Venue Navigator')).toBeInTheDocument();
  });

  it('renders venue selector', () => {
    renderNavigator();
    expect(screen.getByLabelText(/select venue/i)).toBeInTheDocument();
  });

  it('renders accessibility toggle', () => {
    renderNavigator();
    expect(screen.getByText(/Accessibility Mode/i)).toBeInTheDocument();
  });

  it('renders SVG stadium map', () => {
    renderNavigator();
    expect(screen.getByRole('img', { name: /Stadium map/i })).toBeInTheDocument();
  });

  it('renders zone details panel', () => {
    renderNavigator();
    expect(screen.getByText('Zone Details')).toBeInTheDocument();
  });

  it('shows "Select a zone" when no zone selected', () => {
    renderNavigator();
    expect(screen.getByText('Select a zone')).toBeInTheDocument();
  });

  it('renders all zones list', () => {
    renderNavigator();
    expect(screen.getByText('All Zones')).toBeInTheDocument();
  });
});
