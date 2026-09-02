/*************************************************
 * GPBC Finance Desk — Transactions.gs
 * Master Ledger, Income, Expenses, and Canonical Capital Projects
 *************************************************/

// In Node/test environment, load FinanceMath helpers
if (typeof require !== "undefined" && typeof assertPeriodWritable === "undefined") {
  const financeMath = require("./FinanceMath.gs");
  global.assertPeriodWritable = financeMath.assertPeriodWritable;
  global.getPeriodKey = financeMath.getPeriodKey;
  global.getPeriodBounds = financeMath.getPeriodBounds;
  global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  global.calculatePurchaseBalance = financeMath.calculatePurchaseBalance;
}

/**
 * Idempotently initializes the schema in the sandbox spreadsheet
 * NEVER creates duplicate header rows.
 */
function initializeSandboxSchema() {
  assertSandboxSheet("initializeSandboxSchema");
  const db = getDB(true, "initializeSandboxSchema");
  const initializedTabs = [];

  Object.keys(SCHEMA_DEFINITIONS).forEach(function(tabName) {
    const headers = SCHEMA_DEFINITIONS[tabName];
    let sheet = db.getSheetByName(tabName);

    if (!sheet) {
      sheet = db.insertSheet(tabName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#FAF6F0");
      initializedTabs.push({ tab: tabName, action: "created" });
    } else {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();

      if (lastRow === 0 || lastCol === 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#FAF6F0");
        initializedTabs.push({ tab: tabName, action: "headers_initialized" });
      } else {
        // Tab exists with rows; verify existing headers
        const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
        const missing = headers.filter(function(h) { return existingHeaders.indexOf(h) === -1; });
        if (missing.length > 0) {
          missing.forEach(function(h) {
            sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight("bold");
          });
          initializedTabs.push({ tab: tabName, action: "headers_extended", added: missing });
        } else {
          initializedTabs.push({ tab: tabName, action: "verified" });
        }
      }
    }
  });

  return {
    success: true,
    spreadsheetId: db.getId(),
    results: initializedTabs
  };
}

/**
 * Retrieves master transactions with search, type, direction, and fund filters.
 * Transparently falls back to legacy CONTRIBUTIONS/EXPENSES if Transactions is not yet populated.
 */
function getTransactions(p) {
  p = p || {};
  const db = getDB(false, "getTransactions");
  const sheet = db.getSheetByName("Transactions");
  let transactions = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    transactions = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.amount = Number(obj.amount || 0);
      obj.personalPurchase = (obj.personalPurchase === true || obj.personalPurchase === "TRUE" || obj.personalPurchase === "true");
      obj.accountingImpact = obj.accountingImpact || (obj.transactionType === "Reimbursement" ? "SETTLEMENT" : obj.direction);
      return obj;
    });
  } else {
    // Read Adapter: Synthesize canonical transactions from legacy CONTRIBUTIONS & EXPENSES
    const contribSheet = db.getSheetByName("CONTRIBUTIONS");
    if (contribSheet && contribSheet.getLastRow() > 1) {
      const cData = contribSheet.getDataRange().getValues();
      cData.shift();
      cData.forEach(function(r) {
        const d = r[3] ? new Date(r[3]).toISOString().split("T")[0] : "";
        const cType = String(r[5] || "General Offering");
        const fund = (cType.toLowerCase().includes("building") || cType.toLowerCase().includes("mission")) ? "Designated" : "General";
        transactions.push({
          transactionId: String(r[0] || ("TXN-CTR-" + Date.now())),
          transactionDate: d,
          transactionType: cType.includes("Tithe") ? "General Donation" : (cType.includes("Building") ? "Designated Donation" : "Sunday Offering"),
          direction: "INCOME",
          accountingImpact: "INCOME",
          amount: Number(r[6] || 0),
          payeeOrPayer: String(r[2] || "Member"),
          description: String(r[4] || "") + (r[8] ? " - " + String(r[8]) : ""),
          category: "Tithes & Offerings",
          fundId: fund,
          capitalProjectId: "",
          paymentMethod: String(r[7] || "Cash"),
          checkNumber: "",
          personalPurchase: false,
          claimantName: "",
          reconciliationStatus: "Reconciled",
          receiptStatus: "Exempt",
          receiptId: "",
          notes: String(r[8] || ""),
          createdBy: String(r[9] || "System"),
          createdAt: r[10] ? new Date(r[10]).toISOString() : ""
        });
      });
    }

    const expSheet = db.getSheetByName("EXPENSES");
    if (expSheet && expSheet.getLastRow() > 1) {
      const eData = expSheet.getDataRange().getValues();
      eData.shift();
      eData.forEach(function(r) {
        const d = r[1] ? new Date(r[1]).toISOString().split("T")[0] : "";
        transactions.push({
          transactionId: String(r[0] || ("TXN-EXP-" + Date.now())),
          transactionDate: d,
          transactionType: "Expense",
          direction: "EXPENSE",
          accountingImpact: "EXPENSE",
          amount: Number(r[4] || 0),
          payeeOrPayer: String(r[3] || "Vendor"),
          description: String(r[2] || "Expense") + (r[6] ? " - " + String(r[6]) : ""),
          category: String(r[2] || "Ministry Expense"),
          fundId: "General",
          capitalProjectId: "",
          paymentMethod: String(r[5] || "Check"),
          checkNumber: "",
          personalPurchase: false,
          claimantName: "",
          reconciliationStatus: "Unreconciled",
          receiptStatus: "Needs Receipt",
          receiptId: "",
          notes: String(r[6] || ""),
          createdBy: "System",
          createdAt: r[7] ? new Date(r[7]).toISOString() : ""
        });
      });
    }
  }

  // Apply filters
  if (p.direction) {
    transactions = transactions.filter(function(t) { return t.direction === p.direction; });
  }
  if (p.accountingImpact) {
    transactions = transactions.filter(function(t) { return t.accountingImpact === p.accountingImpact; });
  }
  if (p.transactionType) {
    transactions = transactions.filter(function(t) { return t.transactionType === p.transactionType; });
  }
  if (p.fundId) {
    transactions = transactions.filter(function(t) { return t.fundId === p.fundId; });
  }
  if (p.capitalProjectId) {
    transactions = transactions.filter(function(t) { return t.capitalProjectId === p.capitalProjectId; });
  }
  if (p.personalPurchase !== undefined) {
    transactions = transactions.filter(function(t) { return t.personalPurchase === p.personalPurchase; });
  }
  if (p.startDate) {
    transactions = transactions.filter(function(t) { return t.transactionDate >= p.startDate; });
  }
  if (p.endDate) {
    transactions = transactions.filter(function(t) { return t.transactionDate <= p.endDate; });
  }
  if (p.search) {
    const q = String(p.search).toLowerCase();
    transactions = transactions.filter(function(t) {
      return (t.payeeOrPayer && t.payeeOrPayer.toLowerCase().includes(q)) ||
             (t.description && t.description.toLowerCase().includes(q)) ||
             (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
             (t.category && t.category.toLowerCase().includes(q));
    });
  }

  // Sort descending by date
  transactions.sort(function(a, b) {
    return (b.transactionDate || "").localeCompare(a.transactionDate || "");
  });

  return {
    success: true,
    totalCount: transactions.length,
    transactions: transactions
  };
}

/**
 * Adds a master transaction with financial invariant validation and period-lock protection
 */
function addTransaction(p, userEmail) {
  p = p || {};
  if (!p.amount || isNaN(Number(p.amount)) || Number(p.amount) <= 0) {
    throw new Error("Transaction amount must be a positive number");
  }
  if (!p.transactionDate) {
    throw new Error("Transaction date is required");
  }
  if (!p.direction || ["INCOME", "EXPENSE", "TRANSFER"].indexOf(p.direction) === -1) {
    throw new Error("Invalid transaction direction");
  }
  if (!p.payeeOrPayer) {
    throw new Error("Payee or Payer is required");
  }

  const db = getDB(true, "addTransaction");

  // Server-Side Period Lock Guard
  assertPeriodWritable(p.transactionDate, "addTransaction", userEmail, db);

  let sheet = db.getSheetByName("Transactions");
  if (!sheet) {
    initializeSandboxSchema();
    sheet = db.getSheetByName("Transactions");
  }

  const id = p.transactionId || ("TXN-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + "-" + Math.floor(10000 + Math.random() * 90000));
  const nowIso = new Date().toISOString();
  const actor = userEmail || "Anonymous";
  const type = p.transactionType || (p.direction === "INCOME" ? "Sunday Offering" : "Expense");
  const impact = p.accountingImpact || (type === "Reimbursement" ? "SETTLEMENT" : p.direction);

  sheet.appendRow([
    id,
    p.transactionDate,
    type,
    p.direction,
    impact,
    Number(p.amount),
    p.payeeOrPayer,
    p.description || "",
    p.category || "General",
    p.fundId || "General",
    p.capitalProjectId || "",
    p.paymentMethod || "Cash",
    p.checkNumber || "",
    p.personalPurchase ? true : false,
    p.claimantName || "",
    p.reconciliationStatus || "Unreconciled",
    p.receiptStatus || (p.direction === "EXPENSE" ? "Needs Receipt" : "Exempt"),
    p.receiptId || "",
    p.notes || "",
    actor,
    nowIso,
    actor,
    nowIso
  ]);

  return { success: true, transactionId: id };
}

/**
 * Updates a transaction with period-lock checking
 */
function updateTransaction(p, userEmail) {
  p = p || {};
  if (!p.transactionId) throw new Error("transactionId is required");

  const db = getDB(true, "updateTransaction");
  const sheet = db.getSheetByName("Transactions");
  if (!sheet) throw new Error("Transactions tab missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("transactionId");
  const dateCol = headers.indexOf("transactionDate");
  const idx = data.findIndex(function(r) { return r[idCol] === p.transactionId; });
  if (idx === -1) throw new Error("Transaction not found: " + p.transactionId);

  const existingRow = data[idx];
  const existingDate = existingRow[dateCol];

  // Period Lock Guard on existing transaction date and target date
  assertPeriodWritable(existingDate, "updateTransaction (Current Date)", userEmail, db);
  if (p.transactionDate) {
    assertPeriodWritable(p.transactionDate, "updateTransaction (New Date)", userEmail, db);
  }

  const rowNum = idx + 2;
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";

  headers.forEach(function(h, cIdx) {
    if (p[h] !== undefined && h !== "transactionId" && h !== "createdAt" && h !== "createdBy") {
      sheet.getRange(rowNum, cIdx + 1).setValue(p[h]);
    }
  });

  const updatedByCol = headers.indexOf("updatedBy") + 1;
  const updatedAtCol = headers.indexOf("updatedAt") + 1;
  if (updatedByCol > 0) sheet.getRange(rowNum, updatedByCol).setValue(actor);
  if (updatedAtCol > 0) sheet.getRange(rowNum, updatedAtCol).setValue(nowIso);

  return { success: true, transactionId: p.transactionId };
}

/**
 * Adds an Income entry and linked Transaction
 */
function addIncome(p, userEmail) {
  p = p || {};
  const amount = Number(p.amount || 0);
  if (amount <= 0) throw new Error("Income amount must be greater than zero");
  if (!p.date) throw new Error("Income date is required");

  const db = getDB(true, "addIncome");

  // Server-Side Period Lock Guard
  assertPeriodWritable(p.date, "addIncome", userEmail, db);

  let incSheet = db.getSheetByName("Income Detail");
  if (!incSheet) {
    initializeSandboxSchema();
    incSheet = db.getSheetByName("Income Detail");
  }

  const incomeId = "INC-" + Date.now();
  const txResult = addTransaction({
    transactionDate: p.date,
    transactionType: p.incomeType || "Sunday Offering",
    direction: "INCOME",
    accountingImpact: "INCOME",
    amount: amount,
    payeeOrPayer: p.donorName || "Anonymous Donor",
    description: (p.serviceType ? p.serviceType + " - " : "") + (p.notes || "Donation"),
    category: "Tithes & Offerings",
    fundId: p.fundId || "General",
    capitalProjectId: p.capitalProjectId || "",
    paymentMethod: p.paymentMethod || "Cash",
    checkNumber: p.checkNumber || "",
    notes: p.notes || ""
  }, userEmail);

  incSheet.appendRow([
    incomeId,
    p.date,
    p.memberOrDonorId || "",
    p.donorName || "Anonymous",
    p.incomeType || "Sunday Offering",
    p.serviceType || "Sunday Service",
    amount,
    p.fundId || "General",
    p.capitalProjectId || "",
    p.paymentMethod || "Cash",
    p.checkNumber || "",
    p.envelopeNumber || "",
    p.notes || "",
    txResult.transactionId,
    userEmail || "System",
    new Date().toISOString()
  ]);

  return { success: true, incomeId: incomeId, transactionId: txResult.transactionId };
}

/**
 * Adds an Expense entry and linked Transaction
 */
function addExpense(p, userEmail) {
  p = p || {};
  const amount = Number(p.amount || 0);
  if (amount <= 0) throw new Error("Expense amount must be greater than zero");
  if (!p.date) throw new Error("Expense date is required");
  if (!p.payee) throw new Error("Payee/Vendor is required");

  const db = getDB(true, "addExpense");

  // Server-Side Period Lock Guard
  assertPeriodWritable(p.date, "addExpense", userEmail, db);

  let expSheet = db.getSheetByName("Expense Detail");
  if (!expSheet) {
    initializeSandboxSchema();
    expSheet = db.getSheetByName("Expense Detail");
  }

  const expenseId = "EXP-" + Date.now();
  const isPersonal = (p.personalCardPurchase === true || p.personalPurchase === true);
  const txnType = isPersonal ? "Personal-Card Church Purchase" : (p.capitalProjectId ? "Capital Project Expense" : "Expense");

  const txResult = addTransaction({
    transactionDate: p.date,
    transactionType: txnType,
    direction: "EXPENSE",
    accountingImpact: "EXPENSE", // Personal purchases recognize church operating expense at purchase time
    amount: amount,
    payeeOrPayer: p.payee,
    description: p.purpose || p.category || "Church Expense",
    category: p.category || "Ministry Expense",
    fundId: p.fundId || "General",
    capitalProjectId: p.capitalProjectId || "",
    paymentMethod: p.paymentMethod || (isPersonal ? "Personal Card" : "Check"),
    checkNumber: p.checkNumber || "",
    personalPurchase: isPersonal,
    claimantName: isPersonal ? (p.claimantName || "") : "",
    receiptStatus: p.receiptId ? "Attached" : "Needs Receipt",
    receiptId: p.receiptId || "",
    notes: p.notes || ""
  }, userEmail);

  expSheet.appendRow([
    expenseId,
    p.date,
    p.payee,
    amount,
    p.category || "General",
    p.purpose || "",
    p.paymentMethod || (isPersonal ? "Personal Card" : "Check"),
    p.checkNumber || "",
    p.fundId || "General",
    p.capitalProjectId || "",
    isPersonal,
    isPersonal ? (p.claimantName || "") : "",
    p.receiptId || "",
    p.notes || "",
    txResult.transactionId,
    userEmail || "System",
    new Date().toISOString()
  ]);

  return { success: true, expenseId: expenseId, transactionId: txResult.transactionId };
}

/**
 * Retrieves Capital Projects with CANONICAL DERIVED financial totals from Transactions
 */
function getCapitalProjects() {
  const db = getDB(false, "getCapitalProjects");
  const sheet = db.getSheetByName("Capital_Projects");
  const projects = [];

  // Read transactions to derive canonical project totals
  const txRes = getTransactions();
  const allTxs = txRes.transactions || [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    data.forEach(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      obj.approvedBudget = Number(obj.approvedBudget || 0);
      obj.pendingCommitments = Number(obj.pendingCommitments || 0);

      // Derive totals strictly from canonical transactions matching projectId
      const pId = obj.projectId;
      const projectTxs = allTxs.filter(function(t) { return t.capitalProjectId === pId; });

      const donations = projectTxs
        .filter(function(t) { return t.direction === "INCOME"; })
        .reduce(function(sum, t) { return sum + Number(t.amount || 0); }, 0);

      const other = projectTxs
        .filter(function(t) { return t.direction === "TRANSFER"; })
        .reduce(function(sum, t) { return sum + Number(t.amount || 0); }, 0);

      const expenses = projectTxs
        .filter(function(t) { return t.accountingImpact === "EXPENSE"; })
        .reduce(function(sum, t) { return sum + Number(t.amount || 0); }, 0);

      obj.designatedDonationsReceived = Number(donations.toFixed(2));
      obj.otherFunding = Number(other.toFixed(2));
      obj.expensesPaid = Number(expenses.toFixed(2));
      obj.remainingDesignatedBalance = Number((donations + other - expenses).toFixed(2));

      projects.push(obj);
    });
  }

  return { success: true, projects: projects };
}

/**
 * Adds a new Capital Project record (metadata only)
 */
function addCapitalProject(p, userEmail) {
  p = p || {};
  if (!p.projectName) throw new Error("Project name is required");

  const db = getDB(true, "addCapitalProject");
  let sheet = db.getSheetByName("Capital_Projects");
  if (!sheet) {
    initializeSandboxSchema();
    sheet = db.getSheetByName("Capital_Projects");
  }

  const projectId = "PRJ-" + Date.now();
  const budget = Number(p.approvedBudget || 0);
  const nowIso = new Date().toISOString();

  sheet.appendRow([
    projectId,
    p.projectName,
    p.status || "Active",
    budget,
    Number(p.pendingCommitments || 0),
    p.notes || "",
    userEmail || "System",
    nowIso,
    nowIso
  ]);

  return { success: true, projectId: projectId };
}

/**
 * Updates a Capital Project record
 */
function updateCapitalProject(p, userEmail) {
  p = p || {};
  if (!p.projectId) throw new Error("projectId is required");

  const db = getDB(true, "updateCapitalProject");
  const sheet = db.getSheetByName("Capital_Projects");
  if (!sheet) throw new Error("Capital_Projects tab missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idx = data.findIndex(function(r) { return r[0] === p.projectId; });
  if (idx === -1) throw new Error("Project not found: " + p.projectId);

  const rowNum = idx + 2;
  const STATUS_COL = headers.indexOf("status") + 1;
  const BUDGET_COL = headers.indexOf("approvedBudget") + 1;
  const NOTES_COL = headers.indexOf("notes") + 1;
  const UPDATED_COL = headers.indexOf("updatedAt") + 1;

  if (p.status && STATUS_COL > 0) sheet.getRange(rowNum, STATUS_COL).setValue(p.status);
  if (p.approvedBudget !== undefined && BUDGET_COL > 0) sheet.getRange(rowNum, BUDGET_COL).setValue(Number(p.approvedBudget));
  if (p.notes !== undefined && NOTES_COL > 0) sheet.getRange(rowNum, NOTES_COL).setValue(p.notes);
  if (UPDATED_COL > 0) sheet.getRange(rowNum, UPDATED_COL).setValue(new Date().toISOString());

  return { success: true, projectId: p.projectId };
}

/**
 * Aggregates designated gifts and expenses by fundId
 * Excludes SETTLEMENT payouts to prevent reimbursement double-counting
 */
function getDesignatedFundsSummary() {
  const txResult = getTransactions();
  const txs = txResult.transactions || [];

  const fundMap = {};
  txs.forEach(function(t) {
    const fund = t.fundId || "General";
    if (!fundMap[fund]) {
      fundMap[fund] = { fundId: fund, totalIncome: 0, totalExpenses: 0, netBalance: 0 };
    }
    if (t.direction === "INCOME") fundMap[fund].totalIncome += Number(t.amount || 0);
    // Only count recognized expenses, exclude settlement payouts
    if (t.accountingImpact === "EXPENSE") fundMap[fund].totalExpenses += Number(t.amount || 0);
  });

  const funds = Object.keys(fundMap).map(function(f) {
    const item = fundMap[f];
    item.totalIncome = Number(item.totalIncome.toFixed(2));
    item.totalExpenses = Number(item.totalExpenses.toFixed(2));
    item.netBalance = Number((item.totalIncome - item.totalExpenses).toFixed(2));
    return item;
  });

  return { success: true, funds: funds };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeSandboxSchema,
    getTransactions,
    addTransaction,
    updateTransaction,
    addIncome,
    addExpense,
    getCapitalProjects,
    addCapitalProject,
    updateCapitalProject,
    getDesignatedFundsSummary
  };
}
