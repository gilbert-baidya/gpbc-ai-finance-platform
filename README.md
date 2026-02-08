# 🏛️ GPBC AI Finance Platform

**Grace and Praise Bangladeshi Church - Enterprise Finance Management System**

A premium, modern church finance management platform built with React, Vite, and Google Apps Script. Designed for ministry leaders to manage members, track contributions, generate reports, and maintain financial transparency with ease.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Application Structure](#application-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
- [API Integration](#api-integration)
- [Security Features](#security-features)
- [Design System](#design-system)

---

## 🌟 Overview

GPBC AI Finance Platform is a comprehensive church management system that empowers ministry leaders to:

- **Manage Members** - Complete member database with contact info, family details, and membership status
- **Track Contributions** - Record tithes, offerings, and donations with detailed categorization
- **Generate Statements** - Automated tax-ready contribution statements (PDF, bulk ZIP exports)
- **Financial Reports** - Excel exports of all financial data for accounting and auditing
- **Role-Based Access** - Admin, Treasurer, and Reverend roles with appropriate permissions
- **Audit Trail** - Complete logging of all sensitive operations for accountability
- **Multi-Tenant Ready** - Infrastructure to support multiple churches in one platform

---

## ✨ Features

### 📊 Dashboard
- Real-time financial overview (tithes, offerings, expenses, net balance)
- Monthly trends and giving momentum analysis
- Financial health score indicators
- Ministry opportunity highlights

### 👥 Member Management
- Add, view, and search church members
- Detailed member profiles (contact, address, membership details)
- Active/inactive status tracking
- Generate individual yearly contribution statements (PDF)
- Bulk year-end statement generation (ZIP download)

### 💰 Contribution Tracking
- Record member contributions with date, type, amount, and payment method
- Support for multiple contribution types (Tithe, Offering, Building Fund, Mission, etc.)
- Service type categorization (Sunday Service, Wednesday Service, Online, etc.)
- Export all contributions to Excel (XLSX) for treasurer records

### 📝 Expense Management
- Record ministry expenses with categorization
- Cascading category selection (Ministry Operations, Community Outreach, etc.)
- Date tracking and notes for expense documentation

### 📄 Document Generation
- **Individual Statements** - PDF contribution statements per member per year
- **Bulk Statements** - ZIP file with all member statements for year-end distribution
- **Thank You Letters** - Auto-generated appreciation letters
- **Tax Documents** - IRS-compliant contribution statements

### 🔐 Security & Audit
- Role-based access control (RBAC)
- Audit trail logging for all sensitive actions
- Secure API communication with Google Apps Script backend
- User activity tracking (who, what, when)

### 🎨 Premium UI/UX
- Modern, clean interface with glass morphism design
- Responsive layout (desktop, tablet, mobile)
- Inter font system for premium typography
- Wine (#4A0E1A) and Green (#1F6F54) theme colors
- Smooth animations and transitions
- Loading states and skeleton screens
- Empty state messages

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0** - Modern UI library with hooks
- **Vite 7.2.4** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon system
- **jsPDF** - PDF generation
- **ExcelJS** - Excel file creation (secure replacement for xlsx)
- **JSZip** - ZIP file generation
- **File Saver** - Browser file downloads

### Backend
- **Google Apps Script** - Serverless backend
- **Google Sheets** - Database (Members, Contributions, Expenses, Audit Log)
- **RESTful API** - JSON-based communication

### Development
- **ESLint** - Code quality
- **Vite Dev Server** - Hot module replacement
- **Environment Variables** - Secure configuration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Google Account with Apps Script access
- Google Sheet for data storage

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd gpbc-ai-finance-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Edit `.env.local` with your credentials:**
   ```env
   VITE_GPBC_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   VITE_GPBC_API_KEY=your-secret-api-key
   VITE_GPBC_SHEET_ID=your-google-sheet-id
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 📁 Application Structure

```
gpbc-ai-finance-platform/
├── src/
│   ├── api/                    # API integration layer
│   │   ├── auditApi.js         # Audit trail logging
│   │   ├── contributionsApi.js # Contribution data fetching
│   │   ├── gpbcApi.js          # Core GPBC API functions
│   │   ├── memberStatementApi.js # Member statement generation
│   │   └── tenantApi.js        # Multi-tenant API helpers
│   │
│   ├── auth/                   # Authentication & Authorization
│   │   ├── AuthContext.jsx     # Auth state management
│   │   ├── RoleGuard.jsx       # Role-based component wrapper
│   │   └── DevRoleSwitcher.jsx # Dev tool for role testing
│   │
│   ├── components/             # Reusable UI components
│   │   ├── AddMemberModal.jsx  # Member creation modal
│   │   ├── ContributionForm.jsx # Contribution entry form
│   │   ├── Header.jsx          # App header with navigation
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── TenantSwitcher.jsx  # Church selector (multi-tenant)
│   │   └── ui/                 # UI primitives
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudit.js         # Audit logging hook
│   │   ├── useDashboardData.js # Dashboard data fetching
│   │   └── useRoleGuard.js     # Role permission checking
│   │
│   ├── pages/                  # Application pages
│   │   ├── Dashboard.jsx       # Financial dashboard
│   │   ├── Members.jsx         # Member directory
│   │   ├── MembersDirectory.jsx # Enhanced member list
│   │   ├── Contributions.jsx   # Contribution entry
│   │   └── Expenses.jsx        # Expense recording
│   │
│   ├── tenants/                # Multi-tenant configuration
│   │   ├── tenantConfig.js     # Tenant definitions
│   │   └── TenantContext.jsx   # Tenant state management
│   │
│   ├── utils/                  # Utility functions
│   │   ├── buildStatementText.js           # Statement text formatter
│   │   ├── ContributionStatementGenerator.js # Tax statement generator
│   │   ├── donorInsights.js                # Giving analytics
│   │   ├── downloadAllContributionsXlsx.js # Excel export
│   │   ├── downloadAllStatementsZip.js     # Bulk PDF + ZIP
│   │   ├── downloadPdf.js                  # PDF download helper
│   │   ├── exportContributionsXlsx.js      # Excel workbook builder
│   │   ├── givingPrediction.js             # AI-style forecast
│   │   ├── ThankYouLetter.js               # Thank you generator
│   │   └── toast.js                        # Toast notifications
│   │
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles + design system
│
├── public/                     # Static assets
├── .env.local                  # Environment configuration (gitignored)
├── package.json                # Dependencies
└── vite.config.js              # Vite configuration
```

---

## 👤 User Roles & Permissions

### Admin
**Full Access** - Complete system control
- ✅ View all financial data
- ✅ Add/edit members
- ✅ Record contributions
- ✅ Export data (Excel, PDF, ZIP)
- ✅ Generate statements
- ✅ Access audit logs
- ✅ Switch tenants (future)

### Treasurer
**Financial Management** - Handle money and reports
- ✅ View financial data
- ✅ Record contributions
- ✅ Export contributions (Excel)
- ✅ Generate member statements (PDF, ZIP)
- ❌ Cannot access all admin settings

### Rev (Reverend)
**Ministry Overview** - Dashboard and insights
- ✅ View dashboard metrics
- ✅ See giving trends
- ✅ View ministry opportunities
- ❌ Cannot export raw financial data
- ❌ Cannot access treasurer tools

**Role Switching:** Use the Dev Role Switcher (bottom-right corner) to test different permissions during development.

---

## 📦 Core Modules

### 1. Member Management Module
**Files:** `AddMemberModal.jsx`, `MembersDirectory.jsx`, `memberStatementApi.js`

**Features:**
- Add new members with full details (name, email, phone, address, etc.)
- Search and filter member directory
- View member cards with contact info and status
- Generate individual yearly contribution statements (PDF)
- Bulk year-end statement generation (ZIP download)

**API Actions:**
- `addMember` - Create new member record
- `getMembers` - Fetch all members
- `getMemberYearlyContributions` - Get member's contributions for statement

---

### 2. Contribution Tracking Module
**Files:** `ContributionForm.jsx`, `contributionsApi.js`, `exportContributionsXlsx.js`

**Features:**
- Record contributions with member name, amount, type, date
- Multiple contribution types (Tithe, Offering, Special, Building, Mission)
- Payment method tracking (Cash, Check, Card, Online)
- Service type categorization
- Export all contributions to Excel for treasurer

**API Actions:**
- `addContribution` - Record new contribution
- `getAllContributions` - Fetch all contributions for export

---

### 3. Dashboard Module
**Files:** `Dashboard.jsx`, `useDashboardData.js`

**Features:**
- Real-time financial summary (tithe, offering, expenses, net balance)
- Monthly trend analysis
- Financial health indicators
- Giving momentum tracking
- Ministry opportunity highlights

**API Actions:**
- `getDashboardSummary` - Get monthly financial totals

---

### 4. Document Generation Module
**Files:** `downloadPdf.js`, `downloadAllStatementsZip.js`, `ThankYouLetter.js`, `ContributionStatementGenerator.js`

**Features:**
- Individual PDF statements per member
- Bulk ZIP download of all member statements
- Thank you letter generation
- Tax-ready contribution statements

**Formats:**
- PDF (individual statements)
- ZIP (bulk statements)
- XLSX (financial exports)

---

### 5. Audit Trail Module
**Files:** `auditApi.js`, `useAudit.js`

**Features:**
- Log all sensitive operations (add member, add contribution, exports)
- Track user, role, action, entity, timestamp
- Metadata capture for detailed tracking

**Logged Actions:**
- `ADD_MEMBER` - Member creation
- `ADD_CONTRIBUTION` - Contribution recording
- `EXPORT_CONTRIBUTIONS` - Excel export
- `EXPORT_ALL_STATEMENTS` - Bulk statement generation
- `GENERATE_MEMBER_STATEMENT` - Individual PDF generation

---

## 🔌 API Integration

### Backend: Google Apps Script

**Endpoint:** `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

**Request Format:**
```javascript
{
  "apiKey": "your-secret-key",
  "action": "actionName",
  "payload": {
    "tenant": "GPBC",
    // ... action-specific data
  }
}
```

**Response Format:**
```javascript
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

### Supported Actions

| Action | Purpose | Payload |
|--------|---------|---------|
| `addMember` | Create new member | Member details |
| `getMembers` | Fetch all members | None |
| `addContribution` | Record contribution | Contribution details |
| `getAllContributions` | Export all contributions | None |
| `getMemberYearlyContributions` | Member statement data | memberId, year |
| `getDashboardSummary` | Financial totals | month, year |
| `logAuditEvent` | Audit trail logging | Audit event details |

### CORS Compliance
All API requests use **simple POST requests** (no custom headers) to avoid CORS preflight issues with Google Apps Script.

---

## 🔒 Security Features

### 1. Role-Based Access Control (RBAC)
- Three roles: Admin, Treasurer, Rev
- Component-level permission guards
- Conditional rendering based on role
- Role switcher for development testing

### 2. Audit Trail
- All sensitive actions logged to Google Sheets
- Tracks: user, role, action, entity, timestamp, metadata
- Immutable audit log for accountability

### 3. API Security
- API key authentication
- Tenant-based data isolation (multi-church ready)
- Environment variable protection
- No sensitive data in client code

### 4. Data Validation
- Required field validation on forms
- Type checking for numeric inputs
- Email format validation
- Date validation

---

## 🎨 Design System

### Color Palette
```css
--wine: #4A0E1A          /* Primary brand color */
--green: #1F6F54         /* Secondary/success color */
--beige: #F5F3F0         /* Background */
--text: #1A1A1A          /* Primary text */
--text-muted: #6B7280    /* Secondary text */
--border-light: #E5E7EB  /* Borders */
```

### Typography
- **Font Family:** Inter (system fallback: -apple-system, SF Pro, Segoe UI)
- **Scale:** 9 levels from xs (12px) to 5xl (48px)
- **Weights:** 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)

### Spacing Scale
- **Base:** 4px
- **Scale:** 13 levels (space-1 to space-20)
- **Usage:** Consistent padding, margins, gaps

### Components
- **Glass Panels:** Semi-transparent cards with backdrop blur
- **Buttons:** Primary, Secondary, Outline, Ghost variants
- **Forms:** Styled inputs, selects, textareas with focus states
- **Loading:** Skeleton screens and spinners
- **Empty States:** Friendly messages with icons

### Animations
- **Duration:** Fast (150ms), Base (250ms), Slow (400ms)
- **Easing:** Spring effect (cubic-bezier)
- **Effects:** Fade in, slide up, pulse, shimmer

**See:** `DESIGN_SYSTEM.md` for complete design documentation

---

## 📝 Environment Variables

Create `.env.local` file in project root:

```env
# GPBC Configuration
VITE_GPBC_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GPBC_API_KEY=your-secret-api-key-here
VITE_GPBC_SHEET_ID=your-google-sheet-id-here
```

**Note:** Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

Generates optimized production build in `dist/` folder.

### Deploy Options
1. **Vercel** - `vercel deploy`
2. **Netlify** - Drag & drop `dist/` folder
3. **GitHub Pages** - Push `dist/` to gh-pages branch
4. **Custom Server** - Serve `dist/` folder as static files

---

## 📚 Usage Guide

### For Administrators
1. **Setup:** Configure environment variables
2. **Members:** Add members via "Add Member" button
3. **Contributions:** Record giving via Contributions page
4. **Reports:** Export Excel or generate PDF statements
5. **Audit:** Review audit logs for accountability

### For Treasurers
1. **Record Contributions:** Use Contribution Form daily
2. **Monthly Reports:** Export contributions to Excel
3. **Year-End:** Generate bulk statements for all members (ZIP)
4. **Verification:** Check dashboard for monthly totals

### For Reverends
1. **Dashboard:** View giving trends and financial health
2. **Member Stats:** See total members and active status
3. **Ministry Insights:** Review giving momentum and opportunities

---

## 🤝 Contributing

This is a ministry project for Grace and Praise Bangladeshi Church. For questions or contributions, contact the church leadership.

---

## 📄 License

Proprietary - Grace and Praise Bangladeshi Church

---

## 🙏 Acknowledgments

Built with love for ministry by Rev. Gilbert Baidya and the GPBC Technology Team.

**Vision:** Empowering churches with modern technology for better stewardship and ministry impact.

---

## 📞 Support

For technical support or questions:
- Email: [Church Email]
- Phone: [Church Phone]
- Website: [Church Website]

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
# gpbc-ai-finance-platform
