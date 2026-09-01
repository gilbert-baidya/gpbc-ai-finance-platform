import React, { useState } from 'react';
import TaxLetterPreview from './TaxLetterPreview';
import { FileText } from 'lucide-react';

/**
 * Example: Using TaxLetterPreview with API integration
 * 
 * This demonstrates how to use the new TaxLetterPreview component
 * that automatically fetches data from the API
 */
const TaxLetterPreviewExample = () => {
    const [showLetter, setShowLetter] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleViewLetter = () => {
        if (selectedMemberId) {
            setShowLetter(true);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Tax Letter Preview Demo</h2>

                {!showLetter ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Member ID
                                </label>
                                <input
                                    type="text"
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    placeholder="Enter Member ID (e.g., M001)"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Tax Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleViewLetter}
                                disabled={!selectedMemberId}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                <FileText size={20} />
                                View Tax Letter
                            </button>
                        </div>
                    </div>
                ) : (
                    <TaxLetterPreview
                        memberId={selectedMemberId}
                        year={selectedYear}
                        onClose={() => setShowLetter(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default TaxLetterPreviewExample;
