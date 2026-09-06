import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  SCHEMA_DEFINITIONS,
  getConfig,
  assertSandboxSheet,
  PRODUCTION_SPREADSHEET_ID,
  SANDBOX_SPREADSHEET_ID
} = require('../Config.gs');

const {
  uploadDocument,
  checkDocumentDuplicate
} = require('../Documents.gs');

const {
  stageBankStatementLines,
  getStagedStatementLines,
  saveStagedStatementLines,
  processStatementImport,
  matchReconciliationLine
} = require('../Audit.gs');

const {
  authorizeAction,
  validateGoogleIdentity,
  getApprovedUser
} = require('../Auth.gs');

function createMockSandboxDb() {
  const tables = {
    Reconciliation_Staging: [
      [...SCHEMA_DEFINITIONS.Reconciliation_Staging]
    ],
    Document_Register: [
      [...SCHEMA_DEFINITIONS.Document_Register]
    ],
    Transactions: [
      [...SCHEMA_DEFINITIONS.Transactions]
    ],
    Monthly_Close: [
      [...SCHEMA_DEFINITIONS.Monthly_Close],
      // Closed September 2026 record
      ['MC-2026-09', 2026, 9, '2026-09-01', '2026-09-30', 'CLOSED', '2026-10-01T00:00:00Z', 'pastor.gilbert@gracepraise.church', 100, 50, 50, 'Monthly close report approved', 'CLOSE_REP_001', 'FOLDER_001', 0, '', '', '', '', '', '']
    ],
    Monthly_Close_History: [
      [...SCHEMA_DEFINITIONS.Monthly_Close_History]
    ]
  };

  function makeSheet(name) {
    if (!tables[name]) {
      tables[name] = [SCHEMA_DEFINITIONS[name] ? [...SCHEMA_DEFINITIONS[name]] : ['id']];
    }
    const rows = tables[name];

    return {
      getName: () => name,
      getLastRow: () => rows.length,
      getLastColumn: () => (rows[0] ? rows[0].length : 0),
      appendRow: (row) => {
        rows.push([...row]);
      },
      getDataRange: () => ({
        getValues: () => rows.map(r => [...r])
      }),
      getRange: (r, c, numR = 1, numC = 1) => ({
        getValues: () => {
          const res = [];
          for (let i = 0; i < numR; i++) {
            const rowIdx = r - 1 + i;
            const row = rows[rowIdx] || [];
            const slice = [];
            for (let j = 0; j < numC; j++) {
              const colIdx = c - 1 + j;
              slice.push(row[colIdx]);
            }
            res.push(slice);
          }
          return res;
        },
        setValue: (val) => {
          if (!rows[r - 1]) rows[r - 1] = [];
          rows[r - 1][c - 1] = val;
          return { setFontWeight: () => ({ setBackground: () => {} }) };
        },
        setFontWeight: () => ({ setBackground: () => {} }),
        setBackground: () => {}
      })
    };
  }

  return {
    getId: () => SANDBOX_SPREADSHEET_ID,
    getName: () => 'GPBC_Finance_Master_SANDBOX',
    getSheetByName: (name) => makeSheet(name),
    insertSheet: (name) => makeSheet(name),
    _tables: tables
  };
}

describe('Zero-Input Statement Import — Sandbox Persistence & Accounting Safety Suite', () => {
  let mockDb;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockDb = createMockSandboxDb();

    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          if (key === 'GPBC_SHEET_ID') return SANDBOX_SPREADSHEET_ID;
          if (key === 'GPBC_DRIVE_ROOT_FOLDER_ID') return '1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx';
          if (key === 'GOOGLE_CLIENT_ID') return '931926759869-h7i13i0l7e1kl60lofslvtrn3s1lquad.apps.googleusercontent.com';
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
          if (key === 'GPBC_APPROVED_USERS') return JSON.stringify([
            { email: 'gilbert.baidya@gmail.com', role: 'Primary Admin', name: 'Pastor Gilbert' }
          ]);
          return null;
        }
      })
    };

    global.SpreadsheetApp = {
      openById: (id) => {
        if (id === PRODUCTION_SPREADSHEET_ID) {
          throw new Error('FAIL-CLOSED: Attempted to open production spreadsheet in sandbox test');
        }
        return mockDb;
      }
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
          getId: () => 'DRIVE_FILE_SANDBOX_STMT_001',
          getUrl: () => 'https://drive.google.com/file/d/DRIVE_FILE_SANDBOX_STMT_001/view',
          setName: vi.fn(),
          setDescription: vi.fn()
        }))
      };
      return self;
    };

    const mockFolder = createMockFolder('Bank Statements');
    global.DriveApp = {
      getFolderById: vi.fn(() => mockFolder),
      getRootFolder: vi.fn(() => mockFolder)
    };

    const crypto = require('crypto');
    global.Utilities = {
      base64Decode: vi.fn((b64) => {
        const buf = Buffer.from(b64, 'base64');
        return Array.from(buf);
      }),
      base64Encode: (bytes) => Buffer.from(bytes).toString('base64'),
      base64EncodeWebSafe: (bytes) => Buffer.from(bytes).toString('base64url'),
      computeDigest: (alg, bytes) => {
        const hash = crypto.createHash('sha256').update(Buffer.from(bytes)).digest();
        return Array.from(hash);
      },
      newBlob: vi.fn((bytes, mime, name) => ({
        setName: vi.fn(),
        getBytes: () => bytes,
        getContentType: () => mime,
        getName: () => name
      })),
      DigestAlgorithm: { SHA_256: 'SHA_256' }
    };
  });

  describe('1. Schema Integrity & Registration', () => {
    it('Reconciliation_Staging contains canonical columns and extended metadata fields', () => {
      const headers = SCHEMA_DEFINITIONS['Reconciliation_Staging'];
      expect(headers).toContain('statementLineId');
      expect(headers).toContain('statementDate');
      expect(headers).toContain('description');
      expect(headers).toContain('amount');
      expect(headers).toContain('direction');
      expect(headers).toContain('postingStatus');
      expect(headers).toContain('sourceDocumentId');
      expect(headers).toContain('category');
      expect(headers).toContain('businessPurpose');
    });

    it('PERMISSION_MATRIX registers all statement import actions for finance writers/readers', () => {
      const adminRole = 'Primary Admin';
      const editorRole = 'Finance Editor';
      const viewerRole = 'Viewer';

      expect(authorizeAction('stageBankStatementLines', editorRole).authorized).toBe(true);
      expect(authorizeAction('saveStagedStatementLines', editorRole).authorized).toBe(true);
      expect(authorizeAction('processStatementImport', editorRole).authorized).toBe(true);
      expect(authorizeAction('getStagedStatementLines', viewerRole).authorized).toBe(true);
      expect(authorizeAction('stageBankStatementLines', viewerRole).authorized).toBe(false);
    });
  });

  describe('2. Real Document Evidence Upload & Closed Month Safety', () => {
    it('uploads bank statement evidence into Document_Register with postCloseReason', () => {
      const jpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]).toString('base64');
      const uploadPayload = {
        title: 'Chase Bank Statement - Sep 2026',
        documentType: 'BANK_STATEMENT',
        documentDate: '2026-09-03',
        originalFileName: 'IMG_4310.jpg',
        mimeType: 'image/jpeg',
        fileBase64: jpegBytes,
        postCloseReason: 'Automatically imported statement evidence after period close'
      };

      const result = uploadDocument(uploadPayload, 'gilbert.baidya@gmail.com');
      expect(result.success).toBe(true);
      expect(result.documentId).toMatch(/^DOC-\d{6}-[A-Z0-9]+$/);
      expect(result.driveFileId).toBe('DRIVE_FILE_SANDBOX_STMT_001');

      // Verify Document_Register row
      const docRows = mockDb._tables['Document_Register'];
      expect(docRows.length).toBe(2);
      expect(docRows[1][0]).toBe(result.documentId);
      expect(docRows[1][1]).toBe('BANK_STATEMENT');

      // Verify Monthly_Close unchanged
      const closeRows = mockDb._tables['Monthly_Close'];
      expect(closeRows.length).toBe(2);
      expect(closeRows[1][5]).toBe('CLOSED');
      expect(closeRows[1][0]).toBe('MC-2026-09');
    });

    it('detects duplicate screenshot upload and returns existing document reference', () => {
      const jpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0xAA, 0xBB]).toString('base64');
      const payload1 = {
        title: 'Original Statement',
        documentType: 'BANK_STATEMENT',
        documentDate: '2026-09-03',
        originalFileName: 'IMG_4310.jpg',
        mimeType: 'image/jpeg',
        fileBase64: jpegBytes,
        contentHash: 'hash_duplicate_test_123',
        postCloseReason: 'Automatically imported statement evidence after period close'
      };

      const res1 = uploadDocument(payload1, 'gilbert.baidya@gmail.com');
      expect(res1.success).toBe(true);
      expect(res1.duplicateDetected).toBeFalsy();

      // Second identical upload attempt
      const res2 = uploadDocument(payload1, 'gilbert.baidya@gmail.com');
      expect(res2.success).toBe(true);
      expect(res2.duplicateDetected).toBe(true);
      expect(res2.duplicateDocumentId).toBe(res1.documentId);

      // Verify Document_Register does NOT create duplicate row
      const docRows = mockDb._tables['Document_Register'];
      expect(docRows.length).toBe(2); // header + exactly 1 row
    });
  });

  describe('3. Staging Persistence & Expected Three Lines', () => {
    it('persists James Trupest ($80 Zelle, PENDING, date null) without rejection', () => {
      const lines = [{
        statementLineId: 'STMT-TRUPEST-01',
        statementDate: null,
        description: 'Zelle Payment to James Trupest JPM99CVMEAAN',
        amount: -80.00,
        direction: 'EXPENSE',
        statementType: 'Bank Checking',
        referenceNumber: 'JPM99CVMEAAN',
        postingStatus: 'PENDING',
        sourceDocumentId: 'DOC-20260903-STMT01',
        category: 'Needs Classification',
        purpose: 'Zelle Payment to James Trupest'
      }];

      const res = stageBankStatementLines({
        statementLines: lines,
        sourceFileName: 'IMG_4310.jpg',
        sourceDocumentId: 'DOC-20260903-STMT01'
      }, 'gilbert.baidya@gmail.com');

      expect(res.insertedCount).toBe(1);
      expect(res.rejectedCount).toBe(0);

      // Fresh reload read
      const reload = getStagedStatementLines({}, 'gilbert.baidya@gmail.com');
      expect(reload.count).toBe(1);
      const row = reload.lines[0];
      expect(row.postingStatus).toBe('PENDING');
      expect(row.statementDate).toBeNull();
      expect(row.amount).toBe(-80.00);
      expect(row.referenceNumber).toBe('JPM99CVMEAAN');
      expect(row.category).toBe('Needs Classification');
      expect(row.sourceDocumentId).toBe('DOC-20260903-STMT01');
    });

    it('persists all three lines linked to one source document', () => {
      const sourceDocId = 'DOC-20260903-STMT01';
      const threeLines = [
        {
          statementDate: null,
          description: 'Zelle Payment to James Trupest JPM99CVMEAAN',
          amount: -80.00,
          direction: 'EXPENSE',
          referenceNumber: 'JPM99CVMEAAN',
          postingStatus: 'PENDING',
          sourceDocumentId: sourceDocId,
          category: 'Needs Classification',
          purpose: 'Zelle Payment to James Trupest'
        },
        {
          statementDate: '2026-09-03',
          description: 'ACH ORIG CO NAME:Churchwest TRACE#:104000019610307',
          amount: -2567.50,
          direction: 'EXPENSE',
          referenceNumber: '104000019610307',
          postingStatus: 'POSTED',
          sourceDocumentId: sourceDocId,
          category: 'Needs Classification',
          purpose: 'Churchwest ACH Payment'
        },
        {
          statementDate: '2026-09-03',
          description: 'SAN BERNARDINO ALARM 09/02',
          amount: -31.21,
          direction: 'EXPENSE',
          postingStatus: 'POSTED',
          sourceDocumentId: sourceDocId,
          category: 'Facility & Security',
          purpose: 'Security / Alarm Monitoring'
        }
      ];

      const res = stageBankStatementLines({
        statementLines: threeLines,
        sourceFileName: 'IMG_4310.jpg',
        sourceDocumentId: sourceDocId
      }, 'gilbert.baidya@gmail.com');

      expect(res.insertedCount).toBe(3);
      expect(res.rejectedCount).toBe(0);

      // Verify fresh reload returns all 3 lines
      const reload = getStagedStatementLines({}, 'gilbert.baidya@gmail.com');
      expect(reload.count).toBe(3);

      const trupest = reload.lines.find(l => l.referenceNumber === 'JPM99CVMEAAN');
      expect(trupest).toBeDefined();
      expect(trupest.postingStatus).toBe('PENDING');
      expect(trupest.sourceDocumentId).toBe(sourceDocId);

      const churchwest = reload.lines.find(l => l.referenceNumber === '104000019610307');
      expect(churchwest).toBeDefined();
      expect(churchwest.amount).toBe(-2567.50);
      expect(churchwest.sourceDocumentId).toBe(sourceDocId);

      const alarm = reload.lines.find(l => l.amount === -31.21);
      expect(alarm).toBeDefined();
      expect(alarm.category).toBe('Facility & Security');
      expect(alarm.businessPurpose).toBe('Security / Alarm Monitoring');
      expect(alarm.sourceDocumentId).toBe(sourceDocId);
    });
  });

  describe('4. Pending → Posted Promotion & Duplicate Protection', () => {
    it('promotes pending line to posted when future posted version appears without duplicate recognition', () => {
      // Step 1: Stage initial pending line
      const pendingLine = [{
        statementDate: null,
        description: 'Zelle Payment to James Trupest JPM99CVMEAAN',
        amount: -80.00,
        direction: 'EXPENSE',
        referenceNumber: 'JPM99CVMEAAN',
        postingStatus: 'PENDING'
      }];

      const res1 = stageBankStatementLines({
        statementLines: pendingLine,
        sourceFileName: 'IMG_4310.jpg'
      }, 'gilbert.baidya@gmail.com');
      expect(res1.insertedCount).toBe(1);

      // Verify pending exists
      let check = getStagedStatementLines({}, 'gilbert.baidya@gmail.com');
      expect(check.count).toBe(1);
      expect(check.lines[0].postingStatus).toBe('PENDING');

      // Step 2: Later statement imports posted line for the same transaction
      const postedLine = [{
        statementDate: '2026-09-05',
        description: 'Zelle Payment to James Trupest JPM99CVMEAAN',
        amount: -80.00,
        direction: 'EXPENSE',
        referenceNumber: 'JPM99CVMEAAN',
        postingStatus: 'POSTED'
      }];

      const res2 = stageBankStatementLines({
        statementLines: postedLine,
        sourceFileName: 'sep_posted_statement.pdf'
      }, 'gilbert.baidya@gmail.com');

      expect(res2.promotedCount).toBe(1);
      expect(res2.duplicateCount).toBe(0);

      // Verify STILL exactly 1 line exists in staging, now promoted to POSTED
      check = getStagedStatementLines({}, 'gilbert.baidya@gmail.com');
      expect(check.count).toBe(1);
      expect(check.lines[0].postingStatus).toBe('POSTED');
      expect(check.lines[0].statementDate).toBe('2026-09-05');
    });

    it('rejects identical statement line duplicate import', () => {
      const line = [{
        statementDate: '2026-09-03',
        description: 'SAN BERNARDINO ALARM',
        amount: -31.21,
        direction: 'EXPENSE'
      }];

      const res1 = stageBankStatementLines({ statementLines: line, sourceFileName: 'test.csv' }, 'gilbert.baidya@gmail.com');
      expect(res1.insertedCount).toBe(1);

      const res2 = stageBankStatementLines({ statementLines: line, sourceFileName: 'test.csv' }, 'gilbert.baidya@gmail.com');
      expect(res2.insertedCount).toBe(0);
      expect(res2.duplicateCount).toBe(1);
    });
  });

  describe('5. Matching Separated from Auto-Reconciliation', () => {
    it('matching a line sets matchStatus to Matched but does NOT set transaction to Reconciled', () => {
      // Seed a transaction in Transactions tab
      mockDb._tables['Transactions'].push([
        'TXN-TEST-ALARM-01', '2026-09-03', 'EXPENSE', 'EXPENSE', 'DEBIT', 31.21,
        'San Bernardino Alarm', 'Monthly alarm fee', 'Facility & Security', 'GEN', '',
        'Debit Card', '', false, '', 'Pending', 'Verified', '', '', 'admin', '2026-09-03', '', ''
      ]);

      // Stage bank statement line
      stageBankStatementLines({
        statementLines: [{
          statementLineId: 'STMT-ALARM-01',
          statementDate: '2026-09-03',
          description: 'SAN BERNARDINO ALARM',
          amount: -31.21,
          direction: 'EXPENSE'
        }],
        sourceFileName: 'test.csv'
      }, 'gilbert.baidya@gmail.com');

      // Match the line
      const matchRes = matchReconciliationLine({
        statementLineId: 'STMT-ALARM-01',
        transactionId: 'TXN-TEST-ALARM-01'
      }, 'gilbert.baidya@gmail.com');

      expect(matchRes.success).toBe(true);
      expect(matchRes.matchStatus).toBe('Matched');

      // Verify staged line has matchedTransactionId
      const staged = getStagedStatementLines({}, 'gilbert.baidya@gmail.com');
      const matchedLine = staged.lines.find(l => l.statementLineId === 'STMT-ALARM-01');
      expect(matchedLine.matchStatus).toBe('Matched');
      expect(matchedLine.matchedTransactionId).toBe('TXN-TEST-ALARM-01');

      // CRITICAL: Verify transaction reconciliationStatus in Transactions is NOT Auto-Reconciled
      const txRows = mockDb._tables['Transactions'];
      const txRow = txRows.find(r => r[0] === 'TXN-TEST-ALARM-01');
      expect(txRow[15]).toBe('Matched'); // Matched, NOT Reconciled!
      expect(txRow[15]).not.toBe('Reconciled');
    });
  });

  describe('6. Production Write Safety Guard', () => {
    it('assertSandboxSheet permanently blocks writes when target is production spreadsheet and writes are disarmed', () => {
      global.PropertiesService = {
        getScriptProperties: () => ({
          getProperty: (key) => {
            if (key === 'GPBC_ENVIRONMENT') return 'production';
            if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
            if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
            return null;
          }
        })
      };

      expect(() => assertSandboxSheet('uploadDocument')).toThrow('FAIL-CLOSED SAFETY GUARD');
      expect(() => assertSandboxSheet('stageBankStatementLines')).toThrow('FAIL-CLOSED SAFETY GUARD');
    });
  });
});
