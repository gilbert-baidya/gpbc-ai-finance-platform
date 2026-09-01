import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState({
        churchId: localStorage.getItem('churchId') || 'default',
        name: 'GPBC Finance',
        branding: {
            primary: '#4A0E1A',
            secondary: '#1F6F54',
            logo: null
        }
    });

    const updateTenant = (config) => {
        setTenant(prev => ({ ...prev, ...config }));
        if (config.churchId) localStorage.setItem('churchId', config.churchId);
    };

    // Apply theme dynamically to CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--wine', tenant.branding.primary);
        root.style.setProperty('--green', tenant.branding.secondary);
    }, [tenant.branding]);

    return (
        <TenantContext.Provider value={{ tenant, updateTenant }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) throw new Error('useTenant must be used within a TenantProvider');
    return context;
};
