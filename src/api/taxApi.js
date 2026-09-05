import { gasFetch } from './gasFetch';

/**
 * Tax API Service
 * 
 * Handles fetching tax letter data from Google Apps Script API
 */

/**
 * Fetch tax letter data for a member
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Tax letter data
 */
export async function fetchTaxLetterData(memberId, year) {
  const res = await gasFetch('getTaxLetterData', { memberId, year });
  return res;
}

/**
 * Fetch member yearly contributions (alias for backward compatibility)
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Contribution data
 */
export async function fetchMemberYearlyContributions(memberId, year) {
  const res = await gasFetch('getMemberYearlyContributions', { memberId, year });
  return res;
}
