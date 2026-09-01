import React, { createContext, useContext, useState, useEffect } from "react";
import { TENANTS } from "./tenantConfig";

const TenantContext = createContext();

export function TenantProvider({ children }) {

  const [tenantKey, setTenantKey] = useState(() => {
    // Load from localStorage if available
    return localStorage.getItem("selectedTenant") || "GPBC";
  });

  const tenant = TENANTS[tenantKey];

  // Save to localStorage when tenant changes
  useEffect(() => {
    localStorage.setItem("selectedTenant", tenantKey);
    
    // Apply theme colors to CSS variables
    if (tenant) {
      document.documentElement.style.setProperty('--wine', tenant.themePrimary);
      document.documentElement.style.setProperty('--green', tenant.themeSecondary);
    }
  }, [tenantKey, tenant]);

  return (
    <TenantContext.Provider value={{ tenantKey, tenant, setTenantKey }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
