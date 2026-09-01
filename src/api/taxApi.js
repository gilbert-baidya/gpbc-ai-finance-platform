/**
 * Tax API Service
 * 
 * Handles fetching tax letter data from Google Apps Script API
 * Uses CORS-safe text/plain Content-Type
 */

/**
 * Fetch tax letter data for a member
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Tax letter data
 */
export async function fetchTaxLetterData(memberId, year) {
  const res = await fetch(import.meta.env.VITE_GPBC_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      apiKey: import.meta.env.VITE_GPBC_API_KEY,
      action: "getTaxLetterData",
      payload: { memberId, year }
    })
  });

  return res.json();
}

/**
 * Fetch member yearly contributions (alias for backward compatibility)
 * @param {string} memberId - Member ID
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Contribution data
 */
export async function fetchMemberYearlyContributions(memberId, year) {
  const res = await fetch(import.meta.env.VITE_GPBC_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      apiKey: import.meta.env.VITE_GPBC_API_KEY,
      action: "getMemberYearlyContributions",
      payload: { memberId, year }
    })
  });

  return res.json();
}
