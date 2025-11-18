import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StudentRow = { id: string; full_name: string; roll_number: string };

const PublishResults = () => {
	const navigate = useNavigate();
	const [faculty, setFaculty] = useState<any>(null);
	const [exams, setExams] = useState<any[]>([]);
		const [subjects, setSubjects] = useState<string[]>([]);
	const [students, setStudents] = useState<StudentRow[]>([]);
	const [examId, setExamId] = useState<string>("");
	const [subject, setSubject] = useState<string>("");
	const [date, setDate] = useState<string>("");
	const [assessmentId, setAssessmentId] = useState<string>("");
	const [maxMarks, setMaxMarks] = useState<number>(100);
	const [marks, setMarks] = useState<Record<string, string>>({}); // student_id -> marks string
	const [saving, setSaving] = useState(false);
		const [examClassMax, setExamClassMax] = useState<Record<string, number>>({});

	// Load advisor and initial lists
	useEffect(() => {
		supabase.auth.getSession().then(async ({ data }) => {
			if (!data.session) { navigate('/faculty-login'); return; }
			const { data: fac } = await supabase.from('faculty').select('id, advisor_class_id').eq('user_id', data.session.user.id).single();
			if (!fac?.advisor_class_id) { toast.error('You are not a class advisor'); navigate('/faculty-dashboard'); return; }
			setFaculty(fac);

			const sb: any = supabase;
			// Exams mapped to class, newest first by exam.created_at
					const { data: ec } = await sb.from('results_exam_classes').select('exam_id,max_marks').eq('class_id', fac.advisor_class_id);
					const examIds = (ec || []).map((r: any) => r.exam_id);
					const ecm: Record<string, number> = {};
					(ec || []).forEach((r: any) => { ecm[r.exam_id] = r.max_marks ?? 100; });
					setExamClassMax(ecm);
			if (examIds.length > 0) {
				const { data: exs } = await sb.from('results_exams').select('id,name,created_at').in('id', examIds).order('created_at', { ascending: false });
				setExams(exs || []);
			}
					setMaxMarks(100);

			// Subjects from timetable for this class
			const { data: tsubs } = await sb.from('timetable').select('subject').eq('class_id', fac.advisor_class_id);
			const subjSet = new Set<string>();
			(tsubs || []).forEach((r: any) => { if (r.subject) subjSet.add(r.subject); });
			setSubjects(Array.from(subjSet));

			// Students of the class
			const { data: studs } = await sb.from('students').select('id,full_name,roll_number').eq('class_id', fac.advisor_class_id).order('roll_number');
			setStudents((studs || []) as StudentRow[]);
		});
	}, [navigate]);

		// When exam changes, reset assessment and base maxMarks on exam-class mapping
		useEffect(() => {
			setAssessmentId("");
			setMarks({});
			if (examId) setMaxMarks(examClassMax[examId] ?? 100);
		}, [examId]);

	// Load existing assessment and marks whenever exam/subject/date are all chosen
	useEffect(() => {
		(async () => {
			if (!faculty?.advisor_class_id || !examId || !subject || !date) { setAssessmentId(""); setMarks({}); return; }
			const sb: any = supabase;
			const { data: asmt } = await sb.from('results_assessments')
				.select('id,max_marks')
				.eq('exam_id', examId)
				.eq('class_id', faculty.advisor_class_id)
				.eq('subject', subject)
				.eq('assessed_on', date)
				.maybeSingle();
			let aId = asmt?.id as string | undefined;
					if (asmt?.max_marks) setMaxMarks(asmt.max_marks);
			if (aId) {
				setAssessmentId(aId);
				// load existing marks
				const { data: mks } = await sb.from('results_marks').select('student_id,marks_obtained').eq('assessment_id', aId);
				const map: Record<string, string> = {};
				(mks || []).forEach((m: any) => { map[m.student_id] = String(m.marks_obtained); });
				setMarks(map);
			} else {
						setAssessmentId("");
						setMarks({});
						setMaxMarks(examClassMax[examId] ?? 100);
			}
		})();
			}, [examId, subject, date, faculty?.advisor_class_id, examClassMax]);

	const onChangeMark = (studentId: string, value: string) => {
		// keep only numbers and optional decimal
		const v = value.replace(/[^0-9.]/g, '');
		setMarks(prev => ({ ...prev, [studentId]: v }));
	};

	const saveMarks = async () => {
		if (!faculty?.advisor_class_id) { toast.error('Not a class advisor'); return; }
		if (!examId) { toast.error('Choose an exam'); return; }
		if (!subject) { toast.error('Choose subject'); return; }
		if (!date) { toast.error('Pick a date'); return; }
		setSaving(true);
		const sb: any = supabase;
		let aId = assessmentId;
		// Ensure assessment exists
		if (!aId) {
			const payload = {
				exam_id: examId,
				class_id: faculty.advisor_class_id,
				title: subject, // keep simple: title = subject
				assessment_type: "Regular", // Added required field
				subject,
				max_marks: maxMarks || 100,
				assessed_on: date,
				created_by_faculty_id: faculty.id
			};
			const { data: ins, error } = await sb.from('results_assessments').insert(payload).select('id').single();
			if (error || !ins) { toast.error('Failed to create assessment'); setSaving(false); return; }
			aId = ins.id;
			setAssessmentId(aId);
		}

		// Build upsert rows for marks
		const rows = students
			.map(s => ({ student_id: s.id, value: marks[s.id] }))
			.filter(x => x.value !== undefined && x.value !== "")
			.map(x => ({ assessment_id: aId, student_id: x.student_id, marks_obtained: Number(x.value) }));

		if (rows.length === 0) {
			toast.message('Nothing to save');
			setSaving(false);
			return;
		}

			// Validate marks
			for (const r of rows) {
				if (Number.isNaN(r.marks_obtained) || r.marks_obtained < 0 || r.marks_obtained > (maxMarks ?? 100)) {
					toast.error(`Invalid mark for a student. Ensure 0 to ${maxMarks}.`);
					setSaving(false);
					return;
				}
			}

			// Upsert: insert on conflict (assessment_id, student_id)
		const { error: upErr } = await sb.from('results_marks').upsert(rows, { onConflict: 'assessment_id,student_id' });
		if (upErr) { toast.error('Failed to save marks'); setSaving(false); return; }
		toast.success('Marks saved');
		setSaving(false);
	};

		return (
			<div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
				<MobileHeader title="Publish Results" />
			
			<main className="container mx-auto px-4 py-6 space-y-6">
							<Card className="p-6 shadow-medium space-y-4">
								{/* Exams list as clickable buttons/cards */}
								<div>
									<Label>Exams</Label>
									<div className="mt-2 grid sm:grid-cols-3 gap-3">
										{exams.map((e) => (
											<button
												key={e.id}
												onClick={() => setExamId(e.id)}
												className={`text-left border rounded-lg p-3 hover:border-primary transition ${examId === e.id ? 'border-primary ring-2 ring-primary/20 bg-primary/10' : 'border-muted bg-background'}`}
											>
												<div className="font-medium">{e.name}</div>
												<div className="text-xs text-muted-foreground mt-1">{new Date(e.created_at).toLocaleDateString()}</div>
											</button>
										))}
										{exams.length === 0 && (
											<div className="text-sm text-muted-foreground">No exams created by admin yet.</div>
										)}
									</div>
								</div>

								{/* Only show subject/date/marks entry after an exam is selected */}
								{examId && (
									<>
										<div className="grid sm:grid-cols-3 gap-4 items-end mt-6">
											<div>
												<Label>Subject</Label>
												<Select value={subject} onValueChange={setSubject}>
													<SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
													<SelectContent>
														{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label>Date</Label>
												<Input type="date" value={date} onChange={e => setDate(e.target.value)} />
											</div>
										</div>

										<div className="flex items-center justify-between mt-4">
											<div className="text-sm text-muted-foreground">Max Marks: {maxMarks}</div>
											<Button onClick={saveMarks} disabled={saving || !examId || !subject || !date}>Save</Button>
										</div>

										<div className="mt-4 border rounded">
											<div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground">
												<div className="col-span-3">Roll No</div>
												<div className="col-span-5">Name</div>
												<div className="col-span-4 text-right">Marks</div>
											</div>
											<div className="divide-y">
												{students.map(s => (
													<div key={s.id} className="grid grid-cols-12 items-center px-3 py-2">
														<div className="col-span-3 text-sm">{s.roll_number}</div>
														<div className="col-span-5 text-sm">{s.full_name}</div>
														<div className="col-span-4">
															<Input
																inputMode="decimal"
																value={marks[s.id] ?? ""}
																onChange={e => onChangeMark(s.id, e.target.value)}
																placeholder={`0 - ${maxMarks}`}
																className="text-right"
															/>
														</div>
													</div>
												))}
												{students.length === 0 && (
													<div className="p-3 text-sm text-muted-foreground">No students found for this class.</div>
												)}
											</div>
										</div>
									</>
								)}
							</Card>
			</main>
		</div>
	);
};

export default PublishResults;
