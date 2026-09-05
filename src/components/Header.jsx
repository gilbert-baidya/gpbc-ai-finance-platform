import React from 'react';
import { User, LogOut, Shield, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PeriodSelector from './PeriodSelector';
import PageHelpButton from './help/PageHelpButton';
import './Header.css';

const Header = ({ onOpenNavigation }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="app-header app-global-header glass-panel">
      <div className="header-left">
        <button type="button" className="header-menu-button" onClick={onOpenNavigation} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <img 
          src="/Logo-gpbc.png" 
          alt="GPBC Church Logo" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="church-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>GPBC Finance Desk</h1>
            <span
              className="env-badge"
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                background: (import.meta.env.VITE_GPBC_ENV === 'production' || import.meta.env.VITE_GPBC_ENVIRONMENT === 'production') ? 'rgba(44, 62, 80, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                color: (import.meta.env.VITE_GPBC_ENV === 'production' || import.meta.env.VITE_GPBC_ENVIRONMENT === 'production') ? '#2C3E50' : '#D97706',
                border: (import.meta.env.VITE_GPBC_ENV === 'production' || import.meta.env.VITE_GPBC_ENVIRONMENT === 'production') ? '1px solid rgba(44, 62, 80, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)'
              }}
            >
              {(import.meta.env.VITE_GPBC_ENV === 'production' || import.meta.env.VITE_GPBC_ENVIRONMENT === 'production') ? 'PRODUCTION' : 'SANDBOX'}
            </span>
          </div>
          <span className="subtitle">Finance • Audit • Reporting</span>
        </div>
      </div>

      <div className="header-right">
        <PeriodSelector />
        <PageHelpButton variant="header" label="Guide" />

        {user && (
          <div className="user-profile glass-card">
            <div className="avatar">
              {user.picture ? (
                <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="user-info">
              <span className="name">{user.name}</span>
              <span className="role">
                <Shield size={10} style={{ display: 'inline', marginRight: '3px' }} />
                {user.role}
              </span>
            </div>
            <button
              type="button"
              className="header-logout-btn"
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
