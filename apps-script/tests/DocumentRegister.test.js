import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  SCHEMA_DEFINITIONS,
  getConfig
} = require('../Config.gs');

const {
  DOCUMENT_TYPES,
  DOCUMENT_CATEGORY_FOLDERS,
  MONTH_NAMES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  getMonthFolderName,
  getCategoryFolderName,
  generateSafeStoredFileName,
  computeContentHash,
  resolveDriveFolder,
  getDocuments,
  uploadDocument,
  linkDocumentToEntity,
  updateDocumentStatus,
  deleteDocument
} = require('../Documents.gs');

const {
  authorizeAction
} = require('../Auth.gs');

describe('Document Register & Canonical Drive Engine Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_DRIVE_ROOT_FOLDER_ID') return '1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx';
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          if (key === 'GPBC_SHEET_ID') return '1y3kTt5MTMvi4XTEDL6ZgydIX4NDMYGFdHx5w4QCQAwA';
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
          return null;
        }
      })
    };
  });

  describe('1. Schema & Configuration Definitions', () => {
    it('Document_Register schema contains all 31 canonical columns including post-close audit fields', () => {
      const schema = SCHEMA_DEFINITIONS['Document_Register'];
      expect(Array.isArray(schema)).toBe(true);
      expect(schema.length).toBe(31);
      expect(schema).toEqual([
        'documentId',
        'documentType',
        'title',
        'originalFileName',
        'storedFileName',
        'mimeType',
        'fileSize',
        'driveFileId',
        'driveFileUrl',
        'driveFolderId',
        'documentDate',
        'financeYear',
        'financeMonth',
        'relatedEntityType',
        'relatedEntityId',
        'relatedTransactionId',
        'relatedReimbursementId',
        'relatedCapitalProjectId',
        'relatedCheckId',
        'source',
        'contentHash',
        'status',
        'isPostCloseAddition',
        'postCloseReason',
        'addedAfterCloseAt',
        'addedAfterCloseBy',
        'closedPeriodReference',
        'notes',
        'uploadedBy',
        'uploadedAt',
        'updatedAt'
      ]);
    });

    it('Config retrieves GPBC_DRIVE_ROOT_FOLDER_ID and verifies sandbox environment', () => {
      const config = getConfig();
      expect(config.driveRootFolderId).toBe('1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx');
      expect(config.environment).toBe('sandbox');
      expect(config.productionWritesEnabled).toBe('false');
    });
  });

  describe('2. Folder Hierarchy & Path Generation', () => {
    it('getMonthFolderName formats 1-12 into two-digit month names', () => {
      expect(getMonthFolderName(1)).toBe('01 - January');
      expect(getMonthFolderName('09')).toBe('09 - September');
      expect(getMonthFolderName(12)).toBe('12 - December');
      expect(getMonthFolderName(99)).toBe('00 - General');
    });

    it('getCategoryFolderName maps document types correctly to folder categories', () => {
      expect(getCategoryFolderName('Receipt')).toBe('Receipts');
      expect(getCategoryFolderName('Invoice')).toBe('Invoices');
      expect(getCategoryFolderName('Check')).toBe('Checks');
      expect(getCategoryFolderName('Reimbursement Evidence')).toBe('Reimbursements');
      expect(getCategoryFolderName('Bank Statement')).toBe('Bank Statements');
      expect(getCategoryFolderName('Credit Card Statement')).toBe('Credit Card Statements');
      expect(getCategoryFolderName('Capital Project')).toBe('Capital Projects');
      expect(getCategoryFolderName('Finance Report')).toBe('Reports');
      expect(getCategoryFolderName('Other Supporting Document')).toBe('Other');
      expect(getCategoryFolderName('UnknownType')).toBe('Other');
    });

    it('resolveDriveFolder calculates canonical path hierarchy: Year / Month / Category', () => {
      const result = resolveDriveFolder(2026, 9, 'Receipt');
      expect(result.folderPath).toBe('2026/09 - September/Receipts');
      expect(result.folderName).toBe('Receipts');

      const bankResult = resolveDriveFolder(2027, 1, 'Bank Statement');
      expect(bankResult.folderPath).toBe('2027/01 - January/Bank Statements');
    });

    it('resolveDriveFolder is idempotent and reuses consistent hierarchical paths', () => {
      const call1 = resolveDriveFolder(2026, 9, 'Receipt');
      const call2 = resolveDriveFolder(2026, 9, 'Receipt');
      expect(call1.folderPath).toBe(call2.folderPath);
      expect(call1.folderName).toBe(call2.folderName);
    });
  });

  describe('3. File Validation & Normalization', () => {
    it('generateSafeStoredFileName creates safe sanitized filenames', () => {
      const safeName = generateSafeStoredFileName('2026-09-02', 'Receipt', 'Home Depot - Paint Supplies', 'invoice.pdf');
      expect(safeName).toMatch(/^2026-09-02_Receipt_Home_Depot_-_Paint_Supplies_[a-z0-9]+\.pdf$/);
    });

    it('computeContentHash computes deterministic SHA-256 hash', () => {
      const sampleBase64 = Buffer.from('Test GPBC Finance Document Content 2026').toString('base64');
      const hash1 = computeContentHash(sampleBase64);
      const hash2 = computeContentHash(sampleBase64);
      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });
  });

  describe('4. Server-Side Role Authorization', () => {
    it('allows OPERATIONAL_READERS to call getDocuments and denies Presbyter Read-Only', () => {
      expect(authorizeAction('getDocuments', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('getDocuments', 'Backup Admin').authorized).toBe(true);
      expect(authorizeAction('getDocuments', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('getDocuments', 'Viewer').authorized).toBe(true);
      expect(authorizeAction('getDocuments', 'Presbyter Read-Only').authorized).toBe(false);
    });

    it('restricts uploadDocument and linkDocumentToEntity to FINANCE_WRITERS', () => {
      expect(authorizeAction('uploadDocument', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('uploadDocument', 'Backup Admin').authorized).toBe(true);
      expect(authorizeAction('uploadDocument', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('uploadDocument', 'Viewer').authorized).toBe(false);
      expect(authorizeAction('uploadDocument', 'Presbyter Read-Only').authorized).toBe(false);

      expect(authorizeAction('linkDocumentToEntity', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('linkDocumentToEntity', 'Viewer').authorized).toBe(false);
    });

    it('restricts deleteDocument to ALL_ADMINS only', () => {
      expect(authorizeAction('deleteDocument', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('deleteDocument', 'Backup Admin').authorized).toBe(true);
      expect(authorizeAction('deleteDocument', 'Finance Editor').authorized).toBe(false);
      expect(authorizeAction('deleteDocument', 'Viewer').authorized).toBe(false);
      expect(authorizeAction('deleteDocument', 'Presbyter Read-Only').authorized).toBe(false);
    });
  });

  describe('5. Document_Register CRUD, Post-Close Evidence & Duplicate Protection', () => {
    let mockHeaders;
    let mockRows;
    let mockSheet;
    let mockDB;

    beforeEach(() => {
      mockHeaders = [...SCHEMA_DEFINITIONS['Document_Register']];
      mockRows = [
        [
          'DOC-202608-100001',
          'Receipt',
          'August Office Supplies',
          'office_supplies.pdf',
          '2026-08-15_Receipt_August_Office_Supplies_abc123.pdf',
          'application/pdf',
          102400,
          'DRV-FILE-001',
          'https://drive.google.com/file/d/DRV-FILE-001/view',
          'mock-folder-2026-8-receipts',
          '2026-08-15',
          2026,
          8,
          'TRANSACTION',
          'TXN-2026-08-01',
          'TXN-2026-08-01',
          '',
          '',
          '',
          'Manual Upload',
          'hash_august_receipt_123',
          'Linked',
          false,
          '',
          '',
          '',
          '',
          'Purchased ink & paper',
          'editor@gracepraise.church',
          '2026-08-15T14:00:00.000Z',
          '2026-08-15T14:00:00.000Z'
        ]
      ];

      mockSheet = {
        getLastRow: () => mockRows.length + 1,
        getLastColumn: () => mockHeaders.length,
        getDataRange: () => ({
          getValues: () => [mockHeaders, ...mockRows.map(r => [...r])]
        }),
        appendRow: vi.fn((row) => {
          mockRows.push(row);
        }),
        getRange: vi.fn((row, col) => ({
          setValue: vi.fn((val) => {
            if (row >= 2 && row <= mockRows.length + 1) {
              mockRows[row - 2][col - 1] = val;
            }
          })
        })),
        deleteRow: vi.fn((row) => {
          if (row >= 2 && row <= mockRows.length + 1) {
            mockRows.splice(row - 2, 1);
          }
        })
      };

      mockDB = {
        getSheetByName: vi.fn((name) => {
          if (name === 'Document_Register') return mockSheet;
          if (name === 'Monthly_Close') return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['closeId', 'periodKey', 'status'],
                ['CLS-202607', '2026-07', 'Closed']
              ]
            })
          };
          return null;
        })
      };

      global.getDB = vi.fn(() => mockDB);
    });

    it('getDocuments retrieves registered documents and filters by month/year', () => {
      const res = getDocuments({ financeYear: 2026, financeMonth: 8 });
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
      expect(res.documents[0].documentId).toBe('DOC-202608-100001');
      expect(res.documents[0].documentType).toBe('Receipt');
      expect(res.documents[0].status).toBe('Linked');

      const emptyRes = getDocuments({ financeYear: 2026, financeMonth: 9 });
      expect(emptyRes.count).toBe(0);
    });

    it('getDocuments handles native Date objects from Sheet cell values and serializes to JSON safely', () => {
      // Simulate raw sheet row containing native Date objects (as returned by Sheets API getValues)
      mockRows.push([
        'DOC-202609-889024',
        'Receipt',
        'Test5',
        '2026-09-03_Receipt_Test5_5flijs.png',
        '2026-09-03_Receipt_Test5_5flijs.png',
        'image/png',
        1024,
        '1pi-NVWmtiXXsgLS2M-CSnLu89gZ9rmSK',
        'https://drive.google.com/file/d/1pi-NVWmtiXXsgLS2M-CSnLu89gZ9rmSK/view',
        '1cvMzltTRt-vGaKRxkTeRcdt5pyR3Tj-j',
        new Date('2026-09-03T00:00:00.000Z'),
        2026,
        9,
        'NONE',
        '',
        '',
        '',
        '',
        '',
        'Manual Upload',
        'hash_test5_png',
        'Unlinked',
        false,
        '',
        new Date('2026-09-03T20:00:00.000Z'),
        'gilbert.baidya@gmail.com',
        '',
        'Test 5 image upload',
        'gilbert.baidya@gmail.com',
        new Date('2026-09-03T20:00:00.000Z'),
        new Date('2026-09-03T20:00:00.000Z')
      ]);

      const res = getDocuments({ financeYear: 2026, financeMonth: 9 });
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);

      const doc = res.documents[0];
      expect(doc.documentId).toBe('DOC-202609-889024');
      expect(doc.title).toBe('Test5');
      expect(doc.driveFileId).toBe('1pi-NVWmtiXXsgLS2M-CSnLu89gZ9rmSK');
      expect(doc.documentDate).toBe('2026-09-03');
      expect(typeof doc.uploadedAt).toBe('string');
      expect(doc.uploadedAt).toContain('2026-09-03');

      // Verify JSON serialization safety
      expect(() => JSON.stringify(res)).not.toThrow();
      const jsonStr = JSON.stringify(res);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.documents[0].documentId).toBe('DOC-202609-889024');
      expect(parsed.documents[0].folder).toBeUndefined();
    });

    it('uploadDocument appends new document metadata and returns documentId for open month', () => {
      const res = uploadDocument({
        documentType: 'Invoice',
        title: 'Sound System Upgrade',
        documentDate: '2026-09-02',
        originalFileName: 'sound_invoice.pdf',
        mimeType: 'application/pdf',
        fileSize: 204800,
        contentHash: 'hash_new_sound_invoice_456',
        notes: 'Main sanctuary audio'
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.documentId).toMatch(/^DOC-202609-/);
      expect(res.status).toBe('Unlinked');
      expect(res.isPostCloseAddition).toBe(false);
      expect(mockSheet.appendRow).toHaveBeenCalled();
    });

    it('uploadDocument automatically links related reimbursement or transaction ID and sets status Linked', () => {
      const res = uploadDocument({
        documentType: 'Reimbursement Evidence',
        title: 'Pastor Fellowship Coffee Receipt',
        documentDate: '2026-09-02',
        originalFileName: 'coffee_receipt.pdf',
        mimeType: 'application/pdf',
        fileSize: 10240,
        contentHash: 'hash_coffee_receipt_789',
        relatedEntityType: 'REIMBURSEMENT',
        relatedReimbursementId: 'RMB-202609-001'
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.status).toBe('Linked');
      expect(mockSheet.appendRow).toHaveBeenCalledWith(
        expect.arrayContaining(['REIMBURSEMENT', 'RMB-202609-001', 'Linked'])
      );

      // Verify JSON serialization safety
      expect(() => JSON.stringify(res)).not.toThrow();
      const jsonStr = JSON.stringify(res);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.folder).toBeUndefined();
      expect(parsed.success).toBe(true);
    });

    it('Transaction-linked upload with a valid relatedTransactionId sets status Linked and stores canonical fields', () => {
      const res = uploadDocument({
        documentType: 'Receipt',
        title: 'Home Depot Paint Supplies Receipt',
        documentDate: '2026-09-03',
        originalFileName: 'paint_receipt.png',
        mimeType: 'image/png',
        fileSize: 15420,
        contentHash: 'hash_paint_receipt_101',
        relatedEntityType: 'TRANSACTION',
        relatedTransactionId: 'TXN-202609-015'
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.status).toBe('Linked');
      expect(mockSheet.appendRow).toHaveBeenCalledWith(
        expect.arrayContaining(['TRANSACTION', 'TXN-202609-015', 'TXN-202609-015', 'Linked'])
      );
    });

    it('rejects uploadDocument when relatedEntityType is TRANSACTION but relatedTransactionId is blank', () => {
      mockSheet.appendRow.mockClear();

      expect(() => {
        uploadDocument({
          documentType: 'Receipt',
          title: 'Orphaned Transaction Receipt',
          documentDate: '2026-09-03',
          relatedEntityType: 'TRANSACTION',
          relatedTransactionId: ''
        }, 'admin@gracepraise.church');
      }).toThrow(/Related transaction ID is required when relatedEntityType is TRANSACTION/);

      expect(mockSheet.appendRow).not.toHaveBeenCalled();
    });

    it('allows standalone Document Center upload with relatedEntityType NONE as Unlinked', () => {
      const res = uploadDocument({
        documentType: 'Invoice',
        title: 'General Office Supplies Invoice',
        documentDate: '2026-09-03',
        relatedEntityType: 'NONE'
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.status).toBe('Unlinked');
      expect(mockSheet.appendRow).toHaveBeenCalledWith(
        expect.arrayContaining(['NONE', '', '', 'Unlinked'])
      );
    });

    it('uploadDocument detects duplicate content hash and returns duplicate warning without writing', () => {
      const dupRes = uploadDocument({
        documentType: 'Receipt',
        title: 'Duplicate Receipt Upload Attempt',
        documentDate: '2026-08-15',
        contentHash: 'hash_august_receipt_123'
      }, 'editor@gracepraise.church');

      expect(dupRes.success).toBe(true);
      expect(dupRes.duplicateDetected).toBe(true);
      expect(dupRes.duplicateDocumentId).toBe('DOC-202608-100001');
      expect(mockSheet.appendRow).not.toHaveBeenCalled();
    });

    it('blocks uploadDocument into closed accounting period if postCloseReason is missing', () => {
      expect(() => {
        uploadDocument({
          documentType: 'Receipt',
          title: 'Late July Receipt',
          documentDate: '2026-07-20'
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-07 is CLOSED\. Adding post-close supporting evidence requires an authorized documented reason/);
      expect(mockSheet.appendRow).not.toHaveBeenCalled();
    });

    it('allows traceable post-close evidence upload into closed period when postCloseReason is provided', () => {
      const postCloseRes = uploadDocument({
        documentType: 'Receipt',
        title: 'Late July Hardware Store Receipt',
        documentDate: '2026-07-20',
        postCloseReason: 'Received late receipt from volunteer for closed July audit file reconciliation',
        originalFileName: 'hardware_receipt.pdf',
        fileSize: 51200
      }, 'editor@gracepraise.church');

      expect(postCloseRes.success).toBe(true);
      expect(postCloseRes.isPostCloseAddition).toBe(true);
      expect(postCloseRes.postCloseReason).toBe('Received late receipt from volunteer for closed July audit file reconciliation');
      expect(postCloseRes.status).toBe('Needs Review');
      expect(mockSheet.appendRow).toHaveBeenCalled();
    });

    it('linkDocumentToEntity updates existing document row with entity reference and status Linked', () => {
      const res = linkDocumentToEntity({
        documentId: 'DOC-202608-100001',
        relatedEntityType: 'REIMBURSEMENT',
        relatedReimbursementId: 'RMB-202608-001'
      }, 'editor@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.status).toBe('Linked');
      expect(mockSheet.getRange).toHaveBeenCalled();
    });

    it('updateDocumentStatus updates status and notes', () => {
      const res = updateDocumentStatus({
        documentId: 'DOC-202608-100001',
        status: 'Needs Review',
        notes: 'Missing itemized line breakdown'
      }, 'editor@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.status).toBe('Needs Review');
    });
  });
});
