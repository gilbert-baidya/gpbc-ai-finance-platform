/*************************************************
 * GPBC Finance Desk — Audit.gs
 * Deterministic Audit Rule Engine (12 Rules), Health Score, and Reconciliation
 *************************************************/

// In Node/test environment, load FinanceMath helpers
if (typeof require !== "undefined" && typeof calculatePurchaseBalance === "undefined") {
  const financeMath = require("./FinanceMath.gs");
  global.calculatePurchaseBalance = financeMath.calculatePurchaseBalance;
  global.getPeriodKey = financeMath.getPeriodKey;
  global.getPeriodBounds = financeMath.getPeriodBounds;
  global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  global.assertPeriodWritable = financeMath.assertPeriodWritable;
}

const AUDIT_SCORING_CONFIG = {
  baselineScore: 100,
  deductions: {
    CRITICAL: 15,
    HIGH: 8,
    MEDIUM: 3,
    LOW: 1,
    INFO: 0
  },
  caps: {
    CRITICAL: 45,
    HIGH: 32,
    MEDIUM: 15,
    LOW: 8
  },
  // All unresolved statuses that impact the Audit Health Score (includes 'Reviewed')
  unresolvedStatuses: [
    "Needs Receipt",
    "Needs Explanation",
    "Missing Documentation",
    "Pending Match",
    "Partial Reimbursement",
    "Possible Duplicate",
    "Discrepancy",
    "Reviewed"
  ],
  nonDeductingStatuses: [
    "Cleared",
    "Reconciled"
  ]
};

const ALLOWED_AUDIT_STATUSES = [
  "Needs Receipt",
  "Needs Explanation",
  "Missing Documentation",
  "Pending Match",
  "Partial Reimbursement",
  "Possible Duplicate",
  "Discrepancy",
  "Reviewed",
  "Cleared",
  "Reconciled"
];

const ALLOWED_RESOLUTION_STATUSES = [
  "Reviewed",
  "Cleared",
  "Reconciled"
];

function normalizeAuditTimestampValue(value) {
  if (!value) return "";
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString();
  return String(value);
}

/**
 * Records bounded, redacted access metadata without blocking the requested action.
 * The persistent audit tab is optional until the sandbox schema is initialized.
 */
function logAuditEvent(event) {
  try {
    const timestamp = new Date();
    const actor = event && event.actor ? String(event.actor).substring(0, 100) : "Anonymous";
    const action = event && event.action ? String(event.action).substring(0, 50) : "Unknown";
    const status = event && event.status ? String(event.status).substring(0, 20) : "INFO";
    const details = event && event.details
      ? String(event.details)
          .replace(/(idToken|token|password|secret|accountNumber)\s*[:=]\s*[^,;\s]+/gi, "$1=[REDACTED]")
          .substring(0, 200)
      : "";

    Logger.log("[AUDIT] " + timestamp.toISOString() + " | Actor: " + actor + " | Action: " + action + " | Status: " + status + (details ? " | " + details : ""));

    try {
      const db = getDB(true, "logAuditEvent");
      const auditSheet = db.getSheetByName("AUDIT_LOGS");
      if (auditSheet) {
        auditSheet.appendRow([timestamp, actor, action, status, details]);
      }
    } catch (sheetErr) {
      Logger.log("[AUDIT] Persistent audit storage unavailable");
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Audit logging error" };
  }
}

/**
 * Normalizes merchant / payee names deterministically without collapsing distinct entities
 */
function normalizeMerchantName(name) {
  if (!name) return "";
  let s = String(name).toLowerCase().trim();
  // Remove common banking prefixes like 'the ', 'sq *', 'tst* ', 'paypal *', 'amzn mktp '
  s = s.replace(/^(the\s+|sq\s*\*|tst\*\s*|paypal\s*\*|amzn\s*mktp\s*)/g, "");
  // Replace punctuation with spaces
  s = s.replace(/[^a-z0-9\s]/g, " ");
  // Remove trailing store / terminal numbers
  s = s.replace(/\b(store\s+)?\d+\b/g, "");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Pure Rule Engine: Evaluates all 12 deterministic audit rules against financial datasets
 */
function evaluateAuditRules(data) {
  data = data || {};
  const transactions = data.transactions || [];
  const reimbursements = data.reimbursements || [];
  const allocations = data.allocations || [];
  const receipts = data.receipts || [];
  const checkDetails = data.checkDetails || [];
  const fundSummaries = data.fundSummaries || [];

  const findings = [];

  // Map helpers
  const receiptMap = {};
  receipts.forEach(function(r) { if (r.receiptId) receiptMap[r.receiptId] = r; });

  const checkVoucherMap = {};
  checkDetails.forEach(function(c) {
    if (c.checkNumber) checkVoucherMap[String(c.checkNumber).trim()] = Boolean(c.driveUrl || c.driveFileId);
  });

  const allocationsByPurchase = {};
  allocations.forEach(function(a) {
    const pId = a.purchaseTransactionId;
    if (!allocationsByPurchase[pId]) allocationsByPurchase[pId] = [];
    allocationsByPurchase[pId].push(a);
  });

  const allocationsByRmb = {};
  allocations.forEach(function(a) {
    const rId = a.reimbursementId;
    if (!allocationsByRmb[rId]) allocationsByRmb[rId] = [];
    allocationsByRmb[rId].push(a);
  });

  // 1. Transaction-level rule evaluation
  transactions.forEach(function(t) {
    const amt = Number(t.amount || 0);
    const isExpense = (t.direction === "EXPENSE" && t.accountingImpact !== "SETTLEMENT" && t.transactionType !== "Reimbursement");

    // RULE-RCP-001: Missing Receipt for Expense
    if (isExpense && t.receiptStatus !== "Exempt") {
      const hasReceipt = Boolean(t.receiptId && t.receiptId.trim() !== "");
      if (!hasReceipt || t.receiptStatus === "Needs Receipt") {
        const severity = amt >= 50.00 ? "HIGH" : "MEDIUM";
        findings.push({
          ruleId: "RULE-RCP-001",
          severity: severity,
          status: "Needs Receipt",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Missing receipt for expense ($" + amt.toFixed(2) + ")",
          description: "Expense to " + (t.payeeOrPayer || "Vendor") + " of $" + amt.toFixed(2) + " does not have an attached receipt or invoice.",
          amount: amt,
          recommendedAction: "Upload receipt image or PDF to Receipt Register and link to transaction.",
          evidenceUrl: "",
          fingerprint: "RULE-RCP-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-EXP-001: Missing Purpose / Explanation
    if (isExpense) {
      const desc = String(t.description || "").trim().toLowerCase();
      if (!desc || desc === "expense" || desc === "n/a" || desc === "general") {
        findings.push({
          ruleId: "RULE-EXP-001",
          severity: "MEDIUM",
          status: "Needs Explanation",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Missing expense purpose/explanation",
          description: "Transaction " + t.transactionId + " lacks a clear ministry business purpose.",
          amount: amt,
          recommendedAction: "Edit transaction to provide specific ministry purpose or project context.",
          evidenceUrl: "",
          fingerprint: "RULE-EXP-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-PAY-001: Missing Payee / Vendor Name
    if (isExpense) {
      const payee = String(t.payeeOrPayer || "").trim().toLowerCase();
      if (!payee || payee === "unknown" || payee === "n/a" || payee === "vendor") {
        findings.push({
          ruleId: "RULE-PAY-001",
          severity: "MEDIUM",
          status: "Needs Explanation",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Missing payee/vendor name",
          description: "Transaction " + t.transactionId + " does not specify an identified vendor or payee.",
          amount: amt,
          recommendedAction: "Update transaction with the exact vendor, merchant, or individual payee.",
          evidenceUrl: "",
          fingerprint: "RULE-PAY-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-CHK-001: Missing Check Voucher / Check Documentation
    if (t.paymentMethod === "Check" && amt >= 50.00) {
      const chkNum = String(t.checkNumber || "").trim();
      const hasVoucher = chkNum ? Boolean(checkVoucherMap[chkNum]) : false;
      if (!chkNum || !hasVoucher) {
        findings.push({
          ruleId: "RULE-CHK-001",
          severity: "HIGH",
          status: "Missing Documentation",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Missing check documentation for check disbursement",
          description: "Check payment of $" + amt.toFixed(2) + " to " + (t.payeeOrPayer || "Payee") + (chkNum ? " (Check #" + chkNum + ")" : " (No Check #)") + " lacks a signed check voucher in Check Details.",
          amount: amt,
          recommendedAction: "Record check number and upload signed check voucher PDF/photo to Check Details.",
          evidenceUrl: "",
          fingerprint: "RULE-CHK-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-PRP-001: Personal Purchase Without Complete Reimbursement / Resolution
    // Uses shared canonical balance formula (including refund credit adjustments)
    if (t.personalPurchase === true) {
      const pAllocations = allocationsByPurchase[t.transactionId] || [];
      const balance = calculatePurchaseBalance(amt, pAllocations);

      if (balance.remainingBalance > 0.01) {
        findings.push({
          ruleId: "RULE-PRP-001",
          severity: "HIGH",
          status: balance.totalAllocated > 0 ? "Partial Reimbursement" : "Pending Match",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Personal-card purchase pending reimbursement ($" + balance.remainingBalance.toFixed(2) + " remaining)",
          description: "Personal card church purchase of $" + amt.toFixed(2) + " by " + (t.claimantName || t.payeeOrPayer || "Claimant") + " has $" + balance.remainingBalance.toFixed(2) + " unallocated/unreimbursed balance.",
          amount: balance.remainingBalance,
          recommendedAction: "Process reimbursement payout or record personally absorbed donation allocation.",
          evidenceUrl: "",
          fingerprint: "RULE-PRP-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-CAT-001: Uncategorized Transaction
    const cat = String(t.category || "").trim().toLowerCase();
    if (!cat || cat === "uncategorized") {
      findings.push({
        ruleId: "RULE-CAT-001",
        severity: "LOW",
        status: "Needs Explanation",
        entityType: "Transaction",
        entityId: t.transactionId,
        title: "Uncategorized transaction",
        description: "Transaction " + t.transactionId + " is unassigned to a ministry budget category.",
        amount: amt,
        recommendedAction: "Assign an appropriate ministry category to this transaction.",
        evidenceUrl: "",
        fingerprint: "RULE-CAT-001_Transaction_" + t.transactionId
      });
    }

    // RULE-REF-001: Unlinked Merchant Refund / Card Credit
    if (t.transactionType === "Refund" || t.transactionType === "Card Credit") {
      const notes = String(t.notes || "");
      const hasLink = Boolean(notes.match(/\btxn-[a-z0-9_-]+/i) || notes.match(/\balc-[a-z0-9_-]+/i) || notes.match(/\blinked\s+to\b/i));
      if (!hasLink) {
        findings.push({
          ruleId: "RULE-REF-001",
          severity: "MEDIUM",
          status: "Needs Explanation",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Unlinked merchant refund / card credit",
          description: "Credit of $" + amt.toFixed(2) + " is not traceably linked to the original purchase transaction.",
          amount: amt,
          recommendedAction: "Link refund to original expense transaction or record allocation offset.",
          evidenceUrl: "",
          fingerprint: "RULE-REF-001_Transaction_" + t.transactionId
        });
      }
    }

    // RULE-DIS-001: Receipt vs Transaction Discrepancy
    if (t.receiptId && receiptMap[t.receiptId]) {
      const r = receiptMap[t.receiptId];
      const rAmt = Number(r.amount || 0);
      if (Math.abs(amt - rAmt) >= 0.01) {
        findings.push({
          ruleId: "RULE-DIS-001",
          severity: "HIGH",
          status: "Discrepancy",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Receipt amount discrepancy ($" + amt.toFixed(2) + " vs $" + rAmt.toFixed(2) + ")",
          description: "Transaction amount ($" + amt.toFixed(2) + ") differs from linked receipt (" + r.receiptId + " - $" + rAmt.toFixed(2) + ").",
          amount: Math.abs(amt - rAmt),
          recommendedAction: "Review receipt for split purchases, sales tax, or non-reimbursed personal items.",
          evidenceUrl: r.driveUrl || "",
          fingerprint: "RULE-DIS-001_Transaction_" + t.transactionId + "_" + t.receiptId
        });
      }
    }
  });

  // 2. Duplicate Transaction Candidate Detection (RULE-DUP-001)
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const t1 = transactions[i];
      const t2 = transactions[j];
      if (
        t1.direction === t2.direction &&
        t1.amount > 0 &&
        t1.amount === t2.amount &&
        String(t1.payeeOrPayer || "").trim().toLowerCase() === String(t2.payeeOrPayer || "").trim().toLowerCase() &&
        String(t1.payeeOrPayer || "").trim() !== ""
      ) {
        const d1 = new Date(t1.transactionDate || t1.date).getTime();
        const d2 = new Date(t2.transactionDate || t2.date).getTime();
        if (!isNaN(d1) && !isNaN(d2)) {
          const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          if (diffDays <= 3) {
            const pairKey = [t1.transactionId, t2.transactionId].sort().join("_");
            findings.push({
              ruleId: "RULE-DUP-001",
              severity: "MEDIUM",
              status: "Possible Duplicate",
              entityType: "Transaction",
              entityId: t1.transactionId,
              title: "Possible duplicate transaction ($" + Number(t1.amount).toFixed(2) + " to " + t1.payeeOrPayer + ")",
              description: "Transaction " + t1.transactionId + " and " + t2.transactionId + " have identical amounts and payees within " + Math.round(diffDays) + " days.",
              amount: Number(t1.amount),
              recommendedAction: "Review transactions to verify if this is an accidental duplicate entry or distinct valid payment.",
              evidenceUrl: "",
              fingerprint: "RULE-DUP-001_Transaction_" + pairKey
            });
          }
        }
      }
    }
  }

  // 3. Reimbursement-level evaluations (RULE-RMB-001 & RULE-RMB-002)
  reimbursements.forEach(function(r) {
    const rAmt = Number(r.totalReimbursedAmount || 0);
    const rAllocs = allocationsByRmb[r.reimbursementId] || [];
    const totalAllocated = rAllocs.reduce(function(sum, a) { return sum + Number(a.allocatedAmount || 0); }, 0);
    const diff = Number(Math.abs(rAmt - totalAllocated).toFixed(2));

    if (rAmt > 0 && (rAllocs.length === 0 || diff > 0.01)) {
      const isOverAllocated = (totalAllocated > rAmt);
      findings.push({
        ruleId: "RULE-RMB-001",
        severity: isOverAllocated ? "CRITICAL" : "HIGH",
        status: isOverAllocated ? "Discrepancy" : "Pending Match",
        entityType: "Reimbursement",
        entityId: r.reimbursementId,
        title: isOverAllocated
          ? "Reimbursement payout over-allocated ($" + totalAllocated.toFixed(2) + " allocated exceeds $" + rAmt.toFixed(2) + " payout)"
          : "Reimbursement payout under-supported ($" + totalAllocated.toFixed(2) + " allocated of $" + rAmt.toFixed(2) + " payout)",
        description: isOverAllocated
          ? "Reimbursement " + r.reimbursementId + " has $" + totalAllocated.toFixed(2) + " in allocated purchases, exceeding the $" + rAmt.toFixed(2) + " cash payout by $" + diff.toFixed(2) + "."
          : "Reimbursement " + r.reimbursementId + " for $" + rAmt.toFixed(2) + " to " + (r.claimantName || "Claimant") + " lacks supporting purchase allocations for $" + diff.toFixed(2) + " of payout.",
        amount: diff,
        recommendedAction: isOverAllocated
          ? "Reduce allocation amounts or adjust reimbursement payout to match purchase support."
          : "Link reimbursement to underlying personal-card expense transactions.",
        evidenceUrl: "",
        fingerprint: "RULE-RMB-001_Reimbursement_" + r.reimbursementId
      });
    }
  });

  // Defensive check for Over-Allocations on Purchases (RULE-RMB-002)
  // Uses shared canonical balance formula (including refund credit adjustments)
  Object.keys(allocationsByPurchase).forEach(function(pId) {
    const pAllocs = allocationsByPurchase[pId];
    const matchedTx = transactions.find(function(t) { return t.transactionId === pId; });
    if (matchedTx) {
      const pCost = Number(matchedTx.amount || 0);
      const balance = calculatePurchaseBalance(pCost, pAllocs);

      if (balance.isOverAllocated) {
        findings.push({
          ruleId: "RULE-RMB-002",
          severity: "CRITICAL",
          status: "Discrepancy",
          entityType: "Transaction",
          entityId: pId,
          title: "Over-allocated purchase transaction ($" + balance.netCovered.toFixed(2) + " allocated on $" + pCost.toFixed(2) + " purchase)",
          description: "Purchase " + pId + " has allocations totaling $" + balance.netCovered.toFixed(2) + ", which exceeds the purchase cost of $" + pCost.toFixed(2) + ".",
          amount: balance.overageAmount,
          recommendedAction: "Correct allocation amounts in Reimbursements or record explicit refund adjustment.",
          evidenceUrl: "",
          fingerprint: "RULE-RMB-002_Transaction_" + pId
        });
      }
    }
  });

  // 4. Designated Fund Discrepancy (RULE-FND-001)
  fundSummaries.forEach(function(f) {
    if (f.fundId && f.fundId !== "General" && Number(f.netBalance || 0) < 0) {
      const deficit = Math.abs(Number(f.netBalance));
      findings.push({
        ruleId: "RULE-FND-001",
        severity: "CRITICAL",
        status: "Discrepancy",
        entityType: "Fund",
        entityId: f.fundId,
        title: "Designated fund deficit (" + f.fundId + ": -$" + deficit.toFixed(2) + ")",
        description: "Restricted designated fund '" + f.fundId + "' has a negative balance of -$" + deficit.toFixed(2) + ".",
        amount: deficit,
        recommendedAction: "Review designated fund expense classifications, authorizations, and funding sources.",
        evidenceUrl: "",
        fingerprint: "RULE-FND-001_Fund_" + f.fundId
      });
    }
  });

  return findings;
}

/**
 * Calculates deterministic explainable Audit Health Score
 * Rule: 'Reviewed' issues remain score-impacting until underlying condition is Cleared
 */
function calculateAuditHealthScore(issues) {
  issues = issues || [];
  const cfg = AUDIT_SCORING_CONFIG;

  const unresolved = issues.filter(function(issue) {
    return cfg.unresolvedStatuses.indexOf(issue.status) !== -1;
  });

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  unresolved.forEach(function(i) {
    if (i.severity === "CRITICAL") criticalCount++;
    else if (i.severity === "HIGH") highCount++;
    else if (i.severity === "MEDIUM") mediumCount++;
    else if (i.severity === "LOW") lowCount++;
  });

  const rawCritDeduction = criticalCount * cfg.deductions.CRITICAL;
  const rawHighDeduction = highCount * cfg.deductions.HIGH;
  const rawMedDeduction = mediumCount * cfg.deductions.MEDIUM;
  const rawLowDeduction = lowCount * cfg.deductions.LOW;

  const critDeduction = Math.min(cfg.caps.CRITICAL, rawCritDeduction);
  const highDeduction = Math.min(cfg.caps.HIGH, rawHighDeduction);
  const medDeduction = Math.min(cfg.caps.MEDIUM, rawMedDeduction);
  const lowDeduction = Math.min(cfg.caps.LOW, rawLowDeduction);

  const totalDeductions = critDeduction + highDeduction + medDeduction + lowDeduction;
  const score = Math.max(0, Math.min(100, cfg.baselineScore - totalDeductions));

  const topReasons = [];
  if (critDeduction > 0) topReasons.push(criticalCount + " critical compliance discrepancies (-" + critDeduction + " pts)");
  if (highDeduction > 0) topReasons.push(highCount + " high-priority documentation / missing receipt items (-" + highDeduction + " pts)");
  if (medDeduction > 0) topReasons.push(mediumCount + " medium-priority items needing explanation / review (-" + medDeduction + " pts)");
  if (lowDeduction > 0) topReasons.push(lowCount + " minor categorization items (-" + lowDeduction + " pts)");

  let scoreTier = "Critical Attention Needed";
  if (score >= 90) scoreTier = "Excellent / Audit Ready";
  else if (score >= 75) scoreTier = "Good / Action Recommended";
  else if (score >= 60) scoreTier = "Fair / Review Required";

  return {
    score: score,
    scoreTier: scoreTier,
    totalUnresolvedIssues: unresolved.length,
    criticalCount: criticalCount,
    highCount: highCount,
    mediumCount: mediumCount,
    lowCount: lowCount,
    deductions: {
      criticalDeduction: critDeduction,
      highDeduction: highDeduction,
      mediumDeduction: medDeduction,
      lowDeduction: lowDeduction,
      totalDeduction: totalDeductions
    },
    topReasons: topReasons,
    lastCalculatedAt: new Date().toISOString()
  };
}

/**
 * Runs the full deterministic audit suite, persists findings idempotently, auto-reopens recurring issues, and updates health score
 */
function runAudit(p, userEmail) {
  const db = getDB(true, "runAudit");
  let auditSheet = db.getSheetByName("Audit_Issues");
  if (!auditSheet) {
    initializeSandboxSchema();
    auditSheet = db.getSheetByName("Audit_Issues");
  }

  // 1. Gather live datasets
  const txRes = getTransactions();
  const rmbRes = getReimbursements();
  const rcpRes = getReceipts();
  const chkRes = getCheckDetails();
  const fndRes = getDesignatedFundsSummary();

  const transactions = txRes.transactions || [];
  const reimbursements = rmbRes.reimbursements || [];
  const receipts = rcpRes.receipts || [];
  const checkDetails = chkRes.checks || [];
  const fundSummaries = fndRes.funds || [];

  let allocations = [];
  const alcSheet = db.getSheetByName("Reimbursement_Allocations");
  if (alcSheet && alcSheet.getLastRow() > 1) {
    const aData = alcSheet.getDataRange().getValues();
    const aHeaders = aData.shift();
    allocations = aData.map(function(row) {
      const obj = {};
      aHeaders.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
  }

  // 2. Evaluate all 12 rules
  const currentFindings = evaluateAuditRules({
    transactions: transactions,
    reimbursements: reimbursements,
    allocations: allocations,
    receipts: receipts,
    checkDetails: checkDetails,
    fundSummaries: fundSummaries
  });

  // 3. Load existing Audit_Issues for idempotent lifecycle management
  const existingIssues = [];
  const existingByFingerprint = {};

  if (auditSheet.getLastRow() > 1) {
    const data = auditSheet.getDataRange().getValues();
    const headers = data.shift();
    data.forEach(function(row, idx) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj._rowIndex = idx + 2;
      existingIssues.push(obj);
      if (obj.issueFingerprint) {
        existingByFingerprint[obj.issueFingerprint] = obj;
      }
    });
  }

  const nowIso = new Date().toISOString();
  const currentFingerprints = {};

  // 4. Update, reopen, or insert current findings
  currentFindings.forEach(function(f) {
    currentFingerprints[f.fingerprint] = true;
    const existing = existingByFingerprint[f.fingerprint];

    if (existing) {
      const rowNum = existing._rowIndex;
      const headers = auditSheet.getRange(1, 1, 1, auditSheet.getLastColumn()).getValues()[0];
      const lastDetCol = headers.indexOf("lastDetectedAt") + 1;
      const amtCol = headers.indexOf("amount") + 1;
      const statusCol = headers.indexOf("status") + 1;
      const notesCol = headers.indexOf("resolutionNotes") + 1;
      const resByCol = headers.indexOf("resolvedBy") + 1;
      const resAtCol = headers.indexOf("resolvedAt") + 1;

      if (lastDetCol > 0) auditSheet.getRange(rowNum, lastDetCol).setValue(nowIso);
      if (amtCol > 0 && f.amount !== undefined) auditSheet.getRange(rowNum, amtCol).setValue(f.amount);

      // AUTOMATIC REOPENING: If condition recurring for a Cleared / Reconciled issue, reopen it!
      if (existing.status === "Cleared" || existing.status === "Reconciled") {
        if (statusCol > 0) auditSheet.getRange(rowNum, statusCol).setValue(f.status);
        if (notesCol > 0) {
          const prevNote = String(existing.resolutionNotes || "");
          const reopenedNote = prevNote ? prevNote + " | [Reopened: defect recurred " + nowIso + "]" : "[Reopened: defect recurred " + nowIso + "]";
          auditSheet.getRange(rowNum, notesCol).setValue(reopenedNote);
        }
        if (resByCol > 0) auditSheet.getRange(rowNum, resByCol).setValue("");
        if (resAtCol > 0) auditSheet.getRange(rowNum, resAtCol).setValue("");
      }
    } else {
      // Insert new audit issue
      const issueId = "AUD-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
      auditSheet.appendRow([
        issueId,
        f.fingerprint,
        f.ruleId,
        f.severity,
        f.status,
        f.entityType,
        f.entityId,
        f.title,
        f.description,
        f.amount || 0,
        f.recommendedAction,
        nowIso,
        nowIso,
        "System Engine",
        "",
        "",
        "",
        "",
        f.evidenceUrl || ""
      ]);
    }
  });

  // 5. Auto-clear findings whose conditions resolved in the ledger
  existingIssues.forEach(function(existing) {
    if (!currentFingerprints[existing.issueFingerprint]) {
      const isUnresolved = AUDIT_SCORING_CONFIG.unresolvedStatuses.indexOf(existing.status) !== -1;
      if (isUnresolved) {
        const rowNum = existing._rowIndex;
        const headers = auditSheet.getRange(1, 1, 1, auditSheet.getLastColumn()).getValues()[0];
        const statusCol = headers.indexOf("status") + 1;
        const resByCol = headers.indexOf("resolvedBy") + 1;
        const resAtCol = headers.indexOf("resolvedAt") + 1;
        const notesCol = headers.indexOf("resolutionNotes") + 1;

        if (statusCol > 0) auditSheet.getRange(rowNum, statusCol).setValue("Cleared");
        if (resByCol > 0) auditSheet.getRange(rowNum, resByCol).setValue("System Engine");
        if (resAtCol > 0) auditSheet.getRange(rowNum, resAtCol).setValue(nowIso);
        if (notesCol > 0 && !existing.resolutionNotes) {
          auditSheet.getRange(rowNum, notesCol).setValue("Auto-cleared: condition resolved in financial ledger.");
        }
      }
    }
  });

  // 6. Reload fresh issues and compute Health Score
  const freshIssues = getAuditIssues().issues || [];
  const healthScore = calculateAuditHealthScore(freshIssues);

  logAuditEvent({
    actor: userEmail,
    action: "runAudit",
    status: "COMPLETED",
    details: "Audit engine completed successfully"
  });

  return {
    success: true,
    detectedCount: currentFindings.length,
    healthScore: healthScore,
    issues: freshIssues
  };
}

/**
 * Resolves the authoritative accounting periodKey (YYYY-MM) for an audit issue
 * based on its underlying financial entity, NOT detectedAt timestamp.
 */
function resolveIssuePeriodKey(issue, entityDateMap) {
  if (!issue) return "GLOBAL";

  // 1. Explicit periodKey on issue
  if (issue.periodKey && /^\d{4}-\d{2}$/.test(issue.periodKey)) {
    return issue.periodKey;
  }

  const entityId = String(issue.entityId || "").trim();

  // 2. Check entityDateMap lookup if provided
  if (entityId && entityDateMap && entityDateMap[entityId]) {
    return entityDateMap[entityId];
  }

  // 3. Deterministic regex pattern matching on entityId
  if (entityId) {
    // Standard ISO/compact date pattern e.g. TXN-20260902-17336 -> 2026-09
    const ymdMatch = entityId.match(/20\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
    if (ymdMatch) {
      const ym = ymdMatch[0];
      return ym.substring(0, 4) + "-" + ym.substring(4, 6);
    }

    // Standard hyphenated period pattern e.g. 2026-08
    const ymMatch = entityId.match(/(20\d{2})-(0[1-9]|1[0-2])/);
    if (ymMatch) {
      return ymMatch[1] + "-" + ymMatch[2];
    }

    // Legacy month abbreviation pattern e.g. TXN-LEGACY-2026-JUL-AUG -> 2026-07 / 2026-08
    const monthNames = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
    const legacyMatch = entityId.match(/(20\d{2})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
    if (legacyMatch) {
      const yr = legacyMatch[1];
      const mStr = legacyMatch[2].toUpperCase();
      if (monthNames[mStr]) return yr + "-" + monthNames[mStr];
    }
  }

  return "GLOBAL";
}

/**
 * Retrieves persisted audit issues with multi-criteria filters
 */
function getAuditIssues(p) {
  p = p || {};
  const db = getDB(false, "getAuditIssues");
  const sheet = db.getSheetByName("Audit_Issues");
  let issues = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    issues = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.detectedAt = normalizeAuditTimestampValue(obj.detectedAt);
      obj.lastDetectedAt = normalizeAuditTimestampValue(obj.lastDetectedAt);
      obj.amount = Number(obj.amount || 0);
      return obj;
    });
  }

  // Filter by periodKey using entity period resolution
  if (p.periodKey) {
    let entityDateMap = {};
    try {
      const txRes = typeof getTransactions !== "undefined" ? getTransactions() : { transactions: [] };
      (txRes.transactions || []).forEach(function(t) {
        if (t.transactionId && t.transactionDate) {
          const d = typeof t.transactionDate === "string" ? t.transactionDate : (t.transactionDate instanceof Date ? t.transactionDate.toISOString().substring(0, 10) : String(t.transactionDate));
          if (d && d.length >= 7) {
            entityDateMap[t.transactionId] = d.substring(0, 7);
          }
        }
      });

      const rmbRes = typeof getReimbursements !== "undefined" ? getReimbursements() : { reimbursements: [] };
      (rmbRes.reimbursements || []).forEach(function(r) {
        const rId = r.reimbursementId || r.id;
        const rDate = r.reimbursementDate || r.date;
        if (rId && rDate) {
          const d = typeof rDate === "string" ? rDate : (rDate instanceof Date ? rDate.toISOString().substring(0, 10) : String(rDate));
          if (d && d.length >= 7) {
            entityDateMap[rId] = d.substring(0, 7);
          }
        }
      });

      const chkRes = typeof getCheckDetails !== "undefined" ? getCheckDetails() : { checks: [] };
      (chkRes.checks || []).forEach(function(c) {
        const cId = c.checkId || c.id;
        const cDate = c.checkDate || c.date;
        if (cId && cDate) {
          const d = typeof cDate === "string" ? cDate : (cDate instanceof Date ? cDate.toISOString().substring(0, 10) : String(cDate));
          if (d && d.length >= 7) {
            entityDateMap[cId] = d.substring(0, 7);
          }
        }
      });
    } catch (e) {
      Logger.log("Error building entityDateMap for audit issues: " + e.message);
    }

    issues.forEach(function(i) {
      i.resolvedPeriodKey = resolveIssuePeriodKey(i, entityDateMap);
    });

    issues = issues.filter(function(i) {
      return i.resolvedPeriodKey === p.periodKey;
    });
  }

  if (p.severity) {
    issues = issues.filter(function(i) { return i.severity === p.severity; });
  }
  if (p.status) {
    issues = issues.filter(function(i) { return i.status === p.status; });
  }
  if (p.ruleId) {
    issues = issues.filter(function(i) { return i.ruleId === p.ruleId; });
  }
  if (p.search) {
    const q = String(p.search).toLowerCase();
    issues = issues.filter(function(i) {
      return (i.title && i.title.toLowerCase().includes(q)) ||
             (i.description && i.description.toLowerCase().includes(q)) ||
             (i.entityId && i.entityId.toLowerCase().includes(q)) ||
             (i.ruleId && i.ruleId.toLowerCase().includes(q));
    });
  }

  // Sort descending by severity / date
  const sevOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
  issues.sort(function(a, b) {
    const sDiff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
    if (sDiff !== 0) return sDiff;
    return (b.detectedAt || "").localeCompare(a.detectedAt || "");
  });

  return { success: true, count: issues.length, issues: issues };
}

/**
 * Returns the Audit Health Score summary
 */
function getAuditSummary() {
  const completedAt = getLastCompletedAuditRun();
  if (!completedAt) {
    return {
      success: true,
      calculated: false,
      calculatedAt: null,
      healthScore: null
    };
  }

  const issuesRes = getAuditIssues();
  const issues = issuesRes.issues || [];
  const healthScore = calculateAuditHealthScore(issues);

  return {
    success: true,
    calculated: true,
    calculatedAt: completedAt,
    healthScore: healthScore
  };
}

function getLastCompletedAuditRun() {
  const db = getDB(false, "getAuditSummary");
  const sheet = db.getSheetByName("AUDIT_LOGS");
  if (!sheet || sheet.getLastRow() <= 1) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const timestampIndex = headers.indexOf("Timestamp");
  const actionIndex = headers.indexOf("Action");
  const statusIndex = headers.indexOf("Status");

  for (let index = data.length - 1; index >= 0; index -= 1) {
    const row = data[index];
    if (row[actionIndex] === "runAudit" && row[statusIndex] === "COMPLETED") {
      const timestamp = new Date(row[timestampIndex]);
      return isNaN(timestamp.getTime()) ? String(row[timestampIndex] || "") : timestamp.toISOString();
    }
  }

  return null;
}

/**
 * Resolves or updates an audit issue with strict allowed-status validation
 */
function resolveAuditIssue(p, userEmail) {
  p = p || {};
  if (!p.auditIssueId) throw new Error("auditIssueId is required");
  if (!p.status || ALLOWED_RESOLUTION_STATUSES.indexOf(p.status) === -1) {
    throw new Error("Invalid resolution status: " + p.status + ". Allowed statuses: " + ALLOWED_RESOLUTION_STATUSES.join(", "));
  }
  if (!p.resolutionNotes || String(p.resolutionNotes).trim() === "") {
    throw new Error("resolutionNotes are required to resolve an audit issue");
  }

  const db = getDB(true, "resolveAuditIssue");
  const sheet = db.getSheetByName("Audit_Issues");
  if (!sheet || sheet.getLastRow() <= 1) throw new Error("Audit_Issues tab missing or empty");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("auditIssueId");
  const idx = data.findIndex(function(r) { return r[idCol] === p.auditIssueId; });

  if (idx === -1) throw new Error("Audit issue not found: " + p.auditIssueId);

  const rowNum = idx + 2;
  const statusCol = headers.indexOf("status") + 1;
  const notesCol = headers.indexOf("resolutionNotes") + 1;
  const resByCol = headers.indexOf("resolvedBy") + 1;
  const resAtCol = headers.indexOf("resolvedAt") + 1;
  const evCol = headers.indexOf("evidenceUrl") + 1;

  const nowIso = new Date().toISOString();
  const actor = userEmail || "Finance Team";

  if (statusCol > 0) sheet.getRange(rowNum, statusCol).setValue(p.status);
  if (notesCol > 0 && p.resolutionNotes) sheet.getRange(rowNum, notesCol).setValue(p.resolutionNotes);
  if (resByCol > 0) sheet.getRange(rowNum, resByCol).setValue(actor);
  if (resAtCol > 0) sheet.getRange(rowNum, resAtCol).setValue(nowIso);
  if (evCol > 0 && p.evidenceUrl) sheet.getRange(rowNum, evCol).setValue(p.evidenceUrl);

  return { success: true, auditIssueId: p.auditIssueId, status: p.status };
}

/**
 * Reopens an audit issue back to active status
 */
function reopenAuditIssue(p, userEmail) {
  p = p || {};
  if (!p.auditIssueId) throw new Error("auditIssueId is required");

  const db = getDB(true, "reopenAuditIssue");
  const sheet = db.getSheetByName("Audit_Issues");
  if (!sheet) throw new Error("Audit_Issues tab missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("auditIssueId");
  const idx = data.findIndex(function(r) { return r[idCol] === p.auditIssueId; });

  if (idx === -1) throw new Error("Audit issue not found: " + p.auditIssueId);

  const rowNum = idx + 2;
  const statusCol = headers.indexOf("status") + 1;
  const notesCol = headers.indexOf("resolutionNotes") + 1;
  const resByCol = headers.indexOf("resolvedBy") + 1;
  const resAtCol = headers.indexOf("resolvedAt") + 1;

  if (statusCol > 0) sheet.getRange(rowNum, statusCol).setValue(p.targetStatus || "Needs Explanation");
  if (notesCol > 0 && p.reopenReason) sheet.getRange(rowNum, notesCol).setValue("[Reopened] " + p.reopenReason);
  if (resByCol > 0) sheet.getRange(rowNum, resByCol).setValue("");
  if (resAtCol > 0) sheet.getRange(rowNum, resAtCol).setValue("");

  return { success: true, auditIssueId: p.auditIssueId, status: p.targetStatus || "Needs Explanation" };
}

/**
 * Assigns an audit issue to a team member
 */
function assignAuditIssue(p, userEmail) {
  p = p || {};
  if (!p.auditIssueId) throw new Error("auditIssueId is required");
  if (!p.assignedTo) throw new Error("assignedTo is required");

  const db = getDB(true, "assignAuditIssue");
  const sheet = db.getSheetByName("Audit_Issues");
  if (!sheet) throw new Error("Audit_Issues tab missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("auditIssueId");
  const idx = data.findIndex(function(r) { return r[idCol] === p.auditIssueId; });

  if (idx === -1) throw new Error("Audit issue not found: " + p.auditIssueId);

  const rowNum = idx + 2;
  const assignCol = headers.indexOf("assignedTo") + 1;
  if (assignCol > 0) sheet.getRange(rowNum, assignCol).setValue(p.assignedTo);

  return { success: true, auditIssueId: p.auditIssueId, assignedTo: p.assignedTo };
}

/**
 * Stages normalized CSV statement lines into Reconciliation_Staging tab with strict server-side validation & duplicate protection
 */
function stageBankStatementLines(p, userEmail) {
  p = p || {};
  const lines = Array.isArray(p.statementLines) ? p.statementLines : [];
  if (lines.length === 0) throw new Error("No statement lines provided for staging");

  const db = getDB(true, "stageBankStatementLines");
  let sheet = db.getSheetByName("Reconciliation_Staging");
  if (!sheet) {
    initializeSandboxSchema();
    sheet = db.getSheetByName("Reconciliation_Staging");
  }

  // Load existing statement line fingerprints to prevent duplicate imports
  const existingFingerprints = {};
  if (sheet.getLastRow() > 1) {
    const sData = sheet.getDataRange().getValues();
    const sHeaders = sData.shift();
    const dateCol = sHeaders.indexOf("statementDate");
    const descCol = sHeaders.indexOf("description");
    const amtCol = sHeaders.indexOf("amount");
    const dirCol = sHeaders.indexOf("direction");
    const refCol = sHeaders.indexOf("referenceNumber");
    const fileCol = sHeaders.indexOf("sourceFileName");

    sData.forEach(function(row) {
      const fp = [
        String(row[fileCol] || "").trim(),
        String(row[dateCol] || "").trim(),
        normalizeMerchantName(row[descCol]),
        Number(row[amtCol] || 0).toFixed(2),
        String(row[dirCol] || "").trim(),
        String(row[refCol] || "").trim()
      ].join("_");
      existingFingerprints[fp] = true;
    });
  }

  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";
  const sourceFile = p.sourceFileName || "statement_import.csv";

  let insertedCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;

  lines.forEach(function(line) {
    const amt = Number(line.amount || 0);
    const stmtDate = String(line.statementDate || line.date || "").trim();
    const desc = String(line.description || "").trim();
    const direction = String(line.direction || "").trim().toUpperCase();
    const refNum = String(line.referenceNumber || "").trim();

    // Strict Server-Side Validation: Reject malformed records
    const isDateValid = Boolean(stmtDate && !isNaN(new Date(stmtDate).getTime()));
    const isAmountValid = (!isNaN(amt) && isFinite(amt) && amt !== 0);
    const isDescValid = Boolean(desc.length > 0);
    const isDirectionValid = (direction === "INCOME" || direction === "EXPENSE");

    if (!isDateValid || !isAmountValid || !isDescValid || !isDirectionValid) {
      rejectedCount++;
      return;
    }

    const fp = [
      sourceFile.trim(),
      stmtDate,
      normalizeMerchantName(desc),
      amt.toFixed(2),
      direction,
      refNum
    ].join("_");

    if (existingFingerprints[fp]) {
      duplicateCount++;
      return;
    }
    existingFingerprints[fp] = true;

    const lineId = "STMT-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
    sheet.appendRow([
      lineId,
      stmtDate,
      desc,
      amt,
      direction,
      line.statementType || "Bank Checking",
      refNum,
      "Unmatched",
      "",
      0,
      sourceFile,
      nowIso,
      actor
    ]);
    insertedCount++;
  });

  return {
    success: true,
    count: insertedCount,
    insertedCount: insertedCount,
    duplicateCount: duplicateCount,
    rejectedCount: rejectedCount,
    totalSubmitted: lines.length
  };
}

/**
 * Returns reconciliation candidate matches between staged statement lines and Transactions
 * Enforces: Direction compatibility, deterministic ranking, merchant normalization, already-reconciled exclusion
 */
function getReconciliationCandidates() {
  const db = getDB(false, "getReconciliationCandidates");
  const stmtSheet = db.getSheetByName("Reconciliation_Staging");
  const txSheet = db.getSheetByName("Transactions");

  if (!stmtSheet || stmtSheet.getLastRow() <= 1) {
    return { success: true, count: 0, candidates: [] };
  }

  const stmtData = stmtSheet.getDataRange().getValues();
  const stmtHeaders = stmtData.shift();
  const stagedLines = stmtData.map(function(r) {
    const obj = {};
    stmtHeaders.forEach(function(h, i) { obj[h] = r[i]; });
    obj.amount = Number(obj.amount || 0);
    return obj;
  });

  const txRes = getTransactions();
  const allTransactions = txRes.transactions || [];

  // Index already matched transaction IDs to exclude accidental multiple reuse
  const matchedTxIdMap = {};
  stagedLines.forEach(function(s) {
    if (s.matchedTransactionId && s.matchedTransactionId.trim() !== "") {
      matchedTxIdMap[s.matchedTransactionId] = true;
    }
  });

  const candidates = [];

  stagedLines.forEach(function(stmt) {
    // Authoritative statement direction
    const sDirection = stmt.direction || (stmt.amount < 0 ? "EXPENSE" : "INCOME");
    const sAmt = Math.abs(stmt.amount);
    const sDate = new Date(stmt.statementDate).getTime();
    const sNormDesc = normalizeMerchantName(stmt.description);
    const sRef = String(stmt.referenceNumber || "").trim().toLowerCase();

    let bestCandidate = null;
    let bestScore = -1;
    let bestMatchType = "Unmatched";
    let bestDateDiff = null;
    let bestAmtDiff = null;
    let bestMerchantSim = false;
    let bestRefMatched = false;

    allTransactions.forEach(function(tx) {
      // 1. DIRECTION COMPATIBILITY IS MANDATORY
      // Deposit (+ amount / INCOME) CANNOT match Expense (- amount / EXPENSE)
      const tDirection = tx.direction || "EXPENSE";
      if (tDirection !== sDirection) return;

      // 2. Exclude transactions already reconciled or matched to other statement lines
      const isAlreadyUsed = (tx.reconciliationStatus === "Reconciled" || matchedTxIdMap[tx.transactionId]);
      if (isAlreadyUsed && stmt.matchedTransactionId !== tx.transactionId) return;

      const tAmt = Math.abs(Number(tx.amount || 0));
      const tDate = new Date(tx.transactionDate).getTime();
      const diffDays = Math.round(Math.abs(sDate - tDate) / (1000 * 60 * 60 * 24));
      const amtDiff = Number(Math.abs(sAmt - tAmt).toFixed(2));
      const tNormPayee = normalizeMerchantName(tx.payeeOrPayer);
      const tNormDesc = normalizeMerchantName(tx.description);
      const tCheckNum = String(tx.checkNumber || "").trim().toLowerCase();

      const merchantMatched = Boolean(
        (sNormDesc && tNormPayee && (sNormDesc.includes(tNormPayee) || tNormPayee.includes(sNormDesc))) ||
        (sNormDesc && tNormDesc && (sNormDesc.includes(tNormDesc) || tNormDesc.includes(sNormDesc)))
      );
      const refMatched = Boolean(sRef && tCheckNum && sRef === tCheckNum);

      // Deterministic Scoring Factors
      let score = 0;
      // Amount scoring
      if (amtDiff === 0) score += 50;
      else if (amtDiff <= 0.05) score += 30;
      else if (amtDiff <= 1.00) score += 10;
      else score += 0;

      // Date scoring
      if (diffDays === 0) score += 30;
      else if (diffDays <= 2) score += 25;
      else if (diffDays <= 5) score += 15;
      else if (diffDays <= 10) score += 5;

      // Merchant & Reference scoring
      if (merchantMatched) score += 20;
      if (refMatched) score += 15;

      // Match Type determination
      let matchType = "Unmatched";
      if (amtDiff === 0 && diffDays <= 2) {
        matchType = "Exact Match";
      } else if (amtDiff === 0 && diffDays <= 10) {
        matchType = "Possible Match";
      } else if (amtDiff <= 0.05 && diffDays <= 5 && merchantMatched) {
        matchType = "Possible Match";
      } else if (amtDiff > 0 && (merchantMatched || refMatched)) {
        matchType = "Discrepancy";
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = tx;
        bestMatchType = matchType;
        bestDateDiff = diffDays;
        bestAmtDiff = amtDiff;
        bestMerchantSim = merchantMatched;
        bestRefMatched = refMatched;
      }
    });

    candidates.push({
      statementLine: stmt,
      suggestedTransaction: bestCandidate,
      matchType: bestMatchType,
      score: bestScore > 0 ? bestScore : 0,
      dateDifferenceDays: bestDateDiff,
      amountDifference: bestAmtDiff,
      merchantSimilarity: bestMerchantSim,
      referenceMatched: bestRefMatched,
      candidateTransactionId: bestCandidate ? bestCandidate.transactionId : null
    });
  });

  return { success: true, count: candidates.length, candidates: candidates };
}

/**
 * Reconciles a staged statement line with an authoritative transaction
 * Validate-first sequence: Verifies period locks, records, directions, duplicate reuse, differences, and lock before writes
 */
function matchReconciliationLine(p, userEmail) {
  p = p || {};
  if (!p.statementLineId) throw new Error("statementLineId is required");
  if (!p.transactionId) throw new Error("transactionId is required");

  const db = getDB(true, "matchReconciliationLine");
  const sSheet = db.getSheetByName("Reconciliation_Staging");
  const tSheet = db.getSheetByName("Transactions");

  if (!sSheet || !tSheet) throw new Error("Reconciliation tabs missing");

  // 1. Validate Statement Line Existence
  const sData = sSheet.getDataRange().getValues();
  const sHeaders = sData.shift();
  const sIdCol = sHeaders.indexOf("statementLineId");
  const sIdx = sData.findIndex(function(r) { return r[sIdCol] === p.statementLineId; });
  if (sIdx === -1) throw new Error("Statement line not found: " + p.statementLineId);
  const matchedStmtRow = sData[sIdx];

  // 2. Validate Transaction Existence
  const tData = tSheet.getDataRange().getValues();
  const tHeaders = tData.shift();
  const tIdCol = tHeaders.indexOf("transactionId");
  const tIdx = tData.findIndex(function(r) { return r[tIdCol] === p.transactionId; });
  if (tIdx === -1) throw new Error("Transaction not found: " + p.transactionId);
  const matchedTxRow = tData[tIdx];

  // 3. Direction & Eligibility Validation
  const sDateCol = sHeaders.indexOf("statementDate");
  const sAmtCol = sHeaders.indexOf("amount");
  const sDirCol = sHeaders.indexOf("direction");
  const sTxCol = sHeaders.indexOf("matchedTransactionId");
  const tDateCol = tHeaders.indexOf("transactionDate");
  const tAmtCol = tHeaders.indexOf("amount");
  const tDirCol = tHeaders.indexOf("direction");
  const tStatusCol = tHeaders.indexOf("reconciliationStatus");

  const stmtDate = matchedStmtRow[sDateCol];
  const txDate = matchedTxRow[tDateCol];

  // Server-Side Period Lock Guard on both Statement Date and Transaction Date
  assertPeriodWritable(stmtDate, "matchReconciliationLine (Statement Date)", userEmail, db);
  assertPeriodWritable(txDate, "matchReconciliationLine (Transaction Date)", userEmail, db);

  const stmtAmt = Number(matchedStmtRow[sAmtCol] || 0);
  const stmtDir = String(matchedStmtRow[sDirCol] || (stmtAmt < 0 ? "EXPENSE" : "INCOME"));
  const txAmt = Number(matchedTxRow[tAmtCol] || 0);
  const txDir = String(matchedTxRow[tDirCol] || "EXPENSE");
  const txReconciliationStatus = String(matchedTxRow[tStatusCol] || "");

  if (stmtDir !== txDir) {
    throw new Error("Direction mismatch: Statement line is " + stmtDir + " but transaction is " + txDir);
  }

  // 4. Duplicate Reuse Protection
  // Check if target transaction is already reconciled or matched elsewhere
  const existingStmtMatch = sData.find(function(r) {
    return r[sTxCol] === p.transactionId && r[sIdCol] !== p.statementLineId;
  });
  if (existingStmtMatch) {
    throw new Error("Transaction " + p.transactionId + " is already matched to statement line " + existingStmtMatch[sIdCol]);
  }
  if (txReconciliationStatus === "Reconciled" && matchedStmtRow[sTxCol] !== p.transactionId) {
    throw new Error("Transaction " + p.transactionId + " is already reconciled");
  }

  const diffAmount = Number(Math.abs(Math.abs(stmtAmt) - Math.abs(txAmt)).toFixed(2));
  const isDiscrepancy = (diffAmount > 0.001);
  const statementMatchStatus = isDiscrepancy ? "Discrepancy" : "Matched";
  const transactionReconcileStatus = isDiscrepancy ? "Discrepancy" : "Reconciled";

  // 5. Atomic Write Section guarded by LockService
  let lock = null;
  if (typeof LockService !== "undefined" && LockService.getScriptLock) {
    lock = LockService.getScriptLock();
    const acquired = lock.tryLock(10000);
    if (!acquired) {
      throw new Error("Could not acquire reconciliation lock. Please try again.");
    }
  }

  try {
    const sRowNum = sIdx + 2;
    const sStatusColIdx = sHeaders.indexOf("matchStatus") + 1;
    const sTxColIdx = sHeaders.indexOf("matchedTransactionId") + 1;
    const sDiffColIdx = sHeaders.indexOf("differenceAmount") + 1;

    if (sStatusColIdx > 0) sSheet.getRange(sRowNum, sStatusColIdx).setValue(statementMatchStatus);
    if (sTxColIdx > 0) sSheet.getRange(sRowNum, sTxColIdx).setValue(p.transactionId);
    if (sDiffColIdx > 0) sSheet.getRange(sRowNum, sDiffColIdx).setValue(diffAmount);

    const tRowNum = tIdx + 2;
    const tStatusColIdx = tHeaders.indexOf("reconciliationStatus") + 1;
    if (tStatusColIdx > 0) tSheet.getRange(tRowNum, tStatusColIdx).setValue(transactionReconcileStatus);
  } finally {
    if (lock && lock.releaseLock) lock.releaseLock();
  }

  return {
    success: true,
    statementLineId: p.statementLineId,
    transactionId: p.transactionId,
    matchStatus: statementMatchStatus,
    transactionStatus: transactionReconcileStatus,
    differenceAmount: diffAmount
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AUDIT_SCORING_CONFIG,
    ALLOWED_AUDIT_STATUSES,
    ALLOWED_RESOLUTION_STATUSES,
    logAuditEvent,
    normalizeMerchantName,
    normalizeAuditTimestampValue,
    calculatePurchaseBalance,
    evaluateAuditRules,
    calculateAuditHealthScore,
    runAudit,
    getAuditIssues,
    getAuditSummary,
    getLastCompletedAuditRun,
    resolveAuditIssue,
    reopenAuditIssue,
    assignAuditIssue,
    stageBankStatementLines,
    getReconciliationCandidates,
    matchReconciliationLine
  };
}
