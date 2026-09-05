import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  SCHEMA_DEFINITIONS,
  getConfig,
  assertSandboxSheet,
  PRODUCTION_SPREADSHEET_ID
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
  deleteDocument,
  checkDocumentDuplicate,
  findDocumentMatches,
  getSmartUploadOptions
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

      const mockTxnHeaders = [
        'transactionId', 'transactionDate', 'transactionType', 'direction',
        'accountingImpact', 'amount', 'payeeOrPayer', 'description',
        'category', 'fundId', 'capitalProjectId', 'paymentMethod',
        'checkNumber', 'personalPurchase', 'claimantName', 'reconciliationStatus',
        'receiptStatus', 'receiptId', 'notes', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'
      ];
      const mockTxnRows = [
        [
          'TXN-202609-001', '2026-09-02', 'Expense', 'EXPENSE',
          'OPERATIONAL', 125.50, 'Home Depot', 'Lumber for repair',
          'Facility Maintenance', 'General', 'PRJ-SANCTUARY', 'Debit Card',
          '', false, '', 'Pending', 'Unattached', '', '', 'admin@gracepraise.church', '2026-09-02T10:00:00.000Z', '', ''
        ],
        [
          'TXN-202609-002', '2026-09-03', 'Expense', 'EXPENSE',
          'OPERATIONAL', 45.00, 'Office Depot', 'Paper & printer ink',
          'Office Supplies', 'General', '', 'Credit Card',
          '', true, 'Jane Doe', 'Pending', 'Unattached', '', '', 'admin@gracepraise.church', '2026-09-03T11:00:00.000Z', '', ''
        ],
        [
          'TXN-202609-003', '2026-09-01', 'Offering', 'INCOME',
          'TITHE_OFFERING', 500.00, 'Sunday Tithes', 'Sunday General Offering',
          'General Tithes', 'General', '', 'Direct Deposit',
          '', false, '', 'Pending', 'Unattached', '', '', 'admin@gracepraise.church', '2026-09-01T10:00:00.000Z', '', ''
        ]
      ];
      const mockTxnSheet = {
        getLastRow: () => mockTxnRows.length + 1,
        getDataRange: () => ({
          getValues: () => [mockTxnHeaders, ...mockTxnRows.map(r => [...r])]
        })
      };

      const mockRmbHeaders = [
        'reimbursementId', 'reimbursementDate', 'claimantName', 'claimantEmail',
        'totalPurchaseAmount', 'totalReimbursedAmount', 'totalPersonallyAbsorbed',
        'remainingReimbursable', 'status', 'paymentMethod', 'checkNumber',
        'notes', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'
      ];
      const mockRmbRows = [
        [
          'RMB-202609-001', '2026-09-04', 'Pastor John', 'pastor@gracepraise.church',
          89.95, 0, 0,
          89.95, 'Submitted', 'Check', '',
          'Fellowship supplies', 'admin@gracepraise.church', '2026-09-04T12:00:00.000Z', '', ''
        ]
      ];
      const mockRmbSheet = {
        getLastRow: () => mockRmbRows.length + 1,
        getDataRange: () => ({
          getValues: () => [mockRmbHeaders, ...mockRmbRows.map(r => [...r])]
        })
      };

      mockDB = {
        getSheetByName: vi.fn((name) => {
          if (name === 'Document_Register') return mockSheet;
          if (name === 'Transactions') return mockTxnSheet;
          if (name === 'Reimbursements') return mockRmbSheet;
          if (name === 'Monthly_Close') return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['closeId', 'periodKey', 'status'],
                ['CLS-202607', '2026-07', 'Closed']
              ]
            })
          };
          if (name === 'Capital_Projects') return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['projectId', 'projectName', 'status'],
                ['PRJ-SANCTUARY', 'Sanctuary Renovation', 'Active']
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

    describe('Smart Upload: checkDocumentDuplicate', () => {
      it('detects duplicate by exact content hash match', () => {
        const dupRes = checkDocumentDuplicate({
          contentHash: 'hash_august_receipt_123'
        });
        expect(dupRes.success).toBe(true);
        expect(dupRes.isDuplicate).toBe(true);
        expect(dupRes.duplicateDocumentId).toBe('DOC-202608-100001');
        expect(dupRes.reason).toContain('Exact content hash match');
      });

      it('detects duplicate by originalFileName and fileSize match', () => {
        const dupRes = checkDocumentDuplicate({
          filename: 'office_supplies.pdf',
          fileSize: 102400
        });
        expect(dupRes.success).toBe(true);
        expect(dupRes.isDuplicate).toBe(true);
        expect(dupRes.duplicateDocumentId).toBe('DOC-202608-100001');
        expect(dupRes.reason).toContain('Matching filename');
        expect(dupRes.reason).toContain('and file size');
      });

      it('detects duplicate by documentDate and amount in metadata', () => {
        // Add a document with embedded amount metadata to mockRows
        mockRows.push([
          'DOC-202609-100002',
          'Receipt',
          'Sanctuary Repair Materials',
          'sanctuary_repair.pdf',
          '2026-09-02_Receipt_Sanctuary_Repair.pdf',
          'application/pdf',
          204800,
          'DRV-FILE-002',
          'https://drive.google.com/file/d/DRV-FILE-002/view',
          'mock-folder-2026-9-receipts',
          '2026-09-02',
          2026,
          9,
          'TRANSACTION',
          'TXN-202609-001',
          'TXN-202609-001',
          '',
          'PRJ-SANCTUARY',
          '',
          'Smart Upload',
          'hash_sanctuary_repair_456',
          'Linked',
          false,
          '',
          '',
          '',
          '',
          'Lumber [GPBC_SMART_UPLOAD_META:{"amount":125.5,"vendor":"Home Depot"}]',
          'editor@gracepraise.church',
          '2026-09-02T14:00:00.000Z',
          '2026-09-02T14:00:00.000Z'
        ]);

        const dupRes = checkDocumentDuplicate({
          documentDate: '2026-09-02',
          amount: 125.5
        });
        expect(dupRes.success).toBe(true);
        expect(dupRes.isDuplicate).toBe(true);
        expect(dupRes.duplicateDocumentId).toBe('DOC-202609-100002');
        expect(dupRes.reason).toContain('Matching date');
      });

      it('returns isDuplicate: false when document is unique', () => {
        const dupRes = checkDocumentDuplicate({
          contentHash: 'hash_completely_unique_9999',
          filename: 'unique_invoice.pdf',
          fileSize: 99999,
          documentDate: '2026-09-05',
          amount: 543.21
        });
        expect(dupRes.success).toBe(true);
        expect(dupRes.isDuplicate).toBe(false);
        expect(dupRes.duplicateDocumentId).toBeUndefined();
      });
    });

    describe('Smart Upload: findDocumentMatches', () => {
      it('finds strong match for transaction when amount, date, vendor and capital project align', () => {
        const matchRes = findDocumentMatches({
          amount: 125.50,
          documentDate: '2026-09-02',
          vendor: 'Home Depot',
          capitalProjectId: 'PRJ-SANCTUARY',
          documentType: 'Receipt'
        });

        expect(matchRes.success).toBe(true);
        expect(matchRes.count).toBeGreaterThanOrEqual(1);
        const topMatch = matchRes.matches[0];
        expect(topMatch.candidate.entityId).toBe('TXN-202609-001');
        expect(topMatch.candidate.entityType).toBe('TRANSACTION');
        expect(topMatch.score).toBeGreaterThanOrEqual(75);
        expect(topMatch.confidenceLabel).toBe('Strong Match');
        expect(topMatch.reasons).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Exact amount match: $125.50'),
            expect.stringContaining('Exact date match (2026-09-02)'),
            expect.stringContaining('Exact vendor match: "Home Depot"'),
            expect.stringContaining('Capital Project match (PRJ-SANCTUARY)')
          ])
        );
      });

      it('finds match for reimbursement when obligation amount and claimant name align', () => {
        const matchRes = findDocumentMatches({
          amount: 89.95,
          documentDate: '2026-09-04',
          vendor: 'Pastor John',
          documentType: 'Reimbursement Proof'
        });

        expect(matchRes.success).toBe(true);
        expect(matchRes.count).toBeGreaterThanOrEqual(1);
        const rmbMatch = matchRes.matches.find(m => m.candidate.entityType === 'REIMBURSEMENT');
        expect(rmbMatch).toBeDefined();
        expect(rmbMatch.candidate.entityId).toBe('RMB-202609-001');
        expect(rmbMatch.score).toBeGreaterThanOrEqual(75);
        expect(rmbMatch.confidenceLabel).toBe('Strong Match');
        expect(rmbMatch.reasons).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Exact reimbursement obligation match: $89.95'),
            expect.stringContaining('Exact date match (2026-09-04)')
          ])
        );
      });

      it('returns empty matches when query has no matching candidates', () => {
        const matchRes = findDocumentMatches({
          amount: 99999.00,
          documentDate: '2025-01-01',
          vendor: 'Nonexistent Vendor LLC'
        });

        expect(matchRes.success).toBe(true);
        expect(matchRes.count).toBe(0);
        expect(matchRes.matches).toEqual([]);
      });

      it('sorts candidates in descending score order', () => {
        const matchRes = findDocumentMatches({
          amount: 125.50,
          documentDate: '2026-09-02'
        });

        expect(matchRes.success).toBe(true);
        if (matchRes.matches.length > 1) {
          for (let i = 0; i < matchRes.matches.length - 1; i++) {
            expect(matchRes.matches[i].score).toBeGreaterThanOrEqual(matchRes.matches[i + 1].score);
          }
        }
      });
    });

    describe('Smart Upload: getSmartUploadOptions & Multi-Link Integrity', () => {
      it('getSmartUploadOptions returns closedPeriods and active capitalProjects', () => {
        const res = getSmartUploadOptions({});
        expect(res.success).toBe(true);
        expect(res.closedPeriods).toEqual(['2026-07']);
        expect(res.capitalProjects).toHaveLength(1);
        expect(res.capitalProjects[0].projectId).toBe('PRJ-SANCTUARY');
        expect(res.capitalProjects[0].projectName).toBe('Sanctuary Renovation');
        expect(res.documentTypes).toHaveLength(DOCUMENT_TYPES.length);
      });

      it('multi-link preservation: linkDocumentToEntity updates specific column without overwriting other entity links', () => {
        // mockRows[0] (DOC-202608-100001) starts with relatedTransactionId: 'TXN-2026-08-01'
        expect(mockRows[0][15]).toBe('TXN-2026-08-01'); // Col 16: relatedTransactionId
        expect(mockRows[0][16]).toBe(''); // Col 17: relatedReimbursementId
        expect(mockRows[0][17]).toBe(''); // Col 18: relatedCapitalProjectId

        // Link Reimbursement
        const rmbRes = linkDocumentToEntity({
          documentId: 'DOC-202608-100001',
          relatedEntityType: 'REIMBURSEMENT',
          relatedReimbursementId: 'RMB-202608-001'
        }, 'editor@gracepraise.church');

        expect(rmbRes.success).toBe(true);
        // relatedReimbursementId updated
        expect(mockRows[0][16]).toBe('RMB-202608-001');
        // relatedTransactionId strictly preserved
        expect(mockRows[0][15]).toBe('TXN-2026-08-01');

        // Link Capital Project
        const capRes = linkDocumentToEntity({
          documentId: 'DOC-202608-100001',
          relatedEntityType: 'CAPITAL_PROJECT',
          relatedCapitalProjectId: 'PRJ-SANCTUARY'
        }, 'editor@gracepraise.church');

        expect(capRes.success).toBe(true);
        // relatedCapitalProjectId updated
        expect(mockRows[0][17]).toBe('PRJ-SANCTUARY');
        // previous transaction AND reimbursement links still intact
        expect(mockRows[0][15]).toBe('TXN-2026-08-01');
        expect(mockRows[0][16]).toBe('RMB-202608-001');
      });

      it('backend closed-period protection: independently rejects closed period upload without relying on client-sent closedPeriods', () => {
        // Client sends NO closedPeriods list, only document payload with closed-period date
        expect(() => {
          uploadDocument({
            documentType: 'Receipt',
            title: 'Unauthorized Closed Month Upload',
            documentDate: '2026-07-25',
            // postCloseReason is intentionally omitted
          }, 'editor@gracepraise.church');
        }).toThrow(/Period 2026-07 is CLOSED\. Adding post-close supporting evidence requires an authorized documented reason/);
      });
    });

    describe('Smart Upload: File Validation Hardening, Backend Duplicate Override & Document-Type Compatibility', () => {
      it('rejects forbidden file extensions, MIME mismatches, and files exceeding 4MB', () => {
        // Forbidden executable
        expect(() => {
          uploadDocument({
            documentType: 'Receipt',
            title: 'Infected Executable',
            originalFileName: 'malware.exe',
            documentDate: '2026-09-02'
          }, 'editor@gracepraise.church');
        }).toThrow(/Forbidden file type: \.exe/);

        // Forbidden script
        expect(() => {
          uploadDocument({
            documentType: 'Invoice',
            title: 'Malicious Script',
            originalFileName: 'attack.js',
            documentDate: '2026-09-02'
          }, 'editor@gracepraise.church');
        }).toThrow(/Forbidden file type: \.js/);

        // MIME-extension mismatch: .pdf with application/x-msdownload
        expect(() => {
          uploadDocument({
            documentType: 'Receipt',
            title: 'Spoofed PDF',
            originalFileName: 'receipt.pdf',
            mimeType: 'application/x-msdownload',
            documentDate: '2026-09-02'
          }, 'editor@gracepraise.church');
        }).toThrow(/Unsupported MIME type|Mismatched file extension/i);

        // MIME-extension mismatch: .jpg with application/pdf
        expect(() => {
          uploadDocument({
            documentType: 'Receipt',
            title: 'Spoofed Image',
            originalFileName: 'photo.jpg',
            mimeType: 'application/pdf',
            documentDate: '2026-09-02'
          }, 'editor@gracepraise.church');
        }).toThrow(/Mismatched file extension and MIME type/);

        // File exceeding 4MB limit
        expect(() => {
          uploadDocument({
            documentType: 'Invoice',
            title: 'Oversized Invoice',
            originalFileName: 'huge.pdf',
            mimeType: 'application/pdf',
            fileSize: 5 * 1024 * 1024,
            documentDate: '2026-09-02'
          }, 'editor@gracepraise.church');
        }).toThrow(/File exceeds maximum allowed size of 4MB for reliable cloud transport/);
      });

      it('enforces backend duplicate override safety: rejects without override flag, succeeds and audits with allowDuplicateUpload', () => {
        // Duplicate hash match with mockRows[0] (hash_august_receipt_123)
        const blockedDup = uploadDocument({
          documentType: 'Receipt',
          title: 'Duplicate Attempt',
          contentHash: 'hash_august_receipt_123',
          documentDate: '2026-09-02',
          allowDuplicateUpload: false
        }, 'editor@gracepraise.church');

        expect(blockedDup.success).toBe(true);
        expect(blockedDup.duplicateDetected).toBe(true);
        expect(blockedDup.duplicateDocumentId).toBe('DOC-202608-100001');

        // Intentional duplicate upload with explicit allowDuplicateUpload: true
        const allowedDup = uploadDocument({
          documentType: 'Receipt',
          title: 'Approved Duplicate Receipt',
          contentHash: 'hash_august_receipt_123',
          documentDate: '2026-09-02',
          allowDuplicateUpload: true,
          notes: 'Legitimate re-scan of multi-page receipt'
        }, 'editor@gracepraise.church');

        expect(allowedDup.success).toBe(true);
        expect(allowedDup.duplicateDetected).toBeUndefined();
        expect(mockSheet.appendRow).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining('[OVERRIDE_DUPLICATE: Approved intentional duplicate of DOC-202608-100001] Legitimate re-scan of multi-page receipt')
          ])
        );
      });

      it('validates WEBP magic byte signature (RIFF....WEBP) and rejects spoofed files', () => {
        global.Utilities = {
          base64Decode: vi.fn((str) => {
            if (str === 'invalid_webp_b64') {
              return [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B];
            }
            if (str === 'valid_webp_b64') {
              // RIFF (0x52, 0x49, 0x46, 0x46) + 4 size bytes + WEBP (0x57, 0x45, 0x42, 0x50)
              return [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38];
            }
            return [];
          }),
          newBlob: vi.fn((bytes, mime, name) => ({
            setName: vi.fn(),
            getBytes: () => bytes,
            getContentType: () => mime,
            getName: () => name
          }))
        };

        const createMockFolder = (name = 'folder', id = 'mock-folder-id') => {
          const self = {
            getName: () => name,
            getId: () => id,
            getUrl: () => 'https://drive.google.com/drive/folders/' + id,
            getFoldersByName: vi.fn(() => ({
              hasNext: () => true,
              next: () => self
            })),
            createFolder: vi.fn(() => self),
            createFile: vi.fn(() => ({
              getId: () => 'mock-webp-file-id',
              getUrl: () => 'https://drive.google.com/file/d/mock-webp-file-id/view',
              setName: vi.fn(),
              setDescription: vi.fn()
            }))
          };
          return self;
        };

        const mockFolder = createMockFolder('Receipts');

        global.DriveApp = {
          getFolderById: vi.fn(() => mockFolder),
          getRootFolder: vi.fn(() => mockFolder)
        };

        // 1. Rejects spoofed WEBP file with invalid magic header
        expect(() => {
          uploadDocument({
            documentType: 'Receipt',
            title: 'Spoofed WebP',
            originalFileName: 'receipt.webp',
            mimeType: 'image/webp',
            documentDate: '2026-09-02',
            fileBase64: 'invalid_webp_b64'
          }, 'editor@gracepraise.church');
        }).toThrow(/File signature verification failed: Invalid WEBP magic header \(expected RIFF\.\.\.\.WEBP\)/);

        // 2. Accepts genuine WEBP with valid RIFF....WEBP signature
        const validUpload = uploadDocument({
          documentType: 'Receipt',
          title: 'Genuine WebP',
          originalFileName: 'receipt.webp',
          mimeType: 'image/webp',
          documentDate: '2026-09-02',
          fileBase64: 'valid_webp_b64'
        }, 'editor@gracepraise.church');

        expect(validUpload.success).toBe(true);
        expect(validUpload.driveFileId).toBe('mock-webp-file-id');
      });

      it('authoritative backend matcher enforces document-type compatibility across financial directions', () => {
        // 1. Offering / Income Evidence matches income transactions only
        const incomeMatch = findDocumentMatches({
          documentType: 'Offering / Income Evidence',
          amount: 500.00,
          documentDate: '2026-09-01',
          vendor: 'Sunday Tithes'
        });
        expect(incomeMatch.success).toBe(true);
        expect(incomeMatch.matches.length).toBe(1);
        expect(incomeMatch.matches[0].candidate.entityId).toBe('TXN-202609-003');

        // Offering / Income Evidence NEVER matches expense transactions (TXN-202609-001 or TXN-202609-002)
        const offeringVsExpense = findDocumentMatches({
          documentType: 'Offering / Income Evidence',
          amount: 125.50,
          documentDate: '2026-09-02',
          vendor: 'Home Depot'
        });
        expect(offeringVsExpense.matches.some(m => m.candidate.entityId === 'TXN-202609-001')).toBe(false);
        expect(offeringVsExpense.matches.some(m => m.candidate.entityId === 'TXN-202609-002')).toBe(false);

        // 2. Receipt / Purchase evidence matches expense transactions only (never donation income)
        const receiptVsIncome = findDocumentMatches({
          documentType: 'Receipt',
          amount: 500.00,
          documentDate: '2026-09-01',
          vendor: 'Sunday Tithes'
        });
        expect(receiptVsIncome.matches.some(m => m.candidate.entityId === 'TXN-202609-003')).toBe(false);

        // 3. Bank Statement returns zero matches in Phase 1
        const bankStmtMatch = findDocumentMatches({
          documentType: 'Bank Statement',
          amount: 125.50,
          documentDate: '2026-09-02'
        });
        expect(bankStmtMatch.success).toBe(true);
        expect(bankStmtMatch.count).toBe(0);
        expect(bankStmtMatch.matches).toHaveLength(0);

        // 4. Refund / Credit evidence does not suggest donation income
        const refundVsIncome = findDocumentMatches({
          documentType: 'Refund / Credit',
          amount: 500.00,
          documentDate: '2026-09-01'
        });
        expect(refundVsIncome.matches.some(m => m.candidate.entityId === 'TXN-202609-003')).toBe(false);
      });

      it('safely handles legacy documents with missing or malformed metadata without breaking getDocuments', () => {
        // Append a row matching the 31-column schema with malformed metadata in notes (col index 27)
        mockRows.push([
          'DOC-202608-100003',
          'Receipt',
          'Legacy Receipt',
          'doc.pdf',
          '2026-08-20_Receipt_Legacy_Receipt_def456.pdf',
          'application/pdf',
          1024,
          'drive1',
          'url1',
          'folder1',
          '2026-08-20',
          2026,
          8,
          'NONE',
          '',
          '',
          '',
          '',
          '',
          'System',
          'hashLegacy',
          'Unlinked',
          false,
          '',
          '',
          '',
          '',
          '[GPBC_SMART_UPLOAD_META:MALFORMED_JSON_STRING!!] Legacy user note',
          'editor@gracepraise.church',
          '2026-08-20T12:00:00Z',
          '2026-08-20T12:00:00Z'
        ]);

        const res = getDocuments({ financeYear: 2026, financeMonth: 8 });
        expect(res.success).toBe(true);
        expect(res.documents.length).toBeGreaterThanOrEqual(1);
        const malformedDoc = res.documents.find(d => d.documentId === 'DOC-202608-100003');
        expect(malformedDoc).toBeDefined();
        expect(malformedDoc.notes).toContain('Legacy user note');
      });
    });

    describe('Smart Upload: Fail-Closed Production Write Safety', () => {
      it('fails closed when production writes are disarmed (GPBC_PRODUCTION_WRITES_ENABLED=false)', () => {
        global.PropertiesService = {
          getScriptProperties: () => ({
            getProperty: (key) => {
              if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
              if (key === 'GPBC_ENVIRONMENT') return 'production';
              if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
              return null;
            }
          })
        };

        expect(() => {
          assertSandboxSheet('uploadDocument');
        }).toThrow(/FAIL-CLOSED SAFETY GUARD: Production writes are DISARMED/);

        expect(() => {
          assertSandboxSheet('linkDocumentToEntity');
        }).toThrow(/FAIL-CLOSED SAFETY GUARD: Production writes are DISARMED/);
      });
    });
  });
});
