import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, DollarSign, FileText, Mail, BrainCircuit, Brain, Command, Globe, Award, Settings, LayoutDashboard, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Users size={20} />, label: 'Members', path: '/members' },
        { icon: <FileText size={20} />, label: 'Contributions', path: '/contributions' },
        { icon: <DollarSign size={20} />, label: 'Expenses', path: '/expenses' },
        { icon: <Mail size={20} />, label: 'Letters', path: '/letters' },
        { icon: <BrainCircuit size={20} />, label: 'AI Reports', path: '/ai-reports' },
        { icon: <Brain size={20} />, label: 'Pastoral AI', path: '/pastoral-intelligence' },
        { icon: <Command size={20} />, label: 'Operations', path: '/operations-command-center' },
        { icon: <Globe size={20} />, label: 'Kingdom Network', path: '/kingdom-intelligence' },
        { icon: <Award size={20} />, label: 'Grants', path: '/grant-opportunities' },
    ];

    return (
        <aside className={`sidebar-premium navigation-sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Sidebar Header with Logo/Brand */}
            <div className="sidebar-header">
                <div className="brand-container">
                    <div className="brand-icon">
                        <img 
                            src="/Logo-gpbc.png" 
                            alt="GPBC Logo" 
                            style={{ 
                                width: '40px', 
                                height: '40px', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                            onError={(e) => {
                                // Fallback to SVG if logo not found
                                e.target.outerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--wine)" fillOpacity="0.8"/>
                                    <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="var(--green)" fillOpacity="0.6"/>
                                </svg>`;
                            }}
                        />
                    </div>
                    {!isCollapsed && <span className="brand-text">GPBC Finance</span>}
                </div>
                <button 
                    className="collapse-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="nav-menu-premium">
                {menuItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.label : ''}
                    >
                        <div className="icon-bubble">
                            {item.icon}
                        </div>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        <div className="active-glow-line" />
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="sidebar-footer-premium">
                <NavLink 
                    to="/settings" 
                    className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? 'Settings' : ''}
                >
                    <div className="icon-bubble">
                        <Settings size={20} />
                    </div>
                    {!isCollapsed && <span className="nav-label">Settings</span>}
                    <div className="active-glow-line" />
                </NavLink>
                <button className="nav-item-premium logout" title={isCollapsed ? 'Logout' : ''}>
                    <div className="icon-bubble">
                        <LogOut size={20} />
                    </div>
                    {!isCollapsed && <span className="nav-label">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
