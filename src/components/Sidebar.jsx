import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const mainNavGroups = [
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
        { icon: <ShieldCheck size={18} />, label: 'Audit Center', path: '/audit' },
        { icon: <CalendarCheck size={18} />, label: 'Monthly Close', path: '/monthly-close' },
        { icon: <FileCheck2 size={18} />, label: 'Presbyter Reports', path: '/presbyter-reports' },
      ],
    },
  ];

  const legacyItems = [
    { icon: <Users size={16} />, label: 'Members', path: '/members' },
    { icon: <TrendingUp size={16} />, label: 'Contributions (Legacy)', path: '/contributions' },
    { icon: <Mail size={16} />, label: 'Tax Letters', path: '/letters' },
    { icon: <Sparkles size={16} />, label: 'AI Reports', path: '/ai-reports' },
    { icon: <Sparkles size={16} />, label: 'Pastoral AI', path: '/pastoral-intelligence' },
    { icon: <Sparkles size={16} />, label: 'Operations Center', path: '/operations-command-center' },
  ];

  return (
    <aside className={`sidebar-premium navigation-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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
      </div>

      {/* Main Navigation */}
      <nav className="nav-menu-scrollable">
        {mainNavGroups.map((group, gIdx) => (
          <div key={gIdx} className="nav-group">
            {!isCollapsed && <div className="nav-group-title">{group.group}</div>}
            {group.items.map((item, iIdx) => (
              <NavLink
                key={iIdx}
                to={item.path}
                className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="icon-bubble">{item.icon}</div>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Preserved Legacy Features Dropdown */}
        <div className="nav-group legacy-group">
          {!isCollapsed ? (
            <button
              type="button"
              className="legacy-toggle-btn"
              onClick={() => setLegacyOpen(!legacyOpen)}
            >
              <span>Ministry & Intelligence</span>
              <ChevronDown
                size={14}
                style={{ transform: legacyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>
          ) : (
            <div className="nav-group-divider" />
          )}

          {(legacyOpen || isCollapsed) &&
            legacyItems.map((item, lIdx) => (
              <NavLink
                key={lIdx}
                to={item.path}
                className={({ isActive }) => `nav-item-premium legacy-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="icon-bubble">{item.icon}</div>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="sidebar-footer-premium">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
          title={isCollapsed ? 'Settings' : ''}
        >
          <div className="icon-bubble">
            <Settings size={18} />
          </div>
          {!isCollapsed && <span className="nav-label">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
