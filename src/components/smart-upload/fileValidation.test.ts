import { describe, it, expect } from 'vitest';
import {
  validateSmartUploadFile,
  MAX_FILE_SIZE_BYTES
} from './fileValidation';

describe('Strict Smart Upload File Validation (fileValidation.ts)', () => {
  describe('1. File Size & Safe Cloud Transport Limit (4MB)', () => {
    it('enforces the safe 4MB cloud transport limit to avoid Netlify/Lambda 6MB payload overflow', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(4 * 1024 * 1024);

      // 500 KB file passes
      const smallFile = new File(['x'.repeat(100)], 'receipt.pdf', { type: 'application/pdf' });
      Object.defineProperty(smallFile, 'size', { value: 500 * 1024 });
      expect(validateSmartUploadFile(smallFile).valid).toBe(true);

      // 2 MB file passes
      const medFile = new File(['x'.repeat(100)], 'receipt.pdf', { type: 'application/pdf' });
      Object.defineProperty(medFile, 'size', { value: 2 * 1024 * 1024 });
      expect(validateSmartUploadFile(medFile).valid).toBe(true);

      // 4 MB file passes (exact limit)
      const maxFile = new File(['x'.repeat(100)], 'receipt.pdf', { type: 'application/pdf' });
      Object.defineProperty(maxFile, 'size', { value: 4 * 1024 * 1024 });
      expect(validateSmartUploadFile(maxFile).valid).toBe(true);

      // 4.1 MB file rejected
      const oversizedFile = new File(['x'.repeat(100)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(oversizedFile, 'size', { value: 4.1 * 1024 * 1024 });
      const res41 = validateSmartUploadFile(oversizedFile);
      expect(res41.valid).toBe(false);
      expect(res41.error).toContain('exceeds the maximum allowed size of 4MB');

      // 15 MB file rejected
      const hugeFile = new File(['x'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(hugeFile, 'size', { value: 15 * 1024 * 1024 });
      const res15 = validateSmartUploadFile(hugeFile);
      expect(res15.valid).toBe(false);
      expect(res15.error).toContain('exceeds the maximum allowed size of 4MB');
    });

    it('rejects null, undefined, or empty (0 byte) files', () => {
      expect(validateSmartUploadFile(null).valid).toBe(false);
      expect(validateSmartUploadFile(undefined).valid).toBe(false);

      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });
      const res = validateSmartUploadFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('0 bytes');
    });
  });

  describe('2. Valid MIME and Extension Pairings', () => {
    it('accepts legitimate matching MIME and extension pairs', () => {
      const pdf = new File(['pdf-data'], 'invoice.pdf', { type: 'application/pdf' });
      Object.defineProperty(pdf, 'size', { value: 102400 });
      expect(validateSmartUploadFile(pdf).valid).toBe(true);

      const jpg = new File(['jpg-data'], 'receipt.jpg', { type: 'image/jpeg' });
      Object.defineProperty(jpg, 'size', { value: 102400 });
      expect(validateSmartUploadFile(jpg).valid).toBe(true);

      const jpeg = new File(['jpeg-data'], 'receipt.jpeg', { type: 'image/jpeg' });
      Object.defineProperty(jpeg, 'size', { value: 102400 });
      expect(validateSmartUploadFile(jpeg).valid).toBe(true);

      const png = new File(['png-data'], 'proof.png', { type: 'image/png' });
      Object.defineProperty(png, 'size', { value: 102400 });
      expect(validateSmartUploadFile(png).valid).toBe(true);

      const webp = new File(['webp-data'], 'statement.webp', { type: 'image/webp' });
      Object.defineProperty(webp, 'size', { value: 102400 });
      expect(validateSmartUploadFile(webp).valid).toBe(true);
    });

    it('accepts valid whitelisted extension when mobile/browser supplies empty MIME type', () => {
      const cameraPhoto = new File(['raw-bytes'], 'camera_capture.jpg', { type: '' });
      Object.defineProperty(cameraPhoto, 'size', { value: 204800 });
      expect(validateSmartUploadFile(cameraPhoto).valid).toBe(true);
    });
  });

  describe('3. Strict Rejection of MIME-Extension Mismatches and Attacks', () => {
    it('rejects executable disguised with PDF extension (receipt.pdf with application/x-msdownload)', () => {
      const spoofedPdf = new File(['binary'], 'receipt.pdf', { type: 'application/x-msdownload' });
      Object.defineProperty(spoofedPdf, 'size', { value: 102400 });
      const res = validateSmartUploadFile(spoofedPdf);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Mismatched file extension and MIME type');
    });

    it('rejects executable disguised with PDF MIME (malware.exe with application/pdf)', () => {
      const spoofedExe = new File(['binary'], 'malware.exe', { type: 'application/pdf' });
      Object.defineProperty(spoofedExe, 'size', { value: 102400 });
      const res = validateSmartUploadFile(spoofedExe);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Executable, script, archive, and spreadsheet files are strictly not permitted');
    });

    it('rejects image with mismatched PDF MIME (photo.png with application/pdf)', () => {
      const mismatched = new File(['image-bytes'], 'photo.png', { type: 'application/pdf' });
      Object.defineProperty(mismatched, 'size', { value: 102400 });
      const res = validateSmartUploadFile(mismatched);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Mismatched file extension and MIME type');
    });

    it('rejects PDF with mismatched JPEG MIME (document.pdf with image/jpeg)', () => {
      const mismatched = new File(['pdf-bytes'], 'document.pdf', { type: 'image/jpeg' });
      Object.defineProperty(mismatched, 'size', { value: 102400 });
      const res = validateSmartUploadFile(mismatched);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Mismatched file extension and MIME type');
    });

    it('rejects script and archive files even if assigned an image/pdf MIME', () => {
      const zip = new File(['zip-bytes'], 'archive.zip', { type: 'application/pdf' });
      Object.defineProperty(zip, 'size', { value: 102400 });
      expect(validateSmartUploadFile(zip).valid).toBe(false);

      const script = new File(['js-bytes'], 'exploit.js', { type: 'application/pdf' });
      Object.defineProperty(script, 'size', { value: 102400 });
      expect(validateSmartUploadFile(script).valid).toBe(false);

      const svg = new File(['svg-xml'], 'vector.svg', { type: 'image/png' });
      Object.defineProperty(svg, 'size', { value: 102400 });
      expect(validateSmartUploadFile(svg).valid).toBe(false);

      const xlsx = new File(['sheet'], 'ledger.xlsx', { type: 'application/pdf' });
      Object.defineProperty(xlsx, 'size', { value: 102400 });
      expect(validateSmartUploadFile(xlsx).valid).toBe(false);
    });
  });
});
