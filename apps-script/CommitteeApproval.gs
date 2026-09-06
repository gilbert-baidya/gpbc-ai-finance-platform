/*************************************************
 * GPBC Finance Desk — CommitteeApproval.gs
 * Monthly Committee Expense Approval & Governance Ratification Service
 * Sandbox Schema Extension — Fails Closed — Preserves Closed Periods
 *************************************************/

// In Node/test environment, load dependencies
if (typeof require !== 'undefined') {
  if (typeof assertSandboxSheet === 'undefined') {
    const config = require('./Config.gs');
    global.assertSandboxSheet = config.assertSandboxSheet;
    global.getDB = config.getDB;
    global.getConfig = config.getConfig;
    global.SCHEMA_DEFINITIONS = config.SCHEMA_DEFINITIONS;
    global.SANDBOX_SCHEMA_EXTENSIONS = config.SANDBOX_SCHEMA_EXTENSIONS;
    global.CHURCH_INFO = config.CHURCH_INFO;
  }
  if (typeof getPeriodBounds === 'undefined') {
    const financeMath = require('./FinanceMath.gs');
    global.getPeriodKey = financeMath.getPeriodKey;
    global.getPeriodBounds = financeMath.getPeriodBounds;
    global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  }
  if (typeof logAuditEvent === 'undefined') {
    const audit = require('./Audit.gs');
    global.logAuditEvent = audit.logAuditEvent;
  }
  if (typeof initializeSandboxSchema === 'undefined') {
    const tx = require('./Transactions.gs');
    global.initializeSandboxSchema = tx.initializeSandboxSchema;
  }
}

/**
 * Ensures sandbox committee tables exist
 */
function ensureCommitteeTables(db) {
  if (typeof initializeSandboxSchema === 'function') {
    initializeSandboxSchema();
  }
}

/**
 * Computes deterministic SHA-256 / web-safe hash of text
 */
function computePacketDigest(text) {
  if (typeof Utilities !== 'undefined' && Utilities.computeDigest) {
    const charset = (Utilities.Charset && Utilities.Charset.UTF_8) ? Utilities.Charset.UTF_8 : undefined;
    const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, charset);
    let hex = '';
    for (let i = 0; i < raw.length; i++) {
      let b = raw[i];
      if (b < 0) b += 256;
      let s = b.toString(16);
      if (s.length === 1) s = '0' + s;
      hex += s;
    }
    return hex;
  }
  // Node / synthetic fallback for unit tests
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + text.length;
}

// =========================================================================
// SECTION 1: COMMITTEE MEMBER DIRECTORY
// =========================================================================

/**
 * Retrieves all committee members
 */
function getCommitteeMembers() {
  assertSandboxSheet('getCommitteeMembers');
  const db = getDB(false, 'getCommitteeMembers');
  ensureCommitteeTables(db);

  const sheet = db.getSheetByName('Committee_Members');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, members: [] };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const members = data.map(function(row) {
    const m = {};
    headers.forEach(function(h, idx) {
      m[h] = row[idx];
    });
    return m;
  });

  return { success: true, members: members };
}

/**
 * Adds a new committee member
 */
function addCommitteeMember(p, userEmail) {
  p = p || {};
  assertSandboxSheet('addCommitteeMember');
  const db = getDB(true, 'addCommitteeMember');
  ensureCommitteeTables(db);

  if (!p.fullName || !String(p.fullName).trim()) {
    throw new Error('Full name is required for committee member.');
  }
  if (!p.roleTitle || !String(p.roleTitle).trim()) {
    throw new Error('Role / Title is required for committee member.');
  }

  const sheet = db.getSheetByName('Committee_Members');
  if (!sheet) throw new Error('Committee_Members sheet not found.');

  const now = new Date().toISOString();
  const memberId = 'CM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const effectiveFrom = p.effectiveFrom || now.split('T')[0];

  const newMember = {
    memberId: memberId,
    fullName: String(p.fullName).trim(),
    roleTitle: String(p.roleTitle).trim(),
    email: p.email ? String(p.email).trim() : '',
    phone: p.phone ? String(p.phone).trim() : '',
    status: 'ACTIVE',
    effectiveFrom: effectiveFrom,
    effectiveTo: p.effectiveTo || '',
    createdBy: userEmail || 'system',
    createdAt: now,
    updatedBy: userEmail || 'system',
    updatedAt: now
  };

  const headers = (typeof SANDBOX_SCHEMA_EXTENSIONS !== 'undefined' && SANDBOX_SCHEMA_EXTENSIONS.Committee_Members)
    ? SANDBOX_SCHEMA_EXTENSIONS.Committee_Members
    : ['memberId', 'fullName', 'roleTitle', 'email', 'phone', 'status', 'effectiveFrom', 'effectiveTo', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

  const row = headers.map(function(h) { return newMember[h] !== undefined ? newMember[h] : ''; });
  sheet.appendRow(row);

  logAuditEvent({
    actor: userEmail || 'system',
    action: 'COMMITTEE_MEMBER_CREATED',
    entityType: 'COMMITTEE_MEMBER',
    entityId: memberId,
    details: 'Created member: ' + newMember.fullName + ' (' + newMember.roleTitle + ')'
  });

  return { success: true, member: newMember };
}

/**
 * Updates an existing committee member
 * Does NOT alter historical approval records.
 */
function updateCommitteeMember(p, userEmail) {
  p = p || {};
  assertSandboxSheet('updateCommitteeMember');
  const db = getDB(true, 'updateCommitteeMember');
  ensureCommitteeTables(db);

  if (!p.memberId) throw new Error('memberId is required.');

  const sheet = db.getSheetByName('Committee_Members');
  if (!sheet || sheet.getLastRow() <= 1) throw new Error('Committee_Members sheet is empty.');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('memberId');

  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === p.memberId) {
      foundRowIdx = i;
      break;
    }
  }

  if (foundRowIdx === -1) throw new Error('Member not found: ' + p.memberId);

  const rowNum = foundRowIdx + 1;
  const now = new Date().toISOString();

  if (p.fullName !== undefined) sheet.getRange(rowNum, headers.indexOf('fullName') + 1).setValue(String(p.fullName).trim());
  if (p.roleTitle !== undefined) sheet.getRange(rowNum, headers.indexOf('roleTitle') + 1).setValue(String(p.roleTitle).trim());
  if (p.email !== undefined) sheet.getRange(rowNum, headers.indexOf('email') + 1).setValue(String(p.email).trim());
  if (p.phone !== undefined) sheet.getRange(rowNum, headers.indexOf('phone') + 1).setValue(String(p.phone).trim());
  if (p.status !== undefined) sheet.getRange(rowNum, headers.indexOf('status') + 1).setValue(p.status);
  if (p.effectiveFrom !== undefined) sheet.getRange(rowNum, headers.indexOf('effectiveFrom') + 1).setValue(p.effectiveFrom);
  if (p.effectiveTo !== undefined) sheet.getRange(rowNum, headers.indexOf('effectiveTo') + 1).setValue(p.effectiveTo);

  sheet.getRange(rowNum, headers.indexOf('updatedBy') + 1).setValue(userEmail || 'system');
  sheet.getRange(rowNum, headers.indexOf('updatedAt') + 1).setValue(now);

  logAuditEvent({
    actor: userEmail || 'system',
    action: 'COMMITTEE_MEMBER_UPDATED',
    entityType: 'COMMITTEE_MEMBER',
    entityId: p.memberId,
    details: 'Updated member fields for: ' + p.memberId
  });

  return { success: true, memberId: p.memberId };
}

/**
 * Soft deactivates a committee member (never hard deletes)
 */
function deactivateCommitteeMember(p, userEmail) {
  p = p || {};
  assertSandboxSheet('deactivateCommitteeMember');
  const db = getDB(true, 'deactivateCommitteeMember');
  ensureCommitteeTables(db);

  if (!p.memberId) throw new Error('memberId is required.');

  const sheet = db.getSheetByName('Committee_Members');
  if (!sheet || sheet.getLastRow() <= 1) throw new Error('Committee_Members sheet is empty.');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('memberId');

  let foundRowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === p.memberId) {
      foundRowIdx = i;
      break;
    }
  }

  if (foundRowIdx === -1) throw new Error('Member not found: ' + p.memberId);

  const rowNum = foundRowIdx + 1;
  const now = new Date().toISOString();
  const effectiveTo = p.effectiveTo || now.split('T')[0];

  sheet.getRange(rowNum, headers.indexOf('status') + 1).setValue('INACTIVE');
  sheet.getRange(rowNum, headers.indexOf('effectiveTo') + 1).setValue(effectiveTo);
  sheet.getRange(rowNum, headers.indexOf('updatedBy') + 1).setValue(userEmail || 'system');
  sheet.getRange(rowNum, headers.indexOf('updatedAt') + 1).setValue(now);

  logAuditEvent({
    actor: userEmail || 'system',
    action: 'COMMITTEE_MEMBER_DEACTIVATED',
    entityType: 'COMMITTEE_MEMBER',
    entityId: p.memberId,
    details: 'Deactivated member: ' + p.memberId + ' effective: ' + effectiveTo
  });

  return { success: true, memberId: p.memberId, status: 'INACTIVE', effectiveTo: effectiveTo };
}

// =========================================================================
// SECTION 2: DETERMINISTIC MONTHLY EXPENSE PACKET GENERATOR
// =========================================================================

/**
 * Generates the deterministic monthly expense packet for review
 * Adheres strictly to GPBC recognized expense rules:
 * - Direct operating expenses recognized
 * - Personal card reimbursable purchases recognized at purchase
 * - Reimbursement settlements tracked separately to prevent double-counting
 * - Pending bank lines excluded
 */
function getMonthlyExpensePacket(p) {
  if (typeof p === 'string') p = { periodKey: p };
  p = p || {};
  assertSandboxSheet('getMonthlyExpensePacket');
  const db = getDB(false, 'getMonthlyExpensePacket');
  ensureCommitteeTables(db);

  const periodKey = p.periodKey;
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error('Invalid period key format. Expected YYYY-MM.');
  }

  const bounds = getPeriodBounds(periodKey);
  const txSheet = db.getSheetByName('Transactions');
  const allTxs = [];

  if (txSheet && txSheet.getLastRow() > 1) {
    const data = txSheet.getDataRange().getValues();
    const headers = data.shift();
    data.forEach(function(r) {
      const obj = {};
      headers.forEach(function(h, idx) { obj[h] = r[idx]; });
      allTxs.push(obj);
    });
  }

  // Filter transactions within period
  const periodTxs = allTxs.filter(function(t) {
    const d = String(t.transactionDate || t.date || '').split('T')[0];
    return d >= bounds.startDate && d <= bounds.endDate;
  });

  // Separate recognized expenses vs settlements
  const recognizedExpenses = [];
  const reimbursementSettlements = [];
  let capitalProjectTotal = 0;
  let pendingBankLinesExcludedCount = 0;
  let pendingBankLinesExcludedAmount = 0;

  periodTxs.forEach(function(t) {
    const amt = Math.abs(Number(t.amount || 0));

    // Exclude pending bank statement lines from recognized expenses
    const isPending = Boolean(
      t.status === 'PENDING' ||
      t.status === 'Pending' ||
      t.isPending === true ||
      t.isPending === 'TRUE' ||
      (t.reconciliationStatus && /^pending$/i.test(t.reconciliationStatus))
    );

    if (isPending) {
      pendingBankLinesExcludedCount++;
      pendingBankLinesExcludedAmount = Number((pendingBankLinesExcludedAmount + amt).toFixed(2));
      return;
    }

    const isReimbursementType = /reimbursement/i.test(String(t.transactionType || ''));

    // Check for liability settlement
    if (t.accountingImpact === 'SETTLEMENT' || isReimbursementType) {
      reimbursementSettlements.push({
        transactionId: t.transactionId,
        date: String(t.transactionDate || t.date || '').split('T')[0],
        payeeOrPayer: t.payeeOrPayer || t.claimantName || 'Reimbursement Claimant',
        amount: amt,
        paymentMethod: t.paymentMethod || '',
        checkNumber: t.checkNumber || '',
        notes: t.notes || t.description || ''
      });
      return;
    }

    // Only recognized expenses
    if (t.accountingImpact === 'EXPENSE' || (t.direction === 'EXPENSE' && !t.accountingImpact)) {
      const hasReceipt = Boolean(
        t.receiptStatus === 'ATTACHED' ||
        t.receiptStatus === 'NOT_REQUIRED' ||
        (t.receiptId && String(t.receiptId).trim() !== '')
      );

      const isUncategorized = !t.category || /^(uncategorized|needs classification)$/i.test(t.category);
      const isVaguePurpose = !t.description || /^(general|expense)$/i.test(t.description);

      const item = {
        transactionId: t.transactionId,
        date: String(t.transactionDate || t.date || '').split('T')[0],
        payeeOrPayer: t.payeeOrPayer || 'Unknown Payee',
        category: t.category || 'Uncategorized',
        description: t.description || 'General',
        amount: amt,
        paymentMethod: t.paymentMethod || '',
        checkNumber: t.checkNumber || '',
        personalPurchase: Boolean(t.personalPurchase),
        claimantName: t.claimantName || '',
        capitalProjectId: t.capitalProjectId || '',
        receiptStatus: t.receiptStatus || (hasReceipt ? 'ATTACHED' : 'MISSING'),
        receiptId: t.receiptId || '',
        reconciliationStatus: t.reconciliationStatus || 'Unreconciled',
        isUncategorized: isUncategorized,
        isVaguePurpose: isVaguePurpose,
        accountingImpact: 'EXPENSE'
      };

      if (t.capitalProjectId) {
        capitalProjectTotal += amt;
      }

      recognizedExpenses.push(item);
    }
  });

  // Sort deterministically by date, then transactionId
  recognizedExpenses.sort(function(a, b) {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.transactionId.localeCompare(b.transactionId);
  });

  // Calculate totals and metrics
  let totalRecognizedExpenses = 0;
  let receiptsCompleteCount = 0;
  let missingEvidenceCount = 0;
  let needsClarificationCount = 0;

  recognizedExpenses.forEach(function(e) {
    totalRecognizedExpenses += e.amount;
    if (e.receiptStatus === 'ATTACHED' || e.receiptStatus === 'NOT_REQUIRED') {
      receiptsCompleteCount++;
    } else {
      missingEvidenceCount++;
    }
    if (e.isUncategorized || e.isVaguePurpose) {
      needsClarificationCount++;
    }
  });

  totalRecognizedExpenses = Number(totalRecognizedExpenses.toFixed(2));
  capitalProjectTotal = Number(capitalProjectTotal.toFixed(2));

  let reimbursementSettlementTotal = 0;
  reimbursementSettlements.forEach(function(s) { reimbursementSettlementTotal += s.amount; });
  reimbursementSettlementTotal = Number(reimbursementSettlementTotal.toFixed(2));

  // Compute canonical fingerprint string and packetHash
  const fingerprintLines = recognizedExpenses.map(function(e) {
    return [
      e.transactionId,
      e.date,
      e.amount.toFixed(2),
      e.payeeOrPayer,
      e.category,
      e.accountingImpact
    ].join('|');
  });

  const canonicalString = fingerprintLines.join("\n");
  const packetHash = computePacketDigest(canonicalString);

  const summary = {
    churchName: CHURCH_INFO.name,
    address: CHURCH_INFO.address,
    periodKey: periodKey,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    totalRecognizedExpenses: totalRecognizedExpenses,
    expenseCount: recognizedExpenses.length,
    receiptsCompleteCount: receiptsCompleteCount,
    missingEvidenceCount: missingEvidenceCount,
    needsClarificationCount: needsClarificationCount,
    reimbursementSettlementTotal: reimbursementSettlementTotal,
    reimbursementSettlementCount: reimbursementSettlements.length,
    capitalProjectTotal: capitalProjectTotal,
    pendingBankLinesExcludedCount: pendingBankLinesExcludedCount,
    pendingBankLinesExcludedAmount: pendingBankLinesExcludedAmount,
    packetHash: packetHash
  };

  return {
    success: true,
    periodKey: periodKey,
    summary: summary,
    expenses: recognizedExpenses,
    reimbursementSettlements: reimbursementSettlements,
    packetHash: packetHash
  };
}

// =========================================================================
// SECTION 3: APPROVAL THRESHOLD & GOVERNANCE ENGINE
// =========================================================================

/**
 * Deterministically computes approval result based on the configured rule
 */
function calculateApprovalOutcome(rule, eligibleMembers, decisions) {
  rule = rule || 'MAJORITY_OF_ELIGIBLE_MEMBERS';
  const eligibleCount = eligibleMembers.length;
  const decisionMap = {};
  (decisions || []).forEach(function(d) {
    decisionMap[d.memberId] = d;
  });

  let approvedCount = 0;
  let exceptionCount = 0;
  let abstainedCount = 0;
  let notPresentCount = 0;
  let returnedCount = 0;

  eligibleMembers.forEach(function(m) {
    const d = decisionMap[m.memberId];
    if (!d || d.decision === 'NOT_PRESENT') {
      notPresentCount++;
    } else if (d.decision === 'APPROVED') {
      approvedCount++;
    } else if (d.decision === 'APPROVED_WITH_COMMENT') {
      approvedCount++;
      exceptionCount++;
    } else if (d.decision === 'ABSTAINED') {
      abstainedCount++;
    } else if (d.decision === 'RETURNED_FOR_CLARIFICATION') {
      returnedCount++;
    }
  });

  let requiredCount = 0;
  let isMet = false;

  if (rule === 'MAJORITY_OF_ELIGIBLE_MEMBERS') {
    requiredCount = Math.floor(eligibleCount / 2) + 1;
    isMet = approvedCount >= requiredCount && returnedCount === 0;
  } else if (rule === 'UNANIMOUS_OF_PRESENT_MEMBERS') {
    const presentCount = eligibleCount - notPresentCount;
    requiredCount = presentCount;
    isMet = presentCount > 0 && approvedCount === presentCount && returnedCount === 0;
  } else if (rule === 'MINIMUM_APPROVAL_COUNT') {
    requiredCount = 3;
    isMet = approvedCount >= requiredCount && returnedCount === 0;
  } else {
    // MANUAL_COMMITTEE_DECISION
    requiredCount = Math.floor(eligibleCount / 2) + 1;
    isMet = approvedCount >= requiredCount && returnedCount === 0;
  }

  let finalStatus = 'SUBMITTED';
  if (returnedCount > 0) {
    finalStatus = 'RETURNED_FOR_CLARIFICATION';
  } else if (isMet) {
    finalStatus = exceptionCount > 0 ? 'APPROVED_WITH_EXCEPTIONS' : 'APPROVED';
  }

  return {
    rule: rule,
    status: finalStatus,
    isThresholdMet: isMet,
    thresholdMet: isMet,
    eligibleMemberCount: eligibleCount,
    requiredApprovalCount: requiredCount,
    actualApprovalCount: approvedCount,
    exceptionCount: exceptionCount,
    abstainedCount: abstainedCount,
    notPresentCount: notPresentCount,
    returnedCount: returnedCount
  };
}

// =========================================================================
// SECTION 4: RECORD APPROVAL & HISTORICAL SNAPSHOTS
// =========================================================================

/**
 * Records a committee approval meeting outcome
 * Preserves immutable member snapshots and underlying expense list
 */
function recordCommitteeApproval(p, userEmail) {
  p = p || {};
  assertSandboxSheet('recordCommitteeApproval');
  const db = getDB(true, 'recordCommitteeApproval');
  ensureCommitteeTables(db);

  const periodKey = p.periodKey;
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error('Valid periodKey (YYYY-MM) is required.');
  }

  const packet = getMonthlyExpensePacket({ periodKey: periodKey });
  const membersRes = getCommitteeMembers();
  const bounds = getPeriodBounds(periodKey);

  // Eligible members active during period
  const eligibleMembers = (membersRes.members || []).filter(function(m) {
    const from = m.effectiveFrom || '2000-01-01';
    const to = m.effectiveTo || '2099-12-31';
    return m.status === 'ACTIVE' && from <= bounds.endDate && to >= bounds.startDate;
  });

  const rule = p.approvalRule || 'MAJORITY_OF_ELIGIBLE_MEMBERS';
  const outcome = calculateApprovalOutcome(rule, eligibleMembers, p.decisions || []);

  let finalStatus = outcome.status;
  let overrideApplied = false;
  let overrideReason = '';

  // Support Primary Admin override if rule is not met
  if (!outcome.isThresholdMet && p.overrideApplied) {
    if (!p.overrideReason || !String(p.overrideReason).trim()) {
      throw new Error('Override requires a mandatory reason.');
    }
    overrideApplied = true;
    overrideReason = String(p.overrideReason).trim();
    finalStatus = outcome.exceptionCount > 0 ? 'APPROVED_WITH_EXCEPTIONS' : 'APPROVED';

    logAuditEvent({
      actor: userEmail || 'Primary Admin',
      action: 'COMMITTEE_APPROVAL_OVERRIDDEN',
      entityType: 'COMMITTEE_APPROVAL',
      entityId: periodKey,
      details: 'Approval rule overridden: ' + overrideReason + ' (Original status: ' + outcome.status + ')'
    });
  }

  const now = new Date().toISOString();
  const approvalId = 'MCA-' + periodKey.replace('-', '') + '-V1';

  const approvalSheet = db.getSheetByName('Monthly_Committee_Approval');
  const decisionSheet = db.getSheetByName('Committee_Approval_Decisions');
  if (!approvalSheet || !decisionSheet) throw new Error('Committee approval tables missing.');

  // Record main approval entry
  const approvalRecord = {
    approvalId: approvalId,
    periodKey: periodKey,
    packetVersion: 1,
    isLatestVersion: true,
    status: finalStatus,
    totalRecognizedExpenses: packet.summary.totalRecognizedExpenses,
    expenseCount: packet.summary.expenseCount,
    receiptsCompleteCount: packet.summary.receiptsCompleteCount,
    missingEvidenceCount: packet.summary.missingEvidenceCount,
    needsClarificationCount: packet.summary.needsClarificationCount,
    reimbursementSettlementTotal: packet.summary.reimbursementSettlementTotal,
    capitalProjectTotal: packet.summary.capitalProjectTotal,
    packetHash: packet.packetHash,
    expenseSnapshotJson: JSON.stringify(packet.expenses),
    approvalRuleSnapshot: rule,
    eligibleMemberCount: outcome.eligibleMemberCount,
    requiredApprovalCount: outcome.requiredApprovalCount,
    actualApprovalCount: outcome.actualApprovalCount,
    meetingDate: p.meetingDate || now.split('T')[0],
    approvalMethod: p.approvalMethod || 'COMMITTEE_MEETING',
    meetingMinutesRef: p.meetingMinutesRef || '',
    generalComments: p.generalComments || '',
    overrideApplied: overrideApplied,
    overrideReason: overrideReason,
    overrideBy: overrideApplied ? (userEmail || 'Primary Admin') : '',
    documentId: p.documentId || '',
    amendmentReason: '',
    previousApprovalId: '',
    submittedBy: userEmail || 'system',
    submittedAt: now,
    finalizedBy: userEmail || 'system',
    finalizedAt: now,
    createdAt: now,
    updatedAt: now
  };

  const approvalHeaders = (typeof SANDBOX_SCHEMA_EXTENSIONS !== 'undefined' && SANDBOX_SCHEMA_EXTENSIONS.Monthly_Committee_Approval)
    ? SANDBOX_SCHEMA_EXTENSIONS.Monthly_Committee_Approval
    : Object.keys(approvalRecord);

  approvalSheet.appendRow(approvalHeaders.map(function(h) { return approvalRecord[h] !== undefined ? approvalRecord[h] : ''; }));

  // Record individual decisions with IMMUTABLE MEMBER SNAPSHOTS
  const decisionHeaders = (typeof SANDBOX_SCHEMA_EXTENSIONS !== 'undefined' && SANDBOX_SCHEMA_EXTENSIONS.Committee_Approval_Decisions)
    ? SANDBOX_SCHEMA_EXTENSIONS.Committee_Approval_Decisions
    : ['decisionId', 'approvalId', 'periodKey', 'packetVersion', 'memberId', 'memberNameSnapshot', 'memberRoleSnapshot', 'decision', 'decisionDate', 'approvalMethod', 'comment', 'recordedBy', 'recordedAt'];

  const memberMap = {};
  (membersRes.members || []).forEach(function(m) { memberMap[m.memberId] = m; });

  const decisionRecords = [];
  (p.decisions || []).forEach(function(d, idx) {
    const member = memberMap[d.memberId] || { fullName: 'Unknown Member', roleTitle: 'Committee Member' };
    const decId = 'CAD-' + periodKey.replace('-', '') + '-1-' + (idx + 1);

    const rec = {
      decisionId: decId,
      approvalId: approvalId,
      periodKey: periodKey,
      packetVersion: 1,
      memberId: d.memberId,
      memberNameSnapshot: member.fullName, // IMMUTABLE SNAPSHOT
      memberRoleSnapshot: member.roleTitle, // IMMUTABLE SNAPSHOT
      decision: d.decision || 'APPROVED',
      decisionDate: d.decisionDate || p.meetingDate || now.split('T')[0],
      approvalMethod: d.approvalMethod || p.approvalMethod || 'COMMITTEE_MEETING',
      comment: d.comment || '',
      recordedBy: userEmail || 'system',
      recordedAt: now
    };

    decisionRecords.push(rec);
    decisionSheet.appendRow(decisionHeaders.map(function(h) { return rec[h] !== undefined ? rec[h] : ''; }));
  });

  logAuditEvent({
    actor: userEmail || 'system',
    action: 'COMMITTEE_APPROVAL_RECORDED',
    entityType: 'COMMITTEE_APPROVAL',
    entityId: approvalId,
    details: 'Recorded approval for ' + periodKey + ': ' + finalStatus + ' (' + outcome.actualApprovalCount + '/' + outcome.eligibleMemberCount + ' approvers)'
  });

  approvalRecord.approvalStatus = approvalRecord.status;
  approvalRecord.versionNumber = approvalRecord.packetVersion;
  approvalRecord.approvedPacketSnapshotJson = approvalRecord.expenseSnapshotJson;
  approvalRecord.approvalCount = outcome.actualApprovalCount;
  approvalRecord.eligibleMemberCount = outcome.eligibleMemberCount;

  return {
    success: true,
    approval: approvalRecord,
    decisions: decisionRecords,
    outcome: outcome
  };
}

// =========================================================================
// SECTION 5: APPROVAL STATUS & CHANGE DETECTION
// =========================================================================

/**
 * Retrieves monthly committee approval record and verifies underlying expense integrity
 */
function getMonthlyCommitteeApproval(p) {
  if (typeof p === 'string') p = { periodKey: p };
  p = p || {};
  assertSandboxSheet('getMonthlyCommitteeApproval');
  const db = getDB(false, 'getMonthlyCommitteeApproval');
  ensureCommitteeTables(db);

  const periodKey = p.periodKey;
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error('Valid periodKey (YYYY-MM) is required.');
  }

  const approvalSheet = db.getSheetByName('Monthly_Committee_Approval');
  const decisionSheet = db.getSheetByName('Committee_Approval_Decisions');

  if (!approvalSheet || approvalSheet.getLastRow() <= 1) {
    return {
      success: true,
      periodKey: periodKey,
      approval: null,
      decisions: [],
      history: [],
      hasPacketChanged: false,
      amendmentRequired: false
    };
  }

  const appData = approvalSheet.getDataRange().getValues();
  const appHeaders = appData.shift();
  const periodCol = appHeaders.indexOf('periodKey');
  const latestCol = appHeaders.indexOf('isLatestVersion');

  const matchingApprovals = [];
  appData.forEach(function(r) {
    if (r[periodCol] === periodKey) {
      const obj = {};
      appHeaders.forEach(function(h, idx) { obj[h] = r[idx]; });
      matchingApprovals.push(obj);
    }
  });

  if (matchingApprovals.length === 0) {
    return {
      success: true,
      periodKey: periodKey,
      approval: null,
      decisions: [],
      history: [],
      hasPacketChanged: false,
      amendmentRequired: false
    };
  }

  // Find active latest version
  matchingApprovals.sort(function(a, b) { return Number(b.packetVersion || 1) - Number(a.packetVersion || 1); });
  const latest = matchingApprovals.find(function(a) { return String(a.isLatestVersion) === 'true'; }) || matchingApprovals[0];

  // Retrieve decisions for latest version
  const decisions = [];
  if (decisionSheet && decisionSheet.getLastRow() > 1) {
    const decData = decisionSheet.getDataRange().getValues();
    const decHeaders = decData.shift();
    const appCol = decHeaders.indexOf('approvalId');
    decData.forEach(function(r) {
      if (r[appCol] === latest.approvalId) {
        const dObj = {};
        decHeaders.forEach(function(h, idx) { dObj[h] = r[idx]; });
        decisions.push(dObj);
      }
    });
  }

  // Check underlying expense integrity
  const livePacket = getMonthlyExpensePacket({ periodKey: periodKey });
  const isApproved = latest.status === 'APPROVED' || latest.status === 'APPROVED_WITH_EXCEPTIONS';
  const hasPacketChanged = Boolean(isApproved && latest.packetHash && latest.packetHash !== livePacket.packetHash);

  latest.approvalStatus = latest.status;
  latest.versionNumber = latest.packetVersion;
  latest.approvedPacketSnapshotJson = latest.expenseSnapshotJson;
  latest.approvalCount = latest.actualApprovalCount;

  return {
    success: true,
    periodKey: periodKey,
    approval: latest,
    decisions: decisions,
    history: matchingApprovals,
    currentPacketHash: livePacket.packetHash,
    hasPacketChanged: hasPacketChanged,
    amendmentRequired: hasPacketChanged,
    reportedStatus: hasPacketChanged ? 'AMENDMENT_REQUIRED' : latest.status,
    changeMessage: hasPacketChanged
      ? 'Underlying expenses have changed since committee approval was recorded. An amendment is required to ratify the revised expenses.'
      : ''
  };
}

// =========================================================================
// SECTION 6: AMENDMENT WORKFLOW
// =========================================================================

/**
 * Creates an immutable amendment (Version N+1) without overwriting original approvals
 */
function createCommitteeApprovalAmendment(p, userEmail) {
  p = p || {};
  assertSandboxSheet('createCommitteeApprovalAmendment');
  const db = getDB(true, 'createCommitteeApprovalAmendment');
  ensureCommitteeTables(db);

  const periodKey = p.periodKey;
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error('Valid periodKey (YYYY-MM) is required.');
  }
  if (!p.amendmentReason || !String(p.amendmentReason).trim()) {
    throw new Error('amendmentReason is required for committee amendment.');
  }

  const currentRes = getMonthlyCommitteeApproval({ periodKey: periodKey });
  if (!currentRes.approval) {
    throw new Error('No prior committee approval found for period ' + periodKey + '. Cannot amend.');
  }

  const prev = currentRes.approval;
  const newVersion = Number(prev.packetVersion || 1) + 1;
  const newApprovalId = 'MCA-' + periodKey.replace('-', '') + '-V' + newVersion;
  const now = new Date().toISOString();

  // Mark previous version as isLatestVersion = false
  const approvalSheet = db.getSheetByName('Monthly_Committee_Approval');
  const decisionSheet = db.getSheetByName('Committee_Approval_Decisions');
  const appData = approvalSheet.getDataRange().getValues();
  const appHeaders = appData[0];
  const idCol = appHeaders.indexOf('approvalId');
  const latestCol = appHeaders.indexOf('isLatestVersion');

  for (let i = 1; i < appData.length; i++) {
    if (appData[i][idCol] === prev.approvalId) {
      approvalSheet.getRange(i + 1, latestCol + 1).setValue(false);
      break;
    }
  }

  // Generate fresh packet for revised expenses
  const packet = getMonthlyExpensePacket({ periodKey: periodKey });
  const membersRes = getCommitteeMembers();
  const bounds = getPeriodBounds(periodKey);

  const eligibleMembers = (membersRes.members || []).filter(function(m) {
    const from = m.effectiveFrom || '2000-01-01';
    const to = m.effectiveTo || '2099-12-31';
    return m.status === 'ACTIVE' && from <= bounds.endDate && to >= bounds.startDate;
  });

  const rule = p.approvalRule || prev.approvalRuleSnapshot || 'MAJORITY_OF_ELIGIBLE_MEMBERS';
  const outcome = calculateApprovalOutcome(rule, eligibleMembers, p.decisions || []);

  const amendmentRecord = {
    approvalId: newApprovalId,
    periodKey: periodKey,
    packetVersion: newVersion,
    isLatestVersion: true,
    status: outcome.status,
    totalRecognizedExpenses: packet.summary.totalRecognizedExpenses,
    expenseCount: packet.summary.expenseCount,
    receiptsCompleteCount: packet.summary.receiptsCompleteCount,
    missingEvidenceCount: packet.summary.missingEvidenceCount,
    needsClarificationCount: packet.summary.needsClarificationCount,
    reimbursementSettlementTotal: packet.summary.reimbursementSettlementTotal,
    capitalProjectTotal: packet.summary.capitalProjectTotal,
    packetHash: packet.packetHash,
    expenseSnapshotJson: JSON.stringify(packet.expenses),
    approvalRuleSnapshot: rule,
    eligibleMemberCount: outcome.eligibleMemberCount,
    requiredApprovalCount: outcome.requiredApprovalCount,
    actualApprovalCount: outcome.actualApprovalCount,
    meetingDate: p.meetingDate || now.split('T')[0],
    approvalMethod: p.approvalMethod || 'COMMITTEE_MEETING',
    meetingMinutesRef: p.meetingMinutesRef || '',
    generalComments: p.generalComments || '',
    overrideApplied: false,
    overrideReason: '',
    overrideBy: '',
    documentId: p.documentId || '',
    amendmentReason: String(p.amendmentReason).trim(),
    previousApprovalId: prev.approvalId,
    submittedBy: userEmail || 'system',
    submittedAt: now,
    finalizedBy: userEmail || 'system',
    finalizedAt: now,
    createdAt: now,
    updatedAt: now
  };

  const approvalHeaders = (typeof SANDBOX_SCHEMA_EXTENSIONS !== 'undefined' && SANDBOX_SCHEMA_EXTENSIONS.Monthly_Committee_Approval)
    ? SANDBOX_SCHEMA_EXTENSIONS.Monthly_Committee_Approval
    : Object.keys(amendmentRecord);

  approvalSheet.appendRow(approvalHeaders.map(function(h) { return amendmentRecord[h] !== undefined ? amendmentRecord[h] : ''; }));

  // Append new decisions
  const decisionHeaders = (typeof SANDBOX_SCHEMA_EXTENSIONS !== 'undefined' && SANDBOX_SCHEMA_EXTENSIONS.Committee_Approval_Decisions)
    ? SANDBOX_SCHEMA_EXTENSIONS.Committee_Approval_Decisions
    : ['decisionId', 'approvalId', 'periodKey', 'packetVersion', 'memberId', 'memberNameSnapshot', 'memberRoleSnapshot', 'decision', 'decisionDate', 'approvalMethod', 'comment', 'recordedBy', 'recordedAt'];

  const memberMap = {};
  (membersRes.members || []).forEach(function(m) { memberMap[m.memberId] = m; });

  const decisionRecords = [];
  (p.decisions || []).forEach(function(d, idx) {
    const member = memberMap[d.memberId] || { fullName: 'Unknown Member', roleTitle: 'Committee Member' };
    const decId = 'CAD-' + periodKey.replace('-', '') + '-' + newVersion + '-' + (idx + 1);

    const rec = {
      decisionId: decId,
      approvalId: newApprovalId,
      periodKey: periodKey,
      packetVersion: newVersion,
      memberId: d.memberId,
      memberNameSnapshot: member.fullName,
      memberRoleSnapshot: member.roleTitle,
      decision: d.decision || 'APPROVED',
      decisionDate: d.decisionDate || p.meetingDate || now.split('T')[0],
      approvalMethod: d.approvalMethod || p.approvalMethod || 'COMMITTEE_MEETING',
      comment: d.comment || '',
      recordedBy: userEmail || 'system',
      recordedAt: now
    };

    decisionRecords.push(rec);
    decisionSheet.appendRow(decisionHeaders.map(function(h) { return rec[h] !== undefined ? rec[h] : ''; }));
  });

  logAuditEvent({
    actor: userEmail || 'system',
    action: 'COMMITTEE_APPROVAL_AMENDMENT_CREATED',
    entityType: 'COMMITTEE_APPROVAL',
    entityId: newApprovalId,
    details: 'Created Amendment V' + newVersion + ' for ' + periodKey + ': ' + amendmentRecord.amendmentReason
  });

  amendmentRecord.approvalStatus = amendmentRecord.status;
  amendmentRecord.versionNumber = amendmentRecord.packetVersion;
  amendmentRecord.approvedPacketSnapshotJson = amendmentRecord.expenseSnapshotJson;
  amendmentRecord.approvalCount = outcome.actualApprovalCount;
  amendmentRecord.eligibleMemberCount = outcome.eligibleMemberCount;

  return {
    success: true,
    approval: amendmentRecord,
    decisions: decisionRecords,
    outcome: outcome
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCommitteeMembers,
    addCommitteeMember,
    updateCommitteeMember,
    deactivateCommitteeMember,
    getMonthlyExpensePacket,
    calculateApprovalOutcome,
    recordCommitteeApproval,
    getMonthlyCommitteeApproval,
    createCommitteeApprovalAmendment,
    computePacketDigest
  };
}
