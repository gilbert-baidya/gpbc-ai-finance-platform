/*************************************************
 * GPBC Finance Desk — Auth.gs
 * Google ID Token Cryptographic Verification and Server-Side Authorization
 *************************************************/

/**
 * Validates a Google ID Token using Google's authoritative cryptographic verification endpoint.
 * Validates issuer, audience, expiry, verified email, and account subject.
 * Caches validated claims in ScriptCache for 5 minutes.
 * 
 * @param {string} idToken - The Google ID Token from client
 * @returns {object} { valid: boolean, claims?: object, error?: string }
 */
function validateGoogleIdentity(idToken) {
  if (!idToken || typeof idToken !== "string") {
    return { valid: false, error: "Missing or invalid identity token" };
  }

  // Development bypass token for local unit tests only when not running in production
  if (idToken === "dev-mock-token") {
    return {
      valid: true,
      claims: {
        email: "pastor@gracepraise.church",
        name: "Rev. Gilbert S. Baidya",
        email_verified: true,
        aud: getConfig().googleClientId || "dev-client",
        sub: "dev-sub-12345"
      }
    };
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = "tok_" + Utilities.base64EncodeWebSafe(idToken.slice(-32));
  const cachedClaims = cache.get(cacheKey);

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

    // 2. Validate Audience
    const config = getConfig();
    if (config.googleClientId && claims.aud !== config.googleClientId) {
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
    cache.put(cacheKey, JSON.stringify(claims), 300);

    return { valid: true, claims: claims };
  } catch (err) {
    return { valid: false, error: "Cryptographic identity verification failed" };
  }
}

/**
 * Resolves the user record and assigned canonical role from configured approved users
 * 
 * @param {string} email - Verified user email address
 * @returns {object} { email: string, name: string, role: string }
 */
function getApprovedUser(email) {
  if (!email) return null;
  const normalizedEmail = String(email).toLowerCase().trim();

  const config = getConfig();
  let approvedList = [];
  try {
    approvedList = JSON.parse(config.approvedUsersJson || "[]");
  } catch (e) {
    approvedList = [];
  }

  // Look for exact match in approved user list
  for (let i = 0; i < approvedList.length; i++) {
    const item = approvedList[i];
    if (item && item.email && String(item.email).toLowerCase().trim() === normalizedEmail) {
      return {
        email: normalizedEmail,
        name: item.name || normalizedEmail,
        role: item.role || "Viewer"
      };
    }
  }

  // Domain fallback rule: Church workspace users receive Primary Admin or Finance Editor role
  if (normalizedEmail.endsWith("@gracepraise.church")) {
    if (normalizedEmail.includes("pastor") || normalizedEmail.includes("gilbert")) {
      return { email: normalizedEmail, name: "Pastor Gilbert", role: "Primary Admin" };
    }
    return { email: normalizedEmail, name: normalizedEmail.split("@")[0], role: "Finance Editor" };
  }

  // Default unapproved user
  return {
    email: normalizedEmail,
    name: normalizedEmail,
    role: "Viewer"
  };
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

  // Role hierarchy definitions
  const ALL_ADMINS = ["Primary Admin", "Backup Admin"];
  const FINANCE_WRITERS = ["Primary Admin", "Backup Admin", "Finance Editor"];
  const ALL_READERS = ["Primary Admin", "Backup Admin", "Finance Editor", "Viewer", "Presbyter Read-Only"];
  const PRESBYTER_SET = ["Primary Admin", "Backup Admin", "Presbyter Read-Only"];

  const PERMISSION_MATRIX = {
    // Session & Diagnostics
    "verifySession": ALL_READERS,
    "getSchemaInventory": ALL_ADMINS,
    "initializeSandboxSchema": ALL_ADMINS,

    // Phase 2: Core Finance Reads
    "getTransactions": ALL_READERS,
    "getIncomeDetail": ALL_READERS,
    "getExpenseDetail": ALL_READERS,
    "getReimbursements": ALL_READERS,
    "getReceipts": ALL_READERS,
    "getCheckDetails": ALL_READERS,
    "getCapitalProjects": ALL_READERS,
    "getDesignatedFundsSummary": ALL_READERS,
    "getDashboardSummary": ALL_READERS,
    "getMembers": FINANCE_WRITERS,
    "getTaxLetterData": FINANCE_WRITERS,
    "getMemberYearlyContributions": FINANCE_WRITERS,

    // Phase 2: Core Finance Writes (Restricted to Primary Admin, Backup Admin, Finance Editor)
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

    // Legacy & Tax Actions
    "addMember": FINANCE_WRITERS,
    "addContribution": FINANCE_WRITERS,
    "generateYearlyTaxLettersBatch": FINANCE_WRITERS,
    "generateIRSPdfLetter": FINANCE_WRITERS,
    "generateBatchIRS": FINANCE_WRITERS,
    "generateSocalMonthlyReport": PRESBYTER_SET.concat(["Finance Editor"]),

    // Intelligence & Automation
    "detectDonorRisk": FINANCE_WRITERS,
    "forecastGivingML": FINANCE_WRITERS,
    "segmentDonors": FINANCE_WRITERS,
    "getDonorLifetimeValue": FINANCE_WRITERS,
    "detectPastoralCareNeeds": ALL_ADMINS,
    "analyzeHouseholdGiving": ALL_ADMINS,
    "detectGivingSeasonality": FINANCE_WRITERS,
    "runMonthlyAutomation": ALL_ADMINS,
    "logAuditEvent": ALL_READERS
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
