import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import attendoLogo from "@/assets/attendo-logo.png";
import collegeBanner from "@/assets/college-banner.jpg";

export function generateReportCardPDF({
  student,
  year,
  department,
  section,
  assessments,
  total,
  average,
  cgpa,
}) {
  const doc = new jsPDF();

// Banner
doc.addImage("/public/banner.png", "PNG", 10, 10, 190, 25);

  // Logo
  doc.addImage(attendoLogo, "PNG", 10, 40, 25, 25);

  // Student Info Grid
  doc.setFontSize(12);
  doc.text(`Name: ${student.full_name || "-"}`, 40, 50);
  doc.text(`Year: ${year || "-"}`, 120, 50);
  doc.text(`Department: ${department || "-"}`, 40, 58);
  doc.text(`Section: ${section || "-"}`, 120, 58);

  // Table
  autoTable(doc, {
    startY: 70,
    head: [["Course Code", "Course Name", "Marks Obtained", "Grade"]],
    body: assessments.map(a => [a.code, a.title, a.marks ?? "-", a.grade ?? "-"]),
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 10 },
  });

  // Totals
  const afterTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 100;
  doc.setFontSize(12);
  doc.text(`Total: ${total || 0}`, 10, afterTableY + 10);
  doc.text(`Average: ${average || 0}`, 60, afterTableY + 10);
  doc.text(`CGPA: ${cgpa || 0}`, 120, afterTableY + 10);

  // Signature Banner
  doc.setFillColor(255, 255, 255);
  doc.rect(10, afterTableY + 20, 190, 25, "F");
  doc.setFontSize(10);
  doc.text("Signatures:", 15, afterTableY + 35);
  // Leave space for 3 signatures
  doc.line(50, afterTableY + 40, 90, afterTableY + 40);
  doc.line(100, afterTableY + 40, 140, afterTableY + 40);
  doc.line(150, afterTableY + 40, 190, afterTableY + 40);

  doc.save("report-card.pdf");
}
