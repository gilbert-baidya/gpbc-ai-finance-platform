import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handler } from '../../netlify/functions/gpbc.js';

describe('Netlify API Proxy Function (gpbc.js)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const res = await handler({ httpMethod: 'DELETE' });
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).error).toBe('Method Not Allowed');
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('forwards GET health check with redirect: follow and returns response', async () => {
    const mockJson = JSON.stringify({ success: true, status: 'Healthy', service: 'GPBC Finance Desk API' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
      text: async () => mockJson,
    });

    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(mockJson);
    expect(res.headers['Cache-Control']).toBe('no-store');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec',
      expect.objectContaining({
        method: 'GET',
        redirect: 'follow',
      })
    );
  });

  it('forwards query parameters on GET', async () => {
    const mockJson = JSON.stringify({ success: true, status: 'Healthy' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => mockJson,
    });

    const res = await handler({ httpMethod: 'GET', rawQuery: 'action=health' });
    expect(res.statusCode).toBe(200);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec?action=health',
      expect.objectContaining({
        method: 'GET',
        redirect: 'follow',
      })
    );
  });

  it('forwards POST request body with text/plain content-type and redirect: follow', async () => {
    const payload = JSON.stringify({ action: 'verifySession', idToken: 'test-token' });
    const mockResponse = JSON.stringify({ success: true, user: { email: 'gilbert.baidya@gmail.com' } });

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
      text: async () => mockResponse,
    });

    const res = await handler({
      httpMethod: 'POST',
      body: payload,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(mockResponse);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'text/plain' }),
        body: payload,
        redirect: 'follow',
      })
    );
  });

  it('returns 502 on upstream gateway failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toBe('Upstream gateway error');
  });
});
