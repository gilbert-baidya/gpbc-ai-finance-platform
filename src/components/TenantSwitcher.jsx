import { useTenant } from "../tenants/TenantContext";
import { useAuth } from "../auth/AuthContext";
import RoleGuard from "../auth/RoleGuard";

export default function TenantSwitcher() {

  const { tenant } = useTenant();

  return (
    <RoleGuard roles={["Admin", "Rev"]}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        <label style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-muted)'
        }}>
          Church:
        </label>
        <div style={{
          padding: '6px 12px',
          borderRadius: '6px',
          background: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--wine)'
        }}>
          {tenant?.short || 'GPBC'} - {tenant?.name || 'Grace & Praise'}
        </div>
      </div>
    </RoleGuard>
  );
}
