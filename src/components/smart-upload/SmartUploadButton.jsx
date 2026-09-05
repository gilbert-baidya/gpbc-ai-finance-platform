/*************************************************
 * GPBC Finance Desk — SmartUploadButton.jsx
 * Global Header Entry Point for Smart Upload
 * Enforces role authorization & mobile touch accessibility
 *************************************************/

import React, { useState } from 'react';
import { UploadCloud, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SmartUploadModal } from './SmartUploadModal';

export const SmartUploadButton = ({ capitalProjects, closedPeriods, onUploadSuccess, onGoToExpense }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Role permissions check:
  // Allowed: Primary Admin, Backup Admin, Finance Editor
  // Denied: Viewer, Presbyter Read-Only, unapproved/anonymous
  const canUpload =
    user?.role === 'Primary Admin' ||
    user?.role === 'Backup Admin' ||
    user?.role === 'Finance Editor';

  if (!canUpload) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="smart-upload-btn"
        onClick={() => setModalOpen(true)}
        title="Upload financial evidence and link to transactions"
        aria-label="Smart Upload"
      >
        <Plus size={16} />
        <span>Smart Upload</span>
      </button>

      {modalOpen && (
        <SmartUploadModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(res) => {
            if (onUploadSuccess) onUploadSuccess(res);
          }}
          onGoToExpense={onGoToExpense}
          capitalProjects={capitalProjects}
          closedPeriods={closedPeriods}
        />
      )}
    </>
  );
};

export default SmartUploadButton;
