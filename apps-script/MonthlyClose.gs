/*************************************************
 * GPBC Finance Desk — MonthlyClose.gs
 * Authoritative Monthly Close, Period Locking, and Close Readiness Engine
 *************************************************/

// In Node/test environment, load FinanceMath helpers
if (typeof require !== "undefined" && typeof getPeriodBounds === "undefined") {
  const financeMath = require("./FinanceMath.gs");
  global.getPeriodKey = financeMath.getPeriodKey;
  global.getPeriodBounds = financeMath.getPeriodBounds;
  global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  global.assertPeriodWritable = financeMath.assertPeriodWritable;
  global.calculatePurchaseBalance = financeMath.calculatePurchaseBalance;
}

/**
 * Retrieves the Monthly Close record for a specific period (or all close records)
 */
function getMonthlyClose(p) {
  p = p || {};
  const db = getDB(false, "getMonthlyClose");
  const sheet = db.getSheetByName("Monthly_Close");
  let closeRecords = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    closeRecords = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.totalIncome = Number(obj.totalIncome || 0);
      obj.totalRecognizedExpenses = Number(obj.totalRecognizedExpenses || 0);
      obj.netPosition = Number(obj.netPosition || 0);
      obj.auditHealthScore = Number(obj.auditHealthScore !== "" ? obj.auditHealthScore : 100);
      obj.openCriticalIssues = Number(obj.openCriticalIssues || 0);
      obj.openHighIssues = Number(obj.openHighIssues || 0);
      return obj;
    });
  }

  if (p.periodKey) {
    const matched = closeRecords.find(function(c) { return c.periodKey === p.periodKey; });
    return {
      success: true,
      periodKey: p.periodKey,
      closeRecord: matched || null
    };
  }

  // Sort descending by periodKey
  closeRecords.sort(function(a, b) {
    return (b.periodKey || "").localeCompare(a.periodKey || "");
  });

  return { success: true, count: closeRecords.length, closeRecords: closeRecords };
}

/**
 * Deterministic Close Readiness Engine: Evaluates if a month is ready to freeze
 */
function getMonthlyCloseReadiness(p) {
  p = p || {};
  const periodKey = p.periodKey || getPeriodKey(new Date());
  const bounds = getPeriodBounds(periodKey);

  const txRes = getTransactions({ startDate: bounds.startDate, endDate: bounds.endDate });
  const allTxs = txRes.transactions || [];

  const rmbRes = getReimbursements();
  const allRmbs = (rmbRes.reimbursements || []).filter(function(r) {
    const d = r.reimbursementDate || r.date;
    return d && d >= bounds.startDate && d <= bounds.endDate;
  });

  const rcpRes = getReceipts();
  const allRcps = (rcpRes.receipts || []).filter(function(r) {
    const d = r.receiptDate || r.date;
    return d && d >= bounds.startDate && d <= bounds.endDate;
  });

  const chkRes = getCheckDetails();
  const allChecks = (chkRes.checks || []).filter(function(c) {
    const d = c.checkDate || c.date;
    return d && d >= bounds.startDate && d <= bounds.endDate;
  });

  const auditRes = getAuditIssues();
  const allIssues = auditRes.issues || [];

  const fndRes = getDesignatedFundsSummary();
  const allFunds = fndRes.funds || [];

  // 1. Calculate Incomes and Operating Expenses
  let totalIncome = 0;
  let totalRecognizedExpenses = 0;
  let uncategorizedCount = 0;
  let missingPayeeCount = 0;
  let missingPurposeCount = 0;

  allTxs.forEach(function(t) {
    const amt = Number(t.amount || 0);
    if (t.direction === "INCOME") {
      totalIncome += amt;
    }
    // Only count recognized expenses, exclude liability settlements!
    if (t.accountingImpact === "EXPENSE") {
      totalRecognizedExpenses += amt;
      if (!t.category || t.category.toLowerCase() === "uncategorized") uncategorizedCount++;
      if (!t.payeeOrPayer || t.payeeOrPayer.toLowerCase() === "unknown") missingPayeeCount++;
      if (!t.description || t.description.toLowerCase() === "general") missingPurposeCount++;
    }
  });

  totalIncome = Number(totalIncome.toFixed(2));
  totalRecognizedExpenses = Number(totalRecognizedExpenses.toFixed(2));
  const netPosition = Number((totalIncome - totalRecognizedExpenses).toFixed(2));

  // 2. Audit Findings for this period
  const openCriticalIssues = allIssues.filter(function(i) {
    return i.severity === "CRITICAL" && AUDIT_SCORING_CONFIG.unresolvedStatuses.indexOf(i.status) !== -1;
  });
  const openHighIssues = allIssues.filter(function(i) {
    return i.severity === "HIGH" && AUDIT_SCORING_CONFIG.unresolvedStatuses.indexOf(i.status) !== -1;
  });

  const healthScore = calculateAuditHealthScore(allIssues);

  // 3. Reconciliation Status for this period
  const db = getDB(false, "getMonthlyCloseReadiness");
  const stmtSheet = db.getSheetByName("Reconciliation_Staging");
  let unreconciledStmtLines = 0;
  let discrepancyStmtLines = 0;

  if (stmtSheet && stmtSheet.getLastRow() > 1) {
    const sData = stmtSheet.getDataRange().getValues();
    const sHeaders = sData.shift();
    const dateCol = sHeaders.indexOf("statementDate");
    const statusCol = sHeaders.indexOf("matchStatus");

    sData.forEach(function(row) {
      const sDate = String(row[dateCol] || "");
      if (sDate >= bounds.startDate && sDate <= bounds.endDate) {
        const stat = row[statusCol];
        if (stat === "Unmatched") unreconciledStmtLines++;
        if (stat === "Discrepancy") discrepancyStmtLines++;
      }
    });
  }

  // 4. Designated Funds Deficits
  const deficitFunds = allFunds.filter(function(f) { return f.fundId !== "General" && f.netBalance < 0; });

  // 5. Evaluate Blockers & Warnings
  const blockingIssues = [];
  const warnings = [];

  if (openCriticalIssues.length > 0) {
    blockingIssues.push(openCriticalIssues.length + " unresolved CRITICAL audit / compliance findings");
  }
  if (discrepancyStmtLines > 0) {
    blockingIssues.push(discrepancyStmtLines + " statement lines with unresolved amount discrepancies");
  }
  if (deficitFunds.length > 0) {
    blockingIssues.push(deficitFunds.length + " restricted designated fund(s) with negative balances");
  }
  if (unreconciledStmtLines > 0) {
    warnings.push(unreconciledStmtLines + " imported statement lines pending reconciliation match");
  }
  if (openHighIssues.length > 0) {
    warnings.push(openHighIssues.length + " high-priority audit items pending documentation review");
  }
  if (uncategorizedCount > 0) {
    warnings.push(uncategorizedCount + " expense transactions remain uncategorized");
  }

  const readyToClose = (blockingIssues.length === 0);

  // 6. Existing Close Status
  const closeRes = getMonthlyClose({ periodKey: periodKey });
  const currentStatus = closeRes.closeRecord ? closeRes.closeRecord.status : "Open";

  return {
    success: true,
    periodKey: periodKey,
    periodStart: bounds.startDate,
    periodEnd: bounds.endDate,
    currentStatus: currentStatus,
    readyToClose: readyToClose,
    blockingIssues: blockingIssues,
    warnings: warnings,
    financialSummary: {
      totalIncome: totalIncome,
      totalRecognizedExpenses: totalRecognizedExpenses,
      netPosition: netPosition,
      auditHealthScore: healthScore.score,
      scoreTier: healthScore.scoreTier
    },
    counts: {
      transactionsCount: allTxs.length,
      reimbursementsCount: allRmbs.length,
      receiptsCount: allRcps.length,
      checksCount: allChecks.length,
      openCriticalIssues: openCriticalIssues.length,
      openHighIssues: openHighIssues.length,
      unreconciledStmtLines: unreconciledStmtLines,
      discrepancyStmtLines: discrepancyStmtLines
    }
  };
}

/**
 * Freezes and locks a monthly accounting period
 * Authoritative: Restricted to Admin roles; captures immutable financial snapshot and lifecycle history
 */
function closeMonthlyPeriod(p, userEmail) {
  p = p || {};
  if (!p.periodKey) throw new Error("periodKey (YYYY-MM) is required to close period");

  const bounds = getPeriodBounds(p.periodKey);
  const readiness = getMonthlyCloseReadiness({ periodKey: p.periodKey });

  // Guard: Must not have blocking issues
  if (!readiness.readyToClose) {
    throw new Error("Cannot close period " + p.periodKey + ". Blockers: " + readiness.blockingIssues.join("; "));
  }

  const db = getDB(true, "closeMonthlyPeriod");
  let closeSheet = db.getSheetByName("Monthly_Close");
  let historySheet = db.getSheetByName("Monthly_Close_History");

  if (!closeSheet || !historySheet) {
    initializeSandboxSchema();
    closeSheet = db.getSheetByName("Monthly_Close");
    historySheet = db.getSheetByName("Monthly_Close_History");
  }

  const nowIso = new Date().toISOString();
  const actor = userEmail || "System Admin";

  // Check if close record already exists for this period
  const data = closeSheet.getDataRange().getValues();
  const headers = data.shift();
  const pCol = headers.indexOf("periodKey");
  const existingIdx = data.findIndex(function(r) { return r[pCol] === p.periodKey; });

  const closeId = existingIdx !== -1 ? data[existingIdx][headers.indexOf("closeId")] : ("CLS-" + p.periodKey.replace("-", "") + "-" + Math.floor(100 + Math.random() * 900));

  const totalIncome = readiness.financialSummary.totalIncome;
  const totalExpenses = readiness.financialSummary.totalRecognizedExpenses;
  const netPosition = readiness.financialSummary.netPosition;
  const auditScore = readiness.financialSummary.auditHealthScore;
  const openCrit = readiness.counts.openCriticalIssues;
  const openHigh = readiness.counts.openHighIssues;

  if (existingIdx !== -1) {
    // Update existing close row
    const rowNum = existingIdx + 2;
    const sCol = headers.indexOf("status") + 1;
    const cByCol = headers.indexOf("closedBy") + 1;
    const cAtCol = headers.indexOf("closedAt") + 1;
    const incCol = headers.indexOf("totalIncome") + 1;
    const expCol = headers.indexOf("totalRecognizedExpenses") + 1;
    const netCol = headers.indexOf("netPosition") + 1;
    const scrCol = headers.indexOf("auditHealthScore") + 1;
    const critCol = headers.indexOf("openCriticalIssues") + 1;
    const highCol = headers.indexOf("openHighIssues") + 1;
    const upAtCol = headers.indexOf("updatedAt") + 1;

    if (sCol > 0) closeSheet.getRange(rowNum, sCol).setValue("Closed");
    if (cByCol > 0) closeSheet.getRange(rowNum, cByCol).setValue(actor);
    if (cAtCol > 0) closeSheet.getRange(rowNum, cAtCol).setValue(nowIso);
    if (incCol > 0) closeSheet.getRange(rowNum, incCol).setValue(totalIncome);
    if (expCol > 0) closeSheet.getRange(rowNum, expCol).setValue(totalExpenses);
    if (netCol > 0) closeSheet.getRange(rowNum, netCol).setValue(netPosition);
    if (scrCol > 0) closeSheet.getRange(rowNum, scrCol).setValue(auditScore);
    if (critCol > 0) closeSheet.getRange(rowNum, critCol).setValue(openCrit);
    if (highCol > 0) closeSheet.getRange(rowNum, highCol).setValue(openHigh);
    if (upAtCol > 0) closeSheet.getRange(rowNum, upAtCol).setValue(nowIso);
  } else {
    // Insert new close row
    closeSheet.appendRow([
      closeId,
      p.periodKey,
      bounds.startDate,
      bounds.endDate,
      "Closed",
      "1.0",
      true, // incomeReviewed
      true, // expensesReviewed
      true, // receiptsReviewed
      true, // checksReviewed
      true, // reimbursementsReviewed
      true, // bankReconciled
      true, // cardsReconciled
      true, // designatedFundsReviewed
      true, // auditIssuesReviewed
      false, // reportGenerated
      openCrit,
      openHigh,
      auditScore,
      totalIncome,
      totalExpenses,
      netPosition,
      actor,
      nowIso,
      "", // reopenedBy
      "", // reopenedAt
      "", // reopenReason
      "", // lastAmendedBy
      "", // lastAmendedAt
      "", // amendmentReason
      p.notes || "",
      nowIso,
      nowIso
    ]);
  }

  // Record Immutable Lifecycle History Event
  const histId = "HIST-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
  historySheet.appendRow([
    histId,
    closeId,
    p.periodKey,
    "CLOSE",
    "Closed",
    auditScore,
    totalIncome,
    totalExpenses,
    netPosition,
    openCrit,
    openHigh,
    actor,
    nowIso,
    p.notes || "Regular monthly close",
    p.notes || ""
  ]);

  return {
    success: true,
    closeId: closeId,
    periodKey: p.periodKey,
    status: "Closed",
    closedBy: actor,
    closedAt: nowIso,
    financialSummary: readiness.financialSummary
  };
}

/**
 * Reopens a closed period for authorized corrections with required reason tracking
 */
function reopenMonthlyPeriod(p, userEmail) {
  p = p || {};
  if (!p.periodKey) throw new Error("periodKey (YYYY-MM) is required");
  if (!p.reopenReason || String(p.reopenReason).trim() === "") {
    throw new Error("A clear documented reason is required to reopen a closed monthly period");
  }

  const db = getDB(true, "reopenMonthlyPeriod");
  const closeSheet = db.getSheetByName("Monthly_Close");
  const historySheet = db.getSheetByName("Monthly_Close_History");

  if (!closeSheet || closeSheet.getLastRow() <= 1) {
    throw new Error("Monthly_Close tab is empty. Period " + p.periodKey + " has never been closed.");
  }

  const data = closeSheet.getDataRange().getValues();
  const headers = data.shift();
  const pCol = headers.indexOf("periodKey");
  const idx = data.findIndex(function(r) { return r[pCol] === p.periodKey; });

  if (idx === -1) {
    throw new Error("Period " + p.periodKey + " has not been closed yet.");
  }

  const rowNum = idx + 2;
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System Admin";
  const closeId = data[idx][headers.indexOf("closeId")];

  const sCol = headers.indexOf("status") + 1;
  const rByCol = headers.indexOf("reopenedBy") + 1;
  const rAtCol = headers.indexOf("reopenedAt") + 1;
  const rRsnCol = headers.indexOf("reopenReason") + 1;
  const upAtCol = headers.indexOf("updatedAt") + 1;

  if (sCol > 0) closeSheet.getRange(rowNum, sCol).setValue("Reopened");
  if (rByCol > 0) closeSheet.getRange(rowNum, rByCol).setValue(actor);
  if (rAtCol > 0) closeSheet.getRange(rowNum, rAtCol).setValue(nowIso);
  if (rRsnCol > 0) closeSheet.getRange(rowNum, rRsnCol).setValue(p.reopenReason);
  if (upAtCol > 0) closeSheet.getRange(rowNum, upAtCol).setValue(nowIso);

  // Record Immutable Lifecycle History Event
  if (historySheet) {
    const histId = "HIST-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
    historySheet.appendRow([
      histId,
      closeId,
      p.periodKey,
      "REOPEN",
      "Reopened",
      Number(data[idx][headers.indexOf("auditHealthScore")] || 100),
      Number(data[idx][headers.indexOf("totalIncome")] || 0),
      Number(data[idx][headers.indexOf("totalRecognizedExpenses")] || 0),
      Number(data[idx][headers.indexOf("netPosition")] || 0),
      Number(data[idx][headers.indexOf("openCriticalIssues")] || 0),
      Number(data[idx][headers.indexOf("openHighIssues")] || 0),
      actor,
      nowIso,
      p.reopenReason,
      p.notes || ""
    ]);
  }

  return {
    success: true,
    closeId: closeId,
    periodKey: p.periodKey,
    status: "Reopened",
    reopenedBy: actor,
    reopenedAt: nowIso,
    reopenReason: p.reopenReason
  };
}

/**
 * Retrieves close and reopen history for a period
 */
function getMonthlyCloseHistory(p) {
  p = p || {};
  const db = getDB(false, "getMonthlyCloseHistory");
  const sheet = db.getSheetByName("Monthly_Close_History");
  let history = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    history = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
  }

  if (p.periodKey) {
    history = history.filter(function(h) { return h.periodKey === p.periodKey; });
  }

  // Sort descending by performedAt
  history.sort(function(a, b) {
    return (b.performedAt || "").localeCompare(a.performedAt || "");
  });

  return { success: true, count: history.length, history: history };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getMonthlyClose,
    getMonthlyCloseReadiness,
    closeMonthlyPeriod,
    reopenMonthlyPeriod,
    getMonthlyCloseHistory
  };
}
