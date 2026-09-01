import { gasFetch } from './gasFetch';

/**
 * Load tax certificate data for a member
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year (default: 2025)
 * @returns {Promise<Object>} Tax statement data
 */
export async function loadTaxData(memberId, year = 2025) {
  const res = await gasFetch('getMemberYearlyContributions', { memberId, year });
  return res;
}

/**
 * Get member yearly statement (alias for backward compatibility)
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Statement data
 */
export async function getMemberYearlyStatement(memberId, year) {
  return loadTaxData(memberId, year);
}
