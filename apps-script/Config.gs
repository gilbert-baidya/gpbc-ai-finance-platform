/*************************************************
 * GPBC Finance Desk — Config.gs
 * Server-Side Configuration, Schema Definitions, and Fail-Closed Safety
 *************************************************/

const PRODUCTION_SPREADSHEET_ID = "1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s";

const CHURCH_INFO = {
  name: "Grace and Praise Bangladeshi Church",
  ein: "39-4558295",
  address: "1325 Richardson St., San Bernardino, CA 92408",
  email: "info@gracepraise.church",
  website: "www.gracepraise.church",
  phone: "909-763-0454",
  textLine: "+1-888-880-7773",
  pastor: "Rev. Gilbert S. Baidya"
};

/**
 * Phase 2 Schema Tab Header Definitions
 * Canonical Master Schema across ONE workbook
 */
const SCHEMA_DEFINITIONS = {
  "Transactions": [
    "transactionId",
    "transactionDate",
    "transactionType",
    "direction",
    "accountingImpact",
    "amount",
    "payeeOrPayer",
    "description",
    "category",
    "fundId",
    "capitalProjectId",
    "paymentMethod",
    "checkNumber",
    "personalPurchase",
    "claimantName",
    "reconciliationStatus",
    "receiptStatus",
    "receiptId",
    "notes",
    "createdBy",
    "createdAt",
    "updatedBy",
    "updatedAt"
  ],
  "Income Detail": [
    "incomeId",
    "date",
    "memberOrDonorId",
    "donorName",
    "incomeType",
    "serviceType",
    "amount",
    "fundId",
    "capitalProjectId",
    "paymentMethod",
    "checkNumber",
    "envelopeNumber",
    "notes",
    "transactionId",
    "createdBy",
    "createdAt"
  ],
  "Expense Detail": [
    "expenseId",
    "date",
    "payee",
    "amount",
    "category",
    "purpose",
    "paymentMethod",
    "checkNumber",
    "fundId",
    "capitalProjectId",
    "personalCardPurchase",
    "claimantName",
    "receiptId",
    "notes",
    "transactionId",
    "createdBy",
    "createdAt"
  ],
  "Reimbursements": [
    "reimbursementId",
    "reimbursementDate",
    "claimantName",
    "claimantEmail",
    "totalPurchaseAmount",
    "totalReimbursedAmount",
    "totalPersonallyAbsorbed",
    "remainingReimbursable",
    "status",
    "paymentMethod",
    "checkNumber",
    "notes",
    "createdBy",
    "createdAt",
    "updatedBy",
    "updatedAt"
  ],
  "Reimbursement_Allocations": [
    "allocationId",
    "reimbursementId",
    "purchaseTransactionId",
    "allocatedAmount",
    "personallyAbsorbedAmount",
    "refundCreditAdjustment",
    "refundTransactionId",
    "notes",
    "createdBy",
    "createdAt"
  ],
  "Receipt_Register": [
    "receiptId",
    "receiptDate",
    "merchant",
    "amount",
    "documentType",
    "driveFileId",
    "driveUrl",
    "source",
    "emailMessageId",
    "matchedTransactionId",
    "matchStatus",
    "notes",
    "createdBy",
    "createdAt",
    "updatedAt"
  ],
  "Check_Details": [
    "checkId",
    "checkNumber",
    "checkDate",
    "amount",
    "payee",
    "purpose",
    "transactionId",
    "invoiceReceiptId",
    "driveFileId",
    "driveUrl",
    "reconciliationStatus",
    "notes",
    "createdBy",
    "createdAt",
    "updatedAt"
  ],
  "Capital_Projects": [
    "projectId",
    "projectName",
    "status",
    "approvedBudget",
    "pendingCommitments",
    "notes",
    "createdBy",
    "createdAt",
    "updatedAt"
  ],
  "Audit_Issues": [
    "auditIssueId",
    "issueFingerprint",
    "ruleId",
    "severity",
    "status",
    "entityType",
    "entityId",
    "title",
    "description",
    "amount",
    "recommendedAction",
    "detectedAt",
    "lastDetectedAt",
    "detectedBy",
    "assignedTo",
    "resolutionNotes",
    "resolvedBy",
    "resolvedAt",
    "evidenceUrl"
  ],
  "Reconciliation_Staging": [
    "statementLineId",
    "statementDate",
    "description",
    "amount",
    "direction",
    "statementType",
    "referenceNumber",
    "matchStatus",
    "matchedTransactionId",
    "differenceAmount",
    "sourceFileName",
    "importedAt",
    "importedBy"
  ],
  "Monthly_Close": [
    "closeId",
    "periodKey",
    "periodStart",
    "periodEnd",
    "status",
    "checklistVersion",
    "incomeReviewed",
    "expensesReviewed",
    "receiptsReviewed",
    "checksReviewed",
    "reimbursementsReviewed",
    "bankReconciled",
    "cardsReconciled",
    "designatedFundsReviewed",
    "auditIssuesReviewed",
    "reportGenerated",
    "openCriticalIssues",
    "openHighIssues",
    "auditHealthScore",
    "totalIncome",
    "totalRecognizedExpenses",
    "netPosition",
    "closedBy",
    "closedAt",
    "reopenedBy",
    "reopenedAt",
    "reopenReason",
    "lastAmendedBy",
    "lastAmendedAt",
    "amendmentReason",
    "notes",
    "createdAt",
    "updatedAt"
  ],
  "Monthly_Close_History": [
    "historyId",
    "closeId",
    "periodKey",
    "actionType",
    "status",
    "auditHealthScore",
    "totalIncome",
    "totalRecognizedExpenses",
    "netPosition",
    "openCriticalIssues",
    "openHighIssues",
    "performedBy",
    "performedAt",
    "actionReason",
    "notes"
  ],
  "Presbyter_Reports": [
    "reportId",
    "periodKey",
    "periodStart",
    "periodEnd",
    "reportType",
    "detailLevel",
    "includeAuditAppendix",
    "totalIncome",
    "totalExpenses",
    "netPosition",
    "auditHealthScore",
    "driveFileId",
    "driveUrl",
    "generatedBy",
    "generatedAt",
    "emailSentAt",
    "emailRecipient",
    "notes"
  ]
};

/**
 * Retrieves script configuration from ScriptProperties — FAILS CLOSED
 * Never silently defaults missing sheetId or environment to production.
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    sheetId: props.getProperty("GPBC_SHEET_ID") || "",
    googleClientId: props.getProperty("GOOGLE_CLIENT_ID") || "",
    approvedUsersJson: props.getProperty("GPBC_APPROVED_USERS") || "[]",
    environment: props.getProperty("GPBC_ENVIRONMENT") || "",
    productionWritesEnabled: props.getProperty("GPBC_PRODUCTION_WRITES_ENABLED") || ""
  };
}

/**
 * Fail-Closed Hard Safety Guard:
 * Throws an exception if:
 * 1. GPBC_SHEET_ID is missing
 * 2. GPBC_ENVIRONMENT is missing on write
 * 3. Any development/sandbox/schema/test operation attempts to target PRODUCTION_SPREADSHEET_ID (Permanently Blocked)
 * 4. Environment is sandbox/dev but sheetId points to PRODUCTION_SPREADSHEET_ID
 * 5. Environment is production, sheetId is production, but GPBC_PRODUCTION_WRITES_ENABLED !== 'true' (Disarmed)
 */
function assertSandboxSheet(operationName) {
  const config = getConfig();
  const op = operationName || "write";

  if (!config.sheetId) {
    throw new Error("FAIL-CLOSED SAFETY GUARD: GPBC_SHEET_ID is not configured in Script Properties. Operation '" + op + "' blocked.");
  }

  if (!config.environment) {
    throw new Error("FAIL-CLOSED SAFETY GUARD: GPBC_ENVIRONMENT is not configured in Script Properties. Operation '" + op + "' blocked.");
  }

  // Development utilities (schema initialization, migration, test seeds) must NEVER run against production
  const DEV_ONLY_OPERATIONS = [
    "initializeSandboxSchema",
    "migrateHistoricalData",
    "seedTestData",
    "resetSandboxData"
  ];

  if (DEV_ONLY_OPERATIONS.indexOf(op) !== -1 && config.sheetId === PRODUCTION_SPREADSHEET_ID) {
    throw new Error(
      "FAIL-CLOSED SAFETY GUARD: Development operation '" + op + "' is STRICTLY FORBIDDEN against the production spreadsheet (" +
      PRODUCTION_SPREADSHEET_ID + ") regardless of environment setting or arming flags. Configure a sandbox spreadsheet ID."
    );
  }

  // Sandbox/development environment must not point to production spreadsheet ID
  if ((config.environment === "sandbox" || config.environment === "development") && config.sheetId === PRODUCTION_SPREADSHEET_ID) {
    throw new Error(
      "FAIL-CLOSED SAFETY GUARD: Environment is set to '" + config.environment + "' but GPBC_SHEET_ID points to the production spreadsheet (" +
      PRODUCTION_SPREADSHEET_ID + "). Operation '" + op + "' blocked."
    );
  }

  // Production Write Arming Control: Production writes are blocked unless explicitly armed
  if (config.environment === "production" && config.sheetId === PRODUCTION_SPREADSHEET_ID) {
    const isArmed = (config.productionWritesEnabled === "true" || config.productionWritesEnabled === true);
    if (!isArmed) {
      throw new Error(
        "FAIL-CLOSED SAFETY GUARD: Production writes are DISARMED. Set Script Property GPBC_PRODUCTION_WRITES_ENABLED='true' to authorize production write operations."
      );
    }
  }
}

/**
 * Retrieves the active Spreadsheet database instance — FAILS CLOSED on writes
 * 
 * @param {boolean} isWrite - Set to true if performing a write/modification operation
 * @param {string} operationName - Name of the operation for safety validation
 */
function getDB(isWrite, operationName) {
  const config = getConfig();
  if (!config.sheetId) {
    throw new Error("FAIL-CLOSED SAFETY GUARD: GPBC_SHEET_ID is not configured in Script Properties");
  }

  if (isWrite) {
    assertSandboxSheet(operationName || "database write");
  }

  return SpreadsheetApp.openById(config.sheetId);
}

/**
 * Asserts environment safety
 */
function assertEnvironment(requiredEnv) {
  const current = getConfig().environment;
  if (!current) {
    throw new Error("GPBC_ENVIRONMENT is not configured in Script Properties");
  }
  if (requiredEnv && current !== requiredEnv) {
    throw new Error("Action restricted to " + requiredEnv + " environment (current: " + current + ")");
  }
}

/**
 * Returns a read-only schema inventory of the spreadsheet (tab names and header columns only)
 * NEVER returns confidential financial row values.
 */
function getSchemaInventory() {
  const db = getDB(false, "getSchemaInventory");
  const sheets = db.getSheets();

  const inventory = sheets.map(function(sheet) {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    let headers = [];
    if (lastRow > 0 && lastColumn > 0) {
      const headerValues = sheet.getRange(1, 1, 1, lastColumn).getValues();
      if (headerValues && headerValues[0]) {
        headers = headerValues[0].map(function(h) { return String(h || "").trim(); });
      }
    }

    return {
      name: sheetName,
      rowCount: lastRow,
      columnCount: lastColumn,
      headers: headers
    };
  });

  return {
    success: true,
    spreadsheetId: db.getId(),
    isProductionId: db.getId() === PRODUCTION_SPREADSHEET_ID,
    sheetCount: sheets.length,
    sheets: inventory,
    environment: getConfig().environment || "UNCONFIGURED"
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PRODUCTION_SPREADSHEET_ID,
    CHURCH_INFO,
    SCHEMA_DEFINITIONS,
    getConfig,
    assertSandboxSheet,
    getDB,
    assertEnvironment,
    getSchemaInventory
  };
}
