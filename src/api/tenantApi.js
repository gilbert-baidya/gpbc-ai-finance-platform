import { useTenant } from "../tenants/TenantContext";
import { gasFetch } from "./gasFetch";

/**
 * Get tenant-specific API configuration
 */
export function useTenantApi() {
  const { tenant, tenantKey } = useTenant();

  if (!tenant) {
    throw new Error("Tenant not configured");
  }

  const apiUrl = import.meta.env[tenant.apiUrlEnv] || import.meta.env.VITE_GPBC_API_URL;

  return {
    apiUrl,
    tenantKey,
    tenant
  };
}

/**
 * Make tenant-aware API call (CORS-safe for Google Apps Script)
 */
export async function tenantApiFetch(action, payload = {}) {
  const { tenantKey } = useTenantApi();
  return gasFetch(action, {
    tenant: tenantKey,
    ...payload
  });
}
