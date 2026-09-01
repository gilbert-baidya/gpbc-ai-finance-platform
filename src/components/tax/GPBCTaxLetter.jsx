import { Printer } from 'lucide-react';
import TaxLetterTemplate from './TaxLetterTemplate';
import './TaxLetterPreview.css';

/**
 * GPBC Official IRS Tax Certificate Letter
 * Uses the shared official template for preview + print PDF consistency
 */
export default function GPBCTaxLetter({ data }) {
  if (!data?.member) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tax-letter-preview-container">
      <TaxLetterTemplate data={data} />
      <div className="tax-letter-actions no-print print-controls" style={{ marginTop: '24px' }}>
        <button
          onClick={handlePrint}
          className="tax-letter-print-btn"
        >
          <Printer size={20} />
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
