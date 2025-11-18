// Express route for /api/student-info to fetch marks, grades, attendance, feedback for a student
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.INFO_PORT || 4002;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(bodyParser.json());

// POST /api/student-info { studentId: "..." }
app.post('/api/student-info', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'No studentId provided' });
  try {
    // Fetch marks, grades, attendance, feedback
    const [marks, attendance, feedback] = await Promise.all([
      supabase.from('results').select('*').eq('student_id', studentId),
      supabase.from('attendance_records').select('*').eq('student_id', studentId),
      supabase.from('feedback').select('*').eq('student_id', studentId),
    ]);
    res.json({
      marks: marks.data || [],
      attendance: attendance.data || [],
      feedback: feedback.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Supabase error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Student info API running on http://localhost:${PORT}`);
});
