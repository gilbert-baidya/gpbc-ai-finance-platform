/*************************************************
 * GPBC Finance Desk — Receipts.gs
 * Receipt Register & Check Details Engine with Validation
 *************************************************/

/**
 * Retrieves receipts from Receipt Register
 */
function getReceipts(p) {
  p = p || {};
  const db = getDB(false, "getReceipts");
  const sheet = db.getSheetByName("Receipt_Register");
  let receipts = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    receipts = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.amount = Number(obj.amount || 0);
      return obj;
    });
  }

  if (p.matchStatus) {
    receipts = receipts.filter(function(r) { return r.matchStatus === p.matchStatus; });
  }
  if (p.search) {
    const q = String(p.search).toLowerCase();
    receipts = receipts.filter(function(r) {
      return (r.merchant && r.merchant.toLowerCase().includes(q)) ||
             (r.receiptId && r.receiptId.toLowerCase().includes(q)) ||
             (r.notes && r.notes.toLowerCase().includes(q));
    });
  }

  // Sort descending by date
  receipts.sort(function(a, b) {
    return (b.receiptDate || "").localeCompare(a.receiptDate || "");
  });

  return { success: true, count: receipts.length, receipts: receipts };
}

/**
 * Adds a receipt entry to the Receipt Register
 */
function addReceipt(p, userEmail) {
  p = p || {};
  if (!p.merchant) throw new Error("Merchant/Vendor name is required");
  const amount = Number(p.amount || 0);
  if (amount <= 0) throw new Error("Receipt amount must be a positive number");

  const db = getDB(true, "addReceipt");
  let sheet = db.getSheetByName("Receipt_Register");
  if (!sheet) {
    initializeSandboxSchema();
    sheet = db.getSheetByName("Receipt_Register");
  }

  const receiptId = "RCP-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";
  const rDate = p.receiptDate || nowIso.split("T")[0];

  sheet.appendRow([
    receiptId,
    rDate,
    p.merchant,
    amount,
    p.documentType || "Receipt",
    p.driveFileId || "",
    p.driveUrl || "",
    p.source || "Manual Upload",
    p.emailMessageId || "",
    p.matchedTransactionId || "",
    p.matchedTransactionId ? "Matched" : "Unmatched",
    p.notes || "",
    actor,
    nowIso,
    nowIso
  ]);

  return { success: true, receiptId: receiptId };
}

/**
 * Matches a receipt to an authoritative transaction after verifying existence
 */
function matchReceiptToTransaction(p, userEmail) {
  p = p || {};
  if (!p.receiptId) throw new Error("receiptId is required");
  if (!p.transactionId) throw new Error("transactionId is required");

  const db = getDB(true, "matchReceiptToTransaction");
  const rSheet = db.getSheetByName("Receipt_Register");
  const tSheet = db.getSheetByName("Transactions");

  if (!rSheet) throw new Error("Receipt_Register tab missing");
  if (!tSheet || tSheet.getLastRow() <= 1) {
    throw new Error("Transactions tab missing or empty. Cannot match receipt to non-existent transaction.");
  }

  // 1. Verify Transaction exists
  const tData = tSheet.getDataRange().getValues();
  const tHeaders = tData.shift();
  const tIdCol = tHeaders.indexOf("transactionId");
  const tIdx = tData.findIndex(function(r) { return r[tIdCol] === p.transactionId; });
  if (tIdx === -1) {
    throw new Error("Transaction not found: " + p.transactionId);
  }

  // 2. Verify Receipt exists
  const rData = rSheet.getDataRange().getValues();
  const rHeaders = rData.shift();
  const rIdx = rData.findIndex(function(r) { return r[0] === p.receiptId; });
  if (rIdx === -1) {
    throw new Error("Receipt not found: " + p.receiptId);
  }

  const rRow = rIdx + 2;
  const R_TXN_COL = rHeaders.indexOf("matchedTransactionId") + 1;
  const R_STATUS_COL = rHeaders.indexOf("matchStatus") + 1;
  const R_UPDATED_COL = rHeaders.indexOf("updatedAt") + 1;

  if (R_TXN_COL > 0) rSheet.getRange(rRow, R_TXN_COL).setValue(p.transactionId);
  if (R_STATUS_COL > 0) rSheet.getRange(rRow, R_STATUS_COL).setValue("Matched");
  if (R_UPDATED_COL > 0) rSheet.getRange(rRow, R_UPDATED_COL).setValue(new Date().toISOString());

  // 3. Update Transactions row
  const tRow = tIdx + 2;
  const T_RCP_COL = tHeaders.indexOf("receiptId") + 1;
  const T_STATUS_COL = tHeaders.indexOf("receiptStatus") + 1;
  if (T_RCP_COL > 0) tSheet.getRange(tRow, T_RCP_COL).setValue(p.receiptId);
  if (T_STATUS_COL > 0) tSheet.getRange(tRow, T_STATUS_COL).setValue("Attached");

  return { success: true, receiptId: p.receiptId, matchedTransactionId: p.transactionId };
}

/**
 * Retrieves Check Details
 */
function getCheckDetails() {
  const db = getDB(false, "getCheckDetails");
  const sheet = db.getSheetByName("Check_Details");
  let checks = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    checks = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.amount = Number(obj.amount || 0);
      return obj;
    });
  }

  return { success: true, count: checks.length, checks: checks };
}

/**
 * Adds a Check disbursement record with duplicate checking and transaction verification
 */
function addCheckDetail(p, userEmail) {
  p = p || {};
  if (!p.checkNumber) throw new Error("Check number is required");
  const amount = Number(p.amount || 0);
  if (amount <= 0) throw new Error("Check amount must be greater than zero");
  if (!p.payee) throw new Error("Payee is required");

  const db = getDB(true, "addCheckDetail");
  let sheet = db.getSheetByName("Check_Details");
  if (!sheet) {
    initializeSandboxSchema();
    sheet = db.getSheetByName("Check_Details");
  }

  // Check for duplicate active check numbers
  if (sheet.getLastRow() > 1) {
    const existing = sheet.getDataRange().getValues();
    const headers = existing.shift();
    const chkNumCol = headers.indexOf("checkNumber");
    const statusCol = headers.indexOf("reconciliationStatus");

    const duplicate = existing.find(function(r) {
      return String(r[chkNumCol]).trim() === String(p.checkNumber).trim() && r[statusCol] !== "Voided";
    });

    if (duplicate) {
      throw new Error("Duplicate check number #" + p.checkNumber + " already exists in register");
    }
  }

  // If transactionId is supplied, verify transaction exists
  if (p.transactionId) {
    const tSheet = db.getSheetByName("Transactions");
    if (tSheet && tSheet.getLastRow() > 1) {
      const tData = tSheet.getDataRange().getValues();
      const tHeaders = tData.shift();
      const tIdCol = tHeaders.indexOf("transactionId");
      const matched = tData.find(function(r) { return r[tIdCol] === p.transactionId; });
      if (!matched) {
        throw new Error("Referenced transaction not found: " + p.transactionId);
      }
    }
  }

  const checkId = "CHK-" + Date.now();
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";
  const cDate = p.checkDate || nowIso.split("T")[0];

  sheet.appendRow([
    checkId,
    p.checkNumber,
    cDate,
    amount,
    p.payee,
    p.purpose || "",
    p.transactionId || "",
    p.invoiceReceiptId || "",
    p.driveFileId || "",
    p.driveUrl || "",
    p.reconciliationStatus || "Unreconciled",
    p.notes || "",
    actor,
    nowIso,
    nowIso
  ]);

  return { success: true, checkId: checkId };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getReceipts,
    addReceipt,
    matchReceiptToTransaction,
    getCheckDetails,
    addCheckDetail
  };
}
