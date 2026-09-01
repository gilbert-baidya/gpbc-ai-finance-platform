import { describe, it, expect } from 'vitest';

// Simulate Apps Script Auth logic
function getApprovedUser(email, approvedListJson = '[]') {
  if (!email) return null;
  const normalizedEmail = String(email).toLowerCase().trim();

  let approvedList = [];
  try {
    approvedList = JSON.parse(approvedListJson || '[]');
  } catch {
    approvedList = [];
  }

  for (let i = 0; i < approvedList.length; i++) {
    const item = approvedList[i];
    if (item && item.email && String(item.email).toLowerCase().trim() === normalizedEmail) {
      return {
        email: normalizedEmail,
        name: item.name || normalizedEmail,
        role: item.role || 'Viewer'
      };
    }
  }

  if (normalizedEmail.endsWith('@gracepraise.church')) {
    if (normalizedEmail.includes('pastor') || normalizedEmail.includes('gilbert')) {
      return { email: normalizedEmail, name: 'Pastor Gilbert', role: 'Primary Admin' };
    }
    return { email: normalizedEmail, name: normalizedEmail.split('@')[0], role: 'Finance Editor' };
  }

  return {
    email: normalizedEmail,
    name: normalizedEmail,
    role: 'Viewer'
  };
}

function authorizeAction(action, role) {
  if (!action) return { authorized: false, reason: 'No action specified' };

  const ALL_ADMINS = ['Primary Admin', 'Backup Admin'];
  const FINANCE_WRITERS = ['Primary Admin', 'Backup Admin', 'Finance Editor'];
  const ALL_READERS = ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'];
  const PRESBYTER_SET = ['Primary Admin', 'Backup Admin', 'Presbyter Read-Only'];

  const PERMISSION_MATRIX = {
    verifySession: ALL_READERS,
    getSchemaInventory: ALL_ADMINS,
    getDashboardSummary: ALL_READERS,
    getMembers: FINANCE_WRITERS,
    getTaxLetterData: FINANCE_WRITERS,
    getMemberYearlyContributions: FINANCE_WRITERS,
    addMember: FINANCE_WRITERS,
    addContribution: FINANCE_WRITERS,
    generateYearlyTaxLettersBatch: FINANCE_WRITERS,
    generateIRSPdfLetter: FINANCE_WRITERS,
    generateBatchIRS: FINANCE_WRITERS,
    generateSocalMonthlyReport: [...PRESBYTER_SET, 'Finance Editor'],
    runMonthlyAutomation: ALL_ADMINS,
    logAuditEvent: ALL_READERS
  };

  const allowedRoles = PERMISSION_MATRIX[action];
  if (!allowedRoles) {
    return { authorized: false, reason: 'Action not recognized in authorization policy: ' + action };
  }

  if (allowedRoles.includes(role)) {
    return { authorized: true };
  }

  return { authorized: false, reason: `Role '${role}' is not permitted to perform '${action}'` };
}

describe('Apps Script Server-Side Authorization', () => {
  it('correctly maps church domain users to administrative roles', () => {
    const pastor = getApprovedUser('pastor.gilbert@gracepraise.church');
    expect(pastor.role).toBe('Primary Admin');

    const financeTeam = getApprovedUser('treasurer@gracepraise.church');
    expect(financeTeam.role).toBe('Finance Editor');
  });

  it('correctly uses explicit approved user list when provided', () => {
    const list = JSON.stringify([
      { email: 'presbyter@socal.org', role: 'Presbyter Read-Only', name: 'Presbyter' },
      { email: 'backup@gmail.com', role: 'Backup Admin', name: 'Backup' }
    ]);

    const presbyter = getApprovedUser('presbyter@socal.org', list);
    expect(presbyter.role).toBe('Presbyter Read-Only');

    const backup = getApprovedUser('backup@gmail.com', list);
    expect(backup.role).toBe('Backup Admin');
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
