/**
 * @file Custom hook for the AI chatbot state management.
 * Manages messages, loading state, language selection, and API communication.
 */

import { useState, useCallback, useRef } from 'react';
import { sanitizeInput, getTimestamp } from '../utils/helpers';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

/**
 * @typedef {Object} Message
 * @property {'user'|'bot'} role - Who sent the message.
 * @property {string} text - The message content.
 * @property {string} time - Formatted timestamp.
 */

/**
 * Hook for managing the AI assistant chat state.
 * @returns {Object} Chat state and actions.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [venueId, setVenueId] = useState('lusail');
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (query) => {
    const sanitized = sanitizeInput(query.trim());
    if (!sanitized) return;

    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text: sanitized, time: getTimestamp() }]);
    setIsLoading(true);

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSISTANT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sanitized, language, venue_id: venueId }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.response, time: getTimestamp() },
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const fallback = 'I\'m currently unable to connect to the AI service. Please try again in a moment, or check the FAQ section for common stadium questions.';
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: fallback, time: getTimestamp() },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [language, venueId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    language,
    venueId,
    setLanguage,
    setVenueId,
    sendMessage,
    clearMessages,
  };
};
