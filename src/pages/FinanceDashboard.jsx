import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeDollarSign,
  CalendarDays, CircleDollarSign, ClipboardCheck, FileWarning,
  FolderKanban, HandCoins, Inbox, Landmark, ReceiptText, RefreshCw,
  ShieldCheck
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { financeApi } from '../api/financeApi';
import { auditApi } from '../api/auditApi';
import './FinanceDashboard.css';

const RESOLVED_STATUSES = new Set(['Reviewed', 'Cleared', 'Reconciled', 'Resolved']);
const CHART_COLORS = ['#557489', '#7b9ea8', '#c5a880', '#8d9b8f', '#c88769'];

const transactionType = (record) => record.transactionType || record.type || 'Transaction';
const transactionDate = (record) => record.transactionDate || record.date || '';
const transactionFund = (record) => record.fundId || record.fund || 'General';
const isIncome = (record) => record.accountingImpact === 'INCOME' || record.direction === 'INCOME';
const isRecognizedExpense = (record) => {
  if (record.accountingImpact === 'EXPENSE') return true;
  if (record.direction !== 'EXPENSE' || record.accountingImpact === 'SETTLEMENT') return false;
  return !/reimbursement/i.test(transactionType(record));
};
const sum = (records, predicate) => records.filter(predicate).reduce((total, record) => total + Number(record.amount || 0), 0);
const money = (value, exact = false) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: exact ? 2 : 0,
    maximumFractionDigits: exact ? 2 : 0
  }).format(Number(value));
};
const count = (value) => value === null || value === undefined ? '—' : String(value);
const asDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthlyActivity = (transactions) => {
  if (!transactions) return [];
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, month: date.toLocaleDateString('en-US', { month: 'short' }), income: 0, expenses: 0 };
  });
  const byMonth = new Map(months.map((month) => [month.key, month]));
  transactions.forEach((record) => {
    const date = asDate(transactionDate(record));
    const month = date && byMonth.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (!month) return;
    if (isIncome(record)) month.income += Number(record.amount || 0);
    if (isRecognizedExpense(record)) month.expenses += Number(record.amount || 0);
  });
  return months.some((month) => month.income || month.expenses) ? months : [];
};

const breakdown = (transactions, predicate, label) => {
  if (!transactions) return [];
  const totals = new Map();
  transactions.filter(predicate).forEach((record) => {
    const key = label(record) || 'Uncategorized';
    totals.set(key, (totals.get(key) || 0) + Number(record.amount || 0));
  });
  return [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
};

const pendingReimbursementAmount = (records) => {
  if (!records) return null;
  return records.reduce((total, record) => {
    const remaining = record.remainingReimbursable ?? (
      Number(record.totalPurchaseAmount || 0) - Number(record.totalReimbursedAmount || 0) -
      Number(record.totalPersonallyAbsorbed ?? record.personallyAbsorbedAmount ?? 0)
    );
    return total + Math.max(0, Number(remaining || 0));
  }, 0);
};

const EmptyState = ({ icon, title, description }) => (
  <div className="fd-empty">
    {React.createElement(icon, { size: 22, 'aria-hidden': true })}
    <div><strong>{title}</strong>{description && <span>{description}</span>}</div>
  </div>
);

const Metric = ({ icon, label, value, detail, tone = 'neutral', unavailable = false }) => (
  <article className={`fd-metric fd-metric--${tone}`}>
    <div className="fd-metric__heading"><span>{label}</span>{React.createElement(icon, { size: 18, 'aria-hidden': true })}</div>
    <div className={`fd-metric__value ${unavailable ? 'is-unavailable' : ''}`}>{value}</div>
    <p>{detail}</p>
  </article>
);

const BreakdownCard = ({ title, data, emptyText }) => (
  <article className="fd-panel fd-breakdown">
    <h2>{title}</h2>
    {data.length === 0 ? <EmptyState icon={CircleDollarSign} title={emptyText} /> : (
      <div className="fd-pie-layout">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={43} outerRadius={68} paddingAngle={2}>
              {data.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => money(value, true)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="fd-chart-legend">
          {data.map((entry, index) => (
            <div key={entry.name}>
              <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span>{entry.name}</span><strong>{money(entry.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    )}
  </article>
);

const initialData = {
  transactions: null, reimbursements: null, receipts: null,
  projects: null, auditIssues: null, auditHealthScore: null
};

const FinanceDashboard = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [failedSources, setFailedSources] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const requests = [
      ['transactions', financeApi.getTransactions()],
      ['reimbursements', financeApi.getReimbursements()],
      ['receipts', financeApi.getReceipts()],
      ['projects', financeApi.getCapitalProjects()],
      ['auditIssues', auditApi.getAuditIssues()],
      ['auditHealthScore', auditApi.getAuditSummary()]
    ];
    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const next = { ...initialData };
    const failures = [];
    results.forEach((result, index) => {
      const source = requests[index][0];
      if (result.status === 'rejected') {
        failures.push(source);
      } else if (source === 'transactions') next.transactions = result.value.transactions || [];
      else if (source === 'reimbursements') next.reimbursements = result.value.reimbursements || [];
      else if (source === 'receipts') next.receipts = result.value.receipts || [];
      else if (source === 'projects') next.projects = result.value.projects || [];
      else if (source === 'auditIssues') next.auditIssues = result.value.issues || [];
      else next.auditHealthScore = result.value.healthScore || null;
    });
    setData(next);
    setFailedSources(failures);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const openIssues = data.auditIssues?.filter((issue) => !RESOLVED_STATUSES.has(issue.status)) ?? null;
  const totalIncome = data.transactions ? sum(data.transactions, isIncome) : null;
  const recognizedExpenses = data.transactions ? sum(data.transactions, isRecognizedExpense) : null;
  const netPosition = totalIncome === null ? null : totalIncome - recognizedExpenses;
  const sundayOffering = data.transactions ? sum(data.transactions, (record) => isIncome(record) && /sunday offering|offering/i.test(transactionType(record))) : null;
  const designatedDonations = data.transactions ? sum(data.transactions, (record) => isIncome(record) && (
    /designated|capital project donation/i.test(transactionType(record)) || transactionFund(record) !== 'General'
  )) : null;
  const pendingReimbursements = pendingReimbursementAmount(data.reimbursements);
  const partialReimbursements = data.reimbursements ? data.reimbursements.filter((record) => /partial/i.test(record.status || '')).length : null;
  const missingReceipts = openIssues ? openIssues.filter((issue) => issue.ruleId === 'RULE-RCP-001' || /missing receipt/i.test(`${issue.title || ''} ${issue.description || ''}`)).length :
    data.transactions ? data.transactions.filter((record) => record.receiptStatus === 'Needs Receipt').length : null;
  const documentationIssues = openIssues ? openIssues.filter((issue) => /receipt|documentation|evidence|payee|explanation/i.test(`${issue.title || ''} ${issue.description || ''}`)).length :
    data.receipts ? data.receipts.filter((receipt) => receipt.matchStatus !== 'Matched').length : null;
  const activity = monthlyActivity(data.transactions);
  const incomeSources = breakdown(data.transactions, isIncome, transactionType);
  const expenseCategories = breakdown(data.transactions, isRecognizedExpense, (record) => record.category || 'Uncategorized');
  const recentTransactions = data.transactions ? [...data.transactions].sort((a, b) => (asDate(transactionDate(b))?.getTime() || 0) - (asDate(transactionDate(a))?.getTime() || 0)).slice(0, 7) : [];
  const projects = data.projects?.filter((project) => !['Completed', 'Closed'].includes(project.status)).slice(0, 4) ?? [];
  const priorityIssues = openIssues ? [...openIssues].sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.severity] ?? 4) - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.severity] ?? 4)).slice(0, 5) : [];
  const auditScore = typeof data.auditHealthScore?.score === 'number' ? data.auditHealthScore.score : null;

  return (
    <div className="finance-dashboard animate-fade-in">
      <header className="fd-page-header">
        <div><h1>Dashboard</h1><p>Financial overview for Grace and Praise Bangladeshi Church</p></div>
        <button type="button" className="fd-refresh" onClick={loadDashboard} disabled={loading} title="Refresh dashboard data">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} aria-hidden="true" /><span>Refresh</span>
        </button>
      </header>

      {failedSources.includes('transactions') && (
        <div className="fd-connection" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <div><strong>Finance data connection unavailable</strong><span>Local interface preview is active. Live finance data will appear after the GPBC finance sandbox is connected.</span></div>
        </div>
      )}

      <section aria-label="Primary financial indicators">
        <div className="fd-primary-grid">
          <Metric icon={ArrowUpRight} label="Total Income" value={money(totalIncome)} detail={totalIncome === null ? 'Not available yet' : 'Recorded church income'} tone="positive" unavailable={totalIncome === null} />
          <Metric icon={ArrowDownRight} label="Recognized Expenses" value={money(recognizedExpenses)} detail={recognizedExpenses === null ? 'Not available yet' : 'Excludes reimbursement settlements'} tone="expense" unavailable={recognizedExpenses === null} />
          <Metric icon={Landmark} label="Net Position" value={money(netPosition)} detail={netPosition === null ? 'Not available yet' : 'Income less recognized expenses'} tone={netPosition !== null && netPosition < 0 ? 'expense' : 'neutral'} unavailable={netPosition === null} />
          <article className="fd-metric fd-metric--audit">
            <div className="fd-metric__heading"><span>Audit Health Score</span><ShieldCheck size={18} aria-hidden="true" /></div>
            {auditScore === null ? <><div className="fd-score-empty">Not calculated yet</div><p>Connect the finance data source or run the Audit Center to calculate the score.</p></> :
              <><div className="fd-metric__value">{auditScore}<small>/100</small></div><p>{data.auditHealthScore.scoreTier || 'Calculated from active audit findings'}</p></>}
          </article>
        </div>
        <div className="fd-secondary-grid">
          <Metric icon={CalendarDays} label="Sunday Offering" value={money(sundayOffering)} detail={sundayOffering === null ? 'Not available yet' : 'Recorded offering income'} unavailable={sundayOffering === null} />
          <Metric icon={HandCoins} label="Designated Donations" value={money(designatedDonations)} detail={designatedDonations === null ? 'Not available yet' : 'Purpose-restricted income'} unavailable={designatedDonations === null} />
          <Metric icon={ReceiptText} label="Missing Receipts" value={count(missingReceipts)} detail={missingReceipts === null ? 'Not available yet' : 'Open documentation gaps'} tone="warning" unavailable={missingReceipts === null} />
          <Metric icon={BadgeDollarSign} label="Pending Reimbursements" value={money(pendingReimbursements)} detail={pendingReimbursements === null ? 'Not available yet' : 'Remaining eligible amount'} tone="warning" unavailable={pendingReimbursements === null} />
        </div>
      </section>

      <section className="fd-section">
        <SectionHeading kicker="Financial Activity" title="Monthly Income vs Expenses" />
        <article className="fd-panel fd-activity">
          {activity.length === 0 ? <EmptyState icon={CircleDollarSign} title="No transactions available yet." description="Connect the GPBC finance sandbox or add your first transaction to begin." /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activity} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e9eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} width={54} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => money(value, true)} cursor={{ fill: '#f5f7f7' }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="income" name="Income" fill="#557489" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Recognized expenses" fill="#c88769" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </section>

      <section className="fd-section">
        <SectionHeading kicker="Breakdown" title="Where funds come from and go" />
        <div className="fd-two-column">
          <BreakdownCard title="Income Sources" data={incomeSources} emptyText="No income activity to display." />
          <BreakdownCard title="Expense Categories" data={expenseCategories} emptyText="No expense activity to display." />
        </div>
      </section>

      <section className="fd-section">
        <SectionHeading kicker="Reimbursements & Documentation" title="Items awaiting completion" link="/reimbursements" linkText="View reimbursements" />
        <div className="fd-control-grid">
          <Metric icon={BadgeDollarSign} label="Pending Reimbursements" value={money(pendingReimbursements)} detail="Remaining eligible amount" unavailable={pendingReimbursements === null} />
          <Metric icon={ClipboardCheck} label="Partial Reimbursements" value={count(partialReimbursements)} detail="Partially settled records" unavailable={partialReimbursements === null} />
          <Metric icon={ReceiptText} label="Missing Receipts" value={count(missingReceipts)} detail="Evidence still required" unavailable={missingReceipts === null} />
          <Metric icon={FileWarning} label="Documentation Issues" value={count(documentationIssues)} detail="Open support gaps" unavailable={documentationIssues === null} />
        </div>
      </section>

      <section className="fd-section">
        <SectionHeading kicker="Capital Projects" title="Active designated initiatives" link="/capital-projects" linkText="View projects" />
        <article className="fd-panel">
          {projects.length === 0 ? <EmptyState icon={FolderKanban} title={data.projects === null ? 'Capital project data is not available yet.' : 'No capital projects have been added yet.'} /> : (
            <div className="fd-project-list">{projects.map((project) => {
              const name = project.projectName || project.name || 'Untitled project';
              const donations = Number(project.designatedDonationsReceived || 0);
              const expenses = Number(project.expensesPaid || 0);
              const remaining = Number(project.remainingDesignatedBalance ?? donations - expenses);
              return <div className="fd-project-row" key={project.projectId || name}>
                <div className="fd-project-name"><strong>{name}</strong><Status>{project.status || 'Active'}</Status></div>
                <ProjectValue label="Donations received" value={money(donations, true)} />
                <ProjectValue label="Expenses paid" value={money(expenses, true)} />
                <ProjectValue label="Remaining designated" value={money(remaining, true)} />
              </div>;
            })}</div>
          )}
        </article>
      </section>

      <section className="fd-section">
        <SectionHeading kicker="Recent Transactions" title="Latest ledger activity" link="/transactions" linkText="View all transactions" />
        <article className="fd-panel fd-table-panel">
          {recentTransactions.length === 0 ? <EmptyState icon={Inbox} title={data.transactions === null ? 'Transaction data is not available yet.' : 'No transactions available yet.'} description={data.transactions === null ? undefined : 'Connect the GPBC finance sandbox or add your first transaction to begin.'} /> : (
            <>
              <div className="fd-table-scroll desktop-table-view">
                <table className="fd-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Payee / Donor</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>{recentTransactions.map((record) => <tr key={record.transactionId}>
                    <td>{transactionDate(record) || '—'}</td><td>{transactionType(record)}</td><td>{record.payeeOrPayer || '—'}</td>
                    <td>{record.category || transactionFund(record)}</td><td className={isIncome(record) ? 'is-positive' : 'is-negative'}>{isIncome(record) ? '+' : '−'}{money(record.amount, true)}</td>
                    <td><Status>{record.reconciliationStatus || 'Unreconciled'}</Status></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="mobile-card-view fd-mobile-tx-cards">
                {recentTransactions.map((record) => (
                  <div key={record.transactionId} className="fd-mobile-tx-card">
                    <div className="fd-mobile-tx-header">
                      <div className="fd-mobile-tx-payee">
                        <strong>{record.payeeOrPayer || '—'}</strong>
                        <small>{transactionType(record)} • {transactionDate(record) || '—'}</small>
                      </div>
                      <div className={`fd-mobile-tx-amt ${isIncome(record) ? 'is-positive' : 'is-negative'}`}>
                        {isIncome(record) ? '+' : '−'}{money(record.amount, true)}
                      </div>
                    </div>
                    <div className="fd-mobile-tx-footer">
                      <span className="fd-mobile-tx-cat">{record.category || transactionFund(record)}</span>
                      <Status>{record.reconciliationStatus || 'Unreconciled'}</Status>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="fd-section fd-section--last">
        <SectionHeading kicker="Audit Attention" title="Issues requiring review" link="/audit" linkText="View Audit Center" action />
        <div className="fd-audit-layout">
          <div className="fd-audit-counts">
            {[
              ['Critical', openIssues?.filter((issue) => issue.severity === 'CRITICAL').length ?? null],
              ['High', openIssues?.filter((issue) => issue.severity === 'HIGH').length ?? null],
              ['Missing Receipt', missingReceipts],
              ['Pending Match', openIssues?.filter((issue) => issue.status === 'Pending Match').length ?? null]
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{count(value)}</strong></div>)}
          </div>
          <article className="fd-panel">
            {priorityIssues.length === 0 ? <EmptyState icon={ShieldCheck} title={data.auditIssues === null ? 'Audit issue data is not available yet.' : 'No audit issues to display.'} /> : (
              <div className="fd-issue-list">{priorityIssues.map((issue) => <div key={issue.auditIssueId || `${issue.ruleId}-${issue.entityId}`}>
                <span className={`fd-severity fd-severity--${(issue.severity || 'medium').toLowerCase()}`}>{issue.severity || 'Review'}</span>
                <div><strong>{issue.title || issue.description || 'Audit issue'}</strong><span>{issue.entityId || issue.ruleId || issue.status}</span></div>
              </div>)}</div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
};

const SectionHeading = ({ kicker, title, link, linkText, action = false }) => <div className="fd-section-heading">
  <div><span>{kicker}</span><h2>{title}</h2></div>
  {link && <Link to={link} className={action ? 'fd-action-link' : 'fd-text-link'}>{linkText}</Link>}
</div>;
const Status = ({ children }) => <span className="fd-status">{children}</span>;
const ProjectValue = ({ label, value }) => <div className="fd-project-value"><span>{label}</span><strong>{value}</strong></div>;

export default FinanceDashboard;