import { describe, it, expect, vi, beforeEach } from 'vitest';
import { smartUploadApi } from './smartUploadApi';
import * as gasFetchModule from './gasFetch';

describe('Smart Upload Client API (Authoritative Backend & Same-Origin Routing)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uploadSmartDocument sets relatedEntityType to NONE to eliminate double-linking on upload', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValue({
      success: true,
      documentId: 'DOC-202608-123456',
      status: 'Unlinked'
    } as any);

    const res = await smartUploadApi.uploadSmartDocument({
      documentType: 'Receipt',
      title: 'Walmart Supplies',
      vendor: 'Walmart',
      amount: 45.54,
      description: 'Sanctuary cleaning supplies',
      documentDate: '2026-08-12'
    });

    expect(spy).toHaveBeenCalledWith(
      'uploadDocument',
      expect.objectContaining({
        documentType: 'Receipt',
        title: 'Walmart Supplies',
        relatedEntityType: 'NONE',
        relatedEntityId: '',
        relatedTransactionId: '',
        notes: expect.stringContaining('[GPBC_SMART_UPLOAD_META:')
      })
    );
    expect(res.success).toBe(true);
    expect(res.documentId).toBe('DOC-202608-123456');
  });

  it('checkDuplicate delegates authoritatively to backend checkDocumentDuplicate with SHA-256 and params', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValue({
      success: true,
      isDuplicate: true,
      duplicateDocumentId: 'DOC-EXISTING-001',
      duplicateTitle: 'Existing Receipt',
      reason: 'Exact content hash match (SHA-256)'
    } as any);

    const check = await smartUploadApi.checkDuplicate({
      contentHash: 'hash-abc-123',
      filename: 'receipt.pdf',
      fileSize: 1024,
      documentDate: '2026-08-12',
      amount: 45.54,
      vendor: 'Walmart'
    });

    expect(spy).toHaveBeenCalledWith(
      'checkDocumentDuplicate',
      expect.objectContaining({
        contentHash: 'hash-abc-123',
        filename: 'receipt.pdf',
        fileSize: 1024,
        documentDate: '2026-08-12',
        amount: 45.54,
        vendor: 'Walmart'
      })
    );
    expect(check.isDuplicate).toBe(true);
    expect(check.duplicateDocument?.documentId).toBe('DOC-EXISTING-001');
    expect(check.reason).toContain('SHA-256');
  });

  it('findMatches routes authoritatively to backend findDocumentMatches instead of local client ranking', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValue({
      success: true,
      count: 1,
      matches: [
        {
          candidate: {
            id: 'TXN-909',
            entityType: 'TRANSACTION',
            entityId: '909',
            displayTitle: 'Walmart Supercenter - $45.54',
            amount: 45.54
          },
          score: 85,
          confidenceLabel: 'Strong Match',
          reasons: ['Exact amount match', 'Exact vendor match']
        }
      ]
    } as any);

    const matches = await smartUploadApi.findMatches({
      documentType: 'Receipt',
      vendor: 'Walmart',
      amount: 45.54,
      date: '2026-08-12'
    });

    expect(spy).toHaveBeenCalledWith(
      'findDocumentMatches',
      expect.objectContaining({
        documentType: 'Receipt',
        vendor: 'Walmart',
        amount: 45.54,
        date: '2026-08-12'
      })
    );
    expect(matches.length).toBe(1);
    expect(matches[0].candidate.entityId).toBe('909');
    expect(matches[0].confidenceLabel).toBe('Strong Match');
  });

  it('getSmartUploadOptions fetches authoritative closed periods and capital projects from backend', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValue({
      success: true,
      closedPeriods: ['2026-07'],
      capitalProjects: [{ id: 'PRJ-SANCTUARY', name: 'Sanctuary Renovation' }],
      documentTypes: ['Receipt', 'Invoice']
    } as any);

    const res = await smartUploadApi.getSmartUploadOptions();

    expect(spy).toHaveBeenCalledWith('getSmartUploadOptions', {});
    expect(res.success).toBe(true);
    expect(res.closedPeriods).toEqual(['2026-07']);
    expect(res.capitalProjects[0].id).toBe('PRJ-SANCTUARY');
  });

  it('linkDocumentToEntity calls backend linkDocumentToEntity once for relationship mutation', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValue({
      success: true,
      documentId: 'DOC-123',
      status: 'Linked',
      updatedAt: '2026-09-05T12:00:00.000Z'
    } as any);

    const res = await smartUploadApi.linkDocumentToEntity({
      documentId: 'DOC-123',
      relatedEntityType: 'TRANSACTION',
      relatedEntityId: 'TXN-999',
      relatedTransactionId: 'TXN-999'
    });

    expect(spy).toHaveBeenCalledWith(
      'linkDocumentToEntity',
      expect.objectContaining({
        documentId: 'DOC-123',
        relatedEntityType: 'TRANSACTION',
        relatedEntityId: 'TXN-999',
        relatedTransactionId: 'TXN-999'
      })
    );
    expect(res.success).toBe(true);
    expect(res.status).toBe('Linked');
  });
});
