import { useTenant } from "../tenants/TenantContext";

/**
 * Get tenant-specific API configuration
 */
export function useTenantApi() {
  const { tenant, tenantKey } = useTenant();

  if (!tenant) {
    throw new Error("Tenant not configured");
  }

  const apiUrl = import.meta.env[tenant.apiUrlEnv] || import.meta.env.VITE_GPBC_API_URL;
  const apiKey = import.meta.env[tenant.apiKeyEnv] || import.meta.env.VITE_GPBC_API_KEY;
  const sheetId = import.meta.env[tenant.sheetIdEnv];

  return {
    apiUrl,
    apiKey,
    sheetId,
    tenantKey,
    tenant
  };
}

/**
 * Make tenant-aware API call (CORS-safe for Google Apps Script)
 */
export async function tenantApiFetch(action, payload = {}) {
  const { apiUrl, apiKey, tenantKey } = useTenantApi();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"  // CRITICAL: text/plain for simple CORS request
    },
    body: JSON.stringify({
      apiKey,
      action,
      payload: {
        tenant: tenantKey,
        ...payload
      }
    })
  });

  return response.json();
}
