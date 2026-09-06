/**
 * GPBC Finance Desk — Safe Local Mobile UI Test Fixtures
 * 
 * Synthetic, read-only realistic test data for mobile UI visual testing.
 * All persistent writes are prohibited in test mode.
 */

import { MOBILE_TEST_USER } from '../auth/mobileTestGuard';

export const MOCK_TRANSACTIONS = [
  {
    transactionId: 'TXN-2026-001',
    date: '2026-03-01',
    transactionDate: '2026-03-01',
    transactionType: 'TITHE',
    direction: 'INCOME',
    amount: 1250.00,
    payeeOrPayer: 'John Doe',
    description: 'Sunday Tithe & Offering',
    category: 'Tithes & Offerings',
    fundId: 'GENERAL',
    paymentMethod: 'CHECK',
    checkNumber: '1042',
    reconciliationStatus: 'RECONCILED',
    receiptStatus: 'NOT_REQUIRED'
  },
  {
    transactionId: 'TXN-2026-002',
    date: '2026-03-02',
    transactionDate: '2026-03-02',
    transactionType: 'FACILITY_UTILITIES',
    direction: 'EXPENSE',
    amount: 384.50,
    payeeOrPayer: 'Pacific Gas & Electric',
    description: 'Monthly Sanctuary Electric & Gas',
    category: 'Utilities',
    fundId: 'GENERAL',
    paymentMethod: 'ACH',
    reconciliationStatus: 'RECONCILED',
    receiptStatus: 'ATTACHED',
    receiptId: 'DOC-2026-001'
  },
  {
    transactionId: 'TXN-2026-003',
    date: '2026-03-03',
    transactionDate: '2026-03-03',
    transactionType: 'MINISTRY_SUPPLIES',
    direction: 'EXPENSE',
    amount: 145.20,
    payeeOrPayer: 'Office Depot',
    description: 'Children Ministry Craft Materials',
    category: 'Ministry Supplies',
    fundId: 'GENERAL',
    paymentMethod: 'PERSONAL_CARD',
    personalPurchase: true,
    claimantName: 'Sarah Jenkins',
    reconciliationStatus: 'PENDING_MATCH',
    receiptStatus: 'ATTACHED',
    receiptId: 'DOC-2026-002'
  },
  {
    transactionId: 'TXN-2026-004',
    date: '2026-03-04',
    transactionDate: '2026-03-04',
    transactionType: 'CAPITAL_PROJECT',
    direction: 'INCOME',
    amount: 5000.00,
    payeeOrPayer: 'Grace Community Foundation',
    description: 'Sanctuary Audio Upgrade Grant',
    category: 'Capital Grants',
    fundId: 'CAPITAL',
    capitalProjectId: 'CP-2026-01',
    paymentMethod: 'WIRE',
    reconciliationStatus: 'RECONCILED',
    receiptStatus: 'NOT_REQUIRED'
  },
  {
    transactionId: 'TXN-2026-005',
    date: '2026-03-05',
    transactionDate: '2026-03-05',
    transactionType: 'HONORARIUM',
    direction: 'EXPENSE',
    amount: 300.00,
    payeeOrPayer: 'Pastor David Lee',
    description: 'Guest Speaker Honorarium',
    category: 'Honorariums',
    fundId: 'GENERAL',
    paymentMethod: 'CHECK',
    checkNumber: '1043',
    reconciliationStatus: 'RECONCILED',
    receiptStatus: 'ATTACHED',
    receiptId: 'DOC-2026-003'
  }
];

export const MOCK_REIMBURSEMENTS = [
  {
    reimbursementId: 'RMB-2026-001',
    reimbursementDate: '2026-03-03',
    claimantName: 'Sarah Jenkins',
    claimantEmail: 'sarah.jenkins@gracepraise.church',
    totalPurchaseAmount: 145.20,
    totalReimbursedAmount: 145.20,
    totalPersonallyAbsorbed: 0.00,
    paymentMethod: 'CHECK',
    checkNumber: '1044',
    status: 'APPROVED',
    notes: 'Sunday School Craft Kits',
    allocations: [
      {
        purchaseTransactionId: 'TXN-2026-003',
        allocatedAmount: 145.20,
        personallyAbsorbedAmount: 0.00,
        notes: 'Full allocation'
      }
    ]
  },
  {
    reimbursementId: 'RMB-2026-002',
    reimbursementDate: '2026-03-04',
    claimantName: 'Marcus Wong',
    claimantEmail: 'marcus.wong@gracepraise.church',
    totalPurchaseAmount: 89.95,
    totalReimbursedAmount: 89.95,
    totalPersonallyAbsorbed: 0.00,
    paymentMethod: 'ACH',
    status: 'PENDING_REVIEW',
    notes: 'Worship Team Cable Replacements',
    allocations: []
  }
];

export const MOCK_DOCUMENTS = [
  {
    documentId: 'DOC-2026-001',
    originalFileName: 'PGE_March_Bill.pdf',
    storedFileName: 'GPBC_EXP_20260302_PGE.pdf',
    fileType: 'application/pdf',
    documentType: 'UTILITY_BILL',
    fileSize: 245000,
    uploadTimestamp: '2026-03-02T10:15:00Z',
    uploaderEmail: 'finance@gracepraise.church',
    driveFileId: 'mock-drive-id-1',
    driveFileUrl: '#',
    status: 'LINKED',
    relatedTransactionId: 'TXN-2026-002',
    merchant: 'Pacific Gas & Electric',
    amount: 384.50,
    ocrConfidence: 0.98
  },
  {
    documentId: 'DOC-2026-002',
    originalFileName: 'OfficeDepot_Receipt.jpg',
    storedFileName: 'GPBC_EXP_20260303_OfficeDepot.jpg',
    fileType: 'image/jpeg',
    documentType: 'RECEIPT',
    fileSize: 185000,
    uploadTimestamp: '2026-03-03T14:20:00Z',
    uploaderEmail: 'sarah.jenkins@gracepraise.church',
    driveFileId: 'mock-drive-id-2',
    driveFileUrl: '#',
    status: 'LINKED',
    relatedTransactionId: 'TXN-2026-003',
    relatedReimbursementId: 'RMB-2026-001',
    merchant: 'Office Depot',
    amount: 145.20,
    ocrConfidence: 0.95
  }
];

export const MOCK_CAPITAL_PROJECTS = [
  {
    projectId: 'CP-2026-01',
    projectName: 'Sanctuary Audio & Media Upgrade',
    status: 'IN_PROGRESS',
    approvedBudget: 15000.00,
    designatedDonationsReceived: 9500.00,
    otherFunding: 2000.00,
    actualExpenses: 7420.00,
    pendingCommitments: 1200.00,
    netBalance: 4080.00,
    notes: 'New digital mixing console, line array monitors, wireless microphones'
  },
  {
    projectId: 'CP-2026-02',
    projectName: 'Fellowship Hall Roof Repair',
    status: 'PLANNING',
    approvedBudget: 25000.00,
    designatedDonationsReceived: 18000.00,
    otherFunding: 0.00,
    actualExpenses: 1200.00,
    pendingCommitments: 0.00,
    netBalance: 16800.00,
    notes: 'Contractor bidding completed; awaiting dry season.'
  }
];

export const MOCK_AUDIT_ISSUES = [
  {
    auditIssueId: 'AUD-2026-001',
    ruleId: 'RULE_07_EXPENSE_WITHOUT_RECEIPT',
    severity: 'LOW',
    status: 'OPEN',
    title: 'Receipt Pending for Worship Supplies',
    description: 'Transaction TXN-2026-003 has expense over $75 requiring an itemized receipt.',
    detectedAt: '2026-03-04T08:00:00Z',
    assignedTo: 'Marcus Wong',
    relatedTransactionId: 'TXN-2026-003'
  }
];

export const MOCK_DASHBOARD_SUMMARY = {
  totalIncome: 14250.00,
  totalExpenses: 4850.20,
  netCashFlow: 9399.80,
  sundayOffering: 6450.00,
  reimbursementsPending: 89.95,
  auditHealthScore: 98,
  bankBalance: 48920.50,
  activeProjectsCount: 2,
  reconciliationStatus: {
    reconciledCount: 24,
    pendingCount: 2,
    flaggedCount: 0
  },
  recentTransactions: MOCK_TRANSACTIONS,
  monthlyTrend: [
    { month: 'Oct 2025', income: 12100, expenses: 4300 },
    { month: 'Nov 2025', income: 13400, expenses: 5100 },
    { month: 'Dec 2025', income: 19800, expenses: 6200 },
    { month: 'Jan 2026', income: 11500, expenses: 4100 },
    { month: 'Feb 2026', income: 13200, expenses: 4700 },
    { month: 'Mar 2026', income: 14250, expenses: 4850 }
  ]
};

export const MOCK_RECONCILIATION_SUMMARY = {
  totalStaged: 28,
  reconciledCount: 26,
  pendingMatchCount: 2,
  flaggedCount: 0,
  totalReconciledAmount: 18450.00,
  unmatchedAmount: 235.15,
  status: 'IN_PROGRESS'
};

export const MOCK_MEMBERS = [
  { id: 'MEM-001', name: 'John Doe', email: 'john.doe@example.com', phone: '(555) 019-2834', envelopeNumber: '101', status: 'ACTIVE' },
  { id: 'MEM-002', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '(555) 019-5821', envelopeNumber: '102', status: 'ACTIVE' },
  { id: 'MEM-003', name: 'Marcus Wong', email: 'marcus.w@example.com', phone: '(555) 019-9942', envelopeNumber: '103', status: 'ACTIVE' }
];

export function getMockFixture(action: string, payload: Record<string, unknown> = {}): Record<string, unknown> {
  switch (action) {
    case 'verifySession':
      return { success: true, user: MOBILE_TEST_USER };

    case 'getDashboardSummary':
    case 'getMonthlyData':
      return {
        success: true,
        summary: MOCK_DASHBOARD_SUMMARY,
        ...MOCK_DASHBOARD_SUMMARY
      };

    case 'getTransactions':
      return {
        success: true,
        transactions: MOCK_TRANSACTIONS,
        totalCount: MOCK_TRANSACTIONS.length
      };

    case 'getIncomeDetail':
    case 'getContributions':
      return {
        success: true,
        incomeEntries: MOCK_TRANSACTIONS.filter(t => t.direction === 'INCOME'),
        contributions: MOCK_TRANSACTIONS.filter(t => t.direction === 'INCOME'),
        count: MOCK_TRANSACTIONS.filter(t => t.direction === 'INCOME').length
      };

    case 'getExpenses':
      return {
        success: true,
        expenses: MOCK_TRANSACTIONS.filter(t => t.direction === 'EXPENSE'),
        count: MOCK_TRANSACTIONS.filter(t => t.direction === 'EXPENSE').length
      };

    case 'getReimbursements':
      return {
        success: true,
        reimbursements: MOCK_REIMBURSEMENTS,
        count: MOCK_REIMBURSEMENTS.length
      };

    case 'getReceipts':
      return {
        success: true,
        receipts: [
          {
            receiptId: 'RCP-2026-001',
            receiptDate: '2026-03-02',
            merchant: 'Pacific Gas & Electric',
            amount: 384.50,
            matchedTransactionId: 'TXN-2026-002',
            driveUrl: '#'
          },
          {
            receiptId: 'RCP-2026-002',
            receiptDate: '2026-03-03',
            merchant: 'Office Depot',
            amount: 145.20,
            matchedTransactionId: 'TXN-2026-003',
            driveUrl: '#'
          }
        ],
        count: 2
      };

    case 'getCheckDetails':
      return {
        success: true,
        checks: [
          { checkId: 'CHK-001', checkNumber: '1042', checkDate: '2026-03-01', amount: 1250.00, payee: 'GPBC General Fund', purpose: 'Offering deposit' },
          { checkId: 'CHK-002', checkNumber: '1043', checkDate: '2026-03-05', amount: 300.00, payee: 'Pastor David Lee', purpose: 'Guest Speaker Honorarium' },
          { checkId: 'CHK-003', checkNumber: '1044', checkDate: '2026-03-03', amount: 145.20, payee: 'Sarah Jenkins', purpose: 'Reimbursement' }
        ],
        count: 3
      };

    case 'getCapitalProjects':
      return {
        success: true,
        projects: MOCK_CAPITAL_PROJECTS
      };

    case 'getDesignatedFundsSummary':
      return {
        success: true,
        funds: [
          { fundId: 'GENERAL', totalIncome: 12000.00, totalExpenses: 4850.20, netBalance: 7149.80 },
          { fundId: 'BUILDING', totalIncome: 5000.00, totalExpenses: 1200.00, netBalance: 3800.00 },
          { fundId: 'MISSIONS', totalIncome: 1500.00, totalExpenses: 1000.00, netBalance: 500.00 }
        ]
      };

    case 'getDocumentRegister':
    case 'getDocuments':
      return {
        success: true,
        documents: MOCK_DOCUMENTS,
        count: MOCK_DOCUMENTS.length
      };

    case 'getReconciliationRecords':
      return {
        success: true,
        count: MOCK_TRANSACTIONS.length,
        summary: MOCK_RECONCILIATION_SUMMARY,
        records: MOCK_TRANSACTIONS.map((t, idx) => ({
          reconciliationId: `REC-${idx + 1}`,
          transactionId: t.transactionId,
          periodKey: '2026-03',
          transactionDate: t.transactionDate,
          direction: t.direction,
          amount: t.amount,
          reconciledAmount: t.amount,
          payeeOrPayer: t.payeeOrPayer,
          category: t.category,
          paymentMethod: t.paymentMethod,
          checkNumber: t.checkNumber,
          receiptStatus: t.receiptStatus,
          reconciliationStatus: t.reconciliationStatus,
          matchedBankLineId: t.reconciliationStatus === 'RECONCILED' ? `STG-${idx + 1}` : undefined
        }))
      };

    case 'getAuditIssues':
      return {
        success: true,
        count: MOCK_AUDIT_ISSUES.length,
        issues: MOCK_AUDIT_ISSUES
      };

    case 'getAuditSummary':
      return {
        success: true,
        calculated: true,
        calculatedAt: new Date().toISOString(),
        healthScore: {
          overallScore: 98,
          grade: 'A+',
          checksPassed: 10,
          checksTotal: 11,
          deductions: [
            { ruleId: 'RULE_07', pointsDeducted: 2, description: '1 missing receipt under review' }
          ]
        }
      };

    case 'getMonthlyClose':
      return {
        success: true,
        periodKey: String(payload.periodKey || '2026-03'),
        closeRecord: {
          periodKey: '2026-02',
          status: 'CLOSED',
          closedBy: 'admin@gracepraise.church',
          closedAt: '2026-03-01T12:00:00Z',
          financialSummarySnapshot: {
            totalIncome: 13200,
            totalExpenses: 4700,
            netPosition: 8500
          }
        },
        closeRecords: [
          { periodKey: '2026-01', status: 'CLOSED', closedBy: 'admin@gracepraise.church', closedAt: '2026-02-01T12:00:00Z' },
          { periodKey: '2026-02', status: 'CLOSED', closedBy: 'admin@gracepraise.church', closedAt: '2026-03-01T12:00:00Z' },
          { periodKey: '2026-03', status: 'OPEN' }
        ]
      };

    case 'getMonthlyCloseReadiness':
      return {
        success: true,
        ready: true,
        blockers: [],
        warnings: [],
        metrics: {
          unreconciledTransactions: 2,
          missingReceipts: 1,
          pendingReimbursements: 1
        }
      };

    case 'getMonthEndReportPackage':
      return {
        success: true,
        periodKey: String(payload.periodKey || '2026-03'),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        generatedAt: new Date().toISOString(),
        churchInfo: {
          name: 'Grace and Praise Bangladeshi Church',
          ein: 'XX-XXXXXXX',
          address: 'San Bernardino, California'
        },
        closeStatus: 'OPEN',
        closedBy: '',
        closedAt: '',
        financialSummary: {
          totalIncome: 14250.00,
          totalRecognizedExpenses: 4850.20,
          netPosition: 9399.80,
          sundayOfferingTotal: 6450.00,
          auditHealthScore: 98
        },
        sundayOfferingSummary: {
          totalSundayOffering: 6450.00,
          count: 4,
          offerings: [
            { date: '2026-03-01', payer: 'Congregation', amount: 1250.00, paymentMethod: 'CHECK/CASH' }
          ]
        },
        reimbursementSummary: {
          count: 2,
          reimbursements: MOCK_REIMBURSEMENTS
        },
        checkSummary: {
          count: 3,
          checks: []
        },
        capitalProjectSummary: {
          projects: MOCK_CAPITAL_PROJECTS
        },
        reconciliationSummary: MOCK_RECONCILIATION_SUMMARY,
        postCloseAdditionsCount: 0,
        postCloseDocuments: [],
        auditFindingsCount: 1,
        auditFindings: MOCK_AUDIT_ISSUES
      };

    case 'getProductionReadinessSummary':
      return {
        success: true,
        productionWritesDisarmed: true,
        sandboxConnected: true,
        activeDeployVersion: 'Version 8 (Phase 1 Code Released)'
      };

    case 'getMembers':
      return {
        success: true,
        members: MOCK_MEMBERS,
        count: MOCK_MEMBERS.length
      };

    case 'getReconciliationCandidates':
      return {
        success: true,
        count: 0,
        candidates: []
      };

    default:
      return {
        success: true,
        data: [],
        message: 'Mock response for ' + action
      };
  }
}
