import React from 'react';
import TaxLetterLayout from '../components/tax/TaxLetterLayout';
import {
  ShieldCheck,
  CalendarCheck,
  FileCheck2,
  Settings as SettingsIcon,
  Lock
} from 'lucide-react';

// Core finance pages
export { default as Dashboard } from './FinanceDashboard';
export { default as Members } from './Members';
export { default as Contributions } from './Contributions';
export { default as Income } from './Contributions';
export { default as Expenses } from './Expenses';
export { default as Transactions } from './Transactions';
export { default as Reimbursements } from './Reimbursements';
export { default as ReceiptRegister } from './ReceiptRegister';
export { default as CheckDetails } from './CheckDetails';
export { default as CapitalProjects } from './CapitalProjects';
export { default as DocumentCenter } from './DocumentCenter';
export { default as Reconciliation } from './Reconciliation';

// Additional pages
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
      <span>Configuration is displayed here for governance visibility. Security-sensitive settings remain backend-controlled.</span>
    </div>
  </div>
);

// Audit and reporting pages
export { default as AuditCenter } from './AuditCenter';
export { default as MonthlyClose } from './MonthlyClose';
export { default as PresbyterReports } from './PresbyterReports';
export { default as Settings } from './Settings';

// Help and training pages
export { default as HelpCenter } from './HelpCenter';
export { default as HelpArticleView } from './HelpArticleView';

// Tax Letter Generator Page
export const Letters = () => <TaxLetterLayout />;
