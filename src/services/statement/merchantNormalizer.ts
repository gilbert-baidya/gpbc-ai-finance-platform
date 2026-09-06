/**
 * GPBC Finance Desk — Merchant Normalizer
 *
 * Normalizes noisy bank description strings to canonical, human-readable merchant/payee names.
 */

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => {
      // Preserve acronyms like PG&E, ACH, GPBC
      if (/^(ach|pge|gpbc|us|ca|llc|inc|co)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function normalizeMerchant(rawDescription: string): {
  canonicalMerchant: string;
  channelHint?: string;
  referenceNumber?: string;
} {
  if (!rawDescription || typeof rawDescription !== 'string') {
    return { canonicalMerchant: 'Unknown Merchant' };
  }

  let text = rawDescription.trim();
  let channelHint: string | undefined = undefined;
  let referenceNumber: string | undefined = undefined;

  // 1. Check for multiline ACH block structured fields: ORIG CO NAME:
  const origCoMatch = text.match(/ORIG\s*CO\s*NAME\s*:\s*([^\r\n]+)/i);
  if (origCoMatch && origCoMatch[1]) {
    let name = origCoMatch[1].trim();
    // Strip trailing tags or IDs
    name = name.replace(/\s*(ORIG|ENTRY|SEC|TRACE|IND)\s*.*$/i, '').trim();
    channelHint = 'ACH';

    // Extract TRACE# if present
    const traceMatch = text.match(/TRACE#?\s*:\s*([0-9a-zA-Z]+)/i);
    if (traceMatch) referenceNumber = traceMatch[1];

    return {
      canonicalMerchant: toTitleCase(name),
      channelHint,
      referenceNumber
    };
  }

  // 2. Check for Zelle patterns
  // Examples:
  // "ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN"
  // "ZELLE PAYMENT FROM JOHN DOE 12345"
  // "ZELLE TO SARAH JENKINS"
  const zelleMatch = text.match(/ZELLE\s*(?:PAYMENT\s*)?(?:TO|FROM|SENT\s*TO|REC(?:EIVE)?D\s*FROM)?\s*([A-Za-z\s.'-]+?)(?:\s+[A-Z0-9]{8,20}|\s+\d{4,}|$)/i);
  if (zelleMatch && zelleMatch[1]) {
    channelHint = 'ZELLE';
    let zelleName = zelleMatch[1].trim();
    // Strip trailing confirmation token
    zelleName = zelleName.replace(/\b[A-Z0-9]{8,}\b/g, '').trim();

    // Extract reference token if present
    const refMatch = text.match(/\b([A-Z0-9]{8,20})\b/);
    if (refMatch && !refMatch[1].includes('ZELLE')) referenceNumber = refMatch[1];

    if (zelleName.length > 1) {
      return {
        canonicalMerchant: toTitleCase(zelleName),
        channelHint,
        referenceNumber
      };
    }
  }

  // 3. Remove common banking prefixes
  text = text
    .replace(/^(POS\s*DEBIT|CHECKCARD|DEBIT\s*CARD|PURCHASE|RECURRING\s*PAYMENT|AUTOMATIC\s*PAYMENT|ACH\s*DEBIT|ACH\s*CREDIT|DIRECT\s*DEP(?:OSIT)?|WIRE\s*TRANS(?:FER)?|BILL\s*PAY|PREAUTHORIZED\s*ACH)\s*[-:]?\s*/i, '')
    .replace(/^(SQ\s*\*|TST\s*\*|PAYPAL\s*\*|PYPL\s*\*|GOOGLE\s*\*|AMZN\s*MKTP\s*US\*|APPLE\.COM\/BILL)\s*/i, '')
    .trim();

  // 4. Remove location suffixes, store numbers, phone numbers, state codes, dates
  // e.g. "SAN BERNARDINO ALARM SANBERNARDINO CA 09/02" -> "SAN BERNARDINO ALARM"
  // e.g. "OFFICE DEPOT #1024 SAN BERNARDINO CA" -> "OFFICE DEPOT"
  text = text
    .replace(/\s*(?:[-+]\s*\$?\d+(?:,\d{3})*(?:\.\d{2})?|\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*\.\d{2})\s*$/i, '') // trailing signed amount or dollar amount
    .replace(/\s*#?\d{3,6}\b/g, '') // store numbers like #1024
    .replace(/\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?$/i, '') // trailing date e.g. 09/02
    .replace(/\s+(?:SAN\s+BERNARDINO|SANBERNARDINO|LOS\s+ANGELES|RIVERSIDE|REDLANDS|SAN\s+JOSE|ONTARIO|FONTANA|[A-Za-z]{2,15})\s+[A-Za-z]{2}$/i, '') // City + State
    .replace(/\s+\b(CA|USA|US)\b$/i, '')
    .replace(/\s+\d{3}-\d{3}-\d{4}.*$/, '') // Phone numbers
    .replace(/\s+(?:TERMINAL|STORE|LOC|POS)\s*#?\w+/i, '')
    .replace(/[\*\#\-\_]+$/, '')
    .trim();

  // Fallback cleanup if string becomes too short or empty
  if (!text) {
    text = rawDescription.split('\n')[0].substring(0, 30);
  }

  return {
    canonicalMerchant: toTitleCase(text),
    channelHint,
    referenceNumber
  };
}
