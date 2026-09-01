/*************************************************
 * GPBC Finance Desk — Config.gs
 * Server-Side Configuration and Inventory Helpers
 *************************************************/

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
 * Retrieves script configuration from ScriptProperties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    sheetId: props.getProperty("GPBC_SHEET_ID") || "1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s",
    googleClientId: props.getProperty("GOOGLE_CLIENT_ID") || "",
    approvedUsersJson: props.getProperty("GPBC_APPROVED_USERS") || "[]",
    environment: props.getProperty("GPBC_ENVIRONMENT") || "production"
  };
}

/**
 * Retrieves the active Spreadsheet database instance
 */
function getDB() {
  const config = getConfig();
  if (!config.sheetId) {
    throw new Error("GPBC_SHEET_ID is not configured in Script Properties");
  }
  return SpreadsheetApp.openById(config.sheetId);
}

/**
 * Asserts environment safety
 */
function assertEnvironment(requiredEnv) {
  const current = getConfig().environment;
  if (requiredEnv && current !== requiredEnv) {
    throw new Error("Action restricted to " + requiredEnv + " environment (current: " + current + ")");
  }
}

/**
 * Returns a read-only schema inventory of the spreadsheet (tab names and header columns only)
 * NEVER returns confidential financial row values.
 */
function getSchemaInventory() {
  const db = getDB();
  const sheets = db.getSheets();

  const inventory = sheets.map(function(sheet) {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    let headers = [];
    if (lastRow > 0 && lastColumn > 0) {
      const headerValues = sheet.getRange(1, 1, 1, lastColumn).getValues();
      if (headerValues && headerValues[0]) {
        headers = headerValues[0].map(function(h) { return String(h || "").trim(); });
      }
    }

    return {
      name: sheetName,
      rowCount: lastRow,
      columnCount: lastColumn,
      headers: headers
    };
  });

  return {
    success: true,
    spreadsheetId: db.getId(),
    sheetCount: sheets.length,
    sheets: inventory,
    environment: getConfig().environment
  };
}
