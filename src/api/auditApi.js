import { gasFetch } from './gasFetch';

export async function logAuditEvent(event) {
  try {
    await gasFetch('logAuditEvent', {
      ...event,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
