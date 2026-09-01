import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gasFetch } from '../../api/gasFetch';
import { successToast, errorToast } from '../../utils/toast';
import { Download, Loader, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import MemberSummaryCard from './MemberSummaryCard';
import LetterPreviewCard from './LetterPreviewCard';
import GPBCTaxLetter from './GPBCTaxLetter';
import './TaxLetterLayout.css';

let taxTotalLocked = false;
let taxTotalSource = null;

const taxState = Object.freeze({
    get locked() {
        return taxTotalLocked;
    },
    get source() {
        return taxTotalSource;
    }
});

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(value) || 0);
}

function debugTaxState() {
    console.log("[GPBC TAX STATE]", {
        locked: taxState.locked,
        source: taxState.source
    });
}

/**
 * TaxLetterLayout - Premium IRS Tax Letter Generator
 * Two-column smart financial assistant UI
 */
const TaxLetterLayout = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);
    const [taxLetterData, setTaxLetterData] = useState(null);
    const [taxTotal, setTaxTotal] = useState(null);
    const [memberHeader, setMemberHeader] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const loadRequestRef = useRef(0);
    const successTimerRef = useRef(null);
    const enableDocumentMode = () => {
        document.body.classList.add("document-mode");
    };
    const disableDocumentMode = () => {
        document.body.classList.remove("document-mode");
    };

    // Generate year options (current year back to 2020)
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let year = currentYear; year >= 2020; year--) {
        yearOptions.push(year);
    }

    // Load members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        if (!import.meta.env.DEV) return undefined;
        window.debugTaxState = debugTaxState;
        return () => {
            if (window.debugTaxState === debugTaxState) {
                delete window.debugTaxState;
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            document.body.classList.remove("document-mode");
        };
    }, []);

    useEffect(() => {
        if (showModal) {
            enableDocumentMode();
            return () => {
                disableDocumentMode();
            };
        }
        disableDocumentMode();
        return undefined;
    }, [showModal]);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await gasFetch("getMembers");
            setMembers(Array.isArray(res?.members) ? res.members : []);
        } catch (error) {
            errorToast("Failed to load members");
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const resetTaxLock = () => {
        taxTotalLocked = false;
        taxTotalSource = null;
    };

    const renderMemberHeader = (member) => {
        setMemberHeader(member || null);
    };

    const renderContributionTable = (contributions) => {
        setHistoryRows(Array.isArray(contributions) ? contributions : []);
    };

    const renderTaxTotal = (total, source = "IRS") => {
        if (taxTotalLocked) {
            console.warn("[GPBC GUARD] Tax total overwrite blocked", {
                attemptedSource: source,
                originalSource: taxTotalSource
            });
            return;
        }

        const numericTotal = Number(total) || 0;
        const el = document.querySelector("[data-tax-total]");
        if (el) {
            el.textContent = formatCurrency(numericTotal);
        }

        setTaxTotal(numericTotal);
        taxTotalLocked = true;
        taxTotalSource = source;

        console.log("[GPBC TAX LOCKED]", {
            total: numericTotal,
            source
        });
    };

    const loadTaxLetterData = async (memberId, year, requestId) => {
        const res = await gasFetch("getTaxLetterData", {
            memberId,
            year
        });

        if (!res?.success) {
            throw new Error("IRS API failed");
        }

        if (requestId !== loadRequestRef.current) {
            return res;
        }

        console.log("[GPBC TAX SOURCE] IRS", res.total);
        renderTaxTotal(res.total, "IRS_IMPORT_OR_CONTRIBUTIONS");
        renderMemberHeader(res.member);
        setTaxLetterData(res);

        return res;
    };

    const loadContributionHistory = async (memberId, year, requestId) => {
        const res = await gasFetch("getMemberYearlyContributions", {
            memberId,
            year
        });

        if (requestId !== loadRequestRef.current) {
            return res;
        }

        console.log("[GPBC HISTORY SOURCE]", res?.total);
        renderContributionTable(res?.contributions || []);

        return res;
    };

    const loadTaxPage = async (memberId, year, requestId) => {
        resetTaxLock();
        setTaxTotal(null);
        setTaxLetterData(null);
        setMemberHeader(null);
        setHistoryRows([]);

        const taxRes = await loadTaxLetterData(memberId, year, requestId);
        await loadContributionHistory(memberId, year, requestId);
        return taxRes;
    };

    const handleGenerateLetter = async () => {
        if (!selectedMemberId) {
            errorToast("Please select a member");
            return;
        }

        const requestId = loadRequestRef.current + 1;
        loadRequestRef.current = requestId;

        setGenerating(true);
        setShowSuccess(false);

        try {
            const res = await loadTaxPage(selectedMemberId, selectedYear, requestId);

            if (requestId !== loadRequestRef.current) {
                return;
            }
            setShowSuccess(true);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = setTimeout(() => setShowSuccess(false), 2000);
            successToast(`Tax letter loaded for ${res.member.FullName}`);
        } catch (error) {
            if (requestId !== loadRequestRef.current) {
                return;
            }
            errorToast(error?.message || "Unable to load tax data. Please retry.");
        } finally {
            if (requestId === loadRequestRef.current) {
                setGenerating(false);
            }
        }
    };

    const resetPreviewState = () => {
        loadRequestRef.current += 1;
        setTaxLetterData(null);
        setTaxTotal(null);
        setMemberHeader(null);
        setHistoryRows([]);
        setShowModal(false);
        disableDocumentMode();
        resetTaxLock();
    };

    const handleOpenFullLetter = () => {
        enableDocumentMode();
        setShowModal(true);
    };

    const handleCloseFullLetter = () => {
        setShowModal(false);
        disableDocumentMode();
    };

    const getHistoryRowDate = (row) => {
        return row?.Date || row?.date || row?.ContributionDate || row?.contributionDate || null;
    };

    const formatDateValue = (rawValue) => {
        if (!rawValue) return 'N/A';
        const date = new Date(rawValue);
        if (Number.isNaN(date.getTime())) return String(rawValue);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const latestHistoryDate = historyRows.reduce((latest, row) => {
        const rawDate = getHistoryRowDate(row);
        if (!rawDate) return latest;
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return latest;
        if (!latest || date > latest) return date;
        return latest;
    }, null);

    const safeMembers = Array.isArray(members) ? members : [];
    const selectedMember = safeMembers.find(m => m.MemberID === selectedMemberId);
    const memberForSummary = memberHeader || selectedMember;
    const hasTaxData = !!taxLetterData && taxTotal !== null;
    const hasZeroContributions = hasTaxData && taxTotal === 0;

    return (
        <div className="tax-letter-layout">
            <div className="tax-letter-container">
                {/* Page Header */}
                <div className="tax-letter-header">
                    <div className="tax-letter-title">
                        <div className="tax-letter-icon">
                            <Sparkles size={24} color="white" />
                        </div>
                        <div>
                            <h1>Tax Letter Generator</h1>
                            <p className="tax-letter-subtitle">
                                Generate IRS-compliant contribution statements
                            </p>
                        </div>
                    </div>
                </div>

                {/* Two-Column Layout */}
                <div className="tax-letter-grid">
                    {/* Left Column - Controls */}
                    <div className="tax-letter-controls">
                        {/* Selection Card */}
                        <div className="tax-selection-card">
                            <h2 className="tax-selection-title">
                                <div className="tax-selection-dot"></div>
                                Select Member & Year
                            </h2>

                            <div className="tax-selection-fields">
                                {/* Member Selection */}
                                <div className="tax-form-group">
                                    <label 
                                        htmlFor="memberSelector" 
                                        className="tax-form-label"
                                    >
                                        Member *
                                    </label>
                                    <select
                                        id="memberSelector"
                                        value={selectedMemberId}
                                        onChange={(e) => {
                                            setSelectedMemberId(e.target.value);
                                            resetPreviewState();
                                        }}
                                        disabled={loadingMembers || generating}
                                        className="tax-form-select"
                                        aria-label="Select member for tax letter"
                                    >
                                        <option value="">
                                            {loadingMembers ? 'Loading members...' : 'Choose a member...'}
                                        </option>
                                        {safeMembers.map(member => (
                                            <option key={member.MemberID} value={member.MemberID}>
                                                {member.FullName} ({member.MemberID})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Selection */}
                                <div className="tax-form-group">
                                    <label 
                                        htmlFor="yearSelector" 
                                        className="tax-form-label"
                                    >
                                        Tax Year *
                                    </label>
                                    <select
                                        id="yearSelector"
                                        value={selectedYear}
                                        onChange={(e) => {
                                            setSelectedYear(Number(e.target.value));
                                            resetPreviewState();
                                        }}
                                        disabled={generating}
                                        className="tax-form-select"
                                        aria-label="Select tax year"
                                    >
                                        {yearOptions.map(year => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerateLetter}
                                    disabled={!selectedMemberId || generating}
                                    className="tax-generate-button"
                                    aria-label="Generate tax letter"
                                >
                                    {generating ? (
                                        <>
                                            <Loader size={20} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            Generate Tax Letter
                                        </>
                                    )}
                                </button>

                                {/* TEMP: Navigate to Preview Page */}
                                <button
                                    onClick={() => navigate("/letters/preview", {
                                        state: {
                                            memberId: selectedMemberId,
                                            year: selectedYear
                                        }
                                    })}
                                    disabled={!selectedMemberId}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        background: '#F59E0B',
                                        color: 'white',
                                        fontWeight: '600',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    aria-label="Open preview page"
                                >
                                    🔍 TEMP: Open Preview Page
                                </button>

                                {!selectedMemberId && !generating && (
                                    <p className="tax-button-helper">
                                        Select a member and tax year to continue
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Member Summary Card */}
                        {memberForSummary && (
                            <MemberSummaryCard 
                                member={memberForSummary}
                                yearTotal={taxTotal}
                                lastContributionDate={latestHistoryDate ? formatDateValue(latestHistoryDate) : (taxLetterData?.lastDate || 'N/A')}
                                memberSince={memberForSummary.JoinDate}
                            />
                        )}

                        {/* Zero Contributions Warning */}
                        {hasZeroContributions && (
                            <div className="tax-warning-card">
                                <div className="tax-warning-content">
                                    <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <h4 className="tax-warning-title">
                                            No Contributions Found
                                        </h4>
                                        <p className="tax-warning-text">
                                            No contributions recorded for {memberForSummary?.FullName || 'this member'} in {selectedYear}.
                                        </p>
                                        <p className="tax-warning-hint">
                                            💡 Try selecting a different year or verify contribution records.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Animation */}
                        {showSuccess && (
                            <div className="tax-success-card">
                                <div className="tax-success-content">
                                    <CheckCircle2 size={24} color="#059669" />
                                    <div>
                                        <h4 className="tax-success-title">
                                            Letter Generated Successfully!
                                        </h4>
                                        <p className="tax-success-text">
                                            View the preview on the right →
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contribution History */}
                        {selectedMemberId && (
                            <div className="tax-history-card">
                                <h3 className="tax-history-title">
                                    Contribution History ({selectedYear})
                                </h3>
                                {historyRows.length > 0 ? (
                                    <div className="tax-history-table-wrap">
                                        <table className="tax-history-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Method</th>
                                                    <th className="tax-history-amount">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyRows.map((row, index) => {
                                                    const amount = Number(row?.Amount ?? row?.amount ?? 0) || 0;
                                                    return (
                                                        <tr key={row?.ContributionID || row?.id || `${index}-${amount}`}>
                                                            <td>{formatDateValue(getHistoryRowDate(row))}</td>
                                                            <td>{row?.ContributionType || row?.contributionType || 'General Offering'}</td>
                                                            <td>{row?.PaymentMethod || row?.paymentMethod || 'N/A'}</td>
                                                            <td className="tax-history-amount">{formatCurrency(amount)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="tax-history-empty">
                                        {hasTaxData ? 'No contribution rows returned for this year.' : 'Generate a tax letter to load history.'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Preview */}
                    <div className="tax-letter-controls">
                        <LetterPreviewCard 
                            hasData={hasTaxData}
                            total={taxTotal}
                            year={selectedYear}
                        />

                        {/* View Full Letter Button */}
                        {hasTaxData && (
                            <button
                                onClick={handleOpenFullLetter}
                                className="tax-view-button"
                            >
                                View Full Letter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Letter Modal */}
            {showModal && taxLetterData && hasTaxData && (
                <div className="tax-modal-overlay" onClick={handleCloseFullLetter}>
                    <div className="tax-modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
                        <GPBCTaxLetter data={{ ...taxLetterData, total: taxTotal }} />
                        <div className="tax-modal-footer">
                            <button
                                onClick={handleCloseFullLetter}
                                className="tax-modal-close"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxLetterLayout;
