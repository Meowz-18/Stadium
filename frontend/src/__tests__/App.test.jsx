/**
 * @file Test suite for App component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('renders skip link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders main content area', () => {
    render(<App />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('renders StadiumAI brand text', () => {
    render(<App />);
    const brand = screen.getByLabelText('Stadium AI Home');
    expect(brand).toBeInTheDocument();
  });

  it('renders dashboard nav link in main nav', () => {
    render(<App />);
    const link = document.getElementById('nav-dashboard');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
