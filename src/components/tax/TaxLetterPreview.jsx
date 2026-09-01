import React, { useState, useEffect } from 'react';
import { Loader, Printer, AlertCircle } from 'lucide-react';
import { gasFetch } from '../../api/gasFetch';
import { errorToast } from '../../utils/toast';
import TaxLetterTemplate from './TaxLetterTemplate';
import './TaxLetterPreview.css';

/**
 * TaxLetterPreview - IRS Tax Letter Display Component
 * Fetches and displays official tax contribution letter using gasFetch
 */
const TaxLetterPreview = ({ memberId, year, onClose, data }) => {
    const [loading, setLoading] = useState(!data);
    const [letterData, setLetterData] = useState(data || null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) {
            setLetterData(data);
            setLoading(false);
            setError(null);
            return;
        }

        if (memberId && year) {
            fetchLetterData(memberId, year);
        }
    }, [memberId, year, data]);

    const fetchLetterData = async (nextMemberId, nextYear) => {
        setLoading(true);
        setError(null);

        try {
            const data = await gasFetch('getTaxLetterData', {
                memberId: nextMemberId,
                year: nextYear
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to load tax letter data');
            }

            setLetterData(data);
        } catch (err) {
            setError(err.message);
            errorToast('Failed to load tax letter');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="tax-letter-loading">
                <Loader size={48} className="animate-spin" />
                <p>Loading tax letter...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tax-letter-error">
                <AlertCircle size={48} color="#DC2626" />
                <h3>Unable to Load Tax Letter</h3>
                <p>{error}</p>
                {onClose && (
                    <button onClick={onClose} className="tax-letter-close-btn">
                        Close
                    </button>
                )}
            </div>
        );
    }

    if (!letterData) {
        return null;
    }

    const { contributions, total } = letterData;
    const activeYear = year || letterData.year || new Date().getFullYear();
    const hasNoContributions = !contributions || contributions.length === 0 || Number(total) === 0;

    return (
        <div className="tax-letter-preview-container">
            {/* Print Button - Hidden in print mode */}
            <div className="tax-letter-actions no-print print-controls">
                <button onClick={handlePrint} className="tax-letter-print-btn">
                    <Printer size={20} />
                    Print / Save as PDF
                </button>
                {onClose && (
                    <button onClick={onClose} className="tax-letter-close-btn">
                        Close
                    </button>
                )}
            </div>

            {/* Warning Banner for Zero Contributions */}
            {hasNoContributions && (
                <div className="tax-letter-warning no-print">
                    <AlertCircle size={20} />
                    <span>No contributions recorded for {activeYear}. Letter shows $0.00 total.</span>
                </div>
            )}

            <TaxLetterTemplate data={letterData} />
        </div>
    );
};

export default TaxLetterPreview;
