/**
 * GPBC Finance Desk — Statement Processing Pipeline
 *
 * Orchestrates zero-input end-to-end extraction, classification, matching, and routing.
 */

import {
  StatementImportResult,
  StatementImportSummary,
  ProcessedStatementLine,
  ExtractedStatementLine
} from './types';
import { parseStatementText } from './statementParser';
import { classifyCategory } from './categoryEngine';
import { inferPurpose } from './purposeEngine';
import { routeStatementLine, RouteStatementOptions } from './statementRouter';
import { StatementExtractionProvider, OpenAIStatementExtractionProvider, ExtractionInput } from './aiProviders';

export interface ProcessPipelineOptions extends RouteStatementOptions {
  sourceDocumentId?: string;
  sourceFileName?: string;
  sourcePage?: number;
  defaultYear?: number;
  historicalTransactions?: Array<{ payeeOrPayer: string; category: string }>;
  extractionProvider?: StatementExtractionProvider;
}

export function processExtractedLines(
  extractedLines: ExtractedStatementLine[],
  options: ProcessPipelineOptions = {}
): StatementImportResult {
  const processedLines: ProcessedStatementLine[] = [];
  let automaticallyClassifiedCount = 0;
  let matchedCount = 0;
  let needsReviewCount = 0;
  let duplicatesSkippedCount = 0;
  let totalIncomeAmount = 0;
  let totalExpenseAmount = 0;

  for (const line of extractedLines) {
    // 1. Classify Category
    const classification = classifyCategory(
      line.merchantOrPayee,
      line.rawDescription,
      line.direction,
      options.historicalTransactions || []
    );

    // 2. Infer Purpose
    const purpose = inferPurpose(
      line.merchantOrPayee,
      classification.category,
      line.rawDescription,
      line.paymentChannel,
      line.direction
    );

    // 3. Route & Link
    const processed = routeStatementLine(line, classification, purpose, {
      closedPeriodKeys: options.closedPeriodKeys,
      existingTransactions: options.existingTransactions,
      existingStagedLines: options.existingStagedLines
    });

    processedLines.push(processed);

    // Accumulate metrics
    if (processed.direction === 'INCOME') {
      totalIncomeAmount += processed.amount;
    } else {
      totalExpenseAmount += processed.amount;
    }

    if (processed.isDuplicate && processed.duplicateType === 'EXACT') {
      duplicatesSkippedCount++;
    }

    if (processed.matchedTransactionId) {
      matchedCount++;
    }

    if (processed.classificationStatus === 'AUTOMATIC' && !processed.isClosedPeriod && !processed.isDuplicate) {
      automaticallyClassifiedCount++;
    }

    if (
      processed.classificationStatus === 'NEEDS_REVIEW' ||
      processed.isClosedPeriod ||
      processed.isRefund ||
      (processed.isDuplicate && processed.duplicateType === 'PROBABLE')
    ) {
      needsReviewCount++;
    }
  }

  const summary: StatementImportSummary = {
    totalExtracted: processedLines.length,
    automaticallyClassified: automaticallyClassifiedCount,
    matchedToExisting: matchedCount,
    needsReview: needsReviewCount,
    duplicatesSkipped: duplicatesSkippedCount,
    totalIncomeAmount: Math.round(totalIncomeAmount * 100) / 100,
    totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
    sourceDocumentId: options.sourceDocumentId,
    sourceFileName: options.sourceFileName,
    processedAt: new Date().toISOString()
  };

  return {
    success: true,
    summary,
    lines: processedLines,
    documentId: options.sourceDocumentId
  };
}

export function processStatementContent(
  rawContent: string,
  options: ProcessPipelineOptions = {}
): StatementImportResult {
  const extractedLines = parseStatementText(rawContent, {
    sourceDocumentId: options.sourceDocumentId,
    sourcePage: options.sourcePage,
    defaultYear: options.defaultYear
  });

  return processExtractedLines(extractedLines, options);
}

export async function processStatementDocument(
  input: ExtractionInput | string | ArrayBuffer,
  options: ProcessPipelineOptions = {}
): Promise<StatementImportResult> {
  const provider = options.extractionProvider || new OpenAIStatementExtractionProvider();
  const extractedLines = await provider.extract(input, typeof input === 'object' && 'mimeType' in input ? input.mimeType : undefined);
  return processExtractedLines(extractedLines, options);
}
