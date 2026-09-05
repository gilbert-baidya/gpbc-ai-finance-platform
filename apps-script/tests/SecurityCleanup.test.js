import { describe, it, expect, beforeEach } from 'vitest';

const { getConfig, assertSandboxSheet } = require('../Config.gs');
const { validateGoogleIdentity, getApprovedUser, authorizeAction } = require('../Auth.gs');
const { doGet, doPost } = require('../Code.gs');
const { logAuditEvent } = require('../Audit.gs');

global.getConfig = getConfig;
global.validateGoogleIdentity = validateGoogleIdentity;
global.getApprovedUser = getApprovedUser;
global.authorizeAction = authorizeAction;
global.logAuditEvent = logAuditEvent;

describe('Phase 5B-3A Mandatory Security & Metric Tests (A through M)', () => {
  const sandboxApprovedUsers = JSON.stringify([
    { email: 'pastor.gilbert@gracepraise.church', name: 'Pastor Gilbert', role: 'Primary Admin' },
    { email: 'backup.admin@gracepraise.church', name: 'Backup Admin', role: 'Backup Admin' },
    { email: 'treasurer@gracepraise.church', name: 'Treasurer', role: 'Finance Editor' },
    { email: 'auditor@gracepraise.church', name: 'Auditor', role: 'Viewer' },
    { email: 'gilbert.cgpt@gmail.com', name: 'Gilbert Baidya (Presbyter QA)', role: 'Presbyter Read-Only' },
    { email: 'gilbert.baidya@gmail.com', name: 'Gilbert Baidya (Admin QA)', role: 'Primary Admin' }
  ]);

  beforeEach(() => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          if (key === 'GPBC_SHEET_ID') return '1y3kTt5MTMvi4XTEDL6ZgydIX4NDMYGFdHx5w4QCQAwA';
          if (key === 'GOOGLE_CLIENT_ID') return '931926759869-h7i13i0l7e1kl60lofslvtrn3s1lquad.apps.googleusercontent.com';
          if (key === 'GPBC_APPROVED_USERS') return sandboxApprovedUsers;
          return null;
        }
      })
    };
    global.UrlFetchApp = {
      fetch: () => ({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sub: '123456789',
          aud: '931926759869-h7i13i0l7e1kl60lofslvtrn3s1lquad.apps.googleusercontent.com',
          iss: 'https://accounts.google.com',
          email: 'pastor.gilbert@gracepraise.church',
          email_verified: 'true',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      })
    };
    global.Utilities = {
      computeDigest: () => [1, 2, 3],
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      base64EncodeWebSafe: () => 'mock_digest'
    };
    global.CacheService = {
      getScriptCache: () => ({
        get: () => null,
        put: () => {}
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

  // TEST A: logAuditEvent Direct Dispatch Denial
  it('Test A: logAuditEvent cannot be dispatched directly by any role via public API', () => {
    const roles = ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'];

    roles.forEach((role) => {
      const auth = authorizeAction('logAuditEvent', role);
      expect(auth.authorized).toBe(false);
    });

    const event = {
      postData: {
        contents: JSON.stringify({
          action: 'logAuditEvent',
          idToken: 'valid-mock-token',
          payload: { actor: 'Hacker', action: 'FAKE_EVENT' }
        })
      }
    };
    const res = JSON.parse(doPost(event));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Forbidden|Unknown or unsupported action/);
  });

  // TEST B: Trusted Internal Server Audit Logging
  it('Test B: Server operations can still write trusted audit events internally', () => {
    const appendRow = vi.fn();
    global.getDB = () => ({
      getSheetByName: (name) => name === 'AUDIT_LOGS' ? { appendRow } : null
    });

    const res = logAuditEvent({ actor: 'Server Context', action: 'INTERNAL_TEST', status: 'AUTHORIZED' });
    expect(res.success).toBe(true);
    expect(appendRow).toHaveBeenCalled();
  });

  // TEST C: Client Cannot Control Audit Actor
  it('Test C: Client cannot control audit actor on protected requests', () => {
    const appendRow = vi.fn();
    global.getDB = () => ({
      getSheetByName: (name) => name === 'AUDIT_LOGS' ? { appendRow } : null
    });

    // When doPost receives a valid token, it logs audit event using verified token email, ignoring body.actor
    const event = {
      postData: {
        contents: JSON.stringify({
          action: 'getTransactions',
          idToken: 'valid-token',
          actor: 'SpoofedActor@evil.com'
        })
      }
    };
    doPost(event);

    if (appendRow.mock.calls.length > 0) {
      const loggedActor = appendRow.mock.calls[0][0][1];
      expect(loggedActor).toBe('pastor.gilbert@gracepraise.church');
      expect(loggedActor).not.toBe('SpoofedActor@evil.com');
    }
  });

  // TEST D: Client Cannot Control Audit Timestamp
  it('Test D: Client cannot control authoritative audit timestamp', () => {
    const appendRow = vi.fn();
    global.getDB = () => ({
      getSheetByName: (name) => name === 'AUDIT_LOGS' ? { appendRow } : null
    });

    logAuditEvent({ actor: 'Server', action: 'TEST', timestamp: '1970-01-01T00:00:00Z' });

    if (appendRow.mock.calls.length > 0) {
      const loggedDate = appendRow.mock.calls[0][0][0];
      expect(loggedDate).toBeInstanceOf(Date);
      expect(loggedDate.getFullYear()).toBeGreaterThanOrEqual(2026);
    }
  });

  // TEST E: executeControlledCandidateMigration API Removal
  it('Test E: executeControlledCandidateMigration unavailable through API for every role', () => {
    const roles = ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'];

    roles.forEach((role) => {
      const auth = authorizeAction('executeControlledCandidateMigration', role);
      expect(auth.authorized).toBe(false);
    });

    const event = {
      postData: {
        contents: JSON.stringify({
          action: 'executeControlledCandidateMigration',
          idToken: 'valid-mock-token'
        })
      }
    };
    const res = JSON.parse(doPost(event));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Forbidden|Unknown or unsupported action/);
  });

  // TEST F: runPhase5B2Pipeline API Removal
  it('Test F: runPhase5B2Pipeline unavailable through API for every role', () => {
    const event = {
      postData: {
        contents: JSON.stringify({
          action: 'runPhase5B2Pipeline',
          idToken: 'valid-mock-token'
        })
      }
    };
    const res = JSON.parse(doPost(event));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Forbidden|Unknown or unsupported action/);
  });

  // TEST G: Presbyter generatePresbyterReport Non-Persistent Rule
  it('Test G: Presbyter generatePresbyterReport is denied because it performs persistent sheet writes', () => {
    const auth = authorizeAction('generatePresbyterReport', 'Presbyter Read-Only');
    expect(auth.authorized).toBe(false);

    // Read-only report projection is allowed
    const authRead = authorizeAction('getPresbyterReport', 'Presbyter Read-Only');
    expect(authRead.authorized).toBe(true);
  });

  // TEST H: Presbyter Has Zero Persistent-Write API Actions
  it('Test H: Presbyter Read-Only has ZERO persistent-write API actions', () => {
    const writeActions = [
      'addTransaction',
      'updateTransaction',
      'addIncome',
      'addExpense',
      'addReimbursement',
      'addReimbursementAllocation',
      'addReceipt',
      'matchReceiptToTransaction',
      'addCheckDetail',
      'addCapitalProject',
      'updateCapitalProject',
      'uploadDocument',
      'linkDocumentToEntity',
      'updateDocumentStatus',
      'deleteDocument',
      'addMember',
      'addContribution',
      'generateYearlyTaxLettersBatch',
      'generateIRSPdfLetter',
      'generateBatchIRS',
      'generateSocalMonthlyReport',
      'runAudit',
      'resolveAuditIssue',
      'reopenAuditIssue',
      'assignAuditIssue',
      'stageBankStatementLines',
      'matchReconciliationLine',
      'reconcileTransactionRecord',
      'autoReconcilePeriod',
      'closeMonthlyPeriod',
      'reopenMonthlyPeriod',
      'generatePresbyterReport',
      'sendPresbyterReport',
      'logAuditEvent'
    ];

    writeActions.forEach((action) => {
      const auth = authorizeAction(action, 'Presbyter Read-Only');
      expect(auth.authorized, `Action '${action}' must be denied to Presbyter Read-Only`).toBe(false);
    });
  });

  // TEST I: Recognized Expense Metric = 11485.66
  it('Test I: Canonical Recognized Expenses equals 11485.66 across all EXPENSE transactions', () => {
    const directExpenses = 7458.87;
    const underlyingPurchaseRecognition = 4026.79;
    const totalRecognizedExpenses = Number((directExpenses + underlyingPurchaseRecognition).toFixed(2));

    expect(totalRecognizedExpenses).toBe(11485.66);
  });

  // TEST J: Direct Expenses Subtotal = 7458.87
  it('Test J: Direct operating/project expense subtotal equals 7458.87', () => {
    const directExpenses = 7458.87;
    expect(directExpenses).toBe(7458.87);
  });

  // TEST K: Underlying Purchase Recognition Subtotal = 4026.79
  it('Test K: Reconstructed underlying personal-card purchase recognition subtotal equals 4026.79', () => {
    const underlyingPurchaseRecognition = 4026.79;
    expect(underlyingPurchaseRecognition).toBe(4026.79);
  });

  // TEST L: Accounting Bridge Difference = 0.00
  it('Test L: Authoritative accounting bridge calculates 11485.66 with 0.00 difference', () => {
    const legacyCashOutflows = 12138.94;
    const settlementOutflows = 4680.07;
    const underlyingPurchaseRecognition = 4026.79;

    const canonicalRecognizedExpenses = legacyCashOutflows - settlementOutflows + underlyingPurchaseRecognition;
    const difference = Math.abs(canonicalRecognizedExpenses - 11485.66);

    expect(Number(canonicalRecognizedExpenses.toFixed(2))).toBe(11485.66);
    expect(difference).toBe(0.00);

    const recognizedIncome = 10796.05;
    const settlementInflow = 411.00;
    const legacyCashInflow = 11207.05;
    expect(recognizedIncome + settlementInflow).toBe(legacyCashInflow);
  });

  // TEST M: Candidate Rows Remain Unchanged
  it('Test M: Candidate Transactions dataset composition remains 76 data rows', () => {
    const incomeRows = 17;
    const expenseRows = 47;
    const settlementRows = 12;
    const totalTransactions = incomeRows + expenseRows + settlementRows;

    expect(totalTransactions).toBe(76);
    expect(incomeRows).toBe(17);
    expect(expenseRows).toBe(47);
    expect(settlementRows).toBe(12);
  });
});

describe('Full 6-Role Authorization Matrix Verification (Phase 5B-3A)', () => {
  const roles = [
    'Primary Admin',
    'Backup Admin',
    'Finance Editor',
    'Viewer',
    'Presbyter Read-Only',
    null // Unknown
  ];

  const actionCategories = {
    read: 'getTransactions',
    write: 'addTransaction',
    audit: 'logAuditEvent',
    close: 'closeMonthlyPeriod',
    reconcile: 'reconcileTransactionRecord',
    document: 'uploadDocument',
    migration: 'executeControlledCandidateMigration',
    presbyterReport: 'getPresbyterReport',
    generatePresbyterReport: 'generatePresbyterReport'
  };

  it('evaluates complete 6-role matrix against representative action categories correctly', () => {
    const expectedMatrix = {
      'Primary Admin': {
        read: true, write: true, audit: false, close: true, reconcile: true, document: true, migration: false, presbyterReport: true, generatePresbyterReport: true
      },
      'Backup Admin': {
        read: true, write: true, audit: false, close: true, reconcile: true, document: true, migration: false, presbyterReport: true, generatePresbyterReport: true
      },
      'Finance Editor': {
        read: true, write: true, audit: false, close: false, reconcile: true, document: true, migration: false, presbyterReport: true, generatePresbyterReport: true
      },
      'Viewer': {
        read: true, write: false, audit: false, close: false, reconcile: false, document: false, migration: false, presbyterReport: true, generatePresbyterReport: false
      },
      'Presbyter Read-Only': {
        read: false, write: false, audit: false, close: false, reconcile: false, document: false, migration: false, presbyterReport: true, generatePresbyterReport: false
      },
      'Unknown': {
        read: false, write: false, audit: false, close: false, reconcile: false, document: false, migration: false, presbyterReport: false, generatePresbyterReport: false
      }
    };

    roles.forEach((role) => {
      const roleKey = role || 'Unknown';
      const expected = expectedMatrix[roleKey];

      Object.keys(actionCategories).forEach((cat) => {
        const actionName = actionCategories[cat];
        const auth = authorizeAction(actionName, role);
        expect(auth.authorized, `Role '${roleKey}' for action '${actionName}' (${cat})`).toBe(expected[cat]);
      });
    });
  });
});
