import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer, Quote, quoteTotal } from "./types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

export function generateQuotePdf(quote: Quote, customer: Customer | undefined) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Serenity Co-Living", marginX, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Senior Co-Living Community", marginX, 66);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("QUOTATION", pageWidth - marginX, 50, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Quote #: ${quote.quoteNumber}`, pageWidth - marginX, 68, { align: "right" });
  doc.text(`Date: ${quote.createdAt}`, pageWidth - marginX, 82, { align: "right" });
  doc.text(`Status: ${quote.status}`, pageWidth - marginX, 96, { align: "right" });

  doc.setDrawColor(210);
  doc.line(marginX, 112, pageWidth - marginX, 112);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", marginX, 134);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const billToLines = [
    customer?.companyName ?? "—",
    customer?.contactPerson,
    customer?.email,
    customer?.phone,
  ].filter((line): line is string => Boolean(line));
  billToLines.forEach((line, i) => doc.text(line, marginX, 150 + i * 14));

  const tableStartY = 150 + billToLines.length * 14 + 16;
  autoTable(doc, {
    startY: tableStartY,
    head: [["Description", "Qty", "Unit Price", "Line Total"]],
    body: quote.items.map((item) => [
      item.description,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice),
    ]),
    styles: { fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [24, 24, 27], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Grand Total: ${formatCurrency(quoteTotal(quote))}`, pageWidth - marginX, finalY, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "This quotation is generated for reference purposes. Prices are valid for 30 days from the date of issue.",
    marginX,
    finalY + 26,
    { maxWidth: pageWidth - marginX * 2 }
  );

  doc.save(`${quote.quoteNumber}.pdf`);
}
