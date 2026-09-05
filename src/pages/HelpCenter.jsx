import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  CreditCard,
  FolderGit2,
  FileSpreadsheet,
  GitCompare,
  CalendarCheck,
  Settings as SettingsIcon,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import {
  MODULE_GUIDES,
  MONTHLY_WORKFLOW_STEPS,
  ROLE_GUIDES,
  GLOSSARY_TERMS,
  TROUBLESHOOTING_GUIDES,
  WHAT_NEXT_SCENARIOS,
  QUICK_START_STEPS,
  searchHelp,
  getHelpString
} from '../help/helpRegistry';
import { useAuth } from '../context/AuthContext';
import './HelpCenter.css';

export const HelpCenter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || 'Viewer';
  const isPresbyter = userRole === 'Presbyter Read-Only';

  // Read active tab and query from search params or default
  const activeTab = searchParams.get('tab') || 'quick-start';
  const query = searchParams.get('q') || '';
  const selectedStepParam = searchParams.get('step');

  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedRoleTab, setSelectedRoleTab] = useState(userRole);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [glossaryLetter, setGlossaryLetter] = useState('ALL');

  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab !== 'troubleshooting' && tab !== 'glossary') {
      next.delete('q');
      setSearchQuery('');
    }
    setSearchParams(next);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set('q', val);
    } else {
      next.delete('q');
    }
    setSearchParams(next);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  // Execute client-side search across all help resources
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchHelp(searchQuery, userRole);
  }, [searchQuery, userRole]);

  // Alphabetical glossary grouping
  const filteredGlossary = useMemo(() => {
    let list = GLOSSARY_TERMS;
    if (glossaryLetter !== 'ALL') {
      list = list.filter(g => g.term.toUpperCase().startsWith(glossaryLetter));
    }
    if (searchQuery.trim() && activeTab === 'glossary') {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.term.toLowerCase().includes(q) || 
        g.definition.toLowerCase().includes(q) || 
        g.churchContext.toLowerCase().includes(q)
      );
    }
    return list;
  }, [glossaryLetter, searchQuery, activeTab]);

  // Filtered troubleshooting items
  const filteredTroubleshooting = useMemo(() => {
    if (searchQuery.trim() && activeTab === 'troubleshooting') {
      const q = searchQuery.toLowerCase();
      return TROUBLESHOOTING_GUIDES.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.problem.toLowerCase().includes(q) ||
        t.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    return TROUBLESHOOTING_GUIDES;
  }, [searchQuery, activeTab]);

  const handlePrint = () => {
    window.print();
  };

  // Map module icons
  const getModuleIcon = (id) => {
    switch (id) {
      case 'dashboard': return <TrendingUp size={20} />;
      case 'transactions': return <FileSpreadsheet size={20} />;
      case 'income': return <TrendingUp size={20} />;
      case 'expenses': return <CreditCard size={20} />;
      case 'reimbursements': return <CreditCard size={20} />;
      case 'documents': case 'receipts': case 'checks': return <BookOpen size={20} />;
      case 'capital-projects': return <FolderGit2 size={20} />;
      case 'reconciliation': return <GitCompare size={20} />;
      case 'audit-center': return <ShieldCheck size={20} />;
      case 'monthly-close': return <CalendarCheck size={20} />;
      case 'presbyter-reports': return <FileCheck2 size={20} />;
      case 'settings': return <SettingsIcon size={20} />;
      default: return <BookOpen size={20} />;
    }
  };

  return (
    <div className="help-center-container">
      {/* Top Hero Banner */}
      <div className="help-hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="help-hero-title">
              <BookOpen size={30} style={{ color: 'var(--gold, #C5A880)' }} />
              Help & Training Center
            </h1>
            <p className="help-hero-subtitle">
              Learn how to use GPBC Finance Desk, understand church finance workflows, and complete monthly reporting with confidence.
            </p>
          </div>

          <div className="help-print-hide">
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Printer size={16} />
              <span>Print Guide</span>
            </button>
          </div>
        </div>

        {/* Client-side Search Field */}
        <div className="help-search-container help-print-hide">
          <Search size={18} className="help-search-icon" />
          <input
            type="text"
            className="help-search-input"
            placeholder="Search help topics, workflows, rules, or glossary terms..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search help topics"
          />
          {searchQuery && (
            <button
              type="button"
              className="help-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Search Results (if searching) */}
      {searchQuery.trim().length > 0 && (
        <div style={{ marginBottom: '32px' }} className="help-print-hide">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--slate-blue-dark)', margin: 0 }}>
              Search Results for "{searchQuery}" ({searchResults.length} found)
            </h2>
            <button
              type="button"
              onClick={handleClearSearch}
              style={{ background: 'transparent', border: 'none', color: 'var(--slate-blue)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <HelpCircle size={36} style={{ color: 'var(--warm-gray)', margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--slate-blue-light)', margin: 0 }}>
                No matching topics found for "{searchQuery}". Try searching for terms like <em>receipt</em>, <em>reimbursement</em>, <em>closed month</em>, or <em>audit</em>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--mist-blue-dark)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (item.targetRoute) navigate(item.targetRoute);
                  }}
                >
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--mist-blue)',
                      color: 'var(--slate-blue)'
                    }}>
                      {item.category}
                    </span>
                    <h4 style={{ margin: '8px 0 6px 0', fontSize: '1rem', color: 'var(--slate-blue-dark)' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.86rem', color: 'var(--warm-gray-dark)', margin: 0, lineHeight: 1.4 }}>
                      {item.snippet}
                    </p>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--slate-blue)', fontWeight: 600 }}>
                    <span>View details</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Tab Bar */}
      <nav className="help-nav-tabs help-print-hide" aria-label="Help Navigation Tabs">
        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'quick-start' ? 'active' : ''}`}
          onClick={() => handleTabChange('quick-start')}
        >
          <Clock size={16} />
          <span>5-Min Quick Start</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => handleTabChange('workflow')}
        >
          <CalendarCheck size={16} />
          <span>Monthly Finance Workflow</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => handleTabChange('modules')}
        >
          <BookOpen size={16} />
          <span>Module Guides</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => handleTabChange('roles')}
        >
          <ShieldCheck size={16} />
          <span>Your Role & Training</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'what-next' ? 'active' : ''}`}
          onClick={() => handleTabChange('what-next')}
        >
          <HelpCircle size={16} />
          <span>What Should I Do Next?</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'troubleshooting' ? 'active' : ''}`}
          onClick={() => handleTabChange('troubleshooting')}
        >
          <AlertTriangle size={16} />
          <span>Troubleshooting</span>
        </button>

        <button
          type="button"
          className={`help-tab-btn ${activeTab === 'glossary' ? 'active' : ''}`}
          onClick={() => handleTabChange('glossary')}
        >
          <span>Glossary (A-Z)</span>
        </button>
      </nav>

      {/* TAB CONTENT */}

      {/* 1. 5-MINUTE QUICK START */}
      {activeTab === 'quick-start' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <Clock size={20} style={{ color: 'var(--gold, #C5A880)' }} />
                5-Minute Quick Start for Church Finance
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Essential rules and navigational principles every church accountant or finance editor needs on Day 1.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '32px' }}>
            {QUICK_START_STEPS.map((step) => (
              <div
                key={step.minute}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--mist-blue-dark)',
                  borderRadius: '12px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(44, 62, 80, 0.04)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      background: 'var(--slate-blue)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Minute {step.minute}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', fontWeight: 600 }}>
                      Quick Step
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue-dark)', margin: '0 0 8px 0' }}>
                    {step.title}
                  </h3>

                  <div style={{
                    background: 'var(--ivory-warm)',
                    borderLeft: '3px solid var(--gold)',
                    padding: '8px 12px',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--slate-blue-dark)',
                    marginBottom: '14px'
                  }}>
                    {step.keyTakeaway}
                  </div>

                  <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--slate-blue-light)', lineHeight: 1.45 }}>
                    {step.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--mist-blue)' }}>
                  {isPresbyter && step.targetRoute !== '/presbyter-reports' && !step.targetRoute.startsWith('/help') ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
                      Not available for your role
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(step.targetRoute)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--slate-blue)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                      }}
                    >
                      <span>Try It Now</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MONTHLY FINANCE WORKFLOW */}
      {activeTab === 'workflow' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <CalendarCheck size={20} style={{ color: 'var(--forest-green)' }} />
                10-Step Monthly Finance Workflow
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Follow this sequential timeline each month from initial offering collection through official close and presbyter reporting.
              </p>
            </div>
          </div>

          <div className="workflow-stepper">
            {MONTHLY_WORKFLOW_STEPS.map((step) => {
              const isSelected = selectedStepParam === String(step.stepNumber);
              return (
                <div
                  key={step.stepNumber}
                  className="workflow-step-card"
                  style={{
                    borderLeft: `4px solid ${step.stepNumber === 9 ? 'var(--gold)' : 'var(--slate-blue)'}`,
                    background: isSelected ? 'var(--ivory-warm)' : '#FFFFFF'
                  }}
                >
                  <div className="workflow-step-badge" style={{ background: step.stepNumber === 9 ? 'var(--gold-dark)' : 'var(--slate-blue)' }}>
                    {step.stepNumber}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--slate-blue-dark)', margin: 0 }}>
                        {step.title}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--mist-blue)',
                        color: 'var(--slate-blue)'
                      }}>
                        {step.roleBadgeText}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.95rem', color: 'var(--slate-blue-dark)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                      <strong>What you do:</strong> {step.action}
                    </p>

                    <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray-dark)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                      <strong>Why it matters:</strong> {step.purpose}
                    </p>

                    {/* Checklists */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ background: 'var(--ivory-warm)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '6px' }}>
                          Prerequisites
                        </div>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--slate-blue-dark)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {step.prerequisites.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ background: 'var(--ivory-warm)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '6px' }}>
                          Completion Checklist
                        </div>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--slate-blue-dark)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {step.completionChecklist.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="help-tip-card" style={{ marginBottom: '14px' }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--forest-green)' }} />
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>Pro-Tip:</strong> {step.proTip}
                      </div>
                    </div>

                    {/* Target Route Link */}
                    <div className="help-print-hide">
                      {isPresbyter && step.targetRoute !== '/presbyter-reports' && !step.targetRoute.startsWith('/help') ? (
                        <span style={{ fontSize: '0.84rem', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
                          Not available for your role
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(step.targetRoute)}
                          className="help-link-button"
                        >
                          <span>{step.routeLabel}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MODULE-BY-MODULE USER GUIDES */}
      {activeTab === 'modules' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <BookOpen size={20} style={{ color: 'var(--slate-blue)' }} />
                Module-by-Module User Guides ({MODULE_GUIDES.length})
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Operational manuals for every screen in the GPBC Finance Desk platform.
              </p>
            </div>
          </div>

          <div className="help-module-grid">
            {MODULE_GUIDES.map((module) => (
              <div key={module.id} className="help-module-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className="help-card-icon-box" style={{ background: 'var(--mist-blue)', color: 'var(--slate-blue)' }}>
                      {getModuleIcon(module.id)}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'var(--mist-blue)',
                      color: 'var(--slate-blue)'
                    }}>
                      {module.category.replace('-', ' ')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue-dark)', margin: '0 0 8px 0' }}>
                    {module.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--warm-gray-dark)', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                    {module.summary}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--mist-blue)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--warm-gray)' }}>
                    {module.readTimeMinutes} min read
                  </span>
                  <Link
                    to={`/help/${module.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--slate-blue)',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Read Guide</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ROLE-BASED TRAINING */}
      {activeTab === 'roles' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <ShieldCheck size={20} style={{ color: 'var(--slate-blue)' }} />
                Role-Based Training & Access Governance
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Your current role is <strong>{userRole}</strong>. Explore role-specific responsibilities, monthly checklists, and permission boundaries.
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {Object.keys(ROLE_GUIDES).map((roleName) => (
              <button
                key={roleName}
                type="button"
                onClick={() => setSelectedRoleTab(roleName)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedRoleTab === roleName ? 'var(--slate-blue)' : 'var(--mist-blue-dark)',
                  background: selectedRoleTab === roleName ? 'var(--slate-blue)' : '#FFFFFF',
                  color: selectedRoleTab === roleName ? '#FFFFFF' : 'var(--slate-blue-dark)',
                  fontWeight: selectedRoleTab === roleName ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{roleName}</span>
                {userRole === roleName && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: selectedRoleTab === roleName ? 'var(--gold)' : 'var(--mist-blue)',
                    color: selectedRoleTab === roleName ? '#1F2D38' : 'var(--slate-blue)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    YOU
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Selected Role Card */}
          {ROLE_GUIDES[selectedRoleTab] && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  background: ROLE_GUIDES[selectedRoleTab].badgeColor,
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {ROLE_GUIDES[selectedRoleTab].role}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
                  {ROLE_GUIDES[selectedRoleTab].title}
                </span>
              </div>

              <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--slate-blue-light)', margin: '0 0 24px 0' }}>
                {ROLE_GUIDES[selectedRoleTab].summary}
              </p>

              {/* Responsibilities */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm-gray)', marginBottom: '10px' }}>
                  Core Operational Responsibilities
                </h4>
                <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.92rem', color: 'var(--slate-blue-dark)', lineHeight: 1.5 }}>
                  {ROLE_GUIDES[selectedRoleTab].responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              {/* Monthly Routine */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm-gray)', marginBottom: '10px' }}>
                  Recommended Monthly Routine
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {ROLE_GUIDES[selectedRoleTab].monthlyRoutine.map((rout, i) => (
                    <div key={i} style={{ background: 'var(--ivory-warm)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.88rem', color: 'var(--slate-blue-dark)' }}>
                      {rout}
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Reminders */}
              <div className="help-tip-card">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--forest-green)' }} />
                <div>
                  <strong>Key Safety & Compliance Invariants:</strong>
                  <ul style={{ paddingLeft: '18px', margin: '6px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {ROLE_GUIDES[selectedRoleTab].keySafetyReminders.map((safe, i) => (
                      <li key={i}>{safe}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. WHAT SHOULD I DO NEXT? */}
      {activeTab === 'what-next' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <HelpCircle size={20} style={{ color: 'var(--gold)' }} />
                What Should I Do Next?
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Interactive guided answers to common real-world church finance situations.
              </p>
            </div>
          </div>

          <div className="what-next-grid">
            {WHAT_NEXT_SCENARIOS.map((scen) => (
              <div key={scen.id} className="what-next-card">
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--slate-blue-dark)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    "{scen.triggerQuestion}"
                  </h3>

                  <div style={{
                    background: 'var(--mist-blue)',
                    borderLeft: '3px solid var(--slate-blue)',
                    padding: '10px 12px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--slate-blue)',
                    marginBottom: '14px'
                  }}>
                    {scen.shortAnswer}
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--slate-blue-dark)', marginBottom: '12px' }}>
                    <strong>Action steps:</strong>
                    <ol style={{ paddingLeft: '18px', margin: '6px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {scen.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>

                  {scen.ruleSummary && (
                    <div style={{ fontSize: '0.8rem', color: '#991B1B', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA', marginBottom: '14px' }}>
                      <strong>Rule:</strong> {scen.ruleSummary}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--mist-blue)', paddingTop: '14px' }} className="help-print-hide">
                  {isPresbyter && scen.recommendedRoute !== '/presbyter-reports' && !scen.recommendedRoute.startsWith('/help') ? (
                    <span style={{ fontSize: '0.84rem', color: 'var(--warm-gray)', fontStyle: 'italic', display: 'block', textAlign: 'center' }}>
                      Not available for your role
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(scen.recommendedRoute)}
                      className="help-link-button"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <span>{scen.routeButtonLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TROUBLESHOOTING CENTER */}
      {activeTab === 'troubleshooting' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <AlertTriangle size={20} style={{ color: '#D97706' }} />
                Troubleshooting Diagnostic Center
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Safe step-by-step diagnostic actions for unexpected messages, balance questions, and permission issues.
              </p>
            </div>
          </div>

          <div className="trouble-list">
            {filteredTroubleshooting.map((t) => {
              const isOpen = activeAccordion === t.id;
              return (
                <div key={t.id} className="trouble-card">
                  <button
                    type="button"
                    className="trouble-header"
                    onClick={() => setActiveAccordion(isOpen ? null : t.id)}
                    aria-expanded={isOpen}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-blue-dark)' }}>
                      {t.title}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div className="trouble-content">
                      <div style={{ marginBottom: '14px' }}>
                        <strong style={{ color: '#991B1B' }}>Observed Problem:</strong>
                        <div style={{ marginTop: '2px', color: 'var(--slate-blue-dark)' }}>{t.problem}</div>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <strong style={{ color: 'var(--slate-blue)' }}>Likely Causes:</strong>
                        <ul style={{ paddingLeft: '18px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {t.possibleReasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <strong style={{ color: 'var(--forest-green)' }}>Safe Action Steps:</strong>
                        <ol style={{ paddingLeft: '18px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {t.safeActionSteps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.85rem' }}>
                        <strong>When to contact Primary Admin:</strong> {t.whenToContactAdmin}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. ALPHABETICAL SEARCHABLE GLOSSARY */}
      {activeTab === 'glossary' && (
        <div>
          <div className="help-section-title-bar">
            <div>
              <h2 className="help-section-heading">
                <span>Accounting & Platform Glossary (A-Z)</span>
              </h2>
              <p style={{ color: 'var(--warm-gray)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                Authoritative definitions matching GPBC Finance Desk calculations, non-profit accounting rules, and audit standards.
              </p>
            </div>
          </div>

          {/* Letter Filter Bar */}
          <div className="glossary-filter-bar help-print-hide">
            <button
              type="button"
              className={`glossary-letter-btn ${glossaryLetter === 'ALL' ? 'active' : ''}`}
              style={{ width: '48px' }}
              onClick={() => setGlossaryLetter('ALL')}
            >
              ALL
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
              <button
                key={letter}
                type="button"
                className={`glossary-letter-btn ${glossaryLetter === letter ? 'active' : ''}`}
                onClick={() => setGlossaryLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="glossary-grid">
            {filteredGlossary.map((term, idx) => (
              <div key={idx} className="glossary-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-blue-dark)', margin: 0 }}>
                    {term.term}
                  </h3>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--mist-blue)',
                    color: 'var(--slate-blue)'
                  }}>
                    {term.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--slate-blue-dark)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  {term.definition}
                </p>

                <div style={{ fontSize: '0.84rem', color: 'var(--warm-gray-dark)', background: 'var(--ivory-warm)', padding: '8px 10px', borderRadius: '6px', marginBottom: term.formulaOrRule ? '8px' : 0 }}>
                  <strong>Church Context:</strong> {term.churchContext}
                </div>

                {term.formulaOrRule && (
                  <div style={{ fontSize: '0.8rem', color: '#1E40AF', background: '#EFF6FF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                    <code>{term.formulaOrRule}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Version & Last Updated */}
      <footer className="help-footer">
        <div>
          <span>{getHelpString('lastUpdated')}</span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Role: <strong>{userRole}</strong></span>
        </div>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="help-print-hide"
          style={{ background: 'transparent', border: 'none', color: 'var(--slate-blue)', cursor: 'pointer', fontWeight: 600 }}
        >
          Back to Top ↑
        </button>
      </footer>
    </div>
  );
};

export default HelpCenter;
