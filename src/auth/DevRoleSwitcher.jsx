import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { isMobileTestAllowed } from './mobileTestGuard';
import { Shield } from 'lucide-react';

export function DevRoleSwitcher() {
  const { devSignIn, idToken, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Exclude from production builds entirely
  if ((!import.meta.env.DEV && !isMobileTestAllowed()) || !devSignIn || idToken) {
    return null;
  }

  return (
    <div
      className="role-switcher-dev dev-only"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: '#FAF6F0',
        border: '1px solid #C5A880',
        padding: '10px 14px',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(44, 62, 80, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 9999,
        fontFamily: 'sans-serif',
        fontSize: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '8px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#2C3E50' }}>
          <Shield size={14} color="#7B9EA8" />
          <span>Dev Role: {user?.role || 'Signed Out'}</span>
        </div>
        <span style={{ color: '#6B7280', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
          <button
            type="button"
            style={{ padding: '4px 8px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #D9E8EC', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => devSignIn('Primary Admin')}
          >
            👑 Primary Admin
          </button>
          <button
            type="button"
            style={{ padding: '4px 8px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #D9E8EC', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => devSignIn('Finance Editor')}
          >
            ✏️ Finance Editor
          </button>
          <button
            type="button"
            style={{ padding: '4px 8px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #D9E8EC', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => devSignIn('Viewer')}
          >
            👁️ Viewer
          </button>
          <button
            type="button"
            style={{ padding: '4px 8px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #D9E8EC', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => devSignIn('Presbyter Read-Only')}
          >
            📜 Presbyter Read-Only
          </button>
        </div>
      )}
    </div>
  );
}

export default DevRoleSwitcher;
