/*************************************************
 * GPBC Finance Desk — Reconciliation.gs
 * Authoritative Deterministic Reconciliation Engine & Register Service
 * Primary Statuses: UNMATCHED, MATCHED, PARTIALLY_MATCHED, NEEDS_REVIEW, RECONCILED
 *************************************************/

// In Node/test environment, load dependencies
if (typeof require !== "undefined") {
  if (typeof assertPeriodWritable === "undefined") {
    const financeMath = require("./FinanceMath.gs");
    global.assertPeriodWritable = financeMath.assertPeriodWritable;
    global.getPeriodKey = financeMath.getPeriodKey;
    global.getPeriodBounds = financeMath.getPeriodBounds;
    global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  }
  if (typeof getConfig === "undefined") {
    const config = require("./Config.gs");
    global.getConfig = config.getConfig;
    global.getDB = config.getDB;
    global.assertSandboxSheet = config.assertSandboxSheet;
    global.SCHEMA_DEFINITIONS = config.SCHEMA_DEFINITIONS;
  }
  if (typeof getTransactions === "undefined") {
    const tx = require("./Transactions.gs");
    global.getTransactions = tx.getTransactions;
    global.initializeSandboxSchema = tx.initializeSandboxSchema;
  }
  if (typeof getReceipts === "undefined") {
    const rcp = require("./Receipts.gs");
    global.getReceipts = rcp.getReceipts;
    global.getCheckDetails = rcp.getCheckDetails;
  }
  if (typeof getReimbursements === "undefined") {
    const rmb = require("./Reimbursements.gs");
    global.getReimbursements = rmb.getReimbursements;
  }
  if (typeof getDocuments === "undefined") {
    const doc = require("./Documents.gs");
    global.getDocuments = doc.getDocuments;
  }
}

/**
 * Normalizes status strings into canonical Reconciliation Statuses
 */
function normalizeReconciliationStatus(status) {
  if (!status) return "UNMATCHED";
  const s = String(status).trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (s === "RECONCILED") return "RECONCILED";
  if (s === "MATCHED" || s === "EXACT_MATCH") return "MATCHED";
  if (s === "PARTIALLY_MATCHED" || s === "PARTIAL_MATCH") return "PARTIALLY_MATCHED";
  if (s === "NEEDS_REVIEW" || s === "DISCREPANCY" || s === "REVIEW_REQUIRED") return "NEEDS_REVIEW";
  return "UNMATCHED";
}

/**
 * Evaluates deterministic reconciliation rules for a record.
 * A transaction may become RECONCILED only when required financial conditions are satisfied.
 */
function evaluateDeterministicReconciliationRules(record, context) {
  context = context || {};
  const blockingReasons = [];
  const warnings = [];

  const expected = Number(record.expectedAmount || record.amount || 0);
  const reconciled = Number(record.reconciledAmount !== undefined ? record.reconciledAmount : expected);
  const diff = Number(Math.abs(expected - reconciled).toFixed(2));

  // 1. Amount Discrepancy
  if (diff > 0.009) {
    blockingReasons.push("Amount discrepancy of $" + diff.toFixed(2) + " (Expected: $" + expected.toFixed(2) + ", Confirmed: $" + reconciled.toFixed(2) + ")");
  }

  // 2. Type-Specific Rules
  const dir = String(record.direction || "").toUpperCase();
  const txType = String(record.transactionType || "").toLowerCase();

  // Income / Deposit Rules
  if (dir === "INCOME" || txType.includes("offering") || txType.includes("donation")) {
    if (!record.payeeOrPayer || record.payeeOrPayer.toLowerCase() === "unknown") {
      warnings.push("Payer / Donor name is missing or general");
    }
    if ((record.paymentMethod === "Check" || record.paymentMethod === "Bank Transfer") && !record.checkNumber && !record.referenceNumber) {
      warnings.push("Missing deposit reference / check number for non-cash income");
    }
  }

  // Expense Rules
  if (dir === "EXPENSE" && !txType.includes("reimbursement")) {
    const isExempt = (record.receiptStatus === "Exempt" || expected < 25.00);
    const hasReceipt = Boolean(record.receiptId || (context.documents && context.documents.length > 0));

    if (!isExempt && !hasReceipt) {
      blockingReasons.push("Missing required receipt or documentation for expense of $" + expected.toFixed(2));
    }
    if (!record.payeeOrPayer || record.payeeOrPayer.toLowerCase() === "unknown") {
      blockingReasons.push("Payee / Vendor name is missing");
    }
  }

  // Check Rules
  if (record.paymentMethod === "Check") {
    if (!record.checkNumber || String(record.checkNumber).trim() === "") {
      blockingReasons.push("Missing check number for check disbursement");
    }
  }

  // Reimbursement Settlement Rules
  if (txType.includes("reimbursement") || record.accountingImpact === "SETTLEMENT") {
    if (context.reimbursement) {
      const r = context.reimbursement;
      const rRemaining = Number(r.remainingReimbursable || 0);
      if (rRemaining > 0.01) {
        warnings.push("Associated reimbursement claim has $" + rRemaining.toFixed(2) + " unallocated / remaining balance");
      }
    }
  }

  const satisfiesRules = (blockingReasons.length === 0);

  return {
    satisfiesRules: satisfiesRules,
    blockingReasons: blockingReasons,
    warnings: warnings,
    differenceAmount: diff
  };
}

/**
 * Ensures the canonical Reconciliation_Register tab exists idempotently in the workbook.
 * Creates empty tab with headers if missing. Does NOT create fake data rows.
 */
function ensureReconciliationRegisterStore() {
  try {
    const db = getDB(true, "ensureReconciliationRegisterStore");
    let registerSheet = db.getSheetByName("Reconciliation_Register");
    if (!registerSheet) {
      if (typeof initializeSandboxSchema === "function") {
        initializeSandboxSchema();
      }
      registerSheet = db.getSheetByName("Reconciliation_Register");
    }
    return registerSheet;
  } catch (err) {
    return null;
  }
}

/**
 * Deterministically resolves effective reconciliation status across Reconciliation_Register and Transactions
 * Precedence:
 * 1. If Reconciliation_Register has a valid record for transactionId with non-empty status -> use register status
 * 2. Otherwise if Transactions.reconciliationStatus is non-empty -> use normalized Transactions status
 * 3. Otherwise if linked documents or receiptId present -> MATCHED
 * 4. Otherwise -> UNMATCHED
 */
function resolveEffectiveReconciliationStatus(persistedStatus, txStatus, hasLinkedDocs) {
  if (persistedStatus && String(persistedStatus).trim() !== "") {
    return normalizeReconciliationStatus(persistedStatus);
  }
  if (txStatus && String(txStatus).trim() !== "") {
    return normalizeReconciliationStatus(txStatus);
  }
  if (hasLinkedDocs) {
    return "MATCHED";
  }
  return "UNMATCHED";
}

/**
 * Resolves evidence display status considering receipt exemption policy
 */
function resolveEvidenceStatus(linkedDocsCount, receiptId, receiptStatus) {
  const totalCount = linkedDocsCount + (receiptId ? 1 : 0);
  if (totalCount > 0) {
    return totalCount > 1 ? "Evidence (" + totalCount + ")" : "Receipt Attached";
  }
  const normReceiptStatus = String(receiptStatus || "").toLowerCase();
  if (normReceiptStatus === "exempt") {
    return "Receipt Exempt";
  }
  return "No Evidence";
}

/**
 * Retrieves reconciliation records derived from master transactions and persisted Reconciliation_Register
 */
function getReconciliationRecords(p) {
  p = p || {};

  // Resolve period bounds from periodKey if not explicitly provided
  if (p.periodKey && (!p.startDate || !p.endDate)) {
    if (typeof getPeriodBounds === "function") {
      const bounds = getPeriodBounds(p.periodKey);
      p.startDate = bounds.startDate;
      p.endDate = bounds.endDate;
    }
  }

  // Safely ensure canonical Reconciliation_Register schema tab exists in workbook
  const registerSheet = ensureReconciliationRegisterStore();
  const db = getDB(false, "getReconciliationRecords");
  let persistedMap = {};

  if (registerSheet && registerSheet.getLastRow() > 1) {
    const rData = registerSheet.getDataRange().getValues();
    const rHeaders = rData.shift();

    rData.forEach(function(row) {
      const obj = {};
      rHeaders.forEach(function(h, i) { obj[h] = row[i]; });
      if (obj.transactionId) {
        persistedMap[obj.transactionId] = obj;
      }
    });
  }

  // Fetch Master Transactions (filtered by period bounds)
  const txRes = getTransactions(p);
  const allTxs = txRes.transactions || [];

  // Fetch Documents map for evidence counts
  const docRes = getDocuments(p);
  const docsByTx = {};
  (docRes.documents || []).forEach(function(d) {
    const txId = d.relatedTransactionId || d.relatedEntityId;
    if (txId) {
      if (!docsByTx[txId]) docsByTx[txId] = [];
      docsByTx[txId].push(d);
    }
  });

  // Combine and format reconciliation records
  let records = allTxs.map(function(t) {
    const txId = t.transactionId;
    const persisted = persistedMap[txId] || {};
    const linkedDocs = docsByTx[txId] || [];

    const hasLinkedDocs = (linkedDocs.length > 0 || Boolean(t.receiptId));
    const status = resolveEffectiveReconciliationStatus(persisted.reconciliationStatus, t.reconciliationStatus, hasLinkedDocs);

    const expected = Number(t.amount || 0);
    const reconciled = Number(persisted.reconciledAmount !== undefined && persisted.reconciledAmount !== "" ? persisted.reconciledAmount : (status === "RECONCILED" ? expected : expected));
    const diff = Number((expected - reconciled).toFixed(2));

    const evalResult = evaluateDeterministicReconciliationRules({
      amount: expected,
      expectedAmount: expected,
      reconciledAmount: reconciled,
      direction: t.direction,
      transactionType: t.transactionType,
      payeeOrPayer: t.payeeOrPayer,
      paymentMethod: t.paymentMethod,
      checkNumber: t.checkNumber,
      referenceNumber: t.checkNumber,
      receiptStatus: t.receiptStatus,
      receiptId: t.receiptId,
      accountingImpact: t.accountingImpact
    }, { documents: linkedDocs });

    let diffText = "$0.00";
    if (diff > 0.009) {
      diffText = "$" + diff.toFixed(2) + " Short";
    } else if (diff < -0.009) {
      diffText = "$" + Math.abs(diff).toFixed(2) + " Over";
    }

    const evStatus = resolveEvidenceStatus(linkedDocs.length, t.receiptId, t.receiptStatus);

    return {
      reconciliationId: persisted.reconciliationId || ("REC-" + txId),
      transactionId: txId,
      transactionDate: t.transactionDate,
      transactionType: t.transactionType,
      direction: t.direction,
      payeeOrPayer: t.payeeOrPayer,
      description: t.description,
      category: t.category,
      paymentMethod: t.paymentMethod,
      checkNumber: t.checkNumber || "",
      expectedAmount: expected,
      reconciledAmount: reconciled,
      differenceAmount: Math.abs(diff),
      differenceFormatted: diffText,
      reconciliationStatus: status,
      receiptStatus: t.receiptStatus || "",
      satisfiesRules: evalResult.satisfiesRules,
      blockingReasons: evalResult.blockingReasons,
      warnings: evalResult.warnings,
      evidenceCount: linkedDocs.length + (t.receiptId ? 1 : 0),
      evidenceStatus: evStatus,
      notes: persisted.notes || t.notes || "",
      reviewReason: persisted.reviewReason || (evalResult.blockingReasons.join("; ") || ""),
      reconciledBy: persisted.reconciledBy || t.updatedBy || "",
      reconciledAt: persisted.reconciledAt || ""
    };
  });

  // Filter by status if requested
  if (p.reconciliationStatus) {
    const targetStatus = normalizeReconciliationStatus(p.reconciliationStatus);
    records = records.filter(function(r) { return r.reconciliationStatus === targetStatus; });
  }

  // Calculate Summary KPI Totals
  let totalReconciled = 0;
  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalPartiallyMatched = 0;
  let totalNeedsReview = 0;
  let netDifference = 0;

  records.forEach(function(r) {
    if (r.reconciliationStatus === "RECONCILED") totalReconciled++;
    else if (r.reconciliationStatus === "MATCHED") totalMatched++;
    else if (r.reconciliationStatus === "PARTIALLY_MATCHED") totalPartiallyMatched++;
    else if (r.reconciliationStatus === "NEEDS_REVIEW") totalNeedsReview++;
    else totalUnmatched++;

    if (r.reconciliationStatus !== "RECONCILED") {
      netDifference += r.differenceAmount;
    }
  });

  netDifference = Number(netDifference.toFixed(2));

  return {
    success: true,
    count: records.length,
    periodKey: p.periodKey || (p.startDate ? p.startDate.substring(0, 7) : ""),
    summary: {
      totalRecords: records.length,
      reconciledCount: totalReconciled,
      matchedCount: totalMatched,
      unmatchedCount: totalUnmatched,
      partiallyMatchedCount: totalPartiallyMatched,
      needsReviewCount: totalNeedsReview,
      differenceAmount: netDifference,
      differenceFormatted: "$" + netDifference.toFixed(2) + " Difference"
    },
    records: records
  };
}

/**
 * Reconciles a single transaction record with strict deterministic rule enforcement.
 * Does NOT permit RECONCILED status if rules fail.
 */
function reconcileTransactionRecord(p, userEmail) {
  p = p || {};
  if (!p.transactionId) throw new Error("transactionId is required to reconcile");

  const targetStatus = normalizeReconciliationStatus(p.reconciliationStatus || "RECONCILED");

  const db = getDB(true, "reconcileTransactionRecord");
  const txSheet = db.getSheetByName("Transactions");
  if (!txSheet) throw new Error("Transactions tab missing");

  // Load target transaction
  const txData = txSheet.getDataRange().getValues();
  const txHeaders = txData.shift();
  const idCol = txHeaders.indexOf("transactionId");
  const dateCol = txHeaders.indexOf("transactionDate");
  const statusCol = txHeaders.indexOf("reconciliationStatus");
  const idx = txData.findIndex(function(r) { return r[idCol] === p.transactionId; });

  if (idx === -1) throw new Error("Transaction not found: " + p.transactionId);

  const matchedTx = txData[idx];
  const rawTxDate = matchedTx[dateCol];

  // Format date string safely whether rawTxDate is a JS Date object or string
  let dateStr = "";
  if (rawTxDate instanceof Date) {
    dateStr = Utilities.formatDate(rawTxDate, "GMT", "yyyy-MM-dd");
  } else if (typeof rawTxDate === "string") {
    dateStr = rawTxDate.trim().substring(0, 10);
  } else {
    dateStr = new Date().toISOString().substring(0, 10);
  }

  // Server-Side Period Lock Protection
  assertPeriodWritable(dateStr, "reconcileTransactionRecord", userEmail, db);

  // If attempting RECONCILED status, enforce deterministic rules
  if (targetStatus === "RECONCILED") {
    const txObj = {};
    txHeaders.forEach(function(h, i) { txObj[h] = matchedTx[i]; });
    const docsRes = getDocuments({ relatedTransactionId: p.transactionId });
    const evalResult = evaluateDeterministicReconciliationRules(txObj, { documents: docsRes.documents || [] });

    if (!evalResult.satisfiesRules) {
      throw new Error("Cannot mark RECONCILED for " + p.transactionId + ". Financial rules failed: " + evalResult.blockingReasons.join("; "));
    }
  }

  const nowIso = new Date().toISOString();
  const actor = userEmail || "System Admin";
  const rowNum = idx + 2;

  const year = parseInt(dateStr.substring(0, 4), 10) || new Date().getFullYear();
  const month = parseInt(dateStr.substring(5, 7), 10) || (new Date().getMonth() + 1);
  const expectedAmt = Number(matchedTx[txHeaders.indexOf("amount")] || 0);
  const reconciledAmt = Number(p.reconciledAmount !== undefined && p.reconciledAmount !== "" ? p.reconciledAmount : expectedAmt);
  const diffAmt = Number(Math.abs(expectedAmt - reconciledAmt).toFixed(2));
  const refNum = matchedTx[txHeaders.indexOf("referenceNumber")] || matchedTx[txHeaders.indexOf("checkNumber")] || "";
  const chkNum = matchedTx[txHeaders.indexOf("checkNumber")] || "";

  // STEP 1: Persist to Reconciliation_Register FIRST
  let registerSheet = db.getSheetByName("Reconciliation_Register");
  if (!registerSheet) {
    initializeSandboxSchema();
    registerSheet = db.getSheetByName("Reconciliation_Register");
  }

  const regData = registerSheet.getDataRange().getValues();
  const regHeaders = regData.shift();
  const regTxCol = regHeaders.indexOf("transactionId");
  const existingRegIdx = regData.findIndex(function(r) { return r[regTxCol] === p.transactionId; });

  const recId = existingRegIdx !== -1 ? regData[existingRegIdx][regHeaders.indexOf("reconciliationId")] : ("REC-" + Date.now());

  if (existingRegIdx !== -1) {
    const regRow = existingRegIdx + 2;
    const statCol = regHeaders.indexOf("reconciliationStatus") + 1;
    const recAmtCol = regHeaders.indexOf("reconciledAmount") + 1;
    const diffCol = regHeaders.indexOf("differenceAmount") + 1;
    const notesCol = regHeaders.indexOf("notes") + 1;
    const byCol = regHeaders.indexOf("reconciledBy") + 1;
    const atCol = regHeaders.indexOf("reconciledAt") + 1;
    const upCol = regHeaders.indexOf("updatedAt") + 1;

    if (statCol > 0) registerSheet.getRange(regRow, statCol).setValue(targetStatus);
    if (recAmtCol > 0) registerSheet.getRange(regRow, recAmtCol).setValue(reconciledAmt);
    if (diffCol > 0) registerSheet.getRange(regRow, diffCol).setValue(diffAmt);
    if (notesCol > 0 && p.notes) registerSheet.getRange(regRow, notesCol).setValue(p.notes);
    if (byCol > 0) registerSheet.getRange(regRow, byCol).setValue(actor);
    if (atCol > 0) registerSheet.getRange(regRow, atCol).setValue(nowIso);
    if (upCol > 0) registerSheet.getRange(regRow, upCol).setValue(nowIso);
  } else {
    registerSheet.appendRow([
      recId,
      year,
      month,
      p.transactionId,
      matchedTx[txHeaders.indexOf("transactionType")] || "",
      "Transaction",
      p.transactionId,
      expectedAmt,
      reconciledAmt,
      diffAmt,
      targetStatus,
      p.reconciliationMethod || "Manual Verification",
      refNum,
      "",
      chkNum,
      "",
      p.evidenceCount || 1,
      p.notes || "",
      p.reviewReason || "",
      actor,
      nowIso,
      actor,
      nowIso,
      nowIso
    ]);
  }

  // STEP 2: Update Master Transactions reconciliationStatus SECOND
  if (statusCol !== -1) {
    const txStatusValue = targetStatus === "RECONCILED" ? "Reconciled" : (targetStatus === "MATCHED" ? "Matched" : (targetStatus === "NEEDS_REVIEW" ? "Needs Review" : targetStatus));
    txSheet.getRange(rowNum, statusCol + 1).setValue(txStatusValue);
  }

  return {
    success: true,
    reconciliationId: recId,
    transactionId: p.transactionId,
    reconciliationStatus: targetStatus,
    reconciledBy: actor,
    reconciledAt: nowIso
  };
}

/**
 * Runs deterministic reconciliation across all open records in a period
 */
function autoReconcilePeriod(p, userEmail) {
  p = p || {};
  const periodKey = p.periodKey || getPeriodKey(new Date());

  const recRes = getReconciliationRecords({ periodKey: periodKey });
  const records = recRes.records || [];

  let reconciledCount = 0;
  let skippedCount = 0;
  const errors = [];

  records.forEach(function(r) {
    if (r.reconciliationStatus === "RECONCILED") return;

    if (r.satisfiesRules) {
      try {
        reconcileTransactionRecord({
          transactionId: r.transactionId,
          reconciliationStatus: "RECONCILED",
          reconciliationMethod: "Auto-Rule Engine"
        }, userEmail);
        reconciledCount++;
      } catch (err) {
        errors.push(r.transactionId + ": " + (err.message || String(err)));
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  });

  return {
    success: true,
    periodKey: periodKey,
    autoReconciledCount: reconciledCount,
    skippedCount: skippedCount,
    errors: errors
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeReconciliationStatus,
    evaluateDeterministicReconciliationRules,
    ensureReconciliationRegisterStore,
    resolveEffectiveReconciliationStatus,
    resolveEvidenceStatus,
    getReconciliationRecords,
    reconcileTransactionRecord,
    autoReconcilePeriod
  };
}
