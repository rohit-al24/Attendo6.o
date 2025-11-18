import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";
import { supabase } from "@/integrations/supabase/client";

interface Result {
  id: string;
  b: string | null;
  roll_number: string;
  names: string;
  department?: string;
  internal: string | null;
  c1_a_cqi: string | null;
  c2_a_cqi: string | null;
  pt_1: string | null;
  pt_2: string | null;
  ssa_1: string | null;
  ssa_2: string | null;
  cia_1: string | null;
  cia_2: string | null;
  formative_1: string | null;
  formative_2: string | null;
  b_cqi_i: string | null;
  b_cqi_ii: string | null;
  ese_marks: string | null;
}

const StudentResults = () => {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  // Get studentId from props, context, or session (example: from props)
  // const studentId = props.studentId;
  // Or from sessionStorage, context, or route params
  // Try to get studentId from sessionStorage, navigation state, or stored student object
  const location = useLocation();
  function isValidUUID(uuid: string | null): boolean {
    return !!uuid && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  }

  let studentId = sessionStorage.getItem('studentId');
  // Try navigation state
  if (!isValidUUID(studentId) && location.state && location.state.student && location.state.student.id) {
    studentId = location.state.student.id;
    if (isValidUUID(studentId)) sessionStorage.setItem('studentId', studentId);
  }
  // Try stored student object
  if (!isValidUUID(studentId)) {
    try {
      const studentObj = JSON.parse(sessionStorage.getItem('student') || '{}');
      if (studentObj && isValidUUID(studentObj.id)) {
        studentId = studentObj.id;
        sessionStorage.setItem('studentId', studentId);
      }
    } catch {}
  }

  useEffect(() => {
    if (!isValidUUID(studentId)) {
      setLoading(false);
      setResult(null);
      return;
    }
    async function fetchStudentResult() {
      console.log('Fetching result for studentId:', studentId);
      const { data, error } = await (supabase as any)
        .from('results')
        .select('*')
        .eq('student_id', studentId)
        .single();
      console.log('Supabase response:', { data, error });
      if (error || !data) {
        setResult(null);
      } else {
        setResult(data as Result);
      }
      setLoading(false);
    }
    fetchStudentResult();
  }, [studentId]);

  if (loading) return <div>Loading...</div>;
  if (!isValidUUID(studentId)) return <div>Student ID not found or invalid. Please log in again.</div>;
  if (!result) return <div>No result found for this student.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      <MobileHeader
        title="Results"
        iconText={result.names ? result.names[0] : 'R'}
        right={
          <>
            <span>Name: <span className="font-normal">{result.names}</span></span>
            <span>Roll No: <span className="font-normal">{result.roll_number}</span></span>
            <span>Department: <span className="font-normal">{result.department || ''}</span></span>
          </>
        }
      />
      {/* Mark Table */}
      <div className="max-w-xl mx-auto mt-8 mb-4 bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">MARK TABLE</h1>
        <table className="w-full border border-black">
          <thead>
            <tr className="bg-black text-white">
              <th className="py-2 px-4 text-left">EXAM NAME</th>
              <th className="py-2 px-4 text-left">MARKS</th>
            </tr>
          </thead>
          <tbody className="text-lg">
            <tr><td className="font-bold">INTERNAL</td><td>{result.internal}</td></tr>
            <tr><td className="font-bold">CIA-1 CQI</td><td>{result.c1_a_cqi}</td></tr>
            <tr><td className="font-bold">CIA 2 CQI</td><td>{result.c2_a_cqi}</td></tr>
            <tr><td className="font-bold">PT 1</td><td>{result.pt_1}</td></tr>
            <tr><td className="font-bold">PT 2</td><td>{result.pt_2}</td></tr>
            <tr><td className="font-bold">SSA 1</td><td>{result.ssa_1}</td></tr>
            <tr><td className="font-bold">SSA 2</td><td>{result.ssa_2}</td></tr>
            <tr><td className="font-bold">CIA 1</td><td>{result.cia_1}</td></tr>
            <tr><td className="font-bold">CIA 2</td><td>{result.cia_2}</td></tr>
            <tr><td className="font-bold">FA 1</td><td>{result.formative_1}</td></tr>
            <tr><td className="font-bold">FA 2</td><td>{result.formative_2}</td></tr>
            <tr><td className="font-bold">B-CQI I</td><td>{result.b_cqi_i}</td></tr>
            <tr><td className="font-bold">B-CQI II</td><td>{result.b_cqi_ii}</td></tr>
            <tr><td className="font-bold">ESE MARK</td><td>{result.ese_marks}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <StudentTabBar />
      </div>
    </div>
  );
};

export default StudentResults;
