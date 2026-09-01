import React from 'react';
import TaxLetterLayout from '../components/tax/TaxLetterLayout';
import {
  FileSpreadsheet,
  Receipt,
  CreditCard,
  CheckSquare,
  FolderGit2,
  ShieldCheck,
  CalendarCheck,
  FileCheck2,
  Settings as SettingsIcon,
  Lock
} from 'lucide-react';

// Export implemented existing pages
export { default as Dashboard } from './Dashboard';
export { default as Members } from './Members';
export { default as Contributions } from './Contributions';
export { default as Income } from './Contributions';
export { default as Expenses } from './Expenses';
export { default as AIReports } from './AIReports';
export { default as PastoralIntelligence } from './PastoralIntelligence';
export { default as OperationsCommandCenter } from './OperationsCommandCenter';
export { default as KingdomIntelligence } from './KingdomIntelligence';
export { default as GrantOpportunities } from './GrantOpportunities';

const PhaseCard = ({ icon: IconComponent, title, phase, subtitle, features }) => (
  <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'var(--mist-blue)',
        color: 'var(--slate-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {IconComponent && <IconComponent size={24} />}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '1.4rem', color: 'var(--slate-blue)', margin: 0 }}>{title}</h1>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--ivory)',
            border: '1px solid var(--gold)',
            color: 'var(--gold-dark)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {phase}
          </span>
        </div>
        <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{subtitle}</p>
      </div>
    </div>

    <div style={{
      background: '#FFFFFF',
      border: '1px solid var(--mist-blue-dark)',
      borderRadius: '10px',
      padding: '1.25rem',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
        Scope & Architecture Blueprint
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {features.map((feat, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>
            <span style={{ color: 'var(--gold)' }}>✦</span>
            <span>{feat}</span>
          </li>
        ))}
      </ul>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--warm-gray-light)' }}>
      <Lock size={14} />
      <span>Phase 0/1 security baseline and read-only foundation active. Schema writes will unlock upon Phase 2 rollout.</span>
    </div>
  </div>
);

export const Transactions = () => (
  <PhaseCard
    icon={FileSpreadsheet}
    title="Master Transactions"
    phase="Phase 2"
    subtitle="Unified financial ledger tracking all income, expenses, check disbursements, and transfers."
    features={[
      "Unified traceable transaction model (Offering, Donation, Expense, Reimbursement, Check, Transfer)",
      "Non-destructive historical adapters preserving existing Sheets data",
      "Fund-level and purpose-level traceability",
      "Directional income/expense flows with reconciliation state"
    ]}
  />
);

export const Reimbursements = () => (
  <PhaseCard
    icon={CreditCard}
    title="Reimbursements & Personal Card Accounting"
    phase="Phase 2"
    subtitle="Accurate tracking of church purchases made with personal cards and multi-allocation reimbursements."
    features={[
      "Many-to-many allocations: one reimbursement covering multiple purchases or vice-versa",
      "Preservation of purchase cost, reimbursed amount, and personally absorbed amounts",
      "Delayed and cross-month reimbursement support without artificial balance forcing",
      "Support for merchant refunds and card credits"
    ]}
  />
);

export const ReceiptRegister = () => (
  <PhaseCard
    icon={Receipt}
    title="Receipt Register"
    phase="Phase 2"
    subtitle="Central evidence register linked to private Google Drive storage and ledger transactions."
    features={[
      "Secure Google Drive document storage (receipts, invoices, screenshots, statements)",
      "Document metadata and Drive link storage in master Sheet",
      "Explicit match states: Unmatched, Pending Review, Matched",
      "Audit trail linking transactions to verifiable primary evidence"
    ]}
  />
);

export const CheckDetails = () => (
  <PhaseCard
    icon={CheckSquare}
    title="Check Details"
    phase="Phase 2"
    subtitle="Complete check disbursement records, payee details, and evidence linking."
    features={[
      "Check number, date, payee, amount, purpose, and linked transaction",
      "Check image / voucher attachment in private Google Drive",
      "Audit verification for check numbers without payee/purpose documentation"
    ]}
  />
);

export const CapitalProjects = () => (
  <PhaseCard
    icon={FolderGit2}
    title="Capital Projects"
    phase="Phase 2"
    subtitle="Designated funds, project budgets, donor commitments, and capital expenditure tracking."
    features={[
      "Project budget, designated donations received, expenses paid, and commitments",
      "Remaining designated fund balance calculations",
      "Project status and financial milestone transparency"
    ]}
  />
);

export const AuditCenter = () => (
  <PhaseCard
    icon={ShieldCheck}
    title="Audit Center"
    phase="Phase 3"
    subtitle="Deterministic rule-based audit engine detecting documentation gaps and reconciliation differences."
    features={[
      "Rule-based detection for missing receipts, missing payees, unmatched reimbursements, and duplicates",
      "Deterministic Audit Health Score with transparent contributor breakdown",
      "Direct navigation from audit issues to affected transactions and Drive evidence"
    ]}
  />
);

export const MonthlyClose = () => (
  <PhaseCard
    icon={CalendarCheck}
    title="Monthly Close"
    phase="Phase 4"
    subtitle="Formal 10-step monthly close checklist, period locks, and audited post-close amendments."
    features={[
      "Structured reconciliation checklist (Bank, Cards, Receipts, Checks, Reimbursements, Funds)",
      "Formal MONTH CLOSED status locking period from accidental modifications",
      "Append-only change log recording user, reason, old value, and new value for any post-close edit"
    ]}
  />
);

export const PresbyterReports = () => (
  <PhaseCard
    icon={FileCheck2}
    title="Presbyter Reports"
    phase="Phase 4"
    subtitle="Polished, privacy-conscious PDF reports for church oversight and presbyter review."
    features={[
      "Executive summary, income/expense distributions, Sunday offering, and capital projects",
      "Summary and Detailed views with optional audit appendix",
      "Automated PDF generation and private save to Google Drive"
    ]}
  />
);

export const Settings = () => (
  <PhaseCard
    icon={SettingsIcon}
    title="System Settings & Governance"
    phase="Phase 0/1"
    subtitle="Security configuration, authorized user management, and spreadsheet environment settings."
    features={[
      "Server-side role assignments (Primary Admin, Backup Admin, Finance Editor, Viewer, Presbyter)",
      "Google Apps Script environment configuration (Production / Sandbox)",
      "Script Properties and Google OAuth Client management"
    ]}
  />
);

// Tax Letter Generator Page
export const Letters = () => <TaxLetterLayout />;
