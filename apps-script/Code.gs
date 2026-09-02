/*************************************************
 * GPBC Finance Desk — Code.gs
 * Main Web App Request Router and Dispatcher
 * Product: GPBC Finance Desk — Finance • Audit • Reporting
 *************************************************/

/**
 * Health Check Endpoint (GET)
 */
function doGet() {
  return jsonResponse({
    service: "GPBC Finance Desk API",
    version: "1.0.0",
    status: "Running",
    environment: getConfig().environment,
    time: new Date().toISOString()
  });
}

/**
 * Primary Request Router (POST)
 * Accepts text/plain JSON payloads to avoid CORS preflight options issues.
 */
function doPost(e) {
  try {
    const rawContent = (e && e.postData && e.postData.contents) || "{}";
    let body;
    try {
      body = JSON.parse(rawContent);
    } catch (jsonErr) {
      return jsonResponse({ success: false, error: "Invalid JSON request body" });
    }

    const action = String(body.action || "").trim();
    const p = body.payload || {};
    const idToken = body.idToken || "";

    // Public health check
    if (action === "healthCheck") {
      return jsonResponse({ success: true, status: "Healthy" });
    }

    // Server-Side Authentication
    const authResult = validateGoogleIdentity(idToken);
    if (!authResult.valid) {
      return jsonResponse({
        success: false,
        error: "Unauthorized: " + (authResult.error || "Authentication required")
      });
    }

    // Resolve User Identity and Canonical Role
    const userEmail = authResult.claims.email;
    const approvedUser = getApprovedUser(userEmail);

    // Session Verification Action
    if (action === "verifySession") {
      return jsonResponse({
        success: true,
        user: {
          email: approvedUser.email,
          name: approvedUser.name,
          role: approvedUser.role
        }
      });
    }

    // Server-Side Role Authorization
    const authCheck = authorizeAction(action, approvedUser.role);
    if (!authCheck.authorized) {
      logAuditEvent({
        actor: userEmail,
        action: action,
        status: "DENIED",
        details: authCheck.reason
      });
      return jsonResponse({
        success: false,
        error: "Forbidden: " + (authCheck.reason || "Insufficient permissions")
      });
    }

    // Audit Access Event (non-sensitive)
    logAuditEvent({
      actor: userEmail,
      action: action,
      status: "AUTHORIZED"
    });

    // Action Dispatcher
    switch (action) {
      // SCHEMA INVENTORY & INITIALIZATION
      case "getSchemaInventory":
        return jsonResponse(getSchemaInventory());
      case "initializeSandboxSchema":
        return jsonResponse(initializeSandboxSchema());

      // PHASE 2: MASTER TRANSACTIONS, INCOME, EXPENSES
      case "getTransactions":
        return jsonResponse(getTransactions(p));
      case "addTransaction":
        return jsonResponse(addTransaction(p, userEmail));
      case "addIncome":
        return jsonResponse(addIncome(p, userEmail));
      case "addExpense":
        return jsonResponse(addExpense(p, userEmail));
      case "getDesignatedFundsSummary":
        return jsonResponse(getDesignatedFundsSummary());

      // PHASE 2: REIMBURSEMENTS & ALLOCATIONS
      case "getReimbursements":
        return jsonResponse(getReimbursements());
      case "addReimbursement":
        return jsonResponse(addReimbursement(p, userEmail));
      case "addReimbursementAllocation":
        return jsonResponse(addReimbursementAllocation(p, userEmail));

      // PHASE 2: RECEIPTS & CHECKS
      case "getReceipts":
        return jsonResponse(getReceipts(p));
      case "addReceipt":
        return jsonResponse(addReceipt(p, userEmail));
      case "matchReceiptToTransaction":
        return jsonResponse(matchReceiptToTransaction(p, userEmail));
      case "getCheckDetails":
        return jsonResponse(getCheckDetails());
      case "addCheckDetail":
        return jsonResponse(addCheckDetail(p, userEmail));

      // PHASE 2: CAPITAL PROJECTS
      case "getCapitalProjects":
        return jsonResponse(getCapitalProjects());
      case "addCapitalProject":
        return jsonResponse(addCapitalProject(p, userEmail));
      case "updateCapitalProject":
        return jsonResponse(updateCapitalProject(p, userEmail));

      // PHASE 3: AUDIT CENTER & RECONCILIATION
      case "runAudit":
        return jsonResponse(runAudit(p, userEmail));
      case "getAuditIssues":
        return jsonResponse(getAuditIssues(p));
      case "getAuditSummary":
        return jsonResponse(getAuditSummary());
      case "resolveAuditIssue":
        return jsonResponse(resolveAuditIssue(p, userEmail));
      case "reopenAuditIssue":
        return jsonResponse(reopenAuditIssue(p, userEmail));
      case "assignAuditIssue":
        return jsonResponse(assignAuditIssue(p, userEmail));
      case "stageBankStatementLines":
        return jsonResponse(stageBankStatementLines(p, userEmail));
      case "getReconciliationCandidates":
        return jsonResponse(getReconciliationCandidates());
      case "matchReconciliationLine":
        return jsonResponse(matchReconciliationLine(p, userEmail));

      // PHASE 4: MONTHLY CLOSE & PERIOD LOCKING
      case "getMonthlyClose":
        return jsonResponse(getMonthlyClose(p));
      case "getMonthlyCloseReadiness":
        return jsonResponse(getMonthlyCloseReadiness(p));
      case "closeMonthlyPeriod":
        return jsonResponse(closeMonthlyPeriod(p, userEmail));
      case "reopenMonthlyPeriod":
        return jsonResponse(reopenMonthlyPeriod(p, userEmail));
      case "getMonthlyCloseHistory":
        return jsonResponse(getMonthlyCloseHistory(p));

      // PHASE 4: PRESBYTER REPORTING
      case "generatePresbyterReport":
        return jsonResponse(generatePresbyterReport(p, userEmail));
      case "getPresbyterReports":
        return jsonResponse(getPresbyterReports(p));
      case "sendPresbyterReport":
        return jsonResponse(sendPresbyterReport(p, userEmail));

      // MEMBERS
      case "addMember":
        return jsonResponse(addMember(p));
      case "getMembers":
        return jsonResponse(getMembers());

      // CONTRIBUTIONS
      case "addContribution":
        return jsonResponse(addContribution(p));
      case "getMemberYearlyContributions":
        return jsonResponse(getMemberYearlyContributions(p));

      // LETTERS / TAX
      case "getTaxLetterData":
        return jsonResponse(getTaxLetterData(p));
      case "generateYearlyTaxLettersBatch":
        return jsonResponse(generateYearlyTaxLettersBatch(p));
      case "generateIRSPdfLetter":
        return jsonResponse(generateIRSPdfLetter(p));
      case "generateBatchIRS":
        return jsonResponse(generateBatchIRS(p));

      // DASHBOARD / FINANCE
      case "getDashboardSummary":
        return jsonResponse(getDashboardSummary(p));
      case "generateSocalMonthlyReport":
        return jsonResponse(generateSocalMonthlyReport(p));

      // AI / ML / INTELLIGENCE
      case "detectDonorRisk":
        return jsonResponse(detectDonorRisk());
      case "forecastGivingML":
        return jsonResponse(forecastGivingML());
      case "segmentDonors":
        return jsonResponse(segmentDonors());
      case "getDonorLifetimeValue":
        return jsonResponse(getDonorLifetimeValue(p));
      case "detectPastoralCareNeeds":
        return jsonResponse(detectPastoralCareNeeds(p));
      case "analyzeHouseholdGiving":
        return jsonResponse(analyzeHouseholdGiving(p));
      case "detectGivingSeasonality":
        return jsonResponse(detectGivingSeasonality(p));

      // AUTOMATION
      case "runMonthlyAutomation":
        return jsonResponse(runMonthlyAutomation());

      // AUDIT
      case "logAuditEvent":
        return jsonResponse({ success: true });

      default:
        return jsonResponse({ success: false, error: "Unknown or unsupported action: " + action });
    }
  } catch (err) {
    Logger.log("API ERROR: " + (err && err.message ? err.message : String(err)));
    return jsonResponse({
      success: false,
      error: "Server processing error"
    });
  }
}

/**
 * Returns JSON content response
 */
function jsonResponse(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ======================================================
   MEMBERS
====================================================== */
function addMember(p) {
  p = p || {};
  const sheet = getDB().getSheetByName("MEMBERS");
  if (!sheet) throw new Error("MEMBERS sheet missing");

  const id = "MBR-" + Date.now();

  sheet.appendRow([
    id,
    p.fullName || "",
    p.familyName || "",
    p.address || "N/A",
    p.city || "N/A",
    p.state || "N/A",
    p.zip || "N/A",
    p.phone || "",
    p.email || "",
    p.language || "English",
    new Date(),
    p.envelopeNumber || "",
    "Active",
    p.notes || ""
  ]);

  return { success: true, memberId: id };
}

function getMembers() {
  const sheet = getDB().getSheetByName("MEMBERS");
  if (!sheet) throw new Error("MEMBERS sheet missing");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, members: [] };

  const headers = data.shift();
  const members = data.map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });

  return { success: true, members: members };
}

/* ======================================================
   CONTRIBUTIONS
====================================================== */
function addContribution(p) {
  p = p || {};
  const db = getDB();
  const contribSheet = db.getSheetByName("CONTRIBUTIONS");
  const memberSheet = db.getSheetByName("MEMBERS");

  if (!contribSheet) throw new Error("CONTRIBUTIONS sheet missing");
  if (!memberSheet) throw new Error("MEMBERS sheet missing");

  const id = "CTR-" + Date.now();

  contribSheet.appendRow([
    id,
    p.memberId || "",
    p.fullName || "",
    new Date(p.date || new Date()),
    p.serviceType || "Service",
    p.contributionType || "General Offering",
    Number(p.amount || 0),
    p.paymentMethod || "",
    p.notes || "",
    p.enteredBy || "System",
    new Date()
  ]);

  return { success: true, contributionId: id };
}

/* ======================================================
   YEARLY MEMBER STATEMENT
====================================================== */
function getMemberYearlyContributions(p) {
  p = p || {};
  if (!p.memberId) throw new Error("Missing memberId");

  const year = Number(p.year || new Date().getFullYear());

  const ss = getDB();
  const membersSheet = ss.getSheetByName("MEMBERS");
  const contribSheet = ss.getSheetByName("CONTRIBUTIONS");

  if (!membersSheet) throw new Error("MEMBERS sheet missing");
  if (!contribSheet) throw new Error("CONTRIBUTIONS sheet missing");

  const mData = membersSheet.getDataRange().getValues();
  const mHeaders = mData.shift();
  const memberRow = mData.find(function(r) { return r[0] === p.memberId; });

  if (!memberRow) return { success: true, member: null, contributions: [], total: 0, year: year };

  const member = {};
  mHeaders.forEach(function(h, i) { member[h] = memberRow[i]; });

  const cData = contribSheet.getDataRange().getValues();
  const cHeaders = cData.shift();

  const list = [];
  let total = 0;

  cData.forEach(function(r) {
    if (r[1] !== p.memberId) return;

    const d = new Date(r[3]);
    if (d.getFullYear() !== year) return;

    const obj = {};
    cHeaders.forEach(function(h, i) { obj[h] = r[i]; });

    list.push(obj);
    total += Number(r[6] || 0);
  });

  return {
    success: true,
    member: member,
    contributions: list,
    total: Number(total.toFixed(2)),
    year: year
  };
}

/* ======================================================
   TAX LETTER DATA
====================================================== */
function getTaxLetterData(p) {
  p = p || {};
  if (!p.memberId) throw new Error("Missing memberId");

  const year = Number(p.year || new Date().getFullYear());
  const result = getMemberYearlyContributions(p);

  return {
    success: true,
    member: result.member,
    contributions: result.contributions || [],
    total: result.total || 0,
    year: year,
    church: CHURCH_INFO
  };
}

/* ======================================================
   BATCH TAX LETTER DATA
====================================================== */
function generateYearlyTaxLettersBatch(p) {
  p = p || {};
  const year = Number(p.year || new Date().getFullYear());

  const ss = getDB();
  const membersSheet = ss.getSheetByName("MEMBERS");
  const contribSheet = ss.getSheetByName("CONTRIBUTIONS");

  if (!membersSheet || !contribSheet) throw new Error("Required sheet missing");

  const membersData = membersSheet.getDataRange().getValues();
  const membersHeaders = membersData.shift();

  const contribData = contribSheet.getDataRange().getValues();
  const contribHeaders = contribData.shift();

  const results = [];

  membersData.forEach(function(memberRow) {
    const memberId = memberRow[0];
    const member = {};
    membersHeaders.forEach(function(h, i) { member[h] = memberRow[i]; });

    let total = 0;
    const contributions = [];

    contribData.forEach(function(r) {
      if (r[1] !== memberId) return;

      const d = new Date(r[3]);
      if (d.getFullYear() !== year) return;

      const obj = {};
      contribHeaders.forEach(function(h, i) { obj[h] = r[i]; });

      contributions.push(obj);
      total += Number(r[6] || 0);
    });

    if (total > 0) {
      results.push({
        member: member,
        contributions: contributions,
        total: Number(total.toFixed(2)),
        year: year,
        church: CHURCH_INFO
      });
    }
  });

  return { success: true, year: year, count: results.length, letters: results };
}

/* ======================================================
   IRS PDF LETTER GENERATION
====================================================== */
function generateIRSPdfLetter(p) {
  p = p || {};
  if (!p.memberId) throw new Error("memberId required");

  const year = Number(p.year || new Date().getFullYear());
  const data = getMemberYearlyContributions(p);
  if (!data.member) throw new Error("Member not found");

  const doc = DocumentApp.create("GPBC IRS Letter " + (data.member.FullName || data.member.MemberID) + " " + year);
  const body = doc.getBody();

  body.appendParagraph(CHURCH_INFO.name).setBold(true).setFontSize(14);
  body.appendParagraph(CHURCH_INFO.address);
  body.appendParagraph("EIN: " + CHURCH_INFO.ein);
  body.appendParagraph("");
  body.appendParagraph("Date: " + new Date().toLocaleDateString());
  body.appendParagraph("");
  body.appendParagraph(data.member.FullName || "Member");
  body.appendParagraph(data.member.Address || "N/A");
  body.appendParagraph("");
  body.appendParagraph("Subject: Charitable Contribution Statement — " + year).setBold(true);
  body.appendParagraph("");
  body.appendParagraph(
    "This letter confirms that " + CHURCH_INFO.name +
    " received charitable contributions totaling $" +
    Number(data.total || 0).toFixed(2) +
    " during tax year " + year + "."
  );
  body.appendParagraph("");
  body.appendParagraph(
    CHURCH_INFO.name + " is a registered 501(c)(3) nonprofit organization. EIN: " + CHURCH_INFO.ein + "."
  );
  body.appendParagraph("");
  body.appendParagraph("Blessings,");
  body.appendParagraph(CHURCH_INFO.pastor);
  body.appendParagraph(CHURCH_INFO.name);

  doc.saveAndClose();

  return { success: true, docId: doc.getId(), year: year, total: Number(data.total || 0).toFixed(2) };
}

function generateBatchIRS(p) {
  p = p || {};
  const year = Number(p.year || new Date().getFullYear());

  const members = getDB().getSheetByName("MEMBERS").getDataRange().getValues();
  members.shift();

  let count = 0;
  members.forEach(function(r) {
    const id = r[0];
    const data = getMemberYearlyContributions({ memberId: id, year: year });
    if (Number(data.total || 0) > 0) {
      count++;
    }
  });

  return { success: true, year: year, count: count };
}

/* ======================================================
   DASHBOARD SUMMARY
====================================================== */
function getDashboardSummary(p) {
  p = p || {};
  const ss = getDB();

  const month = typeof p.month === "number" ? p.month : new Date().getMonth();
  const year = typeof p.year === "number" ? p.year : new Date().getFullYear();

  let tithe = 0;
  let offering = 0;
  let expenses = 0;

  const contribSheet = ss.getSheetByName("CONTRIBUTIONS");
  if (contribSheet) {
    const contrib = contribSheet.getDataRange().getValues();
    contrib.shift();

    contrib.forEach(function(r) {
      const d = new Date(r[3]);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (r[5] === "Tithe") tithe += Number(r[6] || 0);
        else offering += Number(r[6] || 0);
      }
    });
  }

  const expSheet = ss.getSheetByName("EXPENSES");
  if (expSheet) {
    const exp = expSheet.getDataRange().getValues();
    exp.shift();
    exp.forEach(function(r) {
      const d = new Date(r[1]);
      if (d.getMonth() === month && d.getFullYear() === year) {
        expenses += Number(r[4] || 0);
      }
    });
  }

  return {
    success: true,
    totals: {
      tithe: Number(tithe.toFixed(2)),
      offering: Number(offering.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      netBalance: Number((tithe + offering - expenses).toFixed(2))
    }
  };
}

/* ======================================================
   SOCAL EXPORT
====================================================== */
function generateSocalMonthlyReport(p) {
  p = p || {};
  const month = typeof p.month === "number" ? p.month : new Date().getMonth();
  const year = typeof p.year === "number" ? p.year : new Date().getFullYear();

  const db = getDB();
  const contribSheet = db.getSheetByName("CONTRIBUTIONS");
  const exportSheet = db.getSheetByName("SOCAL_REPORT_EXPORT");

  if (!contribSheet) throw new Error("CONTRIBUTIONS sheet missing");
  if (!exportSheet) throw new Error("SOCAL_REPORT_EXPORT sheet missing");

  const rows = contribSheet.getDataRange().getValues();
  const headers = rows.shift();

  const DATE = headers.indexOf("Date");
  const TYPE = headers.indexOf("ContributionType");
  const AMOUNT = headers.indexOf("Amount");

  let exported = 0;
  let total = 0;

  rows.forEach(function(r) {
    const d = new Date(r[DATE]);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;

    const amt = Number(r[AMOUNT] || 0);
    exportSheet.appendRow([
      month + 1,
      year,
      "Income",
      r[TYPE] || "Unknown",
      amt,
      "",
      new Date()
    ]);

    exported++;
    total += amt;
  });

  return { success: true, month: month + 1, year: year, exportedRows: exported, totalExported: Number(total.toFixed(2)) };
}

/* ======================================================
   DONOR RISK / ML PATTERNS
====================================================== */
function detectDonorRisk() {
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  data.shift();

  const map = {};
  data.forEach(function(r) {
    const id = r[1];
    const amt = Number(r[6] || 0);
    if (!id) return;
    if (!map[id]) map[id] = [];
    map[id].push(amt);
  });

  const risk = [];
  Object.keys(map).forEach(function(id) {
    const arr = map[id];
    if (arr.length < 6) return;

    const early = avg(arr.slice(0, 3));
    const late = avg(arr.slice(-3));

    if (early <= 0) return;

    const score = Math.max(0, 100 - (late / early * 100));
    if (score > 30) {
      risk.push({ memberId: id, riskScore: Math.round(score) });
    }
  });

  return { success: true, risk: risk };
}

function forecastGivingML() {
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  data.shift();

  const monthly = {};
  data.forEach(function(r) {
    const d = new Date(r[3]);
    const key = d.getFullYear() + "-" + (d.getMonth() + 1);
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += Number(r[6] || 0);
  });

  const vals = Object.values(monthly);
  if (vals.length < 4) return { success: true, prediction: null };

  const slope = linearRegression(vals);
  const next = vals[vals.length - 1] + slope;

  return { success: true, nextMonthPrediction: Number(next.toFixed(2)) };
}

function segmentDonors() {
  const r = detectDonorRisk();
  const risk = r.risk || [];

  return {
    success: true,
    segmentation: {
      core: risk.filter(function(x) { return x.riskScore < 15; }),
      watch: risk.filter(function(x) { return x.riskScore >= 15 && x.riskScore < 40; }),
      highRisk: risk.filter(function(x) { return x.riskScore >= 40; })
    }
  };
}

function getDonorLifetimeValue(p) {
  p = p || {};
  if (!p.memberId) throw new Error("memberId required");

  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const MEMBER = headers.indexOf("MemberID");
  const DATE = headers.indexOf("Date");
  const AMOUNT = headers.indexOf("Amount");

  let total = 0;
  let firstDate = null;
  let lastDate = null;
  let gifts = 0;

  data.forEach(function(r) {
    if (r[MEMBER] !== p.memberId) return;

    const amt = Number(r[AMOUNT] || 0);
    const d = new Date(r[DATE]);

    total += amt;
    gifts++;

    if (!firstDate || d < firstDate) firstDate = d;
    if (!lastDate || d > lastDate) lastDate = d;
  });

  if (!firstDate) return { success: true, memberId: p.memberId, donorValueScore: 0 };

  const years = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365));
  const yearlyAvg = total / years;
  const consistencyScore = Math.min(100, gifts * 4);

  return {
    success: true,
    memberId: p.memberId,
    lifetimeTotal: Number(total.toFixed(2)),
    yearlyAvg: Number(yearlyAvg.toFixed(2)),
    consistencyScore: Math.round(consistencyScore),
    donorValueScore: Math.round((yearlyAvg * 0.6) + (consistencyScore * 0.4))
  };
}

function detectPastoralCareNeeds(p) {
  p = p || {};
  const daysThreshold = Number(p.daysThreshold || 90);

  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const MEMBER = headers.indexOf("MemberID");
  const DATE = headers.indexOf("Date");

  const lastGiftMap = {};
  data.forEach(function(r) {
    const id = r[MEMBER];
    if (!id) return;

    const d = new Date(r[DATE]);
    if (!lastGiftMap[id] || d > lastGiftMap[id]) lastGiftMap[id] = d;
  });

  const alerts = [];
  const today = new Date();

  Object.keys(lastGiftMap).forEach(function(id) {
    const days = (today - lastGiftMap[id]) / (1000 * 60 * 60 * 24);
    if (days > daysThreshold) {
      alerts.push({
        memberId: id,
        lastGiftDate: lastGiftMap[id],
        daysSinceLastGift: Math.floor(days),
        alert: "No giving " + daysThreshold + "+ days",
        pastoralAction: "Check spiritual + family wellbeing"
      });
    }
  });

  return { success: true, daysThreshold: daysThreshold, alerts: alerts };
}

function analyzeHouseholdGiving(p) {
  p = p || {};
  const ss = getDB();
  const mSheet = ss.getSheetByName("MEMBERS");
  const cSheet = ss.getSheetByName("CONTRIBUTIONS");

  if (!mSheet) throw new Error("MEMBERS sheet missing");
  if (!cSheet) throw new Error("CONTRIBUTIONS sheet missing");

  const members = mSheet.getDataRange().getValues();
  const contrib = cSheet.getDataRange().getValues();

  const mHeaders = members.shift();
  const cHeaders = contrib.shift();

  const FAMILY = mHeaders.indexOf("FamilyName");
  const MID = mHeaders.indexOf("MemberID");
  const CMEMBER = cHeaders.indexOf("MemberID");
  const AMOUNT = cHeaders.indexOf("Amount");

  const familyMap = {};

  members.forEach(function(r) {
    const fam = r[FAMILY] || "Unknown";
    const id = r[MID];
    if (!id) return;
    if (!familyMap[fam]) familyMap[fam] = [];
    familyMap[fam].push(id);
  });

  const result = [];
  Object.keys(familyMap).forEach(function(fam) {
    let total = 0;

    contrib.forEach(function(c) {
      if (familyMap[fam].indexOf(c[CMEMBER]) !== -1) {
        total += Number(c[AMOUNT] || 0);
      }
    });

    result.push({ family: fam, total: Number(total.toFixed(2)), membersCount: familyMap[fam].length });
  });

  result.sort(function(a, b) { return b.total - a.total; });

  return { success: true, families: result };
}

function detectGivingSeasonality(p) {
  p = p || {};
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const DATE = headers.indexOf("Date");
  const AMOUNT = headers.indexOf("Amount");

  const monthMap = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  data.forEach(function(r) {
    const d = new Date(r[DATE]);
    monthMap[d.getMonth()] += Number(r[AMOUNT] || 0);
  });

  return {
    success: true,
    monthlyPattern: monthMap.map(function(v) { return Number(v.toFixed(2)); })
  };
}

function runMonthlyAutomation() {
  const today = new Date();
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const socal = generateSocalMonthlyReport({
    month: prev.getMonth(),
    year: prev.getFullYear()
  });

  const risk = detectDonorRisk();

  MailApp.sendEmail(
    CHURCH_INFO.email,
    "GPBC Monthly Ministry Report",
    "SoCal Export Completed.\n\n" +
    "SoCal Month: " + socal.month + "/" + socal.year + "\n" +
    "Rows Exported: " + socal.exportedRows + "\n" +
    "Total Exported: $" + socal.totalExported + "\n\n" +
    "High Risk Donors: " + (risk.risk ? risk.risk.length : 0)
  );

  return { success: true, socal: socal, highRiskCount: (risk.risk ? risk.risk.length : 0) };
}

/* ===============================
   UTIL
================================*/
function avg(a) {
  if (!a || !a.length) return 0;
  return a.reduce(function(x, y) { return x + y; }, 0) / a.length;
}

function linearRegression(arr) {
  const n = arr.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += arr[i];
    sumXY += i * arr[i];
    sumXX += i * i;
  }

  const denom = (n * sumXX - sumX * sumX);
  if (denom === 0) return 0;

  return (n * sumXY - sumX * sumY) / denom;
}
