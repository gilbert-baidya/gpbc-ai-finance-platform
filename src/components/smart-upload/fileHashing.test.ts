import { describe, it, expect } from 'vitest';
import { computeFileSha256 } from './fileHashing';

describe('Client-Side File Hashing (fileHashing.ts)', () => {
  it('computes exact SHA-256 hex string matching known digest', async () => {
    // "hello world" SHA-256 is b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const hash = await computeFileSha256(file);
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes identical hashes for identical file contents regardless of filename', async () => {
    const file1 = new File(['church expense 2026'], 'receipt_1.pdf', { type: 'application/pdf' });
    const file2 = new File(['church expense 2026'], 'receipt_scan.png', { type: 'image/png' });

    const hash1 = await computeFileSha256(file1);
    const hash2 = await computeFileSha256(file2);

    expect(hash1).toBeTruthy();
    expect(hash1).toBe(hash2);
  });

  it('computes different hashes for distinct file contents', async () => {
    const file1 = new File(['invoice A'], 'invoice.pdf', { type: 'application/pdf' });
    const file2 = new File(['invoice B'], 'invoice.pdf', { type: 'application/pdf' });

    const hash1 = await computeFileSha256(file1);
    const hash2 = await computeFileSha256(file2);

    expect(hash1).not.toBe(hash2);
  });

  it('returns empty string if file is null or undefined', async () => {
    expect(await computeFileSha256(null as any)).toBe('');
    expect(await computeFileSha256(undefined as any)).toBe('');
  });
});
