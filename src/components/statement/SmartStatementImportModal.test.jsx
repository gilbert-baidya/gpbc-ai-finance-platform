import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmartStatementImportModal from './SmartStatementImportModal';
import { statementImportApi } from '../../api/statementImportApi';
import { REAL_RASTER_SCREENSHOT_PNG } from '../../test-fixtures/binaryStatementFixtures';

describe('SmartStatementImportModal — Zero-Input Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload choices when opened', () => {
    render(<SmartStatementImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Smart Statement Import')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Choose Photo / Screenshot')).toBeInTheDocument();
    expect(screen.getByText('Choose PDF / Statement')).toBeInTheDocument();
  });

  it('processes text statement and shows summary with zero manual typing', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <SmartStatementImportModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const sampleContent = `Sep 3, 2026\nZELLE PAYMENT TO JAMES TRUPEST\nJPM99CVMEAAN\n-$80.00\n\nORIG CO NAME:Churchwest\n-$2,567.50\n\nSAN BERNARDINO ALARM\n-$31.21`;
    const file = new File([sampleContent], 'statement.txt', { type: 'text/plain' });

    const input = document.querySelector('input[type="file"][accept*="pdf"]');
    expect(input).not.toBeNull();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument(); // 3 transactions found
    expect(screen.getByText('Done')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('processes genuine raster PNG screenshot via Vision OCR and shows summary with zero manual typing', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    vi.spyOn(statementImportApi, 'extractStatementDocument').mockResolvedValue({
      success: true,
      provider: 'gemini-1.5-flash-vision',
      statementType: 'BANK_STATEMENT',
      institution: 'Chase Bank',
      rawText: 'OCR text',
      transactions: [
        {
          date: '', // Pending -> null date
          rawDescription: 'ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN',
          amount: 80.00,
          direction: 'EXPENSE',
          referenceNumber: 'JPM99CVMEAAN'
        },
        {
          date: '2026-09-03',
          rawDescription: 'PREAUTHORIZED ACH CHURCHWEST INS PREM 2567.50',
          amount: 2567.50,
          direction: 'EXPENSE',
          referenceNumber: '104000019610307'
        },
        {
          date: '2026-09-03',
          rawDescription: 'SAN BERNARDINO ALARM -31.21',
          amount: 31.21,
          direction: 'EXPENSE'
        }
      ],
      extractedCount: 3
    });

    render(
      <SmartStatementImportModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const binaryFile = new File([REAL_RASTER_SCREENSHOT_PNG.buffer], 'bank-statement-screenshot.png', {
      type: 'image/png'
    });

    const photoInput = document.querySelector('input[type="file"][accept*="image/png"]');
    expect(photoInput).not.toBeNull();

    fireEvent.change(photoInput, { target: { files: [binaryFile] } });

    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(handleSuccess).toHaveBeenCalled();
  });
});
