import React from 'react';
import TaxLetterLayout from '../components/tax/TaxLetterLayout';

// Export implemented pages
export { default as Dashboard } from './Dashboard';
export { default as Members } from './Members';
export { default as Contributions } from './Contributions';
export { default as Expenses } from './Expenses';
export { default as AIReports } from './AIReports';
export { default as PastoralIntelligence } from './PastoralIntelligence';
export { default as OperationsCommandCenter } from './OperationsCommandCenter';
export { default as KingdomIntelligence } from './KingdomIntelligence';
export { default as GrantOpportunities } from './GrantOpportunities';

// Placeholders for remaining modules
const PagePlaceholder = ({ title }) => (
    <div className="glass-panel" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Module content coming soon...</p>
    </div>
);

// Tax Letter Generator Page - Premium Smart UI
export const Letters = () => <TaxLetterLayout />;

export const Settings = () => <PagePlaceholder title="System Settings" />;
