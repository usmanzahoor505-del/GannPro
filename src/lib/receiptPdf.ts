import jsPDF from "jspdf";
import type { Receipt } from "./api";

const PLAN_NAMES: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
};

export function downloadReceiptPdf(receipt: Receipt) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(5, 7, 15);
  doc.rect(0, 0, w, 297, "F");

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(22);
  doc.text("PAYMENT RECEIPT", w / 2, 30, { align: "center" });

  doc.setDrawColor(139, 92, 246);
  doc.line(20, 38, w - 20, 38);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  const lines: [string, string][] = [
    ["Receipt No:", `#${receipt.receipt_no}`],
    ["Date:", new Date(receipt.created_at).toLocaleDateString()],
    ["User Name:", receipt.user_name],
    ["Email:", receipt.user_email],
    ["Plan:", PLAN_NAMES[receipt.plan] || receipt.plan],
    ["Amount Paid:", `${receipt.amount_pkr.toLocaleString()} PKR`],
    ["Valid From:", new Date(receipt.valid_from).toLocaleDateString()],
    ["Valid Until:", new Date(receipt.valid_until).toLocaleDateString()],
    ["Status:", "APPROVED"],
  ];

  let y = 55;
  lines.forEach(([label, value]) => {
    doc.setTextColor(148, 163, 184);
    doc.text(label, 25, y);
    doc.setTextColor(255, 255, 255);
    doc.text(value, 80, y);
    y += 12;
  });

  doc.line(20, y + 5, w - 20, y + 5);
  y += 20;

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(14);
  doc.text("Trading Calculator Access", w / 2, y, { align: "center" });
  doc.text("Activated", w / 2, y + 10, { align: "center" });

  doc.save(`GannPro9-Receipt-${receipt.receipt_no}.pdf`);
}
