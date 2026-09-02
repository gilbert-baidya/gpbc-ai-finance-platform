/*************************************************
 * GPBC Finance Desk — Reimbursements.gs
 * Authoritative Many-to-Many Reimbursements & Unified Allocation Engine
 *************************************************/

/**
 * Shared canonical purchase balance and allocation calculation helper
 * Invariant: netCovered = allocatedAmount + personallyAbsorbedAmount + refundCreditAdjustment
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
 * Retrieves all reimbursements and their linked allocations
 */
function getReimbursements() {
  const db = getDB(false, "getReimbursements");
  const rmbSheet = db.getSheetByName("Reimbursements");
  const alcSheet = db.getSheetByName("Reimbursement_Allocations");

  const reimbursements = [];
  const allocationsByRmb = {};

  if (alcSheet && alcSheet.getLastRow() > 1) {
    const aData = alcSheet.getDataRange().getValues();
    const aHeaders = aData.shift();
    aData.forEach(function(row) {
      const alc = {};
      aHeaders.forEach(function(h, i) { alc[h] = row[i]; });
      alc.allocatedAmount = Number(alc.allocatedAmount || 0);
      alc.personallyAbsorbedAmount = Number(alc.personallyAbsorbedAmount || 0);
      alc.refundCreditAdjustment = Number(alc.refundCreditAdjustment || 0);

      const rId = alc.reimbursementId;
      if (!allocationsByRmb[rId]) allocationsByRmb[rId] = [];
      allocationsByRmb[rId].push(alc);
    });
  }

  if (rmbSheet && rmbSheet.getLastRow() > 1) {
    const rData = rmbSheet.getDataRange().getValues();
    const rHeaders = rData.shift();

    rData.forEach(function(row) {
      const rmb = {};
      rHeaders.forEach(function(h, i) { rmb[h] = row[i]; });
      rmb.totalPurchaseAmount = Number(rmb.totalPurchaseAmount || 0);
      rmb.totalReimbursedAmount = Number(rmb.totalReimbursedAmount || 0);
      rmb.totalPersonallyAbsorbed = Number(rmb.totalPersonallyAbsorbed || 0);
      rmb.remainingReimbursable = Number(rmb.remainingReimbursable || 0);
      rmb.allocations = allocationsByRmb[rmb.reimbursementId] || [];
      reimbursements.push(rmb);
    });
  }

  return { success: true, count: reimbursements.length, reimbursements: reimbursements };
}

/**
 * Authoritative Unified Allocation Validator
 * Used by both addReimbursement() and addReimbursementAllocation()
 * 
 * Enforces:
 * 1. Purchase transaction exists in Transactions tab
 * 2. Purchase is strictly eligible for reimbursement (personalPurchase: true, or recognized personal payment method)
 * 3. Ordinary church-card, church-check, or income disbursements cannot be reimbursed
 * 4. Allocated & absorbed amounts are finite non-negative numbers
 * 5. Refund adjustments are finite non-negative numbers
 * 6. refundTransactionId is verified if supplied
 * 7. Sum of (priorAllocated + pendingAllocated + currentAllocated + currentAbsorbed + adjustments) <= originalPurchaseAmount
 */
function validateAndPrepareAllocation(alc, db, inFlightAllocationsMap) {
  alc = alc || {};
  if (!alc.purchaseTransactionId) {
    throw new Error("purchaseTransactionId is required for allocation");
  }

  const txSheet = db.getSheetByName("Transactions");
  if (!txSheet || txSheet.getLastRow() <= 1) {
    throw new Error("Transactions tab missing or empty. Cannot link allocation to non-existent purchase.");
  }

  const txData = txSheet.getDataRange().getValues();
  const txHeaders = txData.shift();
  const pIdx = txHeaders.indexOf("transactionId");
  const aIdx = txHeaders.indexOf("amount");
  const dIdx = txHeaders.indexOf("direction");
  const tTypeIdx = txHeaders.indexOf("transactionType");
  const payMethodIdx = txHeaders.indexOf("paymentMethod");
  const ppIdx = txHeaders.indexOf("personalPurchase");
  const impactIdx = txHeaders.indexOf("accountingImpact");

  const matchedTx = txData.find(function(r) { return r[pIdx] === alc.purchaseTransactionId; });

  if (!matchedTx) {
    throw new Error("Purchase transaction not found: " + alc.purchaseTransactionId);
  }

  // Check Non-Reimbursable Types (Income, Settlement, Transfer)
  const direction = String(matchedTx[dIdx] || "");
  const txnType = String(matchedTx[tTypeIdx] || "");
  const impact = String(matchedTx[impactIdx] || "");

  if (direction === "INCOME" || impact === "INCOME") {
    throw new Error("Transaction " + alc.purchaseTransactionId + " is an income donation, not an eligible expense/purchase for reimbursement");
  }

  if (txnType === "Reimbursement" || impact === "SETTLEMENT") {
    throw new Error("Transaction " + alc.purchaseTransactionId + " is a reimbursement settlement payout, not an original purchase");
  }

  // Tighten Eligibility: Must be an explicit personal-card / personal purchase
  const isPersonalFlag = (matchedTx[ppIdx] === true || matchedTx[ppIdx] === "TRUE" || matchedTx[ppIdx] === "true");
  const paymentMethod = String(matchedTx[payMethodIdx] || "").toLowerCase();
  const isPersonalPayment = (paymentMethod.includes("personal") || paymentMethod === "personal card" || paymentMethod === "personal cash");
  const isPersonalType = (txnType.toLowerCase().includes("personal"));

  const isEligible = isPersonalFlag || isPersonalPayment || isPersonalType;

  if (!isEligible) {
    throw new Error(
      "Transaction " + alc.purchaseTransactionId + " is a church-paid disbursement (" + 
      (matchedTx[payMethodIdx] || "Church Direct") + "), not an eligible personal purchase for reimbursement"
    );
  }

  const purchaseAmount = Number(matchedTx[aIdx] || 0);
  const allocAmt = Number(alc.allocatedAmount !== undefined && alc.allocatedAmount !== "" ? alc.allocatedAmount : 0);
  const absorbAmt = Number(alc.personallyAbsorbedAmount !== undefined && alc.personallyAbsorbedAmount !== "" ? alc.personallyAbsorbedAmount : 0);
  const refundAdj = Number(alc.refundCreditAdjustment !== undefined && alc.refundCreditAdjustment !== "" ? alc.refundCreditAdjustment : 0);

  if (isNaN(allocAmt) || !isFinite(allocAmt) || allocAmt < 0) {
    throw new Error("Allocated amount must be a finite non-negative number for purchase " + alc.purchaseTransactionId);
  }
  if (isNaN(absorbAmt) || !isFinite(absorbAmt) || absorbAmt < 0) {
    throw new Error("Personally absorbed amount must be a finite non-negative number for purchase " + alc.purchaseTransactionId);
  }
  if (isNaN(refundAdj) || !isFinite(refundAdj) || refundAdj < 0) {
    throw new Error("refundCreditAdjustment must be a finite non-negative number for purchase " + alc.purchaseTransactionId);
  }

  // Scaffolding: Verify refundTransactionId exists if provided
  if (alc.refundTransactionId) {
    const matchedRefundTx = txData.find(function(r) { return r[pIdx] === alc.refundTransactionId; });
    if (!matchedRefundTx) {
      throw new Error("Referenced refundTransactionId not found: " + alc.refundTransactionId);
    }
  }

  // Calculate prior historical allocations from Reimbursement_Allocations tab
  let priorAllocated = 0;
  const alcSheet = db.getSheetByName("Reimbursement_Allocations");
  if (alcSheet && alcSheet.getLastRow() > 1) {
    const aData = alcSheet.getDataRange().getValues();
    const aHeaders = aData.shift();
    const pTxIdx = aHeaders.indexOf("purchaseTransactionId");
    const amtIdx = aHeaders.indexOf("allocatedAmount");
    const absIdx = aHeaders.indexOf("personallyAbsorbedAmount");
    const refIdx = aHeaders.indexOf("refundCreditAdjustment");

    aData.forEach(function(r) {
      if (r[pTxIdx] === alc.purchaseTransactionId) {
        const priorAmt = Number(r[amtIdx] || 0);
        const priorAbs = Number(r[absIdx] || 0);
        const priorRef = Number(r[refIdx] || 0);
        priorAllocated += (priorAmt + priorAbs + priorRef);
      }
    });
  }

  // In-flight allocations within same request batch
  const inFlightPrior = (inFlightAllocationsMap && inFlightAllocationsMap[alc.purchaseTransactionId]) || 0;
  const totalCoveredForPurchase = priorAllocated + inFlightPrior + allocAmt + absorbAmt + refundAdj;

  if (totalCoveredForPurchase > purchaseAmount + 0.01) {
    throw new Error(
      "Allocation overage for purchase " + alc.purchaseTransactionId + ": Total allocated ($" +
      totalCoveredForPurchase.toFixed(2) + ") exceeds purchase cost ($" + purchaseAmount.toFixed(2) + ")"
    );
  }

  return {
    purchaseTransactionId: alc.purchaseTransactionId,
    purchaseAmount: purchaseAmount,
    allocatedAmount: allocAmt,
    personallyAbsorbedAmount: absorbAmt,
    refundCreditAdjustment: refundAdj,
    refundTransactionId: alc.refundTransactionId || "",
    notes: alc.notes || ""
  };
}

/**
 * Validates and records a reimbursement payout with verified many-to-many allocations.
 * Invariant: Reimbursed payout is recorded as a liability SETTLEMENT, preventing double-counting.
 */
function addReimbursement(p, userEmail) {
  p = p || {};
  if (!p.claimantName) throw new Error("Claimant name is required");
  
  const reimbursedAmt = Number(p.totalReimbursedAmount || 0);
  const suppliedPurchaseAmt = Number(p.totalPurchaseAmount || reimbursedAmt);
  const suppliedAbsorbedAmt = Number(p.totalPersonallyAbsorbed || 0);

  if (reimbursedAmt < 0 || suppliedPurchaseAmt <= 0) {
    throw new Error("Invalid reimbursement or purchase amount");
  }

  const rawAllocations = Array.isArray(p.allocations) ? p.allocations : [];
  const db = getDB(true, "addReimbursement");

  // Validate allocations using the authoritative unified validator
  const validatedAllocations = [];
  const inFlightMap = {};
  const seenPurchaseIds = {};

  if (rawAllocations.length > 0) {
    let sumAllocated = 0;
    let sumAbsorbed = 0;
    let sumPurchases = 0;

    rawAllocations.forEach(function(rawAlc, idx) {
      if (!rawAlc.purchaseTransactionId) {
        throw new Error("Allocation row #" + (idx + 1) + " requires purchaseTransactionId");
      }

      // Prevent duplicate purchase IDs within the same reimbursement batch
      if (seenPurchaseIds[rawAlc.purchaseTransactionId]) {
        throw new Error(
          "Duplicate purchase transaction ID in reimbursement request: " + rawAlc.purchaseTransactionId +
          ". Combine multiple allocations for the same purchase into a single row."
        );
      }
      seenPurchaseIds[rawAlc.purchaseTransactionId] = true;

      // For a single allocation row where amounts were omitted, default to the reimbursement total
      if (rawAllocations.length === 1) {
        if (rawAlc.allocatedAmount === undefined || rawAlc.allocatedAmount === "") {
          rawAlc.allocatedAmount = reimbursedAmt;
        }
        if (rawAlc.personallyAbsorbedAmount === undefined || rawAlc.personallyAbsorbedAmount === "") {
          rawAlc.personallyAbsorbedAmount = suppliedAbsorbedAmt;
        }
      }

      const validated = validateAndPrepareAllocation(rawAlc, db, inFlightMap);
      validatedAllocations.push(validated);

      inFlightMap[validated.purchaseTransactionId] = (inFlightMap[validated.purchaseTransactionId] || 0) +
        (validated.allocatedAmount + validated.personallyAbsorbedAmount + validated.refundCreditAdjustment);

      sumAllocated += validated.allocatedAmount;
      sumAbsorbed += validated.personallyAbsorbedAmount;
      sumPurchases += validated.purchaseAmount;
    });

    // Reconcile top-level totalReimbursedAmount against allocation sum
    if (Math.abs(sumAllocated - reimbursedAmt) > 0.01) {
      throw new Error(
        "Allocation mismatch: Sum of allocations ($" + sumAllocated.toFixed(2) +
        ") does not match reimbursement total ($" + reimbursedAmt.toFixed(2) + ")"
      );
    }
  }

  const purchaseAmt = validatedAllocations.length > 0
    ? validatedAllocations.reduce(function(sum, a) { return sum + a.purchaseAmount; }, 0)
    : suppliedPurchaseAmt;

  const absorbedAmt = validatedAllocations.length > 0
    ? validatedAllocations.reduce(function(sum, a) { return sum + a.personallyAbsorbedAmount; }, 0)
    : suppliedAbsorbedAmt;

  const refundAmt = validatedAllocations.length > 0
    ? validatedAllocations.reduce(function(sum, a) { return sum + a.refundCreditAdjustment; }, 0)
    : 0;

  // Canonical remaining reimbursable calculation accounts for reimbursed + absorbed + refund adjustments
  const totalCovered = reimbursedAmt + absorbedAmt + refundAmt;
  const remainingAmt = Number(Math.max(0, purchaseAmt - totalCovered).toFixed(2));

  // Invariant: Total covered cannot exceed purchase cost
  if (totalCovered > purchaseAmt + 0.01) {
    throw new Error(
      "Reimbursement invariant violation: Total resolved ($" + totalCovered.toFixed(2) + 
      ") exceeds purchase cost ($" + purchaseAmt.toFixed(2) + ")"
    );
  }

  let rmbSheet = db.getSheetByName("Reimbursements");
  let alcSheet = db.getSheetByName("Reimbursement_Allocations");

  if (!rmbSheet || !alcSheet) {
    initializeSandboxSchema();
    rmbSheet = db.getSheetByName("Reimbursements");
    alcSheet = db.getSheetByName("Reimbursement_Allocations");
  }

  const rmbId = "RMB-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";
  const rmbDate = p.reimbursementDate || nowIso.split("T")[0];

  let status = "Approved";
  if (remainingAmt === 0 && reimbursedAmt > 0) status = "Fully Reimbursed";
  else if (remainingAmt === 0 && reimbursedAmt === 0) status = "Approved";
  else if (remainingAmt > 0 && reimbursedAmt > 0) status = "Partially Reimbursed";
  else if (reimbursedAmt === 0 && (absorbedAmt > 0 || refundAmt > 0)) status = "Approved";

  // Append Reimbursement Row
  rmbSheet.appendRow([
    rmbId,
    rmbDate,
    p.claimantName,
    p.claimantEmail || "",
    purchaseAmt,
    reimbursedAmt,
    absorbedAmt,
    remainingAmt,
    p.status || status,
    p.paymentMethod || "Check",
    p.checkNumber || "",
    p.notes || "",
    actor,
    nowIso,
    actor,
    nowIso
  ]);

  // Process Validated Allocations
  validatedAllocations.forEach(function(alc) {
    const alcId = "ALC-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
    alcSheet.appendRow([
      alcId,
      rmbId,
      alc.purchaseTransactionId,
      alc.allocatedAmount,
      alc.personallyAbsorbedAmount,
      alc.refundCreditAdjustment,
      alc.refundTransactionId || "",
      alc.notes,
      actor,
      nowIso
    ]);
  });

  // Record Disbursement Transaction in canonical Transactions tab
  // CRITICAL: accountingImpact is SETTLEMENT so it is NOT double-counted as an operating expense
  if (reimbursedAmt > 0) {
    addTransaction({
      transactionDate: rmbDate,
      transactionType: "Reimbursement",
      direction: "EXPENSE",
      accountingImpact: "SETTLEMENT", // SETTLEMENT of payable liability, NOT a duplicate expense
      amount: reimbursedAmt,
      payeeOrPayer: p.claimantName,
      description: "Reimbursement settlement to " + p.claimantName + (p.notes ? " - " + p.notes : ""),
      category: "Reimbursement",
      fundId: "General",
      paymentMethod: p.paymentMethod || "Check",
      checkNumber: p.checkNumber || "",
      personalPurchase: false,
      reconciliationStatus: "Reconciled",
      receiptStatus: "Attached",
      notes: "Linked to " + rmbId
    }, userEmail);
  }

  return {
    success: true,
    reimbursementId: rmbId,
    totalPurchaseAmount: purchaseAmt,
    totalReimbursedAmount: reimbursedAmt,
    totalPersonallyAbsorbed: absorbedAmt,
    remainingReimbursable: remainingAmt,
    status: status
  };
}

/**
 * Adds an individual reimbursement allocation linking a reimbursement to a purchase
 * Enforces:
 * 1. Reimbursement exists in Reimbursements tab (No Orphan Allocations)
 * 2. Purchase exists and is eligible for reimbursement
 * 3. Reimbursement cash payout cap is strictly enforced
 */
function addReimbursementAllocation(p, userEmail) {
  p = p || {};
  if (!p.reimbursementId) throw new Error("reimbursementId is required");

  const db = getDB(true, "addReimbursementAllocation");
  let rmbSheet = db.getSheetByName("Reimbursements");
  let alcSheet = db.getSheetByName("Reimbursement_Allocations");

  if (!rmbSheet || !alcSheet) {
    initializeSandboxSchema();
    rmbSheet = db.getSheetByName("Reimbursements");
    alcSheet = db.getSheetByName("Reimbursement_Allocations");
  }

  // 1. Verify Reimbursement exists in Reimbursements tab
  if (rmbSheet.getLastRow() <= 1) {
    throw new Error("Reimbursement not found: " + p.reimbursementId);
  }

  const rData = rmbSheet.getDataRange().getValues();
  const rHeaders = rData.shift();
  const rIdCol = rHeaders.indexOf("reimbursementId");
  const rAmtCol = rHeaders.indexOf("totalReimbursedAmount");
  const matchedRmb = rData.find(function(r) { return r[rIdCol] === p.reimbursementId; });

  if (!matchedRmb) {
    throw new Error("Reimbursement not found: " + p.reimbursementId);
  }

  const rmbTotalPayout = Number(matchedRmb[rAmtCol] || 0);

  // 2. Authoritative validation against purchase transaction
  const validated = validateAndPrepareAllocation(p, db, null);

  // 3. Enforce Reimbursement Payout Cap
  let priorAllocatedPayout = 0;
  if (alcSheet.getLastRow() > 1) {
    const aData = alcSheet.getDataRange().getValues();
    const aHeaders = aData.shift();
    const rIdIdx = aHeaders.indexOf("reimbursementId");
    const amtIdx = aHeaders.indexOf("allocatedAmount");

    aData.forEach(function(row) {
      if (row[rIdIdx] === p.reimbursementId) {
        priorAllocatedPayout += Number(row[amtIdx] || 0);
      }
    });
  }

  if (priorAllocatedPayout + validated.allocatedAmount > rmbTotalPayout + 0.01) {
    throw new Error(
      "Reimbursement payout allocation exceeds total payout: Total allocated ($" + 
      (priorAllocatedPayout + validated.allocatedAmount).toFixed(2) + 
      ") exceeds reimbursement cash payout ($" + rmbTotalPayout.toFixed(2) + ")"
    );
  }

  const alcId = "ALC-" + Date.now();
  const nowIso = new Date().toISOString();

  alcSheet.appendRow([
    alcId,
    p.reimbursementId,
    validated.purchaseTransactionId,
    validated.allocatedAmount,
    validated.personallyAbsorbedAmount,
    validated.refundCreditAdjustment,
    validated.refundTransactionId || "",
    validated.notes,
    userEmail || "System",
    nowIso
  ]);

  return { success: true, allocationId: alcId };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculatePurchaseBalance,
    getReimbursements,
    addReimbursement,
    addReimbursementAllocation,
    validateAndPrepareAllocation
  };
}
