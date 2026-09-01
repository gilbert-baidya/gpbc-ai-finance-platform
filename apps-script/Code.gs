/*************************************************
 GPBC PHASE 3 ULTRA ENTERPRISE SYSTEM — Code.gs
 IRS + LETTERHEAD + EMAIL + SOCAL EXPORT + AI/ML + PASTORAL INTELLIGENCE
*************************************************/

/* ===============================
   CHURCH CONFIG
================================*/
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
 * OPTIONAL: Upload your letterhead image to Google Drive and paste the FILE ID below.
 * If you leave it as "" then the system will skip adding the image.
 */
const LETTERHEAD_FILE_ID = ""; // e.g. "1AbCDefGhiJKlmnOPqrsTuvWxYZ012345"

/**
 * DEBUG FLAG: Set to true to enable data source logging
 * Logs which sheet is used for yearly totals (CONTRIBUTIONS vs IMPORT)
 */
const DEBUG_DATA_SOURCE = true;

/* ===============================
   HEALTH CHECK (Optional)
================================*/
function doGet() {
  return jsonResponse({
    service: "GPBC Finance API",
    status: "Running",
    environment: "Production",
    time: new Date().toISOString()
  });
}

/* ===============================
   ROUTER
================================*/
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (!validateApiKey(body.apiKey)) {
      return jsonResponse({ success: false, error: "Unauthorized" });
    }

    const action = (body.action || "").trim();
    const p = body.payload || {};

    switch (action) {
      // MEMBERS
      case "addMember": return jsonResponse(addMember(p));
      case "getMembers": return jsonResponse(getMembers());

      // CONTRIBUTIONS
      case "addContribution": return jsonResponse(addContribution(p));
      case "getMemberYearlyContributions": return jsonResponse(getMemberYearlyContributions(p));

      // LETTERS / TAX
      case "getTaxLetterData": return jsonResponse(getTaxLetterData(p));
      case "generateYearlyTaxLettersBatch": return jsonResponse(generateYearlyTaxLettersBatch(p));
      case "generateIRSPdfLetter": return jsonResponse(generateIRSPdfLetter(p));
      case "generateBatchIRS": return jsonResponse(generateBatchIRS(p));

      // DASHBOARD / FINANCE
      case "getDashboardSummary": return jsonResponse(getDashboardSummary(p));
      case "generateSocalMonthlyReport": return jsonResponse(generateSocalMonthlyReport(p));

      // AI / ML (PHASE 2+)
      case "detectDonorRisk": return jsonResponse(detectDonorRisk());
      case "forecastGivingML": return jsonResponse(forecastGivingML());
      case "segmentDonors": return jsonResponse(segmentDonors());

      // PHASE 3 INTELLIGENCE
      case "getDonorLifetimeValue": return jsonResponse(getDonorLifetimeValue(p));
      case "detectPastoralCareNeeds": return jsonResponse(detectPastoralCareNeeds(p));
      case "analyzeHouseholdGiving": return jsonResponse(analyzeHouseholdGiving(p));
      case "detectGivingSeasonality": return jsonResponse(detectGivingSeasonality(p));

      // AUTOMATION
      case "runMonthlyAutomation": return jsonResponse(runMonthlyAutomation());

      // SAFE AUDIT
      case "logAuditEvent": return jsonResponse({ success: true });

      default:
        return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    console.error("API ERROR:", err);
    return jsonResponse({ success: false, error: err && err.message ? err.message : String(err) });
  }
}

/* ===============================
   DB + SECURITY
================================*/
function getDB() {
  const id = PropertiesService.getScriptProperties().getProperty("GPBC_SHEET_ID");
  if (!id) throw new Error("GPBC_SHEET_ID not set");
  return SpreadsheetApp.openById(id);
}

function validateApiKey(k) {
  return k === PropertiesService.getScriptProperties().getProperty("GPBC_API_KEY");
}

function jsonResponse(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * DEBUG LOGGER: Safe logging for data source tracking
 */
function debugLog(label, obj) {
  if (!DEBUG_DATA_SOURCE) return;
  try {
    Logger.log("[DATA-SOURCE] " + label + " :: " + JSON.stringify(obj));
  } catch(e) {
    Logger.log("[DATA-SOURCE] " + label);
  }
}

/* ======================================================
   MEMBERS
====================================================== */
function addMember(p = {}) {
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
  const members = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  return { success: true, members };
}

/* ======================================================
   CONTRIBUTIONS
====================================================== */
function addContribution(p = {}) {
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

  // Auto email (safe try/catch)
  sendAutoThankYouEmail(p, memberSheet);

  return { success: true, contributionId: id };
}

function sendAutoThankYouEmail(p, memberSheet) {
  try {
    if (!p.memberId || !memberSheet) return;

    const members = memberSheet.getDataRange().getValues();
    const headers = members.shift();

    const emailIndex = headers.indexOf("Email");
    const nameIndex = headers.indexOf("FullName");

    const found = members.find(r => r[0] === p.memberId);
    if (!found) return;

    const email = found[emailIndex];
    const name = found[nameIndex] || "Friend";
    if (!email) return;

    MailApp.sendEmail(
      email,
      "Thank You For Your Giving - GPBC",
`Dear ${name},

Thank you for your contribution of $${p.amount}.

${CHURCH_INFO.name} is a registered 501(c)(3) nonprofit organization.
EIN: ${CHURCH_INFO.ein}

Grace and Peace,
${CHURCH_INFO.name}`
    );
  } catch (err) {
    console.log("Auto email failed:", err);
  }
}

/* ======================================================
   YEARLY MEMBER STATEMENT
====================================================== */
function getMemberYearlyContributions(p = {}) {
  if (!p.memberId) throw new Error("Missing memberId");

  const year = Number(p.year || new Date().getFullYear());

  const ss = getDB();
  const membersSheet = ss.getSheetByName("MEMBERS");
  const contribSheet = ss.getSheetByName("CONTRIBUTIONS");

  if (!membersSheet) throw new Error("MEMBERS sheet missing");
  if (!contribSheet) throw new Error("CONTRIBUTIONS sheet missing");

  const mData = membersSheet.getDataRange().getValues();
  const mHeaders = mData.shift();
  const memberRow = mData.find(r => r[0] === p.memberId);

  if (!memberRow) return { success: true, member: null, contributions: [], total: 0, year };

  const member = {};
  mHeaders.forEach((h, i) => member[h] = memberRow[i]);

  const cData = contribSheet.getDataRange().getValues();
  const cHeaders = cData.shift();

  const list = [];
  let total = 0;

  cData.forEach(r => {
    if (r[1] !== p.memberId) return;

    const d = new Date(r[3]);
    if (d.getFullYear() !== year) return;

    const obj = {};
    cHeaders.forEach((h, i) => obj[h] = r[i]);

    list.push(obj);
    total += Number(r[6] || 0);
  });

  return {
    success: true,
    member,
    contributions: list,
    total: Number(total.toFixed(2)),
    year
  };
}

/* ======================================================
   TAX LETTER DATA
====================================================== */
function getTaxLetterData(p = {}) {
  if (!p.memberId) throw new Error("Missing memberId");

  const year = Number(p.year || new Date().getFullYear());
  const result = getMemberYearlyData(p.memberId, year);

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
   BATCH TAX LETTER DATA (JSON)
====================================================== */
function generateYearlyTaxLettersBatch(p = {}) {
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

  membersData.forEach(memberRow => {
    const memberId = memberRow[0];

    const member = {};
    membersHeaders.forEach((h, i) => member[h] = memberRow[i]);

    let total = 0;
    const contributions = [];

    contribData.forEach(r => {
      if (r[1] !== memberId) return;

      const d = new Date(r[3]);
      if (d.getFullYear() !== year) return;

      const obj = {};
      contribHeaders.forEach((h, i) => obj[h] = r[i]);

      contributions.push(obj);
      total += Number(r[6] || 0);
    });

    if (total > 0) {
      results.push({
        member,
        contributions,
        total: Number(total.toFixed(2)),
        year,
        church: CHURCH_INFO
      });
    }
  });

  return { success: true, year, count: results.length, letters: results };
}

/* ======================================================
   IRS PDF — REAL LETTERHEAD + AUTO EMAIL
   NOTE: this creates a Google Doc then emails PDF attachment if member email exists.
====================================================== */
function generateIRSPdfLetter(p = {}) {
  if (!p.memberId) throw new Error("memberId required");

  const year = Number(p.year || new Date().getFullYear());
  const data = getMemberYearlyData(p.memberId, year);
  if (!data.member) throw new Error("Member not found");

  const doc = DocumentApp.create("GPBC IRS Letter " + (data.member.FullName || data.member.MemberID) + " " + year);
  const body = doc.getBody();

  try {
    if (LETTERHEAD_FILE_ID && LETTERHEAD_FILE_ID.trim() !== "") {
      const blob = DriveApp.getFileById(LETTERHEAD_FILE_ID).getBlob();

      // Create controlled paragraph container
      const headerPara = body.appendParagraph("");
      headerPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      // Insert image safely
      const img = headerPara.appendInlineImage(blob);

      // SAFE ENTERPRISE WIDTH (prevents cropping)
      img.setWidth(520);

      // Spacing after letterhead
      headerPara.setSpacingAfter(15);

      Logger.log("[LETTERHEAD] Loaded + Scaled");
    } else {
      throw new Error("Letterhead file ID missing");
    }
  } catch (err) {
    Logger.log("[LETTERHEAD FALLBACK] " + err);
    body.appendParagraph(CHURCH_INFO.name).setBold(true).setFontSize(14);
    body.appendParagraph(CHURCH_INFO.address);
    body.appendParagraph("EIN: " + CHURCH_INFO.ein);
    body.appendParagraph("");
  }

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
  body.appendParagraph("Bible Verse: Luke 6:38 — Give, and it will be given to you.");
  body.appendParagraph("");
  body.appendParagraph("Blessings,");
  body.appendParagraph(CHURCH_INFO.pastor);
  body.appendParagraph(CHURCH_INFO.name);

  doc.saveAndClose();

  const pdf = DriveApp.getFileById(doc.getId()).getAs("application/pdf");

  // Auto email PDF
  const email = data.member.Email;
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: "Your " + year + " Giving Statement — GPBC",
      body: "Thank you for your faithful giving. Please find your statement attached.",
      attachments: [pdf]
    });
  }

  return { success: true, docId: doc.getId(), year, total: Number(data.total || 0).toFixed(2) };
}

/* ======================================================
   MEMBER YEAR DATA (FAST TOTAL FOR PDF)
====================================================== */
/* ======================================================
   MEMBER YEAR DATA — ULTRA SAFE ENTERPRISE VERSION
   IMPORT 2025 = SOURCE OF TRUTH (Donor Name + Total ONLY)
   FALLBACK = CONTRIBUTIONS SHEET
====================================================== */
function getMemberYearlyData(memberId, year) {

  debugLog("REQUEST", { memberId, year });

  const db = getDB();

  const mSheet = db.getSheetByName("MEMBERS");
  const cSheet = db.getSheetByName("CONTRIBUTIONS");
  const importSheet = db.getSheetByName("IMPORT_2025_CONTRIBUTIONS");

  if (!mSheet) throw new Error("MEMBERS sheet missing");

  const mData = mSheet.getDataRange().getValues();
  const mHeaders = mData.shift();
  const memberRow = mData.find(r => r[0] === memberId);

  if (!memberRow) {
    debugLog("MEMBER_NOT_FOUND", { memberId });
    return { member: null, total: 0 };
  }

  const member = {};
  mHeaders.forEach((h, i) => member[h] = memberRow[i]);

  let total = 0;
  let importMatched = false;

  const normalize = s =>
    String(s || "")
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const parseCurrency = val => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[$,]/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  /* =============================
     🔥 IMPORT 2025 — SOURCE OF TRUTH
  ============================== */
  if (importSheet && Number(year) === 2025) {

    const iData = importSheet.getDataRange().getValues();

    if (!iData || iData.length < 2) {
      debugLog("IMPORT_NO_DATA", {});
      return { member, total: 0 };
    }

    let headerRowIndex = -1;
    let NAME_COL = -1;
    let TOTAL_COL = -1;

    for (let i = 0; i < Math.min(10, iData.length); i++) {
      const row = iData[i];

      for (let j = 0; j < row.length; j++) {
        const cell = normalize(row[j]);

        if (cell.includes("donor") && cell.includes("name")) NAME_COL = j;
        if (cell === "total") TOTAL_COL = j;
      }

      if (NAME_COL !== -1 && TOTAL_COL !== -1) {
        headerRowIndex = i;
        break;
      }
    }

    debugLog("IMPORT_HEADER_DETECTED", {
      headerRowIndex,
      NAME_COL,
      TOTAL_COL
    });

    if (headerRowIndex !== -1 && NAME_COL !== -1 && TOTAL_COL !== -1) {

      const normalizedMemberName = normalize(member.FullName || member.Name || "");

      for (let i = headerRowIndex + 1; i < iData.length; i++) {

        const donorName = String(iData[i][NAME_COL] || "").trim();
        if (!donorName) continue;

        const normalizedDonor = normalize(donorName);

        if (normalizedDonor === normalizedMemberName) {

          total = parseCurrency(iData[i][TOTAL_COL]);
          importMatched = true;

          debugLog("IMPORT_MATCH_FOUND", {
            donorName,
            total,
            rowIndex: i
          });

          break;
        }
      }
    }
  }

  /* =============================
     FALLBACK → CONTRIBUTIONS
  ============================== */
  if (!importMatched && cSheet) {

    const cData = cSheet.getDataRange().getValues();
    const cHeaders = cData.shift();

    const MID = cHeaders.indexOf("MemberID");
    const DATE = cHeaders.indexOf("Date");
    const AMT = cHeaders.indexOf("Amount");

    cData.forEach(r => {
      if (r[MID] !== memberId) return;
      if (new Date(r[DATE]).getFullYear() !== Number(year)) return;
      total += Number(r[AMT] || 0);
    });

    debugLog("CONTRIBUTION_FALLBACK_TOTAL", { total });
  }

  debugLog("FINAL_TOTAL", {
    memberId,
    year,
    total,
    source: importMatched ? "IMPORT_2025" : "CONTRIBUTIONS"
  });

  return {
    member,
    total: Number(total.toFixed(2)),
    debug: DEBUG_DATA_SOURCE ? {
      year,
      source: importMatched ? "IMPORT_2025" : "CONTRIBUTIONS"
    } : undefined
  };
}

/* ======================================================
   BATCH IRS PDF (creates + emails each)
====================================================== */
function generateBatchIRS(p = {}) {
  const year = Number(p.year || new Date().getFullYear());

  const members = getDB().getSheetByName("MEMBERS").getDataRange().getValues();
  members.shift();

  let count = 0;

  members.forEach(r => {
    const id = r[0];
    const data = getMemberYearlyData(id, year);
    if (Number(data.total || 0) > 0) {
      generateIRSPdfLetter({ memberId: id, year });
      count++;
    }
  });

  return { success: true, year, count };
}

/* ======================================================
   DASHBOARD SUMMARY
====================================================== */
function getDashboardSummary(p = {}) {
  const ss = getDB();

  const month = Number(p.month); // 0-based month from UI
  const year = Number(p.year);

  let tithe = 0;
  let offering = 0;
  let expenses = 0;

  const contrib = ss.getSheetByName("CONTRIBUTIONS").getDataRange().getValues();
  contrib.shift();

  contrib.forEach(r => {
    const d = new Date(r[3]);
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (r[5] === "Tithe") tithe += Number(r[6]);
      else offering += Number(r[6]);
    }
  });

  const expSheet = ss.getSheetByName("EXPENSES");
  if (expSheet) {
    const exp = expSheet.getDataRange().getValues();
    exp.shift();
    exp.forEach(r => {
      const d = new Date(r[1]);
      if (d.getMonth() === month && d.getFullYear() === year) {
        expenses += Number(r[4]);
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
   Writes rows into SOCAL_REPORT_EXPORT for selected month/year
====================================================== */
function generateSocalMonthlyReport(p = {}) {
  const month = Number(p.month); // 0-based
  const year = Number(p.year);

  const db = getDB();
  const contribSheet = db.getSheetByName("CONTRIBUTIONS");
  const exportSheet = db.getSheetByName("SOCAL_REPORT_EXPORT");

  if (!contribSheet) throw new Error("CONTRIBUTIONS sheet missing");
  if (!exportSheet) throw new Error("SOCAL_REPORT_EXPORT sheet missing (run setup first)");

  const rows = contribSheet.getDataRange().getValues();
  const headers = rows.shift();

  const DATE = headers.indexOf("Date");
  const TYPE = headers.indexOf("ContributionType");
  const AMOUNT = headers.indexOf("Amount");

  let exported = 0;
  let total = 0;

  rows.forEach(r => {
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

  return { success: true, month: month + 1, year, exportedRows: exported, totalExported: Number(total.toFixed(2)) };
}

/* ======================================================
   🤖 DONOR RISK ML (simple pattern)
====================================================== */
function detectDonorRisk() {
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  data.shift();

  const map = {};
  data.forEach(r => {
    const id = r[1];
    const amt = Number(r[6] || 0);
    if (!id) return;
    if (!map[id]) map[id] = [];
    map[id].push(amt);
  });

  const risk = [];
  Object.keys(map).forEach(id => {
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

  return { success: true, risk };
}

/* ======================================================
   📈 ML FORECAST (simple regression on monthly totals)
====================================================== */
function forecastGivingML() {
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  data.shift();

  const monthly = {};
  data.forEach(r => {
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

/* ======================================================
   SEGMENT DONORS based on risk score
====================================================== */
function segmentDonors() {
  const r = detectDonorRisk();
  const risk = r.risk || [];

  return {
    success: true,
    segmentation: {
      core: risk.filter(x => x.riskScore < 15),
      watch: risk.filter(x => x.riskScore >= 15 && x.riskScore < 40),
      highRisk: risk.filter(x => x.riskScore >= 40)
    }
  };
}

/* ======================================================
   PHASE 3: DONOR LIFETIME VALUE
====================================================== */
function getDonorLifetimeValue(p = {}) {
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

  data.forEach(r => {
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

/* ======================================================
   PHASE 3: PASTORAL CARE ALERT ENGINE
   Rule: no gift for X days => alert
====================================================== */
function detectPastoralCareNeeds(p = {}) {
  const daysThreshold = Number(p.daysThreshold || 90);

  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const MEMBER = headers.indexOf("MemberID");
  const DATE = headers.indexOf("Date");

  const lastGiftMap = {};
  data.forEach(r => {
    const id = r[MEMBER];
    if (!id) return;

    const d = new Date(r[DATE]);
    if (!lastGiftMap[id] || d > lastGiftMap[id]) lastGiftMap[id] = d;
  });

  const alerts = [];
  const today = new Date();

  Object.keys(lastGiftMap).forEach(id => {
    const days = (today - lastGiftMap[id]) / (1000 * 60 * 60 * 24);
    if (days > daysThreshold) {
      alerts.push({
        memberId: id,
        lastGiftDate: lastGiftMap[id],
        daysSinceLastGift: Math.floor(days),
        alert: `No giving ${daysThreshold}+ days`,
        pastoralAction: "Check spiritual + family wellbeing"
      });
    }
  });

  return { success: true, daysThreshold, alerts };
}

/* ======================================================
   PHASE 3: HOUSEHOLD / FAMILY GIVING INTELLIGENCE
====================================================== */
function analyzeHouseholdGiving(p = {}) {
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

  members.forEach(r => {
    const fam = r[FAMILY] || "Unknown";
    const id = r[MID];
    if (!id) return;
    if (!familyMap[fam]) familyMap[fam] = [];
    familyMap[fam].push(id);
  });

  const result = [];
  Object.keys(familyMap).forEach(fam => {
    let total = 0;

    contrib.forEach(c => {
      if (familyMap[fam].includes(c[CMEMBER])) {
        total += Number(c[AMOUNT] || 0);
      }
    });

    result.push({ family: fam, total: Number(total.toFixed(2)), membersCount: familyMap[fam].length });
  });

  // Sort descending by total
  result.sort((a, b) => b.total - a.total);

  return { success: true, families: result };
}

/* ======================================================
   PHASE 3: GIVING SEASONALITY AI (monthly totals)
====================================================== */
function detectGivingSeasonality(p = {}) {
  const sheet = getDB().getSheetByName("CONTRIBUTIONS");
  if (!sheet) throw new Error("CONTRIBUTIONS sheet missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const DATE = headers.indexOf("Date");
  const AMOUNT = headers.indexOf("Amount");

  const monthMap = Array(12).fill(0);

  data.forEach(r => {
    const d = new Date(r[DATE]);
    monthMap[d.getMonth()] += Number(r[AMOUNT] || 0);
  });

  return {
    success: true,
    monthlyPattern: monthMap.map(v => Number(v.toFixed(2)))
  };
}

/* ======================================================
   MONTHLY AUTOMATION
   - runs previous month SoCal export
   - emails summary to CHURCH_INFO.email
====================================================== */
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
    "GPBC Monthly AI Ministry Report",
    "SoCal Export Completed.\n\n" +
    "SoCal Month: " + socal.month + "/" + socal.year + "\n" +
    "Rows Exported: " + socal.exportedRows + "\n" +
    "Total Exported: $" + socal.totalExported + "\n\n" +
    "High Risk Donors: " + (risk.risk ? risk.risk.length : 0)
  );

  return { success: true, socal, highRiskCount: (risk.risk ? risk.risk.length : 0) };
}

/* ===============================
   UTIL
================================*/
function findHeaderIndex(headers, target) {
  target = target.toLowerCase().trim();
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || "").toLowerCase().trim();
    if (h === target) return i;
  }
  return -1;
}

function avg(a) {
  if (!a || !a.length) return 0;
  return a.reduce((x, y) => x + y, 0) / a.length;
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
