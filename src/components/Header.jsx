import React from 'react';
import { User, Calendar, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, signOut } = useAuth();
  
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
            width: '64px', 
            height: '64px', 
            objectFit: 'contain',
            marginRight: '12px'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="church-info">
          <h1>GPBC Finance Desk</h1>
          <span className="subtitle">Finance • Audit • Reporting</span>
        </div>
      </div>

      <div className="header-right">
        <div className="date-display">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>

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
