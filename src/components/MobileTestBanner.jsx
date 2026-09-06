import React from 'react';
import { isMobileTestAllowed } from '../auth/mobileTestGuard';
import { ShieldAlert } from 'lucide-react';

export function MobileTestBanner() {
  if (!isMobileTestAllowed()) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Local UI Test Mode"
      style={{
        backgroundColor: '#FEF3C7',
        borderBottom: '1px solid #F59E0B',
        color: '#92400E',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        textAlign: 'center',
        zIndex: 1000,
        position: 'relative'
      }}
    >
      <ShieldAlert size={14} color="#D97706" />
      <span>LOCAL UI TEST MODE — No financial changes are saved</span>
    </div>
  );
}

export default MobileTestBanner;
