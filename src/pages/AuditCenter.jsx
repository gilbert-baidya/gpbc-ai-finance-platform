/*************************************************
 * GPBC Finance Desk — AuditCenter.jsx
 * Deterministic Audit & Reconciliation Center
 *************************************************/

import React, { useState, useEffect, useId } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Receipt,
  FileText,
  Upload
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { auditApi } from '../api/auditApi';
import { parseStatementCsv } from '../utils/csvParser';

export const AuditCenter = () => {
  const { user } = useAuth();
  const searchInputId = useId();
  const severitySelectId = useId();
  const statusSelectId = useId();
  const resolutionStatusSelectId = useId();
  const resolutionNotesInputId = useId();
  const evidenceUrlInputId = useId();
  const statementTypeSelectId = useId();
  const rawCsvInputId = useId();

  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'reconciliation'
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [issues, setIssues] = useState([]);
  const [healthScore, setHealthScore] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected issue for resolution modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('Reviewed');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveEvidence, setResolveEvidence] = useState('');
  const [resolving, setResolving] = useState(false);

  // Reconciliation state
  const [reconciliationCandidates, setReconciliationCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [rawCsvText, setRawCsvText] = useState('');
  const [stagingCsv, setStagingCsv] = useState(false);
  const [statementType, setStatementType] = useState('Bank Checking');

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getAuditIssues();
      setIssues(res.issues || []);
      const sumRes = await auditApi.getAuditSummary();
      setHealthScore(sumRes.healthScore || null);
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      setRunningAudit(true);
      const res = await auditApi.runAudit();
      setIssues(res.issues || []);
      setHealthScore(res.healthScore || null);
    } catch (err) {
      alert(err.message || 'Audit execution failed');
    } finally {
      setRunningAudit(false);
    }
  };

  const loadReconciliation = async () => {
    try {
      setLoadingCandidates(true);
      const res = await auditApi.getReconciliationCandidates();
      setReconciliationCandidates(res.candidates || []);
    } catch (err) {
      console.error('Failed to load reconciliation candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reconciliation') {
      loadReconciliation();
    }
  }, [activeTab]);

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      setResolving(true);
      await auditApi.resolveAuditIssue({
        auditIssueId: selectedIssue.auditIssueId,
        status: resolveStatus,
        resolutionNotes: resolveNotes,
        evidenceUrl: resolveEvidence
      });
      setSelectedIssue(null);
      setResolveNotes('');
      setResolveEvidence('');
      loadAuditData();
    } catch (err) {
      alert(err.message || 'Failed to update issue');
    } finally {
      setResolving(false);
    }
  };

  const handleStageCsv = async (e) => {
    e.preventDefault();
    if (!rawCsvText.trim()) return;
    try {
      setStagingCsv(true);
      const parseResult = parseStatementCsv(rawCsvText, statementType);

      if (parseResult.errors.length > 0) {
        const errorSummary = parseResult.errors
          .slice(0, 3)
          .map(err => `Row ${err.rowNumber}: ${err.reason}`)
          .join('\n');
        const proceed = confirm(
          `CSV parser found ${parseResult.errors.length} invalid row(s):\n\n${errorSummary}\n\nDo you want to stage the ${parseResult.validLines.length} valid row(s)?`
        );
        if (!proceed) {
          setStagingCsv(false);
          return;
        }
      }

      if (parseResult.validLines.length === 0) {
        alert('Could not parse any valid statement rows. Check CSV formatting.');
        setStagingCsv(false);
        return;
      }

      const res = await auditApi.stageBankStatementLines({
        statementLines: parseResult.validLines,
        sourceFileName: statementType + '_Import.csv'
      });

      setRawCsvText('');
      loadReconciliation();
      const dupMsg = res.duplicateCount > 0 ? ` (${res.duplicateCount} duplicates skipped)` : '';
      alert(`Successfully staged ${res.count || parseResult.validLines.length} statement rows for reconciliation${dupMsg}.`);
    } catch (err) {
      alert(err.message || 'Failed to stage statement lines');
    } finally {
      setStagingCsv(false);
    }
  };

  const handleMatchLine = async (statementLineId, transactionId) => {
    try {
      await auditApi.matchReconciliationLine({ statementLineId, transactionId });
      loadReconciliation();
    } catch (err) {
      alert(err.message || 'Failed to match statement line');
    }
  };

  // Filtered issues
  const filteredIssues = issues.filter(issue => {
    if (severityFilter && issue.severity !== severityFilter) return false;
    if (statusFilter && issue.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (issue.title && issue.title.toLowerCase().includes(q)) ||
        (issue.entityId && issue.entityId.toLowerCase().includes(q)) ||
        (issue.ruleId && issue.ruleId.toLowerCase().includes(q)) ||
        (issue.description && issue.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const criticalIssuesCount = issues.filter(i => i.severity === 'CRITICAL' && !['Reviewed', 'Cleared', 'Reconciled'].includes(i.status)).length;
  const missingReceiptsCount = issues.filter(i => i.ruleId === 'RULE-RCP-001' && !['Reviewed', 'Cleared', 'Reconciled'].includes(i.status)).length;
  const pendingReimbursementsCount = issues.filter(i => (i.ruleId === 'RULE-PRP-001' || i.ruleId === 'RULE-RMB-001') && !['Reviewed', 'Cleared', 'Reconciled'].includes(i.status)).length;

  return (
    <div className="finance-page-container animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={28} color="var(--gold-dark)" />
            Audit & Reconciliation Center
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Deterministic rule engine, explainable compliance health score, and statement reconciliation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadAuditData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {canWrite && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunAudit}
              disabled={runningAudit}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--slate-blue)' }}
            >
              <RefreshCw size={16} className={runningAudit ? 'animate-spin' : ''} />
              {runningAudit ? 'Evaluating Rules...' : 'Run Audit Engine'}
            </button>
          )}
        </div>
      </div>

      {/* Health Score & Key Compliance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Health Score Gauge Panel */}
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warm-gray)', letterSpacing: '0.5px' }}>
                AUDIT HEALTH SCORE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: (healthScore?.score || 100) >= 80 ? '#165940' : ((healthScore?.score || 100) >= 60 ? '#C05621' : '#991B1B') }}>
                  {healthScore ? healthScore.score : 100}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--warm-gray)', fontWeight: 600 }}>/ 100</span>
                <span className="badge" style={{
                  background: (healthScore?.score || 100) >= 80 ? 'rgba(45, 139, 110, 0.15)' : 'rgba(192, 86, 33, 0.15)',
                  color: (healthScore?.score || 100) >= 80 ? '#165940' : '#C05621',
                  fontWeight: 700
                }}>
                  {healthScore?.scoreTier || 'Audit Ready'}
                </span>
              </div>
            </div>
            <ShieldCheck size={48} color={(healthScore?.score || 100) >= 80 ? '#2D8B6E' : '#C05621'} />
          </div>

          {/* Deductions Breakdown */}
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--warm-gray)' }}>
            {healthScore?.topReasons && healthScore.topReasons.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {healthScore.topReasons.map((reason, idx) => (
                  <span key={idx} style={{ background: '#FFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    {reason}
                  </span>
                ))}
              </div>
            ) : (
              <span>100% compliant — No unresolved active audit findings</span>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>CRITICAL DISCREPANCIES</span>
            <AlertTriangle size={18} color="#991B1B" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991B1B', marginTop: '8px' }}>
            {criticalIssuesCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Over-allocations & fund deficits</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>MISSING RECEIPTS</span>
            <Receipt size={18} color="#C05621" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C05621', marginTop: '8px' }}>
            {missingReceiptsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Expenses lacking evidence</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>PENDING REIMBURSEMENTS</span>
            <FileText size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-blue)', marginTop: '8px' }}>
            {pendingReimbursementsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Unallocated or pending purchases</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'issues' ? '3px solid var(--slate-blue)' : '3px solid transparent',
            color: activeTab === 'issues' ? 'var(--slate-blue)' : 'var(--warm-gray)'
          }}
        >
          Active Audit Findings ({issues.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'reconciliation' ? '3px solid var(--slate-blue)' : '3px solid transparent',
            color: activeTab === 'reconciliation' ? 'var(--slate-blue)' : 'var(--warm-gray)'
          }}
        >
          Bank & Card Reconciliation
        </button>
      </div>

      {/* TAB 1: AUDIT ISSUES VIEW */}
      {activeTab === 'issues' && (
        <>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <label htmlFor={searchInputId} style={{ display: 'none' }}>Search audit issues</label>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
              <input
                id={searchInputId}
                type="text"
                className="form-control"
                placeholder="Search audit issues, record IDs, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <label htmlFor={severitySelectId} style={{ display: 'none' }}>Filter by severity</label>
              <select
                id={severitySelectId}
                className="form-control"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div style={{ minWidth: '180px' }}>
              <label htmlFor={statusSelectId} style={{ display: 'none' }}>Filter by status</label>
              <select
                id={statusSelectId}
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Needs Receipt">Needs Receipt</option>
                <option value="Needs Explanation">Needs Explanation</option>
                <option value="Missing Documentation">Missing Documentation</option>
                <option value="Pending Match">Pending Match</option>
                <option value="Partial Reimbursement">Partial Reimbursement</option>
                <option value="Possible Duplicate">Possible Duplicate</option>
                <option value="Discrepancy">Discrepancy</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>
          </div>

          {/* Audit Issues Table */}
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', borderBottom: '2px solid #E2E8F0', color: 'var(--warm-gray)' }}>
                    <th style={{ padding: '12px 16px' }}>SEVERITY</th>
                    <th style={{ padding: '12px 16px' }}>RULE & TITLE</th>
                    <th style={{ padding: '12px 16px' }}>AFFECTED RECORD</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px' }}>RECOMMENDED ACTION</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--warm-gray)' }}>
                        Loading audit findings...
                      </td>
                    </tr>
                  ) : filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--warm-gray)' }}>
                        No audit issues found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue) => {
                      const isResolved = ['Reviewed', 'Cleared', 'Reconciled'].includes(issue.status);
                      const sevBadgeColor =
                        issue.severity === 'CRITICAL' ? { bg: '#FEE2E2', color: '#991B1B' } :
                        issue.severity === 'HIGH' ? { bg: '#FFEDD5', color: '#C05621' } :
                        issue.severity === 'MEDIUM' ? { bg: '#FEF3C7', color: '#B45309' } :
                        { bg: '#DBEAFE', color: '#1E40AF' };

                      return (
                        <tr key={issue.auditIssueId} style={{ borderBottom: '1px solid #E2E8F0', background: isResolved ? '#F8FAFC' : '#FFF' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: sevBadgeColor.bg,
                              color: sevBadgeColor.color,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              {issue.severity}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: isResolved ? 'var(--warm-gray)' : 'var(--slate-blue)' }}>
                              {issue.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>
                              {issue.ruleId} • {issue.description}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                            {issue.entityId}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                            {issue.amount > 0 ? `$${Number(issue.amount).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: issue.status === 'Cleared' || issue.status === 'Reconciled'
                                ? '#DCFCE7'
                                : (issue.status === 'Reviewed' ? '#FEF3C7' : '#F1F5F9'),
                              color: issue.status === 'Cleared' || issue.status === 'Reconciled'
                                ? '#166534'
                                : (issue.status === 'Reviewed' ? '#92400E' : 'var(--slate-blue)')
                            }}>
                              {issue.status === 'Reviewed' ? 'Reviewed (Active)' : issue.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--warm-gray)', maxWidth: '280px' }}>
                            {issue.recommendedAction}
                            {issue.evidenceUrl && (
                              <a href={issue.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px', color: 'var(--slate-blue)' }}>
                                <ExternalLink size={12} /> Drive
                              </a>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {canWrite && (
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setResolveStatus(issue.status === 'Reviewed' ? 'Cleared' : 'Reviewed');
                                  setResolveNotes(issue.resolutionNotes || '');
                                  setResolveEvidence(issue.evidenceUrl || '');
                                }}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                {isResolved ? 'Update' : 'Resolve'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: RECONCILIATION VIEW */}
      {activeTab === 'reconciliation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
          {/* CSV Import Panel */}
          <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-blue)', margin: '0 0 12px 0' }}>
              Import Statement (CSV)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', margin: '0 0 16px 0' }}>
              Paste raw statement lines (Date, Description, Amount) from Bank Checking or Capital One.
            </p>

            <form onSubmit={handleStageCsv}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor={statementTypeSelectId} className="form-label" style={{ fontSize: '0.8rem' }}>Statement Account</label>
                <select
                  id={statementTypeSelectId}
                  className="form-control"
                  value={statementType}
                  onChange={(e) => setStatementType(e.target.value)}
                >
                  <option value="Bank Checking">Bank Checking Statement</option>
                  <option value="Capital One Card">Capital One Card Statement</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor={rawCsvInputId} className="form-label" style={{ fontSize: '0.8rem' }}>CSV Content</label>
                <textarea
                  id={rawCsvInputId}
                  className="form-control"
                  rows={8}
                  placeholder={`2026-02-01, Home Depot, -145.20\n2026-02-03, Tithe Offering Deposit, 1200.00`}
                  value={rawCsvText}
                  onChange={(e) => setRawCsvText(e.target.value)}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={stagingCsv || !rawCsvText.trim()}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={16} />
                {stagingCsv ? 'Staging...' : 'Stage Statement Lines'}
              </button>
            </form>
          </div>

          {/* Reconciliation Candidates Table */}
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#FAF6F0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
                Statement Match Candidates
              </h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={loadReconciliation}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Refresh Staging
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', borderBottom: '2px solid #E2E8F0', color: 'var(--warm-gray)' }}>
                    <th style={{ padding: '12px 16px' }}>STATEMENT LINE</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                    <th style={{ padding: '12px 16px' }}>MATCH CONFIDENCE</th>
                    <th style={{ padding: '12px 16px' }}>SUGGESTED LEDGER MATCH</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>CONFIRM</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCandidates ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--warm-gray)' }}>
                        Checking reconciliation matches...
                      </td>
                    </tr>
                  ) : reconciliationCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--warm-gray)' }}>
                        No staged statement lines. Upload a statement to begin reconciliation.
                      </td>
                    </tr>
                  ) : (
                    reconciliationCandidates.map((cand, idx) => {
                      const stmt = cand.statementLine;
                      const tx = cand.suggestedTransaction;
                      const isMatched = stmt.matchStatus === 'Matched';

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: isMatched ? '#F8FAFC' : '#FFF' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700 }}>{stmt.description}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>
                              {stmt.statementDate} • {stmt.statementType}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: stmt.amount < 0 ? '#991B1B' : '#166534' }}>
                            ${Math.abs(Number(stmt.amount)).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: cand.matchType === 'Exact Match' ? '#DCFCE7' : (cand.matchType === 'Possible Match' ? '#FEF3C7' : '#F1F5F9'),
                              color: cand.matchType === 'Exact Match' ? '#166534' : (cand.matchType === 'Possible Match' ? '#B45309' : 'var(--warm-gray)')
                            }}>
                              {cand.matchType}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {tx ? (
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--slate-blue)' }}>
                                  {tx.payeeOrPayer} — ${Number(tx.amount).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>
                                  {tx.transactionId} • {tx.transactionDate}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--warm-gray)', fontSize: '0.8rem' }}>No candidate found</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {isMatched ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 700, fontSize: '0.8rem' }}>
                                <CheckCircle2 size={16} /> Reconciled
                              </span>
                            ) : (
                              tx && canWrite && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleMatchLine(stmt.statementLineId, tx.transactionId)}
                                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                >
                                  Match
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ background: '#FFF', maxWidth: '540px', width: '100%', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-blue)', margin: '0 0 12px 0' }}>
              Review Audit Issue
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', margin: '0 0 16px 0' }}>
              {selectedIssue.title} ({selectedIssue.ruleId})
            </p>

            <form onSubmit={handleResolveIssue}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor={resolutionStatusSelectId} className="form-label" style={{ fontSize: '0.85rem' }}>Resolution Status</label>
                <select
                  id={resolutionStatusSelectId}
                  className="form-control"
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  required
                >
                  <option value="Reviewed">Reviewed — investigated, still tracked</option>
                  <option value="Cleared">Cleared — documentation attached / corrected</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor={resolutionNotesInputId} className="form-label" style={{ fontSize: '0.85rem' }}>Resolution Explanation / Notes *</label>
                <textarea
                  id={resolutionNotesInputId}
                  className="form-control"
                  rows={3}
                  placeholder="Explain why this exception is legitimate or how it was resolved..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor={evidenceUrlInputId} className="form-label" style={{ fontSize: '0.85rem' }}>Google Drive Evidence URL (Optional)</label>
                <input
                  id={evidenceUrlInputId}
                  type="url"
                  className="form-control"
                  placeholder="https://drive.google.com/..."
                  value={resolveEvidence}
                  onChange={(e) => setResolveEvidence(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedIssue(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resolving}
                >
                  {resolving ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditCenter;
