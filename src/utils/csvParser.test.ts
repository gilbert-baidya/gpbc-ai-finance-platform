import { describe, it, expect } from 'vitest';
import { parseStatementCsv, parseCsvLine } from './csvParser';

describe('Standards-Aware CSV Parser & Sign Normalization (csvParser.ts)', () => {
  it('parses basic CSV lines correctly', () => {
    const res = parseCsvLine('2026-02-01,Home Depot,-145.20');
    expect(res).toEqual(['2026-02-01', 'Home Depot', '-145.20']);
  });

  it('handles quotes with commas inside fields correctly', () => {
    const res = parseCsvLine('2026-02-01,"Amazon Marketplace, Seattle",-45.20');
    expect(res).toEqual(['2026-02-01', 'Amazon Marketplace, Seattle', '-45.20']);
  });

  it('handles escaped quotes inside quoted fields', () => {
    const res = parseCsvLine('2026-02-01,"Vendor ""Special"" Order",-200.00');
    expect(res).toEqual(['2026-02-01', 'Vendor "Special" Order', '-200.00']);
  });

  it('parses Bank Checking format (Deposits +, Withdrawals -)', () => {
    const csv = `Date,Description,Amount,Reference\n2026-02-01,"Home Depot #1234",-150.00,CHK-100\n2026-02-02,Sunday Offering,1200.00,DEP-1`;
    const res = parseStatementCsv(csv, 'Bank Checking');

    expect(res.validLines.length).toBe(2);
    expect(res.validLines[0].description).toBe('Home Depot #1234');
    expect(res.validLines[0].amount).toBe(-150.00);
    expect(res.validLines[0].direction).toBe('EXPENSE');
    expect(res.validLines[0].referenceNumber).toBe('CHK-100');

    expect(res.validLines[1].description).toBe('Sunday Offering');
    expect(res.validLines[1].amount).toBe(1200.00);
    expect(res.validLines[1].direction).toBe('INCOME');
    expect(res.errors.length).toBe(0);
  });

  it('normalizes Capital One Card format where Debits/Charges are Positive', () => {
    const csv = `Date,Description,Amount\n2026-02-01,Home Depot Purchase,45.20\n2026-02-05,Card Payment Received,-500.00`;
    const res = parseStatementCsv(csv, 'Capital One Card (Debits Positive)');

    expect(res.validLines.length).toBe(2);
    // Charge (+45.20) normalized to EXPENSE with -45.20 amount
    expect(res.validLines[0].description).toBe('Home Depot Purchase');
    expect(res.validLines[0].amount).toBe(-45.20);
    expect(res.validLines[0].direction).toBe('EXPENSE');

    // Payment (-500.00) normalized to INCOME with +500.00 amount
    expect(res.validLines[1].description).toBe('Card Payment Received');
    expect(res.validLines[1].amount).toBe(500.00);
    expect(res.validLines[1].direction).toBe('INCOME');
  });

  it('catches and reports invalid rows with row numbers', () => {
    const csv = `2026-02-01,Valid Purchase,-50.00\nINVALID_DATE,Bad Date,-20.00\n2026-02-03,Zero Amount,0.00\n2026-02-04,Missing Amount`;
    const res = parseStatementCsv(csv);

    expect(res.validLines.length).toBe(1);
    expect(res.errors.length).toBe(3);
    expect(res.errors[0].rowNumber).toBe(2);
    expect(res.errors[0].reason).toMatch(/Invalid date format/);
    expect(res.errors[1].rowNumber).toBe(3);
    expect(res.errors[1].reason).toMatch(/Invalid or zero amount/);
  });
});
