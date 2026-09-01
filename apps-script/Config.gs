/*************************************************
 * GPBC Finance Desk — Config.gs
 * Server-Side Configuration, Schema Definitions, and Sandbox Safety
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
 */
const SCHEMA_DEFINITIONS = {
  "Transactions": [
    "transactionId",
    "transactionDate",
    "transactionType",
    "direction",
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
    "designatedDonationsReceived",
    "otherFunding",
    "expensesPaid",
    "pendingCommitments",
    "remainingDesignatedBalance",
    "notes",
    "createdBy",
    "createdAt",
    "updatedAt"
  ]
};

/**
 * Retrieves script configuration from ScriptProperties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    sheetId: props.getProperty("GPBC_SHEET_ID") || PRODUCTION_SPREADSHEET_ID,
    googleClientId: props.getProperty("GOOGLE_CLIENT_ID") || "",
    approvedUsersJson: props.getProperty("GPBC_APPROVED_USERS") || "[]",
    environment: props.getProperty("GPBC_ENVIRONMENT") || "production"
  };
}

/**
 * Hard Safety Guard: Throws an exception if a development/schema write operation attempts
 * to target the known production spreadsheet ID.
 */
function assertSandboxSheet(operationName) {
  const config = getConfig();
  if (!config.sheetId) {
    throw new Error("SAFETY GUARD: GPBC_SHEET_ID is not configured. Operation '" + (operationName || "write") + "' blocked.");
  }
  
  if (config.sheetId === PRODUCTION_SPREADSHEET_ID && config.environment !== "production") {
    throw new Error(
      "SAFETY GUARD: Operation '" + (operationName || "write") + "' is forbidden against the production spreadsheet (" + 
      PRODUCTION_SPREADSHEET_ID + "). Please configure a non-production sandbox ID in Script Properties."
    );
  }
}

/**
 * Retrieves the active Spreadsheet database instance
 * 
 * @param {boolean} isWrite - Set to true if performing a write/modification operation
 * @param {string} operationName - Name of the operation for safety logging
 */
function getDB(isWrite, operationName) {
  const config = getConfig();
  if (!config.sheetId) {
    throw new Error("GPBC_SHEET_ID is not configured in Script Properties");
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
    environment: getConfig().environment
  };
}
