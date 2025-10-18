import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FacultyClassResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const classId = new URLSearchParams(location.search).get("classId");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    const fetchResults = async () => {
      setLoading(true);
      // Example: Fetch results for students in this class
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, roll_number")
        .eq("class_id", classId);
      // Example: Fetch marks for each student (assuming a 'results' table)
      let resultsData: any[] = [];
      if (students && students.length > 0) {
        for (const student of students) {
          const { data: marks } = await supabase
            .from("results")
            .select("subject, marks, max_marks")
            .eq("student_id", student.id);
          resultsData.push({
            ...student,
            marks: marks || []
          });
        }
      }
      setResults(resultsData);
      setLoading(false);
    };
    fetchResults();
  }, [classId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Class Results
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-2">Student Results</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center border">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((student, idx) => (
                      student.marks.length > 0 ? (
                        student.marks.map((mark: any, mIdx: number) => (
                          <tr key={student.id + "-" + mIdx}>
                            <td>{student.full_name}</td>
                            <td>{student.roll_number}</td>
                            <td>{mark.subject}</td>
                            <td>{mark.marks}</td>
                            <td>{mark.max_marks}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key={student.id + "-empty"}>
                          <td>{student.full_name}</td>
                          <td>{student.roll_number}</td>
                          <td colSpan={3} className="text-muted-foreground">No results</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default FacultyClassResults;
