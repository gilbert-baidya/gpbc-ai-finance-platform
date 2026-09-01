
import fs from 'fs';

const API_URL = 'https://script.google.com/macros/s/AKfycbw-TRD7CS-DRrdqypWslAt7sBeGinALyhhfFhB7VDaijq2wq4mibtIFVrfouxS37YeT/exec';
const API_KEY = 'gpbc_secure_rev_2026_finance';

const auditReport = {
    runTime: new Date().toISOString(),
    environment: 'production',
    apiHealth: { status: 'unknown', responseTime: 0 },
    dataIntegrityScore: 0,
    financeComplianceScore: 0,
    aiInsightFlags: [],
    criticalErrors: [],
    warnings: [],
    logs: []
};

async function callApi(action, payload = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const start = Date.now();
    try {
        console.log(`Calling API: ${action}...`);
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ apiKey: API_KEY, action, payload }),
            signal: controller.signal,
            // headers: { 'Content-Type': 'application/json' }, // GAS sometimes dislikes options preflight, but let's try standard first
        });
        const text = await response.text();
        const duration = Date.now() - start;
        clearTimeout(id);

        try {
            const json = JSON.parse(text);
            return { success: true, data: json, duration };
        } catch (e) {
            // Check if it's HTML (Google login page)
            if (text.includes('<!DOCTYPE html>')) {
                return { success: false, error: 'Received HTML instead of JSON. Likely auth redirect.', isAuthError: true, duration };
            }
            return { success: false, error: 'Invalid JSON response', raw: text.substring(0, 100), duration };
        }
    } catch (err) {
        clearTimeout(id);
        return { success: false, error: err.message, duration: Date.now() - start };
    }
}

async function runAudit() {
    console.log('Starting Audit...');

    // Phase 1: Infrastructure Health
    // We can try a simple GET to see if it's reachable, but POST is the main interaction
    const healthCheck = await callApi('getDashboardSummary'); // Use a lightweight call
    if (healthCheck.success && healthCheck.data.success) {
        auditReport.apiHealth.status = 'healthy';
        auditReport.apiHealth.responseTime = healthCheck.duration;
    } else {
        auditReport.apiHealth.status = 'unhealthy';
        auditReport.criticalErrors.push({ phase: 1, message: 'API validation failed', details: healthCheck.error });
    }

    // Phase 2: API Contract Validation & Phase 3: Data Integrity
    let members = [];
    if (auditReport.apiHealth.status === 'healthy') {
        const membersRes = await callApi('getMembers');
        if (membersRes.success && membersRes.data.success) {
            members = membersRes.data.data || membersRes.data.members || []; // Adjust based on actual response structure

            members = membersRes.data.data || membersRes.data.members || []; // Adjust based on actual response structure

            if (members.length > 0) {
                console.log('DEBUG: First member structure:', JSON.stringify(members[0], null, 2));
            }

            // Analyze Members
            let missingEmail = 0;
            let missingName = 0;
            members.forEach(m => {
                if (!m.Email) missingEmail++;
                if (!m.FullName) missingName++;
            });
            if (missingEmail > 0) auditReport.warnings.push(`Found ${missingEmail} members without email`);
            if (missingName > 0) auditReport.criticalErrors.push({ phase: 3, message: `Found ${missingName} members without name` });

            // Check individual member data (Contract Validation)
            if (members.length > 0) {
                const testMember = members[0];
                console.log(`Testing member endpoints for: ${testMember.FullName} (${testMember.MemberID})`);

                const contributionsRes = await callApi('getMemberYearlyContributions', { memberId: testMember.MemberID, year: 2025 });
                if (!contributionsRes.success || !contributionsRes.data.success) {
                    auditReport.criticalErrors.push({ phase: 2, message: 'getMemberYearlyContributions failed', details: contributionsRes.error });
                }

                const taxRes = await callApi('getTaxLetterData', { memberId: testMember.MemberID, year: 2024 });
                if (!taxRes.success || !taxRes.data.success) {
                    auditReport.warnings.push('getTaxLetterData failed (might be expected if no data)');
                }
            }

            auditReport.dataIntegrityScore = Math.max(0, 100 - (missingName * 10) - (missingEmail * 1));
        } else {
            auditReport.criticalErrors.push({ phase: 2, message: 'getMembers failed', details: membersRes.error });
        }
    }

    // Phase 5: AI Insights
    // Try to fetch insights for current month
    const today = new Date();
    const insightsRes = await callApi('getAiInsight', { month: today.toLocaleString('default', { month: 'long' }), year: today.getFullYear() });
    if (insightsRes.success && insightsRes.data.success) {
        const data = insightsRes.data.data;
        if (data && data.givingTrend === 'down' && data.percentChange > 30) {
            auditReport.aiInsightFlags.push('Giving decline > 30% detected');
        }
    } else {
        auditReport.warnings.push('AI Insights endpoint unreachable or returned error');
    }

    // Save Report
    fs.mkdirSync('audit', { recursive: true });
    fs.writeFileSync('audit/audit_results.json', JSON.stringify(auditReport, null, 2));
    console.log('Audit complete. Report saved to audit/audit_results.json');
}

runAudit();
