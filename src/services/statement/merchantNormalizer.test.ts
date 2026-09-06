import { describe, it, expect } from 'vitest';
import { normalizeMerchant, toTitleCase } from './merchantNormalizer';

describe('Merchant Normalizer', () => {
  it('title cases strings correctly while preserving acronyms', () => {
    expect(toTitleCase('SAN BERNARDINO ALARM')).toBe('San Bernardino Alarm');
    expect(toTitleCase('PACIFIC GAS AND ELECTRIC')).toBe('Pacific Gas And Electric');
    expect(toTitleCase('PGE')).toBe('PGE');
    expect(toTitleCase('ACH PAYMENT')).toBe('ACH Payment');
  });

  it('normalizes Zelle recipient strings', () => {
    const result1 = normalizeMerchant('ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN');
    expect(result1.canonicalMerchant).toBe('James Trupest');
    expect(result1.channelHint).toBe('ZELLE');

    const result2 = normalizeMerchant('ZELLE TO SARAH JENKINS 99281');
    expect(result2.canonicalMerchant).toBe('Sarah Jenkins');
    expect(result2.channelHint).toBe('ZELLE');
  });

  it('normalizes multiline ACH headers with ORIG CO NAME', () => {
    const achText = `ORIG CO NAME:Churchwest\nORIG ID:3464699697\nENTRY DESCR:ACH PAYMENT\nSEC:WEB\nTRACE#:104000019610307\nIND NAME:Grace and Praise Bangl...`;
    const result = normalizeMerchant(achText);
    expect(result.canonicalMerchant).toBe('Churchwest');
    expect(result.channelHint).toBe('ACH');
    expect(result.referenceNumber).toBe('104000019610307');
  });

  it('strips location suffixes, store numbers, and POS prefixes', () => {
    const result1 = normalizeMerchant('SAN BERNARDINO ALARM SANBERNARDINO CA 09/02');
    expect(result1.canonicalMerchant).toBe('San Bernardino Alarm');

    const result2 = normalizeMerchant('OFFICE DEPOT #1024 SAN BERNARDINO CA');
    expect(result2.canonicalMerchant).toBe('Office Depot');

    const result3 = normalizeMerchant('CHECKCARD 0902 WALMART #5421');
    expect(result3.canonicalMerchant).toBe('Walmart');

    const result4 = normalizeMerchant('SQ *PASTOR DAVID LEE');
    expect(result4.canonicalMerchant).toBe('Pastor David Lee');
  });
});
