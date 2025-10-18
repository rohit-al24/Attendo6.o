import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import CircularProgress from "@/components/CircularProgress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const student = location.state?.student;
  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);

  useEffect(() => {
    if (!student) {
      navigate('/student-login');
      return;
    }
    // Fetch class info
    const fetchClass = async () => {
      const { data } = await supabase
        .from('classes')
        .select('class_name, department')
        .eq('id', student.class_id)
        .single();
      setClassInfo(data);
    };
    fetchClass();

    // Fetch attendance records for student
    const fetchAttendance = async () => {
      const { data } = await supabase
        .from('attendance_records')
        .select('subject, status, faculty_id, period_number')
        .eq('student_id', student.id);
      if (!data) return;
      // Calculate overall attendance
      const total = data.length;
      const present = data.filter((r: any) => r.status === 'present').length;
      setAttendance(total ? Math.round((present / total) * 1000) / 10 : 0);

      // Fetch faculty names for faculty_ids present
      const facultyIds = Array.from(new Set(data.map((r: any) => r.faculty_id).filter(Boolean)));
      let facultyMap: Record<string, string> = {};
      if (facultyIds.length > 0) {
        const { data: facultyData } = await supabase
          .from('faculty')
          .select('id, full_name')
          .in('id', facultyIds);
        if (facultyData) facultyData.forEach((f: any) => { facultyMap[f.id] = f.full_name; });
      }

      // Group attendance records by subject, period, and faculty
      const grouped: Record<string, any[]> = {};
      data.forEach((r: any) => {
        const key = `${r.subject}|${r.period_number}|${r.faculty_id}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      // Prepare rows for table
      const rows = Object.entries(grouped).map(([key, records]) => {
        const [subject, period, facultyId] = key.split('|');
        const present = records.filter((r: any) => r.status === 'present').length;
        const absent = records.filter((r: any) => r.status === 'absent').length;
        const onduty = records.filter((r: any) => r.status === 'onduty').length;
        const total = records.length;
        return {
          facultyName: facultyMap[facultyId] || 'Unknown',
          subject,
          period,
          present,
          absent,
          onduty,
          total,
          percentage: total ? ((present / total) * 100).toFixed(2) + '%' : '0%'
        };
      });
      setSubjects(rows);
    };
    fetchAttendance();
  }, [student, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-primary" /> Attendance Details
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Student Info Card */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-primary" />
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
        <Card className="shadow-medium mb-6">
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
        {/* Subject-wise Attendance Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Book className="w-6 h-6 text-primary" />
            Subject-wise Attendance
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {subjects.map((row, idx) => {
              // Color palette for cards
              const colors = [
                "from-blue-500 to-blue-700",
                "from-green-500 to-green-700",
                "from-yellow-400 to-yellow-600",
                "from-pink-500 to-pink-700",
                "from-purple-500 to-purple-700",
                "from-gray-500 to-gray-700"
              ];
              const color = colors[idx % colors.length];
              return (
                <Card key={idx} className={`shadow-lg bg-gradient-to-br ${color} text-white flex flex-col items-center p-6`}>
                  <div className="flex items-center gap-3 mb-2 w-full justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">{row.subject}</span>
                      <span className="text-sm opacity-80">Period: {row.period}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{row.facultyName}</span>
                      <span className="text-xs opacity-80">Faculty</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-full mb-4">
                    <CircularProgress
                      percentage={Math.floor(parseFloat(row.percentage))}
                      size={120}
                      strokeWidth={12}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full text-center">
                    <div>
                      <span className="block text-xs">Present</span>
                      <span className="block text-lg font-bold">{row.present}</span>
                    </div>
                    <div>
                      <span className="block text-xs">Absent</span>
                      <span className="block text-lg font-bold">{row.absent}</span>
                    </div>
                    <div>
                      <span className="block text-xs">On Duty</span>
                      <span className="block text-lg font-bold">{row.onduty}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs opacity-80">Total: {row.total}</div>
                  <div className="mt-1 text-xs font-semibold">Attendance: {row.percentage}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;
