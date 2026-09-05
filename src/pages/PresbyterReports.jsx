/*************************************************
 * GPBC Finance Desk — PresbyterReports.jsx
 * Executive Presbyter Financial Oversight Reporting Center
 * Phase 4 — Presbyter / Leadership Reporting
 *************************************************/

import React, { useState, useEffect, useCallback } from 'react';
import {
  Printer,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Award,
  ExternalLink,
  Info
} from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';

export default function PresbyterReports() {
  const { user } = useAuth();
  const { periodKey, setPeriodKey } = usePeriod();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const loadPresbyterReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.getPresbyterReport({ periodKey });
      setReport(res);
    } catch (err) {
      console.error('Failed to load Presbyter report:', err);
      setError(err?.message || 'Unable to load this financial report. Please contact a Finance Desk administrator.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  useEffect(() => {
    loadPresbyterReport();
  }, [loadPresbyterReport]);

  const handlePrint = () => {
    window.print();
  };

  const availablePeriods = [
    { key: '2026-09', label: 'September 2026 (Closed)' },
    { key: '2026-08', label: 'August 2026' },
    { key: '2026-07', label: 'July 2026' }
  ];

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Print CSS Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.45in 0.5in;
          }
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          header,
          nav,
          aside,
          .sidebar,
          button,
          .btn {
            display: none !important;
          }
          .page-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          #presbyter-report-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #FFFFFF !important;
          }
          h1, h2, h3, h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .print-avoid-break,
          .report-section,
          table,
          tr,
          .card-grid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Print spacing compression for clean 2-page fit */
          .report-section {
            margin-bottom: 0.85rem !important;
          }
          #presbyter-report-header {
            margin-bottom: 0.85rem !important;
            padding-bottom: 0.75rem !important;
          }
          #presbyter-ytd-panel {
            padding: 0.75rem 1rem !important;
            margin-bottom: 0.85rem !important;
          }
          .card-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
          }
          .card-grid > div {
            padding: 0.5rem 0.75rem !important;
          }
          #presbyter-section-breakdowns {
            margin-bottom: 0.85rem !important;
            gap: 1.25rem !important;
          }
          #presbyter-close-cert {
            padding: 0.85rem 1rem !important;
            margin-bottom: 0.85rem !important;
          }
          #presbyter-archive-card {
            padding: 0.75rem 1rem !important;
            margin-bottom: 0.85rem !important;
          }
          #presbyter-signature-block {
            margin-top: 1.25rem !important;
            padding-top: 0.85rem !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          .print-page-break {
            page-break-before: always !important;
            break-before: always !important;
          }
        }
      `}</style>

      {/* Header & Controls (Hidden when printing) */}
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', color: 'var(--slate-blue-dark)', margin: 0, fontWeight: 700 }}>
                Presbyter Financial Report
              </h1>
              {report && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: report.isClosed ? '#E6F4EA' : '#FEF7E0',
                    color: report.isClosed ? '#137333' : '#B06000',
                    border: `1px solid ${report.isClosed ? '#CEEAD6' : '#FDE293'}`
                  }}
                >
                  {report.badgeText}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Grace and Praise Bangladeshi Church — Executive Board Oversight
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '4px 10px' }}>
              <Calendar size={16} style={{ color: 'var(--slate-blue)', marginRight: '8px' }} />
              <select
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--slate-blue-dark)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {availablePeriods.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="btn btn-secondary"
              disabled={loading || !report}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', color: '#C5221F', padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-gray)' }}>
          <div className="spinning" style={{ display: 'inline-block', marginBottom: '10px' }}>⌛</div>
          <div>Loading authoritative Presbyter report for period {periodKey}...</div>
        </div>
      )}

      {/* Printable Executive Leadership Report */}
      {!loading && report ? (
        <div
          id="presbyter-report-document"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--mist-blue-dark)',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            color: '#1E293B',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {/* Header & Church Info */}
          <div id="presbyter-report-header" className="report-header print-avoid-break" style={{ borderBottom: '2px solid var(--gold)', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--slate-blue-dark)', margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {report.churchInfo.name}
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
                EIN: {report.churchInfo.ein} • {report.churchInfo.address}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
                Pastor: {report.churchInfo.pastor} • Presbyter Oversight Report
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-blue-dark)' }}>
                FINANCIAL OVERSIGHT REPORT
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-dark)', marginTop: '2px' }}>
                Period: {report.periodLabel}
              </div>
              <div style={{ marginTop: '6px', display: 'inline-block' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: report.isClosed ? '#E6F4EA' : '#FEF7E0',
                    color: report.isClosed ? '#137333' : '#B06000'
                  }}
                >
                  {report.isClosed ? '🔒 FINAL / CLOSED SNAPSHOT' : '🔓 OPEN / PRELIMINARY PREVIEW'}
                </span>
              </div>
            </div>
          </div>

          {/* Year-To-Date (YTD) Summary Panel */}
          <div id="presbyter-ytd-panel" className="report-section print-avoid-break" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Year-To-Date (YTD) Executive Summary — {report.ytdSummary.year} ({report.ytdSummary.closedMonthsCount} CLOSED MONTH{report.ytdSummary.closedMonthsCount === 1 ? '' : 'S'})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>YTD INCOME</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--forest-green)', marginTop: '2px' }}>
                  ${report.ytdSummary.ytdIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>YTD EXPENSES</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D93025', marginTop: '2px' }}>
                  ${report.ytdSummary.ytdRecognizedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>YTD NET POSITION</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: report.ytdSummary.ytdNetPosition >= 0 ? 'var(--forest-green)' : '#D93025', marginTop: '2px' }}>
                  ${report.ytdSummary.ytdNetPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>CLOSED PERIODS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  {report.ytdSummary.closedMonthsCount} Period{report.ytdSummary.closedMonthsCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Financial Summary Cards */}
          <div id="presbyter-section-exec" className="report-section print-avoid-break" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
              1. Executive Financial Summary
            </h2>

            <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>TOTAL INCOME</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--forest-green)', marginTop: '4px' }}>
                  ${report.financialSummary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>Offerings, tithes & gifts</div>
              </div>

              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>OPERATING EXPENSES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D93025', marginTop: '4px' }}>
                  ${report.financialSummary.totalRecognizedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>Operating disbursements</div>
              </div>

              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>NET POSITION</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: report.financialSummary.netPosition >= 0 ? 'var(--forest-green)' : '#D93025', marginTop: '4px' }}>
                  ${report.financialSummary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>Operating surplus / deficit</div>
              </div>

              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>AUDIT HEALTH SCORE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-blue-dark)', marginTop: '4px' }}>
                  {report.financialSummary.auditHealthScore} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--warm-gray)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>{report.financialSummary.auditHealthTier}</div>
              </div>

              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>RECONCILIATION</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--forest-green)', marginTop: '4px' }}>
                  {report.financialSummary.reconciliationStatus}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>0 Discrepancy Amount</div>
              </div>

              <div style={{ background: 'var(--ivory)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>PERIOD STATUS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: report.isClosed ? 'var(--forest-green)' : '#B06000', marginTop: '4px' }}>
                  {report.financialSummary.periodStatus}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '2px' }}>Authoritative status</div>
              </div>
            </div>
          </div>

          {/* Section 2: Income & Expense Breakdowns */}
          <div id="presbyter-section-breakdowns" className="report-section print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Income Summary */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
                2. Income by Category
              </h2>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} />
                <span>{report.incomeSummary.privacyNote || 'Aggregate category totals only. Donor personal details protected.'}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue-dark)', textAlign: 'left', color: 'var(--warm-gray)' }}>
                    <th style={{ padding: '6px 0' }}>Category</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.incomeSummary.categories.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '8px 0', color: 'var(--warm-gray)' }}>No income categories recorded.</td></tr>
                  ) : (
                    report.incomeSummary.categories.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                        <td style={{ padding: '6px 0', fontWeight: 500 }}>{c.category}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>
                          ${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--warm-gray)' }}>
                          {c.percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Expense Summary */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
                3. Operating Expenses by Category
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '36px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue-dark)', textAlign: 'left', color: 'var(--warm-gray)' }}>
                    <th style={{ padding: '6px 0' }}>Category</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenseSummary.categories.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '12px 0', color: 'var(--warm-gray)', fontStyle: 'italic' }}>No recognized operating expenses in this period.</td></tr>
                  ) : (
                    report.expenseSummary.categories.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                        <td style={{ padding: '6px 0', fontWeight: 500 }}>{c.category}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>
                          ${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--warm-gray)' }}>
                          {c.percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Sunday Offering Oversight */}
          <div id="presbyter-section-sunday-offering" className="report-section print-avoid-break" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
              4. Sunday Offering Oversight
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>OFFERING ENTRIES</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  {report.sundayOfferingSummary.count} Entry
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>TOTAL SUNDAY OFFERING</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-green)', marginTop: '2px' }}>
                  ${report.sundayOfferingSummary.totalSundayOffering.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>AVERAGE SUNDAY OFFERING</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  ${report.sundayOfferingSummary.averageSundayOffering.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Member Reimbursements & Liability Settlements */}
          <div id="presbyter-section-reimbursements" className="report-section print-avoid-break" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
              5. Member Reimbursements & Liability Settlements
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '1rem' }}>
              {report.reimbursementSummary.note}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>PERSONAL PURCHASES</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  ${report.reimbursementSummary.totalPersonalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>REIMBURSED PAYOUTS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  ${report.reimbursementSummary.totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>PERSONALLY ABSORBED</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginTop: '2px' }}>
                  ${report.reimbursementSummary.personallyAbsorbed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', fontWeight: 600 }}>REMAINING LIABILITY</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: report.reimbursementSummary.remainingLiability > 0 ? '#B06000' : 'var(--forest-green)', marginTop: '2px' }}>
                  ${report.reimbursementSummary.remainingLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Capital Projects Summary */}
          <div id="presbyter-section-capital-projects" className="report-section print-avoid-break" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--mist-blue-dark)', paddingBottom: '6px', marginBottom: '1rem' }}>
              6. Capital Projects Oversight
            </h2>
            {report.capitalProjectSummary.projects.length === 0 ? (
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', color: 'var(--warm-gray)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No active capital projects recorded for this period.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue-dark)', textAlign: 'left', color: 'var(--warm-gray)' }}>
                    <th style={{ padding: '6px 0' }}>Project Name</th>
                    <th style={{ padding: '6px 0' }}>Status</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Approved Budget</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount Spent</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Budget Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {report.capitalProjectSummary.projects.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>{p.projectName}</td>
                      <td style={{ padding: '6px 0' }}>{p.status}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>
                        {typeof p.approvedBudget === 'number' ? `$${p.approvedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : p.approvedBudget}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>
                        ${p.expensesPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: ((p.budgetRemaining ?? p.remainingBalance) >= 0) ? 'var(--forest-green)' : '#D93025' }}>
                        ${(p.budgetRemaining ?? p.remainingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 7: Month-End Close Certification (CLOSED Period Only) */}
          {report.isClosed && report.closeCertification && (
            <div id="presbyter-close-cert" className="report-section print-avoid-break" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#166534' }}>
                <ShieldCheck size={20} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MONTH-END CLOSE CERTIFICATION
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#15803D', fontWeight: 600 }}>Period Closed</div>
                  <div style={{ fontWeight: 700, color: '#166534', marginTop: '2px' }}>{report.closeCertification.periodKey}</div>
                </div>
                <div>
                  <div style={{ color: '#15803D', fontWeight: 600 }}>Closed By</div>
                  <div style={{ fontWeight: 700, color: '#166534', marginTop: '2px' }}>{report.closeCertification.closedBy}</div>
                </div>
                <div>
                  <div style={{ color: '#15803D', fontWeight: 600 }}>Closed At</div>
                  <div style={{ fontWeight: 700, color: '#166534', marginTop: '2px' }}>
                    {new Date(report.closeCertification.closedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#15803D', fontWeight: 600 }}>Close ID</div>
                  <div style={{ fontWeight: 700, color: '#166534', fontFamily: 'monospace', marginTop: '2px' }}>
                    {report.closeCertification.closeId}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Final Report Archive Artifact */}
          {report.finalReportArtifact && report.finalReportArtifact.available && (
            <div id="presbyter-archive-card" className="report-section print-avoid-break" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--slate-blue-dark)', fontSize: '0.9rem' }}>
                  <FileText size={18} />
                  Final Report Package Archive
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                  Archive Document: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.finalReportArtifact.storedFileName}</span>
                </div>
                {!report.finalReportArtifact.canViewRawArchive && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
                    {report.finalReportArtifact.note || 'Raw archive file access is restricted to Finance Desk Administrators.'}
                  </div>
                )}
              </div>
              <div>
                <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#E6F4EA', color: '#137333', fontSize: '0.75rem', fontWeight: 700 }}>
                  VERIFIED ARCHIVE
                </span>
              </div>
            </div>
          )}

          {/* Signatures & Oversight Statement */}
          <div id="presbyter-signature-block" className="report-section print-avoid-break" style={{ marginTop: '3rem', borderTop: '1px solid var(--mist-blue-dark)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
            <div>
              <div>Prepared for: Grace and Praise Bangladeshi Church Presbyters & Board</div>
              <div>Authoritative Document Status: {report.badgeText}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid #94A3B8', width: '220px', marginBottom: '4px' }}></div>
              <div>Authorized Signatory / Pastor</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
