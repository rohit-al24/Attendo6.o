import React, { useEffect, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Poll = { id: string; title: string; is_open: boolean; published: boolean; created_at: string };
type Option = { id: string; label: string };

const StudentVotings: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [studentId, setStudentId] = useState<string | null>(null);
	const [studentClassId, setStudentClassId] = useState<string | null>(null);
	const [polls, setPolls] = useState<Poll[]>([]);
	const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({});
	const [votesMap, setVotesMap] = useState<Record<string, Record<string, number>>>({});
	const [myVotes, setMyVotes] = useState<Record<string, string>>({});
	const [debugLogs, setDebugLogs] = useState<string[]>([]);

	const log = (m: string) => setDebugLogs(d => [...d, `${new Date().toISOString()} - ${m}`]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const { data: sessionData } = await supabase.auth.getSession();
				const session = (sessionData as any)?.session;
				if (!session) {
					log('No auth session');
					setLoading(false);
					return;
				}
				const uid = session.user.id;
				const email = session.user.email;
				log(`auth uid=${uid} email=${email}`);

				// Try lookups with safe try/catch to avoid 400 when column missing
				let stud: any = null;
				let lastErr: any = null;

				try {
					log('Lookup students by user_id');
					const r = await (supabase as any).from('students').select('id,class_id').eq('user_id', uid).maybeSingle();
					if (r?.data) stud = r.data; else lastErr = r?.error || lastErr;
				} catch (e) { log('lookup by user_id failed: ' + String(e)); }

				if (!stud) {
					try {
						log('Lookup students by id');
						const r = await (supabase as any).from('students').select('id,class_id').eq('id', uid).maybeSingle();
						if (r?.data) stud = r.data; else lastErr = r?.error || lastErr;
					} catch (e) { log('lookup by id failed: ' + String(e)); }
				}

				if (!stud && email) {
					try {
						log('Lookup students by email');
						const r = await (supabase as any).from('students').select('id,class_id').eq('email', email).maybeSingle();
						if (r?.data) stud = r.data; else lastErr = r?.error || lastErr;
					} catch (e) { log('lookup by email failed: ' + String(e)); }
				}

				if (!stud) {
					log('Student lookup failed; lastErr=' + JSON.stringify(lastErr));
					toast.error('Failed to load student record');
					setLoading(false);
					return;
				}

				setStudentId(stud.id);
				setStudentClassId(stud.class_id || null);
				log(`Found student id=${stud.id} class_id=${stud.class_id}`);

				// Load polls for class
				const { data: pls, error: pErr } = await (supabase as any).from('polls').select('*').eq('class_id', stud.class_id).order('created_at', { ascending: false });
				if (pErr) { log('Error loading polls: ' + String(pErr)); toast.error('Failed to load polls'); setLoading(false); return; }
				setPolls(pls || []);

				// Load options and votes in parallel per poll
				const optsMap: Record<string, Option[]> = {};
				const votesAcc: Record<string, Record<string, number>> = {};
				const myVotesLocal: Record<string, string> = {};

				await Promise.all((pls || []).map(async (p: any) => {
					const { data: opts } = await (supabase as any).from('poll_options').select('*').eq('poll_id', p.id).order('label');
					optsMap[p.id] = opts || [];

					const { data: votes } = await (supabase as any).from('poll_votes').select('option_id,student_id').eq('poll_id', p.id);
					const counts: Record<string, number> = {};
					(votes || []).forEach((v: any) => {
						counts[v.option_id] = (counts[v.option_id] || 0) + 1;
						if (v.student_id === stud.id) myVotesLocal[p.id] = v.option_id;
					});
					votesAcc[p.id] = counts;
				}));

				setOptionsMap(optsMap);
				setVotesMap(votesAcc);
				setMyVotes(myVotesLocal);
			} catch (e) {
				console.error(e);
				toast.error('Unexpected error loading votings');
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const totalVotes = (pollId: string) => Object.values(votesMap[pollId] || {}).reduce((a, b) => a + b, 0);

	const submitVote = async (pollId: string, optionId: string) => {
		if (!studentId) { toast.error('Student record not found'); return; }
		const payload = { poll_id: pollId, option_id: optionId, student_id: studentId };
		const { error } = await (supabase as any).from('poll_votes').upsert(payload, { onConflict: 'poll_id,student_id' });
		if (error) { toast.error('Failed to cast vote'); console.debug(error); return; }
		toast.success('Vote recorded');

		// Refresh counts for this poll
		const { data: votes } = await (supabase as any).from('poll_votes').select('option_id,student_id').eq('poll_id', pollId);
		const counts: Record<string, number> = {};
		(votes || []).forEach((v: any) => { counts[v.option_id] = (counts[v.option_id] || 0) + 1; if (v.student_id === studentId) setMyVotes(prev => ({ ...prev, [pollId]: v.option_id })); });
		setVotesMap(prev => ({ ...prev, [pollId]: counts }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
			<MobileHeader title="Class Votings" />
			<main className="container mx-auto px-4 py-6 pb-20">
				<div className="space-y-4">
					{loading && <Card className="p-6">Loading votings…</Card>}

					{!loading && !studentId && (
						<Card className="p-6">
							<div>No class polls available.</div>
							<div className="text-xs text-muted-foreground mt-2">Student class ID: <b>{studentClassId ?? "(none)"}</b></div>
							<div className="text-xs text-muted-foreground">Polls fetched: <b>{polls.length}</b></div>
							<div className="mt-2 text-sm">If you expect polls, ensure your student row exists and is linked to the currently logged-in user (by user_id, id or email). Run these checks in SQL:</div>
							<pre className="mt-2 text-xs bg-muted p-2 rounded">-- Find student by email
SELECT id, email, class_id FROM public.students WHERE email = '&lt;STUDENT_EMAIL&gt;';
-- Find polls for a class
SELECT * FROM public.polls WHERE class_id = '&lt;CLASS_ID&gt;';</pre>
						</Card>
					)}

					{!loading && studentId && polls.length === 0 && (
						<Card className="p-6">No polls created for your class yet.</Card>
					)}

					{!loading && polls.map((p) => (
						<Card key={p.id} className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<div className="font-medium">{p.title}</div>
									<div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
								</div>
								<div className="text-sm text-muted-foreground">{p.published ? 'Results published' : (p.is_open ? 'Open for voting' : 'Closed')}</div>
							</div>

							<div className="mt-4 space-y-3">
								{(optionsMap[p.id] || []).map((o) => {
									const count = votesMap[p.id]?.[o.id] || 0;
									const total = totalVotes(p.id) || 0;
									const pct = total === 0 ? 0 : Math.round((count / total) * 100);
									return (
										<div key={o.id}>
											{!p.published && p.is_open ? (
												<label className="flex items-center gap-3">
													<input type="radio" name={`poll-${p.id}`} checked={myVotes[p.id] === o.id} onChange={() => submitVote(p.id, o.id)} />
													<div>{o.label}</div>
												</label>
											) : (
												<div>
													<div className="flex justify-between text-sm">
														<div>{o.label}</div>
														<div className="text-muted-foreground">{count} vote{count !== 1 ? 's' : ''} • {pct}%</div>
													</div>
													<div className="h-3 bg-muted rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{!p.published && p.is_open && (
								<div className="mt-4 text-sm text-muted-foreground">Pick an option to cast or change your vote. Your latest selection will be saved.</div>
							)}
						</Card>
					))}

					{/* Debug panel - collapsible */}
					<details className="mt-4 p-4 border rounded bg-card">
						<summary className="cursor-pointer font-medium">Debug / Lookup logs</summary>
						<div className="mt-2 text-xs text-muted-foreground">
							<div>studentId: {studentId ?? '(none)'}</div>
							<div>studentClassId: {studentClassId ?? '(none)'}</div>
							<div>polls fetched: {polls.length}</div>
							<div className="mt-2 font-medium">Logs</div>
							<div className="mt-1 text-xs">
								{(debugLogs.length === 0) ? <div className="text-muted-foreground">No logs</div> : debugLogs.map((l, i) => <div key={i}><code>{l}</code></div>)}
							</div>
						</div>
					</details>
				</div>
			</main>
			<StudentTabBar />
		</div>
	);
};

export default StudentVotings;
