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
    { email: 'auditor@gracepraise.church', role: 'Viewer', name: 'Auditor' }
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

  it('denies unknown users by default (returns null)', () => {
    expect(getApprovedUser('stranger@example.com')).toBeNull();
    expect(getApprovedUser('unapproved@gracepraise.church')).toBeNull();
  });

  it('allows Primary Admin and Backup Admin to run schema inventory and monthly automation', () => {
    expect(authorizeAction('getSchemaInventory', 'Primary Admin').authorized).toBe(true);
    expect(authorizeAction('getSchemaInventory', 'Backup Admin').authorized).toBe(true);
    expect(authorizeAction('getSchemaInventory', 'Viewer').authorized).toBe(false);
    expect(authorizeAction('getSchemaInventory', 'Finance Editor').authorized).toBe(false);
  });

  it('allows Finance Editor to add contributions and members', () => {
    expect(authorizeAction('addContribution', 'Finance Editor').authorized).toBe(true);
    expect(authorizeAction('addMember', 'Finance Editor').authorized).toBe(true);
    expect(authorizeAction('addContribution', 'Viewer').authorized).toBe(false);
    expect(authorizeAction('addContribution', 'Presbyter Read-Only').authorized).toBe(false);
  });

  it('allows Presbyter Read-Only to view dashboard and generate SoCal report', () => {
    expect(authorizeAction('getDashboardSummary', 'Presbyter Read-Only').authorized).toBe(true);
    expect(authorizeAction('generateSocalMonthlyReport', 'Presbyter Read-Only').authorized).toBe(true);
    expect(authorizeAction('addContribution', 'Presbyter Read-Only').authorized).toBe(false);
  });

  it('denies unknown actions by default', () => {
    expect(authorizeAction('nonExistentAction', 'Primary Admin').authorized).toBe(false);
  });
});
