import { useAuth } from "../auth/AuthContext";
import { logAuditEvent } from "../api/auditApi";

export function useAudit() {

  const { user } = useAuth();

  function audit(action, entity, entityId, meta = {}) {

    logAuditEvent({
      userName: user?.name || "Unknown",
      role: user?.role || "Unknown",
      action,
      entity,
      entityId,
      meta
    });

  }

  return { audit };
}
