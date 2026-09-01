import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { gasFetch, setActiveIdToken } from './gasFetch';

describe('gasFetch Client API Wrapper', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setActiveIdToken(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends simple text/plain POST request with action and payload', async () => {
    const mockResponse = { success: true, totals: { tithe: 100 } };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await gasFetch('getDashboardSummary', { month: 0, year: 2026 });
    expect(result).toEqual(mockResponse);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (globalThis.fetch as any).mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'text/plain' });

    const sentBody = JSON.parse(options.body);
    expect(sentBody.action).toBe('getDashboardSummary');
    expect(sentBody.payload).toEqual({ month: 0, year: 2026 });
    expect(sentBody.idToken).toBeUndefined();
  });

  it('includes ID token in request body when active token is set', async () => {
    setActiveIdToken('test-google-id-token-12345');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await gasFetch('getMembers');

    const [, options] = (globalThis.fetch as any).mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.action).toBe('getMembers');
    expect(sentBody.idToken).toBe('test-google-id-token-12345');
  });

  it('throws an error when backend returns success: false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Unauthorized: Invalid token' }),
    });

    await expect(gasFetch('getDashboardSummary')).rejects.toThrow('Unauthorized: Invalid token');
  });

  it('throws an error for HTTP failures', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(gasFetch('getDashboardSummary')).rejects.toThrow('HTTP 500: Internal Server Error');
  });
});
