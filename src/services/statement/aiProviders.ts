/**
 * GPBC Finance Desk — AI Provider Abstraction
 *
 * Defines pluggable provider interfaces for vision extraction and AI classification.
 * All API keys and provider secrets remain server-side.
 */

import { ExtractedStatementLine, ClassificationResult, Direction, PaymentChannel } from './types';
import { parseStatementText } from './statementParser';
import { classifyCategory } from './categoryEngine';
import { normalizeMerchant } from './merchantNormalizer';
import { statementImportApi } from '../../api/statementImportApi';

export interface ExtractionInput {
  fileBase64?: string;
  fileBuffer?: ArrayBuffer;
  rawText?: string;
  mimeType: string;
  fileName?: string;
  sourceDocumentId?: string;
}

export interface StatementExtractionProvider {
  name: string;
  extract(input: ExtractionInput | string | ArrayBuffer, mimeType?: string): Promise<ExtractedStatementLine[]>;
}

export interface StatementClassificationProvider {
  name: string;
  classify(merchant: string, rawText: string, direction: Direction): Promise<ClassificationResult | null>;
}

/**
 * Server-Side Vision / OCR Provider (Gemini 1.5 Flash Vision)
 * Sends binary base64 to Netlify serverless function.
 */
export class ServerVisionExtractionProvider implements StatementExtractionProvider {
  name = 'ServerVisionProvider';

  async extract(input: ExtractionInput | string | ArrayBuffer, defaultMime?: string): Promise<ExtractedStatementLine[]> {
    let fileBase64 = '';
    let mimeType = defaultMime || 'image/png';
    let fileName = 'statement-document';
    let sourceDocumentId = `DOC-STMT-${Date.now()}`;

    if (typeof input === 'string') {
      if (input.startsWith('data:') || input.length > 500) {
        fileBase64 = input;
      } else {
        // Plain text fallback
        return parseStatementText(input, { sourceDocumentId });
      }
    } else if (input instanceof ArrayBuffer) {
      const bytes = new Uint8Array(input);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      fileBase64 = btoa(binary);
    } else {
      fileBase64 = input.fileBase64 || '';
      mimeType = input.mimeType || mimeType;
      fileName = input.fileName || fileName;
      sourceDocumentId = input.sourceDocumentId || sourceDocumentId;

      if (!fileBase64 && input.fileBuffer) {
        const bytes = new Uint8Array(input.fileBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
      } else if (!fileBase64 && input.rawText) {
        return parseStatementText(input.rawText, { sourceDocumentId });
      }
    }

    // Call server-side function
    const response = await statementImportApi.extractStatementDocument({
      fileBase64,
      mimeType,
      fileName
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Server-side vision extraction failed');
    }

    if (Array.isArray(response.transactions) && response.transactions.length > 0) {
      return response.transactions.map((tx, idx) => {
        const normalized = normalizeMerchant(tx.rawDescription);
        let channel: PaymentChannel = 'UNKNOWN';
        if (normalized.channelHint === 'ACH') channel = 'ACH';
        else if (normalized.channelHint === 'ZELLE') channel = 'ZELLE';
        else if (tx.rawDescription.toLowerCase().includes('check')) channel = 'CHECK';
        else if (tx.rawDescription.toLowerCase().includes('wire')) channel = 'WIRE';
        else channel = 'DEBIT_CARD';

        return {
          tempId: `EXT-VIS-${Date.now()}-${idx + 1}`,
          transactionDate: tx.date || null,
          postedDate: tx.date || null,
          rawDescription: tx.rawDescription,
          cleanDescription: normalized.canonicalMerchant || tx.rawDescription,
          merchantOrPayee: normalized.canonicalMerchant || tx.rawDescription,
          amount: Math.abs(tx.amount),
          direction: tx.direction,
          paymentChannel: channel,
          referenceNumber: tx.referenceNumber || normalized.referenceNumber,
          sourceDocumentId
        };
      });
    }

    // If transactions array was empty, parse returned rawText
    if (response.rawText) {
      return parseStatementText(response.rawText, { sourceDocumentId });
    }

    return [];
  }
}

export class OpenAIStatementExtractionProvider extends ServerVisionExtractionProvider {
  override name = 'OpenAIStatementExtractionProvider';
}

export class GeminiVisionStatementExtractionProvider extends ServerVisionExtractionProvider {
  override name = 'GeminiVisionStatementExtractionProvider';
}

export class LocalDeterministicExtractionProvider implements StatementExtractionProvider {
  name = 'LocalDeterministicParser';

  async extract(input: ExtractionInput | string | ArrayBuffer, _mimeType?: string): Promise<ExtractedStatementLine[]> {
    let text = '';
    if (typeof input === 'string') {
      text = input;
    } else if (input instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(input);
    } else {
      text = input.rawText || '';
    }
    return parseStatementText(text);
  }
}

export class LocalDeterministicClassificationProvider implements StatementClassificationProvider {
  name = 'LocalDeterministicClassifier';

  async classify(merchant: string, rawText: string, direction: Direction): Promise<ClassificationResult | null> {
    return classifyCategory(merchant, rawText, direction);
  }
}
