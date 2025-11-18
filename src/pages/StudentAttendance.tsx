import { Card } from "@/components/ui/card";
import { User, Book } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";
import CircularProgress from "@/components/CircularProgress";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateStudent = (location.state as any)?.student;
  const student = useMemo(() => {
    if (stateStudent) return stateStudent;
    try {
      const str = sessionStorage.getItem("student");
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }, [stateStudent]);

  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);

  // No auth gating for students; rely on in-app login and sessionStorage

  useEffect(() => {
    if (!student) {
      navigate('/student-login');
      return;
    }
    const fetchClass = async () => {
      const { data } = await supabase
        .from('classes')
        .select('class_name, department')
        .eq('id', student.class_id)
        .single();
      setClassInfo(data);
    };
    fetchClass();

    const fetchAttendance = async () => {
      const { data } = await supabase
        .from('attendance_records')
        .select('subject, status, faculty_id, period_number')
        .eq('student_id', student.id);
      if (!data) return;
  const total = data.length;
  const present = data.filter((r: any) => r.status === 'present').length;
  const onduty = data.filter((r: any) => r.status === 'onduty').length;
  // Percentage should treat Present + OnDuty as present for percentage calculation only
  const effectivePresent = present + onduty;
  setAttendance(total ? Math.round((effectivePresent / total) * 1000) / 10 : 0);

      const facultyIds = Array.from(new Set(data.map((r: any) => r.faculty_id).filter(Boolean)));
      let facultyMap: Record<string, string> = {};
      if (facultyIds.length > 0) {
        const { data: facultyData } = await supabase
          .from('faculty')
          .select('id, full_name')
          .in('id', facultyIds);
        if (facultyData) facultyData.forEach((f: any) => { facultyMap[f.id] = f.full_name; });
      }

      const grouped: Record<string, any[]> = {};
      data.forEach((r: any) => {
        const key = `${r.subject}|${r.period_number}|${r.faculty_id}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      const rows = Object.entries(grouped).map(([key, records]) => {
        const [subject, period, facultyId] = key.split('|');
        const present = records.filter((r: any) => r.status === 'present').length;
        const absent = records.filter((r: any) => r.status === 'absent').length;
        const onduty = records.filter((r: any) => r.status === 'onduty').length;
        const leave = records.filter((r: any) => r.status === 'leave').length;
        const total = records.length;
        // Percentage uses present + onduty as present (leave counted as absent for percentage only)
        const effectivePresentPerRow = present + onduty;
        return {
          facultyName: facultyMap[facultyId] || 'Unknown',
          subject,
          period,
          present,
          absent,
          onduty,
          leave,
          total,
          percentage: total ? ((effectivePresentPerRow / total) * 100).toFixed(2) + '%' : '0%'
        };
      });
      setSubjects(rows);
    };
    fetchAttendance();
  }, [student, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Attendance" />
      

  <main className="container mx-auto px-4 py-8 space-y-6 pb-20">
        {/* Student Info Card */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              Student Information
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold">{student?.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="text-lg font-semibold">{student?.roll_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-semibold">{classInfo?.department || '-'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Attendance */}
        <Card className="shadow-medium">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold">Overall Attendance</h2>
            <div className="flex justify-center py-4">
              <CircularProgress 
                percentage={attendance} 
                size={160}
                strokeWidth={12}
              />
            </div>
          </div>
        </Card>

        {/* Detailed Attendance Records Grid for Mobile */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-primary" />
              Detailed Attendance Records
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((row, idx) => {
                // Remove decimal from percentage string (e.g., '50.00%' -> 50)
                // Remove decimal from percentage string (e.g., '50.00%' -> 50)
                const percentInt = Math.round(parseFloat(row.percentage));
                // Assume leave is counted as status === 'leave' in records, fallback to 0 if not present
                const leave = row.leave !== undefined ? row.leave : (row.leaves !== undefined ? row.leaves : 0);
                return (
                  <div key={idx} className="border rounded-xl p-2 flex flex-col items-center bg-muted/50 min-h-[180px] h-auto justify-start">
                    <div className="flex flex-col items-center w-full mt-2">
                      <CircularProgress percentage={percentInt} size={110} strokeWidth={10} />
                    </div>
                    <div className="mt-1 text-center w-full">
                      <div className="font-semibold text-primary text-base leading-tight">{row.subject}</div>
                      <div className="text-xs text-muted-foreground">Faculty: {row.facultyName}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs w-full mt-2 mb-0">
                      <div className="bg-background rounded p-1 flex flex-col items-center">
                        <span className="text-muted-foreground">Present</span>
                        <b>{row.present}</b>
                      </div>
                      <div className="bg-background rounded p-1 flex flex-col items-center">
                        <span className="text-muted-foreground">Absent</span>
                        <b>{row.absent}</b>
                      </div>
                      <div className="bg-background rounded p-1 flex flex-col items-center">
                        <span className="text-muted-foreground">Leave</span>
                        <b>{leave}</b>
                      </div>
                      <div className="bg-background rounded p-1 flex flex-col items-center">
                        <span className="text-muted-foreground">On Duty</span>
                        <b>{row.onduty}</b>
                      </div>
                      <div className="bg-background rounded p-1 flex flex-col items-center">
                        <span className="text-muted-foreground">Total</span>
                        <b>{row.total}</b>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </main>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <StudentTabBar />
      </div>
    </div>
  );
};

export default StudentAttendance;
