import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, X, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'gpbc_help_banner_dismissed_v1';

export const FirstTimeHelpBanner = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if dismissed previously in localStorage
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleOpenHelp = () => {
    handleDismiss();
    navigate('/help');
  };

  // Do not show on the /help page itself
  if (!visible || location.pathname.startsWith('/help')) return null;

  return (
    <aside
      aria-label="First-time user onboarding"
      className="first-time-banner"
      style={{
        background: 'linear-gradient(90deg, #2C3E50 0%, #3D5A6C 100%)',
        color: '#FFFFFF',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '0.86rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <BookOpen size={16} style={{ color: 'var(--gold, #C5A880)' }} />
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>New to GPBC Finance Desk?</span>
          <span style={{ marginLeft: '6px', opacity: 0.9 }}>
            Explore our new in-app Help & Training Center with 5-minute quick start and monthly workflows.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleOpenHelp}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: 'var(--gold, #C5A880)',
            color: '#1F2D38',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <span>Open Guide</span>
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};

export default FirstTimeHelpBanner;
