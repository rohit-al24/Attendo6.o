import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Book } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@/components/CircularProgress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;
  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/student-login");
      }
    });
  }, [navigate]);

  // Mock student data - In real app, this would come from backend
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
        .select('subject, status, faculty_id')
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

      // Subject-wise attendance grouped by subject, counting unique faculty
      const subjectsMap: Record<string, { present: number; total: number; facultyIds: Set<string>; subject: string }> = {};
      data.forEach((r: any) => {
        if (!subjectsMap[r.subject]) subjectsMap[r.subject] = { present: 0, total: 0, facultyIds: new Set(), subject: r.subject };
        subjectsMap[r.subject].total++;
        if (r.status === 'present') subjectsMap[r.subject].present++;
        if (r.faculty_id) subjectsMap[r.subject].facultyIds.add(r.faculty_id);
      });
      setSubjects(Object.values(subjectsMap).map(stats => ({
        name: stats.subject,
        attendance: stats.total ? Math.round((stats.present / stats.total) * 1000) / 10 : 0,
        present: stats.present,
        total: stats.total,
        facultyNames: Array.from(stats.facultyIds).map(fid => facultyMap[fid] || 'Unknown'),
        facultyCount: stats.facultyIds.size
      })));
    };
    fetchAttendance();
  }, [student, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {student?.full_name}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/login-selection")}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
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

        {/* Subject-wise Attendance */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-primary" />
              Subject-wise Attendance
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, index) => (
                <Card key={index} className="border-2 hover:border-primary transition-smooth">
                  <div className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    <div className="flex justify-center">
                      <CircularProgress 
                        percentage={subject.attendance}
                        size={120}
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Present: {subject.present} / {subject.total}</p>
                      {subject.facultyCount > 0 && (
                        <p>
                          Attendance marked by: {subject.facultyNames.join(', ')} ({subject.facultyCount})
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
