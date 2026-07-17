/**
 * @file Test suite for useChat hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../hooks/useChat';

describe('useChat', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('defaults language to en', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.language).toBe('en');
  });

  it('updates language', () => {
    const { result } = renderHook(() => useChat());
    act(() => { result.current.setLanguage('es'); });
    expect(result.current.language).toBe('es');
  });

  it('updates venueId', () => {
    const { result } = renderHook(() => useChat());
    act(() => { result.current.setVenueId('metlife'); });
    expect(result.current.venueId).toBe('metlife');
  });

  it('adds user message immediately on send', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Test response', detected_language: 'en' }),
    });
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('Hello'); });
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].text).toBe('Hello');
  });

  it('adds bot response after API call', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hi from AI', detected_language: 'en' }),
    });
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('Hello'); });
    expect(result.current.messages[1].role).toBe('bot');
    expect(result.current.messages[1].text).toBe('Hi from AI');
  });

  it('adds fallback on API error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('Hello'); });
    expect(result.current.messages[1].role).toBe('bot');
    expect(result.current.messages[1].text).toContain('unable to connect');
  });

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('   '); });
    expect(result.current.messages).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears messages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Test', detected_language: 'en' }),
    });
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('Hello'); });
    act(() => { result.current.clearMessages(); });
    expect(result.current.messages).toEqual([]);
  });
});
