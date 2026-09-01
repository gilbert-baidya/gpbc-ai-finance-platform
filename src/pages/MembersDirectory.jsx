import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, User, AlertCircle, FileText, Download, Award, X, Grid, List } from 'lucide-react';
import AddMemberModal from '../components/AddMemberModal';
import { getMemberYearlyStatement } from '../api/memberStatementApi';
import { buildStatementText } from '../utils/buildStatementText';
import { downloadStatementPdf } from '../utils/downloadPdf';
import { downloadAllStatementsZip } from '../utils/downloadAllStatementsZip';
import RoleGuard from '../auth/RoleGuard';
import { useAuth } from '../auth/AuthContext';
import { useAudit } from '../hooks/useAudit';
import { getMembers } from '../api/membersApi';
import { gasFetch } from '../api/gasFetch';
import { errorToast, successToast } from '../utils/toast';
import { getTaxLetter } from '../api/taxLetterApi';
import GPBCTaxLetter from '../components/tax/GPBCTaxLetter';
import { log, error as logError } from '../utils/logger';
import './MembersDirectory.css';

/**
 * Premium Members Directory Page
 * 
 * Features:
 * - Fetch members from API
 * - Search/filter functionality
 * - Skeleton loading UI
 * - Empty state message
 * - Premium church SaaS design
 */
const MembersDirectory = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [taxStatementData, setTaxStatementData] = useState(null);
    const [showTaxCertificate, setShowTaxCertificate] = useState(false);
    const [taxCertificateData, setTaxCertificateData] = useState(null);
    const [generatingTax, setGeneratingTax] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const { user } = useAuth();
    const { audit } = useAudit();

    // Load members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            log("Loading members from API...");
            const response = await getMembers();
            log("Members loaded:", response?.members?.length ?? 0);

            if (!response.success) {
                throw new Error("API failed");
            }

            setMembers(
                Array.isArray(response?.members)
                    ? response.members
                    : []
            );

        } catch (err) {
            logError("Members load failed:", err.message);
            const errorMsg = err.message || 'Failed to load members';
            setError(errorMsg);
            setMembers([]);
            errorToast(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Load tax certificate data for a member
    const loadTaxData = async (memberId, year = 2025) => {
        try {
            log(`Loading tax data for Member ID: ${memberId}, Year: ${year}`);
            
            const res = await gasFetch("getMemberYearlyContributions", {
                memberId,
                year
            });

            log("Tax data loaded successfully:", res?.success);

            if (res.success) {
                setTaxStatementData(res);
                return res;
            } else {
                throw new Error("Failed to load tax data");
            }
        } catch (err) {
            logError("Tax data load failed:", err.message);
            errorToast("Failed to load tax certificate data");
            setTaxStatementData(null);
            return null;
        }
    };

    // Filter members based on search term (using exact sheet headers)
    const safeMembers = Array.isArray(members) ? members : [];
    const filteredMembers = safeMembers.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        return (
            member.FullName?.toLowerCase().includes(searchLower) ||
            member.Email?.toLowerCase().includes(searchLower) ||
            member.Phone?.includes(searchTerm) ||
            member.Address?.toLowerCase().includes(searchLower)
        );
    });

    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Generate tax certificate handler
    const handleGenerateTaxCertificate = async (member) => {
        if (!member || !member.MemberID) {
            logError("Missing MemberID", member?.FullName || 'Unknown');
            errorToast("Member ID missing");
            return;
        }

        try {
            setGeneratingTax(true);
            const year = new Date().getFullYear();
            log(`Generating tax certificate for Member ID: ${member.MemberID}, Year: ${year}`);

            const res = await getTaxLetter(member.MemberID, year);

            if (!res || !res.success) {
                throw new Error("Failed to generate tax certificate");
            }

            log("Tax certificate generated successfully");

            setTaxCertificateData(res);
            setShowTaxCertificate(true);

            // Log audit event
            audit(
                "GENERATE_TAX_CERTIFICATE",
                "TAX_CERTIFICATE",
                member.MemberID,
                {
                    memberName: member.FullName,
                    year,
                    format: "IRS_LETTER"
                }
            );

            successToast(`Tax certificate loaded for ${member.FullName}`);

        } catch (err) {
            logError("Tax Certificate Error:", err.message);
            errorToast("Failed to generate tax certificate. Please try again.");
        } finally {
            setGeneratingTax(false);
        }
    };

    // Generate statement handler
    const generateStatement = async (member) => {
        if (!member || !member.MemberID) {
            logError("Missing MemberID", member?.FullName || 'Unknown');
            alert("Member ID missing");
            return;
        }

        try {
            const year = new Date().getFullYear();
            log(`Generating statement for Member ID: ${member.MemberID}, Year: ${year}`);

            // Use loadTaxData function
            const res = await loadTaxData(member.MemberID, year);

            if (!res || !res.success) {
                throw new Error("Failed to generate statement");
            }

            log("Statement generated successfully");

            const text = buildStatementText(res);
            downloadStatementPdf(
                text,
                `GPBC_${member.FullName.replace(/\s+/g, '_')}_${year}.pdf`
            );

            // Log audit event
            audit(
                "GENERATE_MEMBER_STATEMENT",
                "MEMBER_STATEMENT",
                member.MemberID,
                {
                    memberName: member.FullName,
                    year,
                    format: "PDF"
                }
            );

            successToast(`Statement generated for ${member.FullName}`);

        } catch (err) {
            logError("Statement Error:", err.message);
            errorToast("Failed to generate statement. Please try again.");
        }
    };

    return (
        <div className="members-directory-container">
            {/* Header */}
            <div className="members-header">
                <div className="header-content">
                    <h1 className="page-title">Members Directory</h1>
                    <p className="page-subtitle">
                        {loading ? 'Loading members...' : `${members.length} total members`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <RoleGuard roles={["Treasurer", "Admin"]}>
                        <button
                            className="btn btn-outline"
                            onClick={async () => {
                                try {
                                    const year = new Date().getFullYear();
                                    await downloadAllStatementsZip(members, year, user?.name, user?.role);
                                } catch (err) {
                                    logError("Bulk download error:", err.message);
                                    alert('Error generating bulk statements');
                                }
                            }}
                            disabled={loading || members.length === 0}
                        >
                            <Download size={20} />
                            Download All Statements (ZIP)
                        </button>
                    </RoleGuard>
                    {members.length > 0 && (
                        <button
                            style={{ zIndex: 50, position: "relative" }}
                            onClick={() => {
                                setShowAddModal(true);
                            }}
                            className="add-member-button"
                        >
                            <Plus size={20} />
                            Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar + View Toggle */}
            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <Search size={20} className="search-icon" />
                    <input
                        id="memberSearch"
                        type="text"
                        placeholder="Search by name, email, role, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        aria-label="Search members"
                    />
                </div>
                <div className="view-toggle">
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>Failed to load members: {error}</span>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="members-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="member-card skeleton">
                            <div className="member-avatar skeleton-avatar"></div>
                            <div className="member-info">
                                <div className="skeleton-line skeleton-name"></div>
                                <div className="skeleton-line skeleton-role"></div>
                            </div>
                            <div className="member-details">
                                <div className="skeleton-line skeleton-contact"></div>
                                <div className="skeleton-line skeleton-contact"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredMembers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <User size={48} />
                    </div>
                    <h3 className="empty-title">
                        {searchTerm ? 'No members found' : 'No members yet'}
                    </h3>
                    <p className="empty-subtitle">
                        {searchTerm 
                            ? 'Try adjusting your search criteria' 
                            : 'Get started by adding your first member'}
                    </p>
                    {!searchTerm && members.length === 0 && (
                        <button 
                            className="add-member-button"
                            onClick={() => {
                                setShowAddModal(true);
                            }}
                        >
                            <Plus size={20} />
                            Add First Member
                        </button>
                    )}
                </div>
            )}

            {/* Members Grid/List */}
            {!loading && filteredMembers.length > 0 && (
                <div className={viewMode === 'grid' ? 'members-grid-compact' : 'members-list'}>
                    {filteredMembers.map(member => (
                        <div key={member.MemberID || member.MemberId || member.id} className={viewMode === 'grid' ? 'member-card-compact' : 'member-list-item'}>
                            {/* Avatar */}
                            <div className="member-avatar-compact">
                                {getInitials(member.FullName)}
                            </div>

                            {/* Member Info */}
                            <div className="member-info-compact">
                                <div className="member-header-compact">
                                    <h3 className="member-name-compact">{member.FullName}</h3>
                                    <span className={`status-badge-compact ${member.ActiveStatus ? 'active' : 'inactive'}`}>
                                        {member.ActiveStatus ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="member-meta-compact">
                                    <span className="member-role-compact">{member.FamilyName || 'Member'}</span>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="member-details-compact">
                                <div className="detail-row-compact">
                                    <Phone size={12} />
                                    <span>{member.Phone || 'N/A'}</span>
                                </div>
                                <div className="detail-row-compact">
                                    <Mail size={12} />
                                    <span className="truncate">{member.Email || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Action Pills */}
                            <div className="member-actions-compact">
                                <button
                                    className="action-pill action-pill-primary"
                                    onClick={() => handleGenerateTaxCertificate(member)}
                                    disabled={generatingTax}
                                    title="Generate Tax Certificate"
                                >
                                    <Award size={14} />
                                    Tax
                                </button>
                                <button
                                    className="action-pill action-pill-outline"
                                    onClick={() => generateStatement(member)}
                                    title="Generate Statement"
                                >
                                    <FileText size={14} />
                                    Stmt
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <AddMemberModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={async () => {
                        setShowAddModal(false);
                        await loadMembers();
                    }}
                />
            )}

            {/* Tax Certificate Modal */}
            {showTaxCertificate && taxCertificateData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => {
                                setShowTaxCertificate(false);
                                setTaxCertificateData(null);
                            }}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <GPBCTaxLetter data={taxCertificateData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersDirectory;
