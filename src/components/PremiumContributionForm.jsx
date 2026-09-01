import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { successToast, errorToast } from '../utils/toast';
import { DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { gasFetch } from '../api/gasFetch';
import { apiPost } from '../api/httpClient';
import { log, error } from '../utils/logger';
import './PremiumContributionForm.css';

/**
 * Premium Church Finance Contribution Form
 * 
 * Features:
 * - Currency masked amount input
 * - Modern ministry SaaS styling
 * - Loading states with disabled inputs
 * - Success/error toast notifications
 * - Auto-reset after successful submission
 * - Mobile responsive design
 */
export const PremiumContributionForm = () => {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [formData, setFormData] = useState({
        memberId: '',
        amount: '',
        contributionType: 'General Offering',
        serviceType: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: ''
    });

    // Load members from Google Apps Script
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            log("Loading members from API...");
            const res = await gasFetch("getMembers");
            log("Members loaded:", res?.members?.length ?? 0);
            setMembers(
                Array.isArray(res?.members)
                    ? res.members
                    : []
            );
        } catch (err) {
            error("Members load failed:", err.message);
            errorToast("Failed to load members. Please refresh the page.");
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

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
    const serviceTypes = ['Sunday Morning', 'Sunday Evening', 'Wednesday Night', 'Special Event', 'Online'];
    const paymentMethods = ['Cash', 'Check', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment'];

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Currency masking for amount
        if (name === 'amount') {
            // Remove non-numeric characters except decimal
            const numericValue = value.replace(/[^0-9.]/g, '');
            // Ensure only one decimal point
            const parts = numericValue.split('.');
            const maskedValue = parts.length > 2 
                ? parts[0] + '.' + parts.slice(1).join('')
                : numericValue;
            
            setFormData(prev => ({ ...prev, [name]: maskedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Format amount for display
    const formatCurrency = (value) => {
        if (!value) return '';
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Validate form
    const validateForm = () => {
        if (!formData.memberId) {
            errorToast('Please select a member');
            return false;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errorToast('Please enter a valid amount');
            return false;
        }
        if (!formData.contributionType) {
            errorToast('Please select a contribution type');
            return false;
        }
        if (!formData.serviceType) {
            errorToast('Please select a service type');
            return false;
        }
        if (!formData.paymentMethod) {
            errorToast('Please select a payment method');
            return false;
        }
        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            memberId: '',
            amount: '',
            contributionType: 'General Offering',
            serviceType: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: '',
            notes: ''
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Prepare payload
            const payload = {
                memberId: formData.memberId,
                amount: parseFloat(formData.amount),
                contributionType: formData.contributionType,
                serviceType: formData.serviceType,
                date: formData.date,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || ''
            };

            // Submit to API
            await apiPost('addContribution', payload);

            // Success
            successToast('Contribution recorded successfully! 🎉');
            resetForm();

        } catch (error) {
            // Error
            errorToast(error.message || 'Failed to record contribution');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-contribution-form-container">
            <div className="form-card">
                {/* Header */}
                <div className="form-header">
                    <h2 className="form-title">Record Contribution</h2>
                    <p className="form-subtitle">Enter giving information for the selected member</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="contribution-form">
                    {/* Member Selection */}
                    <div className="form-group">
                        <label htmlFor="memberId" className="form-label">
                            Member *
                        </label>
                        <select
                            id="memberId"
                            name="memberId"
                            value={formData.memberId}
                            onChange={handleChange}
                            disabled={loading || loadingMembers}
                            className="form-select"
                            required
                        >
                            <option value="">{loadingMembers ? "Loading members..." : "Select a member..."}</option>
                            {Array.isArray(members) && members.map(member => (
                                <option key={member.MemberID} value={member.MemberID}>
                                    {member.FullName} ({member.MemberID})
                                </option>
                            ))}
                            <option value="GUEST">Guest / Visitor</option>
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div className="form-group">
                        <label htmlFor="amount" className="form-label">
                            <DollarSign size={16} />
                            Amount *
                        </label>
                        <div className="currency-input-wrapper">
                            <span className="currency-symbol">$</span>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                disabled={loading}
                                className="form-input currency-input"
                                required
                            />
                        </div>
                        {formData.amount && (
                            <p className="currency-display">
                                ${formatCurrency(formData.amount)}
                            </p>
                        )}
                    </div>

                    {/* Contribution Type */}
                    <div className="form-group">
                        <label htmlFor="contributionType" className="form-label">
                            Contribution Type *
                        </label>
                        <Select
                            inputId="contributionType"
                            options={contributionTypeOptions}
                            value={contributionTypeOptions.find(o => o.value === formData.contributionType)}
                            onChange={(opt) => setFormData(prev => ({ ...prev, contributionType: opt.value }))}
                            isDisabled={loading}
                            className="form-select-react"
                            placeholder="Select contribution type..."
                        />
                    </div>

                    {/* Service Type */}
                    <div className="form-group">
                        <label htmlFor="serviceType" className="form-label">
                            Service Type *
                        </label>
                        <select
                            id="serviceType"
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            disabled={loading}
                            className="form-select"
                            required
                        >
                            <option value="">Select service type...</option>
                            {serviceTypes.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="form-group">
                        <label htmlFor="date" className="form-label">
                            <Calendar size={16} />
                            Date *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            disabled={loading}
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="form-group">
                        <label htmlFor="paymentMethod" className="form-label">
                            <CreditCard size={16} />
                            Payment Method *
                        </label>
                        <select
                            id="paymentMethod"
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            disabled={loading}
                            className="form-select"
                            required
                        >
                            <option value="">Select payment method...</option>
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes Textarea */}
                    <div className="form-group full-width">
                        <label htmlFor="notes" className="form-label">
                            <FileText size={16} />
                            Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional information..."
                            disabled={loading}
                            className="form-textarea"
                            rows="4"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                'Record Contribution'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PremiumContributionForm;
