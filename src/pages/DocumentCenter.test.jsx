import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DocumentCenter } from './DocumentCenter';
import { PeriodProvider } from '../context/PeriodContext';
import { AuthContext } from '../context/AuthContext';
import { documentApi } from '../api/documentApi';

vi.mock('../api/documentApi', () => ({
  documentApi: {
    getDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    linkDocumentToEntity: vi.fn(),
    updateDocumentStatus: vi.fn(),
    deleteDocument: vi.fn()
  }
}));

let mockAuthContextValue = {
  user: {
    email: 'treasurer@gracepraise.church',
    name: 'Treasurer',
    role: 'Finance Editor'
  },
  idToken: 'mock-token',
  loading: false,
  error: null,
  isAuthenticated: true,
  isAuthorized: () => true,
  signInWithGoogleCredential: vi.fn(),
  signOut: vi.fn()
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContextValue
}));

const renderWithProviders = (ui, authValue) => {
  if (authValue) {
    mockAuthContextValue = authValue;
  } else {
    mockAuthContextValue = {
      user: {
        email: 'treasurer@gracepraise.church',
        name: 'Treasurer',
        role: 'Finance Editor'
      },
      idToken: 'mock-token',
      loading: false,
      error: null,
      isAuthenticated: true,
      isAuthorized: () => true,
      signInWithGoogleCredential: vi.fn(),
      signOut: vi.fn()
    };
  }
  return render(
    <PeriodProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </PeriodProvider>
  );
};

describe('DocumentCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentApi.getDocuments.mockResolvedValue({
      success: true,
      count: 2,
      documents: [
        {
          documentId: 'DOC-202609-000001',
          documentType: 'Receipt',
          title: 'Office Max Desk Supplies',
          originalFileName: 'receipt.pdf',
          storedFileName: '2026-09-02_Receipt_OfficeMax_123.pdf',
          mimeType: 'application/pdf',
          fileSize: 102400,
          driveFileId: 'DRV-1',
          driveFileUrl: 'https://drive.google.com/file/d/DRV-1/view',
          driveFolderId: 'FLD-1',
          documentDate: '2026-09-02',
          financeYear: 2026,
          financeMonth: 9,
          relatedEntityType: 'TRANSACTION',
          relatedEntityId: 'TXN-101',
          relatedTransactionId: 'TXN-101',
          source: 'Manual Upload',
          status: 'Linked',
          notes: 'Pens, printing paper, staples',
          uploadedBy: 'treasurer@gracepraise.church',
          uploadedAt: '2026-09-02T12:00:00.000Z'
        },
        {
          documentId: 'DOC-202609-000002',
          documentType: 'Invoice',
          title: 'HVAC Air Filter Replacement',
          originalFileName: 'hvac_invoice.pdf',
          storedFileName: '2026-09-02_Invoice_HVAC_456.pdf',
          mimeType: 'application/pdf',
          fileSize: 204800,
          driveFileId: 'DRV-2',
          driveFileUrl: 'https://drive.google.com/file/d/DRV-2/view',
          driveFolderId: 'FLD-1',
          documentDate: '2026-09-02',
          financeYear: 2026,
          financeMonth: 9,
          source: 'Manual Upload',
          status: 'Unlinked',
          uploadedBy: 'treasurer@gracepraise.church',
          uploadedAt: '2026-09-02T13:00:00.000Z'
        }
      ]
    });
  });

  it('renders Document Center with title and summary metrics', async () => {
    renderWithProviders(<DocumentCenter />);

    expect(screen.getByRole('heading', { level: 1, name: /Document Center/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Office Max Desk Supplies')).toBeInTheDocument();
      expect(screen.getByText('HVAC Air Filter Replacement')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getAllByText('Receipts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Invoices').length).toBeGreaterThan(0);
  });

  it('allows authorized users to view Upload Document button', async () => {
    renderWithProviders(<DocumentCenter />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Document/i })).toBeInTheDocument();
    });
  });

  it('hides Upload Document button for Viewer / Read-Only users', async () => {
    const viewerAuth = {
      ...mockAuthContextValue,
      user: { email: 'viewer@gracepraise.church', role: 'Viewer', name: 'Viewer' }
    };
    renderWithProviders(<DocumentCenter />, viewerAuth);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Upload Document/i })).not.toBeInTheDocument();
    });
  });

  it('displays category filter buttons', async () => {
    renderWithProviders(<DocumentCenter />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /All Documents/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bank Statements/i })).toBeInTheDocument();
    });
  });
});
