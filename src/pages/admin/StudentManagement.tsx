import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CircularProgress from "@/components/CircularProgress";
import MobileHeader from "@/components/MobileHeader";

const StudentManagement = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [classList, setClassList] = useState<any[]>([]);

  // Real data from DB
  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>({ name: '', advisor: '', overallAttendance: 0, totalStudents: 0 });

  // Fetch all classes for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, class_name, year, section, department');
      setClassList(data || []);
    };
    fetchClasses();
  }, []);

  // Fetch students and attendance from DB when class changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchData = async () => {
      // Fetch class by id
      const classData = classList.find(cls => cls.id === selectedClass);
      if (!classData) return;
      // Fetch advisor name from faculty table where advisor_class_id matches class id
      let advisorName = '';
      const { data: advisorData } = await supabase
        .from('faculty')
        .select('full_name')
        .eq('advisor_class_id', classData.id)
        .eq('is_class_advisor', true)
        .maybeSingle();
      advisorName = advisorData?.full_name || '';
      // Fetch students in class
      const { data: studentData } = await supabase
        .from('students')
        .select('id, roll_number, full_name')
        .eq('class_id', classData.id);
      // For each student, fetch attendance percentage
      const studentsWithAttendance = await Promise.all((studentData || []).map(async (student: any) => {
        const { data: attendanceRecords } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('student_id', student.id);
        const total = attendanceRecords?.length || 0;
        const present = attendanceRecords?.filter((r: any) => r.status === 'present').length || 0;
        const attendance = total ? Math.round((present / total) * 1000) / 10 : 0;
        return {
          rollNo: student.roll_number,
          name: student.full_name,
          attendance
        };
      }));
      // Calculate class average
      const overallAttendance = studentsWithAttendance.length
        ? Math.round((studentsWithAttendance.reduce((sum, s) => sum + s.attendance, 0) / studentsWithAttendance.length) * 10) / 10
        : 0;
      setClassInfo({
        name: `${classData.year} Year - ${classData.class_name}`,
        advisor: advisorName,
        overallAttendance,
        totalStudents: studentsWithAttendance.length
      });
      setStudents(studentsWithAttendance);
    };
    fetchData();
  }, [selectedClass, classList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Student Management" />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Student Management</h1>

        {/* Class Selection */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Select Class</h2>
            <div className="space-y-2 max-w-xl">
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classList.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.class_name} - {cls.year} Year {cls.department} {cls.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Class Overview */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{classInfo.name}</h2>
              <Button className="gradient-primary">
                <Download className="w-4 h-4 mr-2" />
                Download Class Report
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Class Advisor</p>
                <p className="text-lg font-semibold">{classInfo.advisor}</p>
                <p className="text-sm text-muted-foreground mt-4">Total Students</p>
                <p className="text-lg font-semibold">{classInfo.totalStudents}</p>
              </div>
              <div className="flex justify-center">
                <CircularProgress 
                  percentage={classInfo.overallAttendance}
                  size={140}
                  strokeWidth={10}
                  label="Class Average"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Student List */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Students</h2>
              <div className="flex gap-2">
                <Select defaultValue="day">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.rollNo} className="border-2 hover:border-primary transition-smooth">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{student.name}</p>
                        <p className="text-sm text-muted-foreground">Roll No: {student.rollNo}</p>
                      </div>
                      <CircularProgress 
                        percentage={student.attendance}
                        size={80}
                        strokeWidth={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
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

export default StudentManagement;
