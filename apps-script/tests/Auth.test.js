import { describe, it, expect, beforeEach } from 'vitest';

const { getConfig } = require('../Config.gs');
global.getConfig = getConfig;

const {
  getApprovedUser,
  authorizeAction
} = require('../Auth.gs');

describe('Apps Script Server-Side Authorization (Auth.gs)', () => {
  const approvedList = JSON.stringify([
    { email: 'pastor.gilbert@gracepraise.church', role: 'Primary Admin', name: 'Pastor Gilbert' },
    { email: 'treasurer@gracepraise.church', role: 'Finance Editor', name: 'Treasurer' },
    { email: 'presbyter@socal.org', role: 'Presbyter Read-Only', name: 'Presbyter' },
    { email: 'backup@gmail.com', role: 'Backup Admin', name: 'Backup' },
    { email: 'auditor@gracepraise.church', role: 'Viewer', name: 'Auditor' },
    { email: 'gilbert.baidya@gmail.com', role: 'Primary Admin', name: 'Gilbert Baidya' },
    { email: 'gilbert.cgpt@gmail.com', role: 'Presbyter Read-Only', name: 'Gilbert Baidya (Presbyter)' }
  ]);

  beforeEach(() => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_APPROVED_USERS') return approvedList;
          return null;
        }
      })
    };
  });

  it('correctly maps explicitly approved users to administrative roles', () => {
    const pastor = getApprovedUser('pastor.gilbert@gracepraise.church');
    expect(pastor.role).toBe('Primary Admin');

    const financeTeam = getApprovedUser('treasurer@gracepraise.church');
    expect(financeTeam.role).toBe('Finance Editor');
  });

  it('correctly resolves presbyter and backup admin from approved user list', () => {
    const presbyter = getApprovedUser('presbyter@socal.org');
    expect(presbyter.role).toBe('Presbyter Read-Only');

    const backup = getApprovedUser('backup@gmail.com');
    expect(backup.role).toBe('Backup Admin');
  });

  it('correctly resolves real approved users gilbert.cgpt@gmail.com (Presbyter Read-Only) and gilbert.baidya@gmail.com (Primary Admin)', () => {
    const presbyterUser = getApprovedUser('gilbert.cgpt@gmail.com');
    expect(presbyterUser).not.toBeNull();
    expect(presbyterUser.role).toBe('Presbyter Read-Only');

    const adminUser = getApprovedUser('gilbert.baidya@gmail.com');
    expect(adminUser).not.toBeNull();
    expect(adminUser.role).toBe('Primary Admin');
  });

  it('denies unknown users by default (returns null)', () => {
    expect(getApprovedUser('stranger@example.com')).toBeNull();
    expect(getApprovedUser('unapproved@gracepraise.church')).toBeNull();
  });

  it('allows Primary Admin and Backup Admin to run schema inventory and monthly automation while denying migration executors', () => {
    expect(authorizeAction('getSchemaInventory', 'Primary Admin').authorized).toBe(true);
    expect(authorizeAction('getSchemaInventory', 'Backup Admin').authorized).toBe(true);
    expect(authorizeAction('getSchemaInventory', 'Viewer').authorized).toBe(false);
    expect(authorizeAction('getSchemaInventory', 'Finance Editor').authorized).toBe(false);
    expect(authorizeAction('getLegacyMigrationDryRun', 'Primary Admin').authorized).toBe(false);
    expect(authorizeAction('getLegacyMigrationDryRun', 'Backup Admin').authorized).toBe(false);
    expect(authorizeAction('getLegacyMigrationDryRun', 'Finance Editor').authorized).toBe(false);
    expect(authorizeAction('getLegacyMigrationDryRun', 'Viewer').authorized).toBe(false);
    expect(authorizeAction('executeLegacyFinanceMigration', 'Backup Admin').authorized).toBe(false);
    expect(authorizeAction('executeLegacyFinanceMigration', 'Finance Editor').authorized).toBe(false);
    expect(authorizeAction('executeLegacyFinanceMigration', 'Viewer').authorized).toBe(false);
  });

  it('allows Finance Editor to add contributions and members', () => {
    expect(authorizeAction('addContribution', 'Finance Editor').authorized).toBe(true);
    expect(authorizeAction('addMember', 'Finance Editor').authorized).toBe(true);
    expect(authorizeAction('addContribution', 'Viewer').authorized).toBe(false);
    expect(authorizeAction('addContribution', 'Presbyter Read-Only').authorized).toBe(false);
  });

  it('strictly enforces least-privilege for Presbyter Read-Only by denying operational read APIs and persistent generation', () => {
    // Allowed Presbyter APIs (Read-Only)
    expect(authorizeAction('verifySession', 'Presbyter Read-Only').authorized).toBe(true);
    expect(authorizeAction('getPresbyterReport', 'Presbyter Read-Only').authorized).toBe(true);
    expect(authorizeAction('getPresbyterReports', 'Presbyter Read-Only').authorized).toBe(true);
    expect(authorizeAction('generatePresbyterReport', 'Presbyter Read-Only').authorized).toBe(false);

    // DENIED Operational Read APIs for Presbyter Read-Only
    expect(authorizeAction('getDashboardSummary', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getTransactions', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getDocuments', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getAuditIssues', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getMonthlyCloseReadiness', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getReimbursements', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getReceipts', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getCheckDetails', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('getCapitalProjects', 'Presbyter Read-Only').authorized).toBe(false);
    expect(authorizeAction('addContribution', 'Presbyter Read-Only').authorized).toBe(false);
  });

  it('denies unknown actions by default', () => {
    expect(authorizeAction('nonExistentAction', 'Primary Admin').authorized).toBe(false);
  });

  it('validateGoogleIdentity enforces strict single Web OAuth Client ID and rejects CLI client ID', () => {
    const { validateGoogleIdentity } = require('../Auth.gs');
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GOOGLE_CLIENT_ID') return '1072944905499-web-client-id.apps.googleusercontent.com';
          return null;
        }
      })
    };
    global.UrlFetchApp = {
      fetch: vi.fn((url) => {
        if (url.includes('valid-web-token')) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
              sub: '12345',
              aud: '1072944905499-web-client-id.apps.googleusercontent.com',
              iss: 'https://accounts.google.com',
              email_verified: true,
              email: 'pastor.gilbert@gracepraise.church',
              exp: Math.floor(Date.now() / 1000) + 3600
            })
          };
        }
        if (url.includes('cli-token')) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
              sub: '12345',
              aud: '1072944905499-cli-client-id.apps.googleusercontent.com',
              iss: 'https://accounts.google.com',
              email_verified: true,
              email: 'pastor.gilbert@gracepraise.church',
              exp: Math.floor(Date.now() / 1000) + 3600
            })
          };
        }
        return { getResponseCode: () => 400, getContentText: () => 'Invalid' };
      })
    };

    const webRes = validateGoogleIdentity('valid-web-token');
    expect(webRes.valid).toBe(true);
    expect(webRes.claims.email).toBe('pastor.gilbert@gracepraise.church');

    const cliRes = validateGoogleIdentity('cli-token');
    expect(cliRes.valid).toBe(false);
    expect(cliRes.error).toBe('Token audience mismatch');
  });
});
