import React, { useState, useRef, useEffect } from 'react';
import { Calendar, DollarSign, FileText, CheckCircle, AlertCircle, Loader, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import Select from 'react-select';
import { createContribution } from '../api/gpbc';
import { gasFetch } from '../api/gasFetch';
import events, { DATA_REFRESH_EVENT } from '../utils/events';
import AntigravityMotion from '../components/AntigravityMotion';
import MemberSearchCombobox from '../components/MemberSearchCombobox';
import '../components/MemberSearchCombobox.css';
import './SmartContributionForm.css';

const SERVICE_TYPES = ['Sunday Service', 'Friday Prayer', 'Youth Service', 'Special Event', 'Online'];
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
const PAYMENT_METHODS = ['Cash', 'Check', 'Online / Zelle', 'Card'];

const STEPS = [
    { id: 1, name: 'Member', label: 'Select Member' },
    { id: 2, name: 'Amount', label: 'Enter Amount' },
    { id: 3, name: 'Context', label: 'Add Context' },
    { id: 4, name: 'Confirm', label: 'Review & Submit' }
];

const SmartContributionForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [showCelebration, setShowCelebration] = useState(false);
    const [errors, setErrors] = useState({});

    const amountInputRef = useRef(null);
    const contributionTypeRef = useRef(null);

    const [formData, setFormData] = useState({
        memberId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        serviceType: 'Sunday Service',
        contributionType: 'General Offering',
        paymentMethod: 'Cash',
        notes: ''
    });

    // Load members from Google Apps Script
    useEffect(() => {
        const fetchMembers = async () => {
            setMembersLoading(true);
            try {
                log("Loading members from API...");
                const res = await gasFetch("getMembers");
                log("Members loaded:", res?.members?.length ?? 0);
                setMembers(
                    Array.isArray(res?.members)
                        ? res.members
                        : []
                );
            } catch (e) {
                error("Error loading members:", e.message);
                setMembers([]);
            } finally {
                setMembersLoading(false);
            }
        };
        fetchMembers();
    }, []);

    // Auto focus on step change
    useEffect(() => {
        if (currentStep === 2 && amountInputRef.current) {
            amountInputRef.current.focus();
        } else if (currentStep === 3 && contributionTypeRef.current) {
            contributionTypeRef.current.focus();
        }
    }, [currentStep]);

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.memberId) {
                newErrors.memberId = 'Please select a member';
            }
        } else if (step === 2) {
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                newErrors.amount = 'Please enter a valid amount';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setErrors({});
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const result = await createContribution(formData);

            if (result && result.status !== 'error') {
                // Success celebration
                setShowCelebration(true);
                events.emit(DATA_REFRESH_EVENT);

                // Reset after celebration
                setTimeout(() => {
                    setShowCelebration(false);
                    setCurrentStep(1);
                    setFormData({
                        memberId: '',
                        date: new Date().toISOString().split('T')[0],
                        amount: '',
                        serviceType: 'Sunday Service',
                        contributionType: 'General Offering',
                        paymentMethod: 'Cash',
                        notes: ''
                    });
                }, 3000);
            } else {
                throw new Error(result?.message || "Failed to record");
            }
        } catch (err) {
            console.error("Submission error:", err);
            setErrors({ submit: "Unable to connect to finance server. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const safeMembers = Array.isArray(members) ? members : [];
    const selectedMember = safeMembers.find(m => m.MemberID === formData.memberId);

    return (
        <div className="smart-contribution-container">
            {/* Success Celebration Overlay */}
            {showCelebration && (
                <div className="celebration-overlay">
                    <div className="celebration-content">
                        <div className="celebration-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h2 className="celebration-title">Contribution Recorded!</h2>
                        <p className="celebration-message">Successfully saved ${formData.amount}</p>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                    </div>
                </div>
            )}

            <div className="form-header">
                <h1 className="form-title">New Contribution</h1>
                <p className="form-subtitle">Smart guided entry for tithes, offerings, and donations</p>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
                {STEPS.map((step, index) => (
                    <div key={step.id} className="step-item-wrapper">
                        <div 
                            className={`step-item ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                            onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                        >
                            <div className="step-circle">
                                {currentStep > step.id ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <span>{step.id}</span>
                                )}
                            </div>
                            <span className="step-label">{step.name}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            <AntigravityMotion variant="fade-up" delay={100}>
                <form onSubmit={handleSubmit} className="smart-form glass-panel antigravity-panel">
                    
                    {/* Step 1: Member Selection */}
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h3 className="step-title">
                                <Sparkles size={20} />
                                Who is contributing today?
                            </h3>
                            <MemberSearchCombobox
                                members={members}
                                value={formData.memberId}
                                onChange={(value) => handleChange('memberId', value)}
                                loading={membersLoading}
                                error={errors.memberId}
                            />
                        </div>
                    )}

                    {/* Step 2: Amount */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h3 className="step-title">
                                <DollarSign size={20} />
                                How much is being contributed?
                            </h3>
                            <div className="amount-input-group">
                                <span className="currency-symbol">$</span>
                                <input
                                    id="contributionAmount"
                                    ref={amountInputRef}
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleChange('amount', e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className={`amount-input ${errors.amount ? 'error' : ''}`}
                                />
                            </div>
                            {errors.amount && <div className="field-error">{errors.amount}</div>}

                            <div className="date-field">
                                <label htmlFor="contributionDate">Date</label>
                                <div className="date-input-wrapper">
                                    <Calendar size={18} />
                                    <input
                                        id="contributionDate"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleChange('date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Context */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <h3 className="step-title">
                                <FileText size={20} />
                                Add contribution details
                            </h3>
                            
                            <div className="context-grid">
                                <div className="context-field">
                                    <label htmlFor="contributionTypeSelect">Contribution Type</label>
                                    <Select
                                        inputId="contributionTypeSelect"
                                        options={contributionTypeOptions}
                                        value={contributionTypeOptions.find(o => o.value === formData.contributionType)}
                                        onChange={(opt) => handleChange('contributionType', opt.value)}
                                        className="context-select-react"
                                        placeholder="Select type..."
                                    />
                                </div>

                                <div className="context-field">
                                    <label htmlFor="paymentMethod">Payment Method</label>
                                    <select
                                        id="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                                        className="context-select"
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <div className="context-field full-width">
                                    <label htmlFor="serviceType">Service Context</label>
                                    <select
                                        id="serviceType"
                                        value={formData.serviceType}
                                        onChange={(e) => handleChange('serviceType', e.target.value)}
                                        className="context-select"
                                    >
                                        {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="context-field full-width">
                                    <label htmlFor="contributionNotes">Notes (Optional)</label>
                                    <textarea
                                        id="contributionNotes"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder="Check number, memo, or additional comments..."
                                        rows="3"
                                        className="context-textarea"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {currentStep === 4 && (
                        <div className="form-step">
                            <h3 className="step-title">
                                <CheckCircle size={20} />
                                Review and confirm
                            </h3>
                            
                            <div className="confirmation-summary">
                                <div className="summary-row highlight">
                                    <span className="summary-label">Member</span>
                                    <span className="summary-value">{selectedMember?.name || 'Guest'}</span>
                                </div>
                                <div className="summary-row highlight">
                                    <span className="summary-label">Amount</span>
                                    <span className="summary-value amount">${formData.amount}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Type</span>
                                    <span className="summary-value">{formData.contributionType}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Payment</span>
                                    <span className="summary-value">{formData.paymentMethod}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Service</span>
                                    <span className="summary-value">{formData.serviceType}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Date</span>
                                    <span className="summary-value">{new Date(formData.date).toLocaleDateString()}</span>
                                </div>
                                {formData.notes && (
                                    <div className="summary-row full-width">
                                        <span className="summary-label">Notes</span>
                                        <span className="summary-value">{formData.notes}</span>
                                    </div>
                                )}
                            </div>

                            {errors.submit && (
                                <div className="submit-error">
                                    <AlertCircle size={20} />
                                    {errors.submit}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="form-navigation">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn btn-secondary"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}
                        
                        <div className="nav-spacer"></div>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="btn btn-primary antigravity-button"
                            >
                                Next
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary antigravity-button"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        Save Contribution
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </AntigravityMotion>
        </div>
    );
};

export default SmartContributionForm;
