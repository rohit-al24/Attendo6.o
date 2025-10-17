
import { useEffect, useState } from "react";
import CircularProgress from "../../components/CircularProgress";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface AttendanceRecord {
  student_id: string;
  subject: string;
  status: string;
  faculty_id: string;
}

interface SubjectStats {
  faculty_name: string;
  subject: string;
  present: number;
  absent: number;
  onduty: number;
  total: number;
  percentage: number;
}

const AdvisorAttendanceReport = () => {
  // State for advisor and section
  const [advisorName, setAdvisorName] = useState<string>("");
  const [section, setSection] = useState<string>("");
  // Download PDF handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    // Banner image
    const pageWidth = doc.internal.pageSize.getWidth();
    const bannerImg = new window.Image();
    bannerImg.src = '/banner.jpg';
    bannerImg.onload = function () {
      doc.addImage(bannerImg, 'JPEG', pageWidth / 2 - 200, 10, 400, 60);
      let y = 80;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
      y += 30;
      doc.setFontSize(11);
      doc.text(`Class Advisor: ${advisorName || "Advisor Name"}`, 40, y);
      doc.text(`Section: ${section || classId || "Section"}`, 300, y);
      y += 18;
      Object.entries(studentStats).forEach(([studentId, s], idx) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Student: ${s.name} (${s.roll})`, 40, y);
        doc.setFont("helvetica", "normal");
        y += 12;
        autoTable(doc, {
          startY: y,
          head: [["Faculty Name", "Subject", "Present", "Absent", "On Duty", "Total", "%"]],
          body: s.subjects.map(subj => [
            subj.faculty_name || "N/A",
            subj.subject || "N/A",
            subj.present,
            subj.absent,
            subj.onduty,
            subj.total,
            subj.percentage !== undefined ? `${subj.percentage.toFixed(2)}%` : "-"
          ]),
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [41, 128, 255], textColor: 255, fontSize: 10, halign: 'center' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 40, right: 40 },
          tableWidth: 'auto',
        });
        const lastAutoTable = (doc as any).lastAutoTable;
        if (lastAutoTable && lastAutoTable.finalY) {
          y = lastAutoTable.finalY + 18;
        }
      });
      doc.save("attendance_report.pdf");
    };
  // Class details
  doc.setFontSize(11);
  doc.text(`Class Advisor: ${advisorName || "Advisor Name"}`, 40, y);
  doc.text(`Section: ${section || classId || "Section"}`, 300, y);
    y += 18;
    Object.entries(studentStats).forEach(([studentId, s], idx) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Student: ${s.name} (${s.roll})`, 40, y);
      doc.setFont("helvetica", "normal");
      y += 12;
      autoTable(doc, {
        startY: y,
        head: [["Faculty Name", "Subject", "Present", "Absent", "On Duty", "Total", "%"]],
        body: s.subjects.map(subj => [
          subj.faculty_name || "N/A",
          subj.subject || "N/A",
          subj.present,
          subj.absent,
          subj.onduty,
          subj.total,
          subj.percentage !== undefined ? `${subj.percentage.toFixed(2)}%` : "-"
        ]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 255], textColor: 255, fontSize: 10, halign: 'center' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 40, right: 40 },
        tableWidth: 'auto',
      });
      const lastAutoTable = (doc as any).lastAutoTable;
      if (lastAutoTable && lastAutoTable.finalY) {
        y = lastAutoTable.finalY + 18;
      }
    });
    doc.save("attendance_report.pdf");
  };
  const [studentStats, setStudentStats] = useState<Record<string, { name: string; roll: string; subjects: SubjectStats[] }>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const classId = searchParams.get("classId") || "";

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      // Fetch attendance records for this class
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("student_id, subject, status, faculty_id")
        .eq("class_id", classId);
      if (attendanceError) {
        setLoading(false);
        return;
      }
      // Fetch all students for this class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, roll_number")
        .eq("class_id", classId);
      if (studentsError) {
        setLoading(false);
        return;
      }
      // Fetch all faculty (for name lookup)
      const { data: faculty, error: facultyError } = await supabase
        .from("faculty")
        .select("id, full_name");
      if (facultyError) {
        setLoading(false);
        return;
      }
      // Fetch class details (section, department)
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("section, department")
        .eq("id", classId)
        .single();
      if (!classError && classData) {
        setSection(classData.section || "");
      }
      // Fetch advisor from faculty table
      const { data: advisorData, error: advisorError } = await supabase
        .from("faculty")
        .select("full_name")
        .eq("advisor_class_id", classId)
        .eq("is_class_advisor", true)
        .single();
      if (!advisorError && advisorData) {
        setAdvisorName(advisorData.full_name || "");
      }
      // Build lookup maps
      const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]));
      const facultyMap = Object.fromEntries((faculty || []).map((f: any) => [f.id, f]));
      // Group by student, then by subject+faculty
      const stats: Record<string, { name: string; roll: string; subjects: Record<string, SubjectStats> }> = {};
      (attendance || []).forEach((r: any) => {
        const studentId = r.student_id;
        const student = studentMap[studentId] || {};
        const studentName = student.full_name || "";
        const roll = student.roll_number || "";
        const facultyName = facultyMap[r.faculty_id]?.full_name || "";
        const key = `${r.subject}__${facultyName}`;
        if (!stats[studentId]) {
          stats[studentId] = { name: studentName, roll, subjects: {} };
        }
        if (!stats[studentId].subjects[key]) {
          stats[studentId].subjects[key] = {
            faculty_name: facultyName,
            subject: r.subject,
            present: 0,
            absent: 0,
            onduty: 0,
            total: 0,
            percentage: 0
          };
        }
        // Count status
        if (r.status === "present") stats[studentId].subjects[key].present++;
        else if (r.status === "absent") stats[studentId].subjects[key].absent++;
        else if (r.status === "onduty") stats[studentId].subjects[key].onduty++;
        stats[studentId].subjects[key].total++;
      });
      // Calculate percentage
      Object.values(stats).forEach(student => {
        Object.values(student.subjects).forEach(subj => {
          subj.percentage = subj.total > 0 ? (subj.present / subj.total) * 100 : 0;
        });
      });
      // Convert to display format
      const displayStats: Record<string, { name: string; roll: string; subjects: SubjectStats[] }> = {};
      Object.entries(stats).forEach(([studentId, s]) => {
        displayStats[studentId] = {
          name: s.name,
          roll: s.roll,
          subjects: Object.values(s.subjects),
        };
      });
      setStudentStats(displayStats);
      setLoading(false);
    })();
  }, [classId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-center w-full">Attendance Report</h1>
          <button
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CircularProgress percentage={50} />
            <span className="mt-4 text-lg text-gray-500">Loading attendance report...</span>
          </div>
        ) : (
          <Card className="shadow-lg overflow-x-auto p-6">
            {Object.entries(studentStats).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No attendance records found.</div>
            ) : (
              Object.entries(studentStats).map(([studentId, s]) => (
                <div key={studentId} className="mb-10">
                  <div className="font-bold text-xl mb-3 text-gray-800 flex items-center justify-between">
                    <span>Student: {s.name} <span className="text-gray-500">({s.roll})</span></span>
                  </div>
                  <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex bg-gray-100 text-gray-700 font-semibold text-sm">
                      <div className="w-1/6 px-3 py-2 border-r">Faculty</div>
                      <div className="w-1/6 px-3 py-2 border-r">Subject</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Present</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Absent</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">On Duty</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Total</div>
                      <div className="w-1/6 px-3 py-2 text-center">%</div>
                    </div>
                    {s.subjects.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">No attendance data available</div>
                    ) : (
                      s.subjects.map((subj, idx) => (
                        <div key={idx} className={`flex text-sm items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0`}>
                          <div className="w-1/6 px-3 py-2 border-r">{subj.faculty_name || <span className="text-gray-400">N/A</span>}</div>
                          <div className="w-1/6 px-3 py-2 border-r">{subj.subject || <span className="text-gray-400">N/A</span>}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{subj.present}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{subj.absent}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{subj.onduty}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{subj.total}</div>
                          <div className="w-1/6 px-3 py-2 text-center">{subj.percentage !== undefined ? subj.percentage.toFixed(2) + "%" : "-"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

export default AdvisorAttendanceReport;
