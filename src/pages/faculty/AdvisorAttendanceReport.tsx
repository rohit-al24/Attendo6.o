import { useEffect, useState } from "react";
import CircularProgress from "../../components/CircularProgress";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";

// Add this declaration to inform TypeScript about AndroidInterface
declare global {
  interface Window {
    AndroidInterface?: {
      goBack?: () => void;
    };
  }
}

type AttendanceStatus = "present" | "absent" | "leave" | "onduty";

interface AttendanceRecord {
  student_id: string;
  subject: string | null;
  status: AttendanceStatus;
  faculty_id: string | null;
}

interface FacultyWiseStats {
  faculty_name: string;
  subject: string;
  present: number;
  absent: number;
  leave: number;
  onduty: number;
  total: number;
  percentage: number;
}

interface StudentStats {
  name: string;
  roll: string;
  overall: {
    present: number;
    absent: number;
    leave: number;
    onduty: number;
    total: number;
    percentage: number;
  };
  facultyWise: Record<string, FacultyWiseStats>;
}

const AdvisorAttendanceReport = ({ classId: propClassId }: { classId?: string }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const classId = propClassId || searchParams.get("classId") || "";
  const navigate = useNavigate();

  const [advisorName, setAdvisorName] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [studentStats, setStudentStats] = useState<Record<string, StudentStats>>({});
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;

    // Helper to load image, return data URL and natural size
    type BannerAsset = { dataUrl: string; width: number; height: number };
    const loadImageAsset = (src: string) => new Promise<BannerAsset>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context unavailable'));
          ctx.drawImage(img, 0, 0);
          resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
        } catch (e) {
          reject(e as any);
        }
      };
      img.onerror = () => reject(new Error('Failed to load banner image'));
      img.src = src;
    });

    let bannerAsset: BannerAsset | null = null;
    let logoAsset: BannerAsset | null = null;
    try {
      bannerAsset = await loadImageAsset('/banner.png');
    } catch {
      bannerAsset = null;
    }
    try {
      logoAsset = await loadImageAsset('/att_black_tran.png');
    } catch {
      logoAsset = null;
    }

    const getHeaderHeight = (pageNumber: number) => {
      // First page: large header if banner present; other pages: compact header
      if (pageNumber === 1 && bannerAsset) {
        const bannerTargetW = pageWidth - marginX * 2;
        const aspect = bannerAsset.height / bannerAsset.width;
        const bannerDrawH = Math.max(70, Math.min(120, bannerTargetW * aspect));
        return 12 + bannerDrawH + 16 + 12 + 10; // top pad + banner + gap + info row + pad
      }
      // Compact header height for subsequent pages
      return 70;
    };

    const headerFooter = (data: any) => {
      const isFirst = data.pageNumber === 1;
      // Watermark app logo on every page (center, big, faded)
      if (logoAsset) {
        const wmW = 260;
        const aspect = logoAsset.height / logoAsset.width;
        const wmH = wmW * aspect;
        const wmX = (pageWidth - wmW) / 2;
        const wmY = (pageHeight - wmH) / 2;
        // Ensure logo is loaded before drawing
        let fadedLogo = logoAsset.dataUrl;
        let logoReady = false;
        try {
          const img = new window.Image();
          img.src = logoAsset.dataUrl;
          img.onload = () => {
            logoReady = true;
            const canvas = document.createElement('canvas');
            canvas.width = logoAsset.width;
            canvas.height = logoAsset.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              for (let i = 0; i < imageData.data.length; i += 4) {
                const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
                imageData.data[i] = avg;
                imageData.data[i+1] = avg;
                imageData.data[i+2] = avg;
              }
              ctx.putImageData(imageData, 0, 0);
              fadedLogo = canvas.toDataURL('image/png');
            }
          };
        } catch {
          fadedLogo = logoAsset.dataUrl;
        }
        // Use slightly higher opacity for visibility
        try {
          if (typeof doc.setGState === 'function') {
            doc.setGState({ opacity: 0.002 });
            doc.addImage(fadedLogo, 'PNG', wmX, wmY, wmW, wmH);
            doc.setGState({ opacity: 0.006 });
          } else {
            doc.addImage(fadedLogo, 'PNG', wmX, wmY, wmW, wmH);
          }
        } catch {
          doc.addImage(fadedLogo, 'PNG', wmX, wmY, wmW, wmH);
        }
      }

      if (isFirst) {
        // Header background strip sized to content (only on first page)
        const headerH = getHeaderHeight(1);
        doc.setDrawColor(226);
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, headerH, 'F');
      }

      // Banner only on first page
      if (isFirst && bannerAsset) {
        const bannerW = pageWidth - marginX * 2;
        const aspect = bannerAsset.height / bannerAsset.width;
        const bannerH = Math.max(70, Math.min(120, bannerW * aspect));
        // Center horizontally within margins
        doc.addImage(bannerAsset.dataUrl, 'PNG', marginX, 12, bannerW, bannerH);
        // Header info row
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const infoY = 12 + bannerH + 20; // extra gap below banner
        doc.setTextColor(34, 34, 34);
        doc.text(`Advisor: ${advisorName || '-'}`, marginX, infoY);
        doc.text(`Class/Section: ${section || classId || '-'}`, pageWidth / 2, infoY, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - marginX, infoY, { align: 'right' });
      } else if (isFirst) {
        // Fallback title if no banner
        doc.setTextColor(34, 34, 34);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Attendance Report', pageWidth / 2, 28, { align: 'center' });
        // Info row when no banner
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const infoY = 48;
        doc.text(`Advisor: ${advisorName || '-'}`, marginX, infoY);
        doc.text(`Class/Section: ${section || classId || '-'}`, pageWidth / 2, infoY, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - marginX, infoY, { align: 'right' });
      }

      // Footer (page number) - fallback to data.pageNumber if getCurrentPageInfo is unavailable
      let pageNum = data.pageNumber;
      try {
        if (typeof doc.getCurrentPageInfo === 'function') {
          pageNum = doc.getCurrentPageInfo().pageNumber;
        }
      } catch {}
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 16, { align: 'right' });
    };

  const firstPageTop = getHeaderHeight(1); // header height on first page
  const otherPagesTop = 150; // compact top margin for subsequent pages
  let cursorY = firstPageTop + 35; // content start below header

    const drawStudentBlock = (s: StudentStats) => {
      // Student heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30);
      doc.text(`Student: ${s.name} (${s.roll})`, marginX, cursorY);
      cursorY += 8;
      doc.setDrawColor(220);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 8;

      // Overall summary table
      autoTable(doc, {
        startY: cursorY,
        theme: 'grid',
        head: [['Present', 'Absent', 'Leave', 'On Duty', 'Total Classes', '%']],
        body: [[
          s.overall.present,
          s.overall.absent,
          s.overall.leave,
          s.overall.onduty,
          s.overall.total,
          `${s.overall.percentage.toFixed(2)}%`
        ]],
        styles: { fontSize: 9, cellPadding: 4, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [25, 103, 210], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 251] },
        margin: { left: marginX, right: marginX, top: otherPagesTop },
        didDrawPage: headerFooter,
      });
      const afterOverall = (doc as any).lastAutoTable?.finalY || cursorY + 24;
      cursorY = afterOverall + 10;

      // Faculty-wise detailed table
      const facultyRows = (Object.values(s.facultyWise) as FacultyWiseStats[]).map((fw) => [
        fw.faculty_name,
        fw.subject,
        fw.present,
        fw.absent,
        fw.leave,
        fw.onduty,
        fw.total,
        `${fw.percentage.toFixed(2)}%`
      ]);

      autoTable(doc, {
        startY: cursorY,
        theme: 'grid',
        head: [['Faculty', 'Subject', 'P', 'A', 'L', 'OD', 'Total', '%']],
        body: facultyRows.length ? facultyRows : [['—', '—', 0, 0, 0, 0, 0, '0.00%']],
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: marginX, right: marginX, top: otherPagesTop },
        columnStyles: {
          0: { cellWidth: 150 }, // Faculty
          1: { cellWidth: 140 }, // Subject
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
        },
        didDrawPage: headerFooter,
      });
      cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 18;
    };

    // Iterate students in a stable order (by roll)
    const ordered = (Object.entries(studentStats) as [string, StudentStats][])
      .sort(([, a], [, b]) => a.roll.localeCompare(b.roll));

    if (!ordered.length) {
      // still draw header/footer for a blank report
      headerFooter({ pageNumber: 1 });
    } else {
      ordered.forEach(([_, s], idx) => {
        if (idx > 0 && cursorY > pageHeight - 160) {
          doc.addPage();
          // start near top for next pages, leaving a small margin
          cursorY = otherPagesTop + 16;
        }
        drawStudentBlock(s);
      });
    }

    const pdfBlob = doc.output('blob');
if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], 'attendance_report.pdf', { type: 'application/pdf' })] })) {
  // Use Web Share API
  const file = new File([pdfBlob], 'attendance_report.pdf', { type: 'application/pdf' });
  navigator.share({
    title: 'Attendance Report',
    text: 'Here is the attendance report PDF.',
    files: [file]
  });
} else {
  // Fallback to download
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance_report.pdf';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
  };

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      // 1) Fetch students for this class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, roll_number")
        .eq("class_id", classId);
      if (studentsError) { setLoading(false); return; }

      const validStudentIds = (students || []).map((s: any) => s.id);

      // 2) Fetch attendance for these students with pagination to avoid 1000-row limit
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let attendance: AttendanceRecord[] = [];
      while (true) {
        const { data: page, error: pageError } = await supabase
          .from("attendance_records")
          .select("student_id, subject, status, faculty_id")
          .in("student_id", validStudentIds.length ? validStudentIds : ["-"])
          .range(from, to);
        if (pageError) { setLoading(false); return; }
        attendance = attendance.concat((page as AttendanceRecord[]) || []);
        if (!page || page.length < pageSize) break;
        from += pageSize;
        to += pageSize;
      }

      const { data: classData } = await supabase
        .from("classes")
        .select("section")
        .eq("id", classId)
        .single();
      if (classData) setSection(classData.section || "");

      const { data: advisorData } = await supabase
        .from("faculty")
        .select("full_name")
        .eq("advisor_class_id", classId)
        .eq("is_class_advisor", true)
        .single();
      if (advisorData) setAdvisorName(advisorData.full_name || "");

  const validStudentIdsSet = new Set((students || []).map((s: any) => s.id));
      const stats: Record<string, StudentStats> = {};

      (students || []).forEach((st: any) => {
        stats[st.id] = {
          name: st.full_name,
          roll: st.roll_number,
          overall: { present: 0, absent: 0, leave: 0, onduty: 0, total: 0, percentage: 0 },
          facultyWise: {}
        };
      });

      // Prefetch faculty names for referenced IDs
      const facultyIds = Array.from(
        new Set(((attendance || []) as AttendanceRecord[]).map(a => a.faculty_id).filter((v): v is string => !!v))
      );
      let facultyNameCache: Record<string, string> = {};
      if (facultyIds.length > 0) {
        const { data: faculties } = await supabase
          .from("faculty")
          .select("id, full_name")
          .in("id", facultyIds);
        facultyNameCache = Object.fromEntries((faculties || []).map((f: any) => [f.id, f.full_name || "Unknown"]));
      }

      for (const r of (attendance || []) as AttendanceRecord[]) {
        if (!validStudentIdsSet.has(r.student_id)) continue;
        const s = stats[r.student_id];
        if (!s) continue;

        // overall
        if (r.status === "present") s.overall.present++;
        else if (r.status === "absent") s.overall.absent++;
        else if (r.status === "leave") s.overall.leave++;
        else if (r.status === "onduty") s.overall.onduty++;
        s.overall.total++;

        // faculty-wise
        const facultyName = r.faculty_id ? (facultyNameCache[r.faculty_id] || "Unknown") : "Unknown";
        const key = `${r.faculty_id || "unknown"}_${r.subject || "Unknown"}`;
        if (!s.facultyWise[key]) {
          s.facultyWise[key] = {
            faculty_name: facultyName,
            subject: r.subject || "Unknown",
            present: 0,
            absent: 0,
            leave: 0,
            onduty: 0,
            total: 0,
            percentage: 0,
          };
        }
        const fw = s.facultyWise[key];
        if (r.status === "present") fw.present++;
        else if (r.status === "absent") fw.absent++;
        else if (r.status === "leave") fw.leave++;
        else if (r.status === "onduty") fw.onduty++;
        fw.total++;
      }

      Object.values(stats).forEach((s) => {
        // For percentage only, treat Present + OnDuty as present. Keep raw counts unchanged.
        const effectiveOverallPresent = s.overall.present + s.overall.onduty;
        s.overall.percentage = s.overall.total ? (effectiveOverallPresent / s.overall.total) * 100 : 0;
        Object.values(s.facultyWise).forEach((fw) => {
          const effectiveFwPresent = fw.present + fw.onduty;
          fw.percentage = fw.total ? (effectiveFwPresent / fw.total) * 100 : 0;
        });
      });

      setStudentStats(stats);
      setLoading(false);
    })();
  }, [classId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Advisor Report" />
      {/* Minimal status bar/header for Android and browser */}
      {/* ...existing code... */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-center w-full">Attendance Report</h1>
          <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition" onClick={handleDownloadPDF}>Download PDF</button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CircularProgress percentage={50} />
            <span className="mt-4 text-lg text-gray-500">Loading attendance report...</span>
          </div>
        ) : (
          <Card className="shadow-lg overflow-x-auto p-6">
            {(Object.entries(studentStats) as [string, StudentStats][]).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No attendance records found.</div>
            ) : (
              (Object.entries(studentStats) as [string, StudentStats][])?.map(([studentId, s]) => (
                <div key={studentId} className="mb-10">
                  <div className="font-bold text-xl mb-3 text-gray-800 flex items-center justify-between">
                    <span>Student: {s.name} <span className="text-gray-500">({s.roll})</span></span>
                  </div>
                  <div className="w-full rounded-lg border border-gray-200 overflow-hidden mb-4">
                    <div className="flex bg-gray-100 text-gray-700 font-semibold text-sm">
                      <div className="w-1/6 px-3 py-2 border-r text-center">Present</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Absent</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Leave</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">On Duty</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Total</div>
                      <div className="w-1/6 px-3 py-2 text-center">%</div>
                    </div>
                    <div className="flex text-sm items-center bg-white border-b last:border-b-0">
                      <div className="w-1/6 px-3 py-2 border-r text-center">{s.overall.present}</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">{s.overall.absent}</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">{s.overall.leave}</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">{s.overall.onduty}</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">{s.overall.total}</div>
                      <div className="w-1/6 px-3 py-2 text-center">{s.overall.percentage.toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex bg-gray-50 text-gray-700 font-semibold text-sm">
                      <div className="w-1/6 px-3 py-2 border-r text-center">Faculty</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Subject</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Present</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Absent</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Leave</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">On Duty</div>
                      <div className="w-1/6 px-3 py-2 border-r text-center">Total</div>
                      <div className="w-1/6 px-3 py-2 text-center">%</div>
                    </div>
                    {(Object.values(s.facultyWise) as FacultyWiseStats[]).length === 0 ? (
                      <div className="text-center py-6 text-gray-400">No detailed attendance data available</div>
                    ) : (
                      (Object.values(s.facultyWise) as FacultyWiseStats[]).map((fw: FacultyWiseStats, idx: number) => (
                        <div key={idx} className={`flex text-sm items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0`}>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.faculty_name}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.subject}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.present}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.absent}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.leave}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.onduty}</div>
                          <div className="w-1/6 px-3 py-2 border-r text-center">{fw.total}</div>
                          <div className="w-1/6 px-3 py-2 text-center">{fw.percentage.toFixed(2)}%</div>
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
};

export default AdvisorAttendanceReport;
