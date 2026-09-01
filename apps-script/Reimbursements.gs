/*************************************************
 * GPBC Finance Desk — Reimbursements.gs
 * Many-to-Many Reimbursements & Allocation Engine
 *************************************************/

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
 * Creates a reimbursement record with many-to-many allocations
 * Preserves exact purchase, church reimbursement, and personally absorbed amounts.
 */
function addReimbursement(p, userEmail) {
  p = p || {};
  if (!p.claimantName) throw new Error("Claimant name is required");
  
  const reimbursedAmt = Number(p.totalReimbursedAmount || 0);
  const purchaseAmt = Number(p.totalPurchaseAmount || reimbursedAmt);
  const absorbedAmt = Number(p.totalPersonallyAbsorbed || 0);
  const remainingAmt = Number(Math.max(0, purchaseAmt - reimbursedAmt - absorbedAmt).toFixed(2));

  if (reimbursedAmt < 0 || purchaseAmt <= 0) {
    throw new Error("Invalid reimbursement or purchase amount");
  }

  // Prevent allocation overage: Reimbursed + Absorbed cannot exceed original purchase unless explicit adjustment
  if (reimbursedAmt + absorbedAmt > purchaseAmt + 0.01) {
    throw new Error(
      "Reimbursement invariant violation: Total reimbursed ($" + reimbursedAmt + 
      ") + absorbed ($" + absorbedAmt + ") exceeds purchase cost ($" + purchaseAmt + ")"
    );
  }

  const db = getDB(true, "addReimbursement");
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
  if (remainingAmt > 0 && reimbursedAmt > 0) status = "Partially Reimbursed";
  else if (remainingAmt === 0 && reimbursedAmt > 0) status = "Fully Reimbursed";
  else if (reimbursedAmt === 0 && absorbedAmt > 0) status = "Approved";

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

  // Append Allocations if provided
  const allocations = Array.isArray(p.allocations) ? p.allocations : [];
  allocations.forEach(function(alc) {
    const alcId = "ALC-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
    alcSheet.appendRow([
      alcId,
      rmbId,
      alc.purchaseTransactionId || "",
      Number(alc.allocatedAmount || reimbursedAmt),
      Number(alc.personallyAbsorbedAmount || absorbedAmt),
      Number(alc.refundCreditAdjustment || 0),
      alc.notes || "",
      actor,
      nowIso
    ]);
  });

  // Record Disbursement Transaction in canonical Transactions tab
  if (reimbursedAmt > 0) {
    addTransaction({
      transactionDate: rmbDate,
      transactionType: "Reimbursement",
      direction: "EXPENSE",
      amount: reimbursedAmt,
      payeeOrPayer: p.claimantName,
      description: "Reimbursement to " + p.claimantName + (p.notes ? " - " + p.notes : ""),
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
 */
function addReimbursementAllocation(p, userEmail) {
  p = p || {};
  if (!p.reimbursementId) throw new Error("reimbursementId is required");
  if (!p.purchaseTransactionId) throw new Error("purchaseTransactionId is required");

  const db = getDB(true, "addReimbursementAllocation");
  let alcSheet = db.getSheetByName("Reimbursement_Allocations");
  if (!alcSheet) {
    initializeSandboxSchema();
    alcSheet = db.getSheetByName("Reimbursement_Allocations");
  }

  const alcId = "ALC-" + Date.now();
  const nowIso = new Date().toISOString();

  alcSheet.appendRow([
    alcId,
    p.reimbursementId,
    p.purchaseTransactionId,
    Number(p.allocatedAmount || 0),
    Number(p.personallyAbsorbedAmount || 0),
    Number(p.refundCreditAdjustment || 0),
    p.notes || "",
    userEmail || "System",
    nowIso
  ]);

  return { success: true, allocationId: alcId };
}
