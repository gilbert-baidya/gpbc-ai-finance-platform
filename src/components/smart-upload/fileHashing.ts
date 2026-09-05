/*************************************************
 * GPBC Finance Desk — fileHashing.ts
 * Real client-side SHA-256 calculation using Web Crypto API
 * Safe fallback for environments where subtle is unavailable
 *************************************************/

export async function computeFileSha256(file: File | Blob): Promise<string> {
  if (!file) return '';

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Prefer standard Web Crypto API (SubtleCrypto)
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Node.js fallback (if Web Crypto subtle is absent in older node mocks)
    const nodeReq = (globalThis as unknown as { require?: (mod: string) => any }).require;
    const nodeBuf = (globalThis as unknown as { Buffer?: { from: (b: ArrayBuffer) => any } }).Buffer;
    if (typeof nodeReq === 'function' && nodeBuf) {
      const crypto = nodeReq('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(nodeBuf.from(arrayBuffer));
      return hash.digest('hex');
    }
  } catch (err) {
    console.warn('[SmartUpload] Could not compute client-side SHA-256 hash:', err);
  }

  return '';
}
