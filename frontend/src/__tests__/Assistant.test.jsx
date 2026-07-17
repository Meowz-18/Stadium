/**
 * @file Test suite for Assistant page.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Assistant from '../pages/Assistant';

// Mock scrollIntoView which is not available in JSDOM
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderAssistant = () =>
  render(<BrowserRouter><Assistant /></BrowserRouter>);

describe('Assistant', () => {
  it('renders page heading', () => {
    renderAssistant();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('renders language selector', () => {
    renderAssistant();
    expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();
  });

  it('renders venue context selector', () => {
    renderAssistant();
    expect(screen.getByLabelText(/select venue context/i)).toBeInTheDocument();
  });

  it('renders chat input', () => {
    renderAssistant();
    expect(screen.getByLabelText(/type your message/i)).toBeInTheDocument();
  });

  it('renders send button', () => {
    renderAssistant();
    expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
  });

  it('renders quick questions', () => {
    renderAssistant();
    expect(screen.getByText('Where are the nearest restrooms?')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderAssistant();
    expect(screen.getByText('Ask me anything!')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    renderAssistant();
    const sendBtn = screen.getByLabelText(/send message/i);
    expect(sendBtn).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    renderAssistant();
    const input = screen.getByLabelText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    const sendBtn = screen.getByLabelText(/send message/i);
    expect(sendBtn).not.toBeDisabled();
  });

  it('quick question fills input', () => {
    renderAssistant();
    const quickBtn = screen.getByText('Where are the nearest restrooms?');
    fireEvent.click(quickBtn);
    const input = screen.getByLabelText(/type your message/i);
    expect(input.value).toBe('Where are the nearest restrooms?');
  });
});
