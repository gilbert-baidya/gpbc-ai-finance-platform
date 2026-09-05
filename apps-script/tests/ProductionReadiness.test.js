import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  getConfig,
  assertSandboxSheet,
  assertProductionReadiness,
  getProductionReadiness,
  PRODUCTION_SPREADSHEET_ID,
  PRODUCTION_DRIVE_ROOT_ID,
  SANDBOX_SPREADSHEET_ID,
  SANDBOX_DRIVE_ROOT_ID
} = require('../Config.gs');

const { authorizeAction, validateGoogleIdentity, getApprovedUser } = require('../Auth.gs');
const { doGet, doPost } = require('../Code.gs');
const { logAuditEvent } = require('../Audit.gs');

global.getConfig = getConfig;
global.assertSandboxSheet = assertSandboxSheet;
global.validateGoogleIdentity = validateGoogleIdentity;
global.getApprovedUser = getApprovedUser;
global.authorizeAction = authorizeAction;
global.logAuditEvent = logAuditEvent;

describe('Phase 5C-1 Production Read-Only Security & Write Guard Tests (A through L)', () => {
  beforeEach(() => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'production';
          if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
          if (key === 'GPBC_DRIVE_ROOT_FOLDER_ID') return PRODUCTION_DRIVE_ROOT_ID;
          if (key === 'GOOGLE_CLIENT_ID') return '456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com';
          if (key === 'GPBC_APPROVED_USERS') return JSON.stringify([
            { email: 'gilbert.baidya@gmail.com', role: 'Primary Admin', name: 'Pastor Gilbert' }
          ]);
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false'; // DISARMED / READ-ONLY
          return null;
        }
      })
    };
    global.ContentService = {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (text) => ({
        setMimeType: () => text
      })
    };
    global.Logger = { log: () => {} };
  });

  // TEST A: Production writes false blocks addTransaction
  it('Test A: production writes false blocks addTransaction', () => {
    expect(() => assertSandboxSheet('addTransaction')).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST B: Production writes false blocks uploadDocument
  it('Test B: production writes false blocks uploadDocument', () => {
    expect(() => assertSandboxSheet('uploadDocument')).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST C: Production writes false blocks reconciliation writes
  it('Test C: production writes false blocks reconciliation writes', () => {
    expect(() => assertSandboxSheet('reconcileTransactionRecord')).toThrow('FAIL-CLOSED SAFETY GUARD');
    expect(() => assertSandboxSheet('matchReconciliationLine')).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST D: Production writes false blocks close/reopen
  it('Test D: production writes false blocks close/reopen', () => {
    expect(() => assertSandboxSheet('closeMonthlyPeriod')).toThrow('FAIL-CLOSED SAFETY GUARD');
    expect(() => assertSandboxSheet('reopenMonthlyPeriod')).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST E: Production writes false blocks generatePresbyterReport
  it('Test E: production writes false blocks generatePresbyterReport', () => {
    expect(() => assertSandboxSheet('generatePresbyterReport')).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST F: Production writes false blocks authoritative AUDIT_LOGS writes
  it('Test F: production writes false blocks authoritative AUDIT_LOGS writes (zero rows appended)', () => {
    const appendRow = vi.fn();
    global.getDB = (isWrite, op) => {
      assertSandboxSheet(op);
      return { getSheetByName: () => ({ appendRow }) };
    };

    const res = logAuditEvent({ actor: 'gilbert.baidya@gmail.com', action: 'SMOKE_TEST', status: 'AUTHORIZED' });
    expect(res.success).toBe(true);
    expect(appendRow).not.toHaveBeenCalled();
  });

  // TEST G: Read-only report retrieval remains allowed when auth is valid
  it('Test G: read-only report retrieval remains allowed when auth is valid', () => {
    const auth = authorizeAction('getPresbyterReport', 'Primary Admin');
    expect(auth.authorized).toBe(true);
  });

  // TEST H: Public health creates zero Sheet writes
  it('Test H: public health creates zero Sheet writes', () => {
    const getDBMock = vi.fn();
    global.getDB = getDBMock;

    const res = JSON.parse(doGet({}));
    expect(res.success).toBe(true);
    expect(res.status).toBe('Healthy');
    expect(getDBMock).not.toHaveBeenCalled();
  });

  // TEST I: Sandbox config cannot leak into production
  it('Test I: sandbox config cannot leak into production', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'production';
          if (key === 'GPBC_SHEET_ID') return SANDBOX_SPREADSHEET_ID; // Leak attempt!
          return null;
        }
      })
    };

    expect(() => assertProductionReadiness()).toThrow('FAIL-CLOSED SAFETY GUARD');
  });

  // TEST J: Sandbox approved users cannot leak into production
  it('Test J: sandbox approved users (gilbert.cgpt@gmail.com) cannot leak into production allowlist', () => {
    expect(getApprovedUser('gilbert.cgpt@gmail.com')).toBeNull();
    expect(getApprovedUser('gilbert.baidya@gmail.com')).not.toBeNull();
  });

  // TEST K: Missing production OAuth client fails closed
  it('Test K: missing production OAuth client fails closed', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'production';
          if (key === 'GOOGLE_CLIENT_ID') return null; // Unset OAuth Client ID
          return null;
        }
      })
    };

    const res = validateGoogleIdentity('some-token');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('GOOGLE_CLIENT_ID is not configured');
  });

  // TEST L: Migration actions are unavailable
  it('Test L: migration actions are unavailable in production runtime API', () => {
    const actions = [
      'executeControlledCandidateMigration',
      'executeLegacyFinanceMigration',
      'createProductionCandidateMaster',
      'createLegacyPreMigrationBackup',
      'runPhase5B2Pipeline'
    ];

    actions.forEach((act) => {
      const auth = authorizeAction(act, 'Primary Admin');
      expect(auth.authorized).toBe(false);
    });
  });

  // TEST M: OAuth token audience mismatch is rejected
  it('Test M: OAuth token audience mismatch (e.g. sandbox token or CLI token) is rejected', () => {
    global.UrlFetchApp = {
      fetch: () => ({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sub: '12345',
          aud: 'sandbox-client-id.apps.googleusercontent.com', // Mismatched aud!
          iss: 'accounts.google.com',
          email_verified: 'true',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      })
    };

    const res = validateGoogleIdentity('mismatched-aud-token');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Token audience mismatch');
  });

  // TEST N: OAuth token with valid production client ID succeeds
  it('Test N: OAuth token with valid production client ID succeeds', () => {
    const prodClientId = '456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com';
    global.UrlFetchApp = {
      fetch: () => ({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sub: '12345',
          aud: prodClientId,
          iss: 'accounts.google.com',
          email_verified: 'true',
          email: 'gilbert.baidya@gmail.com',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      })
    };

    const res = validateGoogleIdentity('valid-prod-token');
    expect(res.valid).toBe(true);
    expect(res.claims.aud).toBe(prodClientId);
  });

  // TEST O: setProductionScriptProperties is NOT dispatchable via doPost API
  it('Test O: setProductionScriptProperties is NOT web-dispatchable via doPost API', () => {
    global.UrlFetchApp = {
      fetch: () => ({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sub: '12345',
          aud: '456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com',
          iss: 'accounts.google.com',
          email_verified: 'true',
          email: 'gilbert.baidya@gmail.com',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      })
    };

    const res = JSON.parse(doPost({
      postData: {
        contents: JSON.stringify({
          action: 'setProductionScriptProperties',
          idToken: 'valid-prod-token'
        })
      }
    }));

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Forbidden|Unknown or unsupported action/);
  });

  // TEST P: setProductionScriptProperties is safe, idempotent, and sets disarmed properties
  it('Test P: setProductionScriptProperties is safe, idempotent, and sets disarmed properties', () => {
    const setPropertiesMock = vi.fn();
    global.PropertiesService = {
      getScriptProperties: () => ({
        setProperties: setPropertiesMock
      })
    };

    const { setProductionScriptProperties } = require('../Config.gs');
    const res = setProductionScriptProperties();
    expect(res.success).toBe(true);
    expect(setPropertiesMock).toHaveBeenCalledWith(expect.objectContaining({
      GPBC_ENVIRONMENT: 'production',
      GPBC_SHEET_ID: PRODUCTION_SPREADSHEET_ID,
      GPBC_DRIVE_ROOT_FOLDER_ID: PRODUCTION_DRIVE_ROOT_ID,
      GPBC_PRODUCTION_WRITES_ENABLED: 'false'
    }));
  });
});
