export const apiBaseUrl = import.meta.env.VITE_GPBC_API_URL;
export const apiKey = import.meta.env.VITE_GPBC_API_KEY || null;

if (!apiBaseUrl) {
    console.warn("GPBC API URL missing from environment variables.");
}
