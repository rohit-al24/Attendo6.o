import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, ClipboardList, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/faculty-login");
      }
    });
  }, [navigate]);

  const [facultyData, setFacultyData] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate("/faculty-login");
        return;
      }
      // Get faculty details by user_id
      const { data: faculty, error } = await supabase
        .from("faculty")
        .select("full_name,email,is_class_advisor,advisor_class_id,department")
        .eq("user_id", data.session.user.id)
        .single();
      if (faculty) {
        // Get advisor class name if advisor_class_id exists
        let advisorClass = "";
        if (faculty.advisor_class_id) {
          const { data: classData } = await supabase
            .from("classes")
            .select("class_name")
            .eq("id", faculty.advisor_class_id)
            .single();
          advisorClass = classData?.class_name || "";
        }
        setFacultyData({
          name: faculty.full_name,
          email: faculty.email,
          isClassAdvisor: faculty.is_class_advisor,
          advisorClass,
          department: faculty.department
        });
      }
      // Get today's classes for faculty
      const today = new Date();
      let dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
      // Our DB uses 1=Monday, ..., 6=Saturday. If Sunday, show empty schedule.
      if (dayOfWeek === 0) {
        setTodayClasses([]);
        return;
      }
      // Get faculty details by user_id
      const { data: facultyRow } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", data.session.user.id)
        .single();
      const facultyId = facultyRow?.id;
      if (!facultyId) {
        setTodayClasses([]);
        return;
      }
      const { data: timetable } = await supabase
        .from("timetable")
        .select("period_number,class_id,subject")
        .eq("faculty_id", facultyId)
        .eq("day_of_week", dayOfWeek)
        .order("period_number", { ascending: true });
      // Get class names for each class_id
      const classesWithNames = await Promise.all(
        (timetable || []).map(async (item: any) => {
          let className = "";
          if (item.class_id) {
            const { data: classData } = await supabase
              .from("classes")
              .select("class_name")
              .eq("id", item.class_id)
              .single();
            className = classData?.class_name || "";
          }
          return {
            period: item.period_number,
            time: "", // Optionally format time from item.time
            class: className,
            subject: item.subject
          };
        })
      );
      setTodayClasses(classesWithNames);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Faculty Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {facultyData?.name || "Faculty"}</p>
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
        <Tabs defaultValue="teaching" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="teaching">Teaching Faculty</TabsTrigger>
            <TabsTrigger value="advisor" disabled={!facultyData?.isClassAdvisor}>
              Class Advisor
            </TabsTrigger>
          </TabsList>

          {/* Teaching Faculty Tab */}
          <TabsContent value="teaching" className="space-y-6">
            {/* Today's Schedule */}
            <Card className="shadow-medium">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Today's Schedule
                </h2>
                <div className="space-y-3">
                  {todayClasses.map((classItem) => (
                    <Card key={classItem.period} className="border-2 hover:border-primary transition-smooth">
                      <div className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">Period {classItem.period}</p>
                          <p className="text-sm text-muted-foreground">{classItem.time}</p>
                          <p className="text-sm"><span className="font-medium">Class:</span> {classItem.class}</p>
                          <p className="text-sm"><span className="font-medium">Subject:</span> {classItem.subject}</p>
                        </div>
                        <Button 
                          className="gradient-primary"
                          onClick={() => navigate("/faculty/attendance-marking")}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Take Attendance
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Class Advisor Tab */}
          <TabsContent value="advisor" className="space-y-6">
            <Card className="shadow-medium">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">Class Advisor Dashboard</h2>
                <p className="text-muted-foreground">Managing: {facultyData?.advisorClass || ""}</p>
                
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => navigate("/faculty/timetable-management")}
                  >
                    <Calendar className="w-6 h-6" />
                    <span>Manage Timetable</span>
                  </Button>
                  <Button size="lg" className="h-24 flex flex-col gap-2" variant="secondary">
                    <ClipboardList className="w-6 h-6" />
                    <span>View Attendance Reports</span>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyDashboard;
