import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CircularProgress from "@/components/CircularProgress";

const StudentManagement = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Mock data
  const students = [
    { rollNo: "21CS001", name: "John Doe", attendance: 85.5 },
    { rollNo: "21CS002", name: "Jane Smith", attendance: 92.0 },
    { rollNo: "21CS003", name: "Mike Johnson", attendance: 78.5 },
    { rollNo: "21CS004", name: "Sarah Williams", attendance: 88.0 },
    { rollNo: "21CS005", name: "David Brown", attendance: 95.5 },
  ];

  const classInfo = {
    name: "3rd Year - CSE A",
    advisor: "Dr. Sarah Johnson",
    overallAttendance: 87.9,
    totalStudents: 60
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Student Management</h1>

        {/* Class Selection */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Select Class</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-2">
                <Select onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Select onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cse-a">CSE - A</SelectItem>
                    <SelectItem value="cse-b">CSE - B</SelectItem>
                    <SelectItem value="ece-a">ECE - A</SelectItem>
                    <SelectItem value="mech-a">MECH - A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
