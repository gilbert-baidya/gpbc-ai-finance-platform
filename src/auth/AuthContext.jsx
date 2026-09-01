import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  // TODO: Replace with real login later
  const [user, setUser] = useState({
    name: "Demo User",
    role: "Admin" // Change to "Admin" | "Treasurer" | "Rev" for testing
  });

  const loginAs = (role) => setUser({ name: "Demo User", role });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
