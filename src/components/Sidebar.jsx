import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  DollarSign,
  TrendingUp,
  FileCheck2,
  FolderGit2,
  ShieldCheck,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  CreditCard,
  CheckSquare,
  Files,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ mobileOpen = false, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const isPresbyter = user?.role === 'Presbyter Read-Only';

  const mainNavGroups = isPresbyter ? [
    {
      group: 'Executive Oversight',
      items: [
        { icon: <FileCheck2 size={18} />, label: 'Presbyter Reports', path: '/presbyter-reports', isPrimary: true }
      ]
    }
  ] : [
    {
      group: 'Overview',
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
      ],
    },
    {
      group: 'Finance',
      items: [
        { icon: <FileSpreadsheet size={18} />, label: 'Transactions', path: '/transactions' },
        { icon: <TrendingUp size={18} />, label: 'Income', path: '/income' },
        { icon: <DollarSign size={18} />, label: 'Expenses', path: '/expenses' },
        { icon: <CreditCard size={18} />, label: 'Reimbursements', path: '/reimbursements' },
        { icon: <Files size={18} />, label: 'Document Center', path: '/documents' },
        { icon: <Receipt size={18} />, label: 'Receipt Register', path: '/receipts' },
        { icon: <CheckSquare size={18} />, label: 'Check Details', path: '/checks' },
      ],
    },
    {
      group: 'Projects',
      items: [
        { icon: <FolderGit2 size={18} />, label: 'Capital Projects', path: '/capital-projects' },
      ],
    },
    {
      group: 'Control & Audit',
      items: [
        { icon: <GitCompare size={18} />, label: 'Reconciliation', path: '/reconciliation' },
        { icon: <ShieldCheck size={18} />, label: 'Audit Center', path: '/audit' },
        { icon: <CalendarCheck size={18} />, label: 'Monthly Close', path: '/monthly-close' },
        { icon: <FileCheck2 size={18} />, label: 'Presbyter Reports', path: '/presbyter-reports' }
      ],
    },
    {
      group: 'System',
      items: [
        { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
      ],
    },
  ];

  return (
    <aside className={`sidebar-premium navigation-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header with Logo/Brand */}
      <div className="sidebar-header">
        <div className="brand-container">
          <div className="brand-icon">
            <img
              src="/Logo-gpbc.png"
              alt="GPBC Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          {!isCollapsed && (
            <div className="brand-text-block">
              <span className="brand-title">Finance Desk</span>
              <span className="brand-badge">GPBC</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button type="button" className="sidebar-mobile-close" onClick={onClose} aria-label="Close navigation">
          <X size={19} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="nav-menu-scrollable">
        {loading ? (
          <div className="sidebar-loading-skeleton" data-testid="sidebar-loading">
            <div className="sidebar-skeleton-pulse" style={{ height: '12px', width: '50%', margin: '16px 12px 8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
            <div className="sidebar-skeleton-pulse" style={{ height: '36px', margin: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
            <div className="sidebar-skeleton-pulse" style={{ height: '36px', margin: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
          </div>
        ) : (
          mainNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="nav-group">
              {!isCollapsed && <div className="nav-group-title">{group.group}</div>}
              {group.items.map((item, iIdx) => (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className="icon-bubble">{item.icon}</div>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
