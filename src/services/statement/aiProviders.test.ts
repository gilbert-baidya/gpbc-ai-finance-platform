import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ServerVisionExtractionProvider,
  OpenAIStatementExtractionProvider,
  GeminiVisionStatementExtractionProvider,
  LocalDeterministicExtractionProvider
} from './aiProviders';
import { statementImportApi } from '../../api/statementImportApi';
import {
  REAL_RASTER_SCREENSHOT_PNG,
  REAL_TEXT_PDF_FIXTURE
} from '../../test-fixtures/binaryStatementFixtures';

describe('AI & Vision Extraction Providers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ServerVisionExtractionProvider processes genuine raster screenshot and handles pending null-date transactions without fabricating dates', async () => {
    const provider = new ServerVisionExtractionProvider();

    vi.spyOn(statementImportApi, 'extractStatementDocument').mockResolvedValue({
      success: true,
      provider: 'gemini-1.5-flash-vision',
      statementType: 'BANK_STATEMENT',
      institution: 'Chase Bank',
      rawText: 'Raw extracted text',
      transactions: [
        {
          date: '', // Pending transaction with no visible date
          rawDescription: 'ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN',
          amount: 80.00,
          direction: 'EXPENSE',
          referenceNumber: 'JPM99CVMEAAN'
        },
        {
          date: '2026-09-03',
          rawDescription: 'PREAUTHORIZED ACH CHURCHWEST INS PREM 2567.50\nORIG CO NAME: CHURCHWEST INSURANCE SERVICES TRACE#: 104000019610307',
          amount: 2567.50,
          direction: 'EXPENSE',
          referenceNumber: '104000019610307'
        },
        {
          date: '2026-09-03',
          rawDescription: 'SAN BERNARDINO ALARM SANBERNARDINO CA 09/02 -31.21',
          amount: 31.21,
          direction: 'EXPENSE'
        }
      ],
      extractedCount: 3
    });

    const lines = await provider.extract({
      fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
      mimeType: 'image/png',
      fileName: 'bank-screenshot.png'
    });

    expect(lines.length).toBe(3);

    // Line 1: Pending Zelle -> Date is null / unassigned, NOT fabricated to today or Sep 1
    expect(lines[0].merchantOrPayee).toBe('James Trupest');
    expect(lines[0].transactionDate).toBeNull();
    expect(lines[0].amount).toBe(80.00);
    expect(lines[0].direction).toBe('EXPENSE');
    expect(lines[0].paymentChannel).toBe('ZELLE');
    expect(lines[0].referenceNumber).toBe('JPM99CVMEAAN');

    // Line 2: Churchwest ACH $2567.50
    expect(lines[1].merchantOrPayee).toBe('Churchwest Insurance Services');
    expect(lines[1].transactionDate).toBe('2026-09-03');
    expect(lines[1].amount).toBe(2567.50);
    expect(lines[1].direction).toBe('EXPENSE');
    expect(lines[1].paymentChannel).toBe('ACH');

    // Line 3: San Bernardino Alarm $31.21
    expect(lines[2].merchantOrPayee).toBe('San Bernardino Alarm');
    expect(lines[2].transactionDate).toBe('2026-09-03');
    expect(lines[2].amount).toBe(31.21);
    expect(lines[2].direction).toBe('EXPENSE');
  });

  it('ServerVisionExtractionProvider processes valid PDF statement fixture', async () => {
    const provider = new ServerVisionExtractionProvider();

    vi.spyOn(statementImportApi, 'extractStatementDocument').mockResolvedValue({
      success: true,
      provider: 'gemini-1.5-flash-vision',
      statementType: 'BANK_STATEMENT',
      institution: 'Chase Bank',
      rawText: 'PDF extracted statement',
      transactions: [
        {
          date: '2026-09-03',
          rawDescription: 'ORIG CO NAME:CHURCHWEST ACH PAYMENT 2567.50',
          amount: 2567.50,
          direction: 'EXPENSE'
        }
      ],
      extractedCount: 1
    });

    const lines = await provider.extract({
      fileBase64: REAL_TEXT_PDF_FIXTURE.base64,
      mimeType: 'application/pdf',
      fileName: 'bank-statement.pdf'
    });

    expect(lines.length).toBe(1);
    expect(lines[0].amount).toBe(2567.50);
  });

  it('OpenAIStatementExtractionProvider inherits server extraction capabilities', async () => {
    const provider = new OpenAIStatementExtractionProvider();
    expect(provider.name).toBe('OpenAIStatementExtractionProvider');
  });

  it('GeminiVisionStatementExtractionProvider inherits server extraction capabilities', async () => {
    const provider = new GeminiVisionStatementExtractionProvider();
    expect(provider.name).toBe('GeminiVisionStatementExtractionProvider');
  });

  it('LocalDeterministicExtractionProvider parses pre-extracted text strings', async () => {
    const provider = new LocalDeterministicExtractionProvider();
    const sampleText = `09/01/2026 ZELLE PAYMENT TO JAMES TRUPEST -80.00`;
    const lines = await provider.extract(sampleText);
    expect(lines.length).toBe(1);
    expect(lines[0].amount).toBe(80.00);
  });
});
