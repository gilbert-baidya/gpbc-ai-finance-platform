# PHASE 4 — AUTONOMOUS CHURCH INTELLIGENCE
## Backend Implementation Guide for Google Apps Script

================================================================================
## OVERVIEW
================================================================================

This document provides complete backend action specifications for Phase 4 AI.
All actions follow the standard GPBC API pattern and return JSON responses.

**Target Sheets:**
- `AI_GIVING_PREDICTIONS` - Member-level giving predictions
- `MINISTRY_AI_FORECAST` - Global ministry health forecasts
- `AI_MINISTRY_RECOMMENDATIONS` - AI-generated ministry suggestions
- `OUTREACH_OPPORTUNITIES` - Opportunity calendar data
- `ENGAGEMENT_INDICATORS` - Aggregate engagement metrics

**Update Schedule:**
- Weekly: predictFutureGiving, getMinistryForecast
- Monthly: getOutreachOpportunities, generateMinistryRecommendations

================================================================================
## ACTION 1: predictFutureGiving
================================================================================

### Purpose
Predict future giving patterns for individual members using ML-style logic.

### Request
```javascript
{
  "apiKey": "...",
  "action": "predictFutureGiving",
  "payload": {
    "memberId": "M001",
    "monthsForward": 3
  }
}
```

### Logic
1. Load member's contribution history from CONTRIBUTIONS sheet
2. Calculate frequency: Monthly count / Total months active
3. Calculate amount trend: Linear regression of last 12 months
4. Detect seasonal patterns: Compare Q1/Q2/Q3/Q4 averages
5. Identify event-based spikes: Easter, Christmas, Missions month
6. Generate prediction range: Low, Expected, High
7. Calculate decline risk: % chance of giving drop
8. Calculate consistency score: Standard deviation of amounts

### Response
```javascript
{
  "success": true,
  "data": {
    "memberId": "M001",
    "memberName": "John Doe",
    "predictions": [
      {
        "month": "March 2026",
        "predictedAmountLow": 150,
        "predictedAmountExpected": 200,
        "predictedAmountHigh": 300,
        "probability": 0.85
      },
      {
        "month": "April 2026",
        "predictedAmountLow": 150,
        "predictedAmountExpected": 200,
        "predictedAmountHigh": 300,
        "probability": 0.80
      },
      {
        "month": "May 2026",
        "predictedAmountLow": 150,
        "predictedAmountExpected": 200,
        "predictedAmountHigh": 300,
        "probability": 0.75
      }
    ],
    "declineRisk": 15,
    "consistencyScore": 85,
    "givingFrequency": "Monthly",
    "lastGiftDate": "2026-02-01",
    "lastGiftAmount": 200,
    "totalGiven": 12450,
    "insights": "High consistency giver with strong monthly pattern. Low decline risk."
  }
}
```

### Storage
Write to `AI_GIVING_PREDICTIONS` sheet:
- Columns: MemberID, FullName, Month1Predicted, Month2Predicted, Month3Predicted, 
  DeclineRisk%, ConsistencyScore, LastUpdated, Insights

### Implementation Notes
- Use simple linear regression for trend calculation
- Seasonal multiplier: Q4 (Oct-Dec) typically 1.3x average
- Event multiplier: Easter/Christmas months 1.5x average
- Decline risk formula: `100 - consistencyScore - (daysSinceLastGift / 30 * 5)`

================================================================================
## ACTION 2: getDonorJourneyIntelligence
================================================================================

### Purpose
Track member lifecycle stage and engagement momentum.

### Request
```javascript
{
  "apiKey": "...",
  "action": "getDonorJourneyIntelligence",
  "payload": {
    "memberId": "M001"
  }
}
```

### Logic
1. Load member's contribution history
2. Calculate total months active
3. Calculate average monthly giving
4. Calculate giving frequency (gifts per month)
5. Determine journey stage based on rules:
   - **New Giver**: < 3 months active OR < 3 total gifts
   - **Growing Giver**: 3-12 months active AND increasing trend
   - **Faithful Giver**: 12+ months active AND consistent (CV < 0.3)
   - **Champion Giver**: 12+ months active AND high amount (top 20%)
   - **At Risk**: Previously active but no gift in 60+ days
   - **Inactive**: No gift in 90+ days

6. Calculate engagement momentum:
   - Compare last 3 months vs previous 3 months
   - Positive = increasing, Negative = declining, Flat = stable

### Response
```javascript
{
  "success": true,
  "data": {
    "memberId": "M001",
    "memberName": "John Doe",
    "journeyStage": "Faithful Giver",
    "previousStage": "Growing Giver",
    "stageChangedDate": "2025-12-01",
    "engagementMomentum": "Positive",
    "momentumScore": 7.5,
    "monthsActive": 18,
    "totalGifts": 54,
    "averageMonthlyGiving": 200,
    "givingFrequency": "Weekly",
    "lastGiftDate": "2026-02-01",
    "insights": "Strong faithful giver showing positive momentum. Consistent weekly giving pattern."
  }
}
```

### Storage
Write to `DONOR_JOURNEY_STAGES` sheet:
- Columns: MemberID, FullName, CurrentStage, PreviousStage, StageChangedDate, 
  MomentumScore, LastUpdated

### Journey Stage Rules
```javascript
function determineJourneyStage(member) {
  const monthsActive = member.monthsActive;
  const totalGifts = member.totalGifts;
  const daysSinceLastGift = member.daysSinceLastGift;
  const givingTrend = member.givingTrend; // 'increasing', 'stable', 'declining'
  const coefficientVariation = member.cv; // Standard dev / mean
  const isTopDonor = member.percentile >= 80; // Top 20%

  if (daysSinceLastGift > 90) return 'Inactive';
  if (daysSinceLastGift > 60) return 'At Risk';
  if (monthsActive < 3 || totalGifts < 3) return 'New Giver';
  if (monthsActive >= 12 && isTopDonor) return 'Champion Giver';
  if (monthsActive >= 12 && coefficientVariation < 0.3) return 'Faithful Giver';
  if (monthsActive >= 3 && givingTrend === 'increasing') return 'Growing Giver';
  return 'Faithful Giver'; // Default
}
```

================================================================================
## ACTION 3: getMinistryForecast
================================================================================

### Purpose
Global church sustainability and momentum analysis.

### Request
```javascript
{
  "apiKey": "...",
  "action": "getMinistryForecast"
}
```

### Logic
1. Load last 12 months of dashboard data (giving, expenses, members)
2. Calculate 3-month trend: Linear regression of last 3 months
3. Calculate 6-month projection: Extend trend forward
4. Calculate sustainability score:
   - Income/Expense ratio (target: > 1.1)
   - Active giver growth rate (target: > 0%)
   - Giving volatility (target: CV < 0.2)
   - Cash flow runway (months of expenses in reserve)

5. Calculate risk factors:
   - Rapid giving decline (> 10% drop month-over-month)
   - Top donor concentration (single donor > 20% of total)
   - Expense growth exceeding income growth
   - Declining active giver count

### Response
```javascript
{
  "success": true,
  "data": {
    "threeMonthScore": "85/100",
    "sixMonthRisk": "Low",
    "growthMomentum": "Positive",
    "trend": "up",
    "sustainabilityMetrics": {
      "incomeExpenseRatio": 1.15,
      "activeGiverGrowth": 3.2,
      "givingVolatility": 0.18,
      "cashFlowRunway": 4.5
    },
    "projections": {
      "nextMonthGiving": 15200,
      "threeMonthGiving": 45600,
      "sixMonthGiving": 91200
    },
    "riskFactors": [],
    "insights": "Strong financial health with positive growth momentum. Income exceeds expenses by 15%. Active giver count growing at 3.2% monthly."
  }
}
```

### Storage
Write to `MINISTRY_AI_FORECAST` sheet:
- Columns: ForecastDate, ThreeMonthScore, SixMonthRisk, GrowthMomentum, 
  IncomeExpenseRatio, ActiveGiverGrowth%, CashFlowRunway, Insights

================================================================================
## ACTION 4: getOutreachOpportunities
================================================================================

### Purpose
Detect optimal timing for special offerings and campaigns.

### Request
```javascript
{
  "apiKey": "...",
  "action": "getOutreachOpportunities"
}
```

### Logic
1. Analyze historical giving cycles:
   - Highest giving months (typically Oct-Dec, Easter)
   - Lowest giving months (typically Jan-Feb, Summer)
   - Mission offering months (typically Oct)

2. Calculate opportunity score per month (0-100):
   - Base on historical performance (40%)
   - Factor in seasonal faith events (30%)
   - Consider giving momentum trend (20%)
   - Account for economic calendar (10%)

3. Generate opportunity types:
   - **Special Offering**: High giving months + strong momentum
   - **Mission Push**: October + positive trend
   - **Community Event**: Spring/Fall + member growth
   - **Fundraising Campaign**: High engagement + low recent asks

### Response
```javascript
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "month": "October 2026",
        "type": "Mission Push",
        "score": 92,
        "description": "Optimal timing for annual mission offering",
        "reasoning": "Historical high month (avg 130% of baseline) + strong giving momentum + mission focus tradition",
        "suggestedGoal": 18000,
        "confidence": "High"
      },
      {
        "month": "December 2026",
        "type": "Special Offering",
        "score": 88,
        "description": "Year-end giving opportunity",
        "reasoning": "Tax benefit timing + Christmas season generosity + historically highest month",
        "suggestedGoal": 20000,
        "confidence": "High"
      },
      {
        "month": "April 2026",
        "type": "Community Event",
        "score": 75,
        "description": "Easter outreach campaign",
        "reasoning": "Easter season + spring momentum + new member growth",
        "suggestedGoal": 12000,
        "confidence": "Medium"
      }
    ]
  }
}
```

### Storage
Write to `OUTREACH_OPPORTUNITIES` sheet:
- Columns: OpportunityMonth, Type, Score, Description, Reasoning, SuggestedGoal, 
  Confidence, CreatedDate

================================================================================
## ACTION 5: generateMinistryRecommendations
================================================================================

### Purpose
AI-generated ministry strategy suggestions based on data trends.

### Request
```javascript
{
  "apiKey": "...",
  "action": "generateMinistryRecommendations"
}
```

### Logic
1. Analyze current trends:
   - Giving trend (up, down, stable)
   - Member engagement (increasing, declining)
   - Expense patterns
   - Ministry activity levels

2. Apply recommendation rules:
   - **IF** giving down 10%+ → "Suggest testimony Sunday"
   - **IF** mission giving up → "Suggest mission focus month"
   - **IF** youth engagement high → "Suggest youth fund campaign"
   - **IF** at-risk givers > 15% → "Launch re-engagement campaign"
   - **IF** new givers > 10% → "Create new member welcome series"
   - **IF** expenses > income → "Review budget priorities"

3. Prioritize recommendations:
   - **High**: Financial risk items
   - **Medium**: Growth opportunities
   - **Low**: Optimization suggestions

### Response
```javascript
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "title": "Launch Re-Engagement Campaign",
        "description": "18% of previously active givers are now at-risk (60+ days since last gift). Targeted outreach could re-activate 30-40% of this group.",
        "priority": "High",
        "category": "Retention",
        "suggestedActions": [
          "Send personal thank-you notes from pastor",
          "Schedule coffee meetings with at-risk members",
          "Share impact stories of recent ministry wins"
        ],
        "expectedImpact": "Potential $3,500-5,000 monthly giving recovery",
        "timeframe": "2-4 weeks"
      },
      {
        "title": "Mission Focus Month",
        "description": "Mission giving is up 25% this quarter. Member engagement with missions content is high. This is an optimal time for a focused campaign.",
        "priority": "Medium",
        "category": "Growth",
        "suggestedActions": [
          "Share missionary testimonies in service",
          "Create mission story video series",
          "Set stretch goal for October mission offering"
        ],
        "expectedImpact": "Potential 30-50% increase in mission giving",
        "timeframe": "Next 60 days"
      },
      {
        "title": "Budget Review Meeting",
        "description": "Expenses have grown 8% while giving is flat. Current runway is 4.5 months, down from 6 months last quarter.",
        "priority": "High",
        "category": "Financial Health",
        "suggestedActions": [
          "Review discretionary spending categories",
          "Identify cost-saving opportunities",
          "Present updated budget to leadership"
        ],
        "expectedImpact": "Extend cash runway to 6+ months",
        "timeframe": "Next 30 days"
      }
    ]
  }
}
```

### Storage
Write to `AI_MINISTRY_RECOMMENDATIONS` sheet:
- Columns: RecommendationID, Title, Description, Priority, Category, 
  ExpectedImpact, Timeframe, CreatedDate, Status (New/InProgress/Completed)

================================================================================
## ACTION 6: getFinancialRiskAlerts
================================================================================

### Purpose
Early warning system for financial risks.

### Request
```javascript
{
  "apiKey": "...",
  "action": "getFinancialRiskAlerts"
}
```

### Logic
1. Detect rapid giving drops:
   - Compare last month vs 3-month average
   - Threshold: > 15% decline = YELLOW, > 25% = RED

2. Detect top donor silence:
   - Identify top 10% of givers by amount
   - Check days since last gift
   - Threshold: > 45 days = YELLOW, > 60 days = RED

3. Detect expense spikes:
   - Compare last month expenses vs 3-month average
   - Threshold: > 20% increase = YELLOW, > 35% = RED

4. Detect cash flow compression:
   - Calculate months of expenses in reserve
   - Threshold: < 3 months = YELLOW, < 2 months = RED

5. Calculate overall risk level:
   - GREEN: No alerts
   - YELLOW: 1-2 yellow alerts OR 1 red alert
   - RED: 2+ red alerts

### Response
```javascript
{
  "success": true,
  "data": {
    "level": "YELLOW",
    "narrative": "Moderate financial risk detected. Two top donors have not given in 50+ days. Current giving is 12% below 3-month average. Cash flow runway is healthy at 4.5 months.",
    "alerts": [
      {
        "type": "Top Donor Silence",
        "severity": "YELLOW",
        "description": "Donor M042 (avg $850/month) has not given in 52 days",
        "suggestedAction": "Personal outreach from pastor or finance team"
      },
      {
        "type": "Giving Decline",
        "severity": "YELLOW",
        "description": "February giving ($13,200) is 12% below 3-month average ($15,000)",
        "suggestedAction": "Review attendance data and member engagement metrics"
      }
    ],
    "metrics": {
      "currentMonthGiving": 13200,
      "threeMonthAverage": 15000,
      "declinePercentage": 12,
      "cashFlowRunway": 4.5,
      "topDonorsSilent": 2,
      "expenseGrowth": 3
    }
  }
}
```

### Storage
Write to `FINANCIAL_RISK_ALERTS` sheet:
- Columns: AlertDate, RiskLevel, Narrative, AlertCount, Metrics (JSON), 
  Resolved (TRUE/FALSE), ResolvedDate

================================================================================
## ACTION 7: getEngagementIndicators
================================================================================

### Purpose
Ethical aggregate engagement signals (no personal spiritual judgement).

### Request
```javascript
{
  "apiKey": "...",
  "action": "getEngagementIndicators"
}
```

### Logic
1. Calculate attendance participation rate:
   - Average giving frequency as proxy
   - Formula: (Members giving monthly / Total active members) * 100

2. Calculate volunteer activity frequency:
   - IF AVAILABLE: Track volunteer hours/events
   - FALLBACK: Use giving consistency as engagement proxy

3. Calculate giving consistency:
   - Coefficient of variation of giving amounts
   - Low CV (<0.3) = High consistency

4. Calculate engagement stability index (0-100):
   - 40% from giving consistency
   - 30% from active giver percentage
   - 30% from member retention rate

5. Determine trend:
   - Compare last 3 months vs previous 3 months
   - Increasing = "up", Stable = "stable", Declining = "down"

### Response
```javascript
{
  "success": true,
  "data": {
    "stabilityIndex": "82/100",
    "trend": "up",
    "attendanceRate": "78%",
    "volunteerFrequency": "Medium",
    "givingConsistency": "85/100",
    "metrics": {
      "activeGiverPercentage": 68,
      "memberRetentionRate": 94,
      "givingCoeffVariation": 0.22,
      "averageGivingFrequency": "Monthly"
    },
    "insights": "High engagement stability with positive trend. 68% of members are active givers. Strong retention rate of 94%. Giving patterns show high consistency."
  }
}
```

### Storage
Write to `ENGAGEMENT_INDICATORS` sheet:
- Columns: CalculationDate, StabilityIndex, Trend, ActiveGiverPct, 
  RetentionRate%, ConsistencyScore, Insights

### Ethical Constraints
- **NEVER** score individual spiritual maturity
- **NEVER** make personal spiritual conclusions
- **ALWAYS** use aggregate data only
- **ALWAYS** focus on stewardship patterns, not faith levels
- **NEVER** use for pressure tactics or judgement

================================================================================
## SCHEDULED AUTOMATION
================================================================================

### Weekly Jobs (Run Every Monday 2 AM)
1. **Update Giving Predictions**
   - Action: `predictFutureGiving` for all active members
   - Store results in `AI_GIVING_PREDICTIONS` sheet
   - Clear old predictions (> 90 days)

2. **Update Ministry Forecast**
   - Action: `getMinistryForecast`
   - Store results in `MINISTRY_AI_FORECAST` sheet
   - Archive weekly snapshots

3. **Update Financial Risk Alerts**
   - Action: `getFinancialRiskAlerts`
   - Store results in `FINANCIAL_RISK_ALERTS` sheet
   - Email alerts if risk level is YELLOW or RED

### Monthly Jobs (Run 1st of Month 2 AM)
1. **Update Outreach Opportunities**
   - Action: `getOutreachOpportunities`
   - Store results in `OUTREACH_OPPORTUNITIES` sheet
   - Generate next 6 months of opportunities

2. **Generate Ministry Recommendations**
   - Action: `generateMinistryRecommendations`
   - Store results in `AI_MINISTRY_RECOMMENDATIONS` sheet
   - Mark old recommendations as expired

3. **Update Donor Journey Stages**
   - Action: `getDonorJourneyIntelligence` for all members
   - Store results in `DONOR_JOURNEY_STAGES` sheet
   - Track stage transitions

4. **Executive AI Report Snapshot**
   - Compile all AI metrics into single report
   - Store in `AI_EXECUTIVE_SNAPSHOTS` sheet
   - Email to leadership team

### Time Trigger Setup (Google Apps Script)
```javascript
function createScheduledTriggers() {
  // Clear existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Weekly Monday 2 AM
  ScriptApp.newTrigger('runWeeklyAIUpdates')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();
  
  // Monthly 1st at 2 AM
  ScriptApp.newTrigger('runMonthlyAIUpdates')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
}

function runWeeklyAIUpdates() {
  updateGivingPredictions();
  updateMinistryForecast();
  updateFinancialRiskAlerts();
}

function runMonthlyAIUpdates() {
  updateOutreachOpportunities();
  generateMinistryRecommendations();
  updateDonorJourneyStages();
  generateExecutiveSnapshot();
}
```

================================================================================
## DATA ETHICS GUARDRAILS
================================================================================

### Prohibited Actions
❌ NEVER score individual faith or spiritual maturity
❌ NEVER make personal spiritual conclusions
❌ NEVER use data for pressure tactics
❌ NEVER auto-send fundraising messages
❌ NEVER auto-email members based on AI
❌ NEVER auto-modify financial data
❌ NEVER auto-make financial decisions

### Required Actions
✅ ALWAYS use data for stewardship planning
✅ ALWAYS use data for ministry strategy
✅ ALWAYS use data for financial sustainability
✅ ALWAYS keep AI advisory only (never automated actions)
✅ ALWAYS aggregate data for privacy
✅ ALWAYS provide human oversight for recommendations
✅ ALWAYS allow members to opt-out of tracking

### Implementation Safeguards
```javascript
// Add to all AI action handlers
function validateEthicalConstraints(action, data) {
  const prohibitedPatterns = [
    'spiritualScore',
    'faithLevel',
    'pressureTarget',
    'autoEmail',
    'autoModify'
  ];
  
  const dataStr = JSON.stringify(data);
  const violations = prohibitedPatterns.filter(p => dataStr.includes(p));
  
  if (violations.length > 0) {
    throw new Error(`Ethical constraint violation: ${violations.join(', ')}`);
  }
  
  return true;
}
```

================================================================================
## TESTING CHECKLIST
================================================================================

### Test 1: Prediction Accuracy
- [ ] Run `predictFutureGiving` for 10 sample members
- [ ] Compare predictions vs actual giving next month
- [ ] Calculate prediction error percentage
- [ ] Target: Within 20% of actual for 70%+ of predictions

### Test 2: Journey Stage Transitions
- [ ] Add new member, verify "New Giver" stage
- [ ] Simulate 3 months of gifts, verify "Growing Giver"
- [ ] Simulate 12 months consistent gifts, verify "Faithful Giver"
- [ ] Simulate 60 day gap, verify "At Risk"

### Test 3: Ministry Forecast Updates
- [ ] Add contribution data for new month
- [ ] Run `getMinistryForecast`
- [ ] Verify 3-month score updates
- [ ] Verify insights reflect new data

### Test 4: AI Recommendations Adapt
- [ ] Simulate giving drop (remove recent contributions)
- [ ] Run `generateMinistryRecommendations`
- [ ] Verify "Re-engagement campaign" appears
- [ ] Verify priority is HIGH

### Test 5: Risk Alerts Trigger
- [ ] Remove contributions from top donor for 60 days
- [ ] Run `getFinancialRiskAlerts`
- [ ] Verify risk level changes to YELLOW or RED
- [ ] Verify alert appears with correct severity

================================================================================
## SUCCESS CRITERIA — PHASE 4 COMPLETE
================================================================================

✅ Predictive Giving Engine Active
✅ Donor Journey Intelligence Active
✅ Ministry Forecast Engine Running
✅ AI Ministry Recommendations Generated Weekly
✅ Executive Dashboard Live
✅ Ethical Data Guardrails Active
✅ No PII Risk Exposure
✅ Fully Automated AI Insight Pipeline
✅ Time-driven triggers configured
✅ All 7 backend actions implemented
✅ All sheets created with proper structure
✅ Frontend hooks integrated and tested
✅ Pastoral Intelligence dashboard accessible via /pastoral-intelligence

================================================================================
## SUPPORT & MAINTENANCE
================================================================================

### Weekly Monitoring
- Check scheduled trigger execution logs
- Verify AI predictions updating correctly
- Review risk alert emails
- Monitor executive dashboard load times

### Monthly Review
- Audit prediction accuracy vs actuals
- Review recommendation acceptance rate
- Update AI logic based on feedback
- Archive old predictions (> 90 days)

### Quarterly Optimization
- Retrain prediction models with new data
- Adjust opportunity score weights
- Update seasonal multipliers
- Refine journey stage thresholds

================================================================================
END OF PHASE 4 BACKEND SPECIFICATION
================================================================================
