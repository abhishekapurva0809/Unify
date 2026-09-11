/**
 * Central Application Configuration
 * Intelligently resolves backend API and WebSocket URLs across development and production.
 */

// Helper to determine whether the app is running in a browser on localhost
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]');

// 1. Resolve Base Backend Server URL (without trailing slash or /api/v1)
const resolveServerUrl = () => {
  const envSocket = import.meta.env.VITE_SOCKET_SERVER_URL;
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const envApi = import.meta.env.VITE_API_URL;

  let raw = envSocket || envBase || (envApi ? envApi.replace(/\/api\/v1\/?$/, '') : '');

  if (raw && typeof raw === 'string') {
    raw = raw.trim().replace(/\/+$/, '');
    if (raw) return raw;
  }

  // Fallback: If deployed in production (e.g. Vercel), default to the live Render backend
  if (!isLocalhost) {
    return 'https://unify-7c77.onrender.com';
  }

  // Fallback for local development
  return 'http://localhost:8090';
};

// 2. Resolve REST API Endpoint (ensuring it ends with /api/v1)
const resolveApiUrl = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && typeof envApi === 'string') {
    const clean = envApi.trim().replace(/\/+$/, '');
    if (clean) {
      return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
    }
  }

  const serverUrl = resolveServerUrl();
  return `${serverUrl}/api/v1`;
};

export const SERVER_URL = resolveServerUrl();
export const API_URL = resolveApiUrl();
export const SOCKET_URL = SERVER_URL;

export default {
  SERVER_URL,
  API_URL,
  SOCKET_URL,
};
