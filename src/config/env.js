export const apiBaseUrl = import.meta.env.VITE_GPBC_API_URL || '';
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!apiBaseUrl && import.meta.env.DEV) {
  console.warn("GPBC API URL missing from environment variables (.env.local).");
}
