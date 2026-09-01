import React from 'react';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import './MemberSummaryCard.css';

/**
 * MemberSummaryCard - Smart member preview after selection
 * Shows key member info and contribution summary
 */
const MemberSummaryCard = ({ member, yearTotal, lastContributionDate, memberSince }) => {
  if (!member) return null;

  return (
    <div className="member-summary-card">
      <div className="member-summary-content">
        <div className="member-avatar">
          {member.FullName?.charAt(0) || 'M'}
        </div>
        <div className="member-info">
          <h3 className="member-name">
            {member.FullName}
          </h3>
          <p className="member-email">
            {member.Email || 'No email on file'}
          </p>
          
          <div className="member-stats-grid">
            <div className="member-stat">
              <Calendar size={16} color="#2563EB" />
              <div>
                <div className="member-stat-label">Member Since</div>
                <div className="member-stat-value">
                  {memberSince || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="member-stat">
              <TrendingUp size={16} color="#059669" />
              <div>
                <div className="member-stat-label">Last Gift</div>
                <div className="member-stat-value">
                  {lastContributionDate || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {yearTotal !== null && (
            <div className="member-total-section">
              <div className="member-total-row">
                <span className="member-total-label">Year Total</span>
                <div className="member-total-amount">
                  <DollarSign size={20} />
                  {parseFloat(yearTotal || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberSummaryCard;
