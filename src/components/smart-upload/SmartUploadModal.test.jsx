import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartUploadButton } from './SmartUploadButton';
import { SmartUploadModal } from './SmartUploadModal';
import { IBoughtSomethingModal } from './IBoughtSomethingModal';
import * as smartUploadApiModule from '../../api/smartUploadApi';

let mockUser = {
  email: 'treasurer@gracepraise.church',
  name: 'Treasurer',
  role: 'Finance Editor'
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: vi.fn()
  })
}));

describe('Smart Upload Phase 1 Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUser = {
      email: 'treasurer@gracepraise.church',
      name: 'Treasurer',
      role: 'Finance Editor'
    };

    // Default safe mocks for backend APIs
    vi.spyOn(smartUploadApiModule.smartUploadApi, 'checkDuplicate').mockResolvedValue({
      isDuplicate: false
    });
    vi.spyOn(smartUploadApiModule.smartUploadApi, 'getSmartUploadOptions').mockResolvedValue({
      closedPeriods: ['2026-07'],
      capitalProjects: [{ id: 'PRJ-SANCTUARY', name: 'Sanctuary Renovation' }],
      documentTypes: ['Receipt', 'Invoice', 'Check']
    });
  });

  describe('1. Role-Based Access Control on SmartUploadButton', () => {
    it('renders SmartUploadButton for Primary Admin, Backup Admin, and Finance Editor', () => {
      mockUser.role = 'Primary Admin';
      const { unmount } = render(<SmartUploadButton />);
      expect(screen.getByRole('button', { name: /smart upload/i })).toBeTruthy();
      unmount();

      mockUser.role = 'Backup Admin';
      const r2 = render(<SmartUploadButton />);
      expect(screen.getByRole('button', { name: /smart upload/i })).toBeTruthy();
      r2.unmount();

      mockUser.role = 'Finance Editor';
      const r3 = render(<SmartUploadButton />);
      expect(screen.getByRole('button', { name: /smart upload/i })).toBeTruthy();
      r3.unmount();
    });

    it('hides SmartUploadButton completely for Viewer and Presbyter Read-Only', () => {
      mockUser.role = 'Viewer';
      const { unmount } = render(<SmartUploadButton />);
      expect(screen.queryByRole('button', { name: /smart upload/i })).toBeNull();
      unmount();

      mockUser.role = 'Presbyter Read-Only';
      render(<SmartUploadButton />);
      expect(screen.queryByRole('button', { name: /smart upload/i })).toBeNull();
    });
  });

  describe('2. File Validation & Selection in SmartUploadModal', () => {
    it('rejects unsupported file formats and oversized files', async () => {
      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      const fileInput = screen.getByLabelText(/upload file/i);

      // Try exe file
      const badFile = new File(['binary'], 'malware.exe', { type: 'application/x-msdownload' });
      fireEvent.change(fileInput, { target: { files: [badFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Executable, script, archive, and spreadsheet files are strictly not permitted/i)).toBeTruthy();
      });

      // Try file > 4MB
      const bigFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(bigFile, 'size', { value: 5 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [bigFile] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds the maximum allowed size of 4MB/i)).toBeTruthy();
      });
    });

    it('accepts valid PDF file and allows progression to Details step', async () => {
      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      const fileInput = screen.getByLabelText(/upload file/i);
      const validFile = new File(['sample content'], 'invoice.pdf', { type: 'application/pdf' });
      Object.defineProperty(validFile, 'size', { value: 25000 });

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('invoice.pdf')).toBeTruthy();
      });

      const nextBtn = screen.getByRole('button', { name: /continue to details/i });
      expect(nextBtn).toBeEnabled();
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByLabelText(/document type/i)).toBeTruthy();
      });
    });

    it('detects duplicate file on select and allows user override with Continue Anyway', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'checkDuplicate').mockResolvedValue({
        isDuplicate: true,
        reason: 'Identical file content already uploaded on DOC-202608-100001'
      });

      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      const fileInput = screen.getByLabelText(/upload file/i);
      const file = new File(['content'], 'existing.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/possible duplicate document/i)).toBeTruthy();
        expect(screen.getByText(/identical file content already uploaded/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /continue anyway/i })).toBeTruthy();
      });

      // Override duplicate warning
      fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }));

      // Continue to Details should now proceed
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/document type/i)).toBeTruthy();
      });
    });
  });

  describe('3. Closed Period & Refund Safety Guards', () => {
    it('requires postCloseReason when document date falls in closed period', async () => {
      render(
        <SmartUploadModal
          isOpen={true}
          onClose={vi.fn()}
          closedPeriods={['2026-07']}
        />
      );

      // Step 1
      const fileInput = screen.getByLabelText(/upload file/i);
      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/document date/i)).toBeTruthy();
      });

      // Set date to closed period 2026-07-15
      fireEvent.change(screen.getByLabelText(/document date/i), { target: { value: '2026-07-15' } });

      await waitFor(() => {
        expect(screen.getAllByText(/period is closed/i).length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/post-close reason/i)).toBeTruthy();
      });

      // Attempt to proceed without post-close reason
      fireEvent.click(screen.getByRole('button', { name: /find matching records/i }));

      await waitFor(() => {
        expect(screen.getByText(/post-close reason is required/i)).toBeTruthy();
      });
    });

    it('displays notice that refunds/credits do not count as donation income', async () => {
      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      // Progress to Step 2
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.png', { type: 'image/png' })] } });
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/document type/i)).toBeTruthy();
      });

      // Select Refund / Credit
      fireEvent.change(screen.getByLabelText(/document type/i), { target: { value: 'Refund / Credit' } });

      await waitFor(() => {
        expect(screen.getByText(/must NOT be recorded as church donation income/i)).toBeTruthy();
      });
    });
  });

  describe('4. Deterministic Match Suggestions & Explicit Human Confirmation', () => {
    it('DOES NOT auto-select highest-ranked candidate; disables Review until user explicitly chooses', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([
        {
          candidate: {
            id: 'TXN-777',
            entityType: 'TRANSACTION',
            entityId: 'TXN-777',
            displayTitle: 'Walmart Supercenter - $45.54',
            amount: 45.54,
            date: '2026-08-12',
            vendorPayee: 'Walmart'
          },
          score: 95,
          confidenceLabel: 'Strong Match',
          reasons: ['Exact amount match', 'Exact date match']
        }
      ]);

      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      // Step 1 -> 2
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.jpg', { type: 'image/jpeg' })] } });
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      // Step 2 -> 3
      await waitFor(() => expect(screen.getByLabelText(/vendor \/ payee/i)).toBeTruthy());
      fireEvent.change(screen.getByLabelText(/vendor \/ payee/i), { target: { value: 'Walmart' } });
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '45.54' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Cleaning Supplies' } });

      fireEvent.click(screen.getByRole('button', { name: /find matching records/i }));

      // Step 3 (Suggestions)
      await waitFor(() => {
        expect(screen.getByText('Walmart Supercenter - $45.54')).toBeTruthy();
        expect(screen.getByText('Strong Match')).toBeTruthy();
      });

      // CRITICAL AUDIT: Button must indicate selection needed and be disabled initially (no auto-selection)
      const selectBtn = screen.getByRole('button', { name: /select match to continue/i });
      expect(selectBtn).toBeDisabled();

      // Explicitly select candidate
      fireEvent.click(screen.getByText('Walmart Supercenter - $45.54'));
      const reviewBtn = screen.getByRole('button', { name: /review & confirm/i });
      expect(reviewBtn).toBeEnabled();

      // Proceed to Step 4 (Review)
      fireEvent.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/confirm document & relationship/i)).toBeTruthy();
        expect(screen.getByText(/linked to transaction: walmart supercenter - \$45\.54/i)).toBeTruthy();
      });
    });

    it('allows explicit selection of Save to Document Center Only (Unlinked)', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([
        {
          candidate: {
            id: 'TXN-777',
            entityType: 'TRANSACTION',
            entityId: 'TXN-777',
            displayTitle: 'Walmart Supercenter - $45.54',
            amount: 45.54,
            date: '2026-08-12',
            vendorPayee: 'Walmart'
          },
          score: 80,
          confidenceLabel: 'Possible Match',
          reasons: ['Similar amount']
        }
      ]);

      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      // Step 1 -> 2
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.jpg', { type: 'image/jpeg' })] } });
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      // Step 2 -> 3
      await waitFor(() => expect(screen.getByLabelText(/vendor \/ payee/i)).toBeTruthy());
      fireEvent.change(screen.getByLabelText(/vendor \/ payee/i), { target: { value: 'Walmart' } });
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '45.54' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Supplies' } });
      fireEvent.click(screen.getByRole('button', { name: /find matching records/i }));

      // Step 3: Explicitly select "Save to Document Center Only"
      await waitFor(() => {
        expect(screen.getByText(/save to document center only/i)).toBeTruthy();
      });

      const selectBtn = screen.getByRole('button', { name: /select match to continue/i });
      expect(selectBtn).toBeDisabled();

      fireEvent.click(screen.getByText(/save to document center only/i));

      const reviewBtn = screen.getByRole('button', { name: /review & confirm/i });
      expect(reviewBtn).toBeEnabled();
      fireEvent.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/confirm document & relationship/i)).toBeTruthy();
        expect(screen.getByText(/document only:/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /confirm save document only/i })).toBeTruthy();
      });
    });
  });

  describe('5. Single Upload & Single Link Flow (Eliminates Double-Linking)', () => {
    it('executes single uploadSmartDocument with relatedEntityType NONE and single linkDocumentToEntity', async () => {
      const uploadSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'uploadSmartDocument').mockResolvedValue({
        success: true,
        documentId: 'DOC-202609-000101',
        driveFileUrl: 'https://drive.google.com/file/d/test-101/view',
        status: 'Unlinked'
      });

      const linkSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'linkDocumentToEntity').mockResolvedValue({
        success: true,
        status: 'Linked'
      });

      vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([
        {
          candidate: {
            id: 'TXN-999',
            entityType: 'TRANSACTION',
            entityId: 'TXN-999',
            displayTitle: 'Office Depot - $34.20',
            amount: 34.20,
            date: '2026-09-01',
            vendorPayee: 'Office Depot'
          },
          score: 95,
          confidenceLabel: 'Strong Match',
          reasons: ['Exact match']
        }
      ]);

      render(<SmartUploadModal isOpen={true} onClose={vi.fn()} />);

      // Step 1
      const fileInput = screen.getByLabelText(/upload file/i);
      fireEvent.change(fileInput, { target: { files: [new File(['data'], 'invoice.pdf', { type: 'application/pdf' })] } });
      fireEvent.click(screen.getByRole('button', { name: /continue to details/i }));

      // Step 2
      await waitFor(() => expect(screen.getByLabelText(/vendor \/ payee/i)).toBeTruthy());
      fireEvent.change(screen.getByLabelText(/vendor \/ payee/i), { target: { value: 'Office Depot' } });
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '34.20' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Office Paper' } });
      fireEvent.click(screen.getByRole('button', { name: /find matching records/i }));

      // Step 3
      await waitFor(() => expect(screen.getByText('Office Depot - $34.20')).toBeTruthy());
      fireEvent.click(screen.getByText('Office Depot - $34.20'));
      const reviewBtn = screen.getByRole('button', { name: /review & confirm/i });
      expect(reviewBtn).toBeEnabled();
      fireEvent.click(reviewBtn);

      // Step 4 (Confirm)
      await waitFor(() => expect(screen.getByRole('button', { name: /confirm & link to transaction/i })).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: /confirm & link to transaction/i }));

      await waitFor(() => {
        expect(uploadSpy).toHaveBeenCalledTimes(1);
        expect(uploadSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            relatedEntityType: 'NONE', // MUST BE NONE ON PHYSICAL UPLOAD
            title: expect.stringContaining('Office Depot')
          })
        );
        expect(linkSpy).toHaveBeenCalledTimes(1);
        expect(linkSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: 'DOC-202609-000101',
            relatedEntityType: 'TRANSACTION',
            relatedTransactionId: 'TXN-999'
          })
        );
      });
    });
  });

  describe('6. Accessibility & Modal Keyboard Handling', () => {
    it('has role="dialog", aria-modal="true" and closes on Escape key', () => {
      const handleClose = vi.fn();
      render(<SmartUploadModal isOpen={true} onClose={handleClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Shortcut: I Bought Something for Church', () => {
    it('shows no match found message and options without creating silent records', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([]);

      const handleGoToExpense = vi.fn();
      render(
        <IBoughtSomethingModal
          isOpen={true}
          onClose={vi.fn()}
          onGoToExpense={handleGoToExpense}
        />
      );

      expect(screen.getByText(/i bought something for church/i)).toBeTruthy();

      // Enter details
      const fileInput = screen.getByLabelText(/receipt photo or document/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.jpg', { type: 'image/jpeg' })] } });
      fireEvent.change(screen.getByLabelText(/vendor \/ store/i), { target: { value: 'Costco' } });
      fireEvent.change(screen.getByLabelText(/total amount paid/i), { target: { value: '125.00' } });
      fireEvent.change(screen.getByLabelText(/what did you buy/i), { target: { value: 'Fellowship snacks' } });

      fireEvent.click(screen.getByRole('button', { name: /find matching expense/i }));

      await waitFor(() => {
        expect(screen.getByText(/no matching finance record found/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /save document only/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /go to record expense/i })).toBeTruthy();
      });

      // Clicking Go to Record Expense passes data without silent accounting writes
      fireEvent.click(screen.getByRole('button', { name: /go to record expense/i }));
      expect(handleGoToExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor: 'Costco',
          amount: '125.00',
          description: 'Fellowship snacks'
        })
      );
    });

    it('blocks progression on duplicate detection, showing Possible Duplicate Document Found with Cancel and Continue Anyway', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'checkDuplicate').mockResolvedValue({
        isDuplicate: true,
        reason: 'Identical file content detected in DOC-202609-000101',
        duplicateDocument: {
          driveFileUrl: 'https://drive.google.com/file/d/dup123/view'
        }
      });
      const findMatchesSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([]);
      const uploadSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'uploadSmartDocument').mockResolvedValue({
        success: true,
        documentId: 'DOC-123'
      });
      const handleClose = vi.fn();

      render(
        <IBoughtSomethingModal
          isOpen={true}
          onClose={handleClose}
        />
      );

      // Enter details
      const fileInput = screen.getByLabelText(/receipt photo or document/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.jpg', { type: 'image/jpeg' })] } });
      fireEvent.change(screen.getByLabelText(/vendor \/ store/i), { target: { value: 'Costco' } });
      fireEvent.change(screen.getByLabelText(/total amount paid/i), { target: { value: '125.00' } });
      fireEvent.change(screen.getByLabelText(/what did you buy/i), { target: { value: 'Fellowship snacks' } });

      fireEvent.click(screen.getByRole('button', { name: /find matching expense/i }));

      // Progression must STOP: duplicate warning banner rendered
      await waitFor(() => {
        expect(screen.getByText(/possible duplicate document found/i)).toBeTruthy();
        expect(screen.getByText(/identical file content detected in DOC-202609-000101/i)).toBeTruthy();
      });

      // Actions must be present
      expect(screen.getByRole('link', { name: /view existing/i })).toHaveAttribute('href', 'https://drive.google.com/file/d/dup123/view');
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      const continueBtn = screen.getByRole('button', { name: /continue anyway/i });
      expect(cancelBtn).toBeTruthy();
      expect(continueBtn).toBeTruthy();

      // findMatches was NOT called; upload was NOT called
      expect(findMatchesSpy).not.toHaveBeenCalled();
      expect(uploadSpy).not.toHaveBeenCalled();

      // Cancel safely closes modal without writing
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('allows progression when Continue Anyway is clicked and sends allowDuplicateUpload: true on save', async () => {
      vi.spyOn(smartUploadApiModule.smartUploadApi, 'checkDuplicate').mockResolvedValue({
        isDuplicate: true,
        reason: 'Identical file content detected'
      });
      const findMatchesSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'findMatches').mockResolvedValue([
        {
          candidate: {
            id: 'TXN-901',
            entityType: 'TRANSACTION',
            entityId: 'TXN-901',
            displayTitle: 'Costco - $125.00'
          },
          score: 85,
          confidenceLabel: 'Strong Match',
          reasons: ['Amount and vendor match']
        }
      ]);
      const uploadSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'uploadSmartDocument').mockResolvedValue({
        success: true,
        documentId: 'DOC-DUPLICATE-999'
      });
      const linkSpy = vi.spyOn(smartUploadApiModule.smartUploadApi, 'linkDocumentToEntity').mockResolvedValue({
        success: true
      });

      render(
        <IBoughtSomethingModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Enter details
      const fileInput = screen.getByLabelText(/receipt photo or document/i);
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'receipt.jpg', { type: 'image/jpeg' })] } });
      fireEvent.change(screen.getByLabelText(/vendor \/ store/i), { target: { value: 'Costco' } });
      fireEvent.change(screen.getByLabelText(/total amount paid/i), { target: { value: '125.00' } });
      fireEvent.change(screen.getByLabelText(/what did you buy/i), { target: { value: 'Fellowship snacks' } });

      fireEvent.click(screen.getByRole('button', { name: /find matching expense/i }));

      // Duplicate warning appears
      await waitFor(() => {
        expect(screen.getByText(/possible duplicate document found/i)).toBeTruthy();
      });

      // Click Continue Anyway
      fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }));

      // Search proceeds
      await waitFor(() => {
        expect(findMatchesSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Costco - $125.00')).toBeTruthy();
      });

      // Select match and save
      fireEvent.click(screen.getByText('Costco - $125.00'));
      const confirmBtn = screen.getByRole('button', { name: /confirm & link to transaction/i });
      expect(confirmBtn).toBeEnabled();
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(uploadSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            allowDuplicateUpload: true,
            title: expect.stringContaining('Costco')
          })
        );
        expect(linkSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: 'DOC-DUPLICATE-999',
            relatedEntityType: 'TRANSACTION',
            relatedTransactionId: 'TXN-901'
          })
        );
      });
    });
  });
});
