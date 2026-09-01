# PHASE 7 BACKEND SPECIFICATION
## Kingdom Operating System (Church OS Platform)

**Version:** 7.0  
**Target Maturity:** 10.0/10 (Complete Church Operating System)  
**System Name:** KingdomOS  
**Core Principle:** Human-Led Ministry — AI Assisted — Never AI Controlled

---

## TABLE OF CONTENTS
1. [Overview](#overview)
2. [Kingdom Identity + Multi-Tenant Operating Core](#kingdom-identity)
3. [Unified Church Data Graph](#unified-data-graph)
4. [Backend Actions - Ministry Operating System](#backend-actions)
5. [Sheet Structures](#sheet-structures)
6. [Role-Based Access Control](#role-based-access)
7. [Realtime Event Stream Architecture](#realtime-events)
8. [Kingdom Automation Engine](#automation-engine)
9. [Ethical Constraints & Governance](#ethical-constraints)
10. [Testing Guide](#testing-guide)

---

## OVERVIEW

Phase 7 transforms the GPBC Financial + AI Platform into **KingdomOS** — a comprehensive Church Operating System comparable to Salesforce + Planning Center + AI Pastor Assistant combined. This unified platform manages finance, members, ministry, outreach, AI strategy, communications, events, missions, and global collaboration in one integrated system.

### Evolution Journey
- **Phase 1-3:** MVP Foundation + Security Hardening (9.0/10)
- **Phase 4:** Autonomous Church Intelligence - Predictive AI (9.5/10)
- **Phase 5:** Autonomous Operations - Self-Optimizing Ministry (9.7/10)
- **Phase 6:** Global Kingdom Intelligence Network - Multi-Church Collaboration (9.9/10)
- **Phase 7:** Kingdom Operating System - Complete Church Platform **(10.0/10)**

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      KINGDOM OS PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend: React 19 + Vite + Tailwind + Recharts + WebSocket   │
│  Backend: Google Apps Script + Cloud Functions (Future)        │
│  Database: Google Sheets → BigQuery/Firestore/Supabase (Future)│
│  AI Layer: Ministry Intelligence + Forecast + Strategy Engines │
│  Realtime: WebSocket / Firebase / Supabase (Future)            │
├─────────────────────────────────────────────────────────────────┤
│  CORE MODULES:                                                  │
│  1. Identity + Multi-Church Tenant Operating Core              │
│  2. Unified Church Data Graph (360° Member Engagement)         │
│  3. Ministry OS Command Center Dashboard                       │
│  4. AI Ministry Co-Pilot (Pastor Assistant)                    │
│  5. Unified Communication Engine (SMS/Email/Push)              │
│  6. Volunteer + Ministry Workforce Management OS               │
│  7. Event + Service Planning Operating Engine                  │
│  8. Kingdom Financial OS (Budget/Compliance/Grant)             │
│  9. Spiritual Engagement Intelligence (Ethical)                │
│  10. Church App Builder + Member Portal OS                     │
│  11. Realtime Event Stream + Alert Engine                      │
│  12. Kingdom Automation Engine                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differentiators
- **Unified Platform:** All church operations in one system (no more fragmented tools)
- **AI-Assisted Ministry:** Intelligent recommendations without replacing human leadership
- **Multi-Tenant Native:** Built for church networks from day one
- **Ethical AI:** Privacy-first, non-judgmental, human-centered design
- **Realtime Operations:** Live updates across finance, ministry, and communications
- **Member Portal:** Self-service portal for members (giving, events, volunteers)

---

## KINGDOM IDENTITY + MULTI-TENANT OPERATING CORE

### KingdomTenantCore Architecture

**Purpose:** Establish ChurchID-required identity system with role-based access control, tenant isolation enforcement, and church-level encryption.

#### User Roles Hierarchy
```
Super Admin (Platform Owner)
  └─ Full system access across all churches
  └─ Tenant management and provisioning
  └─ Global analytics and network intelligence

Church Admin (Church Leadership)
  └─ Full access to own church data
  └─ User management for church
  └─ All ministry, finance, and operations modules

Finance Admin (Church Finance Team)
  └─ Financial data access (giving, expenses, budget)
  └─ Grant management
  └─ Financial reporting and compliance

Ministry Leader (Ministry Coordinators)
  └─ Ministry-specific data access
  └─ Volunteer management for ministry
  └─ Event planning for ministry

Volunteer (Active Volunteers)
  └─ Limited ministry data access
  └─ Volunteer schedule and assignments
  └─ Event check-in capabilities

Member (Church Members)
  └─ Member portal access only
  └─ Personal giving history
  └─ Event registration and prayer requests
```

### Backend Actions

#### 1. validateKingdomTenantAccess

**Purpose:** Enforce tenant isolation and role-based access control for every action.

**Request Schema:**
```javascript
{
  "action": "validateKingdomTenantAccess",
  "params": {
    "userId": "user@gpbchurch.org",
    "tenantId": "GPBC001",
    "requestedAction": "getFinancialData",
    "requestedResourceId": "member-12345" // Optional
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "accessGranted": true,
    "userRole": "Church Admin",
    "permissionLevel": "full",
    "tenantName": "Grace and Praise Bangladeshi Church",
    "accessScope": {
      "canViewFinance": true,
      "canEditFinance": true,
      "canViewMembers": true,
      "canEditMembers": true,
      "canManageVolunteers": true,
      "canSendCommunications": true,
      "canAccessAICopilot": true
    },
    "restrictions": []
  }
}
```

**Business Logic:**
```javascript
function validateKingdomTenantAccess(userId, tenantId, requestedAction) {
  // 1. Verify user exists and is active
  const user = getUserByEmail(userId);
  if (!user || user.status !== 'Active') {
    throw new Error('User not found or inactive');
  }
  
  // 2. Verify user has role assignment for tenant
  const roleAssignment = getRoleAssignment(userId, tenantId);
  if (!roleAssignment) {
    logUnauthorizedAccess(userId, tenantId, requestedAction);
    throw new Error('No role assignment for this tenant');
  }
  
  // 3. Check if role has permission for requested action
  const permissions = getRolePermissions(roleAssignment.role);
  const actionCategory = getActionCategory(requestedAction);
  
  if (!permissions[actionCategory]) {
    logUnauthorizedAccess(userId, tenantId, requestedAction);
    throw new Error('Role does not have permission for this action');
  }
  
  // 4. Log successful access
  logTenantAccess(userId, tenantId, requestedAction, 'success');
  
  return {
    accessGranted: true,
    userRole: roleAssignment.role,
    permissionLevel: permissions[actionCategory],
    accessScope: permissions
  };
}
```

#### 2. registerKingdomTenant

**Purpose:** Register new church tenant with encryption keys and initial configuration.

**Request Schema:**
```javascript
{
  "action": "registerKingdomTenant",
  "params": {
    "churchName": "Grace and Praise Bangladeshi Church",
    "address": "1325 Richardson St., San Bernardino, CA 92408",
    "adminEmail": "admin@gpbchurch.org",
    "adminName": "Pastor Name",
    "denomination": "Independent",
    "region": "West Coast",
    "avgAttendance": 185,
    "ein": "39-4558295",
    "settings": {
      "language": "en", // "en" | "bn" | "dual"
      "currency": "USD",
      "timezone": "America/Los_Angeles",
      "fiscalYearEnd": "12-31"
    }
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "tenantId": "GPBC001",
    "churchName": "Grace and Praise Bangladeshi Church",
    "status": "Active",
    "registeredDate": "2026-02-05",
    "encryptionKeyId": "ENC-GPBC001-2026",
    "initialSetupUrl": "https://kingdomos.app/setup/GPBC001",
    "adminCredentials": {
      "username": "admin@gpbchurch.org",
      "temporaryPassword": "Welcome2KingdomOS!",
      "mustChangePassword": true
    }
  }
}
```

**Sheet Structure:** KINGDOM_TENANT_REGISTRY
```
| TenantID | ChurchName | Address | AdminEmail | Status | RegisteredDate | EncryptionKeyID | Region | AvgAttendance | EIN | SettingsJSON |
```

---

## UNIFIED CHURCH DATA GRAPH

### ChurchUnifiedDataGraph Architecture

**Purpose:** Create 360° view of member engagement by connecting Members + Giving + Attendance + Volunteer Activity + Ministry Participation + Events Attended + Communication Engagement.

#### 3. buildChurchDataGraph

**Purpose:** Generate unified engagement graph for specified member or entire church.

**Request Schema:**
```javascript
{
  "action": "buildChurchDataGraph",
  "params": {
    "tenantId": "GPBC001",
    "memberId": "MEMBER-001", // Optional - if provided, returns single member graph
    "includeGivingHistory": true,
    "includeAttendanceHistory": true,
    "includeVolunteerHistory": true,
    "includeMinistryParticipation": true,
    "includeEventParticipation": true,
    "includeCommunicationEngagement": true,
    "timeframeMonths": 12
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "memberId": "MEMBER-001",
    "memberName": "John Doe",
    "engagementScore": 82, // 0-100 (Overall engagement level)
    "engagementTimeline": [
      {
        "date": "2026-01-15",
        "eventType": "contribution",
        "description": "Contribution: $250.00",
        "category": "giving",
        "impactScore": 8
      },
      {
        "date": "2026-01-19",
        "eventType": "service_attendance",
        "description": "Sunday Service Attendance",
        "category": "attendance",
        "impactScore": 5
      },
      {
        "date": "2026-01-22",
        "eventType": "volunteer_activity",
        "description": "Youth Ministry Volunteer (2 hours)",
        "category": "volunteer",
        "impactScore": 7
      }
      // ... additional events
    ],
    "givingPattern": {
      "totalGiving12Months": 3200,
      "avgMonthlyGiving": 267,
      "givingFrequency": "Weekly",
      "givingConsistency": 88, // % of weeks with contributions
      "lastContributionDate": "2026-02-02"
    },
    "attendancePattern": {
      "attendanceRate": 85, // % of services attended
      "consecutiveWeeksAttended": 8,
      "preferredService": "Sunday 10:30 AM",
      "lastAttendanceDate": "2026-02-02"
    },
    "volunteerActivity": {
      "activeMinistries": ["Youth Ministry", "Worship Team"],
      "totalVolunteerHours12Months": 96,
      "avgMonthlyHours": 8,
      "volunteerConsistency": 92,
      "lastVolunteerDate": "2026-01-29"
    },
    "ministryParticipation": [
      {
        "ministryName": "Youth Ministry",
        "role": "Small Group Leader",
        "participationLevel": "High",
        "joinDate": "2024-06-01"
      }
    ],
    "eventParticipation": {
      "eventsAttended12Months": 14,
      "eventTypes": ["Service", "Small Group", "Outreach", "Special Event"],
      "lastEventDate": "2026-02-01"
    },
    "communicationEngagement": {
      "emailOpenRate": 68, // %
      "smsResponseRate": 45, // %
      "avgResponseTimeHours": 6,
      "preferredChannel": "SMS"
    },
    "discipleshipStage": "Growing", // "Exploring" | "Growing" | "Serving" | "Leading"
    "pastoralCareFlags": [
      // Only shown to pastors/admins
      "Strong engagement across all areas",
      "Potential leadership candidate"
    ]
  }
}
```

**Business Logic:**
```javascript
function buildChurchDataGraph(tenantId, memberId, timeframeMonths) {
  // 1. Gather all member data points
  const contributions = getContributions(tenantId, memberId, timeframeMonths);
  const attendance = getAttendanceRecords(tenantId, memberId, timeframeMonths);
  const volunteerActivity = getVolunteerActivity(tenantId, memberId, timeframeMonths);
  const ministryParticipation = getMinistryParticipation(tenantId, memberId);
  const eventParticipation = getEventParticipation(tenantId, memberId, timeframeMonths);
  const commEngagement = getCommunicationEngagement(tenantId, memberId, timeframeMonths);
  
  // 2. Build unified timeline
  const timeline = [
    ...contributions.map(c => ({
      date: c.date,
      eventType: 'contribution',
      description: `Contribution: $${c.amount}`,
      category: 'giving',
      impactScore: calculateImpactScore('giving', c.amount)
    })),
    ...attendance.map(a => ({
      date: a.date,
      eventType: 'service_attendance',
      description: `${a.serviceType} Attendance`,
      category: 'attendance',
      impactScore: 5
    })),
    ...volunteerActivity.map(v => ({
      date: v.date,
      eventType: 'volunteer_activity',
      description: `${v.ministry} Volunteer (${v.hours} hours)`,
      category: 'volunteer',
      impactScore: v.hours / 2 // 1 impact point per 2 hours
    }))
    // ... additional event types
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 3. Calculate engagement score
  const engagementScore = calculateEngagementScore({
    givingConsistency: calculateGivingConsistency(contributions),
    attendanceRate: calculateAttendanceRate(attendance),
    volunteerConsistency: calculateVolunteerConsistency(volunteerActivity),
    ministryParticipation: ministryParticipation.length,
    eventParticipation: eventParticipation.length,
    communicationEngagement: commEngagement.avgResponseRate
  });
  
  // 4. Determine discipleship stage
  const discipleshipStage = determineDiscipleshipStage(engagementScore, {
    attending: attendance.length > 0,
    giving: contributions.length > 0,
    serving: volunteerActivity.length > 0,
    leading: ministryParticipation.some(m => m.role.includes('Leader'))
  });
  
  return {
    memberId,
    engagementScore,
    engagementTimeline: timeline,
    givingPattern: analyzeGivingPattern(contributions),
    attendancePattern: analyzeAttendancePattern(attendance),
    volunteerActivity: analyzeVolunteerActivity(volunteerActivity),
    ministryParticipation,
    eventParticipation: analyzeEventParticipation(eventParticipation),
    communicationEngagement: commEngagement,
    discipleshipStage
  };
}

function calculateEngagementScore(metrics) {
  // Weighted engagement formula
  return Math.round(
    metrics.givingConsistency * 0.20 +
    metrics.attendanceRate * 0.25 +
    metrics.volunteerConsistency * 0.20 +
    (metrics.ministryParticipation > 0 ? 20 : 0) +
    (metrics.eventParticipation / 12 * 100 * 0.10) +
    metrics.communicationEngagement * 0.05
  );
}
```

**Sheet Structure:** CHURCH_DATA_GRAPH
```
| Timestamp | TenantID | MemberID | EngagementScore | EngagementTimelineJSON | GivingPatternJSON | AttendancePatternJSON | VolunteerActivityJSON | MinistryParticipationJSON | DiscipleshipStage |
```

---

## BACKEND ACTIONS - MINISTRY OPERATING SYSTEM

### 4. MinistryCopilotAI

**Purpose:** AI-powered pastor assistant providing ministry recommendations based on data analysis. AI suggests — humans decide.

**Request Schema:**
```javascript
{
  "action": "MinistryCopilotAI",
  "params": {
    "tenantId": "GPBC001",
    "recommendationType": "all", // "all" | "giving" | "outreach" | "volunteer" | "event"
    "timeframe": "next_30_days",
    "confidenceThreshold": 70 // Only show recommendations with >70% confidence
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "COPILOT-REC-001",
        "type": "giving_risk",
        "priority": "High", // "Low" | "Medium" | "High" | "Urgent"
        "confidence": 85,
        "title": "Giving Decline Risk Detected",
        "description": "Monthly giving trending down 12% over past 3 months. Seasonal pattern analysis suggests this is NOT typical summer decline.",
        "impact": "Projected $4,200 shortfall by end of quarter",
        "recommendation": "Consider launching targeted stewardship campaign in next 2 weeks. Historically, mid-month campaigns yield 18% response rate.",
        "suggestedActions": [
          "Schedule pastor stewardship message for Feb 16 service",
          "Send personalized thank-you notes to top 20 donors",
          "Launch text-to-give reminder campaign",
          "Schedule finance team meeting to review budget adjustments"
        ],
        "dataSource": "36 months giving history + seasonal trend analysis",
        "expirationDate": "2026-02-20",
        "requiresApproval": true,
        "approvalStatus": "pending"
      },
      {
        "id": "COPILOT-REC-002",
        "type": "volunteer_reinforcement",
        "priority": "Medium",
        "confidence": 78,
        "title": "Youth Ministry Volunteer Burnout Risk",
        "description": "3 youth ministry volunteers have worked 12+ consecutive weeks without break. Burnout risk indicators elevated.",
        "impact": "Risk of losing key volunteers impacting 45 youth participants",
        "recommendation": "Rotate in 2 additional volunteers and provide break weeks for current team.",
        "suggestedActions": [
          "Contact Sarah Johnson and Mike Chen to fill in next 2 weeks",
          "Give current volunteers Feb 22-29 off",
          "Schedule appreciation lunch for youth team in March",
          "Review volunteer rotation policy"
        ],
        "dataSource": "Volunteer activity tracking + burnout risk model",
        "expirationDate": "2026-02-12",
        "requiresApproval": true,
        "approvalStatus": "pending"
      },
      {
        "id": "COPILOT-REC-003",
        "type": "outreach_timing",
        "priority": "Medium",
        "confidence": 72,
        "title": "Optimal Outreach Campaign Window Approaching",
        "description": "Historical data shows Easter outreach campaigns started in early March yield 35% higher first-time visitor conversion.",
        "impact": "Potential to reach 40-50 new families during Easter season",
        "recommendation": "Launch Easter outreach campaign week of March 2nd (6 weeks before Easter).",
        "suggestedActions": [
          "Design Easter invite cards by Feb 20",
          "Train outreach team by Feb 25",
          "Launch door-to-door campaign March 2-8",
          "Prepare first-time visitor follow-up workflow"
        ],
        "dataSource": "5 years Easter outreach campaign performance data",
        "expirationDate": "2026-03-01",
        "requiresApproval": true,
        "approvalStatus": "pending"
      },
      {
        "id": "COPILOT-REC-004",
        "type": "event_optimization",
        "priority": "Low",
        "confidence": 81,
        "title": "Multi-Service Attendance Imbalance",
        "description": "Sunday 10:30 AM service at 92% capacity while 8:00 AM service at 58% capacity. Parking and seating constraints impacting growth.",
        "impact": "Limiting growth potential by 20-25 families",
        "recommendation": "Launch 'Try the 8 AM' campaign encouraging families to experience earlier service. Offer coffee bar incentive.",
        "suggestedActions": [
          "Promote 8 AM service benefits (quieter, family-friendly, coffee bar)",
          "Offer free coffee cards for 8 AM attenders in February",
          "Recruit 2-3 key families to shift to 8 AM as ambassadors",
          "Monitor attendance balance monthly"
        ],
        "dataSource": "12 months multi-service attendance tracking",
        "expirationDate": "2026-02-28",
        "requiresApproval": true,
        "approvalStatus": "pending"
      }
    ],
    "summary": {
      "totalRecommendations": 4,
      "highPriority": 1,
      "mediumPriority": 2,
      "lowPriority": 1,
      "avgConfidence": 79,
      "pendingApprovals": 4,
      "implementedThisMonth": 2
    }
  }
}
```

**Business Logic:**
```javascript
function MinistryCopilotAI(tenantId, recommendationType, timeframe, confidenceThreshold) {
  const recommendations = [];
  
  // 1. GIVING RISK ANALYSIS
  if (recommendationType === 'all' || recommendationType === 'giving') {
    const givingTrend = analyzeGivingTrend(tenantId, 3); // 3 months
    if (givingTrend.decline > 10 && !givingTrend.isSeasonal) {
      recommendations.push({
        type: 'giving_risk',
        priority: givingTrend.decline > 15 ? 'High' : 'Medium',
        confidence: givingTrend.confidence,
        title: 'Giving Decline Risk Detected',
        recommendation: generateGivingRecommendation(givingTrend),
        requiresApproval: true
      });
    }
  }
  
  // 2. VOLUNTEER BURNOUT DETECTION
  if (recommendationType === 'all' || recommendationType === 'volunteer') {
    const burnoutRisks = detectVolunteerBurnout(tenantId);
    burnoutRisks.forEach(risk => {
      if (risk.score > 70) {
        recommendations.push({
          type: 'volunteer_reinforcement',
          priority: risk.score > 85 ? 'High' : 'Medium',
          confidence: risk.confidence,
          title: `${risk.ministryName} Volunteer Burnout Risk`,
          recommendation: generateVolunteerRecommendation(risk),
          requiresApproval: true
        });
      }
    });
  }
  
  // 3. OUTREACH CAMPAIGN TIMING
  if (recommendationType === 'all' || recommendationType === 'outreach') {
    const optimalWindows = predictOutreachWindows(tenantId, timeframe);
    optimalWindows.forEach(window => {
      recommendations.push({
        type: 'outreach_timing',
        priority: 'Medium',
        confidence: window.confidence,
        title: `Optimal ${window.campaignType} Window Approaching`,
        recommendation: generateOutreachRecommendation(window),
        requiresApproval: true
      });
    });
  }
  
  // 4. EVENT ATTENDANCE OPTIMIZATION
  if (recommendationType === 'all' || recommendationType === 'event') {
    const eventOptimizations = analyzeEventOptimization(tenantId);
    eventOptimizations.forEach(opt => {
      if (opt.impactPotential > 15) { // >15% improvement potential
        recommendations.push({
          type: 'event_optimization',
          priority: 'Low',
          confidence: opt.confidence,
          title: opt.title,
          recommendation: generateEventRecommendation(opt),
          requiresApproval: true
        });
      }
    });
  }
  
  // 5. Filter by confidence threshold
  const filteredRecommendations = recommendations.filter(r => r.confidence >= confidenceThreshold);
  
  // 6. Sort by priority and confidence
  filteredRecommendations.sort((a, b) => {
    const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.confidence - a.confidence;
  });
  
  return {
    recommendations: filteredRecommendations,
    summary: generateRecommendationSummary(filteredRecommendations)
  };
}
```

**Sheet Structure:** AI_MINISTRY_RECOMMENDATIONS
```
| Timestamp | TenantID | RecommendationID | Type | Priority | Confidence | Title | Description | RecommendationText | SuggestedActionsJSON | ApprovalStatus | ApprovedBy | ApprovedDate | ImplementedDate |
```

### 5. KingdomCommsEngine

**Purpose:** Unified communication platform supporting SMS, Email, Push Notifications, Broadcast Messaging, Ministry Group Messaging with AI optimization.

**Request Schema:**
```javascript
{
  "action": "sendKingdomMessage",
  "params": {
    "tenantId": "GPBC001",
    "messageType": "sms", // "sms" | "email" | "push" | "broadcast"
    "recipients": {
      "recipientType": "group", // "individual" | "group" | "ministry" | "all_members"
      "recipientIds": ["GROUP-YOUTH-001"], // or ["MEMBER-001", "MEMBER-002"]
      "filters": {
        "minAge": 13,
        "maxAge": 18,
        "hasOptedInSMS": true
      }
    },
    "message": {
      "subject": "Youth Group This Friday!", // Email only
      "body": "Hey! Youth group meets Friday 7pm at the church. Bring a friend! 🎉",
      "sender": "Pastor John",
      "replyTo": "youth@gpbchurch.org"
    },
    "scheduling": {
      "sendImmediately": false,
      "scheduledDate": "2026-02-07",
      "scheduledTime": "15:00", // 3:00 PM
      "useAIOptimization": true // AI suggests best send time
    },
    "aiFeatures": {
      "enableToneSuggestions": true,
      "enableEngagementPrediction": true,
      "generateVariants": false // A/B testing (future)
    }
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "messageId": "MSG-2026-0205-001",
    "status": "scheduled",
    "recipientCount": 45,
    "deliveryEstimate": {
      "smsCreditsUsed": 45,
      "estimatedDeliveryTime": "2026-02-07 15:00:00",
      "estimatedCompletionTime": "2026-02-07 15:05:00"
    },
    "aiInsights": {
      "toneSuggestion": "Your message tone is friendly and engaging. Consider adding event details (location, what to bring) for clarity.",
      "engagementPrediction": {
        "expectedOpenRate": 78, // %
        "expectedResponseRate": 25, // %
        "confidence": 82
      },
      "optimalSendTime": "2026-02-07 14:30:00", // AI suggested time
      "optimalSendReason": "Historical data shows youth group messages sent 30 minutes before typical after-school time (3pm) yield 15% higher response rate"
    },
    "costEstimate": {
      "smsCost": 4.50, // $0.10 per SMS
      "emailCost": 0.00
    }
  }
}
```

**Sheet Structure:** COMMUNICATION_HISTORY
```
| Timestamp | TenantID | MessageID | MessageType | RecipientCount | Subject | Body | Sender | Status | ScheduledDate | SentDate | DeliveryRate | OpenRate | ResponseRate | CostUSD |
```

### 6. MinistryWorkforceOS

**Purpose:** Volunteer and ministry workforce management with skills tracking, availability patterns, assignment history, and ethical burnout detection.

**Request Schema:**
```javascript
{
  "action": "getVolunteerSchedulingSuggestions",
  "params": {
    "tenantId": "GPBC001",
    "ministryId": "MINISTRY-YOUTH-001",
    "dateRange": {
      "startDate": "2026-02-10",
      "endDate": "2026-03-10"
    },
    "requiredSkills": ["Youth Leadership", "First Aid"],
    "requiredVolunteers": 3,
    "considerBurnoutRisk": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "schedulingSuggestions": [
      {
        "date": "2026-02-14",
        "eventName": "Youth Group - Valentine's Event",
        "suggestedVolunteers": [
          {
            "volunteerId": "VOL-001",
            "volunteerName": "Sarah Johnson",
            "matchScore": 92, // 0-100 (skill match + availability + freshness)
            "availabilityConfirmed": true,
            "skills": ["Youth Leadership", "First Aid", "Event Planning"],
            "recentActivity": "Last volunteered 2 weeks ago",
            "burnoutRisk": "Low",
            "notes": "Excellent fit - requested youth ministry opportunities"
          },
          {
            "volunteerId": "VOL-012",
            "volunteerName": "Mike Chen",
            "matchScore": 88,
            "availabilityConfirmed": true,
            "skills": ["Youth Leadership", "Music"],
            "recentActivity": "Last volunteered 1 week ago",
            "burnoutRisk": "Low",
            "notes": "Strong youth connection - popular with teens"
          },
          {
            "volunteerId": "VOL-028",
            "volunteerName": "Lisa Martinez",
            "matchScore": 85,
            "availabilityConfirmed": false, // Needs confirmation
            "skills": ["First Aid", "Childcare"],
            "recentActivity": "Last volunteered 3 weeks ago",
            "burnoutRisk": "Low",
            "notes": "Available most Fridays - may need to confirm"
          }
        ],
        "backupVolunteers": [
          {
            "volunteerId": "VOL-015",
            "volunteerName": "Tom Anderson",
            "matchScore": 78,
            "burnoutRisk": "Medium", // Has volunteered 8 consecutive weeks
            "notes": "Consider giving break - approaching burnout threshold"
          }
        ]
      }
      // ... additional dates
    ],
    "ministryHealthIndicators": {
      "volunteerPoolSize": 18,
      "activeVolunteers": 12, // Volunteered in past 30 days
      "avgVolunteersPerEvent": 3.2,
      "volunteerRetentionRate": 85, // % still active after 6 months
      "burnoutRiskCount": 2,
      "recruitmentNeed": "Low" // "Low" | "Medium" | "High"
    },
    "staffingRiskAlerts": [
      {
        "date": "2026-02-28",
        "eventName": "Youth Retreat",
        "requiredVolunteers": 6,
        "confirmedVolunteers": 3,
        "riskLevel": "High",
        "recommendation": "Recruit 3 additional volunteers by Feb 20 or consider postponing"
      }
    ]
  }
}
```

**Business Logic:**
```javascript
function getVolunteerSchedulingSuggestions(tenantId, ministryId, dateRange, requiredSkills) {
  // 1. Get all volunteers with required skills
  const volunteers = getVolunteersBySkills(tenantId, requiredSkills);
  
  // 2. For each date in range, find best volunteer matches
  const suggestions = [];
  const dateArray = generateDateArray(dateRange.startDate, dateRange.endDate);
  
  dateArray.forEach(date => {
    // 3. Score each volunteer for this date
    const scoredVolunteers = volunteers.map(volunteer => {
      const availability = checkAvailability(volunteer, date);
      const recentActivity = getRecentActivity(volunteer, tenantId);
      const burnoutRisk = calculateBurnoutRisk(volunteer, tenantId);
      
      // Match score formula
      const skillMatch = calculateSkillMatch(volunteer.skills, requiredSkills);
      const freshnessScore = calculateFreshnessScore(recentActivity); // Prefer volunteers who haven't served recently
      const burnoutPenalty = burnoutRisk > 70 ? 20 : 0;
      
      const matchScore = skillMatch * 0.5 + freshnessScore * 0.3 + availability * 0.2 - burnoutPenalty;
      
      return {
        ...volunteer,
        matchScore: Math.round(matchScore),
        availabilityConfirmed: availability > 80,
        burnoutRisk: burnoutRisk > 70 ? 'High' : burnoutRisk > 50 ? 'Medium' : 'Low',
        recentActivity: formatRecentActivity(recentActivity)
      };
    });
    
    // 4. Sort by match score and select top matches
    scoredVolunteers.sort((a, b) => b.matchScore - a.matchScore);
    
    suggestions.push({
      date,
      suggestedVolunteers: scoredVolunteers.slice(0, 3),
      backupVolunteers: scoredVolunteers.slice(3, 5).filter(v => v.burnoutRisk !== 'High')
    });
  });
  
  return suggestions;
}

function calculateBurnoutRisk(volunteer, tenantId) {
  const activity = getVolunteerActivity(volunteer.id, tenantId, 12); // 12 weeks
  
  // Burnout indicators
  const consecutiveWeeks = activity.consecutiveWeeksServed;
  const avgHoursPerWeek = activity.totalHours / 12;
  const missedBreaks = activity.weeksWithoutBreak;
  
  // Risk formula (0-100)
  let risk = 0;
  if (consecutiveWeeks > 8) risk += 30;
  if (avgHoursPerWeek > 6) risk += 25;
  if (missedBreaks > 6) risk += 25;
  if (activity.multipleMinistries > 2) risk += 20;
  
  return Math.min(risk, 100);
}
```

**Sheet Structure:** VOLUNTEER_ASSIGNMENTS
```
| Timestamp | TenantID | VolunteerID | VolunteerName | MinistryID | EventDate | EventName | HoursServed | SkillsUsedJSON | BurnoutRiskScore | Status |
```

### 7. EventOperationsEngine

**Purpose:** Event planning and operations management with attendance forecasting, volunteer coverage tracking, giving projections, and service load balancing.

**Request Schema:**
```javascript
{
  "action": "getEventOperationsForecast",
  "params": {
    "tenantId": "GPBC001",
    "eventId": "EVENT-EASTER-2026", // Optional - if not provided, forecasts all upcoming events
    "includeAttendanceForecast": true,
    "includeVolunteerCoverage": true,
    "includeGivingProjection": true,
    "includeRiskAnalysis": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "eventId": "EVENT-EASTER-2026",
    "eventName": "Easter Sunday Service",
    "eventDate": "2026-04-12",
    "eventType": "Special Service",
    "attendanceForecast": {
      "projectedAttendance": 425,
      "normalAttendance": 185,
      "increasePercentage": 130,
      "confidence": 85,
      "forecastBasis": "5-year Easter attendance history + regional church trends",
      "capacityStatus": "At Capacity", // "Under Capacity" | "At Capacity" | "Over Capacity"
      "capacityUtilization": 98, // % of seating capacity
      "overflowPlan": "Setup overflow room with livestream for 50 additional guests"
    },
    "volunteerCoverage": {
      "requiredVolunteers": 28,
      "confirmedVolunteers": 22,
      "coveragePercentage": 79,
      "coverageStatus": "Needs Attention", // "Sufficient" | "Needs Attention" | "Critical"
      "underStaffedRoles": [
        {
          "role": "Parking Team",
          "required": 6,
          "confirmed": 3,
          "gap": 3,
          "urgency": "High"
        },
        {
          "role": "Greeters",
          "required": 8,
          "confirmed": 6,
          "gap": 2,
          "urgency": "Medium"
        }
      ],
      "recruitmentDeadline": "2026-04-05",
      "daysUntilDeadline": 52
    },
    "givingProjection": {
      "projectedGiving": 18500,
      "normalSundayGiving": 4200,
      "increasePercentage": 340,
      "confidence": 78,
      "projectionBasis": "Easter historically yields 3-4x normal Sunday giving due to visitor offerings and special Easter donations"
    },
    "serviceLoadBalancing": {
      "multipleServices": false,
      "suggestMultipleServices": true,
      "recommendation": "Consider adding 8:00 AM service in addition to 10:30 AM to manage capacity (2 services @ 225 each vs 1 service @ 425 overflow risk)"
    },
    "riskAnalysis": {
      "overallRiskScore": 62, // 0-100 (Higher = more risk)
      "riskLevel": "Medium", // "Low" | "Medium" | "High" | "Critical"
      "riskFactors": [
        {
          "factor": "Capacity Constraint",
          "severity": "High",
          "description": "Projected attendance (425) exceeds comfortable capacity (400). Overflow plan required.",
          "mitigation": "Setup overflow room, consider 2-service model"
        },
        {
          "factor": "Volunteer Shortage",
          "severity": "Medium",
          "description": "21% volunteer gap, particularly in parking and greeting roles critical for first-time visitors.",
          "mitigation": "Launch volunteer recruitment campaign by Feb 20, recruit 6 additional volunteers"
        },
        {
          "factor": "First-Time Visitor Load",
          "severity": "Medium",
          "description": "Estimated 150-200 first-time visitors. Follow-up system must handle 4x normal volume.",
          "mitigation": "Prepare 200 visitor packets, assign 3-person follow-up team, automate thank-you emails"
        }
      ]
    }
  }
}
```

**Sheet Structure:** EVENT_OPERATIONS
```
| Timestamp | TenantID | EventID | EventName | EventDate | EventType | ProjectedAttendance | ActualAttendance | VolunteerCoveragePercent | ProjectedGiving | ActualGiving | RiskScore | RiskLevel | RiskFactorsJSON |
```

### 8. KingdomFinanceOS

**Purpose:** Comprehensive financial operating system with budget planning, expense forecasting, grant tracking, compliance reporting, and denomination reporting automation.

**Request Schema:**
```javascript
{
  "action": "getFinancialHealthDashboard",
  "params": {
    "tenantId": "GPBC001",
    "includeRealtimeStatus": true,
    "includeBudgetAnalysis": true,
    "includeGrantTracking": true,
    "includeComplianceStatus": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "financialHealthScore": 78, // 0-100
    "healthStatus": "Healthy", // "Thriving" | "Healthy" | "Caution" | "At Risk"
    "realtimeStatus": {
      "currentMonthGiving": 18245,
      "currentMonthBudget": 22000,
      "percentOfBudget": 83,
      "daysRemainingInMonth": 7,
      "projectedMonthEndGiving": 21800,
      "projectedVariance": -200,
      "status": "On Track" // "Ahead" | "On Track" | "Behind" | "Significantly Behind"
    },
    "budgetAnalysis": {
      "annualBudget": 485000,
      "ytdBudget": 80833, // Jan-Feb budget (2/12)
      "ytdActual": 76200,
      "ytdVariance": -4633,
      "ytdVariancePercent": -5.7,
      "categoryBreakdown": [
        {
          "category": "Personnel",
          "budgeted": 28000,
          "actual": 28000,
          "variance": 0,
          "status": "On Budget"
        },
        {
          "category": "Facilities",
          "budgeted": 12000,
          "actual": 11200,
          "variance": 800,
          "status": "Under Budget"
        },
        {
          "category": "Missions",
          "budgeted": 15000,
          "actual": 12500,
          "variance": -2500,
          "status": "Under Budget"
        }
        // ... additional categories
      ],
      "riskAlerts": [
        {
          "category": "Operating Reserve",
          "severity": "Medium",
          "description": "Operating reserve at $45,000 (1.1 months expenses). Target is 3 months ($121,250).",
          "recommendation": "Allocate surplus funds to operating reserve. Consider launching capital campaign if shortfall persists."
        }
      ]
    },
    "grantTracking": {
      "activeGrants": 3,
      "totalGrantFunding": 125000,
      "pendingApplications": 2,
      "potentialFunding": 75000,
      "grantDetails": [
        {
          "grantName": "State Food Assistance Grant",
          "amount": 50000,
          "status": "Active",
          "awardDate": "2025-06-01",
          "expirationDate": "2026-05-31",
          "fundsSpent": 32000,
          "fundsRemaining": 18000,
          "utilizationRate": 64,
          "reportingDeadline": "2026-03-15",
          "daysUntilReporting": 38,
          "complianceStatus": "On Track"
        }
        // ... additional grants
      ]
    },
    "complianceStatus": {
      "overallCompliance": "Compliant",
      "checks": [
        {
          "requirement": "IRS Form 990 Filing",
          "status": "Compliant",
          "lastFiled": "2025-11-15",
          "nextDue": "2026-11-15",
          "daysUntilDue": 283
        },
        {
          "requirement": "State Charity Registration",
          "status": "Compliant",
          "lastRenewed": "2025-01-10",
          "nextDue": "2027-01-10",
          "daysUntilDue": 339
        },
        {
          "requirement": "Annual Financial Audit",
          "status": "Action Required",
          "lastCompleted": "2024-03-01",
          "nextDue": "2026-03-31",
          "daysUntilDue": 54,
          "alert": "Schedule audit firm by Feb 15 to meet deadline"
        }
      ]
    },
    "denominationReporting": {
      "nextReportDue": "2026-02-28",
      "reportType": "Quarterly Financial Report - SoCal Network",
      "daysUntilDue": 23,
      "autoExportEnabled": true,
      "reportStatus": "Ready to Generate"
    }
  }
}
```

**Sheet Structure:** KINGDOM_FINANCE_MASTER
```
| Timestamp | TenantID | FinancialHealthScore | RealtimeStatusJSON | BudgetAnalysisJSON | GrantTrackingJSON | ComplianceStatusJSON | DenominationReportingJSON |
```

### 9. SpiritualEngagementAI

**Purpose:** Ethical spiritual engagement intelligence analyzing attendance, volunteer participation, giving consistency, event participation. NO personal judgment, NO spiritual ranking, NO member labeling.

**Request Schema:**
```javascript
{
  "action": "getSpiritualEngagementInsights",
  "params": {
    "tenantId": "GPBC001",
    "analysisType": "congregation", // "congregation" | "individual" (individual requires specific memberId)
    "includeEngagementScores": true,
    "includeDiscipleshipOpportunities": true,
    "includePastoralCarePriorities": true,
    "viewerRole": "Church Admin" // Controls what data is visible
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "congregationOverview": {
      "totalMembers": 185,
      "engagementDistribution": {
        "highEngagement": 68, // 37%
        "moderateEngagement": 82, // 44%
        "lowEngagement": 35 // 19%
      },
      "avgEngagementScore": 72,
      "discipleshipStageDistribution": {
        "exploring": 22, // New attendees, low commitment
        "growing": 95, // Regular attendance, some serving
        "serving": 48, // Active volunteers, consistent giving
        "leading": 20 // Ministry leaders, high engagement
      }
    },
    "discipleshipOpportunities": [
      {
        "opportunityType": "Volunteer Invitation",
        "targetGroup": "Growing to Serving Transition",
        "memberCount": 28,
        "description": "28 members show strong attendance and giving consistency but minimal volunteer involvement. Potential volunteer recruits.",
        "suggestedAction": "Personal invitation to volunteer in ministries matching their interests. Host 'Discover Serving' event.",
        "expectedImpact": "15-20% conversion to active volunteer roles",
        "priority": "Medium"
      },
      {
        "opportunityType": "Re-engagement Outreach",
        "targetGroup": "Declining Engagement",
        "memberCount": 12,
        "description": "12 members who were previously engaged (attended 3+ times/month) but have attended <2 times in past 2 months.",
        "suggestedAction": "Personal pastoral care call or visit. Ask 'How can we pray for you?' rather than 'Why haven't you been coming?'",
        "expectedImpact": "50-60% return to regular attendance with personal contact",
        "priority": "High"
      },
      {
        "opportunityType": "Leadership Development",
        "targetGroup": "Serving to Leading Transition",
        "memberCount": 8,
        "description": "8 members with high volunteer consistency, strong relational influence, and leadership potential.",
        "suggestedAction": "Invite to leadership development program or small group leader training.",
        "expectedImpact": "4-5 new ministry leaders within 6 months",
        "priority": "Medium"
      }
    ],
    "pastoralCarePriorities": [
      {
        "priority": "High",
        "memberCount": 5,
        "description": "5 members showing significant engagement drop (>50% decline in attendance/giving/volunteering in past 2 months)",
        "notes": "May indicate personal crisis, job loss, family issues, or spiritual struggle. Pastoral visit recommended.",
        "suggestedContact": "Pastor or care team visit within 1 week"
      },
      {
        "priority": "Medium",
        "memberCount": 8,
        "description": "8 members consistently attending but never connected to small group or ministry",
        "notes": "At risk of remaining 'on the fringe' without deeper community connections.",
        "suggestedContact": "Small group invitation or ministry connection within 2 weeks"
      }
    ],
    "ethicalSafeguards": {
      "noSpiritualRanking": true,
      "noMemberLabeling": true,
      "noPublicScoring": true,
      "dataUsePolicy": "Engagement insights are for pastoral care and discipleship support only. Never used for judgment, exclusion, or public comparison."
    }
  }
}
```

**Ethical Constraints:**
- **NEVER rank members spiritually** (e.g., "most spiritual", "least committed")
- **NEVER label members negatively** (e.g., "backslider", "uncommitted", "nominal Christian")
- **NEVER make public engagement scores** (internal pastoral use only)
- **ALWAYS frame as opportunities for care and growth**, not judgment
- **ALWAYS protect member privacy** (aggregate insights only unless pastoral need)

**Sheet Structure:** SPIRITUAL_ENGAGEMENT_INTELLIGENCE
```
| Timestamp | TenantID | MemberID | EngagementScore | DiscipleshipStage | AttendanceRate | VolunteerConsistency | GivingConsistency | LastEngagementDate | PastoralCarePriority | Notes |
```

### 10. ChurchAppBuilder + Member Portal

**Purpose:** Member-facing portal for self-service giving history, tax letters, event registration, prayer requests, volunteer signups, and profile management.

**Request Schema:**
```javascript
{
  "action": "authenticateMemberPortal",
  "params": {
    "email": "member@example.com",
    "password": "hashed_password",
    "tenantId": "GPBC001"
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "authToken": "JWT_TOKEN_HERE",
    "memberId": "MEMBER-001",
    "memberProfile": {
      "fullName": "John Doe",
      "email": "member@example.com",
      "phone": "(555) 123-4567",
      "address": "123 Main St, San Bernardino, CA 92408",
      "memberSince": "2020-03-15",
      "preferredLanguage": "en", // "en" | "bn"
      "communicationPreferences": {
        "email": true,
        "sms": true,
        "push": false
      }
    },
    "portalAccess": {
      "givingHistory": true,
      "taxLetters": true,
      "eventRegistration": true,
      "prayerRequests": true,
      "volunteerSignup": true,
      "profileManagement": true
    }
  }
}
```

**Additional Actions:**
- `getMemberGivingHistory` - Returns contribution history
- `downloadTaxLetter` - Generates PDF tax letter
- `registerForEvent` - Event registration
- `submitPrayerRequest` - Submit anonymous or named prayer request
- `signupForVolunteer` - Volunteer opportunity signup
- `updateMemberProfile` - Profile updates

**Sheet Structure:** MEMBER_PORTAL_USERS
```
| MemberID | Email | PasswordHash | LastLogin | PreferredLanguage | CommunicationPreferencesJSON | Status |
```

---

## REALTIME EVENT STREAM ARCHITECTURE

### KingdomEventStream

**Purpose:** Realtime event broadcasting for giving, member activity, volunteer changes, system alerts using WebSocket/Firebase/Supabase.

**Event Types:**
```javascript
// Giving Event
{
  "eventType": "contribution_received",
  "tenantId": "GPBC001",
  "timestamp": "2026-02-05T14:30:00Z",
  "data": {
    "amount": 250.00,
    "method": "Text to Give",
    "anonymous": false
  },
  "notificationLevel": "info"
}

// Volunteer Event
{
  "eventType": "volunteer_checked_in",
  "tenantId": "GPBC001",
  "timestamp": "2026-02-05T09:00:00Z",
  "data": {
    "volunteerName": "Sarah Johnson",
    "ministry": "Youth Ministry",
    "eventName": "Sunday Service"
  },
  "notificationLevel": "info"
}

// System Alert
{
  "eventType": "budget_variance_alert",
  "tenantId": "GPBC001",
  "timestamp": "2026-02-05T08:00:00Z",
  "data": {
    "severity": "Medium",
    "message": "Monthly giving 15% below budget with 7 days remaining",
    "category": "finance",
    "recommendedAction": "Review budget forecast with finance team"
  },
  "notificationLevel": "warning"
}

// Ministry Alert
{
  "eventType": "volunteer_burnout_risk",
  "tenantId": "GPBC001",
  "timestamp": "2026-02-05T10:00:00Z",
  "data": {
    "severity": "High",
    "message": "3 youth ministry volunteers at burnout risk (12+ consecutive weeks)",
    "ministry": "Youth Ministry",
    "affectedVolunteers": 3,
    "recommendedAction": "Rotate in backup volunteers and provide break weeks"
  },
  "notificationLevel": "alert"
}
```

**WebSocket Connection Pattern:**
```javascript
// Client-side (Frontend)
const ws = new WebSocket('wss://kingdomos.app/events?tenantId=GPBC001&authToken=JWT_TOKEN');

ws.onmessage = (event) => {
  const kingdomEvent = JSON.parse(event.data);
  
  switch(kingdomEvent.eventType) {
    case 'contribution_received':
      updateGivingDashboard(kingdomEvent.data);
      showToastNotification('New contribution received');
      break;
    case 'volunteer_checked_in':
      updateVolunteerBoard(kingdomEvent.data);
      break;
    case 'budget_variance_alert':
      showAlertBanner(kingdomEvent.data);
      break;
    // ... additional event handlers
  }
};
```

---

## KINGDOM AUTOMATION ENGINE

### Automated Jobs Schedule

**Daily Jobs (2:00 AM):**
- Financial health score recalculation
- Budget variance monitoring and alerts
- Volunteer burnout risk detection
- Event capacity monitoring (upcoming events within 7 days)

**Weekly Jobs (Monday 3:00 AM):**
- Ministry Copilot recommendation generation
- Spiritual engagement analysis update
- Volunteer scheduling suggestions generation
- Communication engagement analytics

**Monthly Jobs (1st of Month 4:00 AM):**
- Monthly financial reports generation
- Grant reporting deadline reminders
- Compliance status checks
- Denomination reporting prep
- Member engagement trend analysis

**Quarterly Jobs (1st of Quarter 5:00 AM):**
- Comprehensive financial audit prep
- Strategic ministry planning insights
- Annual giving trend projections
- Volunteer retention analysis

---

## ROLE-BASED ACCESS CONTROL

### Permission Matrix

| Action | Super Admin | Church Admin | Finance Admin | Ministry Leader | Volunteer | Member |
|--------|-------------|--------------|---------------|-----------------|-----------|--------|
| View Financial Data | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Budget | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Member Data | ✅ | ✅ | ✅ | ✅ (Ministry Only) | ❌ | ❌ (Own Only) |
| Edit Member Profiles | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Own Only) |
| Send Communications | ✅ | ✅ | ❌ | ✅ (Ministry Only) | ❌ | ❌ |
| Manage Volunteers | ✅ | ✅ | ❌ | ✅ (Ministry Only) | ❌ | ❌ |
| Access AI Copilot | ✅ | ✅ | ✅ (Finance Insights) | ✅ (Ministry Insights) | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ (Finance Only) | ✅ (Ministry Only) | ❌ | ❌ |
| Manage Grants | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Member Portal Access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## ETHICAL CONSTRAINTS & GOVERNANCE

### AI MUST NEVER:

1. ❌ **Replace Human Ministry Leadership**
   - AI suggests, humans decide
   - No autonomous ministry decisions
   - All recommendations require human approval

2. ❌ **Auto Send Church-Wide Messages Without Approval**
   - All communications require explicit approval
   - No automated emergency messaging (except system alerts to admins)
   - No AI-generated sermon content without pastor review

3. ❌ **Auto Make Financial Decisions**
   - Budget recommendations require finance team approval
   - No automatic fund transfers
   - No autonomous grant applications (drafts only)

4. ❌ **Share Member Personal Data Across Churches**
   - Tenant isolation strictly enforced
   - No cross-church member visibility
   - Only aggregated anonymous network intelligence

5. ❌ **Spiritually Judge or Rank Members**
   - Engagement scores for pastoral care only
   - No public spiritual rankings
   - No negative labels (e.g., "uncommitted", "backslider")

6. ❌ **Autonomously Deploy Ministry Changes**
   - Volunteer scheduling suggestions require approval
   - Event changes require approval
   - Ministry restructuring requires human decision

### AI MAY:

1. ✅ **Suggest Ministry Opportunities**
   - Data-driven volunteer recommendations
   - Outreach campaign timing suggestions
   - Event optimization ideas

2. ✅ **Predict Risks and Opportunities**
   - Giving decline risk alerts
   - Volunteer burnout warnings
   - Event capacity forecasts

3. ✅ **Automate Reports and Compliance**
   - Monthly financial reports
   - Denomination reporting
   - Grant compliance tracking

4. ✅ **Optimize Communications**
   - Send time optimization
   - Message tone suggestions
   - Engagement predictions

---

## TESTING GUIDE

### Test 1: Multi-User Role Access Control
**Objective:** Verify users can only access modules permitted by their role

**Steps:**
1. Login as Super Admin → verify full system access
2. Login as Church Admin → verify church-wide access, no cross-church access
3. Login as Finance Admin → verify financial data access, NO member profile editing
4. Login as Ministry Leader → verify ministry data access, NO financial data access
5. Login as Volunteer → verify limited access, own schedule only
6. Login as Member → verify portal-only access, own data only

**Expected:** All role restrictions enforced, no unauthorized access logged

---

### Test 2: AI Copilot Safety Validation
**Objective:** Verify AI Ministry Copilot generates safe, ethical recommendations

**Steps:**
1. Generate AI recommendations for church
2. Review all recommendations for:
   - No autonomous execution (all require approval)
   - No spiritual judgment language
   - No member labeling
   - Confidence scores present
   - Clear action steps provided
3. Attempt to execute recommendation without approval

**Expected:** All recommendations ethical, require explicit approval, no auto-execution possible

---

### Test 3: Volunteer OS Scheduling Validation
**Objective:** Verify volunteer scheduling suggestions are valid and consider burnout

**Steps:**
1. Add volunteer activity data (consecutive 12+ weeks for 2 volunteers)
2. Request volunteer scheduling suggestions for upcoming event
3. Verify burnout risk volunteers flagged
4. Verify fresh volunteers prioritized
5. Check skill matching accuracy

**Expected:** High-burnout volunteers NOT suggested, skill matches accurate, fresh volunteers prioritized

---

### Test 4: Financial OS Accuracy Verification
**Objective:** Verify Financial Health Dashboard matches actual sheet data

**Steps:**
1. Add contributions totaling $18,245 for February
2. Set monthly budget to $22,000
3. Load Financial Health Dashboard
4. Verify currentMonthGiving = $18,245
5. Verify percentOfBudget = 83%
6. Verify variance calculations accurate

**Expected:** All financial metrics match actual data, projections within ±5% variance

---

### Test 5: Tenant Isolation Enforcement
**Objective:** Verify Church A cannot access Church B data

**Steps:**
1. Register Church A (GPBC001) and Church B (TestChurch002)
2. Add member data to both churches
3. Login as Church A admin
4. Attempt to query Church B member data
5. Verify access denied and logged

**Expected:** Cross-tenant access blocked, TENANT_ACCESS_LOG records unauthorized attempt

---

### Test 6: Realtime Event Stream Functionality
**Objective:** Verify realtime events broadcast correctly

**Steps:**
1. Connect to WebSocket with Church A credentials
2. Add contribution via API
3. Verify contribution event received in WebSocket within 2 seconds
4. Check event includes correct tenantId, amount, timestamp
5. Verify event does NOT include donor personal details

**Expected:** Events broadcast in <2 seconds, data accurate, privacy maintained

---

### Test 7: Member Portal Authentication
**Objective:** Verify member portal login and data access

**Steps:**
1. Register member account with email/password
2. Login to member portal
3. Verify giving history displays correctly
4. Download tax letter
5. Register for event
6. Submit prayer request
7. Update profile

**Expected:** All portal features functional, data accurate, profile updates save correctly

---

### Test 8: Communication Engine Delivery
**Objective:** Verify communications send successfully

**Steps:**
1. Compose SMS message to test group (5 members with opted-in SMS)
2. Schedule for immediate delivery
3. Verify all 5 members receive SMS within 5 minutes
4. Check COMMUNICATION_HISTORY logs delivery status
5. Verify SMS credits deducted correctly

**Expected:** 100% delivery rate, accurate logging, correct cost calculation

---

### Test 9: Ethical Engagement Scoring
**Objective:** Verify spiritual engagement AI never labels members negatively

**Steps:**
1. Generate spiritual engagement insights
2. Review all language for:
   - No negative labels ("uncommitted", "backslider")
   - No spiritual rankings ("most spiritual", "least committed")
   - Framed as pastoral care opportunities
3. Verify engagement scores not publicly visible
4. Check member portal for score visibility

**Expected:** No negative language, no public scores, pastoral care framing only

---

### Test 10: Kingdom Automation Execution
**Objective:** Verify scheduled automation jobs execute successfully

**Steps:**
1. Setup daily job: Budget variance monitoring
2. Trigger job manually
3. Verify job executes without errors
4. Check SCHEDULED_JOBS_LOG for execution record
5. Verify alerts sent if variance detected
6. Verify job runs automatically next scheduled time

**Expected:** Jobs execute successfully, logs accurate, alerts sent, automatic scheduling works

---

## SUCCESS CRITERIA — PHASE 7 COMPLETE

### Technical Completeness
- ✅ All 12 core modules functional
- ✅ Multi-tenant identity system operational
- ✅ Role-based access control enforced
- ✅ Unified Church Data Graph generating 360° member views
- ✅ AI Ministry Copilot live with ethical constraints
- ✅ Communication Engine supporting SMS/Email/Push
- ✅ Volunteer OS generating valid scheduling suggestions
- ✅ Event Operations forecasting accurately
- ✅ Kingdom Financial OS matching actual data
- ✅ Spiritual Engagement AI never labels members negatively
- ✅ Member Portal operational with authentication
- ✅ Realtime Event Stream broadcasting <2 second latency
- ✅ Kingdom Automation Engine executing scheduled jobs

### Performance Targets
- Kingdom OS Dashboard loads in <3 seconds
- AI Copilot generates recommendations in <5 seconds
- Church Data Graph builds in <10 seconds (100+ members)
- Communication delivery <5 minutes (SMS), <10 minutes (Email)
- Realtime events broadcast in <2 seconds
- Member portal responsive on mobile devices

### Security & Privacy Compliance
- Zero unauthorized cross-tenant access attempts succeed
- 100% of communications require approval before sending
- All financial transactions logged and auditable
- Member personal data never exposed publicly
- Engagement scores internal to pastoral team only
- Tenant isolation verified across all modules

### User Adoption Targets
- 80%+ church admin users logging in weekly
- 50%+ ministry leaders using AI Copilot monthly
- 30%+ members accessing member portal quarterly
- 90%+ volunteer scheduling suggestions accepted
- 95%+ financial reports generated automatically

### Kingdom OS Platform Maturity: 10.0/10
- Complete church operating system operational
- Human-led ministry with AI assistance
- Ethical AI constraints enforced throughout
- Multi-church network ready
- Realtime operations functional
- Member self-service portal live
- Comprehensive automation engine active
- Security and privacy compliant

---

**END OF PHASE 7 BACKEND SPECIFICATION**

**KINGDOM OPERATING SYSTEM STATUS: ARCHITECTURE COMPLETE**
**Next Steps: Frontend Implementation → Testing → Production Deployment**
