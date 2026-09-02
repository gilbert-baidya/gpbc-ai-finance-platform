/*************************************************
 * GPBC Finance Desk — PresbyterReports.gs
 * Executive Presbyter PDF Reporting Engine with Privacy Protection
 *************************************************/

// In Node/test environment, load FinanceMath helpers and Config
if (typeof require !== "undefined") {
  if (typeof getPeriodBounds === "undefined") {
    const financeMath = require("./FinanceMath.gs");
    global.getPeriodKey = financeMath.getPeriodKey;
    global.getPeriodBounds = financeMath.getPeriodBounds;
    global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
    global.assertPeriodWritable = financeMath.assertPeriodWritable;
  }
  if (typeof CHURCH_INFO === "undefined") {
    const config = require("./Config.gs");
    global.CHURCH_INFO = config.CHURCH_INFO;
  }
}

/**
 * Aggregates complete canonical data for a Presbyter Financial Report
 */
function aggregatePresbyterReportData(p) {
  p = p || {};
  let startDate = p.startDate;
  let endDate = p.endDate;
  let periodKey = p.periodKey;

  if (periodKey) {
    const bounds = getPeriodBounds(periodKey);
    startDate = bounds.startDate;
    endDate = bounds.endDate;
  } else if (!startDate || !endDate) {
    periodKey = getPeriodKey(new Date());
    const bounds = getPeriodBounds(periodKey);
    startDate = bounds.startDate;
    endDate = bounds.endDate;
  }

  // 1. Transactions for the period
  const txRes = getTransactions({ startDate: startDate, endDate: endDate });
  const txs = txRes.transactions || [];

  // Income Aggregation
  let totalIncome = 0;
  const incomeByType = {};
  // Expense Aggregation
  let totalRecognizedExpenses = 0;
  let totalSettlementPayouts = 0;
  const expensesByCategory = {};

  txs.forEach(function(t) {
    const amt = Number(t.amount || 0);
    if (t.direction === "INCOME") {
      totalIncome += amt;
      const tType = t.transactionType || "General Donation";
      incomeByType[tType] = (incomeByType[tType] || 0) + amt;
    }

    if (t.accountingImpact === "EXPENSE") {
      totalRecognizedExpenses += amt;
      const cat = t.category || "General";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
    } else if (t.accountingImpact === "SETTLEMENT" || t.transactionType === "Reimbursement") {
      totalSettlementPayouts += amt;
    }
  });

  totalIncome = Number(totalIncome.toFixed(2));
  totalRecognizedExpenses = Number(totalRecognizedExpenses.toFixed(2));
  totalSettlementPayouts = Number(totalSettlementPayouts.toFixed(2));
  const netPosition = Number((totalIncome - totalRecognizedExpenses).toFixed(2));

  // 2. Designated Funds Summary
  const fndRes = getDesignatedFundsSummary();
  const funds = fndRes.funds || [];

  // 3. Capital Projects
  const prjRes = getCapitalProjects();
  const projects = prjRes.projects || [];

  // 4. Reimbursements Summary (Privacy-Safe: High level only, NO personal card numbers)
  const rmbRes = getReimbursements();
  const periodRmbs = (rmbRes.reimbursements || []).filter(function(r) {
    const d = r.reimbursementDate || r.date;
    return d && d >= startDate && d <= endDate;
  });

  const totalReimbursedPaid = periodRmbs.reduce(function(sum, r) { return sum + Number(r.totalReimbursedAmount || 0); }, 0);
  const totalReimbursedPending = periodRmbs.reduce(function(sum, r) { return sum + Number(r.remainingReimbursable || 0); }, 0);

  // 5. Audit Findings & Health Score
  const auditSummaryRes = getAuditSummary();
  const healthScore = auditSummaryRes.healthScore || { score: 100, scoreTier: "Excellent / Audit Ready" };

  let auditAppendix = [];
  if (p.includeAuditAppendix) {
    const issuesRes = getAuditIssues();
    auditAppendix = (issuesRes.issues || []).map(function(i) {
      return {
        severity: i.severity,
        ruleId: i.ruleId,
        title: i.title,
        description: i.description,
        amount: i.amount,
        status: i.status,
        recommendedAction: i.recommendedAction
      };
    });
  }

  // 6. Check Close Status
  let closeInfo = null;
  if (periodKey) {
    const closeRes = getMonthlyClose({ periodKey: periodKey });
    if (closeRes.closeRecord) {
      closeInfo = {
        status: closeRes.closeRecord.status,
        closedBy: closeRes.closeRecord.closedBy,
        closedAt: closeRes.closeRecord.closedAt,
        reopenedBy: closeRes.closeRecord.reopenedBy,
        reopenedAt: closeRes.closeRecord.reopenedAt,
        reopenReason: closeRes.closeRecord.reopenReason
      };
    }
  }

  return {
    churchInfo: CHURCH_INFO,
    periodKey: periodKey || (startDate + " to " + endDate),
    startDate: startDate,
    endDate: endDate,
    generatedAt: new Date().toISOString(),
    executiveSummary: {
      totalIncome: totalIncome,
      totalRecognizedExpenses: totalRecognizedExpenses,
      netPosition: netPosition,
      settlementPayouts: totalSettlementPayouts,
      auditHealthScore: healthScore.score,
      scoreTier: healthScore.scoreTier,
      closeStatus: closeInfo ? closeInfo.status : "Open"
    },
    closeInfo: closeInfo,
    incomeBreakdown: incomeByType,
    expenseBreakdown: expensesByCategory,
    designatedFunds: funds,
    capitalProjects: projects,
    reimbursementsOverview: {
      count: periodRmbs.length,
      totalPaid: Number(totalReimbursedPaid.toFixed(2)),
      totalPending: Number(totalReimbursedPending.toFixed(2))
    },
    auditAppendix: auditAppendix
  };
}

/**
 * Generates and persists a Presbyter Report record
 */
function generatePresbyterReport(p, userEmail) {
  p = p || {};
  const reportData = aggregatePresbyterReportData(p);

  const db = getDB(true, "generatePresbyterReport");
  let reportSheet = db.getSheetByName("Presbyter_Reports");

  if (!reportSheet) {
    initializeSandboxSchema();
    reportSheet = db.getSheetByName("Presbyter_Reports");
  }

  const reportId = "RPT-" + (p.periodKey ? p.periodKey.replace("-", "") : Date.now()) + "-" + Math.floor(100 + Math.random() * 900);
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System Admin";

  reportSheet.appendRow([
    reportId,
    reportData.periodKey,
    reportData.startDate,
    reportData.endDate,
    p.reportType || "MONTHLY_SUMMARY",
    p.detailLevel || "Summary",
    p.includeAuditAppendix ? true : false,
    reportData.executiveSummary.totalIncome,
    reportData.executiveSummary.totalRecognizedExpenses,
    reportData.executiveSummary.netPosition,
    reportData.executiveSummary.auditHealthScore,
    "", // driveFileId (set when uploaded to Drive)
    "", // driveUrl
    actor,
    nowIso,
    "", // emailSentAt
    "", // emailRecipient
    p.notes || ""
  ]);

  return {
    success: true,
    reportId: reportId,
    reportData: reportData
  };
}

/**
 * Retrieves persisted Presbyter Reports metadata
 */
function getPresbyterReports(p) {
  p = p || {};
  const db = getDB(false, "getPresbyterReports");
  const sheet = db.getSheetByName("Presbyter_Reports");
  let reports = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    reports = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.totalIncome = Number(obj.totalIncome || 0);
      obj.totalExpenses = Number(obj.totalExpenses || 0);
      obj.netPosition = Number(obj.netPosition || 0);
      obj.auditHealthScore = Number(obj.auditHealthScore || 100);
      return obj;
    });
  }

  if (p.periodKey) {
    reports = reports.filter(function(r) { return r.periodKey === p.periodKey; });
  }

  // Sort descending by generatedAt
  reports.sort(function(a, b) {
    return (b.generatedAt || "").localeCompare(a.generatedAt || "");
  });

  return { success: true, count: reports.length, reports: reports };
}

/**
 * Explicit manual email delivery of Presbyter Report using MailApp
 */
function sendPresbyterReport(p, userEmail) {
  p = p || {};
  if (!p.reportId) throw new Error("reportId is required");
  if (!p.recipientEmail || !p.recipientEmail.includes("@")) {
    throw new Error("Valid recipient email is required");
  }

  const db = getDB(true, "sendPresbyterReport");
  const sheet = db.getSheetByName("Presbyter_Reports");
  if (!sheet || sheet.getLastRow() <= 1) throw new Error("Presbyter_Reports tab missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("reportId");
  const idx = data.findIndex(function(r) { return r[idCol] === p.reportId; });
  if (idx === -1) throw new Error("Report not found: " + p.reportId);

  const reportRow = data[idx];
  const periodKey = reportRow[headers.indexOf("periodKey")];
  const nowIso = new Date().toISOString();

  // Send Email if MailApp is available
  if (typeof MailApp !== "undefined" && MailApp.sendEmail) {
    const subject = "GPBC Finance Desk — Financial Oversight Report (" + periodKey + ")";
    const body = "Please find attached/linked the Financial Oversight Report for Grace and Praise Bangladeshi Church (" + periodKey + ").\n\nGenerated by: " + (userEmail || "Finance Desk") + "\nDate: " + nowIso;
    MailApp.sendEmail({
      to: p.recipientEmail,
      subject: subject,
      body: body
    });
  }

  // Update report row with delivery metadata
  const rowNum = idx + 2;
  const sentAtCol = headers.indexOf("emailSentAt") + 1;
  const recipCol = headers.indexOf("emailRecipient") + 1;

  if (sentAtCol > 0) sheet.getRange(rowNum, sentAtCol).setValue(nowIso);
  if (recipCol > 0) sheet.getRange(rowNum, recipCol).setValue(p.recipientEmail);

  return {
    success: true,
    reportId: p.reportId,
    recipientEmail: p.recipientEmail,
    sentAt: nowIso
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    aggregatePresbyterReportData,
    generatePresbyterReport,
    getPresbyterReports,
    sendPresbyterReport
  };
}
