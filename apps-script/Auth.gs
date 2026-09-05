/*************************************************
 * GPBC Finance Desk — Auth.gs
 * Google ID Token Cryptographic Verification and Fail-Closed Authorization
 *************************************************/

/**
 * Validates a Google ID Token using Google's authoritative cryptographic verification endpoint.
 * Validates issuer, audience, expiry, verified email, and account subject.
 * Caches validated claims in ScriptCache for 5 minutes using SHA-256 digest keys.
 * 
 * @param {string} idToken - The Google ID Token from client
 * @returns {object} { valid: boolean, claims?: object, error?: string }
 */
function validateGoogleIdentity(idToken) {
  if (!idToken || typeof idToken !== "string") {
    return { valid: false, error: "Missing or invalid identity token" };
  }

  const config = getConfig();

  // Fail closed if Google Client ID is not configured
  if (!config.googleClientId) {
    return { valid: false, error: "Configuration error: GOOGLE_CLIENT_ID is not configured in Script Properties" };
  }

  const cache = (typeof CacheService !== "undefined") ? CacheService.getScriptCache() : null;
  let cachedClaims = null;
  let cacheKey = "";
  if (cache && typeof Utilities !== "undefined") {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken);
    cacheKey = "tok_" + Utilities.base64EncodeWebSafe(digest);
    cachedClaims = cache.get(cacheKey);
  }

  if (cachedClaims) {
    try {
      return { valid: true, claims: JSON.parse(cachedClaims) };
    } catch (e) {
      // cache corrupted, fall through to live validation
    }
  }

  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "Accept": "application/json" }
    });

    if (response.getResponseCode() !== 200) {
      return { valid: false, error: "Invalid Google ID token signature or token expired" };
    }

    const claims = JSON.parse(response.getContentText());

    // 1. Validate Subject/Identity presence
    if (!claims.sub || typeof claims.sub !== "string") {
      return { valid: false, error: "Token subject claim missing" };
    }

    // 2. Validate Audience (Mandatory - strict single Finance Desk client ID)
    if (claims.aud !== config.googleClientId) {
      return { valid: false, error: "Token audience mismatch" };
    }

    // 3. Validate Issuer
    if (claims.iss !== "accounts.google.com" && claims.iss !== "https://accounts.google.com") {
      return { valid: false, error: "Token issuer invalid" };
    }

    // 4. Validate Email Verification
    if (claims.email_verified !== "true" && claims.email_verified !== true) {
      return { valid: false, error: "Google email not verified" };
    }

    // 5. Validate Expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (claims.exp && Number(claims.exp) < nowSec) {
      return { valid: false, error: "Google ID token has expired" };
    }

    // Cache valid claims for 300 seconds (5 minutes)
    if (cache && cacheKey) {
      cache.put(cacheKey, JSON.stringify(claims), 300);
    }

    return { valid: true, claims: claims };
  } catch (err) {
    return { valid: false, error: "Cryptographic identity verification failed" };
  }
}

/**
 * Resolves the user record and assigned canonical role from explicit GPBC_APPROVED_USERS configuration.
 * FAILS CLOSED (DENY-BY-DEFAULT): If user email is not in the explicit approved list, returns null.
 * NEVER infers roles based on email domain or string matching.
 * 
 * @param {string} email - Verified user email address
 * @returns {object|null} { email: string, name: string, role: string } or null if unapproved
 */
function getApprovedUser(email) {
  if (!email) return null;
  const normalizedEmail = String(email).toLowerCase().trim();

  const config = getConfig();
  if (!config.approvedUsersJson) return null;

  let approvedList = [];
  try {
    approvedList = JSON.parse(config.approvedUsersJson);
  } catch (e) {
    return null;
  }

  if (!Array.isArray(approvedList)) return null;

  const CANONICAL_ROLES = [
    "Primary Admin",
    "Backup Admin",
    "Finance Editor",
    "Viewer",
    "Presbyter Read-Only"
  ];

  // Exact lookup in approved user list
  for (let i = 0; i < approvedList.length; i++) {
    const item = approvedList[i];
    if (item && item.email && String(item.email).toLowerCase().trim() === normalizedEmail) {
      const role = String(item.role || "").trim();
      // Fail closed: Invalid, missing, or misspelled roles are NOT converted to Viewer
      if (CANONICAL_ROLES.indexOf(role) === -1) {
        return null;
      }

      return {
        email: normalizedEmail,
        name: item.name || normalizedEmail,
        role: role
      };
    }
  }

  // Deny by default: Unknown users receive NO role and NO access
  return null;
}

/**
 * Authorizes whether a user role has permission to execute an action
 * 
 * Canonical Roles:
 * - Primary Admin
 * - Backup Admin
 * - Finance Editor
 * - Viewer
 * - Presbyter Read-Only
 * 
 * @param {string} action - The action requested
 * @param {string} role - The user's resolved role
 * @returns {object} { authorized: boolean, reason?: string }
 */
function authorizeAction(action, role) {
  if (!action) return { authorized: false, reason: "No action specified" };
  if (!role) return { authorized: false, reason: "Unauthorized: User not in approved user list" };

  // Role hierarchy definitions
  const ALL_ADMINS = ["Primary Admin", "Backup Admin"];
  const FINANCE_WRITERS = ["Primary Admin", "Backup Admin", "Finance Editor"];
  const OPERATIONAL_READERS = ["Primary Admin", "Backup Admin", "Finance Editor", "Viewer"];
  const ALL_READERS = ["Primary Admin", "Backup Admin", "Finance Editor", "Viewer", "Presbyter Read-Only"];
  const PRESBYTER_SET = ["Primary Admin", "Backup Admin", "Presbyter Read-Only"];

  const PERMISSION_MATRIX = {
    // Session & Diagnostics
    "verifySession": ALL_READERS,
    "getSchemaInventory": ALL_ADMINS,
    "getProductionReadiness": ALL_ADMINS,
    "initializeSandboxSchema": ALL_ADMINS,
    "verifyCandidateWorkbook": ALL_ADMINS,
    "verifyLegacyWorkbookIntegrity": ALL_ADMINS,
    "repairSandboxTestState": ALL_ADMINS,

    // Migration Executors (REMOVED FROM API SURFACE - DENY ALL ROLES)
    "getLegacyMigrationDryRun": [],
    "getLegacyMigrationStatus": [],
    "executeLegacyFinanceMigration": [],
    "createLegacyPreMigrationBackup": [],
    "createProductionCandidateMaster": [],
    "executeControlledCandidateMigration": [],
    "linkProductionDriveEvidence": [],

    // Core Finance Reads (Restricted to Operational Readers — Presbyter DENIED direct access)
    "getTransactions": OPERATIONAL_READERS,
    "getIncomeDetail": OPERATIONAL_READERS,
    "getExpenseDetail": OPERATIONAL_READERS,
    "getReimbursements": OPERATIONAL_READERS,
    "getReceipts": OPERATIONAL_READERS,
    "getCheckDetails": OPERATIONAL_READERS,
    "getCapitalProjects": OPERATIONAL_READERS,
    "getDesignatedFundsSummary": OPERATIONAL_READERS,
    "getDashboardSummary": OPERATIONAL_READERS,
    "getDocuments": OPERATIONAL_READERS,
    "getMembers": FINANCE_WRITERS,
    "getTaxLetterData": FINANCE_WRITERS,
    "getMemberYearlyContributions": FINANCE_WRITERS,

    // Core Finance Writes (Restricted to Primary Admin, Backup Admin, Finance Editor)
    "addTransaction": FINANCE_WRITERS,
    "updateTransaction": FINANCE_WRITERS,
    "deleteTransaction": ALL_ADMINS,
    "addIncome": FINANCE_WRITERS,
    "addExpense": FINANCE_WRITERS,
    "addReimbursement": FINANCE_WRITERS,
    "addReimbursementAllocation": FINANCE_WRITERS,
    "addReceipt": FINANCE_WRITERS,
    "matchReceiptToTransaction": FINANCE_WRITERS,
    "addCheckDetail": FINANCE_WRITERS,
    "addCapitalProject": ALL_ADMINS,
    "updateCapitalProject": ALL_ADMINS,
    "uploadDocument": FINANCE_WRITERS,
    "linkDocumentToEntity": FINANCE_WRITERS,
    "findDocumentMatches": FINANCE_WRITERS,
    "checkDocumentDuplicate": FINANCE_WRITERS,
    "getSmartUploadOptions": FINANCE_WRITERS,
    "updateDocumentStatus": FINANCE_WRITERS,
    "deleteDocument": ALL_ADMINS,

    // Legacy & Tax Actions
    "addMember": FINANCE_WRITERS,
    "addContribution": FINANCE_WRITERS,
    "generateYearlyTaxLettersBatch": FINANCE_WRITERS,
    "generateIRSPdfLetter": FINANCE_WRITERS,
    "generateBatchIRS": FINANCE_WRITERS,
    "generateSocalMonthlyReport": FINANCE_WRITERS,

    // Phase 3 Audit & Reconciliation Center (Restricted to Operational Readers — Presbyter DENIED)
    "runAudit": FINANCE_WRITERS,
    "getAuditIssues": OPERATIONAL_READERS,
    "getAuditSummary": OPERATIONAL_READERS,
    "resolveAuditIssue": FINANCE_WRITERS,
    "reopenAuditIssue": FINANCE_WRITERS,
    "assignAuditIssue": FINANCE_WRITERS,
    "stageBankStatementLines": FINANCE_WRITERS,
    "getReconciliationCandidates": OPERATIONAL_READERS,
    "matchReconciliationLine": FINANCE_WRITERS,
    "getReconciliationRecords": OPERATIONAL_READERS,
    "reconcileTransactionRecord": FINANCE_WRITERS,
    "autoReconcilePeriod": FINANCE_WRITERS,

    // Phase 4 Monthly Close & Period Locking (Restricted to Operational Readers — Presbyter DENIED)
    "getMonthlyClose": OPERATIONAL_READERS,
    "getMonthlyCloseReadiness": OPERATIONAL_READERS,
    "closeMonthlyPeriod": ALL_ADMINS,
    "reopenMonthlyPeriod": ALL_ADMINS,
    "getMonthlyCloseHistory": OPERATIONAL_READERS,
    "generateMonthEndReportPackage": OPERATIONAL_READERS,
    "getMonthEndReportPackage": OPERATIONAL_READERS,
    "archiveMonthEndReportPackage": ALL_ADMINS,

    // Phase 4 Presbyter Reporting (Read-only allowed for Presbyter Read-Only; Persistent write restricted to FINANCE_WRITERS)
    "getPresbyterReport": ALL_READERS,
    "generatePresbyterReport": FINANCE_WRITERS,
    "getPresbyterReports": ALL_READERS,
    "sendPresbyterReport": ALL_ADMINS.concat(["Finance Editor"]),

    // Intelligence & Automation
    "detectDonorRisk": FINANCE_WRITERS,
    "forecastGivingML": FINANCE_WRITERS,
    "segmentDonors": FINANCE_WRITERS,
    "getDonorLifetimeValue": FINANCE_WRITERS,
    "detectPastoralCareNeeds": ALL_ADMINS,
    "analyzeHouseholdGiving": ALL_ADMINS,
    "detectGivingSeasonality": FINANCE_WRITERS,
    "runMonthlyAutomation": ALL_ADMINS,

    // Audit Logging Direct API (REMOVED FROM API SURFACE - DENY ALL ROLES)
    "logAuditEvent": []
  };

  const allowedRoles = PERMISSION_MATRIX[action];

  if (!allowedRoles) {
    return { authorized: false, reason: "Action not recognized in authorization policy: " + action };
  }

  if (allowedRoles.indexOf(role) !== -1) {
    return { authorized: true };
  }

  return { authorized: false, reason: "Role '" + role + "' is not permitted to perform '" + action + "'" };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateGoogleIdentity,
    getApprovedUser,
    authorizeAction
  };
}
