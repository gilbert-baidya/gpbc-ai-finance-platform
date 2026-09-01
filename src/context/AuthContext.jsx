import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // In a real app, this would come from a JWT or session check
    const [user, setUser] = useState({
        id: 'user-001',
        name: 'James Treasurer',
        role: localStorage.getItem('userRole') || 'TREASURER', // SUPER_ADMIN, PASTOR, TREASURER, FINANCE_VOLUNTEER, AUDITOR
        churchId: localStorage.getItem('churchId') || 'gpbc-bangla'
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('userRole', userData.role);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userRole');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
