import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TaxLetterPreview from '../components/tax/TaxLetterPreview';
import { ArrowLeft } from 'lucide-react';

/**
 * LettersPreview Page
 * Standalone page for viewing tax letters
 */
const LettersPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { memberId, year } = location.state || {};

    useEffect(() => {
        if (!memberId || !year) {
            return undefined;
        }
        document.body.classList.add('document-mode');
        return () => {
            document.body.classList.remove('document-mode');
        };
    }, [memberId, year]);

    // If no state provided, redirect back to letters page
    if (!memberId || !year) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Missing Required Information</h2>
                <p>Please select a member and year from the Letters page.</p>
                <button
                    onClick={() => navigate('/letters')}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: 'var(--green)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Go to Letters Page
                </button>
            </div>
        );
    }

    return (
        <div className="letters-preview-page" style={{ minHeight: '100vh', background: 'var(--beige)' }}>
            {/* Back Button */}
            <div className="letters-preview-toolbar" style={{
                padding: '16px 24px',
                background: 'var(--white)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <button
                    onClick={() => navigate('/letters')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: 'var(--text)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--beige)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Letters
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Tax Year {year}
                </span>
            </div>

            {/* Tax Letter Preview */}
            <TaxLetterPreview
                memberId={memberId}
                year={year}
                onClose={() => navigate('/letters')}
            />
        </div>
    );
};

export default LettersPreview;
