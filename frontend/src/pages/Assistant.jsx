/**
 * @file Multilingual AI chatbot page for Stadium AI.
 * Chat interface with language selector, quick questions, and venue context.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Trash2, Globe, Landmark } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { QUICK_QUESTIONS, SUPPORTED_LANGUAGES, VENUES } from '../constants';

const Assistant = React.memo(() => {
  const { messages, isLoading, language, venueId, setLanguage, setVenueId, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <article className="px-6 md:px-12 lg:px-20 pt-12 pb-24 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm">
              <MessageSquare size={20} className="text-amber-700" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Assistant</h1>
          </div>
          <p className="text-slate-500 font-medium">Multilingual Gemini-powered assistant for all your stadium questions.</p>
        </motion.div>

        {/* Config Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-slate-400" aria-hidden="true" />
            <label htmlFor="lang-select" className="sr-only">Select language</label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-slate-400" aria-hidden="true" />
            <label htmlFor="venue-context" className="sr-only">Select venue context</label>
            <select
              id="venue-context"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm font-bold text-slate-700 shadow-sm focus-ring"
            >
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
              ))}
            </select>
          </div>
          {messages.length > 0 && (
            <button onClick={clearMessages} className="btn-secondary !py-2 !px-4 text-xs" aria-label="Clear chat history">
              <Trash2 size={14} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {/* Chat Area */}
        <motion.div
          className="premium-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Messages */}
          <div
            className="chat-container min-h-[400px] max-h-[500px]"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                <MessageSquare size={40} className="mb-3 text-slate-300" aria-hidden="true" />
                <p className="font-bold text-sm">Ask me anything!</p>
                <p className="text-xs mt-1 max-w-xs">I can help with navigation, match schedules, food, transport, accessibility, and more.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble-bot" aria-label="Assistant is typing">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 py-3 border-t border-slate-200/30 bg-white/20">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick questions">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/50 text-xs font-bold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all focus-ring"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200/30 bg-white/30">
            <div className="flex items-end gap-3">
              <label htmlFor="chat-input" className="sr-only">Type your message</label>
              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about navigation, matches, food, transport..."
                rows={1}
                className="flex-1 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-sm text-slate-700 placeholder-slate-400 resize-none shadow-sm focus-ring"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="btn-primary !py-3 !px-5 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </article>
  );
});

Assistant.displayName = 'Assistant';
export default Assistant;
