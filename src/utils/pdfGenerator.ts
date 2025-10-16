import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AttendanceData {
  subject: string;
  attendance: number;
  present: number;
  total: number;
}

export interface StudentData {
  name: string;
  rollNumber: string;
  department: string;
  className: string;
  overallAttendance: number;
  subjects: AttendanceData[];
}

export const generateAttendancePDF = (studentData: StudentData) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Report", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 14, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${studentData.name}`, 14, 48);
  doc.text(`Roll Number: ${studentData.rollNumber}`, 14, 55);
  doc.text(`Department: ${studentData.department}`, 14, 62);
  doc.text(`Class: ${studentData.className}`, 14, 69);
  doc.text(`Overall Attendance: ${studentData.overallAttendance.toFixed(2)}%`, 14, 76);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Subject-wise Attendance", 14, 90);

  const tableData = studentData.subjects.map((subject) => [
    subject.subject,
    subject.present.toString(),
    subject.total.toString(),
    `${subject.attendance.toFixed(2)}%`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Subject", "Present", "Total", "Percentage"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  const fileName = `${studentData.rollNumber}_Attendance_Report.pdf`;
  doc.save(fileName);
};

export interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  faculty: string;
}

export const generateTimetablePDF = (className: string, timetable: TimetableEntry[]) => {
  const doc = new jsPDF("landscape");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`Class Timetable - ${className}`, 148, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148, 28, { align: "center" });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = 7;

  const tableData: string[][] = [];

  for (let period = 1; period <= periods; period++) {
    const row = [`Period ${period}`];
    for (const day of days) {
      const entry = timetable.find((t) => t.day === day && t.period === period);
      if (entry) {
        row.push(`${entry.subject}\n(${entry.faculty})`);
      } else {
        row.push("-");
      }
    }
    tableData.push(row);
  }

  autoTable(doc, {
    startY: 35,
    head: [["Period", ...days]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
    },
    styles: {
      minCellHeight: 15,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  const fileName = `${className.replace(/ /g, "_")}_Timetable.pdf`;
  doc.save(fileName);
};
