/*************************************************
 * GPBC Finance Desk — Audit.gs
 * Deterministic Audit Rule Engine, Audit Health Score, and Reconciliation
 *************************************************/

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
  unresolvedStatuses: [
    "Needs Receipt",
    "Needs Explanation",
    "Missing Documentation",
    "Pending Match",
    "Partial Reimbursement",
    "Possible Duplicate",
    "Discrepancy"
  ]
};

/**
 * Pure Rule Engine: Evaluates all 11 deterministic audit rules against financial datasets
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
    if (t.personalPurchase === true) {
      const pAllocations = allocationsByPurchase[t.transactionId] || [];
      const totalAllocated = pAllocations.reduce(function(sum, a) { return sum + Number(a.allocatedAmount || 0); }, 0);
      const totalAbsorbed = pAllocations.reduce(function(sum, a) { return sum + Number(a.personallyAbsorbedAmount || 0); }, 0);
      const unresolved = amt - totalAllocated - totalAbsorbed;

      if (unresolved > 0.01) {
        findings.push({
          ruleId: "RULE-PRP-001",
          severity: "HIGH",
          status: totalAllocated > 0 ? "Partial Reimbursement" : "Pending Match",
          entityType: "Transaction",
          entityId: t.transactionId,
          title: "Personal-card purchase pending reimbursement ($" + unresolved.toFixed(2) + " remaining)",
          description: "Personal card church purchase of $" + amt.toFixed(2) + " by " + (t.claimantName || t.payeeOrPayer || "Claimant") + " has $" + unresolved.toFixed(2) + " unallocated/unreimbursed balance.",
          amount: unresolved,
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
      const notes = String(t.notes || "").toLowerCase();
      if (!notes.includes("txn-") && !notes.includes("linked") && !notes.includes("alc-")) {
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

    if (rAmt > 0 && (rAllocs.length === 0 || Math.abs(totalAllocated - rAmt) > 0.01)) {
      findings.push({
        ruleId: "RULE-RMB-001",
        severity: "HIGH",
        status: "Pending Match",
        entityType: "Reimbursement",
        entityId: r.reimbursementId,
        title: "Reimbursement payout lacks supporting purchase allocations",
        description: "Reimbursement " + r.reimbursementId + " for $" + rAmt.toFixed(2) + " to " + (r.claimantName || "Claimant") + " has only $" + totalAllocated.toFixed(2) + " in allocated purchases.",
        amount: Math.max(0, rAmt - totalAllocated),
        recommendedAction: "Link reimbursement to underlying personal-card expense transactions.",
        evidenceUrl: "",
        fingerprint: "RULE-RMB-001_Reimbursement_" + r.reimbursementId
      });
    }
  });

  // Defensive check for Over-Allocations (RULE-RMB-002)
  Object.keys(allocationsByPurchase).forEach(function(pId) {
    const pAllocs = allocationsByPurchase[pId];
    const sumAllocated = pAllocs.reduce(function(sum, a) { return sum + Number(a.allocatedAmount || 0) + Number(a.personallyAbsorbedAmount || 0); }, 0);
    const matchedTx = transactions.find(function(t) { return t.transactionId === pId; });
    if (matchedTx) {
      const pCost = Number(matchedTx.amount || 0);
      if (sumAllocated > pCost + 0.01) {
        findings.push({
          ruleId: "RULE-RMB-002",
          severity: "CRITICAL",
          status: "Discrepancy",
          entityType: "Transaction",
          entityId: pId,
          title: "Over-allocated purchase transaction ($" + sumAllocated.toFixed(2) + " allocated on $" + pCost.toFixed(2) + " purchase)",
          description: "Purchase " + pId + " has allocations totaling $" + sumAllocated.toFixed(2) + ", which exceeds the purchase cost of $" + pCost.toFixed(2) + ".",
          amount: Number((sumAllocated - pCost).toFixed(2)),
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
 * Runs the full deterministic audit suite, persists findings idempotently, and updates health score
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

  // 2. Evaluate rules
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

  // 4. Update or insert current findings
  currentFindings.forEach(function(f) {
    currentFingerprints[f.fingerprint] = true;
    const existing = existingByFingerprint[f.fingerprint];

    if (existing) {
      // Finding exists: update lastDetectedAt and amount
      const rowNum = existing._rowIndex;
      const headers = auditSheet.getRange(1, 1, 1, auditSheet.getLastColumn()).getValues()[0];
      const lastDetCol = headers.indexOf("lastDetectedAt") + 1;
      const amtCol = headers.indexOf("amount") + 1;
      if (lastDetCol > 0) auditSheet.getRange(rowNum, lastDetCol).setValue(nowIso);
      if (amtCol > 0 && f.amount !== undefined) auditSheet.getRange(rowNum, amtCol).setValue(f.amount);
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

  // 5. Auto-clear findings whose conditions resolved
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
        if (notesCol > 0 && !existing.resolutionNotes) auditSheet.getRange(rowNum, notesCol).setValue("Auto-cleared: condition resolved in financial ledger.");
      }
    }
  });

  // 6. Reload fresh issues and compute Health Score
  const freshIssues = getAuditIssues().issues || [];
  const healthScore = calculateAuditHealthScore(freshIssues);

  return {
    success: true,
    detectedCount: currentFindings.length,
    healthScore: healthScore,
    issues: freshIssues
  };
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
      obj.amount = Number(obj.amount || 0);
      return obj;
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
  const issuesRes = getAuditIssues();
  const issues = issuesRes.issues || [];
  const healthScore = calculateAuditHealthScore(issues);

  return {
    success: true,
    healthScore: healthScore
  };
}

/**
 * Resolves or updates an audit issue (e.g. Reviewed, Cleared) with preserved audit history
 */
function resolveAuditIssue(p, userEmail) {
  p = p || {};
  if (!p.auditIssueId) throw new Error("auditIssueId is required");
  if (!p.status) throw new Error("status is required for resolution");

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
 * Stages normalized CSV statement lines into Reconciliation_Staging tab
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

  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";
  const sourceFile = p.sourceFileName || "statement_import.csv";

  lines.forEach(function(line) {
    const lineId = "STMT-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
    sheet.appendRow([
      lineId,
      line.statementDate || line.date || nowIso.split("T")[0],
      line.description || "Statement Line",
      Number(line.amount || 0),
      line.direction || (Number(line.amount) < 0 ? "EXPENSE" : "INCOME"),
      line.statementType || "Bank Checking",
      line.referenceNumber || "",
      "Unmatched",
      "",
      0,
      sourceFile,
      nowIso,
      actor
    ]);
  });

  return { success: true, count: lines.length };
}

/**
 * Returns reconciliation candidate matches between staged statement lines and Transactions
 */
function getReconciliationCandidates() {
  const db = getDB(false, "getReconciliationCandidates");
  const stmtSheet = db.getSheetByName("Reconciliation_Staging");
  const txSheet = db.getSheetByName("Transactions");

  const candidates = [];
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
  const transactions = txRes.transactions || [];

  stagedLines.forEach(function(stmt) {
    const sAmt = Math.abs(stmt.amount);
    const sDate = new Date(stmt.statementDate).getTime();
    let bestMatch = null;
    let matchType = "Unmatched";

    transactions.forEach(function(tx) {
      if (bestMatch) return;
      const tAmt = Math.abs(Number(tx.amount || 0));
      const tDate = new Date(tx.transactionDate).getTime();
      const diffDays = Math.abs(sDate - tDate) / (1000 * 60 * 60 * 24);

      if (Math.abs(sAmt - tAmt) < 0.01 && diffDays <= 2) {
        bestMatch = tx;
        matchType = "Exact Match";
      } else if (Math.abs(sAmt - tAmt) < 0.01 && diffDays <= 7) {
        bestMatch = tx;
        matchType = "Possible Match";
      }
    });

    candidates.push({
      statementLine: stmt,
      suggestedTransaction: bestMatch,
      matchType: matchType
    });
  });

  return { success: true, count: candidates.length, candidates: candidates };
}

/**
 * Reconciles a staged statement line with an authoritative transaction
 */
function matchReconciliationLine(p, userEmail) {
  p = p || {};
  if (!p.statementLineId) throw new Error("statementLineId is required");
  if (!p.transactionId) throw new Error("transactionId is required");

  const db = getDB(true, "matchReconciliationLine");
  const sSheet = db.getSheetByName("Reconciliation_Staging");
  const tSheet = db.getSheetByName("Transactions");

  if (!sSheet || !tSheet) throw new Error("Reconciliation tabs missing");

  // 1. Update Staged Line
  const sData = sSheet.getDataRange().getValues();
  const sHeaders = sData.shift();
  const sIdCol = sHeaders.indexOf("statementLineId");
  const sIdx = sData.findIndex(function(r) { return r[sIdCol] === p.statementLineId; });
  if (sIdx === -1) throw new Error("Statement line not found: " + p.statementLineId);

  const sRowNum = sIdx + 2;
  const statusCol = sHeaders.indexOf("matchStatus") + 1;
  const txCol = sHeaders.indexOf("matchedTransactionId") + 1;
  if (statusCol > 0) sSheet.getRange(sRowNum, statusCol).setValue("Matched");
  if (txCol > 0) sSheet.getRange(sRowNum, txCol).setValue(p.transactionId);

  // 2. Update Transaction reconciliationStatus
  const tData = tSheet.getDataRange().getValues();
  const tHeaders = tData.shift();
  const tIdCol = tHeaders.indexOf("transactionId");
  const tIdx = tData.findIndex(function(r) { return r[tIdCol] === p.transactionId; });
  if (tIdx === -1) throw new Error("Transaction not found: " + p.transactionId);

  const tRowNum = tIdx + 2;
  const tStatusCol = tHeaders.indexOf("reconciliationStatus") + 1;
  if (tStatusCol > 0) tSheet.getRange(tRowNum, tStatusCol).setValue("Reconciled");

  return { success: true, statementLineId: p.statementLineId, transactionId: p.transactionId };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AUDIT_SCORING_CONFIG,
    evaluateAuditRules,
    calculateAuditHealthScore,
    runAudit,
    getAuditIssues,
    getAuditSummary,
    resolveAuditIssue,
    reopenAuditIssue,
    assignAuditIssue,
    stageBankStatementLines,
    getReconciliationCandidates,
    matchReconciliationLine
  };
}
