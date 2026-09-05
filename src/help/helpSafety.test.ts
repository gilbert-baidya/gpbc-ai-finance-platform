import { describe, it, expect } from 'vitest';
import {
  MODULE_GUIDES,
  MONTHLY_WORKFLOW_STEPS,
  ROLE_GUIDES,
  GLOSSARY_TERMS,
  TROUBLESHOOTING_GUIDES,
  WHAT_NEXT_SCENARIOS,
  QUICK_START_STEPS,
  ROUTE_TO_HELP_MAP
} from './helpRegistry';

describe('Help & Training Center — Content Safety, Accuracy & Invariants', () => {
  it('1. Zero Sensitive Financial or Infrastructure Data in Help Content', () => {
    const allContentStrings = [
      ...MODULE_GUIDES.flatMap(m => [m.title, m.summary, m.purpose, ...m.quickSteps, ...m.commonMistakes, ...m.sections.map(s => s.content)]),
      ...MONTHLY_WORKFLOW_STEPS.flatMap(w => [w.title, w.action, w.purpose, w.proTip]),
      ...GLOSSARY_TERMS.flatMap(g => [g.term, g.definition, g.churchContext]),
      ...TROUBLESHOOTING_GUIDES.flatMap(t => [t.title, t.problem, ...t.possibleReasons, ...t.safeActionSteps, t.whenToContactAdmin]),
      ...WHAT_NEXT_SCENARIOS.flatMap(wn => [wn.triggerQuestion, wn.shortAnswer, ...wn.steps])
    ];

    const forbiddenPatterns = [
      /AKIA[0-9A-Z]{16}/, // AWS Key
      /AIza[0-9A-Za-z-_]{35}/, // Google API Key
      /client_secret/,
      /[0-9]{9,12}/, // Bank account numbers
      /1[A-Za-z0-9_-]{32,}/, // Google Drive File ID pattern
      /AKfycb[0-9A-Za-z_-]{20,}/ // Google Apps Script Deployment ID
    ];

    allContentStrings.forEach(text => {
      forbiddenPatterns.forEach(pattern => {
        expect(text).not.toMatch(pattern);
      });
    });
  });

  it('2. Reimbursement Math Invariant strictly adhered to', () => {
    // Net Covered = Allocated + Absorbed + Refund Credit Adjustment
    // Remaining Balance = max(0, Purchase Amount - Net Covered)
    const reimbGuide = MODULE_GUIDES.find(m => m.id === 'reimbursements');
    expect(reimbGuide).toBeDefined();

    const sectionsText = reimbGuide?.sections.map(s => s.content).join(' ') || '';
    expect(sectionsText).toContain('netCovered');
    expect(sectionsText).toContain('remainingBalance');
    expect(sectionsText).toContain('allocatedAmount');
    expect(sectionsText).toContain('personallyAbsorbedAmount');
    expect(sectionsText).toContain('refundCreditAdjustment');

    // Verify training scenario numbers match formula exactly:
    // Purchase = $145, Allocated = $110, Absorbed = $20, Refund = $15 => Net Covered = $145, Balance = $0
    const refundGuide = MODULE_GUIDES.find(m => m.id === 'refunds-credits');
    expect(refundGuide).toBeDefined();
    const refundText = refundGuide?.sections.map(s => s.content).join(' ') || '';
    expect(refundText).toContain('$145.00');
    expect(refundText).toContain('$110.00');
    expect(refundText).toContain('$20.00');
    expect(refundText).toContain('$15.00');
    expect(refundText).toContain('$0.00');
  });

  it('3. Audit Health Score Formula and Status Semantics accurately documented', () => {
    const auditGuide = MODULE_GUIDES.find(m => m.id === 'audit-center');
    expect(auditGuide).toBeDefined();

    const sectionsText = auditGuide?.sections.map(s => s.content).join(' ') || '';
    // Baseline 100
    expect(sectionsText).toContain('100');
    // Severity deductions: 15 for Critical, 8 for High, 3 for Medium, 1 for Low
    expect(sectionsText).toContain('15');
    expect(sectionsText).toContain('8');
    expect(sectionsText).toContain('3');
    expect(sectionsText).toContain('1');
    // Verified that 'Reviewed' remains in unresolvedStatuses and does not immediately cure score deduction
    expect(sectionsText).toContain('Reviewed');
    expect(sectionsText).toContain('unresolvedStatuses');
  });

  it('4. Reconciliation explicitly states historical transactions are not automatically reconciled', () => {
    const reconGuide = MODULE_GUIDES.find(m => m.id === 'reconciliation');
    expect(reconGuide).toBeDefined();

    const combined = [
      reconGuide?.summary,
      reconGuide?.purpose,
      reconGuide?.commonMistakes.join(' '),
      reconGuide?.sections.map(s => s.content).join(' ')
    ].join(' ');

    expect(combined.toLowerCase()).toContain('not automatically reconciled');
  });

  it('5. Capital Projects clearly separates Designated Funding Position from Budget Remaining', () => {
    const cpGuide = MODULE_GUIDES.find(m => m.id === 'capital-projects');
    expect(cpGuide).toBeDefined();

    const combined = [
      cpGuide?.summary,
      cpGuide?.purpose,
      cpGuide?.sections.map(s => s.content).join(' ')
    ].join(' ');

    expect(combined).toContain('Designated Funding Position');
    expect(combined).toContain('Approved Budget');
    expect(combined).toContain('Funding Gap');
    expect(combined).toContain('Not Set');
  });

  it('6. All 15 required modules and special guides are documented', () => {
    const expectedModules = [
      'dashboard',
      'transactions',
      'income',
      'expenses',
      'reimbursements',
      'refunds-credits',
      'documents',
      'receipts',
      'checks',
      'capital-projects',
      'reconciliation',
      'audit-center',
      'monthly-close',
      'presbyter-reports',
      'settings',
      'user-roles'
    ];

    expectedModules.forEach(moduleId => {
      const guide = MODULE_GUIDES.find(m => m.id === moduleId);
      expect(guide).toBeDefined();
    });
  });

  it('7. Route mapping matches all standard frontend routes', () => {
    expect(ROUTE_TO_HELP_MAP['/dashboard']).toBe('dashboard');
    expect(ROUTE_TO_HELP_MAP['/transactions']).toBe('transactions');
    expect(ROUTE_TO_HELP_MAP['/income']).toBe('income');
    expect(ROUTE_TO_HELP_MAP['/expenses']).toBe('expenses');
    expect(ROUTE_TO_HELP_MAP['/reimbursements']).toBe('reimbursements');
    expect(ROUTE_TO_HELP_MAP['/documents']).toBe('documents');
    expect(ROUTE_TO_HELP_MAP['/receipts']).toBe('receipts');
    expect(ROUTE_TO_HELP_MAP['/checks']).toBe('checks');
    expect(ROUTE_TO_HELP_MAP['/capital-projects']).toBe('capital-projects');
    expect(ROUTE_TO_HELP_MAP['/reconciliation']).toBe('reconciliation');
    expect(ROUTE_TO_HELP_MAP['/audit']).toBe('audit-center');
    expect(ROUTE_TO_HELP_MAP['/monthly-close']).toBe('monthly-close');
    expect(ROUTE_TO_HELP_MAP['/presbyter-reports']).toBe('presbyter-reports');
    expect(ROUTE_TO_HELP_MAP['/settings']).toBe('settings');
  });

  it('8. All 5 user roles are documented in Role Guides', () => {
    expect(ROLE_GUIDES['Primary Admin']).toBeDefined();
    expect(ROLE_GUIDES['Backup Admin']).toBeDefined();
    expect(ROLE_GUIDES['Finance Editor']).toBeDefined();
    expect(ROLE_GUIDES['Viewer']).toBeDefined();
    expect(ROLE_GUIDES['Presbyter Read-Only']).toBeDefined();
  });

  it('9. 10 Monthly Workflow steps strictly follow canonical sequence', () => {
    expect(MONTHLY_WORKFLOW_STEPS).toHaveLength(10);
    const expectedSequence = [
      { step: 1, title: 'Record Income' },
      { step: 2, title: 'Record Recognized Expenses' },
      { step: 3, title: 'Attach Receipts / Supporting Documents' },
      { step: 4, title: 'Review Reimbursements' },
      { step: 5, title: 'Review Capital Projects / Designated Funds' },
      { step: 6, title: 'Reconcile Records' },
      { step: 7, title: 'Resolve Audit Issues' },
      { step: 8, title: 'Review Monthly Summary' },
      { step: 9, title: 'Close the Month' },
      { step: 10, title: 'Review / Generate Presbyter Reports' }
    ];

    MONTHLY_WORKFLOW_STEPS.forEach((step, idx) => {
      expect(step.stepNumber).toBe(expectedSequence[idx].step);
      expect(step.title).toBe(expectedSequence[idx].title);
    });
  });

  it('10. 5-Minute Quick Start has 5 chronological minutes', () => {
    expect(QUICK_START_STEPS).toHaveLength(5);
    QUICK_START_STEPS.forEach((step, idx) => {
      expect(step.minute).toBe(idx + 1);
    });
  });

  it('11. Content Guard: Zero forbidden developer jargon or compliance overclaims', () => {
    const allUserFacingStrings = [
      ...MODULE_GUIDES.flatMap(m => [
        m.title,
        m.summary,
        m.purpose,
        ...m.quickSteps,
        ...m.commonMistakes,
        ...m.sections.map(s => `${s.title} ${s.content}`),
        ...(m.recommendedWorkflow || []),
        ...(m.keyFields || []).map(f => `${f.fieldName} ${f.description}`),
        ...(m.statusMeanings || []).map(sm => `${sm.status} ${sm.description}`)
      ]),
      ...MONTHLY_WORKFLOW_STEPS.flatMap(w => [
        w.title,
        w.action,
        w.purpose,
        w.proTip,
        ...w.prerequisites,
        ...w.completionChecklist
      ]),
      ...ROLE_GUIDES ? Object.values(ROLE_GUIDES).flatMap(r => [
        r.title,
        r.summary,
        ...r.responsibilities,
        ...r.monthlyRoutine,
        ...r.keySafetyReminders
      ]) : [],
      ...GLOSSARY_TERMS.flatMap(g => [g.term, g.definition, g.churchContext, g.formulaOrRule || '']),
      ...TROUBLESHOOTING_GUIDES.flatMap(t => [
        t.title,
        t.problem,
        ...t.possibleReasons,
        ...t.safeActionSteps,
        t.whenToContactAdmin
      ]),
      ...WHAT_NEXT_SCENARIOS.flatMap(wn => [
        wn.triggerQuestion,
        wn.shortAnswer,
        wn.ruleSummary || '',
        ...wn.steps
      ]),
      ...QUICK_START_STEPS.flatMap(qs => [qs.title, qs.keyTakeaway, ...qs.instructions])
    ];

    const forbiddenPhrases = [
      'GPBC_PRODUCTION_WRITES_ENABLED',
      'GOOGLE_CLIENT_ID',
      'Production Writes Guard',
      'server-side safety mechanism',
      'Certified Net Position',
      'Apps Script',
      'Script Properties',
      'OAuth Client',
      'spreadsheet ID',
      'Drive root ID',
      'Senior Bishop',
      'Head Accountant',
      'Associate Treasurer',
      'GAAP-compliant',
      'IRS compliance',
      'guarantees compliance',
      'fiduciary authority'
    ];

    allUserFacingStrings.forEach(text => {
      forbiddenPhrases.forEach(phrase => {
        expect(text.toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    });
  });

  it('12. Invariant Assertion: Exact phrase on historical reconciliation', () => {
    const exactPhrase = 'Historical transactions are NOT automatically reconciled simply because they are old.';
    
    // Must be found in reconciliation guide
    const reconGuide = MODULE_GUIDES.find(m => m.id === 'reconciliation');
    expect(reconGuide).toBeDefined();
    const reconContent = reconGuide?.sections.map(s => s.content).join(' ') || '';
    expect(reconContent).toContain(exactPhrase);

    // Must also be reinforced in workflow guide
    const workflowStep6 = MONTHLY_WORKFLOW_STEPS.find(s => s.stepNumber === 6);
    expect(workflowStep6?.proTip).toContain(exactPhrase);
  });

  it('13. Canonical role titles strictly maintained without invented church hierarchy', () => {
    const validRoles = [
      'Primary Admin',
      'Backup Admin',
      'Finance Editor',
      'Viewer',
      'Presbyter Read-Only'
    ];

    const roleKeys = Object.keys(ROLE_GUIDES);
    expect(roleKeys.sort()).toEqual(validRoles.sort());

    // Verify each role guide uses canonical role name
    roleKeys.forEach(key => {
      expect(ROLE_GUIDES[key].role).toBe(key);
    });
  });

  it('14. Refund example wording preserves values and non-contradictory expense treatment', () => {
    const refundGuide = MODULE_GUIDES.find(m => m.id === 'refunds-credits');
    expect(refundGuide).toBeDefined();
    const sectionText = refundGuide?.sections.find(s => s.id === 'fictional-training-example')?.content || '';
    
    expect(sectionText).toContain('The original purchase record is $145.00.');
    expect(sectionText).toContain('The $15.00 merchant refund is captured as a Refund Credit Adjustment, reducing the remaining amount the church must cover.');
    expect(sectionText).toContain('The $110 payout and $20 personally absorbed amount complete the settlement. No duplicate expense or donation income should be created.');
    expect(sectionText).not.toContain('recognized exactly $145.00 in expenses (adjusted by the return)');
  });

  it('15. Financial Editing Safeguard is documented without exposing developer architecture', () => {
    const safeguardTerm = GLOSSARY_TERMS.find(g => g.term === 'Financial Editing Safeguard');
    expect(safeguardTerm).toBeDefined();
    expect(safeguardTerm?.definition).toContain('A protection that may temporarily prevent financial changes during maintenance, controlled release, or other protected periods.');
    
    // Verify old internal term is completely absent
    const oldTerm = GLOSSARY_TERMS.find(g => g.term.includes('Production Writes Guard'));
    expect(oldTerm).toBeUndefined();
  });

  it('16. Presbyter help prose does not imply external certification or CPA audits', () => {
    const presbyterGuide = ROLE_GUIDES['Presbyter Read-Only'];
    expect(presbyterGuide).toBeDefined();
    const presbyterAllText = [
      presbyterGuide.title,
      presbyterGuide.summary,
      ...presbyterGuide.responsibilities,
      ...presbyterGuide.monthlyRoutine,
      ...presbyterGuide.keySafetyReminders
    ].join(' ');

    expect(presbyterAllText).not.toContain('certified monthly net positions');
    expect(presbyterAllText).not.toContain('certified monthly financial summary');
    expect(presbyterAllText).not.toContain('closing certifications');
    expect(presbyterAllText).toContain('closed-period financial summaries');
  });
});

