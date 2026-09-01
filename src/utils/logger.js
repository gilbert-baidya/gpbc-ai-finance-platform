/**
 * Safe Logger Utility
 * 
 * Production-safe logging that prevents PII exposure in browser console.
 * 
 * RULES:
 * - log() and warn() only work in development mode
 * - error() always logs (for production error tracking)
 * - NEVER log full objects containing member data, emails, contributions
 * 
 * USAGE:
 * import { log, warn, error } from '@/utils/logger';
 * 
 * // Safe logging
 * log("Members loaded:", response?.members?.length);
 * log("API success:", response?.success);
 * 
 * // NEVER do this:
 * log("Members:", members); // ❌ Exposes PII
 */

const isDev = import.meta.env.DEV === true;

export const log = (...args) => {
  if (isDev) console.log(...args);
};

export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

export const error = (...args) => {
  console.error(...args);
};

// Export for backward compatibility
export default { log, warn, error };
