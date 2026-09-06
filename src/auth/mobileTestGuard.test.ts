import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPrivateHostname,
  isMobileTestAllowed,
  MOBILE_TEST_USER,
  getMobileTestUser
} from './mobileTestGuard';
import { isWriteAction, gasFetch } from '../api/gasFetch';

describe('Safe Local Mobile Test Guard', () => {
  describe('isPrivateHostname', () => {
    it('allows loopback addresses (localhost, 127.0.0.1, ::1)', () => {
      expect(isPrivateHostname('localhost')).toBe(true);
      expect(isPrivateHostname('127.0.0.1')).toBe(true);
      expect(isPrivateHostname('::1')).toBe(true);
    });

    it('allows RFC1918 Class C private LAN (192.168.x.x)', () => {
      expect(isPrivateHostname('192.168.4.28')).toBe(true);
      expect(isPrivateHostname('192.168.1.1')).toBe(true);
      expect(isPrivateHostname('192.168.0.254')).toBe(true);
    });

    it('allows RFC1918 Class A private LAN (10.x.x.x)', () => {
      expect(isPrivateHostname('10.0.0.1')).toBe(true);
      expect(isPrivateHostname('10.200.1.50')).toBe(true);
    });

    it('allows RFC1918 Class B private LAN (172.16.x.x - 172.31.x.x)', () => {
      expect(isPrivateHostname('172.16.0.1')).toBe(true);
      expect(isPrivateHostname('172.20.10.5')).toBe(true);
      expect(isPrivateHostname('172.31.255.254')).toBe(true);
    });

    it('strictly refuses public IP addresses and domains', () => {
      expect(isPrivateHostname('172.32.0.1')).toBe(false);
      expect(isPrivateHostname('8.8.8.8')).toBe(false);
      expect(isPrivateHostname('finance.gracepraise.church')).toBe(false);
      expect(isPrivateHostname('gracepraise.church')).toBe(false);
      expect(isPrivateHostname('app.netlify.app')).toBe(false);
      expect(isPrivateHostname('')).toBe(false);
    });
  });

  describe('isMobileTestAllowed', () => {
    it('permits activation on private IP when mode=mobiletest and flag=true', () => {
      expect(isMobileTestAllowed('mobiletest', 'true', '192.168.4.28')).toBe(true);
      expect(isMobileTestAllowed('mobiletest', 'true', 'localhost')).toBe(true);
      expect(isMobileTestAllowed('mobiletest', 'true', '10.0.0.5')).toBe(true);
    });

    it('strictly denies activation in production mode even on private IP', () => {
      expect(isMobileTestAllowed('production', 'true', '192.168.4.28')).toBe(false);
      expect(isMobileTestAllowed('production', 'true', 'localhost')).toBe(false);
    });

    it('strictly denies activation on production domain even if mode=mobiletest', () => {
      expect(isMobileTestAllowed('mobiletest', 'true', 'finance.gracepraise.church')).toBe(false);
      expect(isMobileTestAllowed('mobiletest', 'true', 'gracepraise.church')).toBe(false);
    });

    it('strictly denies activation if flag is false or not set', () => {
      expect(isMobileTestAllowed('mobiletest', 'false', '192.168.4.28')).toBe(false);
      expect(isMobileTestAllowed('mobiletest', undefined, '192.168.4.28')).toBe(false);
    });
  });

  describe('Mock User Constants', () => {
    it('provides a synthetic Primary Admin mock user with local.invalid domain', () => {
      expect(MOBILE_TEST_USER.role).toBe('Primary Admin');
      expect(MOBILE_TEST_USER.email).toBe('mobile-ui-test@local.invalid');
      expect(MOBILE_TEST_USER.name).toBe('Mobile UI Tester');
      
      const clone = getMobileTestUser();
      expect(clone).toEqual(MOBILE_TEST_USER);
    });
  });

  describe('Write Action Detection', () => {
    it('identifies mutation and write actions correctly', () => {
      expect(isWriteAction('addTransaction')).toBe(true);
      expect(isWriteAction('addExpense')).toBe(true);
      expect(isWriteAction('addIncome')).toBe(true);
      expect(isWriteAction('uploadDocument')).toBe(true);
      expect(isWriteAction('reconcileTransactionRecord')).toBe(true);
      expect(isWriteAction('autoReconcilePeriod')).toBe(true);
      expect(isWriteAction('closeMonthlyPeriod')).toBe(true);
    });

    it('identifies read queries correctly', () => {
      expect(isWriteAction('getDashboardSummary')).toBe(false);
      expect(isWriteAction('getTransactions')).toBe(false);
      expect(isWriteAction('getReimbursements')).toBe(false);
      expect(isWriteAction('getDocumentRegister')).toBe(false);
      expect(isWriteAction('getAuditIssues')).toBe(false);
    });
  });

  describe('gasFetch Safe Interception', () => {
    const originalFetch = globalThis.fetch;
    const origMode = import.meta.env.MODE;
    const origFlag = import.meta.env.VITE_MOBILE_UI_TEST_MODE;

    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      (import.meta.env as Record<string, unknown>).MODE = origMode;
      (import.meta.env as Record<string, unknown>).VITE_MOBILE_UI_TEST_MODE = origFlag;
    });

    it('blocks write actions and throws safety error in mobile test mode', async () => {
      (import.meta.env as Record<string, unknown>).MODE = 'mobiletest';
      (import.meta.env as Record<string, unknown>).VITE_MOBILE_UI_TEST_MODE = 'true';

      Object.defineProperty(window, 'location', {
        value: { hostname: '192.168.4.28' },
        writable: true,
        configurable: true
      });

      await expect(gasFetch('addExpense', { amount: 100 })).rejects.toThrow(
        'Local Mobile UI Test Mode — changes are not saved.'
      );

      // Verify no external network calls were dispatched
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('serves synthetic mock data for read actions in mobile test mode', async () => {
      (import.meta.env as Record<string, unknown>).MODE = 'mobiletest';
      (import.meta.env as Record<string, unknown>).VITE_MOBILE_UI_TEST_MODE = 'true';

      Object.defineProperty(window, 'location', {
        value: { hostname: '192.168.4.28' },
        writable: true,
        configurable: true
      });

      const response = await gasFetch('getDashboardSummary', {});
      expect(response.success).toBe(true);
      expect(response).toHaveProperty('totalIncome');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
