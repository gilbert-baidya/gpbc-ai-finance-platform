/**
 * GPBC Finance Desk — Safe Local Mobile UI Test Guard
 * 
 * Strict Activation Policy:
 * 1. import.meta.env.MODE === 'mobiletest'
 * 2. import.meta.env.VITE_MOBILE_UI_TEST_MODE === 'true'
 * 3. Browser hostname must be an RFC1918 private address or localhost:
 *    - localhost / 127.0.0.1
 *    - 10.0.0.0/8
 *    - 192.168.0.0/16
 *    - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * 
 * Under NO circumstances may this activate on finance.gracepraise.church
 * or any non-private domain.
 */

import { AuthUser } from '../types/auth';

export const MOBILE_TEST_USER: AuthUser = Object.freeze({
  email: 'mobile-ui-test@local.invalid',
  name: 'Mobile UI Tester',
  role: 'Primary Admin' as const
});

/**
 * Validates whether a hostname belongs to private RFC1918 ranges or local loopback.
 */
export function isPrivateHostname(hostname: string): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  
  const trimmed = hostname.trim().toLowerCase();
  
  if (trimmed === 'localhost' || trimmed === '127.0.0.1' || trimmed === '::1') {
    return true;
  }
  
  // 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
  if (/^10\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){2}$/.test(trimmed)) {
    return true;
  }
  
  // 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
  if (/^192\.168\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(trimmed)) {
    return true;
  }
  
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2\d|3[01])\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(trimmed)) {
    return true;
  }
  
  return false;
}

/**
 * Checks all 3 mandatory conditions before permitting local mobile UI test mode.
 */
export function isMobileTestAllowed(
  mode?: string,
  envFlag?: string,
  hostname?: string
): boolean {
  const activeMode = mode !== undefined ? mode : import.meta.env.MODE;
  const activeFlag = envFlag !== undefined ? envFlag : import.meta.env.VITE_MOBILE_UI_TEST_MODE;
  const activeHost = hostname !== undefined 
    ? hostname 
    : (typeof window !== 'undefined' ? window.location.hostname : '');

  // 1. Vite mode must be exactly 'mobiletest'
  if (activeMode !== 'mobiletest') {
    return false;
  }

  // 2. VITE_MOBILE_UI_TEST_MODE flag must be exactly 'true'
  if (activeFlag !== 'true') {
    return false;
  }

  // 3. Hostname must be a private RFC1918 address or localhost
  if (!isPrivateHostname(activeHost)) {
    return false;
  }

  return true;
}

/**
 * Returns a cloned mock user for local mobile UI preview.
 */
export function getMobileTestUser(): AuthUser {
  return { ...MOBILE_TEST_USER };
}
