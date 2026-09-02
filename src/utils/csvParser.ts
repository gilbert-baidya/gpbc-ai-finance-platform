/*************************************************
 * GPBC Finance Desk — csvParser.ts
 * Standards-Aware CSV Parser for Bank & Card Statements with Explicit Sign Normalization
 *************************************************/

export type StatementFormatType =
  | 'Bank Checking'
  | 'Capital One Card (Debits Positive)'
  | 'Capital One Card (Charges Negative)'
  | 'Generic Card Statement';

export interface ParsedStatementLine {
  date: string;
  description: string;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  referenceNumber?: string;
  statementType?: string;
}

export interface ParseCsvResult {
  validLines: ParsedStatementLine[];
  errors: Array<{ rowNumber: number; rawRow: string; reason: string }>;
  totalRowsProcessed: number;
}

/**
 * Splits a single CSV line into fields respecting double-quoted values and escaped quotes.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV string into normalized statement lines with explicit sign normalization and row validation
 */
export function parseStatementCsv(
  csvText: string,
  statementType: StatementFormatType | string = 'Bank Checking'
): ParseCsvResult {
  if (!csvText || typeof csvText !== 'string') {
    return { validLines: [], errors: [], totalRowsProcessed: 0 };
  }

  // Normalize CRLF to LF and split
  const rawLines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const validLines: ParsedStatementLine[] = [];
  const errors: Array<{ rowNumber: number; rawRow: string; reason: string }> = [];

  let isFirstNonEmpty = true;

  rawLines.forEach((line, index) => {
    const rowNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed) return; // Skip blank lines

    const fields = parseCsvLine(trimmed);

    // Header row detection
    if (isFirstNonEmpty) {
      isFirstNonEmpty = false;
      const firstCol = fields[0]?.toLowerCase() || '';
      const secondCol = fields[1]?.toLowerCase() || '';
      if (firstCol.includes('date') || secondCol.includes('desc') || secondCol.includes('payee') || secondCol.includes('trans')) {
        return; // Skip header row
      }
    }

    if (fields.length < 3) {
      errors.push({
        rowNumber,
        rawRow: trimmed,
        reason: 'Row must contain at least 3 columns: Date, Description, Amount'
      });
      return;
    }

    const rawDate = fields[0];
    const rawDesc = fields[1];
    const rawAmt = fields[2].replace(/[$,]/g, '');
    const rawRef = fields[3] || '';

    // Validate Date
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime()) || !rawDate.match(/^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
      errors.push({
        rowNumber,
        rawRow: trimmed,
        reason: `Invalid date format: "${rawDate}". Expected YYYY-MM-DD or MM/DD/YYYY`
      });
      return;
    }

    // Standardize date to YYYY-MM-DD
    const isoDate = parsedDate.toISOString().split('T')[0];

    // Validate Description
    if (!rawDesc || rawDesc.trim() === '') {
      errors.push({
        rowNumber,
        rawRow: trimmed,
        reason: 'Description is empty or missing'
      });
      return;
    }

    // Validate Amount
    const numAmt = Number(rawAmt);
    if (isNaN(numAmt) || !isFinite(numAmt) || numAmt === 0) {
      errors.push({
        rowNumber,
        rawRow: trimmed,
        reason: `Invalid or zero amount: "${fields[2]}"`
      });
      return;
    }

    // Explicit Sign & Direction Normalization
    let normalizedAmount = numAmt;
    let direction: 'INCOME' | 'EXPENSE' = 'EXPENSE';

    if (statementType === 'Capital One Card (Debits Positive)') {
      // Charges are exported as positive (+45.20), payments/credits as negative (-500.00)
      if (numAmt > 0) {
        direction = 'EXPENSE';
        normalizedAmount = -Math.abs(numAmt);
      } else {
        direction = 'INCOME';
        normalizedAmount = Math.abs(numAmt);
      }
    } else {
      // Standard Bank Checking or Charges Negative: Negative = EXPENSE, Positive = INCOME
      if (numAmt < 0) {
        direction = 'EXPENSE';
        normalizedAmount = -Math.abs(numAmt);
      } else {
        direction = 'INCOME';
        normalizedAmount = Math.abs(numAmt);
      }
    }

    validLines.push({
      date: isoDate,
      description: rawDesc.trim(),
      amount: normalizedAmount,
      direction,
      referenceNumber: rawRef.trim(),
      statementType
    });
  });

  return {
    validLines,
    errors,
    totalRowsProcessed: rawLines.length
  };
}
