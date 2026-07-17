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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDiDQmXHgvacPLzXkDn2UU3PmOijGCO980',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ecotrack-7f805.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ecotrack-7f805',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ecotrack-7f805.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID || '866853150264',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:866853150264:web:5d08d19925a6b65606d0cd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-CX6E6P3L2W',
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
