import { describe, it, expect } from 'vitest';
import { parseStatementText } from './statementParser';

describe('Statement Parser', () => {
  it('parses the canonical multi-transaction banking sample accurately', () => {
    const sampleInput = `Sep 3, 2026

ZELLE PAYMENT TO JAMES TRUPEST
JPM99CVMEAAN
-$80.00

ORIG CO NAME:Churchwest
ORIG ID:3464699697
ENTRY DESCR:ACH PAYMENT
SEC:WEB
TRACE#:104000019610307
IND NAME:Grace and Praise Bangl...
-$2,567.50

SAN BERNARDINO ALARM
SANBERNARDINO CA 09/02
-$31.21`;

    const results = parseStatementText(sampleInput, { defaultYear: 2026 });

    expect(results).toHaveLength(3);

    // Record 1: James Trupest Zelle
    expect(results[0].merchantOrPayee).toBe('James Trupest');
    expect(results[0].amount).toBe(80.00);
    expect(results[0].direction).toBe('EXPENSE');
    expect(results[0].paymentChannel).toBe('ZELLE');
    expect(results[0].transactionDate).toBe('2026-09-03');

    // Record 2: Churchwest ACH
    expect(results[1].merchantOrPayee).toBe('Churchwest');
    expect(results[1].amount).toBe(2567.50);
    expect(results[1].direction).toBe('EXPENSE');
    expect(results[1].paymentChannel).toBe('ACH');
    expect(results[1].transactionDate).toBe('2026-09-03');
    expect(results[1].referenceNumber).toBe('104000019610307');

    // Record 3: San Bernardino Alarm
    expect(results[2].merchantOrPayee).toBe('San Bernardino Alarm');
    expect(results[2].amount).toBe(31.21);
    expect(results[2].direction).toBe('EXPENSE');
    expect(results[2].transactionDate).toBe('2026-09-03');
  });

  it('parses positive amounts as INCOME / deposits', () => {
    const input = `09/01/2026 SUNDAY TITHE OFFERING DEPOSIT +$1,250.00\n09/02/2026 GRACE FOUNDATION GRANT 5,000.00 CR`;
    const results = parseStatementText(input, { defaultYear: 2026 });

    expect(results).toHaveLength(2);
    expect(results[0].direction).toBe('INCOME');
    expect(results[0].amount).toBe(1250.00);

    expect(results[1].direction).toBe('INCOME');
    expect(results[1].amount).toBe(5000.00);
  });

  it('parses check numbers correctly', () => {
    const input = `2026-03-05 CHECK # 1043 PASTOR DAVID LEE -$300.00`;
    const results = parseStatementText(input);

    expect(results).toHaveLength(1);
    expect(results[0].amount).toBe(300.00);
    expect(results[0].direction).toBe('EXPENSE');
    expect(results[0].checkNumber).toBe('1043');
    expect(results[0].paymentChannel).toBe('CHECK');
  });
});
