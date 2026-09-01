import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { gasFetch } from '../api/gasFetch';
import { fetchTaxLetterData } from '../api/taxApi';
import TaxLetterPreview from './tax/TaxLetterPreview';
import { successToast, errorToast } from '../utils/toast';
import { FileText, Download, Loader, Eye, X } from 'lucide-react';

/**
 * TaxLetterGenerator Component
 * 
 * Production-ready component for generating IRS-style tax contribution letters
 * Uses real data from Google Apps Script API
 */
const TaxLetterGenerator = () => {
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);
    const [selectedTaxLetter, setSelectedTaxLetter] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [noContributions, setNoContributions] = useState(false);

    // Generate year options (current year back to 2024)
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let year = currentYear; year >= 2024; year--) {
        yearOptions.push(year);
    }

    // Load members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await gasFetch("getMembers");
            setMembers(
                Array.isArray(res?.members)
                    ? res.members
                    : []
            );
        } catch (error) {
            errorToast("Failed to load members");
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const generateTaxLetter = async () => {
        if (!selectedMemberId) {
            errorToast("Please select a member");
            return;
        }

        setGenerating(true);
        setNoContributions(false);
        setSelectedTaxLetter(null);

        try {
            // Fetch tax letter data from API using new taxApi service
            const res = await fetchTaxLetterData(selectedMemberId, selectedYear);

            if (!res.success) {
                throw new Error("Unable to load tax data. Please retry.");
            }

            // Check if there are any contributions
            if (res.total === 0 || !res.contributions || res.contributions.length === 0) {
                // Show warning toast instead of error
                errorToast(`No contributions found for selected year. Tax letter cannot be generated.`);
                setNoContributions(true);
                setSelectedTaxLetter(null);
                setGenerating(false);
                return;
            }

            // Store data for preview
            setSelectedTaxLetter(res);
            setNoContributions(false);

            // Generate PDF
            await buildPDF(res);
            
            successToast(`Tax letter generated for ${res.member.FullName}`);

        } catch (error) {
            errorToast("Unable to load tax data. Please retry.");
            setNoContributions(false);
        } finally {
            setGenerating(false);
        }
    };

    const buildPDF = async (data) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = 20;

        // Helper function to add text
        const addText = (text, x, y, options = {}) => {
            doc.setFont(options.font || 'times', options.style || 'normal');
            doc.setFontSize(options.size || 12);
            doc.text(text, x, y, options.align ? { align: options.align } : {});
        };

        // Header - Church Name
        addText(
            'Grace and Praise Bangladeshi Church',
            pageWidth / 2,
            yPosition,
            { font: 'times', style: 'bold', size: 16, align: 'center' }
        );
        yPosition += 10;

        // Add space for logo placeholder
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.rect(pageWidth / 2 - 15, yPosition, 30, 20, 'F');
        addText('[LOGO]', pageWidth / 2, yPosition + 12, { size: 10, align: 'center' });
        yPosition += 30;

        // Date
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        addText(`Date: ${today}`, margin, yPosition);
        yPosition += 15;

        // Salutation
        addText(`Dear ${data.member.FullName},`, margin, yPosition);
        yPosition += 15;

        // Opening paragraph
        addText(
            'Grace and Peace in the name of our Lord Jesus Christ.',
            margin,
            yPosition
        );
        yPosition += 15;

        addText(
            `Thank you for your faithful giving during tax year ${data.year}.`,
            margin,
            yPosition
        );
        yPosition += 15;

        // Total Contributions - Bold and larger
        addText(
            `Total Contributions: $${data.total.toFixed(2)}`,
            margin,
            yPosition,
            { style: 'bold', size: 14 }
        );
        yPosition += 20;

        // Tax deduction notice
        const maxWidth = pageWidth - (2 * margin);
        const line1 = 'Grace and Praise Bangladeshi Church is a registered nonprofit organization.';
        const line2 = 'No goods or services were provided in exchange for these contributions.';
        
        addText(line1, margin, yPosition);
        yPosition += 7;
        addText(line2, margin, yPosition);
        yPosition += 15;

        addText(
            'These contributions may be tax deductible to the extent allowed by law.',
            margin,
            yPosition
        );
        yPosition += 20;

        // Bible Verse Section
        addText('Bible Verse Section:', margin, yPosition, { style: 'bold' });
        yPosition += 10;

        const verse1 = '"Each of you should give what you have decided in your heart to give,';
        const verse2 = 'not reluctantly or under compulsion, for God loves a cheerful giver."';
        const verse3 = '— 2 Corinthians 9:7';

        addText(verse1, margin + 5, yPosition, { style: 'italic' });
        yPosition += 7;
        addText(verse2, margin + 5, yPosition, { style: 'italic' });
        yPosition += 7;
        addText(verse3, margin + 5, yPosition, { style: 'italic' });
        yPosition += 20;

        // Closing
        addText('Closing:', margin, yPosition, { style: 'bold' });
        yPosition += 10;
        addText('With blessings and gratitude,', margin, yPosition);
        yPosition += 7;
        addText('Grace and Praise Bangladeshi Church', margin, yPosition, { style: 'bold' });
        yPosition += 25;

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY = pageHeight - 30;

        doc.setDrawColor(0);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        addText(
            `EIN: ${data.church?.ein || 'XX-XXXXXXX'}`,
            pageWidth / 2,
            footerY,
            { size: 10, align: 'center' }
        );

        addText(
            data.church?.address || 'Church Address',
            pageWidth / 2,
            footerY + 7,
            { size: 10, align: 'center' }
        );

        // Save PDF
        const fileName = `GPBC_Tax_Letter_${data.member.FullName.replace(/\s+/g, '_')}_${data.year}.pdf`;
        doc.save(fileName);
    };

    const safeMembers = Array.isArray(members) ? members : [];
    const selectedMember = safeMembers.find(m => m.MemberID === selectedMemberId);

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Tax Letter Generator</h2>
                    <p className="text-sm text-gray-600">Generate IRS-style contribution letters</p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Member Selection */}
                <div>
                    <label htmlFor="memberSelect" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Member *
                    </label>
                    <select
                        id="memberSelect"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        disabled={loadingMembers || generating}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {loadingMembers ? 'Loading members...' : 'Select a member...'}
                        </option>
                        {safeMembers.map(member => (
                            <option key={member.MemberID} value={member.MemberID}>
                                {member.FullName} ({member.MemberID})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Year Selection */}
                <div>
                    <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Year *
                    </label>
                    <select
                        id="yearSelect"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        disabled={generating}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Member Info */}
                {selectedMember && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">
                            Selected: {selectedMember.FullName}
                        </p>
                        {selectedMember.Email && (
                            <p className="text-xs text-blue-700 mt-1">
                                {selectedMember.Email}
                            </p>
                        )}
                    </div>
                )}

                {/* Empty State Card - No Contributions */}
                {noContributions && selectedMember && (
                    <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-900">
                                    No Giving Recorded
                                </h3>
                            </div>
                        </div>
                        <p className="text-sm text-yellow-800 mt-2">
                            No contributions found for {selectedMember.FullName} for tax year {selectedYear}.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                            Tax letter cannot be generated without contribution data.
                        </p>
                    </div>
                )}

                {/* Generate Button */}
                <div className="flex gap-3">
                    <button
                        onClick={generateTaxLetter}
                        disabled={!selectedMemberId || generating || loadingMembers || noContributions}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {generating ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                {noContributions ? 'No Data Available' : 'Generate Tax Letter'}
                            </>
                        )}
                    </button>

                    {selectedTaxLetter && (
                        <button
                            onClick={() => setShowPreview(true)}
                            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        📋 What this generates:
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• IRS-compliant tax contribution letter</li>
                        <li>• Total contributions for selected year</li>
                        <li>• Church EIN and address</li>
                        <li>• Professional PDF format</li>
                        <li>• Includes 2 Corinthians 9:7 verse</li>
                    </ul>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && selectedTaxLetter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <TaxLetterPreview data={selectedTaxLetter} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxLetterGenerator;
