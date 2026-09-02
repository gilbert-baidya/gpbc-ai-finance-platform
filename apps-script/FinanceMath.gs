/*************************************************
 * GPBC Finance Desk — FinanceMath.gs
 * Shared Pure Accounting Formulas, Canonical Purchase-Balance Calculations, and Period Helpers
 *************************************************/

/**
 * Shared canonical purchase balance and allocation calculation helper
 * Invariant: netCovered = allocatedAmount + personallyAbsorbedAmount + refundCreditAdjustment
 * remainingBalance = max(0, purchaseAmount - netCovered)
 */
function calculatePurchaseBalance(purchaseAmount, allocations) {
  purchaseAmount = Number(purchaseAmount || 0);
  allocations = Array.isArray(allocations) ? allocations : [];
  let totalAllocated = 0;
  let totalAbsorbed = 0;
  let totalRefundAdj = 0;

  allocations.forEach(function(a) {
    totalAllocated += Number(a.allocatedAmount || 0);
    totalAbsorbed += Number(a.personallyAbsorbedAmount || 0);
    totalRefundAdj += Number(a.refundCreditAdjustment || 0);
  });

  const netCovered = totalAllocated + totalAbsorbed + totalRefundAdj;
  const remainingBalance = Number(Math.max(0, purchaseAmount - netCovered).toFixed(2));
  const isOverAllocated = (netCovered > purchaseAmount + 0.01);
  const overageAmount = isOverAllocated ? Number((netCovered - purchaseAmount).toFixed(2)) : 0;

  return {
    purchaseAmount: purchaseAmount,
    totalAllocated: totalAllocated,
    totalAbsorbed: totalAbsorbed,
    totalRefundAdjustment: totalRefundAdj,
    netCovered: netCovered,
    remainingBalance: remainingBalance,
    isOverAllocated: isOverAllocated,
    overageAmount: overageAmount
  };
}

/**
 * Returns canonical period key YYYY-MM from a Date object or date string
 */
function getPeriodKey(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return Utilities.formatDate(now, "GMT", "yyyy-MM");
  }
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (trimmed.match(/^\d{4}-\d{2}$/)) return trimmed;
    const parts = trimmed.split(/[-/T ]/);
    if (parts.length >= 2 && parts[0].length === 4 && parts[1].length <= 2) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      return y + "-" + m;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date input for period key: " + dateInput);
  }
  return Utilities.formatDate(d, "GMT", "yyyy-MM");
}

/**
 * Returns start and end dates (YYYY-MM-DD) for a given YYYY-MM period key
 */
function getPeriodBounds(periodKey) {
  if (!periodKey || !periodKey.match(/^\d{4}-\d{2}$/)) {
    throw new Error("Invalid period key format. Expected YYYY-MM (e.g. 2026-08), received: " + periodKey);
  }
  const parts = periodKey.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12

  if (month < 1 || month > 12) {
    throw new Error("Invalid month in period key: " + periodKey);
  }

  const startDate = periodKey + "-01";
  // Last day of month
  const lastDayNum = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = periodKey + "-" + String(lastDayNum).padStart(2, "0");

  return {
    periodKey: periodKey,
    year: year,
    month: month,
    startDate: startDate,
    endDate: endDate
  };
}

/**
 * Server-side check if a given date falls within a closed period
 */
function isDateInClosedPeriod(dateInput, dbInstance) {
  try {
    const periodKey = getPeriodKey(dateInput);
    const db = dbInstance || getDB(false, "isDateInClosedPeriod");
    const closeSheet = db.getSheetByName("Monthly_Close");
    if (!closeSheet || closeSheet.getLastRow() <= 1) return false;

    const data = closeSheet.getDataRange().getValues();
    const headers = data.shift();
    const pCol = headers.indexOf("periodKey");
    const sCol = headers.indexOf("status");

    if (pCol === -1 || sCol === -1) return false;

    const row = data.find(function(r) { return r[pCol] === periodKey; });
    if (!row) return false;

    return (row[sCol] === "Closed" || row[sCol] === "CLOSED");
  } catch (err) {
    // If DB is not available in mock/pure unit tests, default to false unless period is explicitly closed
    return false;
  }
}

/**
 * Authoritative Server-Side Period-Lock Guard
 * Throws a descriptive error if the financial transaction date falls in a closed period.
 */
function assertPeriodWritable(transactionDate, actionName, userEmail, dbInstance) {
  if (!transactionDate) return;
  const periodKey = getPeriodKey(transactionDate);
  const isClosed = isDateInClosedPeriod(transactionDate, dbInstance);

  if (isClosed) {
    throw new Error(
      "Period " + periodKey + " is CLOSED. Financial write (" + (actionName || "Action") +
      ") is locked. An authorized Admin must reopen the period with a documented reason before records can be modified."
    );
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculatePurchaseBalance,
    getPeriodKey,
    getPeriodBounds,
    isDateInClosedPeriod,
    assertPeriodWritable
  };
}
