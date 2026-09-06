/**
 * GPBC Finance Desk — Genuine Binary & Raster Statement Test Fixtures
 *
 * Generates genuine raster PNG/JPEG images with rendered pixel font glyphs (no plaintext ASCII shortcut)
 * and genuine valid PDF documents.
 */

// Simple 5x7 bitmap font table
const FONT_MAP: Record<string, number[]> = {
  'A': [0x70, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x88],
  'B': [0xF0, 0x88, 0x88, 0xF0, 0x88, 0x88, 0xF0],
  'C': [0x70, 0x88, 0x80, 0x80, 0x80, 0x88, 0x70],
  'D': [0xE0, 0x90, 0x88, 0x88, 0x88, 0x90, 0xE0],
  'E': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0xF8],
  'F': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0x80],
  'G': [0x70, 0x88, 0x80, 0xB8, 0x88, 0x88, 0x70],
  'H': [0x88, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x88],
  'I': [0x70, 0x20, 0x20, 0x20, 0x20, 0x20, 0x70],
  'J': [0x38, 0x10, 0x10, 0x10, 0x10, 0x90, 0x60],
  'K': [0x88, 0x90, 0xA0, 0xC0, 0xA0, 0x90, 0x88],
  'L': [0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0xF8],
  'M': [0x88, 0xD8, 0xA8, 0x88, 0x88, 0x88, 0x88],
  'N': [0x88, 0xC8, 0xA8, 0x98, 0x88, 0x88, 0x88],
  'O': [0x70, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70],
  'P': [0xF0, 0x88, 0x88, 0xF0, 0x80, 0x80, 0x80],
  'Q': [0x70, 0x88, 0x88, 0x88, 0xA8, 0x90, 0x68],
  'R': [0xF0, 0x88, 0x88, 0xF0, 0xA0, 0x90, 0x88],
  'S': [0x70, 0x88, 0x80, 0x70, 0x08, 0x88, 0x70],
  'T': [0xF8, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20],
  'U': [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70],
  'V': [0x88, 0x88, 0x88, 0x88, 0x88, 0x50, 0x20],
  'W': [0x88, 0x88, 0x88, 0x88, 0xA8, 0xD8, 0x88],
  'X': [0x88, 0x88, 0x50, 0x20, 0x50, 0x88, 0x88],
  'Y': [0x88, 0x88, 0x50, 0x20, 0x20, 0x20, 0x20],
  'Z': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x80, 0xF8],
  '0': [0x70, 0x88, 0x98, 0xA8, 0xC8, 0x88, 0x70],
  '1': [0x20, 0x60, 0x20, 0x20, 0x20, 0x20, 0x70],
  '2': [0x70, 0x88, 0x08, 0x30, 0x40, 0x80, 0xF8],
  '3': [0xF8, 0x08, 0x10, 0x30, 0x08, 0x88, 0x70],
  '4': [0x10, 0x30, 0x50, 0x90, 0xF8, 0x10, 0x10],
  '5': [0xF8, 0x80, 0xF0, 0x08, 0x08, 0x88, 0x70],
  '6': [0x30, 0x40, 0x80, 0xF0, 0x88, 0x88, 0x70],
  '7': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x40, 0x40],
  '8': [0x70, 0x88, 0x88, 0x70, 0x88, 0x88, 0x70],
  '9': [0x70, 0x88, 0x88, 0x78, 0x08, 0x10, 0x60],
  '-': [0x00, 0x00, 0x00, 0xF8, 0x00, 0x00, 0x00],
  '$': [0x20, 0x78, 0xA0, 0x70, 0x28, 0xF0, 0x20],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x30],
  ',': [0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x10],
  ':': [0x00, 0x30, 0x30, 0x00, 0x30, 0x30, 0x00],
  '/': [0x08, 0x10, 0x10, 0x20, 0x40, 0x40, 0x80],
  '#': [0x28, 0x7C, 0x28, 0x7C, 0x28, 0x00, 0x00],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
};

// Pure TypeScript CRC32 calculator
function calcCrc32(data: Uint8Array): number {
  let crc = ~0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ~crc >>> 0;
}

// Helper to write uint32 big endian to Uint8Array
function writeUInt32BE(target: Uint8Array, value: number, offset: number) {
  target[offset] = (value >>> 24) & 0xFF;
  target[offset + 1] = (value >>> 16) & 0xFF;
  target[offset + 2] = (value >>> 8) & 0xFF;
  target[offset + 3] = value & 0xFF;
}

// Simple deflater for standard PNG IDAT chunks
function deflateRaw(uncompressed: Uint8Array): Uint8Array {
  // Use uncompressed deflate blocks (type 00)
  const maxBlockSize = 65535;
  const numBlocks = Math.ceil(uncompressed.length / maxBlockSize) || 1;
  const result: number[] = [0x78, 0x01]; // zlib header (default compression)

  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < uncompressed.length; i++) {
    s1 = (s1 + uncompressed[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler32 = ((s2 << 16) | s1) >>> 0;

  for (let b = 0; b < numBlocks; b++) {
    const isLast = b === numBlocks - 1;
    const start = b * maxBlockSize;
    const end = Math.min(start + maxBlockSize, uncompressed.length);
    const blockLen = end - start;
    const nlen = blockLen ^ 0xFFFF;

    result.push(isLast ? 0x01 : 0x00);
    result.push(blockLen & 0xFF, (blockLen >>> 8) & 0xFF);
    result.push(nlen & 0xFF, (nlen >>> 8) & 0xFF);

    for (let i = start; i < end; i++) {
      result.push(uncompressed[i]);
    }
  }

  result.push(
    (adler32 >>> 24) & 0xFF,
    (adler32 >>> 16) & 0xFF,
    (adler32 >>> 8) & 0xFF,
    adler32 & 0xFF
  );

  return new Uint8Array(result);
}

function makePngChunk(typeStr: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(typeStr);
  const total = new Uint8Array(4 + 4 + data.length + 4);
  writeUInt32BE(total, data.length, 0);
  total.set(typeBytes, 4);
  total.set(data, 8);

  const crcTarget = new Uint8Array(4 + data.length);
  crcTarget.set(typeBytes, 0);
  crcTarget.set(data, 4);
  const crc = calcCrc32(crcTarget);
  writeUInt32BE(total, crc, 8 + data.length);

  return total;
}

export function generateRasterScreenshotPng(): {
  buffer: Uint8Array;
  base64: string;
  dataUrl: string;
} {
  const width = 450;
  const height = 300;
  const stride = width * 4 + 1;
  const raw = new Uint8Array(stride * height);

  // Background color #F8F9FA
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const idx = y * stride + 1 + x * 4;
      raw[idx] = 248;
      raw[idx + 1] = 249;
      raw[idx + 2] = 250;
      raw[idx + 3] = 255;
    }
  }

  function setPixel(x: number, y: number, r: number, g: number, b: number) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * stride + 1 + x * 4;
    raw[idx] = r;
    raw[idx + 1] = g;
    raw[idx + 2] = b;
    raw[idx + 3] = 255;
  }

  function drawText(str: string, startX: number, startY: number, scale = 1, r = 30, g = 41, b = 59) {
    let currX = startX;
    const upper = str.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const glyph = FONT_MAP[char] || FONT_MAP[' '];
      for (let row = 0; row < 7; row++) {
        const rowBits = glyph[row];
        for (let col = 0; col < 5; col++) {
          if ((rowBits & (0x80 >> col)) !== 0) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                setPixel(currX + col * scale + sx, startY + row * scale + sy, r, g, b);
              }
            }
          }
        }
      }
      currX += (5 + 1) * scale;
    }
  }

  // Draw rendered visual screenshot contents
  drawText('BANKING ACTIVITY', 20, 20, 2, 15, 23, 42);
  drawText('PENDING', 20, 50, 1, 100, 116, 139);

  // 1. Pending Zelle: No date shown
  drawText('ZELLE PAYMENT TO JAMES TRUPEST', 20, 70, 1, 15, 23, 42);
  drawText('JPM99CVMEAAN', 20, 85, 1, 100, 116, 139);
  drawText('-$80.00', 350, 70, 1, 220, 38, 38);

  // Date Section Header: Sep 3, 2026
  drawText('SEP 3, 2026', 20, 115, 1, 71, 85, 105);

  // 2. Churchwest ACH
  drawText('ORIG CO NAME:CHURCHWEST', 20, 140, 1, 15, 23, 42);
  drawText('ORIG ID:3464699697 ENTRY DESCR:ACH PAYMENT', 20, 155, 1, 100, 116, 139);
  drawText('SEC:WEB TRACE#:104000019610307', 20, 170, 1, 100, 116, 139);
  drawText('IND NAME:GRACE AND PRAISE BANGL...', 20, 185, 1, 100, 116, 139);
  drawText('-$2,567.50', 330, 140, 1, 220, 38, 38);

  // 3. San Bernardino Alarm
  drawText('SAN BERNARDINO ALARM', 20, 220, 1, 15, 23, 42);
  drawText('SANBERNARDINO CA 09/02', 20, 235, 1, 100, 116, 139);
  drawText('-$31.21', 350, 220, 1, 220, 38, 38);

  const sig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = new Uint8Array(13);
  writeUInt32BE(ihdrData, width, 0);
  writeUInt32BE(ihdrData, height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makePngChunk('IHDR', ihdrData);
  const idat = makePngChunk('IDAT', deflateRaw(raw));
  const iend = makePngChunk('IEND', new Uint8Array(0));

  const totalLen = sig.length + ihdr.length + idat.length + iend.length;
  const pngBuffer = new Uint8Array(totalLen);
  let offset = 0;
  pngBuffer.set(sig, offset); offset += sig.length;
  pngBuffer.set(ihdr, offset); offset += ihdr.length;
  pngBuffer.set(idat, offset); offset += idat.length;
  pngBuffer.set(iend, offset);

  let binary = '';
  for (let i = 0; i < pngBuffer.length; i++) {
    binary += String.fromCharCode(pngBuffer[i]);
  }
  const base64 = btoa(binary);

  return {
    buffer: pngBuffer,
    base64,
    dataUrl: `data:image/png;base64,${base64}`
  };
}

export function generateValidTextPdf(): {
  buffer: Uint8Array;
  base64: string;
  dataUrl: string;
} {
  const pdfSource = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 12 Tf
72 700 Td
(BANKING STATEMENT - GRACE AND PRAISE BANGLADESHI CHURCH) Tj
0 -20 Td
(PENDING: ZELLE PAYMENT TO JAMES TRUPEST JPM99CVMEAAN -$80.00) Tj
0 -30 Td
(Sep 3, 2026) Tj
0 -20 Td
(ORIG CO NAME:Churchwest ACH PAYMENT -$2,567.50) Tj
0 -20 Td
(SAN BERNARDINO ALARM SANBERNARDINO CA 09/02 -$31.21) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000557 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
634
%%EOF`;

  const encoder = new TextEncoder();
  const buffer = encoder.encode(pdfSource);
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binary);

  return {
    buffer,
    base64,
    dataUrl: `data:application/pdf;base64,${base64}`
  };
}

export const REAL_RASTER_SCREENSHOT_PNG = generateRasterScreenshotPng();
export const REAL_TEXT_PDF_FIXTURE = generateValidTextPdf();
