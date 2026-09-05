export const apiBaseUrl = import.meta.env.VITE_GPBC_API_URL || '';
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const environment = import.meta.env.VITE_GPBC_ENV || import.meta.env.VITE_GPBC_ENVIRONMENT || 'sandbox';
export const isProduction = environment === 'production';

if (!apiBaseUrl && import.meta.env.DEV) {
  console.warn("GPBC API URL missing from environment variables (.env.local).");
}
