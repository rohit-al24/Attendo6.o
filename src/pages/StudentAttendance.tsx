
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CircularProgress from "@/components/CircularProgress";
import { Card } from "@/components/ui/card";
import { Book } from "lucide-react";

const StudentAttendance = () => {
  const location = useLocation();
  const student = location.state?.student;
  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (!student) return;
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
  }, [student]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <main className="container mx-auto px-4 py-8 space-y-6">
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

        {/* Detailed Attendance Records Table */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-primary" />
              Detailed Attendance Records
            </h2>
            <table className="w-full text-center border">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Subject</th>
                  <th>Period</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>On Duty</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.facultyName}</td>
                    <td>{row.subject}</td>
                    <td>{row.period}</td>
                    <td>{row.present}</td>
                    <td>{row.absent}</td>
                    <td>{row.onduty}</td>
                    <td>{row.total}</td>
                    <td>{row.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default StudentAttendance;
