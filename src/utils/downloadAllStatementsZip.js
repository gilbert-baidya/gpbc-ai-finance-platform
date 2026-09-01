import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { getMemberYearlyStatement } from "../api/memberStatementApi";
import { buildStatementText } from "./buildStatementText";
import { logAuditEvent } from "../api/auditApi";

export async function downloadAllStatementsZip(members, year, userName = "Unknown", userRole = "Unknown") {

  const zip = new JSZip();

  for (const m of members) {

    const memberId = m.MemberId || m.memberId || m.id;
    const name = (m.FullName || m.fullName || m.name || "Member").replace(/[^\w]/g,"_");

    try {

      const data = await getMemberYearlyStatement(memberId, year);

      if (!data.success) continue;

      const text = buildStatementText(data);

      const doc = new jsPDF();
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 15, 20);

      const pdfBlob = doc.output("blob");

      zip.file(`GPBC_${name}_${year}.pdf`, pdfBlob);

    } catch(e) {
      console.error("Statement failed for:", name, e);
    }
  }

  // Log audit event
  logAuditEvent({
    userName,
    role: userRole,
    action: "EXPORT_ALL_STATEMENTS",
    entity: "MEMBER_STATEMENTS",
    entityId: "BULK",
    meta: {
      year,
      memberCount: members.length,
      format: "ZIP"
    },
    timestamp: new Date().toISOString()
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });

  saveAs(zipBlob, `GPBC_All_Statements_${year}.zip`);
}
