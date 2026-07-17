import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initAnalytics } from './firebase.js';
import { reportWebVitals } from './utils/performance.js';

initAnalytics();

reportWebVitals(({ name, value }) => {
  if (import.meta.env.DEV) {
    console.debug(`[WebVitals] ${name}: ${value}`);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
