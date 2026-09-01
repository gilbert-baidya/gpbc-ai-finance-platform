import { useAuth } from "./AuthContext";

export function DevRoleSwitcher() {

  const { loginAs, user } = useAuth();

  return (
    <div
      className="role-switcher-dev dev-only"
      data-dev-panel="true"
      style={{ 
      position: "fixed", 
      bottom: 20, 
      right: 20, 
      background: "white",
      padding: "12px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      zIndex: 9999
    }}
    >
      <div style={{ 
        fontSize: "12px", 
        fontWeight: "bold", 
        marginBottom: "4px",
        color: "var(--wine)"
      }}>
        Role Switcher (Dev)
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
        Current: {user?.role || "None"}
      </div>
      <button 
        className="btn btn-outline"
        style={{ fontSize: "12px", padding: "6px 12px" }}
        onClick={() => loginAs("Admin")}
      >
        Switch to Admin
      </button>
      <button 
        className="btn btn-outline"
        style={{ fontSize: "12px", padding: "6px 12px" }}
        onClick={() => loginAs("Treasurer")}
      >
        Switch to Treasurer
      </button>
      <button 
        className="btn btn-outline"
        style={{ fontSize: "12px", padding: "6px 12px" }}
        onClick={() => loginAs("Rev")}
      >
        Switch to Rev
      </button>
    </div>
  );
}
