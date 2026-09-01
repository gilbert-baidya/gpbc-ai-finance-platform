/**
 * Tax Letter API Service
 * Fetches IRS tax letter data for tax certificates
 */

export async function getTaxLetter(memberId, year) {
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
