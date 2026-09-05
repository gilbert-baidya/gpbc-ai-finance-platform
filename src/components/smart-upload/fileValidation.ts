/*************************************************
 * GPBC Finance Desk — fileValidation.ts
 * Shared strict file validation utility for Smart Upload
 * Enforces 4MB safe cloud transport limit and strict MIME-extension matching
 * Prevents MIME-extension spoofing and rejects dangerous files
 *************************************************/

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

/**
 * Strict extension-to-MIME mapping.
 * Each extension is only compatible with its legitimate cryptographic/MIME types.
 */
export const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.webp': ['image/webp']
};

/**
 * Forbidden extensions that must be rejected regardless of MIME type
 */
export const FORBIDDEN_EXTENSIONS = [
  // Executables & binaries
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.msi', '.apk', '.app', '.com', '.vbs', '.ps1', '.bin', '.scr',
  // Archives
  '.zip', '.tar', '.gz', '.7z', '.rar', '.bz2', '.xz',
  // Markup & Scripts
  '.html', '.htm', '.xhtml', '.svg', '.xml', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.php', '.py', '.rb',
  // Spreadsheets & raw tables (not accepted via Smart Upload in Phase 1)
  '.xlsx', '.xls', '.csv', '.tsv', '.ods'
];

/**
 * Safe maximum file size limit: 4 MB (4,194,304 bytes).
 * Guarantees that base64 encoded request payload (~5.33 MB + JSON metadata)
 * stays safely under the strict 6 MB request body limit enforced by Netlify / AWS Lambda.
 */
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSmartUploadFile(file: File | null | undefined): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Please select or capture a file to upload.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb}MB) exceeds the maximum allowed size of 4MB for reliable cloud transport.`
    };
  }

  const fileName = (file.name || '').trim().toLowerCase();
  const extMatch = fileName.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';

  // 1. Check for explicitly forbidden extensions
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: 'Executable, script, archive, and spreadsheet files are strictly not permitted.'
    };
  }

  // 2. Enforce allowed extension whitelist
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: 'Unsupported file format. Allowed formats: PDF, JPG, PNG, WEBP.'
    };
  }

  const mimeType = (file.type || '').trim().toLowerCase();

  // 3. Strict MIME type validation:
  // If the browser/camera supplies an empty MIME type (""), we allow it IF the extension is whitelisted,
  // delegating deep signature/magic-byte verification to the backend.
  // If a MIME type IS supplied, it MUST match the extension mapping!
  if (mimeType) {
    const allowedMimesForExt = EXTENSION_MIME_MAP[ext] || [];
    if (!allowedMimesForExt.includes(mimeType)) {
      return {
        valid: false,
        error: 'Mismatched file extension and MIME type. The file content type does not match its filename extension.'
      };
    }
  }

  return { valid: true };
}
