import { useState } from 'react';
import { UserPlus, Mail, Phone, MapPin, Calendar, Hash } from 'lucide-react';
import { addMember } from '../api/gpbcApi';
import { successToast, errorToast } from '../utils/toast';
import './AddMemberForm.css';

export default function AddMemberForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    familyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    language: 'English',
    envelopeNumber: '',
    joinDate: new Date().toISOString().split('T')[0],
    activeStatus: true,
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addMember(formData);

      if (result.success) {
        successToast(`Member added successfully! ID: ${result.memberId}`);
        
        // Reset form
        setFormData({
          fullName: '',
          familyName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          language: 'English',
          envelopeNumber: '',
          joinDate: new Date().toISOString().split('T')[0],
          activeStatus: true,
          notes: ''
        });
      } else {
        errorToast(result.error || 'Failed to add member');
      }

    } catch (error) {
      console.error('Add Member Error:', error);
      errorToast(error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-form-container">
      <div className="form-header">
        <UserPlus className="form-icon" />
        <h2 className="form-title">Add New Member</h2>
      </div>

      <form onSubmit={handleSubmit} className="add-member-form">
        {/* Personal Information */}
        <div className="form-section">
          <h3 className="section-heading">Personal Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-input"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="familyName">
                Family Name
              </label>
              <input
                type="text"
                id="familyName"
                name="familyName"
                className="form-input"
                value={formData.familyName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3 className="section-heading">Contact Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={14} />
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                <Phone size={14} />
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="555-0100"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h3 className="section-heading">
            <MapPin size={16} />
            Address
          </h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor="address">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="city">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="state">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
                disabled={loading}
                placeholder="IL"
                maxLength="2"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="zip">
                Zip Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                className="form-input"
                value={formData.zip}
                onChange={handleChange}
                disabled={loading}
                placeholder="62701"
              />
            </div>
          </div>
        </div>

        {/* Membership Details */}
        <div className="form-section">
          <h3 className="section-heading">Membership Details</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="language">
                Language
              </label>
              <select
                id="language"
                name="language"
                className="form-select"
                value={formData.language}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="English">English</option>
                <option value="Bangla">Bangla</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="envelopeNumber">
                <Hash size={14} />
                Envelope Number
              </label>
              <input
                type="text"
                id="envelopeNumber"
                name="envelopeNumber"
                className="form-input"
                value={formData.envelopeNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="001"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="joinDate">
                <Calendar size={14} />
                Join Date
              </label>
              <input
                type="date"
                id="joinDate"
                name="joinDate"
                className="form-input"
                value={formData.joinDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="activeStatus"
                checked={formData.activeStatus}
                onChange={handleChange}
                disabled={loading}
              />
              <span>Active Member</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="form-section">
          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              rows="4"
              placeholder="Additional information about the member..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Adding Member...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Add Member
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
