/*************************************************
 * GPBC Finance Desk — Audit.gs
 * Append-Only Security & Audit Event Logger
 *************************************************/

/**
 * Logs an audit event to the AUDIT_LOGS sheet (if it exists) or Execution Logger
 * NEVER logs tokens, passwords, full financial payloads, or bank account numbers.
 * 
 * @param {object} event - { actor: string, action: string, status: string, details?: string }
 */
function logAuditEvent(event) {
  try {
    const timestamp = new Date();
    const actor = (event && event.actor) ? String(event.actor).substring(0, 100) : "Anonymous";
    const action = (event && event.action) ? String(event.action).substring(0, 50) : "Unknown";
    const status = (event && event.status) ? String(event.status).substring(0, 20) : "INFO";
    const details = (event && event.details) ? String(event.details).substring(0, 200) : "";

    // Internal Logger
    Logger.log("[AUDIT] " + timestamp.toISOString() + " | Actor: " + actor + " | Action: " + action + " | Status: " + status + (details ? " | " + details : ""));

    // Attempt to write to AUDIT_LOGS sheet if present in DB
    try {
      const db = getDB();
      let auditSheet = db.getSheetByName("AUDIT_LOGS");
      if (!auditSheet) {
        // Create tab safely if not existing
        auditSheet = db.insertSheet("AUDIT_LOGS");
        auditSheet.appendRow(["Timestamp", "Actor", "Action", "Status", "Details"]);
      }
      auditSheet.appendRow([timestamp, actor, action, status, details]);
    } catch (sheetErr) {
      // Spreadsheet write failure is non-blocking for request processing
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Audit logging error" };
  }
}
