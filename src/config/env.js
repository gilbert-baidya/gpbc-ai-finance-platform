export const environment = import.meta.env.VITE_GPBC_ENV || import.meta.env.VITE_GPBC_ENVIRONMENT || 'sandbox';
export const isProduction = environment === 'production';

// In production, browser requests must use same-origin /api/gpbc proxy.
// In sandbox / local dev, uses configured VITE_GPBC_API_URL (sandbox Apps Script).
export const apiBaseUrl = isProduction
  ? (import.meta.env.VITE_GPBC_API_URL || '/api/gpbc')
  : (import.meta.env.VITE_GPBC_API_URL || '');

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!apiBaseUrl && import.meta.env.DEV) {
  console.warn("GPBC API URL missing from environment variables (.env.local).");
}
