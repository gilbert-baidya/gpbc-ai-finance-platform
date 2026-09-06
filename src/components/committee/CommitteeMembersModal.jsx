import React, { useState } from 'react';
import { X, UserPlus, UserCheck, UserX, Shield, Edit2, Check } from 'lucide-react';
import { committeeApi } from '../../api/committeeApi';
import { successToast, errorToast } from '../../utils/toast';
import './CommitteeMembersModal.css';

export default function CommitteeMembersModal({ isOpen, onClose, members, onRefresh }) {
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Board Member');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editEmail, setEditEmail] = useState('');

  if (!isOpen) return null;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      errorToast('Full name is required.');
      return;
    }
    setSaving(true);
    try {
      await committeeApi.addCommitteeMember({
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        email: email.trim(),
        phone: phone.trim(),
        effectiveFrom
      });
      successToast('Committee member added successfully.');
      setFullName('');
      setEmail('');
      setPhone('');
      onRefresh();
    } catch (err) {
      console.error(err);
      errorToast(err.message || 'Failed to add member.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (m) => {
    setEditingId(m.memberId);
    setEditRoleTitle(m.roleTitle || '');
    setEditEmail(m.email || '');
  };

  const handleSaveEdit = async (m) => {
    setSaving(true);
    try {
      await committeeApi.updateCommitteeMember({
        memberId: m.memberId,
        roleTitle: editRoleTitle.trim(),
        email: editEmail.trim()
      });
      successToast('Member updated.');
      setEditingId(null);
      onRefresh();
    } catch (err) {
      errorToast(err.message || 'Failed to update member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (memberId) => {
    if (!window.confirm('Deactivate this committee member? Historical approvals will remain intact.')) {
      return;
    }
    setSaving(true);
    try {
      await committeeApi.deactivateCommitteeMember(memberId);
      successToast('Member deactivated.');
      onRefresh();
    } catch (err) {
      errorToast(err.message || 'Failed to deactivate member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="committee-modal-overlay" onClick={onClose}>
      <div className="members-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="members-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield className="text-blue-600" size={24} />
            <div>
              <h2>Committee Member Directory</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Manage church committee & board members. Changes preserve historical snapshots.
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="members-modal-body">
          {/* Add Form */}
          <form className="member-add-form" onSubmit={handleAddMember}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="#2563eb" />
              <h3>Add Committee Member</h3>
            </div>
            <div className="member-form-grid">
              <div className="committee-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Subhash Roy"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="committee-form-group">
                <label>Role / Title *</label>
                <select value={roleTitle} onChange={e => setRoleTitle(e.target.value)}>
                  <option value="Pastor / Chair">Pastor / Chair</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Board Member">Board Member</option>
                  <option value="Committee Member">Committee Member</option>
                </select>
              </div>

              <div className="committee-form-group">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="name@gracepraise.church"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="committee-form-group">
                <label>Active From *</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" className="committee-btn committee-btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>

          {/* Members Table */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '10px' }}>
              Current Committee Directory ({(members || []).length})
            </h3>
            <div className="members-table-wrapper">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role / Title</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Effective</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(members || []).map(m => {
                    const isEditing = editingId === m.memberId;
                    return (
                      <tr key={m.memberId}>
                        <td style={{ fontWeight: 600 }}>{m.fullName}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRoleTitle}
                              onChange={e => setEditRoleTitle(e.target.value)}
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                          ) : (
                            m.roleTitle
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                          ) : (
                            m.email || '—'
                          )}
                        </td>
                        <td>
                          <span className={m.status === 'ACTIVE' ? 'member-badge-active' : 'member-badge-inactive'}>
                            {m.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {m.effectiveFrom}{m.effectiveTo ? ` to ${m.effectiveTo}` : ''}
                        </td>
                        <td>
                          {isEditing ? (
                            <button
                              type="button"
                              className="action-btn-small"
                              onClick={() => handleSaveEdit(m)}
                              disabled={saving}
                              title="Save changes"
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="action-btn-small"
                                onClick={() => handleStartEdit(m)}
                                title="Edit Role/Email"
                              >
                                <Edit2 size={13} />
                              </button>
                              {m.status === 'ACTIVE' && (
                                <button
                                  type="button"
                                  className="action-btn-small action-btn-deactivate"
                                  onClick={() => handleDeactivate(m.memberId)}
                                  title="Soft deactivate member"
                                >
                                  <UserX size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!members || members.length === 0) && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No committee members configured yet. Use the form above to add members.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="committee-modal-footer">
          <button type="button" className="committee-btn committee-btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
