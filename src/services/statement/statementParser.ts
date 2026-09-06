/**
 * GPBC Finance Desk — Statement Parser
 *
 * Deterministic multiline banking statement parser.
 * Extracts structured transaction records from OCR text and PDF streams.
 */

import { ExtractedStatementLine, Direction, PaymentChannel } from './types';
import { normalizeMerchant } from './merchantNormalizer';

function normalizeDate(rawDate: string, defaultYear: number = new Date().getFullYear()): string {
  if (!rawDate) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

  // Handle MM/DD/YYYY or MM/DD/YY
  const slashMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : defaultYear;
    if (year < 100) year += 2000;
    return `${year}-${month}-${day}`;
  }

  // Handle "Sep 3, 2026" or "Sep 3" or "September 3, 2026"
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const wordMatch = rawDate.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
  if (wordMatch) {
    const mPrefix = wordMatch[1].toLowerCase().substring(0, 3);
    const month = monthNames[mPrefix] || '01';
    const day = wordMatch[2].padStart(2, '0');
    const year = wordMatch[3] ? parseInt(wordMatch[3], 10) : defaultYear;
    return `${year}-${month}-${day}`;
  }

  return `${defaultYear}-01-01`;
}

function parseAmountAndDirection(str: string): { amount: number; direction: Direction } | null {
  if (!str) return null;
  const clean = str.trim().replace(/\$/g, '');

  // Check negative patterns: "-2,567.50", "(2567.50)", "2567.50-"
  const isNegative = /^-\s*[\d,]+(?:\.\d+)?$/.test(clean) ||
    /^\([\d,]+(?:\.\d+)?\)$/.test(clean) ||
    /^[\d,]+(?:\.\d+)?-$/.test(clean);

  // Check explicit credit: "2567.50 CR", "+2567.50"
  const isExplicitCredit = /CR$/i.test(clean) || /^\+/.test(clean);

  const numStr = clean.replace(/[\(\)\+\-\sCRcr,]/g, '');
  const amount = parseFloat(numStr);
  if (isNaN(amount) || amount === 0) return null;

  const direction: Direction = (isNegative && !isExplicitCredit) ? 'EXPENSE' : 'INCOME';
  return { amount: Math.abs(amount), direction };
}

function detectPaymentChannel(text: string): PaymentChannel {
  const upper = text.toUpperCase();
  if (upper.includes('ZELLE')) return 'ZELLE';
  if (upper.includes('ORIG CO NAME') || upper.includes('ACH PAYMENT') || upper.includes('ACH DEBIT') || upper.includes('ACH CREDIT')) return 'ACH';
  if (upper.includes('CHECK #') || upper.includes('CHECK') && /\b\d{4}\b/.test(upper)) return 'CHECK';
  if (upper.includes('WIRE TRANS') || upper.includes('WIRE')) return 'WIRE';
  if (upper.includes('CHECKCARD') || upper.includes('POS DEBIT') || upper.includes('DEBIT')) return 'DEBIT_CARD';
  if (upper.includes('FEE') || upper.includes('SERVICE CHARGE')) return 'BANK_FEE';
  if (upper.includes('TRANSFER')) return 'TRANSFER';
  return 'UNKNOWN';
}

export function parseStatementText(
  rawText: string,
  options: {
    sourceDocumentId?: string;
    sourcePage?: number;
    defaultYear?: number;
  } = {}
): ExtractedStatementLine[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const defaultYear = options.defaultYear || new Date().getFullYear();
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: ExtractedStatementLine[] = [];

  let currentDate = '';
  let blockLines: string[] = [];

  const flushBlock = () => {
    if (blockLines.length === 0) return;
    const combinedBlock = blockLines.join('\n');

    // Look for an amount pattern in the block: -$2,567.50 or +$1,250.00 or $2,567.50 or -80.00 or 5,000.00 CR
    const amountRegex = /(?:^|\s)(?:[+-]?\$\s*[\d,]+\.\d{2}|\(?\$\s*[\d,]+\.\d{2}\)?|[+-]?[\d,]+\.\d{2}(?:\s*CR|-)?)(?:\s|$)/m;
    const amountMatch = combinedBlock.match(amountRegex);

    if (amountMatch) {
      const parsedAmt = parseAmountAndDirection(amountMatch[0]);
      if (parsedAmt) {
        // Strip amount line from clean description
        const cleanDesc = combinedBlock.replace(amountMatch[0], '').trim();
        const norm = normalizeMerchant(cleanDesc || combinedBlock);
        const channel = (norm.channelHint as PaymentChannel) || detectPaymentChannel(combinedBlock);

        // Extract check number if present
        let checkNum: string | undefined = undefined;
        const checkMatch = combinedBlock.match(/CHECK\s*(?:#|NO\.?)?\s*(\d{3,6})/i);
        if (checkMatch) checkNum = checkMatch[1];

        results.push({
          tempId: `STMT-${Date.now()}-${results.length + 1}`,
          transactionDate: currentDate || normalizeDate('', defaultYear),
          amount: parsedAmt.amount,
          direction: parsedAmt.direction,
          rawDescription: combinedBlock,
          cleanDescription: cleanDesc || combinedBlock,
          merchantOrPayee: norm.canonicalMerchant,
          referenceNumber: norm.referenceNumber,
          checkNumber: checkNum,
          paymentChannel: channel,
          sourceDocumentId: options.sourceDocumentId,
          sourcePage: options.sourcePage || 1
        });
      }
    }
    blockLines = [];
  };

  // Date line pattern e.g. "Sep 3, 2026", "09/03/2026", "Sep 3", "09/03"
  const dateRegex = /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a standalone date header
    if (dateRegex.test(line)) {
      flushBlock();
      currentDate = normalizeDate(line, defaultYear);
      continue;
    }

    // Check if line starts with a date followed by text e.g. "09/03/2026 ZELLE PAYMENT..."
    const inlineDateMatch = line.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\s+(.+)$/i);
    if (inlineDateMatch) {
      flushBlock();
      currentDate = normalizeDate(inlineDateMatch[1], defaultYear);
      blockLines.push(inlineDateMatch[2]);
      continue;
    }

    // Check if line contains an amount at the end or standalone
    const hasAmount = /(?:[+-]?\$\s*[\d,]+\.\d{2}|\(?\$\s*[\d,]+\.\d{2}\)?|[+-]?[\d,]+\.\d{2}(?:\s*CR|-)?)$/.test(line);

    blockLines.push(line);

    if (hasAmount) {
      flushBlock();
    }
  }

  flushBlock();
  return results;
}
