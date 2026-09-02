import React from 'react';
import { CloudOff } from 'lucide-react';

export default function FinanceDataState({ title = 'Live finance data unavailable', description = 'Connect the GPBC finance sandbox to view live results.', action = null }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--warm-gray)' }}>
      <CloudOff size={34} style={{ opacity: 0.55, margin: '0 auto 12px' }} />
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--slate-blue-dark)' }}>{title}</p>
      <p style={{ margin: '6px auto 0', maxWidth: '520px', fontSize: '0.85rem' }}>{description}</p>
      {action}
    </div>
  );
}