/**
 * @file Firebase configuration for Stadium AI.
 * @security Firebase client-side config keys are safe to expose publicly.
 * They are NOT secret credentials — they identify the Firebase project
 * for client SDK initialization. Access control is enforced server-side
 * via Firebase Security Rules, not by hiding these keys.
 * @see https://firebase.google.com/docs/web/learn-more#config-object
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForStadiumAI2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'stadium-ai-2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stadium-ai-2026',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'stadium-ai-2026.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0000000000',
};

const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Analytics only if the browser supports it.
 * Some browsers (e.g. Brave) block analytics by default.
 */
export const initAnalytics = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      getAnalytics(app);
    }
  } catch {
    // Analytics not supported in this environment
  }
};

export default app;
