/**
 * GPBC Finance Desk — Authenticated Statement Vision/OCR Extraction Function
 *
 * Server-side Netlify Function that securely authenticates Google ID tokens against
 * the authoritative GPBC RBAC policy, validates payload/MIME constraints, and invokes
 * the configured OpenAI Vision API (Responses API) without leaking secrets or data.
 *
 * Security Controls:
 * 1. Authoritative Google tokeninfo cryptographic verification
 * 2. Strict OAuth audience matching (GOOGLE_CLIENT_ID)
 * 3. Verified email lookup against GPBC_APPROVED_USERS
 * 4. RBAC policy enforcement (Primary Admin, Backup Admin, Finance Editor allowed; Viewer & Presbyter denied)
 * 5. Strict 4MB payload limit
 * 6. Binary magic-byte header validation
 * 7. Server-side OpenAI API key protection (process.env.OPENAI_API_KEY)
 * 8. Zero runtime test backdoors or hardcoded token shortcuts
 */

const UPSTREAM_URL =
  'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec';

const ALLOWED_ROLES = ['Primary Admin', 'Backup Admin', 'Finance Editor'];
const DENIED_ROLES = ['Viewer', 'Presbyter Read-Only', 'Presbyter'];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4MB strictly matching GPBC Smart Upload limit

/**
 * Resolves the user record from the authoritative GPBC authorization source:
 * 1. If GPBC_APPROVED_USERS is set: validates strictly as non-empty JSON array, fails closed if malformed.
 * 2. If GPBC_APPROVED_USERS is not set: delegates upstream to authoritative GPBC backend verifySession.
 * 3. If neither authority is available: fails closed (503).
 * ZERO hardcoded fallbacks or default user lists are permitted.
 */
async function resolveAuthoritativeUser(idToken, email) {
  const normalizedEmail = email ? String(email).toLowerCase().trim() : '';
  if (!normalizedEmail) {
    return { ok: false, statusCode: 401, error: 'Unauthorized: Email is missing or invalid' };
  }

  // Path A: GPBC_APPROVED_USERS explicitly configured in environment
  if (process.env.GPBC_APPROVED_USERS !== undefined) {
    const rawUsers = process.env.GPBC_APPROVED_USERS;
    if (!rawUsers || typeof rawUsers !== 'string' || !rawUsers.trim()) {
      return { ok: false, statusCode: 500, error: 'Configuration error: Malformed GPBC_APPROVED_USERS configuration' };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawUsers);
    } catch {
      return { ok: false, statusCode: 500, error: 'Configuration error: Malformed GPBC_APPROVED_USERS JSON' };
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { ok: false, statusCode: 500, error: 'Configuration error: Malformed GPBC_APPROVED_USERS list' };
    }

    for (const item of parsed) {
      if (item && item.email && String(item.email).toLowerCase().trim() === normalizedEmail) {
        return {
          ok: true,
          user: {
            email: normalizedEmail,
            name: item.name || normalizedEmail,
            role: String(item.role || '').trim()
          }
        };
      }
    }

    return {
      ok: false,
      statusCode: 403,
      error: `Forbidden: Account '${email}' is not in the GPBC approved user list`
    };
  }

  // Path B: Query authoritative GPBC backend verifySession action
  const backendUrl = process.env.GPBC_BACKEND_URL || UPSTREAM_URL;
  if (!backendUrl) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Configuration error: Approved-user authority unavailable'
    };
  }

  try {
    const upstreamResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'verifySession',
        idToken
      }),
      redirect: 'follow'
    });

    if (!upstreamResponse.ok) {
      return {
        ok: false,
        statusCode: 503,
        error: 'Configuration error: Approved-user authority unavailable'
      };
    }

    const data = await upstreamResponse.json();
    if (!data || !data.success || !data.user) {
      return {
        ok: false,
        statusCode: 403,
        error: data?.error ? `Forbidden: ${data.error}` : `Forbidden: Account '${email}' is not in the GPBC approved user list`
      };
    }

    return {
      ok: true,
      user: {
        email: String(data.user.email || normalizedEmail).toLowerCase().trim(),
        name: data.user.name || normalizedEmail,
        role: String(data.user.role || '').trim()
      }
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Configuration error: Approved-user authority unavailable'
    };
  }
}

/**
 * Validates Google ID Token cryptographic signature, audience, expiration, and role
 */
async function authenticateRequest(event) {
  // 1. Validate GOOGLE_CLIENT_ID environment variable (fail closed, no hardcoded fallback)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId || !googleClientId.trim()) {
    return {
      authenticated: false,
      statusCode: 500,
      error: 'Configuration error: Missing GOOGLE_CLIENT_ID configuration'
    };
  }

  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  let idToken = '';

  if (authHeader.startsWith('Bearer ')) {
    idToken = authHeader.substring(7).trim();
  }

  if (!idToken) {
    return { authenticated: false, statusCode: 401, error: 'Unauthorized: Missing identity token' };
  }

  try {
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const response = await fetch(verifyUrl, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return {
        authenticated: false,
        statusCode: 401,
        error: 'Unauthorized: Invalid or expired Google ID token'
      };
    }

    const claims = await response.json();

    // 2. Validate Subject Presence
    if (!claims.sub || typeof claims.sub !== 'string') {
      return { authenticated: false, statusCode: 401, error: 'Unauthorized: Token subject missing' };
    }

    // 3. Validate Audience strictly against env-only client ID
    if (claims.aud !== googleClientId) {
      return { authenticated: false, statusCode: 401, error: 'Unauthorized: Token audience mismatch' };
    }

    // 4. Validate Email Verification
    if (claims.email_verified !== 'true' && claims.email_verified !== true) {
      return { authenticated: false, statusCode: 401, error: 'Unauthorized: Google email not verified' };
    }

    // 5. Validate Expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (claims.exp && Number(claims.exp) < nowSec) {
      return { authenticated: false, statusCode: 401, error: 'Unauthorized: Google ID token has expired' };
    }

    // 6. Resolve RBAC Role from Authoritative Source (fail closed, no hardcoded user fallback)
    const authResult = await resolveAuthoritativeUser(idToken, claims.email);
    if (!authResult.ok) {
      return {
        authenticated: false,
        statusCode: authResult.statusCode,
        error: authResult.error
      };
    }

    const user = authResult.user;

    if (user.role === 'Viewer') {
      return {
        authenticated: false,
        statusCode: 403,
        error: "Forbidden: Role 'Viewer' is not permitted to extract or import statements"
      };
    }

    if (user.role === 'Presbyter Read-Only' || user.role === 'Presbyter') {
      return {
        authenticated: false,
        statusCode: 403,
        error: "Forbidden: Presbyter role has read-only access and cannot import statements"
      };
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      return {
        authenticated: false,
        statusCode: 403,
        error: `Forbidden: Role '${user.role}' is not permitted to perform statement extraction`
      };
    }

    return { authenticated: true, user };
  } catch (err) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Unauthorized: Google identity verification request failed'
    };
  }
}

/**
 * Validates binary file magic bytes against claimed MIME type
 */
function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    );
  }

  // WEBP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (mimeType === 'application/pdf') {
    return (
      buffer.length >= 5 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2D
    );
  }

  return false;
}

/**
 * Validates and sanitizes structured extraction items from AI provider without fabricating values
 */
function validateAndSanitizeTransactions(rawTransactions) {
  if (!Array.isArray(rawTransactions)) {
    return [];
  }

  const sanitized = [];
  for (const item of rawTransactions) {
    if (!item || typeof item !== 'object') continue;

    const rawDesc = String(item.rawDescription || item.description || '').trim();
    if (!rawDesc) continue;

    let amount = Number(item.amount);
    if (isNaN(amount) || amount === 0) continue;
    if (amount < 0) amount = Math.abs(amount);

    // Direction: Keep UNKNOWN if not determinable, DO NOT fabricate EXPENSE
    let direction = String(item.direction || '').toUpperCase();
    if (direction !== 'INCOME' && direction !== 'EXPENSE') {
      direction = 'UNKNOWN';
    }

    // Date: Keep null if missing or not visibly present, DO NOT fabricate today's date
    let dateStr = item.date ? String(item.date).trim() : null;
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      dateStr = dateStr.substring(0, 10);
    } else if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0];
      } else {
        dateStr = null;
      }
    } else {
      dateStr = null;
    }

    sanitized.push({
      date: dateStr,
      rawDescription: rawDesc,
      amount: Math.round(amount * 100) / 100,
      direction,
      referenceNumber: item.referenceNumber ? String(item.referenceNumber).trim() : undefined
    });
  }

  return sanitized;
}

/**
 * Invokes OpenAI Responses API using server-side key
 */
async function callOpenAIVision(base64Data, mimeType, apiKey) {
  const modelName = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const endpoint = 'https://api.openai.com/v1/responses';

  const prompt = `You are a financial OCR document extraction system for church bank statements.
Read all financial transaction rows in this bank statement document/image.
For every transaction row, extract:
- date: The visible posted/transaction date in YYYY-MM-DD format. If a transaction is in a PENDING section without a visible date, set date to null. DO NOT invent dates.
- rawDescription: The exact unedited banking description, preserving multi-line ACH tags (ORIG CO NAME, ENTRY DESCR, TRACE#) or Zelle confirmation codes.
- amount: The positive numeric amount.
- direction: "INCOME" for deposits/credits, "EXPENSE" for debits/withdrawals/checks. If direction cannot be determined, set to "UNKNOWN". DO NOT guess.
- referenceNumber: Check number, trace number, or confirmation code if present, otherwise null.

Return ONLY a JSON object with this exact schema:
{
  "statementType": "BANK_STATEMENT",
  "institution": "Bank Name or Unknown",
  "rawText": "Full OCR text",
  "transactions": [
    {
      "date": "2026-09-03",
      "rawDescription": "description",
      "amount": 100.00,
      "direction": "EXPENSE",
      "referenceNumber": "optional ref"
    }
  ]
}`;

  const dataUri = `data:${mimeType};base64,${base64Data}`;
  const content = [
    {
      type: 'input_text',
      text: prompt
    }
  ];

  if (mimeType === 'application/pdf') {
    content.push({
      type: 'input_file',
      file_data: dataUri
    });
  } else {
    content.push({
      type: 'input_image',
      image_url: dataUri
    });
  }

  const requestBody = {
    model: modelName,
    input: [
      {
        role: 'user',
        content
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Vision API error (${response.status}): ${errText}`);
  }

  const result = await response.json();

  let textContent = result?.output_text;
  if (!textContent && Array.isArray(result?.output)) {
    for (const item of result.output) {
      if (item?.content && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c?.type === 'text' && c.text) {
            textContent = c.text;
            break;
          }
        }
      }
      if (textContent) break;
    }
  }
  if (!textContent && result?.choices?.[0]?.message?.content) {
    textContent = result.choices[0].message.content;
  }

  if (!textContent) {
    throw new Error('OpenAI Vision API returned empty text response');
  }

  const cleanJson = textContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleanJson);
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Invalid JSON request body' })
      };
    }

    // 1. Authoritative Identity & RBAC Verification
    const authResult = await authenticateRequest(event);
    if (!authResult.authenticated) {
      return {
        statusCode: authResult.statusCode,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ success: false, error: authResult.error })
      };
    }

    const { fileBase64, mimeType, fileName } = payload;

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing fileBase64 data' })
      };
    }

    const cleanMimeType = (mimeType || '').toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(cleanMimeType)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Unsupported MIME type: ${cleanMimeType}. Supported types: JPEG, PNG, WEBP, PDF`
        })
      };
    }

    const pureBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();
    const buffer = Buffer.from(pureBase64, 'base64');

    // 2. Strict 4MB File Size Enforcement
    if (buffer.length > MAX_PAYLOAD_BYTES) {
      return {
        statusCode: 413,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'File exceeds maximum 4MB limit' })
      };
    }

    // 3. Binary Magic Bytes Verification
    const isMagicValid = validateMagicBytes(buffer, cleanMimeType);
    if (!isMagicValid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `File header does not match claimed MIME type (${cleanMimeType}). Upload rejected.`
        })
      };
    }

    // 4. Server-side OpenAI Vision Provider Call
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          success: false,
          code: 'OPENAI_PROVIDER_UNCONFIGURED',
          error: 'OpenAI Vision AI service is currently unavailable. No financial records were changed.'
        })
      };
    }

    let extractionResult;
    try {
      extractionResult = await callOpenAIVision(pureBase64, cleanMimeType, openaiKey);
    } catch (err) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          success: false,
          code: 'OPENAI_EXTRACTION_FAILED',
          error: "We couldn't read this statement automatically. No financial records were changed."
        })
      };
    }

    const sanitizedTransactions = validateAndSanitizeTransactions(extractionResult?.transactions);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        success: true,
        provider: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        statementType: extractionResult?.statementType || 'BANK_STATEMENT',
        institution: extractionResult?.institution || 'Bank Statement',
        rawText: extractionResult?.rawText || '',
        transactions: sanitizedTransactions,
        extractedCount: sanitizedTransactions.length
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Internal extraction server error'
      })
    };
  }
};
