import { gasFetch } from './gasFetch';

/**
 * Tax Letter API Service
 * Fetches IRS tax letter data for tax certificates
 */

export async function getTaxLetter(memberId, year) {
  const res = await gasFetch('getTaxLetterData', { memberId, year });
  return res;
}
