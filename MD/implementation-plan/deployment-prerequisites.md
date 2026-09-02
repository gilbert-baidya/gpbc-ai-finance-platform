# GPBC Finance Desk — Deployment Prerequisites & Configuration Guide

**Product**: GPBC Finance Desk — Finance • Audit • Reporting  
**Authoritative Specs**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`, `MD/GPBC_Finance_Control_Book_Build_Handoff.md`  

---

## 1. Google Cloud Console (OAuth 2.0 Web Client)

1. Open [Google Cloud Console](https://console.cloud.google.com/) under the GPBC Google Workspace account.
2. Navigate to **APIs & Services** > **Credentials**.
3. Create or configure an **OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Name**: `GPBC Finance Desk Web Client`
   - **Authorized JavaScript origins**:
       - `http://127.0.0.1:5173` (current sandbox integration origin)
    - Do not add production origins or redirects during the sandbox integration task.
4. Copy the **Client ID** (e.g., `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
   *Note: Do NOT commit or expose the Client Secret. Only the public Client ID is needed in the frontend build.*

---

## 2. Frontend Environment Configuration

In `.env.local` (kept git-ignored):

```env
VITE_GPBC_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

---

## 3. Google Apps Script Configuration (Script Properties)

In Google Apps Script (under **Project Settings** > **Script Properties**):

| Property Name | Description | Example / Production Value |
|---|---|---|
| `GPBC_SHEET_ID` | Master Google Spreadsheet ID | `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s` (or sandbox ID) |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID for audience verification | Matching `VITE_GOOGLE_CLIENT_ID` |
| `GPBC_APPROVED_USERS` | JSON array of approved user objects with roles | `[{"email":"admin@gracepraise.church","role":"Primary Admin","name":"Pastor Gilbert"},{"email":"backup@gmail.com","role":"Backup Admin","name":"Backup Admin"},{"email":"finance@gracepraise.church","role":"Finance Editor","name":"Finance Team"},{"email":"presbyter@socalnetwork.org","role":"Presbyter Read-Only","name":"Presbyter"}]` |
| `GPBC_ENVIRONMENT` | Environment guard (`production` or `sandbox`) | `sandbox` (for testing) / `production` |
| `GPBC_PRODUCTION_WRITES_ENABLED` | Explicit production write arm | `false` for all sandbox integration work |

---

## 4. Master Sheet Sandbox & Backup Procedure

1. Open the production Sheet: `https://docs.google.com/spreadsheets/d/1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s/edit`
2. Make a private backup: **File** > **Make a copy** > Name: `GPBC_Finance_Master_BACKUP_YYYYMMDD`
3. Make a sandbox development copy: **File** > **Make a copy** > Name: `GPBC_Finance_Master_SANDBOX`
4. Use the sandbox Sheet ID in Script Properties during development and schema migration testing.
5. Never perform test write operations or schema alterations directly on the production spreadsheet.

---

## 5. Shared API Key Rotation Notice

The previously used client-side shared API key (`VITE_GPBC_API_KEY`) is deprecated and retired from production authentication. If the legacy key was used in prior deployments, remove it from Google Apps Script Script Properties and rotate any associated credentials.
