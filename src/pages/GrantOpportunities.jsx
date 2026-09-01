import React, { useState } from 'react';
import './GrantOpportunities.css';
import { useGrantOpportunities, useGrantApplicationDraft } from '../hooks/usePhase6GlobalIntelligence';
import { useTenant } from '../context/TenantContext';
import {
  Award, Search, Filter, DollarSign, Calendar, Target, FileText,
  Loader, RefreshCw, Download, TrendingUp, AlertCircle, CheckCircle,
  Zap, Info, ExternalLink, Clock
} from 'lucide-react';
import { successToast, errorToast } from '../utils/toast';

/**
 * GRANT OPPORTUNITIES DASHBOARD
 * Phase 6: Grant Discovery and Intelligence Engine
 * 
 * Shows:
 * - Top matching grants with success probability
 * - Grant application deadlines and timelines
 * - Auto-generated grant budget templates
 * - Application status tracking
 */
const GrantOpportunities = () => {
  const { tenant } = useTenant();
  const grants = useGrantOpportunities(tenant?.id);
  const draftGenerator = useGrantApplicationDraft(tenant?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'food' | 'education' | 'outreach' | 'security'
  const [filterAmount, setFilterAmount] = useState('all'); // 'all' | '0-10k' | '10k-50k' | '50k+'
  const [filterDeadline, setFilterDeadline] = useState('all'); // 'all' | 'urgent' | '30days' | '60days'
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const handleGenerateDraft = async (grantId) => {
    try {
      await draftGenerator.generateDraft(grantId);
      setShowDraftModal(true);
      successToast('Grant application draft generated');
    } catch (error) {
      errorToast('Failed to generate grant draft');
    }
  };

  const handleRefresh = async () => {
    try {
      await grants.refresh();
      successToast('Grant opportunities refreshed');
    } catch (error) {
      errorToast('Failed to refresh grant opportunities');
    }
  };

  // Filter grants based on search and filters
  const filteredGrants = grants.data?.topMatches?.filter(grant => {
    // Search filter
    if (searchTerm && !grant.grantName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filterCategory !== 'all' && grant.category !== filterCategory) {
      return false;
    }

    // Amount filter
    if (filterAmount !== 'all') {
      const amount = grant.maxAmount || 0;
      if (filterAmount === '0-10k' && amount > 10000) return false;
      if (filterAmount === '10k-50k' && (amount < 10000 || amount > 50000)) return false;
      if (filterAmount === '50k+' && amount < 50000) return false;
    }

    // Deadline filter
    if (filterDeadline !== 'all') {
      const daysUntilDeadline = grant.daysUntilDeadline || 999;
      if (filterDeadline === 'urgent' && daysUntilDeadline > 14) return false;
      if (filterDeadline === '30days' && daysUntilDeadline > 30) return false;
      if (filterDeadline === '60days' && daysUntilDeadline > 60) return false;
    }

    return true;
  }) || [];

  if (grants.loading) {
    return (
      <div className="grant-opportunities-loading">
        <Loader size={48} className="animate-spin" />
        <p>Loading grant opportunities...</p>
      </div>
    );
  }

  if (grants.error) {
    return (
      <div className="grant-opportunities-error">
        <AlertCircle size={48} color="#ef4444" />
        <h3>Unable to Load Grant Opportunities</h3>
        <p>{grants.error}</p>
        <button onClick={handleRefresh} className="grant-btn-primary">
          <RefreshCw size={20} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grant-opportunities-dashboard">
      {/* Header */}
      <div className="grant-header">
        <div className="grant-header-content">
          <div className="grant-header-icon">
            <Award size={32} color="white" />
          </div>
          <div>
            <h1 className="grant-title">Grant Opportunities</h1>
            <p className="grant-subtitle">AI-Powered Grant Discovery & Application Intelligence</p>
          </div>
        </div>
        <div className="grant-header-actions">
          <button onClick={handleRefresh} className="grant-btn-secondary">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grant-stats-bar">
        <div className="grant-stat">
          <Award size={24} />
          <div>
            <div className="grant-stat-label">Total Matches</div>
            <div className="grant-stat-value">{grants.data?.topMatches?.length || 0}</div>
          </div>
        </div>
        <div className="grant-stat">
          <DollarSign size={24} />
          <div>
            <div className="grant-stat-label">Total Potential Funding</div>
            <div className="grant-stat-value">
              ${(grants.data?.totalPotentialFunding || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="grant-stat">
          <TrendingUp size={24} />
          <div>
            <div className="grant-stat-label">Avg Success Rate</div>
            <div className="grant-stat-value">
              {grants.data?.avgSuccessProbability || 0}%
            </div>
          </div>
        </div>
        <div className="grant-stat">
          <Clock size={24} />
          <div>
            <div className="grant-stat-label">Urgent Deadlines</div>
            <div className="grant-stat-value">
              {grants.data?.topMatches?.filter(g => g.daysUntilDeadline <= 14).length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grant-filters-container">
        <div className="grant-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search grant opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="grant-search-input"
          />
        </div>

        <div className="grant-filters">
          <div className="grant-filter-group">
            <Filter size={16} />
            <span>Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="grant-filter-select"
            >
              <option value="all">All Categories</option>
              <option value="food">Food Programs</option>
              <option value="education">Education</option>
              <option value="outreach">Community Outreach</option>
              <option value="security">Security/Safety</option>
              <option value="youth">Youth Ministry</option>
              <option value="facility">Facility Improvements</option>
            </select>
          </div>

          <div className="grant-filter-group">
            <span>Amount:</span>
            <select
              value={filterAmount}
              onChange={(e) => setFilterAmount(e.target.value)}
              className="grant-filter-select"
            >
              <option value="all">All Amounts</option>
              <option value="0-10k">$0 - $10,000</option>
              <option value="10k-50k">$10,000 - $50,000</option>
              <option value="50k+">$50,000+</option>
            </select>
          </div>

          <div className="grant-filter-group">
            <span>Deadline:</span>
            <select
              value={filterDeadline}
              onChange={(e) => setFilterDeadline(e.target.value)}
              className="grant-filter-select"
            >
              <option value="all">All Deadlines</option>
              <option value="urgent">Urgent (14 days)</option>
              <option value="30days">Within 30 Days</option>
              <option value="60days">Within 60 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grant Opportunities List */}
      <div className="grant-opportunities-list">
        {filteredGrants.length === 0 ? (
          <div className="grant-empty">
            <Info size={48} color="#94a3b8" />
            <p>No grant opportunities match your filters</p>
          </div>
        ) : (
          filteredGrants.map((grant, idx) => (
            <GrantOpportunityCard
              key={idx}
              grant={grant}
              onGenerateDraft={handleGenerateDraft}
              onSelectGrant={setSelectedGrant}
            />
          ))
        )}
      </div>

      {/* Grant Details Modal */}
      {selectedGrant && (
        <GrantDetailsModal
          grant={selectedGrant}
          onClose={() => setSelectedGrant(null)}
          onGenerateDraft={handleGenerateDraft}
        />
      )}

      {/* Draft Application Modal */}
      {showDraftModal && draftGenerator.data && (
        <GrantDraftModal
          draft={draftGenerator.data}
          onClose={() => setShowDraftModal(false)}
        />
      )}

      {/* AI Disclaimer Banner */}
      <div className="grant-ai-banner">
        <Zap size={24} />
        <div>
          <strong>AI Grant Intelligence:</strong> Grant matches are generated using AI analysis 
          of your church profile, ministry focus areas, and success probability scoring. 
          All application drafts require human review before submission. Never auto-submit applications.
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const GrantOpportunityCard = ({ grant, onGenerateDraft, onSelectGrant }) => {
  const getSuccessColor = (probability) => {
    if (probability >= 70) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  };

  const getDeadlineUrgency = (days) => {
    if (days <= 14) return 'urgent';
    if (days <= 30) return 'soon';
    return 'normal';
  };

  return (
    <div className="grant-opportunity-card">
      <div className="grant-card-header">
        <div className="grant-card-title">
          <Award size={24} color="#f59e0b" />
          <h3>{grant.grantName}</h3>
          {grant.isNew && <span className="grant-new-badge">NEW</span>}
        </div>
        <div className={`grant-success-badge ${getSuccessColor(grant.successProbability)}`}>
          {grant.successProbability || 0}% Match
        </div>
      </div>

      <div className="grant-card-body">
        <div className="grant-info-grid">
          <div className="grant-info-item">
            <DollarSign size={16} />
            <span>Max Amount:</span>
            <strong>${(grant.maxAmount || 0).toLocaleString()}</strong>
          </div>
          <div className="grant-info-item">
            <Calendar size={16} />
            <span>Deadline:</span>
            <strong className={`deadline-${getDeadlineUrgency(grant.daysUntilDeadline)}`}>
              {grant.applicationDeadline || 'Open'} ({grant.daysUntilDeadline} days)
            </strong>
          </div>
          <div className="grant-info-item">
            <Target size={16} />
            <span>Category:</span>
            <strong>{grant.category || 'N/A'}</strong>
          </div>
        </div>

        <div className="grant-description">
          {grant.description || 'No description available'}
        </div>

        {grant.matchReasons && grant.matchReasons.length > 0 && (
          <div className="grant-match-reasons">
            <h4>Why This Grant Matches:</h4>
            <ul>
              {grant.matchReasons.map((reason, idx) => (
                <li key={idx}>
                  <CheckCircle size={14} />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grant-card-actions">
        <button
          onClick={() => onSelectGrant(grant)}
          className="grant-btn-secondary"
        >
          <Info size={18} />
          View Details
        </button>
        <button
          onClick={() => onGenerateDraft(grant.grantId)}
          className="grant-btn-primary"
        >
          <FileText size={18} />
          Generate Draft Application
        </button>
        {grant.grantWebsite && (
          <a
            href={grant.grantWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="grant-btn-link"
          >
            <ExternalLink size={18} />
            View Grant Website
          </a>
        )}
      </div>
    </div>
  );
};

const GrantDetailsModal = ({ grant, onClose, onGenerateDraft }) => (
  <div className="grant-modal-overlay" onClick={onClose}>
    <div className="grant-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="grant-modal-header">
        <h2>{grant.grantName}</h2>
        <button onClick={onClose} className="grant-modal-close">&times;</button>
      </div>
      <div className="grant-modal-body">
        <div className="grant-detail-section">
          <h3>Grant Information</h3>
          <div className="grant-detail-grid">
            <div><strong>Maximum Amount:</strong> ${(grant.maxAmount || 0).toLocaleString()}</div>
            <div><strong>Deadline:</strong> {grant.applicationDeadline || 'Open'}</div>
            <div><strong>Category:</strong> {grant.category || 'N/A'}</div>
            <div><strong>Success Probability:</strong> {grant.successProbability || 0}%</div>
          </div>
        </div>

        <div className="grant-detail-section">
          <h3>Description</h3>
          <p>{grant.description || 'No description available'}</p>
        </div>

        {grant.eligibilityCriteria && (
          <div className="grant-detail-section">
            <h3>Eligibility Criteria</h3>
            <ul>
              {grant.eligibilityCriteria.map((criteria, idx) => (
                <li key={idx}>{criteria}</li>
              ))}
            </ul>
          </div>
        )}

        {grant.requiredDocuments && (
          <div className="grant-detail-section">
            <h3>Required Documents</h3>
            <ul>
              {grant.requiredDocuments.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="grant-modal-footer">
        <button onClick={onClose} className="grant-btn-secondary">Close</button>
        <button onClick={() => onGenerateDraft(grant.grantId)} className="grant-btn-primary">
          Generate Draft Application
        </button>
      </div>
    </div>
  </div>
);

const GrantDraftModal = ({ draft, onClose }) => (
  <div className="grant-modal-overlay" onClick={onClose}>
    <div className="grant-modal-content grant-draft-modal" onClick={(e) => e.stopPropagation()}>
      <div className="grant-modal-header">
        <h2>Draft Grant Application</h2>
        <button onClick={onClose} className="grant-modal-close">&times;</button>
      </div>
      <div className="grant-modal-body">
        <div className="grant-draft-warning">
          <AlertCircle size={20} />
          <span>This is an AI-generated draft. Review and edit before submission.</span>
        </div>

        {draft.programDescription && (
          <div className="grant-draft-section">
            <h3>Program Description</h3>
            <p>{draft.programDescription}</p>
          </div>
        )}

        {draft.budgetTemplate && (
          <div className="grant-draft-section">
            <h3>Budget Template</h3>
            <table className="grant-budget-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {draft.budgetTemplate.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.category}</td>
                    <td>${item.amount.toLocaleString()}</td>
                    <td>{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {draft.impactMetrics && (
          <div className="grant-draft-section">
            <h3>Impact Metrics</h3>
            <ul>
              {draft.impactMetrics.map((metric, idx) => (
                <li key={idx}>{metric}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="grant-modal-footer">
        <button onClick={onClose} className="grant-btn-secondary">Close</button>
        <button onClick={() => window.print()} className="grant-btn-primary">
          <Download size={18} />
          Download Draft
        </button>
      </div>
    </div>
  </div>
);

export default GrantOpportunities;
