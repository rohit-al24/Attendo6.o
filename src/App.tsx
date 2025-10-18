import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";

// Wrapper to extract classId from query params and pass to AdvisorAttendanceReport
import Splash from "./pages/Splash";
import LoginSelection from "./pages/LoginSelection";
import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import AdminLogin from "./pages/AdminLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendance from "./pages/StudentAttendance";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyManagement from "./pages/admin/FacultyManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import FacultyActivities from "./pages/admin/FacultyActivities";
import AttendanceMarking from "./pages/faculty/AttendanceMarking";
import TimetableManagement from "./pages/faculty/TimetableManagement";
import AdvisorAttendanceReport from "./pages/faculty/AdvisorAttendanceReport";
import AdvisorAttendanceEdit from "./pages/faculty/AdvisorAttendanceEdit";
import NotFound from "./pages/NotFound";
import FacultyClassResults from "./pages/faculty/ClassResults";
import FacultyExamMarks from "./pages/faculty/ExamMarks";


// Wrapper to extract classId from query params and pass to AdvisorAttendanceReport
function AdvisorAttendanceReportWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const classId = params.get("classId") || "";
  return <AdvisorAttendanceReport classId={classId} />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login-selection" element={<LoginSelection />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/faculty-login" element={<FacultyLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-attendance" element={<StudentAttendance />} />
          <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/faculty" element={<FacultyManagement />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/faculty-activities" element={<FacultyActivities />} />
          <Route path="/faculty/attendance-marking" element={<AttendanceMarking />} />
          <Route path="/faculty/timetable-management" element={<TimetableManagement />} />
          <Route path="/faculty/advisor-attendance-report" element={<AdvisorAttendanceReportWrapper />} />
          <Route path="/faculty/AdvisorAttendanceEdit" element={<AdvisorAttendanceEdit />} />
          <Route path="/faculty/class-results" element={<FacultyClassResults />} />
          <Route path="/faculty/exam-marks" element={<FacultyExamMarks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
