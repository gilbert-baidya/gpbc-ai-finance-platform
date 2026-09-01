import { jsPDF } from "jspdf";

export function downloadStatementPdf(text, fileName = "GPBC_Statement.pdf") {

  const doc = new jsPDF();

  const lines = doc.splitTextToSize(text, 180);

  doc.text(lines, 15, 20);

  doc.save(fileName);
}
