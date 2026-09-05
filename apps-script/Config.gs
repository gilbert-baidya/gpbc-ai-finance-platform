/*************************************************
 * GPBC Finance Desk — Config.gs
 * Server-Side Configuration, Schema Definitions, and Fail-Closed Safety
 *************************************************/

const PRODUCTION_SPREADSHEET_ID = "1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s";
const PRODUCTION_DRIVE_ROOT_ID = "1OsKbjEorsemb96Gtc2hugr-s6SySCQ9K";
const SANDBOX_SPREADSHEET_ID = "1y3kTt5MTMvi4XTEDL6ZgydIX4NDMYGFdHx5w4QCQAwA";
const SANDBOX_DRIVE_ROOT_ID = "1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx";

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
  "Document_Register": [
    "documentId",
    "documentType",
    "title",
    "originalFileName",
    "storedFileName",
    "mimeType",
    "fileSize",
    "driveFileId",
    "driveFileUrl",
    "driveFolderId",
    "documentDate",
    "financeYear",
    "financeMonth",
    "relatedEntityType",
    "relatedEntityId",
    "relatedTransactionId",
    "relatedReimbursementId",
    "relatedCapitalProjectId",
    "relatedCheckId",
    "source",
    "contentHash",
    "status",
    "isPostCloseAddition",
    "postCloseReason",
    "addedAfterCloseAt",
    "addedAfterCloseBy",
    "closedPeriodReference",
    "notes",
    "uploadedBy",
    "uploadedAt",
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
  "Reconciliation_Register": [
    "reconciliationId",
    "financeYear",
    "financeMonth",
    "transactionId",
    "transactionType",
    "sourceRecordType",
    "sourceRecordId",
    "expectedAmount",
    "reconciledAmount",
    "differenceAmount",
    "reconciliationStatus",
    "reconciliationMethod",
    "referenceNumber",
    "bankReference",
    "checkNumber",
    "reimbursementId",
    "evidenceCount",
    "notes",
    "reviewReason",
    "reconciledBy",
    "reconciledAt",
    "createdBy",
    "createdAt",
    "updatedAt"
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
  ],
  "AUDIT_LOGS": [
    "Timestamp",
    "Actor",
    "Action",
    "Status",
    "Details"
  ]
};

/**
 * Retrieves script configuration from ScriptProperties — FAILS CLOSED
 * Never silently defaults missing sheetId or environment to production.
 */
function getConfig() {
  if (typeof PropertiesService === "undefined") {
    return {
      sheetId: "",
      googleClientId: "",
      approvedUsersJson: "[]",
      environment: "test",
      productionWritesEnabled: "",
      driveRootFolderId: ""
    };
  }
  const props = PropertiesService.getScriptProperties();
  return {
    sheetId: props.getProperty("GPBC_SHEET_ID") || "",
    googleClientId: props.getProperty("GOOGLE_CLIENT_ID") || "",
    approvedUsersJson: props.getProperty("GPBC_APPROVED_USERS") || "[]",
    environment: props.getProperty("GPBC_ENVIRONMENT") || "",
    productionWritesEnabled: props.getProperty("GPBC_PRODUCTION_WRITES_ENABLED") || "",
    driveRootFolderId: props.getProperty("GPBC_DRIVE_ROOT_FOLDER_ID") || ""
  };
}

/**
 * Sets initial production script properties for separate production deployment
 */
function setProductionScriptProperties() {
  if (typeof PropertiesService === "undefined") return { success: false, error: "PropertiesService unavailable" };
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    "GPBC_ENVIRONMENT": "production",
    "GPBC_SHEET_ID": PRODUCTION_SPREADSHEET_ID,
    "GPBC_DRIVE_ROOT_FOLDER_ID": PRODUCTION_DRIVE_ROOT_ID,
    "GOOGLE_CLIENT_ID": "456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com",
    "GPBC_PRODUCTION_WRITES_ENABLED": "false",
    "GPBC_APPROVED_USERS": JSON.stringify([
      { email: "gilbert.baidya@gmail.com", name: "Pastor Gilbert Baidya", role: "Primary Admin" }
    ])
  });
  return { success: true, message: "Production script properties configured cleanly" };
}

/**
 * Sets ONLY the GOOGLE_CLIENT_ID script property
 */
function setProductionGoogleClientId() {
  if (typeof PropertiesService === "undefined") return { success: false, error: "PropertiesService unavailable" };
  const props = PropertiesService.getScriptProperties();
  props.setProperty("GOOGLE_CLIENT_ID", "456809328996-8rji8ff249l0tb276236rguctv36k4e8.apps.googleusercontent.com");
  return { success: true, message: "GOOGLE_CLIENT_ID set cleanly" };
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
  const config = getConfig();

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
    spreadsheetTitle: db.getName(),
    isProductionId: db.getId() === PRODUCTION_SPREADSHEET_ID,
    productionWritesEnabled: config.productionWritesEnabled === "true" || config.productionWritesEnabled === true,
    sheetCount: sheets.length,
    sheets: inventory,
    environment: config.environment || "UNCONFIGURED"
  };
}

/**
 * Asserts production configuration prerequisites — FAILS CLOSED
 */
function assertProductionReadiness() {
  const config = getConfig();

  if (config.environment === "production") {
    if (!config.sheetId || config.sheetId !== PRODUCTION_SPREADSHEET_ID) {
      throw new Error("FAIL-CLOSED SAFETY GUARD: Production environment requires GPBC_SHEET_ID=" + PRODUCTION_SPREADSHEET_ID);
    }
    if (!config.driveRootFolderId || config.driveRootFolderId !== PRODUCTION_DRIVE_ROOT_ID) {
      throw new Error("FAIL-CLOSED SAFETY GUARD: Production environment requires GPBC_DRIVE_ROOT_FOLDER_ID=" + PRODUCTION_DRIVE_ROOT_ID);
    }
    if (!config.googleClientId) {
      throw new Error("FAIL-CLOSED SAFETY GUARD: Production environment requires GOOGLE_CLIENT_ID configured");
    }
    let approved = [];
    try {
      approved = JSON.parse(config.approvedUsersJson);
    } catch (e) {
      approved = [];
    }
    if (!Array.isArray(approved) || approved.length === 0) {
      throw new Error("FAIL-CLOSED SAFETY GUARD: Production environment requires GPBC_APPROVED_USERS configured with authorized accounts");
    }
  }

  return true;
}

/**
 * Returns Phase 5A Production Readiness Governance Analysis
 */
function getProductionReadiness() {
  const config = getConfig();
  let dbAccessible = false;
  let dbTitle = "";
  let driveAccessible = false;
  let existingSheets = [];
  let missingModernTables = [];

  const REQUIRED_MODERN_TABLES = [
    "Transactions",
    "Reimbursements",
    "Reimbursement_Allocations",
    "Document_Register",
    "Capital_Projects",
    "Audit_Issues",
    "Reconciliation_Register",
    "Monthly_Close",
    "Monthly_Close_History",
    "Presbyter_Reports",
    "AUDIT_LOGS"
  ];

  if (config.sheetId) {
    try {
      const db = SpreadsheetApp.openById(config.sheetId);
      dbAccessible = !!db;
      dbTitle = db ? db.getName() : "";
      if (db) {
        existingSheets = db.getSheets().map(function(s) { return s.getName(); });
      }
    } catch (err) {
      dbAccessible = false;
    }
  }

  // Determine missing modern tables
  missingModernTables = REQUIRED_MODERN_TABLES.filter(function(table) {
    return existingSheets.indexOf(table) === -1;
  });

  if (config.driveRootFolderId && typeof DriveApp !== "undefined" && DriveApp.getFolderById) {
    try {
      const folder = DriveApp.getFolderById(config.driveRootFolderId);
      driveAccessible = !!folder;
    } catch (err) {
      driveAccessible = false;
    }
  } else {
    driveAccessible = !!config.driveRootFolderId;
  }

  let approvedCount = 0;
  try {
    const parsed = JSON.parse(config.approvedUsersJson);
    approvedCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch (err) {
    approvedCount = 0;
  }

  const isProduction = config.environment === "production" || config.sheetId === PRODUCTION_SPREADSHEET_ID;
  const writesEnabled = config.productionWritesEnabled === "true" || config.productionWritesEnabled === true;
  const hasSchemaBlocker = missingModernTables.length > 0;

  const checks = [
    { id: "environment", label: "Environment Isolation", status: config.environment ? "PASS" : "FAIL", detail: config.environment || "Not configured" },
    { id: "workbook", label: "Master Workbook Binding", status: dbAccessible ? "PASS" : "FAIL", detail: dbTitle ? (config.sheetId + " (" + dbTitle + ")") : (config.sheetId || "Not set") },
    { id: "drive", label: "Drive Root Folder Binding", status: config.driveRootFolderId ? "PASS" : "FAIL", detail: config.driveRootFolderId || "Not set" },
    { id: "oauth", label: "OAuth Web Client ID", status: config.googleClientId ? "NOT_VERIFIED" : "NOT_CONFIGURED", detail: config.googleClientId ? "Configured in code, unverified in Google Cloud Console" : "NOT CONFIGURED" },
    { id: "users", label: "Approved Users Allowlist", status: approvedCount > 0 ? "PASS" : "FAIL", detail: approvedCount + " approved accounts configured" },
    { id: "writes", label: "Production Writes Disarmed Guard", status: !writesEnabled ? "PASS" : "WARN", detail: writesEnabled ? "ARMED (TRUE)" : "DISABLED (FALSE) — Production accounting protected" },
    { id: "domain", label: "Production Custom Domain", status: "NOT_CONFIGURED", detail: "finance.gracepraise.church — NOT CONFIGURED (Pending Phase 5B hosting/DNS)" },
    { id: "backend", label: "Production Backend Apps Script", status: "NOT_CREATED", detail: "NOT CREATED — Production standalone Apps Script project pending creation" },
    { id: "schema", label: "Production Schema Compatibility", status: hasSchemaBlocker ? "BLOCKER" : "PASS", detail: hasSchemaBlocker ? ("BLOCKED — Missing " + missingModernTables.length + " modern tables (" + missingModernTables.join(", ") + "). Phase 5B upgrade required.") : "Canonical Phase 2-4 schema ready" },
    { id: "backup", label: "Master Workbook Backup Policy", status: "PASS", detail: "Pre-release spreadsheet copy backup strategy established" }
  ];

  return {
    success: true,
    environment: config.environment || "sandbox",
    isProduction: isProduction,
    productionWritesEnabled: writesEnabled,
    overallStatus: hasSchemaBlocker ? "BLOCKED — PRODUCTION SCHEMA UPGRADE REQUIRED" : (isProduction && !writesEnabled ? "READY_FOR_GO_LIVE_FOUNDATION" : "SANDBOX_GO_LIVE_READY"),
    releasePhase: "PHASE_5A_AUDIT_CORRECTION",
    missingTables: missingModernTables,
    existingSheets: existingSheets,
    workbookTitle: dbTitle || "Unknown",
    checks: checks
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PRODUCTION_SPREADSHEET_ID,
    PRODUCTION_DRIVE_ROOT_ID,
    SANDBOX_SPREADSHEET_ID,
    SANDBOX_DRIVE_ROOT_ID,
    CHURCH_INFO,
    SCHEMA_DEFINITIONS,
    getConfig,
    assertSandboxSheet,
    getDB,
    assertEnvironment,
    getSchemaInventory,
    assertProductionReadiness,
    getProductionReadiness,
    setProductionScriptProperties,
    setProductionGoogleClientId
  };
}
