# PHASE 5 BACKEND SPECIFICATION
## Autonomous Church Operations - Self-Optimizing Ministry System

**Version:** 5.0  
**Target Maturity:** 9.7/10 (Operational Intelligence)  
**Ethical Principle:** AI RECOMMENDS + PREPARES + PRECONFIGURES, HUMANS APPROVE FINAL ACTION

---

## TABLE OF CONTENTS
1. [Overview](#overview)
2. [Ethical Constraints](#ethical-constraints)
3. [Backend Actions](#backend-actions)
4. [Sheet Structures](#sheet-structures)
5. [Automation Scheduler](#automation-scheduler)
6. [Testing Guide](#testing-guide)

---

## OVERVIEW

Phase 5 builds on Phase 4's predictive intelligence by adding operational optimization capabilities. While Phase 4 answers "what will happen?", Phase 5 answers "what should we do about it?". The system provides AI-powered recommendations for financial flow optimization, ministry resource allocation, service planning, volunteer deployment, outreach impact maximization, and budget self-balancing.

### Key Differences from Phase 4
- **Phase 4:** Strategic insights (predictions, forecasts, risk alerts)
- **Phase 5:** Operational recommendations (rebalancing plans, resource allocation, deployment suggestions)

### Architecture
- **Frontend:** 9 new React hooks in `usePhase5Operations.js`
- **Backend:** 9 new Google Apps Script actions (this specification)
- **Storage:** 4 new sheets for operational intelligence data
- **Automation:** Weekly/Monthly/Quarterly scheduled triggers

---

## ETHICAL CONSTRAINTS

### Hard Boundaries (NEVER Allow AI To)
1. ❌ Execute financial transactions
2. ❌ Contact donors or send messages
3. ❌ Change ministry direction or priorities
4. ❌ Approve spending or budget changes
5. ❌ Modify member records
6. ❌ Send automated emails/SMS
7. ❌ Make decisions without human review

### Safe Operations (AI Can)
1. ✅ Analyze data and identify patterns
2. ✅ Generate recommendations for human review
3. ✅ Create draft reports requiring approval
4. ✅ Calculate optimization scenarios
5. ✅ Suggest resource reallocations
6. ✅ Identify risks and opportunities
7. ✅ Prepare action plans for approval

### Validation Rules
Every backend action must:
- Return recommendations with `"requiresApproval": true` flag
- Include confidence scores (0-100)
- Provide reasoning for each suggestion
- Log all AI-generated recommendations
- Never execute actions automatically

---

## BACKEND ACTIONS

### 1. optimizeChurchCashFlow
**Purpose:** Analyze monthly cash flow patterns and recommend rebalancing strategies

**Request Schema:**
```javascript
{
  "action": "optimizeChurchCashFlow",
  "params": {
    "tenantId": "GPBC001",
    "analysisMonths": 6  // Look back period (default: 6)
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "stabilityScore": 78,        // 0-100 (Financial health indicator)
    "reserveMonths": 4.2,        // Months of expenses in reserves
    "cashFlowTrend": "improving", // "improving" | "stable" | "declining" | "volatile"
    "rebalancingPlan": [
      {
        "action": "Move $12,000 from General Fund to Ministry Growth Reserve",
        "reason": "General Fund exceeds 6-month reserve target by $12,000",
        "impact": "Increases ministry investment capacity by 15%",
        "riskLevel": "low",        // "low" | "medium" | "high"
        "requiresApproval": true
      },
      {
        "action": "Reduce Emergency Fund allocation by $5,000",
        "reason": "Emergency Fund at 8 months (target: 6 months)",
        "impact": "Frees cash for strategic initiatives",
        "riskLevel": "low",
        "requiresApproval": true
      }
    ],
    "recommendations": [
      "Consider setting up automatic monthly transfers to stabilize reserves",
      "Review large expense categories for optimization opportunities",
      "Current reserve safety: EXCELLENT (4.2 months, target: 3-6 months)"
    ],
    "risks": [
      {
        "type": "Seasonal Volatility",
        "severity": "medium",
        "description": "December giving typically 35% above average, January -20%",
        "recommendation": "Maintain higher reserves during Q1"
      }
    ]
  }
}
```

**Business Logic:**
1. **Stability Score Calculation (0-100):**
   - Reserve months coverage: 40 points (3-6 months optimal = 40 points, <3 months = 0-20 points, >6 months = 20-30 points)
   - Income volatility: 30 points (lower volatility = higher score)
   - Expense predictability: 20 points (consistent expenses = higher score)
   - Cash flow trend: 10 points (improving = 10, stable = 7, declining = 3, volatile = 0)

2. **Reserve Months Calculation:**
   ```javascript
   reserveMonths = (General Fund Balance + Emergency Fund Balance) / Average Monthly Expenses
   ```

3. **Rebalancing Algorithm:**
   - IF reserveMonths > 6: Suggest moving excess to Ministry Growth Fund
   - IF reserveMonths < 3: Suggest reducing discretionary expenses or pausing ministry expansion
   - IF specific fund exceeds target by >15%: Suggest reallocating excess
   - Each suggestion must include impact analysis and risk assessment

4. **Cash Flow Trend Analysis:**
   - Calculate 3-month rolling average of net cash flow
   - Compare current trend to 6-month baseline
   - "improving" if trend > baseline + 10%
   - "declining" if trend < baseline - 10%
   - "volatile" if standard deviation > 30% of mean
   - "stable" otherwise

**Sheet Structure:** AI_FINANCIAL_OPTIMIZATION
```
| Timestamp | TenantID | StabilityScore | ReserveMonths | CashFlowTrend | RebalancingPlanJSON | RisksJSON |
```

---

### 2. getMinistryResourceOptimization
**Purpose:** Prioritize ministry investment based on ROI, growth potential, and strategic alignment

**Request Schema:**
```javascript
{
  "action": "getMinistryResourceOptimization",
  "params": {
    "tenantId": "GPBC001",
    "analysisMonths": 6
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "growthIndex": 72,           // 0-100 (Overall ministry health)
    "investmentPriorities": [
      {
        "rank": 1,
        "ministry": "Youth & Young Adults",
        "currentBudget": 15000,
        "recommendedBudget": 22000,
        "reason": "High engagement growth (+32% in 6mo), below-average cost per participant ($45 vs $67 church avg)",
        "potentialImpact": "Projected to reach 15 additional families within 12 months",
        "score": 87,               // Priority score 0-100
        "metrics": {
          "participationGrowth": 32,  // % growth last 6 months
          "costPerParticipant": 45,
          "givingPerParticipant": 120,
          "roi": 2.67                  // Giving/Cost ratio
        }
      },
      {
        "rank": 2,
        "ministry": "Community Outreach",
        "currentBudget": 8000,
        "recommendedBudget": 12000,
        "reason": "Highest first-time visitor conversion rate (42%), low cost per conversion ($185)",
        "potentialImpact": "Could double visitor-to-member pipeline with increased budget",
        "score": 81
      }
      // ... additional priorities
    ],
    "recommendations": [
      "Shift $7,000 from declining programs to high-growth ministries",
      "Consider pilot programs for Youth Ministry expansion",
      "Review administrative overhead in lower-ROI ministries"
    ],
    "risks": [
      {
        "ministry": "Seniors Ministry",
        "type": "Low Engagement",
        "severity": "medium",
        "description": "Participation down 18% over 6 months despite increased budget",
        "recommendation": "Conduct member survey to understand causes before additional investment"
      }
    ]
  }
}
```

**Business Logic:**
1. **Priority Score Calculation (0-100):**
   - Participation growth trend: 35 points
   - Cost-effectiveness (ROI): 25 points
   - Strategic alignment: 20 points
   - Volunteer engagement: 10 points
   - New member conversion: 10 points

2. **ROI Calculation:**
   ```javascript
   ROI = (Total Giving from Ministry Participants) / (Ministry Budget)
   // Values >1.0 indicate positive financial ROI
   // Also consider non-financial ROI (baptisms, salvations, discipleship)
   ```

3. **Growth Index Calculation:**
   - Average all ministry participation growth rates
   - Weight by ministry size (larger ministries weighted higher)
   - Normalize to 0-100 scale

4. **Budget Recommendation Algorithm:**
   - High performers (score >75): Suggest 15-30% budget increase
   - Mid performers (score 50-75): Maintain current budget
   - Low performers (score <50): Suggest budget reduction or program redesign
   - Never suggest >50% change without exceptional justification

**Sheet Structure:** AI_MINISTRY_OPTIMIZATION
```
| Timestamp | TenantID | GrowthIndex | InvestmentPrioritiesJSON | RisksJSON |
```

---

### 3. getServicePlanningSuggestions
**Purpose:** Optimize service scheduling and themes based on attendance/giving patterns

**Request Schema:**
```javascript
{
  "action": "getServicePlanningSuggestions",
  "params": {
    "tenantId": "GPBC001",
    "planningMonths": 6  // Forward-looking period
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "suggestedServiceDates": [
      {
        "date": "2025-07-20",
        "type": "Special Outreach Service",
        "reason": "Historical data shows high visitor attendance in July (avg +28%)",
        "expectedAttendance": 285,
        "recommendedTheme": "Summer Family Festival",
        "preparationNeeds": [
          "Children's ministry volunteers (+8)",
          "Parking team expansion",
          "Guest follow-up materials (300 units)"
        ]
      },
      {
        "date": "2025-12-24",
        "type": "Christmas Eve Service",
        "reason": "Highest annual attendance (450+ expected)",
        "expectedAttendance": 485,
        "recommendedTheme": "Hope of Christmas",
        "preparationNeeds": [
          "Additional seating setup",
          "Expanded worship team",
          "First-time visitor packets (200 units)"
        ]
      }
    ],
    "themeRecommendations": [
      {
        "month": "June 2025",
        "theme": "Foundations of Faith",
        "reason": "Aligns with summer baptism season, historically high engagement",
        "historicalGivingImpact": "+12% during similar teaching series"
      }
    ],
    "avoidancePeriods": [
      {
        "startDate": "2025-08-01",
        "endDate": "2025-08-15",
        "reason": "School start conflicts, attendance typically -35%",
        "recommendation": "Avoid launching new series or major initiatives"
      }
    ]
  }
}
```

**Business Logic:**
1. **Attendance Prediction Model:**
   - Analyze 3-year historical attendance data
   - Identify seasonal patterns (holidays, summer, school year)
   - Factor in local events (county fairs, sports tournaments)
   - Apply growth trend multiplier

2. **Theme Optimization:**
   - Correlate past themes with giving/attendance spikes
   - Identify high-engagement sermon series
   - Recommend themes during peak attendance months

3. **Resource Planning:**
   - Calculate volunteer needs based on attendance forecasts
   - Suggest material quantities (bulletins, communion, etc.)
   - Identify facility constraints

**Sheet Structure:** AI_SERVICE_PLANNING
```
| Timestamp | TenantID | ServiceDateSuggestionsJSON | ThemeRecommendationsJSON |
```

---

### 4. getVolunteerDeploymentIntelligence
**Purpose:** Balance volunteer workload and prevent burnout through smart redistribution

**Request Schema:**
```javascript
{
  "action": "getVolunteerDeploymentIntelligence",
  "params": {
    "tenantId": "GPBC001"
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "loadIndex": 67,             // 0-100 (Optimal: 40-60, >80 = high risk)
    "burnoutAlerts": 3,
    "redistributionRecommendations": [
      {
        "volunteer": "Sarah Johnson",
        "currentLoad": "85% (Overloaded)",
        "roles": ["Worship Team Lead", "Youth Ministry Co-Lead", "Welcome Team"],
        "suggestion": "Reduce to 2 roles, delegate Youth Co-Lead to assistant",
        "reason": "Serving 12 weeks consecutively without break, attendance declining",
        "impact": "Prevents burnout, maintains long-term volunteer health",
        "requiresApproval": true
      },
      {
        "volunteer": "Mike Chen",
        "currentLoad": "22% (Underutilized)",
        "roles": ["Parking Team (monthly)"],
        "suggestion": "Invite to join Tech Team or Hospitality rotation",
        "reason": "Expressed interest in media/tech, has relevant skills",
        "impact": "Increases engagement, fills high-need role",
        "requiresApproval": true
      }
    ],
    "recommendations": [
      "Implement mandatory 1-week-off-per-quarter policy for high-load volunteers",
      "Create assistant leader pipeline for overburdened teams",
      "Recruit 5-7 new volunteers for Children's Ministry (critical need)"
    ],
    "risks": [
      {
        "type": "Volunteer Shortage",
        "area": "Children's Ministry",
        "severity": "high",
        "description": "Operating at 60% capacity, ratio exceeds safety guidelines",
        "recommendation": "Launch targeted recruitment campaign within 30 days"
      }
    ]
  }
}
```

**Business Logic:**
1. **Load Index Calculation:**
   ```javascript
   loadIndex = (Sum of all volunteer hours needed) / (Sum of available volunteer hours) * 100
   // Optimal: 40-60 (healthy reserve capacity)
   // Warning: 61-80 (stretched thin)
   // Critical: >80 (burnout risk)
   ```

2. **Burnout Detection:**
   - Serving >8 weeks consecutively: +1 alert
   - Multiple leadership roles: +1 alert
   - Declining attendance while serving: +1 alert
   - Expressed concerns to staff: +1 alert

3. **Redistribution Algorithm:**
   - Identify overloaded volunteers (>70% capacity)
   - Find underutilized volunteers with relevant skills
   - Match based on interests, availability, gift assessments
   - Never suggest removing volunteers without replacement plan

**Sheet Structure:** AI_VOLUNTEER_INTELLIGENCE
```
| Timestamp | TenantID | LoadIndex | BurnoutAlerts | RedistributionJSON | RisksJSON |
```

---

### 5. getOutreachImpactAnalysis
**Purpose:** Rank outreach types by ROI and recommend investment priorities

**Request Schema:**
```javascript
{
  "action": "getOutreachImpactAnalysis",
  "params": {
    "tenantId": "GPBC001",
    "analysisMonths": 12
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "effectivenessScore": 74,    // 0-100 (Overall outreach health)
    "topImpactTypes": [
      {
        "rank": 1,
        "outreachType": "Community Service Projects",
        "eventsLast12Mo": 8,
        "totalCost": 4200,
        "totalAttendance": 340,
        "newVisitors": 42,
        "visitorConversions": 18,
        "roi": {
          "costPerAttendee": 12.35,
          "costPerVisitor": 100,
          "costPerConversion": 233.33,
          "conversionRate": 42.9
        },
        "recommendation": "INCREASE INVESTMENT - Highest conversion rate, lowest cost per conversion",
        "suggestedBudget": 7000,
        "potentialImpact": "Could reach 60+ new visitors with expanded budget"
      },
      {
        "rank": 2,
        "outreachType": "Alpha Course",
        "eventsLast12Mo": 2,
        "totalCost": 1800,
        "totalAttendance": 28,
        "newVisitors": 28,
        "visitorConversions": 12,
        "roi": {
          "costPerAttendee": 64.29,
          "costPerVisitor": 64.29,
          "costPerConversion": 150,
          "conversionRate": 42.9
        },
        "recommendation": "INCREASE FREQUENCY - High conversion rate but low event count",
        "suggestedBudget": 3600,
        "potentialImpact": "Running quarterly instead of twice yearly could double conversions"
      }
      // ... ranks 3-5
    ],
    "recommendations": [
      "Shift resources from low-ROI events to top 3 performers",
      "Community Service Projects show highest impact - expand quarterly",
      "Consider discontinuing 'General Mailers' (0% conversion, $2400 spent)"
    ],
    "lowPerformers": [
      {
        "outreachType": "Direct Mail Campaigns",
        "issue": "0% conversion rate despite $2400 investment",
        "recommendation": "Discontinue or redesign approach"
      }
    ]
  }
}
```

**Business Logic:**
1. **Effectiveness Score Calculation:**
   - Total conversions: 40 points
   - Conversion rate: 30 points
   - Cost efficiency: 20 points
   - Volunteer engagement: 10 points

2. **ROI Ranking Algorithm:**
   ```javascript
   Priority Score = (Conversion Rate * 0.5) + ((1 / Cost Per Conversion) * 500 * 0.3) + (Event Frequency * 0.2)
   // Normalize to 0-100 scale
   ```

3. **Investment Recommendations:**
   - Top performers (score >75): Suggest 50-100% budget increase
   - Mid performers (score 50-75): Maintain or slight increase
   - Low performers (score <50): Suggest budget reduction or elimination

**Sheet Structure:** AI_OUTREACH_INTELLIGENCE
```
| Timestamp | TenantID | EffectivenessScore | TopImpactTypesJSON | LowPerformersJSON |
```

---

### 6. getBudgetBalancingRecommendations
**Purpose:** Forecast income/expenses and suggest budget adjustments for financial health

**Request Schema:**
```javascript
{
  "action": "getBudgetBalancingRecommendations",
  "params": {
    "tenantId": "GPBC001",
    "forecastMonths": 3
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "forecastPeriod": "June-August 2025",
    "projections": {
      "month1": {
        "expectedIncome": 48500,
        "expectedExpenses": 42000,
        "netCashFlow": 6500,
        "confidence": 82
      },
      "month2": {
        "expectedIncome": 45000,
        "expectedExpenses": 43500,
        "netCashFlow": 1500,
        "confidence": 78
      },
      "month3": {
        "expectedIncome": 42000,
        "expectedExpenses": 44000,
        "netCashFlow": -2000,
        "confidence": 70
      }
    },
    "safeExpansionBudget": 12000,  // Available for new initiatives
    "adjustmentSuggestions": [
      {
        "type": "Expense Reduction",
        "category": "Facilities Maintenance",
        "currentBudget": 8000,
        "recommendedBudget": 6500,
        "reason": "Month 3 projects deficit of $2,000. Facilities spending 18% over historical average.",
        "impact": "Eliminates projected deficit while maintaining essential services",
        "requiresApproval": true
      },
      {
        "type": "Income Opportunity",
        "suggestion": "Launch summer giving campaign",
        "reason": "Historical summer giving dip averages -12%. Campaign could offset by 6-8%.",
        "potentialIncrease": 3500,
        "requiresApproval": true
      }
    ],
    "recommendations": [
      "Delay non-essential facility upgrades until Q4 (stronger giving season)",
      "Build $3,000 buffer into Month 3 to cover projected deficit",
      "Consider short-term expense freeze if income trends below forecast"
    ]
  }
}
```

**Business Logic:**
1. **Income Forecasting:**
   - Use 12-month historical average as baseline
   - Apply seasonal adjustment factors (summer -10%, December +35%, etc.)
   - Factor in known one-time gifts or pledges
   - Calculate confidence based on volatility

2. **Expense Forecasting:**
   - Average last 12 months by category
   - Add known upcoming expenses (events, repairs, etc.)
   - Apply inflation factor (2-3% annually)

3. **Safe Expansion Budget:**
   ```javascript
   safeExpansion = (Projected Income - Projected Expenses - Reserve Target) * Safety Factor (0.7)
   ```

4. **Adjustment Triggers:**
   - IF projected net cash flow < 0: Suggest expense reductions
   - IF expenses > income by >5%: High priority adjustments
   - IF reserves projected to fall below 3 months: Critical alert

**Sheet Structure:** AI_BUDGET_INTELLIGENCE
```
| Timestamp | TenantID | ForecastPeriod | ProjectionsJSON | AdjustmentSuggestionsJSON |
```

---

### 7. generateAutoBoardReport
**Purpose:** Generate draft board report with financial summary and key metrics

**Request Schema:**
```javascript
{
  "action": "generateAutoBoardReport",
  "params": {
    "tenantId": "GPBC001",
    "reportMonth": "2025-05"
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "reportTitle": "GPBC Board Report - May 2025",
    "generatedAt": "2025-05-31T14:30:00Z",
    "isDraft": true,
    "requiresReview": true,
    "sections": {
      "executiveSummary": {
        "membershipTotal": 342,
        "membershipChange": "+8 (2.4%)",
        "attendanceAvg": 285,
        "attendanceChange": "+12 (4.4%)",
        "givingTotal": 52400,
        "givingChange": "+4200 (8.7%)",
        "expensesTotal": 43100,
        "netCashFlow": 9300,
        "reservesTotal": 178000,
        "reserveMonths": 4.1
      },
      "financialHighlights": [
        "Strong month with $9,300 net positive cash flow",
        "Giving exceeded budget by 8.7% ($4,200)",
        "Expenses remain on target (98% of budget)",
        "Reserves healthy at 4.1 months"
      ],
      "ministryHighlights": [
        "Youth Ministry launched summer program (42 registered)",
        "Outreach event reached 85 community members",
        "Baptism scheduled for June 15 (8 candidates)"
      ],
      "actionItems": [
        "APPROVE: $5,000 allocation for worship equipment upgrade",
        "REVIEW: Facility maintenance quote ($12,500)",
        "DISCUSS: Fall ministry expansion plans"
      ],
      "aiInsights": [
        "Current trajectory projects 6% annual growth in attendance",
        "Giving stability score: 82/100 (Excellent)",
        "Volunteer load index within healthy range (58%)"
      ]
    },
    "complianceNotes": [
      "All financial records reconciled and up-to-date",
      "No outstanding compliance issues",
      "Annual audit scheduled for Q3"
    ]
  }
}
```

**Business Logic:**
1. Aggregate all financial data for report month
2. Calculate month-over-month and year-over-year changes
3. Pull top 5 ministry highlights from activity logs
4. Include AI insights from Phase 4/5 intelligence
5. Flag items requiring board approval
6. Generate executive summary in board-ready language

**Sheet Structure:** AUTO_REPORT_DRAFTS
```
| Timestamp | TenantID | ReportType | ReportMonth | DraftContentJSON | ApprovedBy | ApprovedAt |
```

---

### 8. generateAutoComplianceReport
**Purpose:** Generate draft IRS/SoCal compliance reports

**Request Schema:**
```javascript
{
  "action": "generateAutoComplianceReport",
  "params": {
    "tenantId": "GPBC001",
    "reportType": "IRS990" | "SoCalDenomination",
    "fiscalYear": "2024"
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "reportType": "IRS990",
    "fiscalYear": "2024",
    "isDraft": true,
    "requiresReview": true,
    "sections": {
      "part1_revenue": {
        "contributionsGrants": 585200,
        "programServiceRevenue": 0,
        "investmentIncome": 1450,
        "otherRevenue": 0,
        "totalRevenue": 586650
      },
      "part2_expenses": {
        "grantsToOrganizations": 0,
        "benefitsPaidToMembers": 0,
        "salariesCompensation": 285000,
        "professionalFees": 12500,
        "occupancyRent": 48000,
        "otherExpenses": 186500,
        "totalExpenses": 532000
      },
      "part3_netAssets": {
        "totalAssetsBeginning": 245000,
        "totalAssetsEnding": 298650,
        "totalLiabilitiesBeginning": 12000,
        "totalLiabilitiesEnding": 8000,
        "netAssetsBeginning": 233000,
        "netAssetsEnding": 290650
      }
    },
    "validationWarnings": [
      "REVIEW: Salaries exceed 50% of total expenses (IRS scrutiny threshold)",
      "VERIFY: Investment income amount with treasurer",
      "CONFIRM: No grants to organizations or individuals reported"
    ],
    "nextSteps": [
      "Review draft with treasurer and board",
      "Verify all figures against audited financials",
      "Submit to CPA for professional review",
      "File Form 990 by November 15, 2025"
    ]
  }
}
```

**Business Logic:**
1. Aggregate all financial transactions for fiscal year
2. Categorize into IRS Form 990 line items
3. Calculate totals and net assets
4. Run validation checks against IRS thresholds
5. Flag items requiring CPA review
6. Generate filing instructions and deadlines

---

### 9. getMultiMinistryComparison
**Purpose:** Compare performance across multiple ministries/campuses (future multi-campus ready)

**Request Schema:**
```javascript
{
  "action": "getMultiMinistryComparison",
  "params": {
    "tenantId": "GPBC001",
    "comparisonPeriod": "Q2-2025"
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "comparisonType": "Ministry Departments",  // Future: "Campuses"
    "period": "Q2-2025 (Apr-Jun)",
    "departments": [
      {
        "name": "Youth & Young Adults",
        "participants": 87,
        "participationGrowth": 15.3,
        "budget": 22000,
        "spending": 19450,
        "budgetUtilization": 88.4,
        "givingGenerated": 32500,
        "roi": 1.48,
        "volunteerCount": 12,
        "healthScore": 84
      },
      {
        "name": "Children's Ministry",
        "participants": 145,
        "participationGrowth": 8.2,
        "budget": 18000,
        "spending": 17800,
        "budgetUtilization": 98.9,
        "givingGenerated": 12000,
        "roi": 0.67,
        "volunteerCount": 24,
        "healthScore": 72
      }
      // ... additional departments
    ],
    "insights": [
      "Youth Ministry shows highest ROI (1.48) and growth rate (+15.3%)",
      "Children's Ministry operating near capacity, may need budget increase",
      "Seniors Ministry underutilizing budget (62% spent) - investigate barriers"
    ],
    "recommendations": [
      "Reallocate $3,000 from underutilized departments to Youth Ministry",
      "Expand Children's Ministry volunteer recruitment",
      "Review Seniors Ministry program effectiveness"
    ]
  }
}
```

**Business Logic:**
1. **Health Score Calculation:**
   - Participation growth: 30%
   - Budget utilization (optimal 80-95%): 25%
   - ROI: 20%
   - Volunteer engagement: 15%
   - Giving growth: 10%

2. **Comparison Metrics:**
   - Rank by health score
   - Identify top/bottom performers
   - Compare against church-wide averages
   - Flag outliers (exceptional or concerning)

3. **Future Multi-Campus Extensions:**
   - Same logic applies to comparing campuses
   - Add geographic/demographic factors
   - Include campus-specific KPIs (facility utilization, local community impact)

---

## SHEET STRUCTURES

### AI_FINANCIAL_OPTIMIZATION
```
Column A: Timestamp (YYYY-MM-DD HH:MM:SS)
Column B: TenantID (e.g., "GPBC001")
Column C: StabilityScore (0-100)
Column D: ReserveMonths (decimal)
Column E: CashFlowTrend (text: "improving" | "stable" | "declining" | "volatile")
Column F: RebalancingPlanJSON (stringified JSON array)
Column G: RisksJSON (stringified JSON array)
Column H: AnalysisMonths (integer: look-back period)
```

### AI_MINISTRY_OPTIMIZATION
```
Column A: Timestamp
Column B: TenantID
Column C: GrowthIndex (0-100)
Column D: InvestmentPrioritiesJSON (stringified JSON array - top 5 ranked)
Column E: RisksJSON (stringified JSON array)
Column F: AnalysisMonths
```

### AI_SERVICE_PLANNING
```
Column A: Timestamp
Column B: TenantID
Column C: PlanningMonths (forward-looking period)
Column D: ServiceDateSuggestionsJSON (stringified JSON array)
Column E: ThemeRecommendationsJSON (stringified JSON array)
Column F: AvoidancePeriodsJSON (stringified JSON array)
```

### AI_VOLUNTEER_INTELLIGENCE
```
Column A: Timestamp
Column B: TenantID
Column C: LoadIndex (0-100)
Column D: BurnoutAlerts (integer count)
Column E: RedistributionRecommendationsJSON (stringified JSON array)
Column F: RisksJSON (stringified JSON array)
```

### AI_OUTREACH_INTELLIGENCE
```
Column A: Timestamp
Column B: TenantID
Column C: EffectivenessScore (0-100)
Column D: AnalysisMonths
Column E: TopImpactTypesJSON (stringified JSON array - top 5)
Column F: LowPerformersJSON (stringified JSON array)
Column G: RecommendationsJSON (stringified JSON array)
```

### AI_BUDGET_INTELLIGENCE
```
Column A: Timestamp
Column B: TenantID
Column C: ForecastPeriod (text: "June-August 2025")
Column D: ForecastMonths (integer: 3)
Column E: ProjectionsJSON (stringified JSON object with month1/month2/month3)
Column F: SafeExpansionBudget (integer: dollars)
Column G: AdjustmentSuggestionsJSON (stringified JSON array)
Column H: RecommendationsJSON (stringified JSON array)
```

### AUTO_REPORT_DRAFTS
```
Column A: Timestamp
Column B: TenantID
Column C: ReportType (text: "board" | "compliance-IRS990" | "compliance-SoCal" | "grant")
Column D: ReportMonth (YYYY-MM)
Column E: DraftContentJSON (stringified JSON - full report structure)
Column F: IsDraft (boolean: TRUE)
Column G: RequiresReview (boolean: TRUE)
Column H: ApprovedBy (text: user email, initially blank)
Column I: ApprovedAt (timestamp, initially blank)
Column J: Status (text: "draft" | "reviewed" | "approved" | "submitted")
```

---

## AUTOMATION SCHEDULER

### Time-Driven Triggers Setup

**Weekly Jobs (Every Monday at 2:00 AM):**
```javascript
function createWeeklyTriggers() {
  // Financial Flow Optimization (Mondays)
  ScriptApp.newTrigger('runWeeklyFinancialOptimization')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();

  // Volunteer Deployment Intelligence (Mondays)
  ScriptApp.newTrigger('runWeeklyVolunteerAnalysis')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();

  // Ministry Resource Optimization (Mondays)
  ScriptApp.newTrigger('runWeeklyMinistryAnalysis')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();
}
```

**Monthly Jobs (1st of Month at 2:00 AM):**
```javascript
function createMonthlyTriggers() {
  // Outreach Impact Analysis (1st of month)
  ScriptApp.newTrigger('runMonthlyOutreachROI')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();

  // Budget Balancing (1st of month)
  ScriptApp.newTrigger('runMonthlyBudgetForecast')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();

  // Auto-generate Board Report Draft (1st of month)
  ScriptApp.newTrigger('runMonthlyBoardReportDraft')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
}
```

**Quarterly Jobs (1st of Quarter at 2:00 AM):**
```javascript
function createQuarterlyTriggers() {
  // Strategic Model Refresh (Jan 1, Apr 1, Jul 1, Oct 1)
  ScriptApp.newTrigger('runQuarterlyStrategicRefresh')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
  
  // Multi-Ministry Comparison Report (Quarterly)
  ScriptApp.newTrigger('runQuarterlyComparisonReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
}
```

### Job Execution Functions

**runWeeklyFinancialOptimization:**
```javascript
function runWeeklyFinancialOptimization() {
  try {
    const tenants = getAllActiveTenants(); // From TENANTS sheet
    
    tenants.forEach(tenant => {
      const result = optimizeChurchCashFlow({ tenantId: tenant.id });
      
      // Log execution
      logScheduledJob({
        jobType: 'financial_optimization',
        tenantId: tenant.id,
        status: result.success ? 'success' : 'failed',
        timestamp: new Date()
      });
      
      // Alert if critical issues found
      if (result.data.stabilityScore < 40) {
        sendEmailAlert({
          to: tenant.adminEmail,
          subject: `URGENT: Financial Stability Alert for ${tenant.name}`,
          body: `Stability score is ${result.data.stabilityScore}/100. Review recommendations immediately.`
        });
      }
    });
  } catch (error) {
    logScheduledJob({
      jobType: 'financial_optimization',
      status: 'error',
      errorMessage: error.toString()
    });
  }
}
```

**runMonthlyBoardReportDraft:**
```javascript
function runMonthlyBoardReportDraft() {
  try {
    const tenants = getAllActiveTenants();
    const lastMonth = getLastMonth(); // "2025-05" format
    
    tenants.forEach(tenant => {
      const report = generateAutoBoardReport({
        tenantId: tenant.id,
        reportMonth: lastMonth
      });
      
      // Save draft to AUTO_REPORT_DRAFTS sheet
      saveReportDraft(report);
      
      // Notify admin that draft is ready
      sendEmailNotification({
        to: tenant.adminEmail,
        subject: `Board Report Draft Ready - ${lastMonth}`,
        body: `A draft board report for ${lastMonth} has been generated. Please review and approve in the Operations Command Center.`
      });
    });
  } catch (error) {
    logScheduledJob({
      jobType: 'board_report_draft',
      status: 'error',
      errorMessage: error.toString()
    });
  }
}
```

### Scheduled Jobs Logging Sheet

**SCHEDULED_JOBS_LOG**
```
Column A: Timestamp (execution time)
Column B: JobType (text: financial_optimization, volunteer_analysis, etc.)
Column C: TenantID
Column D: Status (success | failed | error)
Column E: ErrorMessage (blank if success)
Column F: ExecutionTimeMs (milliseconds)
```

---

## TESTING GUIDE

### Test 1: Financial Optimization Updates
**Objective:** Verify that adding contributions triggers stability score recalculation

**Steps:**
1. Record current stability score from Operations Command Center
2. Add $10,000 contribution to General Fund
3. Wait for weekly trigger OR manually call `optimizeChurchCashFlow()`
4. Refresh Operations Command Center
5. **Expected:** Stability score increases, reserve months increase, recommendations update

---

### Test 2: Ministry Allocation Adapts
**Objective:** Verify investment priorities change based on participation growth

**Steps:**
1. Note current top 3 ministry investment priorities
2. Add 20 new participants to a mid-ranked ministry
3. Run `getMinistryResourceOptimization()`
4. **Expected:** Ministry with growth spike moves up in priority ranking, budget recommendation increases

---

### Test 3: Volunteer Redistribution Triggers
**Objective:** Verify burnout detection and redistribution suggestions

**Steps:**
1. Simulate volunteer serving 10 consecutive weeks in multiple roles
2. Run `getVolunteerDeploymentIntelligence()`
3. **Expected:** Burnout alert increments, redistribution recommendation appears suggesting role reduction

---

### Test 4: Outreach ROI Rankings Update
**Objective:** Verify top 5 impact types change based on new outreach data

**Steps:**
1. Note current top 5 outreach types
2. Add new outreach event with high attendance and low cost
3. Run `getOutreachImpactAnalysis()`
4. **Expected:** New high-ROI event appears in top 5, low performers may drop out

---

### Test 5: Budget Suggestions Adapt to Expense Spike
**Objective:** Verify budget balancing suggestions when expenses exceed forecast

**Steps:**
1. Note current 3-month expense forecast
2. Add large unexpected expense ($5,000 facility repair)
3. Run `getBudgetBalancingRecommendations()`
4. **Expected:** Month 3 projection shows deficit, adjustment suggestions recommend expense reductions or reserve usage

---

### Test 6: Ethical Constraint Verification
**Objective:** Confirm AI cannot execute actions without human approval

**Steps:**
1. Review all backend action responses
2. **Verify:** Every recommendation has `"requiresApproval": true` flag
3. **Verify:** No function directly modifies CONTRIBUTIONS, MEMBERS, or EXPENSES sheets
4. **Verify:** No function sends emails/SMS to members without explicit manual trigger
5. **Expected:** All operations are read-only analysis, no automated actions

---

### Test 7: Draft Reports Generate Correctly
**Objective:** Verify auto-generated board/compliance reports are accurate

**Steps:**
1. Call `generateAutoBoardReport()` for last month
2. Manually calculate total giving, expenses, net cash flow
3. Compare manual calculations to report figures
4. **Expected:** All figures match, report status = "draft", requiresReview = true

---

### Test 8: Load Test Operations Command Center
**Objective:** Verify dashboard loads with large datasets

**Steps:**
1. Populate database with 3 years of historical data (500+ members, 5000+ contributions)
2. Load Operations Command Center dashboard
3. Click "Refresh All Metrics"
4. **Expected:** Dashboard loads in <5 seconds, all 6 panels populate correctly, no errors

---

### Performance Benchmarks
- Financial optimization analysis: <3 seconds
- Ministry allocation analysis: <4 seconds
- Volunteer deployment analysis: <2 seconds
- Outreach impact analysis: <4 seconds
- Budget forecasting: <3 seconds
- Board report generation: <5 seconds
- Operations metrics parallel load: <6 seconds (all 5 sources)

---

## IMPLEMENTATION CHECKLIST

### Phase 5A: Frontend (COMPLETE ✅)
- [x] Create `usePhase5Operations.js` with 9 hooks
- [x] Build `OperationsCommandCenter.jsx` dashboard
- [x] Create `OperationsCommandCenter.css` styling
- [x] Update routing in `App.jsx`
- [x] Add sidebar navigation link
- [x] Test dashboard loads correctly

### Phase 5B: Backend (PENDING)
- [ ] Create 4 new sheets in Google Sheets
- [ ] Implement 9 backend actions in Google Apps Script
- [ ] Set up weekly/monthly/quarterly triggers
- [ ] Create SCHEDULED_JOBS_LOG sheet
- [ ] Test each action with sample data
- [ ] Verify ethical constraints enforced
- [ ] Performance test with large datasets

### Phase 5C: Integration & Testing (PENDING)
- [ ] Connect frontend hooks to backend actions
- [ ] Test financial optimization workflow
- [ ] Test ministry allocation workflow
- [ ] Test volunteer deployment workflow
- [ ] Test outreach impact workflow
- [ ] Test budget balancing workflow
- [ ] Test draft report generation
- [ ] Verify all "human approval required" checkpoints
- [ ] Load test with 3 years of data
- [ ] User acceptance testing

---

## SUCCESS METRICS

### Operational Intelligence Maturity: 9.7/10
- All 9 operational modules functional ✅
- Weekly/monthly/quarterly automation running ✅
- Human approval checkpoints verified ✅
- No automated actions without explicit approval ✅
- Operations health score accurately calculated ✅
- Recommendations adapt to data changes ✅

### Performance Targets
- Dashboard load time: <5 seconds
- Recommendation accuracy: >80%
- User satisfaction: >4.5/5 stars
- Recommendation acceptance rate: >60%

### Ethical Compliance
- Zero automated financial transactions
- Zero automated donor communications
- 100% of recommendations flagged "requiresApproval"
- All actions logged and auditable

---

**END OF PHASE 5 BACKEND SPECIFICATION**
