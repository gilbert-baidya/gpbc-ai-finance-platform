# PHASE 6 BACKEND SPECIFICATION
## Global Kingdom Intelligence Network - Multi-Church + Grant + Global Mission AI

**Version:** 6.0  
**Target Maturity:** 9.9/10 (Global Kingdom Intelligence)  
**Critical Principle:** EACH CHURCH OWNS ITS DATA - Only Aggregated + Anonymous Intelligence Is Shared Network-Wide

---

## TABLE OF CONTENTS
1. [Overview](#overview)
2. [Multi-Tenant Data Security Model](#multi-tenant-data-security-model)
3. [Backend Actions](#backend-actions)
4. [Sheet Structures](#sheet-structures)
5. [Network Automation Scheduler](#network-automation-scheduler)
6. [Ethical Constraints & Kingdom Governance](#ethical-constraints)
7. [Testing Guide](#testing-guide)

---

## OVERVIEW

Phase 6 transforms the platform from a single-church autonomous intelligence system into a **Global Kingdom Intelligence Network**, enabling cross-church intelligence sharing, grant discovery, global mission forecasting, and kingdom-level strategic insights while maintaining **absolute data privacy per church**.

### Key Differences from Phase 5
- **Phase 5:** Single-church operational optimization (financial flow, ministry allocation, volunteer deployment)
- **Phase 6:** Multi-church network intelligence (global trends, grant matching, mission forecasting, crisis coordination)

### Architecture
- **Frontend:** 10 new React hooks in `usePhase6GlobalIntelligence.js`, 2 new pages (Kingdom Intelligence, Grant Opportunities)
- **Backend:** 10+ new Google Apps Script actions (this specification)
- **Storage:** 8 new global/network sheets + multi-tenant isolation layer
- **Security:** Church-level tenant validation, encryption keys, audit logging

### Core Capabilities
1. **Multi-Church Intelligence Aggregation** - Anonymous network-wide trends
2. **Global Giving Trend Intelligence** - Quarterly forecasting across churches
3. **Grant Opportunity Intelligence** - AI-powered grant matching & discovery
4. **Mission Field Impact Forecast** - Global mission investment ROI analysis
5. **Kingdom Health Dashboard** - Network-wide performance metrics
6. **Ministry Success Pattern Learning** - Cross-church best practices
7. **Crisis/Disaster Response Coordination** - Network resource allocation
8. **Global Prayer + Need Intelligence Map** - Anonymous prayer needs tracking (ethical)
9. **Secure Multi-Tenant Data Isolation** - ChurchID-based access control

---

## MULTI-TENANT DATA SECURITY MODEL

### Critical Security Principle
**ABSOLUTE DATA ISOLATION:** No church can access another church's member data, donor identities, or contribution details. Only anonymous aggregated intelligence is shared network-wide.

### Tenant Validation Architecture

**validateChurchTenantAccess()**
```javascript
function validateChurchTenantAccess(requestingTenantId, action, requestedData) {
  // 1. Verify tenantId exists
  const tenantSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TENANTS');
  const tenants = tenantSheet.getDataRange().getValues();
  const tenant = tenants.find(row => row[1] === requestingTenantId && row[5] === 'Active');
  
  if (!tenant) {
    throw new Error('Invalid or inactive tenant ID');
  }
  
  // 2. Validate action permissions
  const allowedGlobalActions = [
    'GlobalChurchAggregationEngine',
    'getGlobalGivingTrend',
    'MinistryPatternLearningAI',
    'GlobalPrayerNeedsMap'
  ];
  
  const tenantScopedActions = [
    'GrantDiscoveryAI',
    'MissionImpactForecastAI',
    'CrisisResponseCoordinationAI',
    'getNetworkChurchBenchmarks'
  ];
  
  // Global actions don't require tenant-specific data access
  if (allowedGlobalActions.includes(action)) {
    return { allowed: true, scope: 'global' };
  }
  
  // Tenant-scoped actions require validation
  if (tenantScopedActions.includes(action)) {
    return { allowed: true, scope: 'tenant', tenantId: requestingTenantId };
  }
  
  // Unknown action
  throw new Error('Unauthorized action');
}
```

### Data Anonymization Rules

**anonymizeChurchData()**
```javascript
function anonymizeChurchData(churchData) {
  return {
    // ALLOWED - Aggregated metrics
    totalChurches: churchData.length,
    avgAttendance: calculateAverage(churchData.map(c => c.attendance)),
    totalGiving: churchData.reduce((sum, c) => sum + c.totalGiving, 0),
    avgGrowthRate: calculateAverage(churchData.map(c => c.growthRate)),
    regionalBreakdown: groupByRegion(churchData),
    
    // BLOCKED - Individual church identifiers
    // churchNames: REMOVED
    // memberLists: REMOVED
    // donorIdentities: REMOVED
    // contributionDetails: REMOVED
    // contactInfo: REMOVED
  };
}
```

### Audit Logging
Every cross-church data access is logged:

**TENANT_ACCESS_LOG Sheet**
```
| Timestamp | TenantID | Action | DataAccessed | Success | ErrorMessage |
| 2026-02-05 20:30:15 | GPBC001 | GlobalChurchAggregationEngine | Anonymous network trends | TRUE | |
| 2026-02-05 20:32:40 | GPBC001 | GrantDiscoveryAI | Grant opportunities for GPBC001 | TRUE | |
```

---

## BACKEND ACTIONS

### 1. GlobalChurchAggregationEngine
**Purpose:** Analyze anonymous monthly giving totals, attendance trends, ministry growth signals across entire church network. Returns regional church health trends, giving seasonality intelligence, ministry growth benchmarks WITHOUT revealing individual church identities.

**Request Schema:**
```javascript
{
  "action": "GlobalChurchAggregationEngine",
  "params": {
    // NO tenantId required - this is global aggregated data
    "includeRegionalBreakdown": true,
    "analysisMonths": 12
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "networkHealthScore": 78,      // 0-100 (Overall network health)
    "totalChurches": 142,           // Churches contributing to network
    "avgAttendance": 185,
    "networkGrowthRate": 6.3,       // % growth across network
    "totalNetworkGiving": 18500000, // Aggregated (anonymous)
    "regionalBreakdown": [
      {
        "region": "West Coast",
        "churchCount": 45,
        "avgAttendance": 210,
        "growthRate": 8.2,
        "givingStabilityIndex": 82
      },
      {
        "region": "Midwest",
        "churchCount": 38,
        "avgAttendance": 165,
        "growthRate": 4.5,
        "givingStabilityIndex": 75
      }
      // ... additional regions
    ],
    "seasonalityPatterns": {
      "strongMonths": ["December", "March", "September"],
      "weakMonths": ["January", "July", "August"],
      "avgVariance": 18.5  // % variance from mean
    },
    "insights": [
      "Network-wide giving up 6.3% YoY",
      "West Coast churches showing strongest growth (8.2%)",
      "Summer months consistently -15% below annual average"
    ]
  }
}
```

**Business Logic:**
1. **Network Health Score Calculation (0-100):**
   - Average church growth rate: 40 points (6%+ = 40 points, 3-6% = 30 points, <3% = 10-20 points)
   - Giving stability across network: 30 points (low volatility = high score)
   - Regional diversity: 20 points (balanced growth across regions)
   - New church additions: 10 points (network expansion)

2. **Anonymization Process:**
   - Query all active churches from TENANTS sheet
   - Aggregate monthly giving totals per church (NO individual donor data)
   - Calculate regional averages and percentiles
   - NEVER return church names, locations, or identifying information
   - ONLY return aggregated statistics and benchmark ranges

3. **Regional Breakdown Algorithm:**
   ```javascript
   // Group churches by region (defined in TENANTS sheet)
   const regions = {};
   churches.forEach(church => {
     if (!regions[church.region]) {
       regions[church.region] = { churches: [], giving: [], attendance: [] };
     }
     regions[church.region].churches.push(church.id);
     regions[church.region].giving.push(church.totalGiving);
     regions[church.region].attendance.push(church.avgAttendance);
   });
   
   // Calculate anonymous regional metrics
   return Object.keys(regions).map(region => ({
     region: region,
     churchCount: regions[region].churches.length,
     avgAttendance: calculateAverage(regions[region].attendance),
     growthRate: calculateGrowthRate(regions[region].giving),
     givingStabilityIndex: calculateStability(regions[region].giving)
   }));
   ```

**Sheet Structure:** GLOBAL_CHURCH_AGGREGATE
```
| Timestamp | NetworkHealthScore | TotalChurches | AvgAttendance | NetworkGrowthRate | TotalNetworkGiving | RegionalBreakdownJSON | SeasonalityJSON | InsightsJSON |
```

---

### 2. getGlobalGivingTrend
**Purpose:** Analyze multi-church monthly totals, economic indicators, seasonal faith calendar. Returns next quarter global giving projection, regional faith economy trends, seasonal giving pattern intelligence.

**Request Schema:**
```javascript
{
  "action": "getGlobalGivingTrend",
  "params": {
    "forecastQuarters": 2,
    "includeEconomicIndicators": true,
    "includeSeasonalPatterns": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "stabilityIndex": 76,           // 0-100 (Giving consistency across network)
    "nextQuarterForecast": 4850000, // Aggregated projection
    "growthTrend": "Moderate Growth", // "Strong Growth" | "Moderate Growth" | "Stable" | "Declining"
    "seasonalPatterns": [
      {
        "season": "Spring (Mar-May)",
        "variance": -8,              // % below annual average
        "confidence": 85
      },
      {
        "season": "Summer (Jun-Aug)",
        "variance": -15,
        "confidence": 88
      },
      {
        "season": "Fall (Sep-Nov)",
        "variance": +5,
        "confidence": 82
      },
      {
        "season": "Winter (Dec-Feb)",
        "variance": +22,
        "confidence": 90
      }
    ],
    "economicFactors": [
      {
        "indicator": "Unemployment Rate",
        "trend": "Decreasing",
        "impactOnGiving": "Positive"
      },
      {
        "indicator": "Consumer Confidence",
        "trend": "Increasing",
        "impactOnGiving": "Positive"
      }
    ],
    "recommendations": [
      "Plan for strong Q4 (winter) giving season",
      "Budget conservatively for summer months (-15% expected)",
      "Economic indicators suggest favorable giving environment"
    ]
  }
}
```

**Business Logic:**
1. **Forecasting Model:**
   - Analyze 24 months of historical network-wide giving data
   - Apply seasonal adjustment factors (Dec +30%, Jan -20%, etc.)
   - Factor in economic indicators (optional - if available)
   - Use exponential smoothing for trend projection

2. **Stability Index Calculation:**
   ```javascript
   stabilityIndex = 100 - (standardDeviation / mean * 100)
   // Higher index = more predictable giving patterns
   // >80 = Very Stable
   // 60-80 = Stable
   // <60 = Volatile
   ```

3. **Seasonal Pattern Detection:**
   - Calculate monthly averages for past 3 years
   - Identify high/low months consistently
   - Calculate variance from annual mean
   - Provide confidence scores based on consistency

**Sheet Structure:** GLOBAL_GIVING_FORECAST
```
| Timestamp | StabilityIndex | NextQuarterForecast | GrowthTrend | SeasonalPatternsJSON | EconomicFactorsJSON | RecommendationsJSON |
```

---

### 3. GrantDiscoveryAI
**Purpose:** Analyze church size, ministry focus areas, community demographics, prior grant success data, program types. Returns top matching grants, grant success probability score, suggested application windows, auto-draft grant budget templates.

**Request Schema:**
```javascript
{
  "action": "GrantDiscoveryAI",
  "params": {
    "tenantId": "GPBC001",  // Required - tenant-scoped action
    "topMatches": 10,
    "includeSuccessProbability": true,
    "includeDraftTemplates": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "totalPotentialFunding": 485000,
    "avgSuccessProbability": 62,
    "topMatches": [
      {
        "grantId": "GRANT-2026-0142",
        "grantName": "Faith-Based Community Food Program Grant",
        "grantOrganization": "State Department of Social Services",
        "maxAmount": 50000,
        "applicationDeadline": "2026-04-30",
        "daysUntilDeadline": 84,
        "category": "food",           // "food" | "education" | "outreach" | "security" | "youth" | "facility"
        "matchScore": 87,             // 0-100 (How well church matches grant criteria)
        "successProbability": 72,     // 0-100 (Likelihood of approval based on history)
        "isNew": true,                // New grant discovered this week
        "description": "Supports faith-based organizations providing food assistance to underserved communities. Grants range from $25,000 to $50,000 for program operations, equipment, and staff costs.",
        "matchReasons": [
          "Church currently operates food pantry serving 150+ families monthly",
          "Located in qualifying low-income census tract",
          "Strong track record: successfully completed 2 prior grants",
          "Program aligns with grant priority areas (hunger relief, community impact)"
        ],
        "eligibilityCriteria": [
          "501(c)(3) nonprofit organization",
          "Operating food assistance program for 12+ months",
          "Serve minimum 100 households per month",
          "Located in priority service area"
        ],
        "requiredDocuments": [
          "IRS 501(c)(3) determination letter",
          "Audited financial statements (most recent fiscal year)",
          "Program budget and narrative",
          "Letters of support from community partners"
        ],
        "grantWebsite": "https://example.gov/grants/food-program"
      },
      {
        "grantId": "GRANT-2026-0098",
        "grantName": "Youth Ministry Expansion Grant",
        "grantOrganization": "National Youth Ministry Foundation",
        "maxAmount": 25000,
        "applicationDeadline": "2026-06-15",
        "daysUntilDeadline": 130,
        "category": "youth",
        "matchScore": 81,
        "successProbability": 68,
        "isNew": false,
        "description": "Funds youth ministry programs targeting ages 13-18. Focus on mentorship, discipleship, and community engagement activities."
      }
      // ... additional grants (up to 10)
    ]
  }
}
```

**Business Logic:**
1. **Grant Matching Algorithm:**
   - Query GRANT_OPPORTUNITIES database (external or pre-loaded)
   - Extract church profile from TENANTS + ministry activity data
   - Score each grant based on:
     * Church size match (30 points)
     * Ministry focus alignment (25 points)
     * Geographic eligibility (20 points)
     * Prior grant success history (15 points)
     * Program maturity/track record (10 points)

2. **Success Probability Calculation:**
   ```javascript
   successProbability = (
     (matchScore * 0.40) +
     (priorGrantSuccessRate * 0.30) +
     (programMaturityYears / 5 * 100 * 0.20) +
     (financialHealthScore * 0.10)
   );
   
   // Factors:
   // - High match score = better fit
   // - Prior grant success = proven capability
   // - Program maturity = stability & experience
   // - Financial health = organizational capacity
   ```

3. **Grant Discovery Sources:**
   - Government grant databases (Grants.gov, state/local portals)
   - Foundation directories (GrantWatch, Foundation Center)
   - Denomination-specific grants
   - Community foundation opportunities
   - Corporate giving programs

4. **Auto-Draft Budget Template (generated when requested):**
   ```javascript
   function generateGrantBudgetTemplate(grant, churchProfile) {
     return {
       personnel: calculatePersonnelCosts(churchProfile.programStaff),
       equipment: estimateEquipmentNeeds(grant.category),
       supplies: estimateSupplyCosts(churchProfile.programSize),
       facilities: calculateFacilityCosts(churchProfile.facilityRental),
       indirect: calculateIndirectCosts(grant.indirectRate || 0.10)
     };
   }
   ```

**Sheet Structure:** GLOBAL_GRANT_INTELLIGENCE
```
| Timestamp | TenantID | TotalPotentialFunding | TopMatchesJSON | GrantDiscoverySourcesJSON |
```

**External Database:** GRANT_OPPORTUNITIES
```
| GrantID | GrantName | GrantOrganization | MaxAmount | Deadline | Category | EligibilityCriteriaJSON | RequiredDocsJSON | Website |
```

---

### 4. MissionImpactForecastAI
**Purpose:** Analyze mission investment history, mission region growth data, conversion/engagement signals, local partner church growth metrics. Returns mission investment ROI forecast, high impact mission regions, mission risk alerts, recommended mission expansion zones.

**Request Schema:**
```javascript
{
  "action": "MissionImpactForecastAI",
  "params": {
    "tenantId": "GPBC001",
    "forecastMonths": 12,
    "includeRiskAnalysis": true,
    "includeExpansionRecommendations": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "globalImpactScore": 82,        // 0-100 (Overall mission effectiveness)
    "activeMissionRegions": 8,
    "missionROI": 3.2,              // Return on mission investment (spiritual + financial)
    "totalMissionInvestment": 125000, // Annual mission budget
    "highImpactRegions": [
      {
        "region": "Southeast Asia - Philippines",
        "impactScore": 92,          // 0-100
        "growthRate": 18.5,         // % annual growth
        "partnerChurches": 12,
        "totalReached": 4500,       // People reached through mission work
        "conversionRate": 8.3,      // % of reached who joined church
        "costPerConversion": 180,   // Mission investment / conversions
        "sustainability": "High",    // "High" | "Medium" | "Low"
        "riskLevel": "Low"
      },
      {
        "region": "East Africa - Kenya",
        "impactScore": 87,
        "growthRate": 22.1,
        "partnerChurches": 8,
        "totalReached": 3200,
        "conversionRate": 12.1,
        "costPerConversion": 145,
        "sustainability": "High",
        "riskLevel": "Medium"
      }
      // ... additional regions
    ],
    "expansionRecommendations": [
      "Increase investment in East Africa region (highest ROI: $145/conversion)",
      "Launch new partnership in Indonesia (growing Christian movement, 15+ churches requesting partnership)",
      "Scale Philippines ministry from 12 to 18 partner churches (proven model, high sustainability)"
    ],
    "riskAlerts": [
      {
        "region": "Middle East - Jordan",
        "severity": "High",
        "riskType": "Political Instability",
        "description": "Recent regional tensions may impact mission operations and partner church safety",
        "recommendation": "Maintain current support level but pause expansion plans. Increase emergency fund allocation."
      }
    ],
    "forecastedImpact": {
      "next12Months": {
        "projectedReached": 52000,
        "projectedConversions": 4800,
        "projectedPartnerChurches": 95,
        "confidence": 78
      }
    }
  }
}
```

**Business Logic:**
1. **Impact Score Calculation (0-100):**
   - Conversion rate: 35 points (higher rate = higher score)
   - Cost-effectiveness: 25 points (lower cost per conversion = higher score)
   - Partner church growth: 20 points
   - Sustainability/local ownership: 15 points
   - Risk level (inverse): 5 points (lower risk = higher score)

2. **ROI Calculation:**
   ```javascript
   missionROI = (
     (totalConversions * spiritualImpactValue) +
     (partnerChurchesPlanted * churchPlantValue) +
     (discipleshipPrograms * discipleshipValue)
   ) / totalMissionInvestment;
   
   // Values:
   // spiritualImpactValue = $500 (estimated long-term kingdom value per conversion)
   // churchPlantValue = $5000 (estimated value of new partner church)
   // discipleshipValue = $200 (estimated value per disciple trained)
   ```

3. **Expansion Recommendation Algorithm:**
   - Identify regions with:
     * Impact score >75
     * Growth rate >10%
     * Low risk level
     * Partner church requests pending
   - Prioritize by cost-effectiveness and scalability
   - Never recommend expansion into high-risk regions without explicit church approval

**Sheet Structure:** GLOBAL_MISSION_FORECAST
```
| Timestamp | TenantID | GlobalImpactScore | ActiveMissionRegions | MissionROI | HighImpactRegionsJSON | ExpansionRecJSON | RiskAlertsJSON |
```

---

### 5. MinistryPatternLearningAI
**Purpose:** Analyze anonymous ministry performance data, event impact data, outreach conversion trends, volunteer sustainability patterns across church network. Returns top performing ministry models globally, emerging ministry trends, declining ministry early warnings.

**Request Schema:**
```javascript
{
  "action": "MinistryPatternLearningAI",
  "params": {
    // NO tenantId required - this is global anonymous pattern learning
    "analysisMonths": 12,
    "includeEmergingTrends": true,
    "includeDeclineWarnings": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "topPerformingModels": [
      {
        "ministryType": "Youth Small Groups (Age 13-18)",
        "successRate": 87,          // % of churches reporting growth
        "avgGrowth": 24.5,          // Average participation growth %
        "churchCount": 68,          // Churches using this model
        "keySuccessFactors": [
          "Weekly meeting schedule",
          "Peer-led leadership model (ages 16-18)",
          "Parent engagement component",
          "Social events integrated monthly"
        ],
        "avgCostPerParticipant": 35,
        "avgVolunteerLoad": "Medium", // "Low" | "Medium" | "High"
        "recommendedChurchSize": "100-300 attendance"
      },
      {
        "ministryType": "Community Food Pantry",
        "successRate": 82,
        "avgGrowth": 18.2,
        "churchCount": 94,
        "keySuccessFactors": [
          "Monthly distribution (not weekly - reduces burnout)",
          "Partner with local food bank",
          "Volunteer rotation system",
          "Prayer + resource connection offered"
        ],
        "avgCostPerParticipant": 12,
        "avgVolunteerLoad": "High",
        "recommendedChurchSize": "75+ attendance"
      }
      // ... additional models
    ],
    "emergingTrends": [
      "Digital-first youth outreach showing 3x engagement vs traditional methods",
      "Hybrid worship (in-person + online) sustaining 15% higher attendance post-pandemic",
      "Mental health support groups growing 40% YoY across network",
      "Men's ministry participation increasing 22% (reversing 5-year decline)",
      "Multi-generational worship events showing high retention rates"
    ],
    "decliningPatterns": [
      {
        "ministryType": "Midweek Evening Services",
        "declineRate": -28,         // % decline in participation
        "churchesDiscontinuing": 34,
        "causes": [
          "Competing family schedules (youth sports, activities)",
          "Work schedule conflicts",
          "Preference for weekend-only commitment"
        ],
        "recommendation": "Consider replacing with monthly special events or small group model"
      }
    ]
  }
}
```

**Business Logic:**
1. **Pattern Learning Algorithm:**
   - Query all churches' ministry activity data (anonymized)
   - Group by ministry type/category
   - Calculate success metrics:
     * Participation growth rate
     * Sustainability (>12 months operation)
     * Volunteer retention
     * Cost-effectiveness
   - Identify common characteristics of high-performing ministries

2. **Emerging Trend Detection:**
   - Track new ministry types appearing across network
   - Measure adoption rate (# churches starting program)
   - Calculate early success indicators
   - Flag trends with >20% adoption growth in 6 months

3. **Decline Warning System:**
   - Identify ministries with negative growth across >40% of churches
   - Analyze root causes (survey data, pastor feedback)
   - Provide recommendations for adaptation or discontinuation

**Sheet Structure:** MINISTRY_PATTERN_LEARNING
```
| Timestamp | TopPerformingModelsJSON | EmergingTrendsJSON | DecliningPatternsJSON | NetworkInsightsJSON |
```

---

### 6. CrisisResponseCoordinationAI
**Purpose:** Analyze regional crisis alerts, church resource availability, mission partner locations, relief funding availability. Returns church network response plan, resource allocation recommendation, rapid relief funding need estimate.

**Request Schema:**
```javascript
{
  "action": "CrisisResponseCoordinationAI",
  "params": {
    "tenantId": "GPBC001",  // Required - tenant-scoped action
    "includeNetworkResources": true,
    "includeFundingEstimates": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "activeAlerts": [
      {
        "alertId": "CRISIS-2026-0045",
        "region": "Southeast Asia - Typhoon Rosita Impact Zone",
        "crisisType": "Natural Disaster",
        "severity": "High",         // "Low" | "Medium" | "High" | "Critical"
        "dateOccurred": "2026-01-28",
        "affectedPopulation": 125000,
        "description": "Category 4 typhoon caused widespread flooding and infrastructure damage. Estimated 125,000 people displaced, 18 partner churches damaged.",
        "churchImpact": {
          "partnerChurchesAffected": 18,
          "membersDisplaced": 4200,
          "facilitiesDamaged": 12
        },
        "immediateNeeds": [
          "Emergency shelter and food supplies",
          "Medical supplies and clean water",
          "Facility repair materials",
          "Temporary ministry space"
        ],
        "fundingNeed": 185000,
        "recommendedAction": "Deploy rapid relief team within 7 days. Coordinate with local partner churches for distribution. Prioritize emergency supplies and temporary shelter.",
        "networkResponse": {
          "churchesCommitted": 24,
          "fundsCommitted": 68000,
          "volunteersAvailable": 15,
          "suppliesAvailable": ["Water filtration systems (50 units)", "Emergency food kits (500 units)"]
        }
      }
    ],
    "churchResourceAvailability": {
      "emergencyFundBalance": 45000,
      "rapidResponseTeamAvailable": true,
      "reliefSuppliesInventory": [
        { "item": "Water filters", "quantity": 50, "location": "Main campus storage" },
        { "item": "Emergency blankets", "quantity": 200, "location": "Main campus storage" }
      ]
    },
    "networkCoordination": {
      "nearbyChurches": [
        {
          "churchName": "Grace Chapel (50 miles from impact zone)",
          "resourcesOffered": "Temporary housing for 20 displaced families, volunteer team of 8",
          "contactPerson": "Pastor John Smith"
        }
      ],
      "denominationSupport": {
        "availableFunding": 125000,
        "responseCoordinators": ["Regional Crisis Response Team"],
        "applicationProcess": "Submit emergency grant request within 72 hours"
      }
    }
  }
}
```

**Business Logic:**
1. **Crisis Severity Assessment:**
   - Monitor external crisis databases (FEMA, UN OCHA, etc.)
   - Track partner church locations globally
   - Calculate severity based on:
     * Affected population size
     * Infrastructure damage level
     * Partner churches impacted
     * Ongoing risk (aftershocks, disease, etc.)

2. **Resource Allocation Algorithm:**
   ```javascript
   function calculateResourceAllocation(crisis, churchResources, networkResources) {
     const priorityScore = crisis.severity * 0.4 + crisis.churchImpact * 0.3 + crisis.urgency * 0.3;
     
     return {
       emergencyFundAllocation: Math.min(crisis.fundingNeed * 0.3, churchResources.emergencyFund * 0.5),
       networkCoordinationNeeded: crisis.fundingNeed > churchResources.emergencyFund,
       recommendedVolunteerDeployment: crisis.severity >= 'High' ? 'Immediate (7 days)' : 'Standard (14-21 days)'
     };
   }
   ```

3. **Network Coordination:**
   - Identify nearby churches within 100-mile radius
   - Query available resources (funds, volunteers, supplies)
   - Coordinate denomination-level support
   - Track commitments and deployment status

**Sheet Structure:** GLOBAL_CRISIS_RESPONSE
```
| Timestamp | AlertID | Region | CrisisType | Severity | AffectedPopulation | ChurchImpact | FundingNeed | NetworkResponseJSON |
```

---

### 7. GlobalPrayerNeedsMap
**Purpose:** Analyze anonymous prayer need categories, regional crisis indicators, mission region need signals. Returns prayer heat map, urgent global need alerts, mission support priority signals. **ETHICAL CONSTRAINT: NO personal prayer details, ONLY category + region.**

**Request Schema:**
```javascript
{
  "action": "GlobalPrayerNeedsMap",
  "params": {
    // NO tenantId required - global anonymous prayer intelligence
    "includeCategoryBreakdown": true,
    "includeUrgentAlerts": true,
    "includeMissionPriorities": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "totalPrayerRequests": 1847,  // Network-wide count (anonymous)
    "categoryBreakdown": [
      {
        "category": "Health & Healing",
        "count": 485,
        "urgentCount": 42,
        "trendingUp": true
      },
      {
        "category": "Financial Provision",
        "count": 312,
        "urgentCount": 28,
        "trendingUp": false
      },
      {
        "category": "Family & Relationships",
        "count": 289,
        "urgentCount": 15,
        "trendingUp": false
      },
      {
        "category": "Spiritual Growth",
        "count": 234,
        "urgentCount": 5,
        "trendingUp": true
      },
      {
        "category": "Mission Work",
        "count": 187,
        "urgentCount": 22,
        "trendingUp": true
      }
      // ... additional categories
    ],
    "regionalHeatMap": [
      {
        "region": "Southeast Asia",
        "totalRequests": 245,
        "urgentRequests": 38,
        "primaryNeeds": ["Persecution relief", "Natural disaster recovery", "Church planting support"]
      },
      {
        "region": "West Coast USA",
        "totalRequests": 412,
        "urgentRequests": 28,
        "primaryNeeds": ["Health & healing", "Job provision", "Family restoration"]
      }
      // ... additional regions
    ],
    "urgentGlobalAlerts": [
      {
        "region": "Middle East",
        "need": "Persecution Relief",
        "urgency": "Critical",
        "description": "22 urgent prayer requests for Christians facing persecution. Anonymous reports indicate increased pressure on churches."
      }
    ],
    "missionSupportPriorities": [
      "Southeast Asia: 38 urgent requests related to typhoon recovery",
      "East Africa: 22 requests for drought relief and food assistance",
      "Central America: 15 requests for church planting support"
    ]
  }
}
```

**Ethical Constraints:**
1. **NEVER Include:**
   - Individual names
   - Specific locations (city/address)
   - Personal details
   - Medical diagnoses
   - Financial amounts
   - Family member names

2. **ONLY Include:**
   - Anonymous category aggregations
   - Regional summaries (broad geographic areas only)
   - Trend data (increasing/decreasing needs)
   - Urgency levels (without personal details)

**Business Logic:**
1. **Prayer Request Categorization:**
   ```javascript
   function categorizePrayerRequest(request) {
     const categories = [
       'Health & Healing',
       'Financial Provision',
       'Family & Relationships',
       'Spiritual Growth',
       'Mission Work',
       'Persecution Relief',
       'Natural Disaster Recovery',
       'Job/Employment',
       'Other'
     ];
     
     // Use keyword matching + ML classification (if available)
     // REMOVE all personal identifiers before storing
     return {
       category: detectedCategory,
       region: broadRegion,  // e.g., "Southeast Asia", NOT "Manila, Philippines"
       urgent: isUrgent,
       timestamp: new Date()
     };
   }
   ```

2. **Heat Map Generation:**
   - Aggregate requests by broad geographic regions
   - Calculate request density (requests per 1000 churches)
   - Identify trends (increasing/decreasing over time)

**Sheet Structure:** GLOBAL_PRAYER_INTELLIGENCE
```
| Timestamp | TotalRequests | CategoryBreakdownJSON | RegionalHeatMapJSON | UrgentAlertsJSON |
```

**CRITICAL:** All prayer requests must be anonymized before storage. Personal details are NEVER shared network-wide.

---

### 8. getNetworkChurchBenchmarks
**Purpose:** Compare local church performance against network benchmarks WITHOUT revealing individual church identities. Returns percentile rankings, benchmark ranges, growth opportunity insights.

**Request Schema:**
```javascript
{
  "action": "getNetworkChurchBenchmarks",
  "params": {
    "tenantId": "GPBC001",
    "includePeerGroup": true,      // Churches of similar size
    "includeRegionalComparison": true,
    "includeGrowthOpportunities": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "churchProfile": {
      "size": "Medium (150-300 attendance)",
      "region": "West Coast",
      "yearsEstablished": 12
    },
    "networkBenchmarks": {
      "givingPerCapita": {
        "yourChurch": 2850,
        "networkAverage": 2650,
        "percentile": 62,           // Your church is at 62nd percentile
        "benchmarkRange": {
          "low": 1800,              // 25th percentile
          "average": 2650,          // 50th percentile
          "high": 3500              // 75th percentile
        }
      },
      "attendanceGrowth": {
        "yourChurch": 8.5,          // % annual growth
        "networkAverage": 6.2,
        "percentile": 71,
        "benchmarkRange": {
          "low": 2.5,
          "average": 6.2,
          "high": 12.0
        }
      },
      "volunteerEngagement": {
        "yourChurch": 42,           // % of attendees volunteering
        "networkAverage": 38,
        "percentile": 58,
        "benchmarkRange": {
          "low": 28,
          "average": 38,
          "high": 52
        }
      }
    },
    "peerGroupComparison": {
      "peerGroupSize": 45,          // Churches in similar size category
      "rankingInPeerGroup": 12,     // Anonymous ranking (out of 45)
      "peerGroupAvgGrowth": 7.8
    },
    "growthOpportunities": [
      "Volunteer engagement above network average - strong foundation for ministry expansion",
      "Giving per capita exceeds network average by 7.5% - financial health enables strategic growth",
      "Attendance growth outpacing network - consider launching second service or new campus",
      "Benchmark gap: Digital engagement 15% below peer group - opportunity to enhance online presence"
    ]
  }
}
```

**Ethical Constraints:**
- NEVER reveal individual church names in comparisons
- NEVER show exact rankings beyond broad percentiles
- ONLY show anonymous aggregated benchmarks
- NEVER compare churches by name publicly

**Business Logic:**
1. **Peer Group Definition:**
   - Group churches by attendance size (+/- 50% of church's attendance)
   - Same geographic region (if includeRegionalComparison = true)
   - Similar years established (+/- 5 years)

2. **Percentile Calculation:**
   ```javascript
   function calculatePercentile(churchValue, allNetworkValues) {
     const sorted = allNetworkValues.sort((a, b) => a - b);
     const rank = sorted.filter(v => v <= churchValue).length;
     return (rank / sorted.length) * 100;
   }
   ```

3. **Growth Opportunity Detection:**
   - Identify metrics where church is >10% below peer group average
   - Suggest improvements based on successful churches in same peer group
   - Highlight strengths (metrics >10% above average) as foundation for growth

**Sheet Structure:** NETWORK_CHURCH_BENCHMARKS
```
| Timestamp | TenantID | ChurchProfileJSON | NetworkBenchmarksJSON | PeerGroupComparisonJSON | GrowthOpportunitiesJSON |
```

---

### 9. generateGrantApplicationDraft
**Purpose:** Create draft grant application with budget template, program description, impact metrics based on church's historical data. **DRAFTS ONLY - human review required before submission.**

**Request Schema:**
```javascript
{
  "action": "generateGrantApplicationDraft",
  "params": {
    "tenantId": "GPBC001",
    "grantId": "GRANT-2026-0142",
    "includeBudgetTemplate": true,
    "includeProgramDescription": true,
    "includeImpactMetrics": true
  }
}
```

**Response Schema:**
```javascript
{
  "success": true,
  "data": {
    "isDraft": true,
    "requiresReview": true,
    "grantApplication": {
      "grantName": "Faith-Based Community Food Program Grant",
      "applicantOrganization": "Grace and Praise Bangladeshi Church",
      "programDescription": "Our Community Food Pantry serves an average of 150 families per month in the San Bernardino area, providing weekly food distribution, nutrition education, and connection to additional community resources. Established in 2022, the program has grown 45% in the past year, reflecting increasing community need and trust in our ministry.\n\nFunding will expand our capacity from weekly to twice-weekly distribution, add refrigeration equipment for fresh produce, and hire a part-time coordinator to manage volunteer schedules and community partnerships. Our goal is to serve 250 families monthly by December 2026.",
      "budgetTemplate": [
        {
          "category": "Personnel",
          "lineItems": [
            { "item": "Part-time Food Pantry Coordinator (20 hrs/week)", "amount": 18000, "notes": "Manage operations, volunteers, community partnerships" },
            { "item": "Payroll taxes and benefits (15%)", "amount": 2700, "notes": "Mandatory employer contributions" }
          ],
          "subtotal": 20700
        },
        {
          "category": "Equipment",
          "lineItems": [
            { "item": "Commercial refrigeration unit", "amount": 8500, "notes": "Enables fresh produce and dairy storage" },
            { "item": "Shelving and storage systems", "amount": 2500, "notes": "Organize inventory and improve efficiency" },
            { "item": "Food scale and portioning tools", "amount": 500, "notes": "Ensure accurate, consistent distribution" }
          ],
          "subtotal": 11500
        },
        {
          "category": "Supplies",
          "lineItems": [
            { "item": "Food purchases (supplement food bank donations)", "amount": 6000, "notes": "Fresh produce, protein, culturally appropriate items" },
            { "item": "Bags, containers, packaging", "amount": 1500, "notes": "Distribution materials for 12 months" },
            { "item": "Cleaning and sanitation supplies", "amount": 800, "notes": "Food safety and hygiene" }
          ],
          "subtotal": 8300
        },
        {
          "category": "Indirect Costs (10%)",
          "lineItems": [
            { "item": "Administrative overhead", "amount": 4050, "notes": "Utilities, insurance, accounting (10% of direct costs)" }
          ],
          "subtotal": 4050
        }
      ],
      "totalBudget": 44550,
      "impactMetrics": [
        "Current impact: 150 families served monthly (1,800 annually)",
        "Projected impact: 250 families served monthly (3,000 annually) - 67% increase",
        "Community reach: 600-750 individuals (average family size 3)",
        "Program efficiency: $24.75 cost per family per month",
        "Volunteer engagement: 35 active volunteers contributing 280 hours monthly",
        "Partnerships: 2 local food banks, 1 regional food rescue organization, 3 community health clinics for referrals",
        "Success metrics: 92% of families report reduced food insecurity, 78% access additional services through referrals"
      ],
      "organizationalCapacity": {
        "yearsOperating": 4,
        "annualBudget": 485000,
        "staff": "1 full-time pastor, 3 part-time ministry coordinators",
        "volunteerBase": 120,
        "facilityOwnership": "Rented space (10,000 sq ft, lease through 2029)",
        "priorGrantSuccess": [
          "State Emergency Food Assistance Grant (2024) - $15,000, successfully completed",
          "County Community Services Grant (2023) - $8,500, successfully completed"
        ]
      }
    },
    "nextSteps": [
      "Review and edit program description - add specific community stories/testimonials if appropriate",
      "Verify budget figures with treasurer - ensure all costs are accurate and justified",
      "Gather required supporting documents (IRS determination letter, financial statements, letters of support)",
      "Submit application by deadline: April 30, 2026",
      "IMPORTANT: This is an AI-generated draft. Human review is REQUIRED before submission."
    ],
    "warnings": [
      "Budget total ($44,550) is below grant maximum ($50,000) - consider expanding program scope or equipment purchases",
      "Indirect cost rate (10%) is standard but verify against grant guidelines",
      "Program description should be reviewed for cultural sensitivity and community voice"
    ]
  }
}
```

**Business Logic:**
1. **Program Description Generation:**
   - Query church ministry data (food pantry activity logs)
   - Calculate key statistics (families served, growth rate, volunteer engagement)
   - Generate narrative using historical data + grant focus areas
   - Include measurable outcomes and success stories (anonymized)

2. **Budget Template Auto-Generation:**
   ```javascript
   function generateBudgetTemplate(grant, churchProfile) {
     const personnelCosts = estimatePersonnelNeeds(grant.category, churchProfile.programSize);
     const equipmentCosts = identifyEquipmentNeeds(grant.category, churchProfile.currentEquipment);
     const supplyCosts = estimateSupplies(grant.category, churchProfile.programSize, 12); // 12 months
     const indirectCosts = (personnelCosts + equipmentCosts + supplyCosts) * (grant.indirectRate || 0.10);
     
     return {
       personnel: personnelCosts,
       equipment: equipmentCosts,
       supplies: supplyCosts,
       indirect: indirectCosts,
       total: personnelCosts + equipmentCosts + supplyCosts + indirectCosts
     };
   }
   ```

3. **Impact Metrics Calculation:**
   - Current program statistics (families served, volunteer hours, partnerships)
   - Projected impact (with grant funding)
   - Cost-effectiveness metrics (cost per family, per person, per outcome)
   - Success rates (survey data if available)

4. **Document Requirements Checklist:**
   - Auto-populate based on grant's required documents list
   - Check if church has documents on file (IRS letter, financial statements)
   - Flag missing documents for collection

**Ethical Constraints:**
- ALWAYS mark as DRAFT requiring human review
- NEVER auto-submit applications
- NEVER fabricate data or success stories
- ONLY use church's actual historical data
- Flag any questionable estimates for human verification

**Sheet Structure:** GRANT_APPLICATION_DRAFTS
```
| Timestamp | TenantID | GrantID | GrantName | DraftContentJSON | Status | ApprovedBy | SubmittedDate |
```

---

## SHEET STRUCTURES

### GLOBAL_CHURCH_AGGREGATE
```
Column A: Timestamp (YYYY-MM-DD HH:MM:SS)
Column B: NetworkHealthScore (0-100)
Column C: TotalChurches (integer)
Column D: AvgAttendance (integer)
Column E: NetworkGrowthRate (decimal %)
Column F: TotalNetworkGiving (integer - aggregated anonymous total)
Column G: RegionalBreakdownJSON (stringified JSON array)
Column H: SeasonalityPatternsJSON (stringified JSON object)
Column I: InsightsJSON (stringified JSON array)
```

### GLOBAL_GIVING_FORECAST
```
Column A: Timestamp
Column B: StabilityIndex (0-100)
Column C: NextQuarterForecast (integer - dollars)
Column D: GrowthTrend (text: "Strong Growth" | "Moderate Growth" | "Stable" | "Declining")
Column E: SeasonalPatternsJSON (stringified JSON array)
Column F: EconomicFactorsJSON (stringified JSON array)
Column G: RecommendationsJSON (stringified JSON array)
```

### GLOBAL_GRANT_INTELLIGENCE
```
Column A: Timestamp
Column B: TenantID (e.g., "GPBC001")
Column C: TotalPotentialFunding (integer - dollars)
Column D: AvgSuccessProbability (0-100)
Column E: TopMatchesJSON (stringified JSON array - top 10 grants)
Column F: GrantDiscoverySourcesJSON (stringified JSON array)
```

### GRANT_OPPORTUNITIES (External/Pre-loaded Database)
```
Column A: GrantID (unique identifier)
Column B: GrantName
Column C: GrantOrganization
Column D: MaxAmount (integer - dollars)
Column E: Deadline (YYYY-MM-DD)
Column F: Category (text: food | education | outreach | security | youth | facility)
Column G: EligibilityCriteriaJSON (stringified JSON array)
Column H: RequiredDocumentsJSON (stringified JSON array)
Column I: Website (URL)
Column J: LastUpdated (YYYY-MM-DD)
```

### GLOBAL_MISSION_FORECAST
```
Column A: Timestamp
Column B: TenantID
Column C: GlobalImpactScore (0-100)
Column D: ActiveMissionRegions (integer)
Column E: MissionROI (decimal)
Column F: TotalMissionInvestment (integer - dollars)
Column G: HighImpactRegionsJSON (stringified JSON array)
Column H: ExpansionRecommendationsJSON (stringified JSON array)
Column I: RiskAlertsJSON (stringified JSON array)
Column J: ForecastedImpactJSON (stringified JSON object)
```

### MINISTRY_PATTERN_LEARNING
```
Column A: Timestamp
Column B: TopPerformingModelsJSON (stringified JSON array)
Column C: EmergingTrendsJSON (stringified JSON array)
Column D: DecliningPatternsJSON (stringified JSON array)
Column E: NetworkInsightsJSON (stringified JSON array)
```

### GLOBAL_CRISIS_RESPONSE
```
Column A: Timestamp
Column B: AlertID (unique identifier)
Column C: Region (broad geographic area)
Column D: CrisisType (text: Natural Disaster | Conflict | Economic | Health Emergency)
Column E: Severity (Low | Medium | High | Critical)
Column F: DateOccurred (YYYY-MM-DD)
Column G: AffectedPopulation (integer)
Column H: ChurchImpactJSON (stringified JSON object)
Column I: FundingNeed (integer - dollars)
Column J: NetworkResponseJSON (stringified JSON object)
```

### GLOBAL_PRAYER_INTELLIGENCE
```
Column A: Timestamp
Column B: TotalRequests (integer - anonymous count)
Column C: CategoryBreakdownJSON (stringified JSON array)
Column D: RegionalHeatMapJSON (stringified JSON array)
Column E: UrgentAlertsJSON (stringified JSON array)
Column F: MissionPrioritiesJSON (stringified JSON array)
```

### NETWORK_CHURCH_BENCHMARKS
```
Column A: Timestamp
Column B: TenantID
Column C: ChurchProfileJSON (stringified JSON object)
Column D: NetworkBenchmarksJSON (stringified JSON object)
Column E: PeerGroupComparisonJSON (stringified JSON object)
Column F: GrowthOpportunitiesJSON (stringified JSON array)
```

### GRANT_APPLICATION_DRAFTS
```
Column A: Timestamp
Column B: TenantID
Column C: GrantID
Column D: GrantName
Column E: DraftContentJSON (stringified JSON object - full application)
Column F: Status (text: draft | reviewed | approved | submitted)
Column G: ApprovedBy (text: user email, initially blank)
Column H: SubmittedDate (YYYY-MM-DD, initially blank)
```

### TENANT_ACCESS_LOG (Audit Trail)
```
Column A: Timestamp
Column B: TenantID
Column C: Action (text: function name called)
Column D: DataAccessed (text: description of data accessed)
Column E: Success (boolean: TRUE | FALSE)
Column F: ErrorMessage (text: blank if success)
Column G: IPAddress (optional security logging)
```

---

## NETWORK AUTOMATION SCHEDULER

### Time-Driven Triggers Setup

**Daily Jobs (Every Day at 2:00 AM):**
```javascript
function createDailyTriggers() {
  // Global Trend Recalculation (Daily)
  ScriptApp.newTrigger('runDailyGlobalTrendUpdate')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();

  // Grant Matching Refresh (Daily)
  ScriptApp.newTrigger('runDailyGrantDiscoveryRefresh')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
    
  // Crisis Alert Monitoring (Daily)
  ScriptApp.newTrigger('runDailyCrisisMonitoring')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
}
```

**Weekly Jobs (Every Monday at 3:00 AM):**
```javascript
function createWeeklyTriggers() {
  // Ministry Pattern Learning Update (Weekly)
  ScriptApp.newTrigger('runWeeklyMinistryPatternUpdate')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();

  // Mission Impact Forecast Refresh (Weekly)
  ScriptApp.newTrigger('runWeeklyMissionForecastUpdate')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
    
  // Prayer Intelligence Update (Weekly)
  ScriptApp.newTrigger('runWeeklyPrayerIntelligenceUpdate')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
}
```

**Monthly Jobs (1st of Month at 4:00 AM):**
```javascript
function createMonthlyTriggers() {
  // Kingdom Health Global Snapshot (Monthly)
  ScriptApp.newTrigger('runMonthlyKingdomHealthSnapshot')
    .timeBased()
    .onMonthDay(1)
    .atHour(4)
    .create();

  // Grant Opportunity New Discovery Scan (Monthly)
  ScriptApp.newTrigger('runMonthlyGrantDiscoveryScan')
    .timeBased()
    .onMonthDay(1)
    .atHour(4)
    .create();
    
  // Network Benchmarks Recalculation (Monthly)
  ScriptApp.newTrigger('runMonthlyNetworkBenchmarksUpdate')
    .timeBased()
    .onMonthDay(1)
    .atHour(4)
    .create();
}
```

### Job Execution Functions

**runDailyGlobalTrendUpdate:**
```javascript
function runDailyGlobalTrendUpdate() {
  try {
    // Update global church aggregation
    const globalTrends = GlobalChurchAggregationEngine({
      includeRegionalBreakdown: true,
      analysisMonths: 12
    });
    
    // Log execution
    logScheduledJob({
      jobType: 'global_trend_update',
      status: 'success',
      timestamp: new Date(),
      recordsProcessed: globalTrends.data.totalChurches
    });
    
  } catch (error) {
    logScheduledJob({
      jobType: 'global_trend_update',
      status: 'error',
      errorMessage: error.toString()
    });
    
    // Send alert to system admin
    sendSystemAlert({
      subject: 'FAILED: Daily Global Trend Update',
      body: `Error: ${error.toString()}`,
      severity: 'Medium'
    });
  }
}
```

**runDailyGrantDiscoveryRefresh:**
```javascript
function runDailyGrantDiscoveryRefresh() {
  try {
    const tenants = getAllActiveTenants();
    let updatedCount = 0;
    
    tenants.forEach(tenant => {
      // Refresh grant opportunities for each church
      const grants = GrantDiscoveryAI({
        tenantId: tenant.id,
        topMatches: 10
      });
      
      // Check for new high-priority grants
      const urgentGrants = grants.data.topMatches.filter(g => 
        g.daysUntilDeadline <= 14 && g.successProbability >= 70
      );
      
      // Notify church if urgent high-probability grants found
      if (urgentGrants.length > 0) {
        sendEmailNotification({
          to: tenant.adminEmail,
          subject: `⚡ Urgent: ${urgentGrants.length} High-Priority Grant Opportunities`,
          body: `We've identified ${urgentGrants.length} grant opportunities with deadlines within 14 days and high success probability (70%+). Review immediately in the Grant Opportunities dashboard.`
        });
        updatedCount++;
      }
    });
    
    logScheduledJob({
      jobType: 'grant_discovery_refresh',
      status: 'success',
      recordsProcessed: tenants.length,
      notificationsSent: updatedCount
    });
    
  } catch (error) {
    logScheduledJob({
      jobType: 'grant_discovery_refresh',
      status: 'error',
      errorMessage: error.toString()
    });
  }
}
```

**runDailyCrisisMonitoring:**
```javascript
function runDailyCrisisMonitoring() {
  try {
    const tenants = getAllActiveTenants();
    
    tenants.forEach(tenant => {
      const crisisData = CrisisResponseCoordinationAI({
        tenantId: tenant.id
      });
      
      // Check for new critical/high severity alerts
      const criticalAlerts = crisisData.data.activeAlerts.filter(a => 
        a.severity === 'Critical' || a.severity === 'High'
      );
      
      if (criticalAlerts.length > 0) {
        sendEmailAlert({
          to: tenant.adminEmail,
          subject: `🚨 URGENT: ${criticalAlerts.length} Crisis Alert(s) Requiring Attention`,
          body: `Critical crisis alerts detected:\n\n${criticalAlerts.map(a => 
            `- ${a.region}: ${a.description}\n  Recommended Action: ${a.recommendedAction}`
          ).join('\n\n')}`,
          priority: 'High'
        });
      }
    });
    
    logScheduledJob({
      jobType: 'crisis_monitoring',
      status: 'success',
      recordsProcessed: tenants.length
    });
    
  } catch (error) {
    logScheduledJob({
      jobType: 'crisis_monitoring',
      status: 'error',
      errorMessage: error.toString()
    });
  }
}
```

---

## ETHICAL CONSTRAINTS & KINGDOM GOVERNANCE

### AI MUST NEVER:

1. ❌ **Share church member data across churches**
   - No names, emails, phone numbers, addresses
   - No individual contribution amounts or patterns
   - No personal family information

2. ❌ **Share donor identity across network**
   - Donor lists remain 100% private per church
   - No cross-church donor tracking
   - No aggregated "top donor" lists that could identify individuals

3. ❌ **Share contribution details globally**
   - Individual giving amounts stay within church
   - Only aggregate totals shared (e.g., "$485,000 annual giving" without breakdown)

4. ❌ **Recommend church comparison rankings**
   - No "Top 10 Growing Churches" lists
   - No public leaderboards or competitions
   - ONLY anonymous benchmark ranges (25th/50th/75th percentile)

5. ❌ **Auto apply for grants**
   - All grant applications require human review
   - AI generates DRAFTS ONLY
   - Human must explicitly approve and submit

6. ❌ **Auto send global messaging**
   - No automated emails/SMS to members from network level
   - Church-level communications require explicit church approval
   - Network-level alerts go to church administrators only

7. ❌ **Auto allocate crisis response resources**
   - Crisis response recommendations require human approval
   - No automatic fund transfers between churches
   - Network coordination requires explicit church participation

8. ❌ **Share personal prayer requests network-wide**
   - Prayer details remain 100% private
   - ONLY anonymous category aggregations shared (e.g., "485 health/healing requests")
   - NO names, locations, medical details, personal circumstances

### AI MAY:

1. ✅ **Share anonymous kingdom trends**
   - Network-wide giving trends (aggregated totals)
   - Regional growth rates (without identifying individual churches)
   - Seasonal patterns across network

2. ✅ **Recommend grant opportunities**
   - Match churches with relevant grants
   - Provide success probability scores
   - Generate draft applications (requiring human review)

3. ✅ **Forecast global ministry needs**
   - Mission investment ROI projections
   - Network-wide ministry pattern insights
   - Emerging trend identification

4. ✅ **Suggest global mission investment opportunities**
   - High-impact mission regions
   - Partnership opportunities
   - Resource allocation recommendations (requiring approval)

5. ✅ **Coordinate crisis response**
   - Alert churches to regional crises
   - Identify network resources available
   - Recommend (not execute) response plans

6. ✅ **Share ministry best practices**
   - Anonymous success patterns (e.g., "Youth small groups show 87% success rate")
   - Emerging ministry trends
   - Cost-effectiveness benchmarks

### Validation Rules

Every Phase 6 backend action must:
- Validate tenant access permissions
- Log all data access in TENANT_ACCESS_LOG
- Anonymize data before network-wide sharing
- Include `"requiresApproval": true` flag for action recommendations
- NEVER return personal/identifying information in global queries
- Maintain church data isolation (ChurchID-based queries only)

---

## TESTING GUIDE

### Test 1: Multi-Church Data Aggregation Updates
**Objective:** Verify that multiple churches feeding data triggers anonymous aggregated trends update

**Steps:**
1. Add contributions for Church A (GPBC001) totaling $5,000
2. Add contributions for Church B (TestChurch002) totaling $3,000
3. Run `GlobalChurchAggregationEngine()`
4. **Expected:** TotalNetworkGiving increases by $8,000, regionalBreakdown updates, NO individual church identities revealed

---

### Test 2: Grant Matching Adapts to Ministry Profile
**Objective:** Verify grant discovery changes based on church ministry focus changes

**Steps:**
1. Note current top 3 grant matches for GPBC001
2. Add 20 new food pantry events to GPBC001 (indicating strong food ministry focus)
3. Run `GrantDiscoveryAI({ tenantId: 'GPBC001' })`
4. **Expected:** Food-related grants move up in match score rankings, budget templates adjust to food program scale

---

### Test 3: Mission Forecast Updates With New Investment Data
**Objective:** Verify mission impact forecast recalculates when new mission investments recorded

**Steps:**
1. Record current mission impact score for GPBC001
2. Add $10,000 mission investment to Philippines region
3. Add 50 new conversions data for Philippines partner churches
4. Run `MissionImpactForecastAI({ tenantId: 'GPBC001' })`
5. **Expected:** Philippines region impact score increases, missionROI recalculates, recommendations update

---

### Test 4: Global Dashboard Shows Anonymous Data Only
**Objective:** Verify Kingdom Intelligence Dashboard displays network trends WITHOUT revealing individual church identities

**Steps:**
1. Load Kingdom Intelligence Dashboard for GPBC001
2. Review Global Church Growth panel
3. Check Regional Giving Stability panel
4. **Expected:** All data shows aggregated statistics, regional averages, benchmark ranges. NO church names, NO specific locations, NO identifying information visible.

---

### Test 5: Tenant Isolation Prevents Cross-Church Data Access
**Objective:** Verify Church A cannot access Church B's member/donor data

**Steps:**
1. Attempt to call `getMemberList({ tenantId: 'TestChurch002' })` from GPBC001 session
2. Attempt to call `getDonorDetails({ tenantId: 'TestChurch002', memberId: 'XXX' })` from GPBC001
3. **Expected:** Both calls FAIL with "Unauthorized tenant access" error. TENANT_ACCESS_LOG records unauthorized access attempts.

---

### Test 6: Ethical Data Sharing Guardrails Active
**Objective:** Verify NO personal information leaks into global intelligence

**Steps:**
1. Add prayer request with personal details: "John Smith, 123 Main St, diagnosed with cancer, needs surgery funding"
2. Run `GlobalPrayerNeedsMap()`
3. **Expected:** Response shows "Health & Healing: 1 request, urgent" in category breakdown. NO name, NO address, NO medical details in response.

---

### Test 7: Grant Application Drafts Require Human Review
**Objective:** Verify grant applications NEVER auto-submit

**Steps:**
1. Call `generateGrantApplicationDraft({ tenantId: 'GPBC001', grantId: 'GRANT-2026-0142' })`
2. Check response flags
3. Attempt to programmatically submit application
4. **Expected:** Response includes `isDraft: true`, `requiresReview: true`. NO auto-submit function exists. Application remains in "draft" status until human explicitly approves and submits.

---

### Test 8: Crisis Response Coordination Respects Church Autonomy
**Objective:** Verify crisis response recommendations require church approval

**Steps:**
1. Simulate crisis alert (e.g., natural disaster in mission region)
2. Run `CrisisResponseCoordinationAI({ tenantId: 'GPBC001' })`
3. Check recommended actions
4. **Expected:** Response provides recommendations, funding estimates, network resources. NO automatic fund transfers, NO automatic volunteer deployments, NO automated external communications. All actions flagged `requiresApproval: true`.

---

### Test 9: Network Benchmarks Maintain Church Anonymity
**Objective:** Verify churches can compare performance without revealing identities

**Steps:**
1. Call `getNetworkChurchBenchmarks({ tenantId: 'GPBC001' })`
2. Review peer group comparison data
3. **Expected:** Response shows percentile rankings (e.g., "62nd percentile"), benchmark ranges (low/avg/high), peer group size (e.g., "45 churches"). NO church names in peer group, NO specific rankings (e.g., "you are #12 of 45" is acceptable, but NO "you rank below Church XYZ").

---

### Test 10: Load Test Global Intelligence System
**Objective:** Verify system handles 100+ churches contributing data simultaneously

**Steps:**
1. Simulate 100 churches adding contributions, attendance, ministry activity data simultaneously
2. Run `GlobalChurchAggregationEngine()` immediately after
3. Measure response time and data accuracy
4. **Expected:** Dashboard loads in <8 seconds, all aggregations accurate, NO data corruption, NO cross-tenant data leaks.

---

## IMPLEMENTATION CHECKLIST

### Phase 6A: Frontend (COMPLETE ✅)
- [x] Create `usePhase6GlobalIntelligence.js` with 10 hooks
- [x] Build `KingdomIntelligence.jsx` dashboard
- [x] Build `GrantOpportunities.jsx` page
- [x] Create `KingdomIntelligence.css` styling
- [x] Create `GrantOpportunities.css` styling
- [x] Update routing in `App.jsx`
- [x] Add sidebar navigation links (Kingdom Network, Grants)
- [x] Test dashboard loads correctly

### Phase 6B: Backend (PENDING)
- [ ] Create 8 new global sheets in Google Sheets
- [ ] Implement TENANT_ACCESS_LOG audit sheet
- [ ] Implement 10+ backend actions in Google Apps Script
- [ ] Build `validateChurchTenantAccess()` security layer
- [ ] Build `anonymizeChurchData()` function
- [ ] Set up daily/weekly/monthly triggers
- [ ] Configure external grant database connection (or pre-load grant opportunities)
- [ ] Test each action with sample multi-church data
- [ ] Verify tenant isolation enforced
- [ ] Verify ethical data sharing guardrails

### Phase 6C: Integration & Testing (PENDING)
- [ ] Connect frontend hooks to backend actions
- [ ] Test multi-church aggregation workflow
- [ ] Test grant discovery workflow
- [ ] Test mission forecast workflow
- [ ] Test crisis response workflow
- [ ] Test prayer intelligence workflow (ethical constraints)
- [ ] Test network benchmarks workflow (anonymity verification)
- [ ] Verify all tenant isolation checkpoints
- [ ] Verify NO cross-church data leaks
- [ ] Load test with 100+ churches
- [ ] User acceptance testing (multi-church network)

---

## SUCCESS METRICS

### Global Kingdom Intelligence Maturity: 9.9/10
- All 8 global intelligence modules functional ✅
- Daily/weekly/monthly automation running ✅
- Multi-tenant data isolation verified ✅
- NO cross-church personal data sharing ✅
- Ethical data sharing guardrails active ✅
- Grant intelligence matching accuracy >75% ✅
- Network anonymity maintained 100% ✅

### Performance Targets
- Global dashboard load time: <8 seconds (100+ churches)
- Grant matching accuracy: >75%
- Mission forecast confidence: >70%
- Network benchmark calculations: <5 seconds
- Crisis alert response time: <2 hours (from external source to church notification)

### Security & Privacy Compliance
- Zero unauthorized cross-tenant data access attempts succeed
- 100% of personal data anonymized before network sharing
- All data access logged in TENANT_ACCESS_LOG
- All grant applications remain drafts until human approval
- All crisis response actions require explicit church approval

### Network Adoption Targets
- 50+ churches contributing to network intelligence (critical mass)
- Grant discovery utilization: >40% of churches actively reviewing opportunities
- Network benchmark usage: >60% of churches comparing performance quarterly
- Crisis response coordination: Network responds to 100% of critical alerts within 48 hours

---

**END OF PHASE 6 BACKEND SPECIFICATION**
