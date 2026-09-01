import { getAllContributions } from "../api/contributionsApi";
import { exportContributionsXlsx } from "./exportContributionsXlsx";
import { logAuditEvent } from "../api/auditApi";

export async function downloadAllContributionsXlsx(userName = "Unknown", userRole = "Unknown") {

  try {

    const data = await getAllContributions();

    if (data.success) {
      // Log audit event
      logAuditEvent({
        userName,
        role: userRole,
        action: "EXPORT_CONTRIBUTIONS",
        entity: "FINANCE",
        entityId: "ALL",
        meta: { 
          format: "XLSX",
          recordCount: data.contributions?.length || 0
        },
        timestamp: new Date().toISOString()
      });

      exportContributionsXlsx(data.contributions || []);
    } else {
      alert("Export failed");
    }

  } catch (e) {
    console.error(e);
    alert("Export error");
  }
}
