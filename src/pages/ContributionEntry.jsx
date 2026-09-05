import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useContributionSubmit } from '../hooks/useContributionSubmit';
import { useDashboardData } from '../hooks/useDashboardData';
import { successToast, errorToast } from '../utils/toast';
import { Calendar, User, DollarSign, FileText, CheckCircle, Loader } from 'lucide-react';
import { gasFetch } from '../api/gasFetch';
import { log, error } from '../utils/logger';

const contributionTypeOptions = [
    { label: "General Offering", value: "General Offering" },
    { label: "Tithe", value: "Tithe" },
    { label: "Mission Fund", value: "Mission Fund" },
    { label: "Local Charity", value: "Local Charity" },
    { label: "Building Maintenance", value: "Building Maintenance" },
    { label: "Admin Cost", value: "Admin Cost" },
    { label: "Bills Fund", value: "Bills Fund" },
    { label: "SoCalNetwork", value: "SoCalNetwork" },
    { label: "UMO", value: "UMO" },
    { label: "Others", value: "Others" }
];

const ContributionEntry = () => {
    const { refresh: refreshDashboard } = useDashboardData();
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [formData, setFormData] = useState({
        memberId: '',
        date: new Date().toISOString().split('T')[0],
        serviceType: 'Sunday Service',
        contributionType: 'General Offering',
        amount: '',
        paymentMethod: 'Cash',
        notes: ''
    });

    // Load members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoadingMembers(true);
            log("Loading members for dropdown...");

            const res = await gasFetch("getMembers");

            if (res.success) {
                setMembers(
                    Array.isArray(res?.members)
                        ? res.members
                        : []
                );
                log("Members loaded:", res.members?.length);
            } else {
                error("Failed to load members");
                setMembers([]);
            }

        } catch (err) {
            error("Failed loading members:", err.message);
            errorToast("Failed to load members");
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const { submitContribution, loading } = useContributionSubmit(() => {
        successToast('Contribution successfully recorded');
        setFormData(prev => ({ ...prev, amount: '', notes: '' }));
        refreshDashboard();
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await submitContribution(formData);
        if (!result.success) {
            errorToast(result.error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-wine">Sacred Contribution Entry</h1>
                <p className="text-muted">Register member stewardship with precision and care.</p>
            </header>

            <form onSubmit={handleSubmit} className="glass-panel p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="form-group">
                        <label className="label">Member / Donor</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <select
                                name="memberId"
                                value={formData.memberId}
                                onChange={handleChange}
                                className="input pl-10 cursor-pointer"
                                required
                                disabled={loadingMembers}
                            >
                                <option value="">
                                    {loadingMembers ? 'Loading members...' : 'Select Member...'}
                                </option>
                                {Array.isArray(members) && members.map(member => (
                                    <option key={member.MemberID} value={member.MemberID}>
                                        {member.FullName} ({member.MemberID})
                                    </option>
                                ))}
                                <option value="guest">Guest / Visitor</option>
                            </select>
                        </div>
                        {(!loadingMembers && (!Array.isArray(members) || members.length === 0)) && (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                                No saved member directory is configured. You can continue using the available manual entry fields.
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Amount (USD)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                step="0.01"
                                className="input pl-10 text-xl font-bold text-wine"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Service Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="input pl-10"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Contribution Type</label>
                            <Select
                                options={contributionTypeOptions}
                                value={contributionTypeOptions.find(o => o.value === formData.contributionType)}
                                onChange={(opt) => setFormData({ ...formData, contributionType: opt.value })}
                                className="react-select-container"
                                placeholder="Select contribution type..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="input">
                                <option>Cash</option>
                                <option>Check</option>
                                <option>Online</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Notes / Memo</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-muted" size={18} />
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="input pl-10 min-h-[120px] resize-none"
                                placeholder="Service notes, check number, or specific intention..."
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader className="animate-spin" size={20} />
                            ) : (
                                <CheckCircle className="group-hover:scale-110 transition-transform" size={20} />
                            )}
                            {loading ? 'Processing...' : 'Complete Entry'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ContributionEntry;
