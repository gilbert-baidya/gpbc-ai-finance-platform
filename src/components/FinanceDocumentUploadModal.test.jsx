import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FinanceDocumentUploadModal } from './FinanceDocumentUploadModal';

vi.mock('../api/documentApi', () => ({
  documentApi: {
    uploadDocument: vi.fn().mockResolvedValue({
      success: true,
      documentId: 'DOC-202609-999999',
      status: 'Linked'
    })
  }
}));

describe('FinanceDocumentUploadModal', () => {
  it('renders modal with prefilled entity information when isOpen is true', () => {
    render(
      <FinanceDocumentUploadModal
        isOpen={true}
        onClose={() => {}}
        entityType="Transaction"
        entityId="TXN-202609-015"
        defaultDocumentType="Receipt"
      />
    );

    expect(screen.getByText(/Attach Evidence for Transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/TXN-202609-015/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select File/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <FinanceDocumentUploadModal
        isOpen={false}
        onClose={() => {}}
        entityType="Transaction"
        entityId="TXN-202609-015"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('submits upload payload with relatedEntityType TRANSACTION, relatedEntityId, and relatedTransactionId', async () => {
    const { documentApi } = await import('../api/documentApi');

    render(
      <FinanceDocumentUploadModal
        isOpen={true}
        onClose={() => {}}
        entityType="Transaction"
        entityId="TXN-202609-889024"
        transactionId="TXN-202609-889024"
        defaultDocumentType="Receipt"
      />
    );

    const file = new File(['fake image content'], 'receipt.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Select File/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole('button', { name: /Save & Register Document/i });
    fireEvent.click(submitBtn);

    expect(documentApi.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedEntityType: 'TRANSACTION',
        relatedEntityId: 'TXN-202609-889024',
        relatedTransactionId: 'TXN-202609-889024'
      })
    );
  });
});
