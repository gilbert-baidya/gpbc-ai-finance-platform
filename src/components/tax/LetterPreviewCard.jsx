import React from 'react';
import { FileCheck, Shield, Building } from 'lucide-react';
import './LetterPreviewCard.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value) || 0);
};

/**
 * LetterPreviewCard - Live preview of tax letter details
 * Shows church info, IRS verification, and letter status
 */
const LetterPreviewCard = ({ hasData, total, year }) => {
  return (
    <div className="letter-preview-card">
      {/* Header with Official Letterhead */}
      <div className="letter-preview-header">
        <img
          src="/04_Letters_Templates/GPBC_Letterhead_Official.png"
          alt="GPBC Official Letterhead"
          className="letter-preview-letterhead-image"
        />
      </div>

      {/* IRS Trust Section */}
      <div className="letter-irs-section">
        <div className="letter-irs-content">
          <div className="letter-irs-badge">
            <Shield size={20} color="white" />
          </div>
          <div>
            <div className="letter-irs-verified">
              <FileCheck size={16} color="#047857" />
              <span className="letter-irs-text">
                IRS 501(c)(3) Verified
              </span>
            </div>
            <p className="letter-irs-ein">
              EIN: 39-4558295
            </p>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="letter-preview-body">
        {hasData ? (
          <div>
            <div className="letter-preview-year">
              <Building size={20} />
              <span>Tax Year {year}</span>
            </div>
            
            <div className="letter-total-box">
              <div className="letter-total-label">
                Total Tax-Deductible Contributions
              </div>
              <div className="letter-total-amount" data-tax-total>
                {formatCurrency(total)}
              </div>
            </div>

            <div className="letter-features-list">
              <p>✓ No goods or services exchanged</p>
              <p>✓ IRS compliant format</p>
              <p>✓ Includes 2 Corinthians 9:7</p>
              <p>✓ Official church signature</p>
            </div>
          </div>
        ) : (
          <div className="letter-empty-state">
            <FileCheck className="letter-empty-icon" size={64} />
            <p className="letter-empty-text">
              Select a member to preview tax letter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterPreviewCard;
