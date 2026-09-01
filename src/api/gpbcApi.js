import { gasFetch } from './gasFetch';

/**
 * Add a new contribution record
 * @param {Object} payload - Contribution data
 * @returns {Promise<Object>}
 */
export async function addContribution(payload) {
    const result = await gasFetch('addContribution', payload);
    return result;
}

/**
 * Get dashboard summary for a specific month/year
 * @param {number} month - Month (1-12)
 * @param {number} year - Full year (e.g., 2026)
 * @returns {Promise<Object>}
 */
export async function getDashboardSummary(month, year) {
    return gasFetch('getDashboardSummary', { month, year });
}

/**
 * Get all members
 * @returns {Promise<Object>}
 */
export async function getMembers() {
    const result = await gasFetch('getMembers', {});
    return result;
}

/**
 * Add a new member
 * @param {Object} payload - Member data
 * @returns {Promise<Object>}
 */
export async function addMember(payload) {
    const result = await gasFetch('addMember', payload);
    return result;
}
