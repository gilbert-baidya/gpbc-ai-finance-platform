import React from 'react';
import { User, Calendar } from 'lucide-react';
import { useTenant } from '../tenants/TenantContext';
import TenantSwitcher from './TenantSwitcher';
import './Header.css';

const Header = () => {
  const { tenant } = useTenant();
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  return (
    <header className="app-header app-global-header glass-panel">
      <div className="header-left">
        <img 
          src="/Logo-gpbc.png" 
          alt="GPBC Church Logo" 
          style={{ 
            width: '96px', 
            height: '96px', 
            objectFit: 'contain',
            marginRight: '16px'
          }}
          onError={(e) => {
            // Fallback to cross symbol if logo not found
            e.target.outerHTML = '<div style="font-size: 32px; color: var(--wine); margin-right: 16px;">✝</div>';
          }}
        />
        <div className="church-info">
          <h1>{tenant?.short || 'GPBC'}</h1>
          <span className="subtitle">{tenant?.name || 'Grace and Praise Bangladeshi Church'}</span>
        </div>
      </div>

      <div className="header-right">
        <TenantSwitcher />
        <div className="date-display">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>
        <div className="user-profile glass-card">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="name">Treasurer Admin</span>
            <span className="role">Finance Ministry</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
