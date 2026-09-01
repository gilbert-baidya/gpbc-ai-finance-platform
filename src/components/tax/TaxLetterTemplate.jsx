import React, { useEffect } from 'react';
import './TaxLetterTemplate.css';

const LETTERHEAD_BG_IMAGE = '/assets/gpbc-letterhead-2026.png';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function buildMemberAddressLine(member) {
  if (!member?.City && !member?.State && !member?.Zip) {
    return null;
  }
  return [member.City, member.State, member.Zip].filter(Boolean).join(', ').replace(', ,', ',');
}

export default function TaxLetterTemplate({ data }) {
  if (!data?.member) {
    return null;
  }

  useEffect(() => {
    console.log('[GPBC TEMPLATE ACTIVE]', 'OFFICIAL_LETTERHEAD_V2026');
    const handleBeforePrint = () => {
      console.log('[GPBC PRINT MODE ACTIVE]');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const member = data.member;
  const year = Number(data.year) || new Date().getFullYear();
  const total = Number(data.total || 0);
  const dateText = formatDate(new Date());
  const addressLine = buildMemberAddressLine(member);

  useEffect(() => {
    const applyTightMode = () => {
      const safeArea = document.querySelector('.print-safe-area');
      if (!safeArea) return;

      if (safeArea.scrollHeight > safeArea.clientHeight) {
        safeArea.classList.add('irs-tight-mode');
      } else {
        safeArea.classList.remove('irs-tight-mode');
      }
    };

    const rafId = requestAnimationFrame(applyTightMode);
    window.addEventListener('resize', applyTightMode);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', applyTightMode);
    };
  }, [data, total, year]);

  return (
    <div className="print-page gpbc-letter-paper letter-container">
      <img
        className="letterhead-bg"
        src={LETTERHEAD_BG_IMAGE}
        alt="Grace and Praise Bangladeshi Church Official Letterhead"
      />

      <div className="print-safe-area gpbc-letter-body irs-text">
        <p className="gpbc-letter-date">{dateText}</p>

        <div className="gpbc-letter-recipient">
          <p className="gpbc-strong">{member.FullName || 'Member'}</p>
          {member.Address && <p>{member.Address}</p>}
          {addressLine && <p>{addressLine}</p>}
        </div>

        <p>Dear {member.FullName || 'Member'},</p>

        <p>
          Thank you for your faithful giving during tax year <span className="gpbc-strong">{year}</span>. Grace and Praise
          Bangladeshi Church is a registered 501(c)(3) nonprofit organization. No goods or services were provided in
          exchange for these contributions.
        </p>

        <p>
          This letter serves as documentation for your tax-deductible charitable contributions for the tax year ending
          December 31, {year}.
        </p>

        <div className="total-box">
          <div className="label">Total Tax-Deductible Contributions</div>
          <div className="amount">{formatCurrency(total)}</div>
        </div>

        <p>
          Please retain this letter with your tax records. If you have any questions regarding your contributions, please
          contact our church office.
        </p>

        <div className="gpbc-verse-box verse-box">
          <p className="gpbc-verse-text">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for
            God loves a cheerful giver."
          </p>
          <p className="gpbc-verse-ref">- 2 Corinthians 9:7 (NIV)</p>
        </div>

        <p>We are grateful for your partnership in ministry and pray God's continued blessings upon you and your family.</p>

        <div className="gpbc-signature">
          <p>In Christ's Service,</p>
          <p className="gpbc-strong">GPBC Finance Department</p>
          <p>Grace and Praise Bangladeshi Church</p>
        </div>
      </div>
    </div>
  );
}
