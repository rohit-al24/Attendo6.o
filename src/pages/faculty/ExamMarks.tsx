import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const dummyStudents = [
  { id: "1", full_name: "Amit Kumar", roll_number: "101" },
  { id: "2", full_name: "Priya Singh", roll_number: "102" },
  { id: "3", full_name: "Rahul Verma", roll_number: "103" },
  { id: "4", full_name: "Sneha Patel", roll_number: "104" },
  { id: "5", full_name: "Vikram Rao", roll_number: "105" },
];
const dummySubjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"];

const FacultyExamMarks = () => {
  const navigate = useNavigate();
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState(dummySubjects[0]);
  const [marks, setMarks] = useState<{ [studentId: string]: number }>({});

  const handleMarkChange = (studentId: string, value: string) => {
    const num = parseInt(value, 10);
    setMarks((prev) => ({ ...prev, [studentId]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Enter Exam Marks
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-2">Exam Details</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Exam Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. Midterm, Final, Unit Test"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                >
                  {dummySubjects.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Enter Marks</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-center border">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.full_name}</td>
                      <td>{student.roll_number}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="border rounded px-2 py-1 w-20 text-center"
                          value={marks[student.id] ?? ""}
                          onChange={e => handleMarkChange(student.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <Button size="lg" className="px-8">Save Marks</Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default FacultyExamMarks;
