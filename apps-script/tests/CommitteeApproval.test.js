import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  SCHEMA_DEFINITIONS,
  SANDBOX_SCHEMA_EXTENSIONS,
  getConfig,
  assertSandboxSheet,
  PRODUCTION_SPREADSHEET_ID,
  SANDBOX_SPREADSHEET_ID
} = require('../Config.gs');

const {
  getCommitteeMembers,
  addCommitteeMember,
  updateCommitteeMember,
  deactivateCommitteeMember,
  getMonthlyExpensePacket,
  calculateApprovalOutcome,
  recordCommitteeApproval,
  getMonthlyCommitteeApproval,
  createCommitteeApprovalAmendment,
  computePacketDigest
} = require('../CommitteeApproval.gs');

const {
  authorizeAction,
  validateGoogleIdentity,
  getApprovedUser
} = require('../Auth.gs');

const {
  getMonthlyCloseReadiness
} = require('../MonthlyClose.gs');

function createMockSandboxDb() {
  const tables = {
    Transactions: [
      [...SCHEMA_DEFINITIONS.Transactions]
    ],
    Reimbursements: [
      [...SCHEMA_DEFINITIONS.Reimbursements]
    ],
    Committee_Members: [
      [...SANDBOX_SCHEMA_EXTENSIONS.Committee_Members]
    ],
    Monthly_Committee_Approval: [
      [...SANDBOX_SCHEMA_EXTENSIONS.Monthly_Committee_Approval]
    ],
    Committee_Approval_Decisions: [
      [...SANDBOX_SCHEMA_EXTENSIONS.Committee_Approval_Decisions]
    ],
    Monthly_Close: [
      [...SCHEMA_DEFINITIONS.Monthly_Close],
      // Closed September 2026 record
      ['CLS-202609-901', '2026-09', '2026-09-01', '2026-09-30', 'Closed', 'v1', true, true, true, true, true, true, true, true, true, true, 0, 0, 100, 5000, 1200, 3800, 'pastor.gilbert@gracepraise.church', '2026-10-01T00:00:00Z', '', '', '', '', '', '', 'September Close Finalized', '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z']
    ],
    Monthly_Close_History: [
      [...SCHEMA_DEFINITIONS.Monthly_Close_History]
    ],
    AUDIT_LOGS: [
      [...SCHEMA_DEFINITIONS.AUDIT_LOGS]
    ]
  };

  function makeSheet(name) {
    if (!tables[name]) {
      tables[name] = [(SCHEMA_DEFINITIONS[name] || SANDBOX_SCHEMA_EXTENSIONS[name]) ? [...(SCHEMA_DEFINITIONS[name] || SANDBOX_SCHEMA_EXTENSIONS[name])] : ['id']];
    }
    const rows = tables[name];

    return {
      getName: () => name,
      getLastRow: () => rows.length,
      getLastColumn: () => (rows[0] ? rows[0].length : 0),
      appendRow: (row) => {
        rows.push([...row]);
      },
      getDataRange: () => ({
        getValues: () => rows.map(r => [...r])
      }),
      getRange: (r, c, numR = 1, numC = 1) => ({
        getValues: () => {
          const res = [];
          for (let i = 0; i < numR; i++) {
            const rowIdx = r - 1 + i;
            const row = rows[rowIdx] || [];
            const slice = [];
            for (let j = 0; j < numC; j++) {
              slice.push(row[c - 1 + j] !== undefined ? row[c - 1 + j] : '');
            }
            res.push(slice);
          }
          return res;
        },
        setValue: (val) => {
          while (rows.length < r) rows.push([]);
          while (rows[r - 1].length < c) rows[r - 1].push('');
          rows[r - 1][c - 1] = val;
        },
        setFontWeight: () => ({ setBackground: () => {} }),
        setBackground: () => {}
      })
    };
  }

  const sheetInstances = {};
  Object.keys(tables).forEach(name => {
    sheetInstances[name] = makeSheet(name);
  });

  return {
    tables,
    getId: () => SANDBOX_SPREADSHEET_ID,
    getName: () => 'GPBC_Finance_Master_SANDBOX',
    getSheetByName: (name) => {
      if (!sheetInstances[name]) {
        sheetInstances[name] = makeSheet(name);
      }
      return sheetInstances[name];
    },
    getSheets: () => Object.keys(tables).map(name => makeSheet(name)),
    insertSheet: (name) => {
      if (!tables[name]) {
        tables[name] = [(SCHEMA_DEFINITIONS[name] || SANDBOX_SCHEMA_EXTENSIONS[name]) ? [...(SCHEMA_DEFINITIONS[name] || SANDBOX_SCHEMA_EXTENSIONS[name])] : ['id']];
      }
      sheetInstances[name] = makeSheet(name);
      return sheetInstances[name];
    }
  };
}

describe('Monthly Committee Expense Approval Service', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockSandboxDb();

    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return SANDBOX_SPREADSHEET_ID;
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
          if (key === 'GOOGLE_CLIENT_ID') return 'gpbc-test-client-id';
          if (key === 'GPBC_APPROVED_USERS') {
            return JSON.stringify([
              { email: 'primary.admin@gracepraise.church', role: 'Primary Admin' },
              { email: 'backup.admin@gracepraise.church', role: 'Backup Admin' },
              { email: 'finance.editor@gracepraise.church', role: 'Finance Editor' },
              { email: 'viewer@gracepraise.church', role: 'Viewer' },
              { email: 'presbyter@socalnetwork.org', role: 'Presbyter Read-Only' }
            ]);
          }
          return null;
        }
      })
    };

    global.SpreadsheetApp = {
      openById: (id) => {
        if (id === SANDBOX_SPREADSHEET_ID) return mockDb;
        throw new Error('Unauthorized sheet access: ' + id);
      }
    };

    global.getTransactions = () => ({ success: true, transactions: [] });
    global.getReimbursements = () => ({ success: true, reimbursements: [] });
    global.getReceipts = () => ({ success: true, receipts: [] });
    global.getCheckDetails = () => ({ success: true, checks: [] });
    global.getReconciliationRecords = () => ({ success: true, records: [] });
    global.getAuditIssues = () => ({ success: true, issues: [] });
    global.getDesignatedFundsSummary = () => ({ success: true, funds: [] });
    global.getDocuments = () => ({ success: true, documents: [] });
  });

  // 1. Committee Member Directory CRUD
  describe('Committee Member Directory', () => {
    it('creates, reads, updates, and soft-deactivates committee members', () => {
      const addRes = addCommitteeMember({
        fullName: 'Johnathan Edwards',
        roleTitle: 'Treasurer',
        email: 'treasurer@gracepraise.church',
        phone: '909-555-0101',
        effectiveFrom: '2026-01-01'
      }, 'primary.admin@gracepraise.church');

      expect(addRes.success).toBe(true);
      expect(addRes.member.fullName).toBe('Johnathan Edwards');
      expect(addRes.member.status).toBe('ACTIVE');

      const listRes = getCommitteeMembers();
      expect(listRes.members.length).toBe(1);
      expect(listRes.members[0].memberId).toBe(addRes.member.memberId);

      // Update member
      updateCommitteeMember({
        memberId: addRes.member.memberId,
        roleTitle: 'Senior Treasurer'
      }, 'primary.admin@gracepraise.church');

      const updatedList = getCommitteeMembers();
      expect(updatedList.members[0].roleTitle).toBe('Senior Treasurer');

      // Soft-deactivate member
      deactivateCommitteeMember({
        memberId: addRes.member.memberId,
        effectiveTo: '2026-12-31'
      }, 'primary.admin@gracepraise.church');

      const deactList = getCommitteeMembers();
      expect(deactList.members[0].status).toBe('INACTIVE');
      expect(deactList.members[0].effectiveTo).toBe('2026-12-31');
    });

    it('fails closed when required member fields are missing', () => {
      expect(() => addCommitteeMember({ fullName: '' }, 'primary.admin@gracepraise.church')).toThrow('Full name is required');
      expect(() => addCommitteeMember({ fullName: 'Alice' }, 'primary.admin@gracepraise.church')).toThrow('Role / Title is required');
    });
  });

  // 2. Accounting Total Rules & Packet Generation
  describe('Monthly Expense Packet Accounting Rules', () => {
    beforeEach(() => {
      // Seed sample transactions for 2026-08
      const txSheet = mockDb.getSheetByName('Transactions');
      const txHeaders = SCHEMA_DEFINITIONS.Transactions;

      const makeTxRow = (obj) => txHeaders.map(h => obj[h] !== undefined ? obj[h] : '');

      // Direct operational expense -> RECOGNIZED
      txSheet.appendRow(makeTxRow({
        transactionId: 'TXN-08-01',
        transactionDate: '2026-08-05',
        transactionType: 'Expense',
        direction: 'EXPENSE',
        accountingImpact: 'EXPENSE',
        amount: 500.00,
        payeeOrPayer: 'Churchwest Insurance',
        category: 'Insurance',
        description: 'Property Insurance Premium',
        receiptStatus: 'ATTACHED',
        receiptId: 'DOC-01'
      }));

      // Personal reimbursable purchase -> RECOGNIZED EXPENSE
      txSheet.appendRow(makeTxRow({
        transactionId: 'TXN-08-02',
        transactionDate: '2026-08-10',
        transactionType: 'Expense',
        direction: 'EXPENSE',
        accountingImpact: 'EXPENSE',
        amount: 150.00,
        payeeOrPayer: 'Office Depot',
        category: 'Office Supplies',
        description: 'Printer Toner',
        personalPurchase: true,
        claimantName: 'Sarah Jenkins',
        receiptStatus: 'ATTACHED',
        receiptId: 'DOC-02'
      }));

      // Reimbursement payout -> SETTLEMENT (NOT a recognized duplicate expense!)
      txSheet.appendRow(makeTxRow({
        transactionId: 'TXN-08-03',
        transactionDate: '2026-08-15',
        transactionType: 'Reimbursement',
        direction: 'EXPENSE',
        accountingImpact: 'SETTLEMENT',
        amount: 150.00,
        payeeOrPayer: 'Sarah Jenkins',
        category: 'Reimbursement',
        description: 'Reimbursement Settlement to Sarah Jenkins'
      }));

      // Capital Project expense -> RECOGNIZED + CAP PROJECT
      txSheet.appendRow(makeTxRow({
        transactionId: 'TXN-08-04',
        transactionDate: '2026-08-20',
        transactionType: 'Expense',
        direction: 'EXPENSE',
        accountingImpact: 'EXPENSE',
        amount: 2000.00,
        payeeOrPayer: 'AC Pro HVAC',
        category: 'Capital Improvement',
        description: 'Sanctuary AC Unit Replacement',
        capitalProjectId: 'CP-HVAC-01',
        receiptStatus: 'MISSING'
      }));

      // Income transaction -> IGNORED from expense packet
      txSheet.appendRow(makeTxRow({
        transactionId: 'TXN-08-05',
        transactionDate: '2026-08-25',
        transactionType: 'Sunday Offering',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 3500.00,
        payeeOrPayer: 'Congregation'
      }));
    });

    it('calculates recognized expenses accurately and does not double-count reimbursement settlements', () => {
      const packet = getMonthlyExpensePacket({ periodKey: '2026-08' });

      expect(packet.success).toBe(true);
      // Recognized expenses: 500 (Churchwest) + 150 (Office Depot) + 2000 (HVAC) = 2650.00
      // Reimbursement payout (150) must NOT be counted in recognized total!
      expect(packet.summary.totalRecognizedExpenses).toBe(2650.00);
      expect(packet.summary.expenseCount).toBe(3);

      // Separate settlement total
      expect(packet.summary.reimbursementSettlementTotal).toBe(150.00);
      expect(packet.summary.reimbursementSettlementCount).toBe(1);

      // Capital project total
      expect(packet.summary.capitalProjectTotal).toBe(2000.00);

      // Evidence counts: 2 attached (DOC-01, DOC-02), 1 missing (HVAC)
      expect(packet.summary.receiptsCompleteCount).toBe(2);
      expect(packet.summary.missingEvidenceCount).toBe(1);

      // Deterministic packetHash generated
      expect(packet.packetHash).toBeDefined();
      expect(packet.packetHash.length).toBeGreaterThan(0);
    });
  });

  // 3. Approval Engine & Threshold Rules
  describe('Approval Threshold Engine', () => {
    const members = [
      { memberId: 'M1', fullName: 'Pastor Gilbert', roleTitle: 'Chair' },
      { memberId: 'M2', fullName: 'Sarah', roleTitle: 'Secretary' },
      { memberId: 'M3', fullName: 'David', roleTitle: 'Treasurer' },
      { memberId: 'M4', fullName: 'James', roleTitle: 'Board Member' },
      { memberId: 'M5', fullName: 'Mary', roleTitle: 'Board Member' }
    ];

    it('computes majority rule threshold correctly (3 of 5)', () => {
      // 3 approve, 2 not present
      const outcome = calculateApprovalOutcome('MAJORITY_OF_ELIGIBLE_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' },
        { memberId: 'M2', decision: 'APPROVED' },
        { memberId: 'M3', decision: 'APPROVED' },
        { memberId: 'M4', decision: 'NOT_PRESENT' },
        { memberId: 'M5', decision: 'NOT_PRESENT' }
      ]);
      expect(outcome.isThresholdMet).toBe(true);
      expect(outcome.requiredApprovalCount).toBe(3);
      expect(outcome.actualApprovalCount).toBe(3);
      expect(outcome.status).toBe('APPROVED');
    });

    it('returns APPROVED_WITH_EXCEPTIONS if any approving member added a comment', () => {
      const outcome = calculateApprovalOutcome('MAJORITY_OF_ELIGIBLE_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' },
        { memberId: 'M2', decision: 'APPROVED_WITH_COMMENT', comment: 'Receipt for HVAC needs follow-up' },
        { memberId: 'M3', decision: 'APPROVED' },
        { memberId: 'M4', decision: 'NOT_PRESENT' },
        { memberId: 'M5', decision: 'NOT_PRESENT' }
      ]);
      expect(outcome.isThresholdMet).toBe(true);
      expect(outcome.status).toBe('APPROVED_WITH_EXCEPTIONS');
      expect(outcome.exceptionCount).toBe(1);
    });

    it('returns RETURNED_FOR_CLARIFICATION if any member voted to return', () => {
      const outcome = calculateApprovalOutcome('MAJORITY_OF_ELIGIBLE_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' },
        { memberId: 'M2', decision: 'APPROVED' },
        { memberId: 'M3', decision: 'APPROVED' },
        { memberId: 'M4', decision: 'RETURNED_FOR_CLARIFICATION', comment: 'Need invoice copy' },
        { memberId: 'M5', decision: 'NOT_PRESENT' }
      ]);
      expect(outcome.isThresholdMet).toBe(false);
      expect(outcome.status).toBe('RETURNED_FOR_CLARIFICATION');
    });

    it('computes unanimous present rule correctly', () => {
      // 4 present (all approve), 1 not present
      const outcome = calculateApprovalOutcome('UNANIMOUS_OF_PRESENT_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' },
        { memberId: 'M2', decision: 'APPROVED' },
        { memberId: 'M3', decision: 'APPROVED' },
        { memberId: 'M4', decision: 'APPROVED' },
        { memberId: 'M5', decision: 'NOT_PRESENT' }
      ]);
      expect(outcome.isThresholdMet).toBe(true);
      expect(outcome.requiredApprovalCount).toBe(4);
      expect(outcome.actualApprovalCount).toBe(4);
      expect(outcome.status).toBe('APPROVED');
    });

    it('rejects missing, unknown, and invalid decisions before writing approval data', () => {
      expect(() => calculateApprovalOutcome('MAJORITY_OF_ELIGIBLE_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' }
      ])).toThrow(/Missing committee decision/);

      expect(() => calculateApprovalOutcome('MAJORITY_OF_ELIGIBLE_MEMBERS', members, [
        { memberId: 'M1', decision: 'APPROVED' },
        { memberId: 'M2', decision: 'APPROVED' },
        { memberId: 'M3', decision: 'APPROVED' },
        { memberId: 'M4', decision: 'NOT_PRESENT' },
        { memberId: 'M5', decision: 'NOPE' }
      ])).toThrow(/Invalid or unrecorded committee decision/);
    });
  });

  // 4. Historical Approver Snapshot Preservation
  describe('Approver Snapshot Preservation & Immortality', () => {
    it('captures member name and role at approval time and does not alter them when member directory changes later', () => {
      // 1. Add Member
      const memberRes = addCommitteeMember({
        fullName: 'Elder Joseph Smith',
        roleTitle: 'Treasurer',
        effectiveFrom: '2026-01-01'
      }, 'primary.admin@gracepraise.church');

      const memberId = memberRes.member.memberId;

      // Seed 1 expense
      const txSheet = mockDb.getSheetByName('Transactions');
      txSheet.appendRow(SCHEMA_DEFINITIONS.Transactions.map(h => {
        if (h === 'transactionId') return 'TXN-TEST-01';
        if (h === 'transactionDate') return '2026-08-10';
        if (h === 'direction') return 'EXPENSE';
        if (h === 'accountingImpact') return 'EXPENSE';
        if (h === 'amount') return 100;
        if (h === 'payeeOrPayer') return 'Vendor';
        return '';
      }));

      // 2. Record Approval
      const recRes = recordCommitteeApproval({
        periodKey: '2026-08',
        meetingDate: '2026-08-31',
        approvalMethod: 'COMMITTEE_MEETING',
        approvalRule: 'MAJORITY_OF_ELIGIBLE_MEMBERS',
        decisions: [
          { memberId: memberId, decision: 'APPROVED', comment: 'Approved in meeting' }
        ]
      }, 'primary.admin@gracepraise.church');

      expect(recRes.success).toBe(true);
      expect(recRes.decisions[0].memberNameSnapshot).toBe('Elder Joseph Smith');
      expect(recRes.decisions[0].memberRoleSnapshot).toBe('Treasurer');

      // 3. Later, member changes title and gets deactivated in directory
      updateCommitteeMember({
        memberId: memberId,
        fullName: 'Elder Joseph Smith Jr.',
        roleTitle: 'Former Treasurer'
      }, 'primary.admin@gracepraise.church');
      deactivateCommitteeMember({ memberId: memberId }, 'primary.admin@gracepraise.church');

      // 4. Retrieve August approval: MUST still reflect original snapshots!
      const fetched = getMonthlyCommitteeApproval({ periodKey: '2026-08' });
      expect(fetched.decisions[0].memberNameSnapshot).toBe('Elder Joseph Smith');
      expect(fetched.decisions[0].memberRoleSnapshot).toBe('Treasurer');
    });
  });

  // 5. Post-Approval Change Detection & Amendment Workflow
  describe('Expense Fingerprint, Change Detection & Amendments', () => {
    it('detects when underlying expenses change after approval and requires an amendment without overwriting V1', () => {
      // Add committee member
      const member = addCommitteeMember({
        fullName: 'Pastor Gilbert',
        roleTitle: 'Chair',
        effectiveFrom: '2026-01-01'
      }, 'primary.admin@gracepraise.church').member;

      const txSheet = mockDb.getSheetByName('Transactions');
      txSheet.appendRow(SCHEMA_DEFINITIONS.Transactions.map(h => {
        if (h === 'transactionId') return 'TXN-AUG-01';
        if (h === 'transactionDate') return '2026-08-10';
        if (h === 'direction') return 'EXPENSE';
        if (h === 'accountingImpact') return 'EXPENSE';
        if (h === 'amount') return 300;
        if (h === 'payeeOrPayer') return 'Electric Co';
        return '';
      }));

      // Record original V1 approval
      const recRes = recordCommitteeApproval({
        periodKey: '2026-08',
        decisions: [{ memberId: member.memberId, decision: 'APPROVED' }]
      }, 'primary.admin@gracepraise.church');

      expect(recRes.approval.status).toBe('APPROVED');
      expect(recRes.approval.packetVersion).toBe(1);

      // Verify no changes initially
      const check1 = getMonthlyCommitteeApproval({ periodKey: '2026-08' });
      expect(check1.hasPacketChanged).toBe(false);
      expect(check1.amendmentRequired).toBe(false);

      // Simulate an expense modification (e.g. late adjustment or amount change)
      txSheet.appendRow(SCHEMA_DEFINITIONS.Transactions.map(h => {
        if (h === 'transactionId') return 'TXN-AUG-02';
        if (h === 'transactionDate') return '2026-08-12';
        if (h === 'direction') return 'EXPENSE';
        if (h === 'accountingImpact') return 'EXPENSE';
        if (h === 'amount') return 75;
        if (h === 'payeeOrPayer') return 'Water Dept';
        return '';
      }));

      // Check approval: MUST flag change and require amendment
      const check2 = getMonthlyCommitteeApproval({ periodKey: '2026-08' });
      expect(check2.hasPacketChanged).toBe(true);
      expect(check2.amendmentRequired).toBe(true);
      expect(check2.changeMessage).toContain('Underlying expenses have changed');

      // Create Amendment V2
      const amendRes = createCommitteeApprovalAmendment({
        periodKey: '2026-08',
        amendmentReason: 'Added late water bill invoice ()',
        decisions: [{ memberId: member.memberId, decision: 'APPROVED' }]
      }, 'primary.admin@gracepraise.church');

      expect(amendRes.success).toBe(true);
      expect(amendRes.approval.packetVersion).toBe(2);
      expect(amendRes.approval.amendmentReason).toBe('Added late water bill invoice ()');
      expect(amendRes.approval.totalRecognizedExpenses).toBe(375); // 300 + 75

      // Check history: Both V1 and V2 exist; V2 is latest
      const check3 = getMonthlyCommitteeApproval({ periodKey: '2026-08' });
      expect(check3.approval.packetVersion).toBe(2);
      expect(check3.history.length).toBe(2);
      expect(check3.history.find(h => h.packetVersion === 1).totalRecognizedExpenses).toBe(300);
      expect(check3.hasPacketChanged).toBe(false);
    });
  });

  // 6. Closed Period Safety & Monthly Close Integration
  describe('Closed Period Safety & Governance Separation', () => {
    it('records post-close governance approval without altering Monthly_Close or Monthly_Close_History', () => {
      // September 2026 is closed in mockDb
      const member = addCommitteeMember({
        fullName: 'Pastor Gilbert',
        roleTitle: 'Chair',
        effectiveFrom: '2026-01-01'
      }, 'primary.admin@gracepraise.church').member;

      const txSheet = mockDb.getSheetByName('Transactions');
      txSheet.appendRow(SCHEMA_DEFINITIONS.Transactions.map(h => {
        if (h === 'transactionId') return 'TXN-SEP-01';
        if (h === 'transactionDate') return '2026-09-15';
        if (h === 'direction') return 'EXPENSE';
        if (h === 'accountingImpact') return 'EXPENSE';
        if (h === 'amount') return 1200;
        return '';
      }));

      // Record committee approval for September
      const recRes = recordCommitteeApproval({
        periodKey: '2026-09',
        decisions: [{ memberId: member.memberId, decision: 'APPROVED' }]
      }, 'primary.admin@gracepraise.church');

      expect(recRes.success).toBe(true);

      // Verify Monthly_Close remains 100% untouched
      const closeSheet = mockDb.getSheetByName('Monthly_Close');
      const closeRows = closeSheet.getDataRange().getValues();
      expect(closeRows.length).toBe(2); // Headers + 1 closed row
      expect(closeRows[1][1]).toBe('2026-09');
      expect(closeRows[1][4]).toBe('Closed');
      expect(closeRows[1][18]).toBe(100); // health score unchanged

      // Verify Monthly_Close_History remains untouched
      const histSheet = mockDb.getSheetByName('Monthly_Close_History');
      expect(histSheet.getLastRow()).toBe(1); // Only headers
    });

    it('evaluates close readiness without blocking when committee approval policy is false', () => {
      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-08' });
      expect(readiness.committeeApprovalRequired).toBe(false);
      // Informational warning present
      expect(readiness.informational.some(i => i.includes('Committee approval'))).toBe(true);
      // Does not block close
      expect(readiness.blockingIssues.some(b => b.includes('Committee approval'))).toBe(false);
    });

    it('blocks close readiness when committee approval policy is true and unapproved', () => {
      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-08', committeeApprovalRequiredForClose: true });
      expect(readiness.committeeApprovalRequired).toBe(true);
      expect(readiness.blockingIssues.some(b => b.includes('Committee approval is required'))).toBe(true);
      expect(readiness.readyToClose).toBe(false);
    });
  });

  // 7. Role Authorization Policy
  describe('Role-Based Authorization Policy', () => {
    it('enforces authoritative permission rules across roles', () => {
      // Primary Admin can perform all committee operations
      expect(authorizeAction('getCommitteeMembers', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('addCommitteeMember', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('recordCommitteeApproval', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('overrideCommitteeApproval', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('createCommitteeApprovalAmendment', 'Primary Admin').authorized).toBe(true);

      // Finance Editor can view and record, but not manage members or override
      expect(authorizeAction('getCommitteeMembers', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('addCommitteeMember', 'Finance Editor').authorized).toBe(false);
      expect(authorizeAction('recordCommitteeApproval', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('overrideCommitteeApproval', 'Finance Editor').authorized).toBe(false);

      // Presbyter Read-Only can read approval packets but cannot mutate decisions
      expect(authorizeAction('getMonthlyCommitteeApproval', 'Presbyter Read-Only').authorized).toBe(true);
      expect(authorizeAction('recordCommitteeApproval', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('createCommitteeApprovalAmendment', 'Presbyter Read-Only').authorized).toBe(false);

      // Unknown user is denied
      expect(authorizeAction('getMonthlyCommitteeApproval', 'Unknown Role').authorized).toBe(false);
    });

    it('denies direct committee writes for Viewer and Presbyter identities', () => {
      expect(() => addCommitteeMember({ fullName: 'Blocked Viewer', roleTitle: 'Member' }, 'viewer@gracepraise.church'))
        .toThrow(/Unauthorized/);
      expect(() => addCommitteeMember({ fullName: 'Blocked Presbyter', roleTitle: 'Member' }, 'presbyter@socalnetwork.org'))
        .toThrow(/Unauthorized/);
    });

    it('rejects an unknown member ID before recording any approval rows', () => {
      addCommitteeMember({ fullName: 'Known Member', roleTitle: 'Treasurer', effectiveFrom: '2026-01-01' }, 'primary.admin@gracepraise.church');
      expect(() => recordCommitteeApproval({
        periodKey: '2026-08',
        decisions: [{ memberId: 'NOT-A-REAL-MEMBER', decision: 'APPROVED' }]
      }, 'finance.editor@gracepraise.church')).toThrow(/Unknown or ineligible committee member ID/);
      expect(mockDb.getSheetByName('Monthly_Committee_Approval').getLastRow()).toBe(1);
      expect(mockDb.getSheetByName('Committee_Approval_Decisions').getLastRow()).toBe(1);
    });

    it('rejects invalid decision enums and missing decisions', () => {
      const memRes = addCommitteeMember({ fullName: 'Valid Member', roleTitle: 'Secretary', effectiveFrom: '2026-01-01' }, 'primary.admin@gracepraise.church');
      const memId = memRes.member.memberId;

      // Invalid decision value
      expect(() => recordCommitteeApproval({
        periodKey: '2026-08',
        decisions: [{ memberId: memId, decision: 'INVALID_ENUM' }]
      }, 'primary.admin@gracepraise.church')).toThrow(/Must be one of: APPROVED/);

      // Missing/empty decision
      expect(() => recordCommitteeApproval({
        periodKey: '2026-08',
        decisions: [{ memberId: memId, decision: '' }]
      }, 'primary.admin@gracepraise.church')).toThrow(/Must be one of: APPROVED/);
    });

    it('enforces server-side Primary Admin role check for administrative override', () => {
      // Add 2 members
      const m1 = addCommitteeMember({ fullName: 'Member Alpha', roleTitle: 'Trustee', effectiveFrom: '2026-01-01' }, 'primary.admin@gracepraise.church').member.memberId;
      const m2 = addCommitteeMember({ fullName: 'Member Beta', roleTitle: 'Trustee', effectiveFrom: '2026-01-01' }, 'primary.admin@gracepraise.church').member.memberId;

      // Finance Editor attempts override when quorum not met (both returned)
      expect(() => recordCommitteeApproval({
        periodKey: '2026-08',
        overrideApplied: true,
        overrideReason: 'Unauthorized override attempt',
        decisions: [
          { memberId: m1, decision: 'RETURNED_FOR_CLARIFICATION' },
          { memberId: m2, decision: 'RETURNED_FOR_CLARIFICATION' }
        ]
      }, 'finance.editor@gracepraise.church')).toThrow(/Unauthorized/);

      // Primary Admin fails if overrideReason is empty
      expect(() => recordCommitteeApproval({
        periodKey: '2026-08',
        overrideApplied: true,
        overrideReason: '   ',
        decisions: [
          { memberId: m1, decision: 'RETURNED_FOR_CLARIFICATION' },
          { memberId: m2, decision: 'RETURNED_FOR_CLARIFICATION' }
        ]
      }, 'primary.admin@gracepraise.church')).toThrow(/Override requires a mandatory reason/);
    });
  });
});
