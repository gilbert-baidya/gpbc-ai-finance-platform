import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { useAuth } from '../context/AuthContext';
import FinanceDataState from '../components/FinanceDataState';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

export const CapitalProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    approvedBudget: '',
    designatedDonationsReceived: '',
    otherFunding: '',
    pendingCommitments: '',
    notes: ''
  });

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getCapitalProjects();
      if (res.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
        setDataAvailable(true);
      } else {
        setProjects([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load capital projects');
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeApi.addCapitalProject({
        projectName: formData.projectName,
        approvedBudget: Number(formData.approvedBudget),
        designatedDonationsReceived: Number(formData.designatedDonationsReceived || 0),
        otherFunding: Number(formData.otherFunding || 0),
        pendingCommitments: Number(formData.pendingCommitments || 0),
        notes: formData.notes
      });
      setShowAddModal(false);
      setFormData({
        projectName: '',
        approvedBudget: '',
        designatedDonationsReceived: '',
        otherFunding: '',
        pendingCommitments: '',
        notes: ''
      });
      loadProjects();
    } catch (err) {
      alert(err.message || 'Failed to create capital project');
    } finally {
      setSubmitting(false);
    }
  };

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.approvedBudget || 0), 0);
  const totalDonations = projects.reduce((sum, p) => sum + Number(p.designatedDonationsReceived || 0), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + Number(p.expensesPaid || 0), 0);
  const totalRemaining = totalDonations - totalExpenses;

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin';

  return (
    <div className="finance-page-container animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
            Capital Projects & Designated Funds
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Designated fund tracking, capital campaign budgets, and expenditure transparency
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={loadProjects} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {canWrite && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              New Capital Project
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', marginBottom: '24px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>APPROVED BUDGETS</span>
            <FolderGit2 size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-blue)', marginTop: '8px' }}>
            {dataAvailable ? `$${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Across all active projects</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>DESIGNATED GIFTS</span>
            <FolderGit2 size={18} color="#2D8B6E" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#165940', marginTop: '8px' }}>
            {dataAvailable ? `$${totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Campaign offerings received</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>EXPENSES PAID</span>
            <FolderGit2 size={18} color="#991B1B" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991B1B', marginTop: '8px' }}>
            {dataAvailable ? `$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Project expenditures disbursed</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>REMAINING DESIGNATED</span>
            <FolderGit2 size={18} color="var(--gold-dark)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-dark)', marginTop: '8px' }}>
            {dataAvailable ? `$${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Restricted funds available</span>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--warm-gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading capital projects...</span>
          </div>
        ) : !dataAvailable ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}><FinanceDataState title="Capital project data unavailable" /></div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--warm-gray)' }}>
            <FolderGit2 size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No capital projects active</p>
            <span style={{ fontSize: '0.85rem' }}>Create a project to track designated campaign gifts and expenses.</span>
          </div>
        ) : (
          projects.map((p, idx) => {
            const budget = Number(p.approvedBudget || 0);
            const received = Number(p.designatedDonationsReceived || 0);
            const spent = Number(p.expensesPaid || 0);
            const progress = budget > 0 ? Math.min(100, Math.round((received / budget) * 100)) : 0;

            return (
              <div key={idx} className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>
                      {p.projectName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>{p.projectId}</span>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: p.status === 'Active' ? '#DEF7EC' : '#EBF3F5',
                    color: p.status === 'Active' ? '#03543F' : '#2C3E50'
                  }}>
                    {p.status || 'Active'}
                  </span>
                </div>

                {p.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '16px', lineHeight: 1.4 }}>
                    {p.notes}
                  </p>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-blue-dark)', marginBottom: '4px' }}>
                    <span>Fundraising Progress</span>
                    <span>{progress}% of ${budget.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#EFEBE4', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gold-dark)', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: '#FAF6F0', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--warm-gray)' }}>Gifts Received</span>
                    <div style={{ fontWeight: 700, color: '#165940', fontSize: '0.95rem' }}>${received.toFixed(2)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--warm-gray)' }}>Expenses Paid</span>
                    <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.95rem' }}>${spent.toFixed(2)}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--slate-blue-dark)' }}>Remaining Designated:</span>
                    <span style={{ fontWeight: 800, color: 'var(--slate-blue)' }}>${Number(p.remainingDesignatedBalance || (received - spent)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#FFFFFF', maxWidth: '540px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>New Capital Campaign / Project</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanctuary Sound & Lighting Overhaul"
                  className="form-input"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Approved Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25000.00"
                    className="form-input"
                    value={formData.approvedBudget}
                    onChange={(e) => setFormData({ ...formData, approvedBudget: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Gifts Received ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="form-input"
                    value={formData.designatedDonationsReceived}
                    onChange={(e) => setFormData({ ...formData, designatedDonationsReceived: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Scope / Milestone Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Goals, target completion date, vendor quotes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalProjects;
