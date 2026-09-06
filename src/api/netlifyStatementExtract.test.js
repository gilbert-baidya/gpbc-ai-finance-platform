import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handler } from '../../netlify/functions/statement-extract.js';
import {
  REAL_RASTER_SCREENSHOT_PNG,
  REAL_TEXT_PDF_FIXTURE
} from '../test-fixtures/binaryStatementFixtures';

const TARGET_CLIENT_ID = '456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com';

describe('Authenticated Netlify Statement Extract Function (statement-extract.js)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: TARGET_CLIENT_ID,
      GPBC_APPROVED_USERS: JSON.stringify([
        { email: 'gilbert.baidya@gmail.com', name: 'Pastor Gilbert Baidya', role: 'Primary Admin' },
        { email: 'backup.admin@gracepraise.church', name: 'Backup Administrator', role: 'Backup Admin' },
        { email: 'finance.editor@gracepraise.church', name: 'Finance Editor', role: 'Finance Editor' },
        { email: 'viewer.user@gracepraise.church', name: 'Church Viewer', role: 'Viewer' },
        { email: 'presbyter@socal.church', name: 'Presbyter Officer', role: 'Presbyter Read-Only' }
      ])
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // Helper to mock Google's oauth2.googleapis.com/tokeninfo endpoint
  function mockGoogleTokenInfo(claims, status = 200) {
    return (url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        if (status !== 200) {
          return Promise.resolve({
            ok: false,
            status,
            text: async () => 'Invalid token signature'
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => claims
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    };
  }

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).error).toBe('Method Not Allowed');
  });

  it('rejects unauthenticated requests without an identity token with 401', async () => {
    const res = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toContain('Missing identity token');
  });

  it('rejects invalid or malformed Google ID tokens with 401', async () => {
    globalThis.fetch = vi.fn().mockImplementation(mockGoogleTokenInfo(null, 400));

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer malformed-token-xyz' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toContain('Invalid or expired Google ID token');
  });

  it('rejects Google ID token with wrong OAuth audience with 401', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '1234567890',
        aud: 'wrong-client-id.apps.googleusercontent.com',
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer wrong-aud-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toContain('audience mismatch');
  });

  it('rejects expired Google ID token with 401', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '1234567890',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) - 60 // expired 60 seconds ago
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer expired-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toContain('token has expired');
  });

  it('fails closed with 500 when GOOGLE_CLIENT_ID environment variable is missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer any-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toContain('Missing GOOGLE_CLIENT_ID configuration');
  });

  it('fails closed with 503 when approved-user authority is unavailable', async () => {
    delete process.env.GPBC_APPROVED_USERS;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '12345',
            aud: TARGET_CLIENT_ID,
            email: 'user@gracepraise.church',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('script.google.com')) {
        return Promise.resolve({
          ok: false,
          status: 503,
          text: async () => 'Upstream service unavailable'
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).error).toContain('Approved-user authority unavailable');
  });

  it('fails closed with 500 when GPBC_APPROVED_USERS is malformed', async () => {
    process.env.GPBC_APPROVED_USERS = 'not-valid-json{{{';

    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '12345',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toContain('Malformed GPBC_APPROVED_USERS');
  });

  it('proves no hardcoded Gilbert fallback exists when email is not in approved list', async () => {
    // Only approved user is a different person
    process.env.GPBC_APPROVED_USERS = JSON.stringify([
      { email: 'other.admin@gracepraise.church', name: 'Other Admin', role: 'Primary Admin' }
    ]);

    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '12345',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com', // Pastor Gilbert, but not in this approved list
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    // Must be DENIED with 403, proving zero hardcoded fallback
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toContain('not in the GPBC approved user list');
  });

  it('reuses authoritative GPBC backend verifySession when GPBC_APPROVED_USERS is unset', async () => {
    delete process.env.GPBC_APPROVED_USERS;
    process.env.OPENAI_API_KEY = 'test-openai-key';

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '12345',
            aud: TARGET_CLIENT_ID,
            email: 'editor@gracepraise.church',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('script.google.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            user: {
              email: 'editor@gracepraise.church',
              name: 'Trusted Editor',
              role: 'Finance Editor'
            }
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            output_text: JSON.stringify({
              statementType: 'BANK_STATEMENT',
              transactions: [{
                date: '2026-09-03',
                rawDescription: 'TEST ITEM',
                amount: 50.00,
                direction: 'EXPENSE'
              }]
            })
          })
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-editor-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.transactions[0].amount).toBe(50.00);
  });

  it('denies unapproved email address with 403 Forbidden', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '987654321',
        aud: TARGET_CLIENT_ID,
        email: 'random.unauthorized.user@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-unapproved-user-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toContain('not in the GPBC approved user list');
  });

  it('denies Viewer role with 403 Forbidden', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '11223344',
        aud: TARGET_CLIENT_ID,
        email: 'viewer.user@gracepraise.church',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer viewer-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toContain("Role 'Viewer' is not permitted");
  });

  it('denies Presbyter Read-Only role with 403 Forbidden', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '55667788',
        aud: TARGET_CLIENT_ID,
        email: 'presbyter@socal.church',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer presbyter-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toContain('Presbyter role has read-only access');
  });

  it('completely ignores browser-supplied testRole parameter and validates real Google claims', async () => {
    // Client tries to spoof testRole: 'Primary Admin' but token is from a Viewer
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '11223344',
        aud: TARGET_CLIENT_ID,
        email: 'viewer.user@gracepraise.church',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer viewer-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png',
        testRole: 'Primary Admin' // spoof attempt
      })
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toContain("Role 'Viewer' is not permitted");
  });

  it('rejects file sizes exceeding 4MB with 413 Payload Too Large', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '1234567890',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const bigBuffer = Buffer.alloc(4.5 * 1024 * 1024, 0);
    bigBuffer[0] = 0x89; bigBuffer[1] = 0x50; bigBuffer[2] = 0x4E; bigBuffer[3] = 0x47;
    bigBuffer[4] = 0x0D; bigBuffer[5] = 0x0A; bigBuffer[6] = 0x1A; bigBuffer[7] = 0x0A;

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: bigBuffer.toString('base64'),
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toContain('File exceeds maximum 4MB limit');
  });

  it('rejects spoofed MIME type when magic bytes do not match header with 400', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '1234567890',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const spoofedBase64 = Buffer.from('NOT A REAL PNG FILE').toString('base64');
    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: spoofedBase64,
        mimeType: 'image/png'
      })
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toContain('File header does not match claimed MIME type');
  });

  it('fails safely with 503 if OpenAI key is unconfigured', async () => {
    delete process.env.OPENAI_API_KEY;
    // Confirm presence or absence of Gemini key has zero impact
    process.env.GEMINI_API_KEY = 'should-not-be-used';

    globalThis.fetch = vi.fn().mockImplementation(
      mockGoogleTokenInfo({
        sub: '1234567890',
        aud: TARGET_CLIENT_ID,
        email: 'gilbert.baidya@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png',
        fileName: 'statement-screenshot.png'
      })
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.code).toBe('OPENAI_PROVIDER_UNCONFIGURED');
    expect(body.error).toContain('No financial records were changed');
  });

  it('fails safely with 502 if OpenAI service returns error', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    delete process.env.GEMINI_API_KEY;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '1234567890',
            aud: TARGET_CLIENT_ID,
            email: 'gilbert.baidya@gmail.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: async () => 'OpenAI model overloaded'
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png',
        fileName: 'statement-screenshot.png'
      })
    });

    expect(res.statusCode).toBe(502);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.code).toBe('OPENAI_EXTRACTION_FAILED');
    expect(body.error).toContain("We couldn't read this statement automatically");
  });

  it('processes genuine raster screenshot via OpenAI Vision for Primary Admin with pending null-date preservation', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    delete process.env.GEMINI_API_KEY;

    let capturedOpenAIPayload = null;
    let capturedOpenAIAuth = null;

    const mockOpenAIResponse = {
      output_text: JSON.stringify({
        statementType: 'BANK_STATEMENT',
        institution: 'Grace and Praise Banking / Chase',
        rawText: 'Full OCR visual text',
        transactions: [
          {
            date: null, // Pending item has NO visible date
            rawDescription: 'ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN',
            amount: 80.00,
            direction: 'EXPENSE',
            referenceNumber: 'JPM99CVMEAAN'
          },
          {
            date: '2026-09-03',
            rawDescription: 'ORIG CO NAME:CHURCHWEST ORIG ID:3464699697 ENTRY DESCR:ACH PAYMENT SEC:WEB TRACE#:104000019610307 IND NAME:GRACE AND PRAISE BANGL...',
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
        ]
      })
    };

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '1234567890',
            aud: TARGET_CLIENT_ID,
            email: 'gilbert.baidya@gmail.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        capturedOpenAIAuth = options?.headers?.Authorization;
        capturedOpenAIPayload = JSON.parse(options?.body || '{}');
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockOpenAIResponse
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-primary-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png',
        fileName: 'real-bank-screenshot.png'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.provider).toBe('gpt-5.6-luna');
    expect(capturedOpenAIAuth).toBe('Bearer test-openai-key-12345');
    expect(capturedOpenAIPayload.model).toBe('gpt-5.6-luna');
    expect(capturedOpenAIPayload.input[0].content.some(c => c.type === 'input_image')).toBe(true);
    expect(body.transactions.length).toBe(3);

    // Record 1: Pending Zelle -> date is null (not defaulted!)
    expect(body.transactions[0].date).toBeNull();
    expect(body.transactions[0].amount).toBe(80.00);
    expect(body.transactions[0].direction).toBe('EXPENSE');
    expect(body.transactions[0].referenceNumber).toBe('JPM99CVMEAAN');

    // Record 2: Churchwest ACH $2,567.50
    expect(body.transactions[1].date).toBe('2026-09-03');
    expect(body.transactions[1].amount).toBe(2567.50);
    expect(body.transactions[1].direction).toBe('EXPENSE');

    // Record 3: San Bernardino Alarm $31.21
    expect(body.transactions[2].date).toBe('2026-09-03');
    expect(body.transactions[2].amount).toBe(31.21);
    expect(body.transactions[2].direction).toBe('EXPENSE');
  });

  it('allows Backup Admin role and processes genuine statement request via OpenAI', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    delete process.env.GEMINI_API_KEY;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: 'backup-sub-1',
            aud: TARGET_CLIENT_ID,
            email: 'backup.admin@gracepraise.church',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            output_text: JSON.stringify({
              statementType: 'BANK_STATEMENT',
              institution: 'Chase Bank',
              rawText: 'OCR',
              transactions: [
                {
                  date: '2026-09-03',
                  rawDescription: 'SAN BERNARDINO ALARM -$31.21',
                  amount: 31.21,
                  direction: 'EXPENSE'
                }
              ]
            })
          })
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer backup-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png',
        fileName: 'statement.png'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.transactions.length).toBe(1);
  });

  it('allows Finance Editor role and processes valid PDF document via OpenAI Responses API', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    delete process.env.GEMINI_API_KEY;

    let capturedPayload = null;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: 'editor-sub-2',
            aud: TARGET_CLIENT_ID,
            email: 'finance.editor@gracepraise.church',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        capturedPayload = JSON.parse(options?.body || '{}');
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            output_text: JSON.stringify({
              statementType: 'BANK_STATEMENT',
              institution: 'Chase Bank',
              rawText: 'PDF Extracted Content',
              transactions: [
                {
                  date: '2026-09-03',
                  rawDescription: 'ORIG CO NAME:CHURCHWEST ACH PAYMENT -$2,567.50',
                  amount: 2567.50,
                  direction: 'EXPENSE'
                }
              ]
            })
          })
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer finance-editor-token' },
      body: JSON.stringify({
        fileBase64: REAL_TEXT_PDF_FIXTURE.base64,
        mimeType: 'application/pdf',
        fileName: 'bank-statement.pdf'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.transactions.length).toBe(1);
    expect(capturedPayload.input[0].content.some(c => c.type === 'input_file')).toBe(true);
  });

  it('preserves UNKNOWN direction without fabricating EXPENSE or INCOME', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    delete process.env.GEMINI_API_KEY;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '1234567890',
            aud: TARGET_CLIENT_ID,
            email: 'gilbert.baidya@gmail.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            output_text: JSON.stringify({
              statementType: 'BANK_STATEMENT',
              transactions: [
                {
                  date: '2026-09-03',
                  rawDescription: 'AMBIGUOUS TRANSACTION LINE',
                  amount: 1500.00,
                  direction: 'UNKNOWN'
                }
              ]
            })
          })
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.transactions[0].direction).toBe('UNKNOWN');
  });

  it('supports custom OPENAI_MODEL override such as gpt-5.6-sol', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-12345';
    process.env.OPENAI_MODEL = 'gpt-5.6-sol';

    let capturedModel = null;

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/tokeninfo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sub: '1234567890',
            aud: TARGET_CLIENT_ID,
            email: 'gilbert.baidya@gmail.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600
          })
        });
      }
      if (typeof url === 'string' && url.includes('api.openai.com')) {
        const body = JSON.parse(options?.body || '{}');
        capturedModel = body.model;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            output_text: JSON.stringify({
              statementType: 'BANK_STATEMENT',
              transactions: [
                {
                  date: '2026-09-03',
                  rawDescription: 'TEST LINE',
                  amount: 50.00,
                  direction: 'EXPENSE'
                }
              ]
            })
          })
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const res = await handler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer valid-admin-token' },
      body: JSON.stringify({
        fileBase64: REAL_RASTER_SCREENSHOT_PNG.base64,
        mimeType: 'image/png'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.provider).toBe('gpt-5.6-sol');
    expect(capturedModel).toBe('gpt-5.6-sol');
  });
});
