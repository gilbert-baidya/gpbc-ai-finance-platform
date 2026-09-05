import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Google Identity initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.querySelectorAll('script').forEach((script) => script.remove());
    delete window.google;
  });

  it('loads the GIS script and initializes once for concurrent callers', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const { prepareGoogleIdentity } = await import('./googleIdentity');

    const first = prepareGoogleIdentity('approved-client-id');
    const second = prepareGoogleIdentity('approved-client-id');
    const scripts = document.head.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]');

    expect(scripts).toHaveLength(1);

    window.google = { accounts: { id: { initialize, renderButton } } };
    scripts[0].dispatchEvent(new Event('load'));

    await Promise.all([first, second]);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'approved-client-id',
      callback: expect.any(Function),
    }));
  });

  it('keeps the latest mounted credential handler active', async () => {
    const initialize = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
    const { prepareGoogleIdentity, setGoogleCredentialHandler } = await import('./googleIdentity');
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    const removeFirst = setGoogleCredentialHandler(firstHandler);

    await prepareGoogleIdentity('approved-client-id');
    const callback = initialize.mock.calls[0][0].callback;
    setGoogleCredentialHandler(secondHandler);
    removeFirst();
    callback({ credential: 'fresh-token' });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith({ credential: 'fresh-token' });
  });
});