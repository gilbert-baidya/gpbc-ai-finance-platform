/*************************************************
 * GPBC Finance Desk — Documents.gs
 * Canonical Document Register, Private Google Drive Hierarchy,
 * Duplicate Content Protection & Entity Linking Service
 *************************************************/

// In Node/test environment, load FinanceMath helpers and Config
if (typeof require !== "undefined") {
  if (typeof assertPeriodWritable === "undefined") {
    const financeMath = require("./FinanceMath.gs");
    global.assertPeriodWritable = financeMath.assertPeriodWritable;
    global.getPeriodKey = financeMath.getPeriodKey;
    global.getPeriodBounds = financeMath.getPeriodBounds;
    global.isDateInClosedPeriod = financeMath.isDateInClosedPeriod;
  }
  if (typeof getConfig === "undefined") {
    const config = require("./Config.gs");
    global.getConfig = config.getConfig;
    global.getDB = config.getDB;
    global.assertSandboxSheet = config.assertSandboxSheet;
    global.SCHEMA_DEFINITIONS = config.SCHEMA_DEFINITIONS;
  }
}

const DOCUMENT_TYPES = [
  "Receipt",
  "Invoice",
  "Check",
  "Reimbursement Evidence",
  "Bank Statement",
  "Credit Card Statement",
  "Capital Project",
  "Finance Report",
  "Other Supporting Document"
];

const DOCUMENT_CATEGORY_FOLDERS = {
  "Receipt": "Receipts",
  "Invoice": "Invoices",
  "Check": "Checks",
  "Reimbursement Evidence": "Reimbursements",
  "Bank Statement": "Bank Statements",
  "Credit Card Statement": "Credit Card Statements",
  "Capital Project": "Capital Projects",
  "Finance Report": "Reports",
  "Other Supporting Document": "Other"
};

const MONTH_NAMES = [
  "01 - January",
  "02 - February",
  "03 - March",
  "04 - April",
  "05 - May",
  "06 - June",
  "07 - July",
  "08 - August",
  "09 - September",
  "10 - October",
  "11 - November",
  "12 - December"
];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp"
];

const FORBIDDEN_EXTENSIONS = [
  ".exe", ".dll", ".bat", ".cmd", ".sh", ".msi", ".apk", ".app", ".com", ".vbs", ".ps1", ".bin", ".scr",
  ".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz",
  ".html", ".htm", ".xhtml", ".svg", ".xml", ".js", ".ts", ".jsx", ".tsx", ".php", ".py", ".rb",
  ".xlsx", ".xls", ".csv", ".tsv", ".ods"
];

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (safe cloud transport limit through Netlify/AWS Lambda)

/**
 * Returns formatted month folder name (e.g. 9 -> "09 - September")
 */
function getMonthFolderName(monthNum) {
  const m = parseInt(monthNum, 10);
  if (isNaN(m) || m < 1 || m > 12) return "00 - General";
  return MONTH_NAMES[m - 1];
}

/**
 * Normalizes document type display values and plurals to canonical singular strings
 */
function normalizeDocumentType(docType) {
  if (!docType) return "Receipt";
  const raw = String(docType).trim();
  const map = {
    "Receipts": "Receipt",
    "Invoices": "Invoice",
    "Checks": "Check",
    "Reimbursements": "Reimbursement Evidence",
    "Reimbursement": "Reimbursement Evidence",
    "Bank Statements": "Bank Statement",
    "Credit Card Statements": "Credit Card Statement",
    "Card Statements": "Credit Card Statement",
    "Capital Projects": "Capital Project",
    "Reports": "Finance Report",
    "Finance Reports": "Finance Report",
    "Other": "Other Supporting Document"
  };
  return map[raw] || raw;
}

/**
 * Normalizes date string from MM/DD/YYYY, YYYY-MM-DD, or ISO format to canonical YYYY-MM-DD
 */
function normalizeDateStr(dStr) {
  if (!dStr) return new Date().toISOString().split("T")[0];
  const str = String(dStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split(/[\/\.-]/);
  if (parts.length === 3) {
    // MM/DD/YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      const mm = String(parseInt(parts[0], 10)).padStart(2, "0");
      const dd = String(parseInt(parts[1], 10)).padStart(2, "0");
      const yyyy = parts[2];
      return yyyy + "-" + mm + "-" + dd;
    }
    // YYYY-MM-DD
    if (parts[0].length === 4) {
      const yyyy = parts[0];
      const mm = String(parseInt(parts[1], 10)).padStart(2, "0");
      const dd = String(parseInt(parts[2], 10)).padStart(2, "0");
      return yyyy + "-" + mm + "-" + dd;
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Returns category subfolder name for a document type
 */
function getCategoryFolderName(docType) {
  const norm = normalizeDocumentType(docType);
  return DOCUMENT_CATEGORY_FOLDERS[norm] || DOCUMENT_CATEGORY_FOLDERS[docType] || "Other";
}

/**
 * Generates safe, standardized stored filename:
 * YYYY-MM-DD_DocumentType_SafeDescription_UniqueId.ext
 */
function generateSafeStoredFileName(documentDate, documentType, title, originalFileName, isAuthoritative) {
  const d = (normalizeDateStr(documentDate)).replace(/[^0-9-]/g, "");
  const normType = normalizeDocumentType(documentType);
  const typeClean = (normType || "Document").replace(/[^a-zA-Z0-9]/g, "");
  const titleClean = (title || "file")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);

  let ext = "pdf";
  if (originalFileName && originalFileName.includes(".")) {
    ext = originalFileName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  if (isAuthoritative || (title && title.indexOf("FINAL") !== -1) || (originalFileName && originalFileName.indexOf("FINAL") !== -1)) {
    return d + "_" + typeClean + "_" + titleClean + "_FINAL." + ext;
  }

  const shortId = Math.random().toString(36).substring(2, 8);
  return d + "_" + typeClean + "_" + titleClean + "_" + shortId + "." + ext;
}

/**
 * Computes SHA-256 content hash of base64 data
 */
function computeContentHash(base64Data) {
  if (!base64Data) return "";
  if (typeof Utilities !== "undefined" && typeof Utilities.computeDigest !== "undefined") {
    const rawBytes = Utilities.base64Decode(base64Data);
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawBytes);
    return digest.map(function(b) {
      const hex = (b < 0 ? b + 256 : b).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  // Node.js fallback for unit tests
  if (typeof require !== "undefined") {
    const crypto = require("crypto");
    const buf = Buffer.from(base64Data, "base64");
    return crypto.createHash("sha256").update(buf).digest("hex");
  }
  return "";
}

/**
 * Deterministic, idempotent folder resolver for Google Drive hierarchy:
 * GPBC Finance Supporting Documents - SANDBOX / {YYYY} / {MM} - {MonthName} / {CategoryFolder}
 */
function resolveDriveFolder(year, month, documentType, rootFolderIdOverride, setStageCb) {
  const config = getConfig();
  const rawRootId = rootFolderIdOverride || config.driveRootFolderId;
  const cleanRootId = String(rawRootId || "").trim();

  const yearStr = String(year);
  const monthFolderStr = getMonthFolderName(month);
  const categoryFolderStr = getCategoryFolderName(documentType);
  const relativePath = yearStr + "/" + monthFolderStr + "/" + categoryFolderStr;

  if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07_ROOT_CONFIG_VERIFIED");

  if (typeof DriveApp === "undefined") {
    // Return simulated path in test / mock environment
    if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_11_CATEGORY_FOLDER_RESOLVED");
    return {
      folderId: "mock-folder-" + yearStr + "-" + month + "-" + categoryFolderStr.toLowerCase().replace(/\s+/g, "-"),
      folderName: categoryFolderStr,
      folderPath: relativePath,
      folderUrl: "https://drive.google.com/drive/folders/mock-folder"
    };
  }

  if (!cleanRootId || cleanRootId.length < 10) {
    if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07C_ROOT_ID_INVALID");
    throw new Error("FAIL-CLOSED SAFETY GUARD: GPBC_DRIVE_ROOT_FOLDER_ID is not configured or invalid in Script Properties");
  }

  let rootFolder;
  try {
    if (typeof Logger !== "undefined") {
      Logger.log("Drive Root ID Check: env=" + config.environment + ", hasRoot=" + (!!cleanRootId) + ", len=" + cleanRootId.length + ", rawEqualsClean=" + (rawRootId === cleanRootId));
    }
    rootFolder = DriveApp.getFolderById(cleanRootId);
  } catch (driveErr) {
    const errMsg = driveErr && driveErr.message ? driveErr.message : String(driveErr);
    if (typeof Logger !== "undefined") {
      Logger.log("DriveApp.getFolderById failed for rootId '" + cleanRootId + "': " + errMsg + (driveErr && driveErr.stack ? "\n" + driveErr.stack : ""));
    }
    if (errMsg.indexOf("permission to call") !== -1 || errMsg.indexOf("Required permissions") !== -1 || errMsg.indexOf("not authorized") !== -1 || errMsg.indexOf("OAuth") !== -1) {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07B1_DRIVE_SCOPE_NOT_AUTHORIZED");
    } else if (errMsg.indexOf("Access denied") !== -1 || errMsg.indexOf("do not have permission to access") !== -1) {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07B2_FOLDER_ACCESS_DENIED");
    } else if (errMsg.indexOf("No item with the given ID") !== -1 || errMsg.indexOf("not found") !== -1 || errMsg.indexOf("does not exist") !== -1) {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07B3_FOLDER_NOT_FOUND");
    } else if (errMsg.indexOf("permission") !== -1 || errMsg.indexOf("denied") !== -1) {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07B4_OTHER_DRIVE_PERMISSION_ERROR");
    } else if (errMsg.indexOf("Invalid") !== -1 || errMsg.indexOf("ID") !== -1) {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07C_ROOT_ID_INVALID");
    } else {
      if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_07D_ROOT_OPEN_UNKNOWN");
    }
    throw driveErr;
  }

  if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_08_ROOT_FOLDER_OPENED");

  // 1. Year Folder
  let yearFolder;
  const yearIter = rootFolder.getFoldersByName(yearStr);
  if (yearIter.hasNext()) {
    yearFolder = yearIter.next();
  } else {
    yearFolder = rootFolder.createFolder(yearStr);
  }
  if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_09_YEAR_FOLDER_RESOLVED");

  // 2. Month Folder
  let monthFolder;
  const monthIter = yearFolder.getFoldersByName(monthFolderStr);
  if (monthIter.hasNext()) {
    monthFolder = monthIter.next();
  } else {
    monthFolder = yearFolder.createFolder(monthFolderStr);
  }
  if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_10_MONTH_FOLDER_RESOLVED");

  // 3. Category Folder
  let categoryFolder;
  const catIter = monthFolder.getFoldersByName(categoryFolderStr);
  if (catIter.hasNext()) {
    categoryFolder = catIter.next();
  } else {
    categoryFolder = monthFolder.createFolder(categoryFolderStr);
  }
  if (typeof setStageCb === "function") setStageCb("DOC_UPLOAD_11_CATEGORY_FOLDER_RESOLVED");

  return {
    folder: categoryFolder || null,
    folderId: categoryFolder ? categoryFolder.getId() : ("mock-folder-" + yearStr + "-" + month + "-" + categoryFolderStr.toLowerCase().replace(/\s+/g, "-")),
    folderName: categoryFolderStr,
    folderPath: relativePath,
    folderUrl: categoryFolder ? categoryFolder.getUrl() : "https://drive.google.com/drive/folders/mock-folder"
  };
}

function toIsoStringSafe(val) {
  if (val == null || val === "") return "";
  if (val instanceof Date) {
    try {
      return val.toISOString();
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
}

function toDateStringSafe(val) {
  if (val == null || val === "") return "";
  if (val instanceof Date) {
    try {
      return val.toISOString().substring(0, 10);
    } catch (e) {
      return String(val);
    }
  }
  const str = String(val).trim();
  if (str.length >= 10 && str.charAt(4) === "-" && str.charAt(7) === "-") {
    return str.substring(0, 10);
  }
  return str;
}

/**
 * Retrieves documents from Document_Register
 */
function getDocuments(p) {
  p = p || {};
  const db = getDB(false, "getDocuments");
  const sheet = db.getSheetByName("Document_Register");
  let documents = [];

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    documents = data.map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });

      return {
        documentId: String(obj.documentId || "").trim(),
        documentType: String(obj.documentType || "").trim(),
        title: String(obj.title || "").trim(),
        originalFileName: String(obj.originalFileName || "").trim(),
        storedFileName: String(obj.storedFileName || "").trim(),
        mimeType: String(obj.mimeType || "application/pdf").trim(),
        fileSize: Number(obj.fileSize || 0),
        driveFileId: String(obj.driveFileId || "").trim(),
        driveFileUrl: String(obj.driveFileUrl || "").trim(),
        driveFolderId: String(obj.driveFolderId || "").trim(),
        documentDate: toDateStringSafe(obj.documentDate),
        financeYear: Number(obj.financeYear || 0),
        financeMonth: Number(obj.financeMonth || 0),
        relatedEntityType: String(obj.relatedEntityType || "NONE").trim(),
        relatedEntityId: String(obj.relatedEntityId || "").trim(),
        relatedTransactionId: String(obj.relatedTransactionId || "").trim(),
        relatedReimbursementId: String(obj.relatedReimbursementId || "").trim(),
        relatedCapitalProjectId: String(obj.relatedCapitalProjectId || "").trim(),
        relatedCheckId: String(obj.relatedCheckId || "").trim(),
        source: String(obj.source || "Manual Upload").trim(),
        contentHash: String(obj.contentHash || "").trim(),
        status: String(obj.status || "Unlinked").trim(),
        isPostCloseAddition: (obj.isPostCloseAddition === true || String(obj.isPostCloseAddition).toLowerCase() === "true"),
        postCloseReason: String(obj.postCloseReason || "").trim(),
        addedAfterCloseAt: toIsoStringSafe(obj.addedAfterCloseAt),
        addedAfterCloseBy: String(obj.addedAfterCloseBy || "").trim(),
        closedPeriodReference: String(obj.closedPeriodReference || "").trim(),
        notes: String(obj.notes || "").trim(),
        uploadedBy: String(obj.uploadedBy || "").trim(),
        uploadedAt: toIsoStringSafe(obj.uploadedAt),
        updatedAt: toIsoStringSafe(obj.updatedAt)
      };
    });
  }

  // Filters
  if (p.financeYear) {
    const y = Number(p.financeYear);
    documents = documents.filter(function(d) { return d.financeYear === y; });
  }
  if (p.financeMonth) {
    const m = Number(p.financeMonth);
    documents = documents.filter(function(d) { return d.financeMonth === m; });
  }
  if (p.periodKey) {
    const parts = String(p.periodKey).split("-");
    if (parts.length === 2) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      documents = documents.filter(function(d) { return d.financeYear === y && d.financeMonth === m; });
    }
  }
  if (p.documentType) {
    documents = documents.filter(function(d) { return d.documentType === p.documentType; });
  }
  if (p.status) {
    documents = documents.filter(function(d) { return d.status === p.status; });
  }
  if (p.relatedEntityType) {
    documents = documents.filter(function(d) { return d.relatedEntityType === p.relatedEntityType; });
  }
  if (p.relatedEntityId) {
    documents = documents.filter(function(d) { return d.relatedEntityId === p.relatedEntityId; });
  }
  if (p.relatedTransactionId) {
    documents = documents.filter(function(d) { return d.relatedTransactionId === p.relatedTransactionId; });
  }
  if (p.search) {
    const q = String(p.search).toLowerCase();
    documents = documents.filter(function(d) {
      return (d.title && d.title.toLowerCase().includes(q)) ||
             (d.documentId && d.documentId.toLowerCase().includes(q)) ||
             (d.storedFileName && d.storedFileName.toLowerCase().includes(q)) ||
             (d.originalFileName && d.originalFileName.toLowerCase().includes(q)) ||
             (d.notes && d.notes.toLowerCase().includes(q)) ||
             (d.uploadedBy && d.uploadedBy.toLowerCase().includes(q));
    });
  }

  // Sort descending by documentDate, then uploadedAt
  documents.sort(function(a, b) {
    const dateComp = (b.documentDate || "").localeCompare(a.documentDate || "");
    if (dateComp !== 0) return dateComp;
    return (b.uploadedAt || "").localeCompare(a.uploadedAt || "");
  });

  return {
    success: true,
    count: documents.length,
    documents: documents
  };
}

/**
 * Uploads finance evidence document to private Drive and registers canonical metadata in Document_Register
 */
function uploadDocument(p, userEmail) {
  let currentStage = "DOC_UPLOAD_01_AUTHORIZED";
  try {
    p = p || {};
    const normType = normalizeDocumentType(p.documentType);
    if (!normType) throw new Error("Document type is required");
    if (!p.title) throw new Error("Document title is required");

    currentStage = "DOC_UPLOAD_02_PAYLOAD_VALIDATED";

    const nowIso = new Date().toISOString();
    const actor = userEmail || "System";
    const docDate = normalizeDateStr(p.documentDate);

    // Derive Finance Year and Month
    let financeYear = Number(p.financeYear);
    let financeMonth = Number(p.financeMonth);
    if (isNaN(financeYear) || isNaN(financeMonth) || financeYear < 2000 || financeMonth < 1 || financeMonth > 12) {
      const dateParts = docDate.split("-");
      financeYear = parseInt(dateParts[0], 10) || new Date().getFullYear();
      financeMonth = parseInt(dateParts[1], 10) || (new Date().getMonth() + 1);
    }

    if (p.fileBase64) {
      currentStage = "DOC_UPLOAD_03_FILE_DECODED";
    }

    // Content Hash & Duplicate Check
    let contentHash = p.contentHash || "";
    if (p.fileBase64 && !contentHash) {
      contentHash = computeContentHash(p.fileBase64);
    }
    currentStage = "DOC_UPLOAD_04_HASH_COMPUTED";

    const db = getDB(true, "uploadDocument");
    let sheet = db.getSheetByName("Document_Register");
    if (!sheet) {
      if (typeof initializeSandboxSchema === "function") {
        initializeSandboxSchema();
      }
      sheet = db.getSheetByName("Document_Register");
    }

    // Check for duplicate content hash if sheet has existing data
    if (contentHash && sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      const hashCol = headers.indexOf("contentHash");
      const idCol = headers.indexOf("documentId");
      const titleCol = headers.indexOf("title");
      const statusCol = headers.indexOf("status");

      if (hashCol !== -1) {
        const existing = data.find(function(r) { return r[hashCol] === contentHash; });
        if (existing) {
          if (!p.allowDuplicate && !p.allowDuplicateUpload) {
            currentStage = "DOC_UPLOAD_05_DUPLICATE_CHECKED";
            return {
              success: true,
              duplicateDetected: true,
              duplicateDocumentId: existing[idCol],
              duplicateTitle: existing[titleCol],
              duplicateStatus: existing[statusCol],
              message: "A document with identical content already exists (" + existing[idCol] + ": " + existing[titleCol] + ")."
            };
          } else {
            // Authorized intentional duplicate override: safely record audit trail in notes
            p.notes = ("[OVERRIDE_DUPLICATE: Approved intentional duplicate of " + existing[idCol] + "] " + (p.notes || "")).trim();
          }
        }
      }
    }
    currentStage = "DOC_UPLOAD_05_DUPLICATE_CHECKED";

    // Closed Period Evidence Policy Check
    const periodKey = getPeriodKey(docDate);
    const isClosed = isDateInClosedPeriod(docDate, db);

    let isPostCloseAddition = false;
    let postCloseReason = "";
    let addedAfterCloseAt = "";
    let addedAfterCloseBy = "";
    let closedPeriodReference = "";
    // Canonical Entity Relation Normalization & Fail-Closed Validation
    let normEntityType = String(p.relatedEntityType || "").trim().toUpperCase();
    let relTxnId = String(p.relatedTransactionId || (normEntityType === "TRANSACTION" ? p.relatedEntityId : "") || "").trim();
    let relRmbId = String(p.relatedReimbursementId || (normEntityType === "REIMBURSEMENT" ? p.relatedEntityId : "") || "").trim();
    let relCapId = String(p.relatedCapitalProjectId || (normEntityType === "CAPITAL_PROJECT" ? p.relatedEntityId : "") || "").trim();
    let relChkId = String(p.relatedCheckId || (normEntityType === "CHECK" ? p.relatedEntityId : "") || "").trim();

    if (normEntityType === "TRANSACTION" || normEntityType === "EXPENSE" || normEntityType === "INCOME") {
      normEntityType = "TRANSACTION";
      if (!relTxnId) {
        throw new Error("Related transaction ID is required when relatedEntityType is TRANSACTION.");
      }
    } else if (normEntityType === "REIMBURSEMENT") {
      if (!relRmbId) {
        throw new Error("Related reimbursement ID is required when relatedEntityType is REIMBURSEMENT.");
      }
    } else if (normEntityType === "CAPITAL_PROJECT") {
      if (!relCapId) {
        throw new Error("Related capital project ID is required when relatedEntityType is CAPITAL_PROJECT.");
      }
    } else if (normEntityType === "CHECK") {
      if (!relChkId) {
        throw new Error("Related check ID is required when relatedEntityType is CHECK.");
      }
    } else if (normEntityType === "MONTHLY_CLOSE") {
      if (!p.relatedEntityId) {
        throw new Error("Related monthly close ID is required when relatedEntityType is MONTHLY_CLOSE.");
      }
    } else {
      normEntityType = "NONE";
      relTxnId = "";
      relRmbId = "";
      relCapId = "";
      relChkId = "";
    }

    const relEntityId = String(p.relatedEntityId || relTxnId || relRmbId || relCapId || relChkId || "").trim();
    const hasEntityRelation = (normEntityType !== "NONE" && !!relEntityId);
    let status = p.status || (hasEntityRelation ? "Linked" : "Unlinked");

    if (isClosed) {
      if (!p.postCloseReason || !String(p.postCloseReason).trim()) {
        throw new Error(
          "Period " + periodKey + " is CLOSED. Adding post-close supporting evidence requires an authorized documented reason (postCloseReason)."
        );
      }
      isPostCloseAddition = true;
      postCloseReason = String(p.postCloseReason).trim();
      addedAfterCloseAt = nowIso;
      addedAfterCloseBy = actor;
      closedPeriodReference = periodKey;
      status = p.status || "Needs Review";
    }
    currentStage = "DOC_UPLOAD_06_PERIOD_CHECKED";

    // Strict filename extension and MIME validation
    const origFileName = String(p.originalFileName || "document.pdf").trim().toLowerCase();
    const extMatch = origFileName.match(/\.[a-z0-9]+$/i);
    const fileExt = extMatch ? extMatch[0] : "";

    if (FORBIDDEN_EXTENSIONS.indexOf(fileExt) !== -1) {
      throw new Error("Forbidden file type: " + fileExt + ". Executable, archive, script, and spreadsheet files are strictly not permitted.");
    }

    if (ALLOWED_EXTENSIONS.indexOf(fileExt) === -1) {
      throw new Error("Unsupported file extension: " + fileExt + ". Allowed formats: .pdf, .jpg, .jpeg, .png, .webp");
    }

    const mimeType = String(p.mimeType || "").trim().toLowerCase();
    if (mimeType) {
      if (ALLOWED_MIME_TYPES.indexOf(mimeType) === -1) {
        throw new Error("Unsupported MIME type: " + mimeType);
      }
      if (fileExt === ".pdf" && mimeType !== "application/pdf") {
        throw new Error("Mismatched file extension and MIME type: " + fileExt + " with " + mimeType);
      }
      if ((fileExt === ".jpg" || fileExt === ".jpeg") && mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
        throw new Error("Mismatched file extension and MIME type: " + fileExt + " with " + mimeType);
      }
      if (fileExt === ".png" && mimeType !== "image/png") {
        throw new Error("Mismatched file extension and MIME type: " + fileExt + " with " + mimeType);
      }
      if (fileExt === ".webp" && mimeType !== "image/webp") {
        throw new Error("Mismatched file extension and MIME type: " + fileExt + " with " + mimeType);
      }
    }

    // File size validation (enforce 4MB safe cloud transport limit)
    let fileSize = Number(p.fileSize || 0);
    if (!fileSize && p.fileBase64) {
      let rawBase64Clean = String(p.fileBase64 || "").trim();
      if (rawBase64Clean.indexOf(",") !== -1) {
        rawBase64Clean = rawBase64Clean.split(",")[1].trim();
      }
      fileSize = Math.floor((rawBase64Clean.length * 3) / 4);
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error("File exceeds maximum allowed size of 4MB for reliable cloud transport.");
    }

    // Safe normalized filename
    const storedFileName = generateSafeStoredFileName(docDate, normType, p.title, p.originalFileName || "document.pdf");
    const folderInfo = resolveDriveFolder(financeYear, financeMonth, normType, null, function(s) {
      currentStage = s;
    });

    // Separate live Apps Script Folder handle from serializable metadata
    const targetFolder = folderInfo ? folderInfo.folder : null;
    const folderMetadata = {
      folderId: String((folderInfo && folderInfo.folderId) || "").trim(),
      folderName: String((folderInfo && folderInfo.folderName) || "").trim(),
      folderPath: String((folderInfo && folderInfo.folderPath) || "").trim(),
      folderUrl: String((folderInfo && folderInfo.folderUrl) || "").trim()
    };

    let driveFileId = p.driveFileId || "";
    let driveFileUrl = p.driveFileUrl || "";

    // Upload to Drive if base64 provided and in Apps Script environment
    if (p.fileBase64 && typeof DriveApp !== "undefined") {
      let rawBase64 = String(p.fileBase64 || "").trim();
      if (rawBase64.indexOf(",") !== -1) {
        rawBase64 = rawBase64.split(",")[1].trim();
      }

      let rawBytes;
      try {
        rawBytes = Utilities.base64Decode(rawBase64);
      } catch (b64Err) {
        currentStage = "DOC_UPLOAD_11A_BLOB_INVALID";
        if (typeof Logger !== "undefined") {
          Logger.log("base64Decode failed: " + (b64Err && b64Err.message ? b64Err.message : String(b64Err)));
        }
        throw b64Err;
      }

      if (!rawBytes || rawBytes.length === 0) {
        currentStage = "DOC_UPLOAD_11A_BLOB_INVALID";
        throw new Error("Decoded file byte array is empty");
      }

      // Deep magic byte verification
      if (fileExt === ".pdf") {
        if (rawBytes.length < 4 || rawBytes[0] !== 0x25 || rawBytes[1] !== 0x50 || rawBytes[2] !== 0x44 || rawBytes[3] !== 0x46) {
          throw new Error("File signature verification failed: Invalid PDF magic header.");
        }
      } else if (fileExt === ".png") {
        const b0 = rawBytes.length >= 1 ? (rawBytes[0] < 0 ? rawBytes[0] + 256 : rawBytes[0]) : 0;
        if (rawBytes.length < 4 || b0 !== 0x89 || rawBytes[1] !== 0x50 || rawBytes[2] !== 0x4E || rawBytes[3] !== 0x47) {
          throw new Error("File signature verification failed: Invalid PNG magic header.");
        }
      } else if (fileExt === ".jpg" || fileExt === ".jpeg") {
        const b0 = rawBytes.length >= 1 ? (rawBytes[0] < 0 ? rawBytes[0] + 256 : rawBytes[0]) : 0;
        const b1 = rawBytes.length >= 2 ? (rawBytes[1] < 0 ? rawBytes[1] + 256 : rawBytes[1]) : 0;
        if (rawBytes.length < 2 || b0 !== 0xFF || b1 !== 0xD8) {
          throw new Error("File signature verification failed: Invalid JPEG magic header.");
        }
      } else if (fileExt === ".webp") {
        const b0 = rawBytes.length >= 1 ? (rawBytes[0] < 0 ? rawBytes[0] + 256 : rawBytes[0]) : 0;
        const b1 = rawBytes.length >= 2 ? (rawBytes[1] < 0 ? rawBytes[1] + 256 : rawBytes[1]) : 0;
        const b2 = rawBytes.length >= 3 ? (rawBytes[2] < 0 ? rawBytes[2] + 256 : rawBytes[2]) : 0;
        const b3 = rawBytes.length >= 4 ? (rawBytes[3] < 0 ? rawBytes[3] + 256 : rawBytes[3]) : 0;
        const b8 = rawBytes.length >= 9 ? (rawBytes[8] < 0 ? rawBytes[8] + 256 : rawBytes[8]) : 0;
        const b9 = rawBytes.length >= 10 ? (rawBytes[9] < 0 ? rawBytes[9] + 256 : rawBytes[9]) : 0;
        const b10 = rawBytes.length >= 11 ? (rawBytes[10] < 0 ? rawBytes[10] + 256 : rawBytes[10]) : 0;
        const b11 = rawBytes.length >= 12 ? (rawBytes[11] < 0 ? rawBytes[11] + 256 : rawBytes[11]) : 0;

        if (rawBytes.length < 12 ||
            b0 !== 0x52 || b1 !== 0x49 || b2 !== 0x46 || b3 !== 0x46 ||
            b8 !== 0x57 || b9 !== 0x45 || b10 !== 0x42 || b11 !== 0x50) {
          throw new Error("File signature verification failed: Invalid WEBP magic header (expected RIFF....WEBP).");
        }
      }

      if (!storedFileName || !storedFileName.trim()) {
        currentStage = "DOC_UPLOAD_11B_FILENAME_INVALID";
        throw new Error("Generated stored filename is invalid");
      }

      const validMimeType = mimeType || "application/pdf";
      let blob;
      try {
        blob = Utilities.newBlob(rawBytes, validMimeType, storedFileName);
      } catch (blobErr) {
        currentStage = "DOC_UPLOAD_11C_MIME_INVALID";
        if (typeof Logger !== "undefined") {
          Logger.log("Utilities.newBlob failed: " + (blobErr && blobErr.message ? blobErr.message : String(blobErr)));
        }
        throw blobErr;
      }

      // Use live Folder object obtained from resolveDriveFolder, or fallback to DriveApp.getFolderById
      let folderHandle = targetFolder;
      const cleanCatFolderId = folderMetadata.folderId;

      if (!folderHandle && cleanCatFolderId && typeof DriveApp !== "undefined") {
        try {
          if (typeof Logger !== "undefined") {
            Logger.log("Category Folder Reopen Fallback Check: env=" + config.environment + ", hasId=" + (!!cleanCatFolderId) + ", len=" + cleanCatFolderId.length);
          }
          folderHandle = DriveApp.getFolderById(cleanCatFolderId);
        } catch (fErr) {
          currentStage = "DOC_UPLOAD_11D1_CATEGORY_FOLDER_REOPEN_FAILED";
          if (typeof Logger !== "undefined") {
            Logger.log("DriveApp.getFolderById(categoryFolderId) fallback failed: " + (fErr && fErr.message ? fErr.message : String(fErr)));
          }
          throw fErr;
        }
      }

      // Verify folder handle before write
      try {
        if (!folderHandle || typeof folderHandle.createFile !== "function") {
          currentStage = "DOC_UPLOAD_11D1_CATEGORY_FOLDER_REOPEN_FAILED";
          throw new Error("Target category folder handle is invalid or null");
        }
        if (typeof Logger !== "undefined") {
          Logger.log("Target category folder handle ready: name=" + (typeof folderHandle.getName === "function" ? folderHandle.getName() : "mock") + ", id=" + (typeof folderHandle.getId === "function" ? folderHandle.getId() : cleanCatFolderId));
        }
      } catch (folderCheckErr) {
        currentStage = "DOC_UPLOAD_11D1_CATEGORY_FOLDER_REOPEN_FAILED";
        if (typeof Logger !== "undefined") {
          Logger.log("Target folder handle check failed: " + (folderCheckErr && folderCheckErr.message ? folderCheckErr.message : String(folderCheckErr)));
        }
        throw folderCheckErr;
      }

      let file;
      try {
        if (typeof Logger !== "undefined") {
          Logger.log("Creating Drive File: originalNameLen=" + (p.originalFileName || "").length + ", storedFileNameLen=" + storedFileName.length + ", mimeType=" + validMimeType + ", byteLen=" + rawBytes.length + ", categoryFolderId=" + cleanCatFolderId);
        }
        file = folderHandle.createFile(blob);
      } catch (createErr) {
        const cMsg = createErr && createErr.message ? createErr.message : String(createErr);
        if (typeof Logger !== "undefined") {
          Logger.log("folderHandle.createFile(blob) failed: " + cMsg + (createErr && createErr.stack ? "\n" + createErr.stack : ""));
        }

        if (cMsg.indexOf("permission") !== -1 || cMsg.indexOf("Permission") !== -1 || cMsg.indexOf("insufficient") !== -1 || cMsg.indexOf("authorization") !== -1 || cMsg.indexOf("Access denied") !== -1 || cMsg.indexOf("scope") !== -1) {
          currentStage = "DOC_UPLOAD_11D2_CREATE_FILE_SCOPE_OR_PERMISSION_DENIED";
        } else if (cMsg.indexOf("quota") !== -1 || cMsg.indexOf("Quota") !== -1 || cMsg.indexOf("storage") !== -1 || cMsg.indexOf("Storage") !== -1 || cMsg.indexOf("rate") !== -1 || cMsg.indexOf("too many") !== -1) {
          currentStage = "DOC_UPLOAD_11D3_CREATE_FILE_QUOTA_OR_STORAGE_ERROR";
        } else if (cMsg.indexOf("invalid") !== -1 || cMsg.indexOf("Invalid") !== -1 || cMsg.indexOf("argument") !== -1 || cMsg.indexOf("Argument") !== -1 || cMsg.indexOf("blob") !== -1 || cMsg.indexOf("name") !== -1) {
          currentStage = "DOC_UPLOAD_11D4_CREATE_FILE_ARGUMENT_ERROR";
        } else {
          currentStage = "DOC_UPLOAD_11D5_CREATE_FILE_OTHER_ERROR";
        }
        throw createErr;
      }

      let postCreateErr = null;
      try {
        if (file && typeof file.getId === "function") {
          driveFileId = file.getId();
        }
        if (file && typeof file.getUrl === "function") {
          driveFileUrl = file.getUrl();
        }
      } catch (fGetErr) {
        postCreateErr = fGetErr;
        if (typeof Logger !== "undefined") {
          Logger.log("Warning: File created but getId/getUrl failed: " + (fGetErr && fGetErr.message ? fGetErr.message : String(fGetErr)));
        }
      }

      if (!driveFileId) {
        currentStage = "DOC_UPLOAD_11E_DRIVE_FILE_ID_MISSING";
        throw new Error("Drive file creation succeeded but file ID was empty");
      }

      if (postCreateErr) {
        currentStage = "DOC_UPLOAD_11F_DRIVE_FILE_METADATA_FAILED";
        if (typeof Logger !== "undefined") {
          Logger.log("File metadata error after write: " + (postCreateErr && postCreateErr.message ? postCreateErr.message : String(postCreateErr)));
        }
        throw postCreateErr;
      }

      try {
        file.setDescription("GPBC Finance Evidence: " + p.title + " | Uploaded by " + actor + " on " + nowIso);
      } catch (descErr) {
        if (typeof Logger !== "undefined") Logger.log("Setting description failed: " + (descErr && descErr.message ? descErr.message : String(descErr)));
      }

      currentStage = "DOC_UPLOAD_12_DRIVE_FILE_CREATED";
    } else if (!driveFileId) {
      driveFileId = "DRV-" + Date.now();
      driveFileUrl = "https://drive.google.com/file/d/" + driveFileId + "/view";
      currentStage = "DOC_UPLOAD_12_DRIVE_FILE_CREATED";
    }

    currentStage = "DOC_UPLOAD_13_REGISTER_OPENED";
    const documentId = "DOC-" + financeYear + String(financeMonth).padStart(2, "0") + "-" + Date.now().toString().slice(-6);

    sheet.appendRow([
      documentId,
      normType,
      p.title,
      p.originalFileName || storedFileName,
      storedFileName,
      mimeType,
      fileSize,
      driveFileId,
      driveFileUrl,
      folderMetadata.folderId,
      docDate,
      financeYear,
      financeMonth,
      normEntityType,
      relEntityId,
      relTxnId,
      relRmbId,
      relCapId,
      relChkId,
      p.source || "Manual Upload",
      contentHash,
      status,
      isPostCloseAddition,
      postCloseReason,
      addedAfterCloseAt,
      addedAfterCloseBy,
      closedPeriodReference,
      p.notes || "",
      actor,
      nowIso,
      nowIso
    ]);
    currentStage = "DOC_UPLOAD_14_ROW_APPENDED";

    currentStage = "DOC_UPLOAD_15_COMPLETE";
    return {
      success: true,
      documentId: documentId,
      storedFileName: storedFileName,
      driveFileId: driveFileId,
      driveFileUrl: driveFileUrl,
      folderPath: folderMetadata.folderPath,
      status: status,
      isPostCloseAddition: isPostCloseAddition,
      postCloseReason: postCloseReason
    };
  } catch (err) {
    if (typeof Logger !== "undefined") {
      Logger.log("uploadDocument error at stage " + currentStage + ": " + (err && err.message ? err.message : String(err)) + (err && err.stack ? "\n" + err.stack : ""));
    }
    const isValidationErr = err && err.message && (
      err.message.indexOf("CLOSED") !== -1 ||
      err.message.indexOf("required") !== -1 ||
      err.message.indexOf("exceeds") !== -1 ||
      err.message.indexOf("Forbidden") !== -1 ||
      err.message.indexOf("Mismatched") !== -1 ||
      err.message.indexOf("Unsupported") !== -1 ||
      err.message.indexOf("signature") !== -1
    );
    if (isValidationErr) {
      throw err;
    }
    const config = getConfig();
    if (config && config.environment === "sandbox") {
      return {
        success: false,
        error: "Server processing error",
        diagnosticCode: currentStage
      };
    }
    return {
      success: false,
      error: "Server processing error"
    };
  }
}

/**
 * Links an existing Document_Register entry to an authoritative finance entity
 */
function linkDocumentToEntity(p, userEmail) {
  p = p || {};
  if (!p.documentId) throw new Error("documentId is required");
  if (!p.relatedEntityType && !p.relatedTransactionId && !p.relatedReimbursementId && !p.relatedCheckId && !p.relatedCapitalProjectId) {
    throw new Error("At least one related entity reference is required");
  }

  const db = getDB(true, "linkDocumentToEntity");
  const sheet = db.getSheetByName("Document_Register");
  if (!sheet || sheet.getLastRow() <= 1) throw new Error("Document_Register sheet is empty or missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("documentId");
  const rowIdx = data.findIndex(function(r) { return r[idCol] === p.documentId; });

  if (rowIdx === -1) throw new Error("Document not found: " + p.documentId);

  const docRow = data[rowIdx];
  const dateCol = headers.indexOf("documentDate");
  const docDate = docRow[dateCol];
  const periodKey = getPeriodKey(docDate);
  const isClosed = isDateInClosedPeriod(docDate, db);

  const targetRow = rowIdx + 2;
  const nowIso = new Date().toISOString();
  const actor = userEmail || "System";

  let isPostClose = docRow[headers.indexOf("isPostCloseAddition")];
  let postCloseReason = docRow[headers.indexOf("postCloseReason")];

  if (isClosed) {
    if (!p.postCloseReason && !postCloseReason) {
      throw new Error(
        "Period " + periodKey + " is CLOSED. Linking post-close supporting evidence requires an authorized documented reason (postCloseReason)."
      );
    }
    isPostClose = true;
    if (p.postCloseReason) postCloseReason = String(p.postCloseReason).trim();
  }

  const ENTITY_TYPE_COL = headers.indexOf("relatedEntityType") + 1;
  const ENTITY_ID_COL = headers.indexOf("relatedEntityId") + 1;
  const TXN_ID_COL = headers.indexOf("relatedTransactionId") + 1;
  const RMB_ID_COL = headers.indexOf("relatedReimbursementId") + 1;
  const PRJ_ID_COL = headers.indexOf("relatedCapitalProjectId") + 1;
  const CHK_ID_COL = headers.indexOf("relatedCheckId") + 1;
  const STATUS_COL = headers.indexOf("status") + 1;
  const POST_CLOSE_COL = headers.indexOf("isPostCloseAddition") + 1;
  const POST_REASON_COL = headers.indexOf("postCloseReason") + 1;
  const POST_TIME_COL = headers.indexOf("addedAfterCloseAt") + 1;
  const POST_BY_COL = headers.indexOf("addedAfterCloseBy") + 1;
  const CLOSED_REF_COL = headers.indexOf("closedPeriodReference") + 1;
  const UPDATED_COL = headers.indexOf("updatedAt") + 1;

  if (p.relatedEntityType && ENTITY_TYPE_COL > 0) sheet.getRange(targetRow, ENTITY_TYPE_COL).setValue(p.relatedEntityType);
  if (p.relatedEntityId && ENTITY_ID_COL > 0) sheet.getRange(targetRow, ENTITY_ID_COL).setValue(p.relatedEntityId);
  if (p.relatedTransactionId && TXN_ID_COL > 0) sheet.getRange(targetRow, TXN_ID_COL).setValue(p.relatedTransactionId);
  if (p.relatedReimbursementId && RMB_ID_COL > 0) sheet.getRange(targetRow, RMB_ID_COL).setValue(p.relatedReimbursementId);
  if (p.relatedCapitalProjectId && PRJ_ID_COL > 0) sheet.getRange(targetRow, PRJ_ID_COL).setValue(p.relatedCapitalProjectId);
  if (p.relatedCheckId && CHK_ID_COL > 0) sheet.getRange(targetRow, CHK_ID_COL).setValue(p.relatedCheckId);
  if (STATUS_COL > 0) sheet.getRange(targetRow, STATUS_COL).setValue("Linked");
  if (isClosed && POST_CLOSE_COL > 0) sheet.getRange(targetRow, POST_CLOSE_COL).setValue(true);
  if (isClosed && POST_REASON_COL > 0 && postCloseReason) sheet.getRange(targetRow, POST_REASON_COL).setValue(postCloseReason);
  if (isClosed && POST_TIME_COL > 0) sheet.getRange(targetRow, POST_TIME_COL).setValue(nowIso);
  if (isClosed && POST_BY_COL > 0) sheet.getRange(targetRow, POST_BY_COL).setValue(actor);
  if (isClosed && CLOSED_REF_COL > 0) sheet.getRange(targetRow, CLOSED_REF_COL).setValue(periodKey);
  if (UPDATED_COL > 0) sheet.getRange(targetRow, UPDATED_COL).setValue(nowIso);

  return {
    success: true,
    documentId: p.documentId,
    status: "Linked",
    isPostCloseAddition: Boolean(isPostClose),
    postCloseReason: postCloseReason || "",
    updatedAt: nowIso
  };
}

/**
 * Updates document metadata (status, notes, title, documentType)
 */
function updateDocumentStatus(p, userEmail) {
  p = p || {};
  if (!p.documentId) throw new Error("documentId is required");

  const db = getDB(true, "updateDocumentStatus");
  const sheet = db.getSheetByName("Document_Register");
  if (!sheet || sheet.getLastRow() <= 1) throw new Error("Document_Register sheet is empty or missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("documentId");
  const rowIdx = data.findIndex(function(r) { return r[idCol] === p.documentId; });

  if (rowIdx === -1) throw new Error("Document not found: " + p.documentId);

  const docRow = data[rowIdx];
  const dateCol = headers.indexOf("documentDate");
  const docDate = docRow[dateCol];

  // Period Lock Guard
  assertPeriodWritable(docDate, "updateDocumentStatus", userEmail, db);

  const targetRow = rowIdx + 2;
  const nowIso = new Date().toISOString();

  const STATUS_COL = headers.indexOf("status") + 1;
  const NOTES_COL = headers.indexOf("notes") + 1;
  const TITLE_COL = headers.indexOf("title") + 1;
  const TYPE_COL = headers.indexOf("documentType") + 1;
  const UPDATED_COL = headers.indexOf("updatedAt") + 1;

  if (p.status && STATUS_COL > 0) sheet.getRange(targetRow, STATUS_COL).setValue(p.status);
  if (p.notes !== undefined && NOTES_COL > 0) sheet.getRange(targetRow, NOTES_COL).setValue(p.notes);
  if (p.title && TITLE_COL > 0) sheet.getRange(targetRow, TITLE_COL).setValue(p.title);
  if (p.documentType && TYPE_COL > 0) sheet.getRange(targetRow, TYPE_COL).setValue(p.documentType);
  if (UPDATED_COL > 0) sheet.getRange(targetRow, UPDATED_COL).setValue(nowIso);

  return {
    success: true,
    documentId: p.documentId,
    status: p.status || docRow[headers.indexOf("status")],
    updatedAt: nowIso
  };
}

/**
 * Deletes / archives a document from Document_Register (Admin only)
 */
function deleteDocument(p, userEmail) {
  p = p || {};
  if (!p.documentId) throw new Error("documentId is required");

  const db = getDB(true, "deleteDocument");
  const sheet = db.getSheetByName("Document_Register");
  if (!sheet || sheet.getLastRow() <= 1) throw new Error("Document_Register sheet is empty or missing");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("documentId");
  const rowIdx = data.findIndex(function(r) { return r[idCol] === p.documentId; });

  if (rowIdx === -1) throw new Error("Document not found: " + p.documentId);

  const docRow = data[rowIdx];
  const dateCol = headers.indexOf("documentDate");
  const docDate = docRow[dateCol];

  // Period Lock Guard
  assertPeriodWritable(docDate, "deleteDocument", userEmail, db);

  const targetRow = rowIdx + 2;
  const STATUS_COL = headers.indexOf("status") + 1;
  const UPDATED_COL = headers.indexOf("updatedAt") + 1;
  const nowIso = new Date().toISOString();

  if (p.hardDelete) {
    sheet.deleteRow(targetRow);
    return { success: true, documentId: p.documentId, deleted: true };
  } else {
    if (STATUS_COL > 0) sheet.getRange(targetRow, STATUS_COL).setValue("Archived");
    if (UPDATED_COL > 0) sheet.getRange(targetRow, UPDATED_COL).setValue(nowIso);
    return { success: true, documentId: p.documentId, status: "Archived" };
  }
}

/**
 * Normalizes vendor name for deterministic matching (Gas/backend)
 */
function normalizeVendorInGas(vendor) {
  if (!vendor) return "";
  return String(vendor)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(inc|incorporated|llc|corp|corporation|co|company|supercenter|super store|store|market|shop)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks for potential duplicate documents in Document_Register (Read-only)
 */
function checkDocumentDuplicate(p) {
  p = p || {};
  const db = getDB(false, "checkDocumentDuplicate");
  const sheet = db.getSheetByName("Document_Register");
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, isDuplicate: false };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const hashCol = headers.indexOf("contentHash");
  const fileCol = headers.indexOf("originalFileName");
  const sizeCol = headers.indexOf("fileSize");
  const dateCol = headers.indexOf("documentDate");
  const titleCol = headers.indexOf("title");
  const idCol = headers.indexOf("documentId");
  const notesCol = headers.indexOf("notes");

  const queryHash = String(p.contentHash || "").trim();
  const queryFile = String(p.filename || p.originalFileName || "").trim().toLowerCase();
  const querySize = Number(p.fileSize || 0);
  const queryDate = String(p.documentDate || p.date || "").trim();
  const queryAmount = p.amount != null && !isNaN(Number(p.amount)) ? Number(p.amount) : null;
  const queryVendor = p.vendor ? normalizeVendorInGas(p.vendor) : "";

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const docId = String(row[idCol] || "");
    const docTitle = String(row[titleCol] || "");

    // 1. Content Hash Exact Match (SHA-256)
    if (queryHash && hashCol !== -1 && String(row[hashCol] || "").trim() === queryHash) {
      return {
        success: true,
        isDuplicate: true,
        duplicateDocumentId: docId,
        duplicateTitle: docTitle,
        reason: "Exact content hash match (SHA-256) with document " + docId + " (" + docTitle + ")"
      };
    }

    // 2. Filename & File Size Match
    if (queryFile && querySize > 0 && fileCol !== -1 && sizeCol !== -1) {
      const rowSize = Number(row[sizeCol] || 0);
      const rowName = String(row[fileCol] || "").toLowerCase();
      if (rowSize === querySize && rowName === queryFile) {
        return {
          success: true,
          isDuplicate: true,
          duplicateDocumentId: docId,
          duplicateTitle: docTitle,
          reason: "Matching filename (" + queryFile + ") and file size (" + querySize + " bytes) on document " + docId
        };
      }
    }

    // 3. Matching Date & Amount (& Vendor)
    if (queryDate && queryAmount != null && dateCol !== -1) {
      const rowDate = toDateStringSafe(row[dateCol]);
      if (rowDate === queryDate) {
        const rowNotes = String(row[notesCol] || "");
        const amountMatch = (
          rowNotes.indexOf("\"amount\":" + queryAmount) !== -1 ||
          docTitle.indexOf("$" + queryAmount) !== -1 ||
          docTitle.indexOf("$" + queryAmount.toFixed(2)) !== -1
        );
        if (amountMatch) {
          return {
            success: true,
            isDuplicate: true,
            duplicateDocumentId: docId,
            duplicateTitle: docTitle,
            reason: "Matching date (" + rowDate + ") and amount ($" + queryAmount.toFixed(2) + ")" + (p.vendor ? " for " + p.vendor : "") + " on document " + docId
          };
        }
      }
    }
  }

  return { success: true, isDuplicate: false };
}

/**
 * Searches and ranks candidate finance records for Smart Upload matching (Read-only)
 */
function findDocumentMatches(p) {
  p = p || {};

  // Bank statements must NOT match individual lines in Phase 1
  if (p.documentType === "Bank Statement") {
    return { success: true, count: 0, matches: [] };
  }

  const db = getDB(false, "findDocumentMatches");
  const matches = [];

  const queryVendor = normalizeVendorInGas(p.vendor);
  const queryAmount = p.amount != null ? Number(p.amount) : null;
  const queryDate = p.documentDate || p.date || "";

  // 1. Search Transactions
  const tSheet = db.getSheetByName("Transactions");
  if (tSheet && tSheet.getLastRow() > 1) {
    const tData = tSheet.getDataRange().getValues();
    const tHeaders = tData.shift();
    const idCol = tHeaders.indexOf("transactionId");
    const dateCol = tHeaders.indexOf("transactionDate");
    const amtCol = tHeaders.indexOf("amount") !== -1 ? tHeaders.indexOf("amount") : (tHeaders.indexOf("netAmount") !== -1 ? tHeaders.indexOf("netAmount") : tHeaders.indexOf("grossAmount"));
    const vendorCol = tHeaders.indexOf("payeeOrPayer") !== -1 ? tHeaders.indexOf("payeeOrPayer") : tHeaders.indexOf("vendorPayee");
    const descCol = tHeaders.indexOf("description");
    const prjCol = tHeaders.indexOf("capitalProjectId");
    const persCol = tHeaders.indexOf("personalPurchase");
    const chkCol = tHeaders.indexOf("checkNumber");
    const dirCol = tHeaders.indexOf("direction");
    const typeCol = tHeaders.indexOf("transactionType");

    for (let i = 0; i < tData.length; i++) {
      const row = tData[i];
      const tId = String(row[idCol] || "");
      const tDate = toDateStringSafe(row[dateCol]);
      const tAmount = amtCol !== -1 ? Math.abs(Number(row[amtCol] || 0)) : 0;
      const tVendor = vendorCol !== -1 ? String(row[vendorCol] || "") : "";
      const normTVendor = normalizeVendorInGas(tVendor);
      const tDesc = descCol !== -1 ? String(row[descCol] || "") : "";
      const tPrj = prjCol !== -1 ? String(row[prjCol] || "") : "";
      const tPers = (persCol !== -1 && (row[persCol] === true || String(row[persCol]).toLowerCase() === "true"));
      const tDir = (dirCol !== -1 && row[dirCol]) ? String(row[dirCol]).trim().toUpperCase() : "";
      const tType = (typeCol !== -1 && row[typeCol]) ? String(row[typeCol]).trim() : "";

      const isIncomeTxn = (tDir === "INCOME" || tType.toLowerCase().indexOf("income") !== -1 || tType.toLowerCase().indexOf("offering") !== -1 || tType.toLowerCase().indexOf("tithe") !== -1);
      const isExpenseTxn = (tDir === "EXPENSE" || tType.toLowerCase().indexOf("expense") !== -1 || (!isIncomeTxn && tAmount > 0));

      // Financial Direction & Type Compatibility Rules
      if (p.documentType === "Offering / Income Evidence") {
        // Must be an income transaction (never suggest church expense for donation proof)
        if (!isIncomeTxn) continue;
      } else if (p.documentType === "Receipt" || p.documentType === "Invoice" || p.documentType === "Check" || p.documentType === "Reimbursement Proof" || p.documentType === "Reimbursement Evidence" || p.documentType === "Refund / Credit") {
        // Purchase & refund evidence must only match expenses (never suggest donation income for a receipt or refund)
        if (isIncomeTxn && !isExpenseTxn) continue;
      }

      let score = 0;
      const reasons = [];

      // Amount Match
      if (queryAmount != null && Math.abs(queryAmount - tAmount) < 0.005) {
        score += 40;
        reasons.push("Exact amount match: $" + queryAmount.toFixed(2));
      } else if (queryAmount != null && Math.abs(queryAmount - tAmount) < 1.0) {
        score += 15;
        reasons.push("Close amount match");
      }

      // Date Match
      if (queryDate && tDate) {
        if (queryDate === tDate) {
          score += 30;
          reasons.push("Exact date match (" + queryDate + ")");
        } else {
          const d1 = new Date(queryDate);
          const d2 = new Date(tDate);
          const diffDays = Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            score += 20;
            reasons.push("Date within " + diffDays + " days");
          } else if (diffDays <= 7) {
            score += 10;
            reasons.push("Date within " + diffDays + " days");
          }
        }
      }

      // Vendor Match
      if (queryVendor && normTVendor) {
        if (queryVendor === normTVendor) {
          score += 25;
          reasons.push("Exact vendor match: \"" + tVendor + "\"");
        } else if (normTVendor.indexOf(queryVendor) !== -1 || queryVendor.indexOf(normTVendor) !== -1) {
          score += 15;
          reasons.push("Partial vendor match: \"" + tVendor + "\"");
        }
      }

      // Capital Project Match
      if (p.capitalProjectId && tPrj && p.capitalProjectId === tPrj) {
        score += 15;
        reasons.push("Capital Project match (" + tPrj + ")");
      }

      // Check Number Match
      const tChk = (chkCol !== -1 && row[chkCol]) ? String(row[chkCol]).trim() : "";
      if (p.checkNumber && tChk && String(p.checkNumber).trim() === tChk) {
        score += 25;
        reasons.push("Check number match (" + tChk + ")");
      }

      // Reimbursement Context Match
      if ((p.documentType === "Reimbursement Proof" || p.documentType === "Reimbursement Evidence") && tPers) {
        score += 15;
        reasons.push("Personal purchase transaction");
      }

      if (score >= 20) {
        let confidence = "Weak Match";
        if (score >= 75) confidence = "Strong Match";
        else if (score >= 45) confidence = "Possible Match";

        matches.push({
          candidate: {
            id: "TXN-" + tId,
            entityType: "TRANSACTION",
            entityId: tId,
            displayTitle: (tVendor || tDesc || "Transaction") + " - $" + tAmount.toFixed(2),
            amount: tAmount,
            date: tDate,
            vendorPayee: tVendor,
            description: tDesc,
            capitalProjectId: tPrj,
            personalPurchase: tPers,
            checkNumber: tChk || undefined
          },
          score: score,
          confidenceLabel: confidence,
          reasons: reasons
        });
      }
    }
  }

  // 2. Search Reimbursements
  const rSheet = db.getSheetByName("Reimbursements");
  if (rSheet && rSheet.getLastRow() > 1 && p.documentType !== "Offering / Income Evidence") {
    const rData = rSheet.getDataRange().getValues();
    const rHeaders = rData.shift();
    const idCol = rHeaders.indexOf("reimbursementId");
    const dateCol = rHeaders.indexOf("reimbursementDate");
    const nameCol = rHeaders.indexOf("claimantName");
    const remCol = rHeaders.indexOf("remainingReimbursable");
    const totCol = rHeaders.indexOf("totalPurchaseAmount");
    const rChkCol = rHeaders.indexOf("checkNumber");

    for (let i = 0; i < rData.length; i++) {
      const row = rData[i];
      const rId = String(row[idCol] || "");
      const rDate = toDateStringSafe(row[dateCol]);
      const rName = String(row[nameCol] || "");
      const rAmount = Number(row[remCol] || row[totCol] || 0);
      const rChk = (rChkCol !== -1 && row[rChkCol]) ? String(row[rChkCol]).trim() : "";

      let score = 0;
      const reasons = [];

      if (queryAmount != null && Math.abs(queryAmount - rAmount) < 0.005) {
        score += 40;
        reasons.push("Exact reimbursement obligation match: $" + queryAmount.toFixed(2));
      }

      if (queryDate && rDate && queryDate === rDate) {
        score += 30;
        reasons.push("Exact date match (" + queryDate + ")");
      }

      if (p.checkNumber && rChk && String(p.checkNumber).trim() === rChk) {
        score += 25;
        reasons.push("Check number match (" + rChk + ")");
      }

      if (p.documentType === "Reimbursement Proof" || p.documentType === "Reimbursement Evidence") {
        score += 15;
        reasons.push("Reimbursement category match");
      }

      if (score >= 20) {
        let confidence = "Weak Match";
        if (score >= 75) confidence = "Strong Match";
        else if (score >= 45) confidence = "Possible Match";

        matches.push({
          candidate: {
            id: "REIM-" + rId,
            entityType: "REIMBURSEMENT",
            entityId: rId,
            displayTitle: "Reimbursement: " + rName + " - $" + rAmount.toFixed(2),
            amount: rAmount,
            date: rDate,
            vendorPayee: rName,
            description: "Reimbursement obligation for " + rName,
            checkNumber: rChk || undefined
          },
          score: score,
          confidenceLabel: confidence,
          reasons: reasons
        });
      }
    }
  }

  // 3. Search Capital Projects
  const cSheet = db.getSheetByName("Capital_Projects");
  if (cSheet && cSheet.getLastRow() > 1 && p.documentType !== "Offering / Income Evidence" && (p.documentType === "Capital Project" || p.capitalProjectId)) {
    const cData = cSheet.getDataRange().getValues();
    const cHeaders = cData.shift();
    const pIdCol = cHeaders.indexOf("projectId");
    const pNameCol = cHeaders.indexOf("projectName");
    const pBudgetCol = cHeaders.indexOf("approvedBudget");

    for (let i = 0; i < cData.length; i++) {
      const row = cData[i];
      const pId = String(row[pIdCol] || "");
      const pName = String(row[pNameCol] || "");
      const pBudget = Number(row[pBudgetCol] || 0);

      let score = 0;
      const reasons = [];

      if (p.capitalProjectId && (p.capitalProjectId === pId || p.capitalProjectId === pName)) {
        score += 50;
        reasons.push("Explicit project match (" + pName + ")");
      } else if (queryVendor && (pName.toLowerCase().indexOf(queryVendor.toLowerCase()) !== -1 || queryVendor.toLowerCase().indexOf(pName.toLowerCase()) !== -1)) {
        score += 30;
        reasons.push("Project name similarity: " + pName);
      }

      if (score >= 20) {
        let confidence = "Weak Match";
        if (score >= 75) confidence = "Strong Match";
        else if (score >= 45) confidence = "Possible Match";

        matches.push({
          candidate: {
            id: "CAP-" + pId,
            entityType: "CAPITAL_PROJECT",
            entityId: pId,
            displayTitle: "Capital Project: " + pName + " (Budget: $" + pBudget.toFixed(2) + ")",
            amount: pBudget,
            vendorPayee: pName,
            description: "Capital Project " + pName,
            capitalProjectId: pId
          },
          score: score,
          confidenceLabel: confidence,
          reasons: reasons
        });
      }
    }
  }

  // Sort descending by score
  matches.sort(function(a, b) { return b.score - a.score; });

  return {
    success: true,
    count: matches.length,
    matches: matches
  };
}

/**
 * Retrieves sanitized options and authoritative closed periods for Smart Upload UI (Read-only)
 */
function getSmartUploadOptions(p) {
  const db = getDB(false, "getSmartUploadOptions");

  // 1. Retrieve Closed Periods from Monthly_Close
  const closedPeriods = [];
  const mcSheet = db.getSheetByName("Monthly_Close");
  if (mcSheet && mcSheet.getLastRow() > 1) {
    const mcData = mcSheet.getDataRange().getValues();
    const mcHeaders = mcData.shift();
    const periodCol = mcHeaders.indexOf("periodKey");
    const statusCol = mcHeaders.indexOf("status");
    if (periodCol !== -1 && statusCol !== -1) {
      for (let i = 0; i < mcData.length; i++) {
        const row = mcData[i];
        if (String(row[statusCol] || "").trim().toLowerCase() === "closed") {
          const key = String(row[periodCol] || "").trim();
          if (key && closedPeriods.indexOf(key) === -1) {
            closedPeriods.push(key);
          }
        }
      }
    }
  }

  // 2. Retrieve Capital Projects from Capital_Projects
  const capitalProjects = [];
  const cpSheet = db.getSheetByName("Capital_Projects");
  if (cpSheet && cpSheet.getLastRow() > 1) {
    const cpData = cpSheet.getDataRange().getValues();
    const cpHeaders = cpData.shift();
    const idCol = cpHeaders.indexOf("projectId");
    const nameCol = cpHeaders.indexOf("projectName");
    const statusCol = cpHeaders.indexOf("status");
    if (idCol !== -1 && nameCol !== -1) {
      for (let i = 0; i < cpData.length; i++) {
        const row = cpData[i];
        const status = String(row[statusCol] || "").trim();
        if (!status || status.toLowerCase() === "active" || status.toLowerCase() === "open") {
          const pid = String(row[idCol] || "").trim();
          const pname = String(row[nameCol] || "").trim();
          capitalProjects.push({
            id: pid,
            name: pname,
            projectId: pid,
            projectName: pname
          });
        }
      }
    }
  }

  const config = (typeof getConfig === "function") ? getConfig() : {};
  const writesEnabled = config && config.environment === "production"
    ? (config.productionWritesEnabled === "true" || config.productionWritesEnabled === true)
    : true;

  return {
    success: true,
    closedPeriods: closedPeriods,
    capitalProjects: capitalProjects,
    documentTypes: DOCUMENT_TYPES,
    writesEnabled: writesEnabled
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DOCUMENT_TYPES,
    DOCUMENT_CATEGORY_FOLDERS,
    MONTH_NAMES,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    getMonthFolderName,
    getCategoryFolderName,
    generateSafeStoredFileName,
    computeContentHash,
    resolveDriveFolder,
    getDocuments,
    uploadDocument,
    linkDocumentToEntity,
    updateDocumentStatus,
    deleteDocument,
    checkDocumentDuplicate,
    findDocumentMatches,
    getSmartUploadOptions,
    normalizeVendorInGas
  };
}
