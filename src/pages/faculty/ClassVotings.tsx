import React, { useEffect, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type PollRow = { id: string; title: string; is_open: boolean; published: boolean; created_at: string };

const ClassVotings: React.FC = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<any>(null);
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>([""]);
  const [students, setStudents] = useState<{ id: string; roll_number: string; full_name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data?.session) { navigate('/faculty-login'); return; }
      const uid = data.session.user.id;
      const { data: fac } = await (supabase as any).from('faculty').select('id,advisor_class_id').eq('user_id', uid).maybeSingle();
      if (!fac?.advisor_class_id) { toast.error('You are not a class advisor'); navigate('/faculty-dashboard'); return; }
      setFaculty(fac);

      // load polls
      const { data: pls } = await (supabase as any).from('polls').select('*').eq('class_id', fac.advisor_class_id).order('created_at', { ascending: false });
      setPolls(pls || []);

      // load students for dropdown
      const { data: studs } = await (supabase as any).from('students').select('id,roll_number,full_name').eq('class_id', fac.advisor_class_id).order('roll_number');
      setStudents(studs || []);

      setLoading(false);
    });
  }, [navigate]);

  const addOption = () => setOptions(prev => [...prev, ""]);
  const updateOption = (i: number, v: string) => setOptions(prev => prev.map((x, idx) => idx === i ? v : x));
  const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));

  const createPoll = async () => {
    if (!faculty?.advisor_class_id) { toast.error('Not an advisor'); return; }
    if (!title.trim()) { toast.error('Enter a poll title'); return; }
    // Only allow options that are valid student IDs
    const cleaned = options.filter(o => o && students.some(s => s.id === o));
    if (cleaned.length < 2) { toast.error('Add at least two student options'); return; }
    setSaving(true);
    const { data: inserted, error: perr } = await (supabase as any).from('polls').insert({ title: title.trim(), class_id: faculty.advisor_class_id, created_by_faculty_id: faculty.id, is_open: true, published: false }).select('id').single();
    if (perr || !inserted) { toast.error('Failed to create poll'); setSaving(false); return; }
    const pid = inserted.id;
    const optsRows = cleaned.map(studentId => {
      const student = students.find(s => s.id === studentId);
      return { poll_id: pid, label: student ? `${student.roll_number} ${student.full_name}` : studentId };
    });
    const { error: oerr } = await (supabase as any).from('poll_options').insert(optsRows);
    if (oerr) { toast.error('Failed to create options'); setSaving(false); return; }
    toast.success('Poll created');
    // refresh list
    const { data: pls } = await (supabase as any).from('polls').select('*').eq('class_id', faculty.advisor_class_id).order('created_at', { ascending: false });
    setPolls(pls || []);
    setTitle(""); setOptions([""]); setSaving(false);
  };

  const toggleOpen = async (p: PollRow) => {
    const { error } = await (supabase as any).from('polls').update({ is_open: !p.is_open }).eq('id', p.id);
    if (error) { toast.error('Failed'); return; }
    setPolls(prev => prev.map(x => x.id === p.id ? { ...x, is_open: !x.is_open } : x));
  };

  const publishResults = async (p: PollRow) => {
    const { error } = await (supabase as any).from('polls').update({ published: true, is_open: false }).eq('id', p.id);
    if (error) { toast.error('Failed to publish'); return; }
    setPolls(prev => prev.map(x => x.id === p.id ? { ...x, published: true, is_open: false } : x));
    toast.success('Results published');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Class Votings (Advisor)" />
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="font-semibold mb-2">Create Poll for your Class</div>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Options (Select students)</Label>
                <div className="space-y-2 mt-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1 min-w-[180px]"
                        value={o}
                        onChange={e => updateOption(i, e.target.value)}
                      >
                        <option value="">Select student…</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.roll_number} {s.full_name}</option>
                        ))}
                      </select>
                      <Button variant="ghost" onClick={() => removeOption(i)}>Remove</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <Button variant="outline" onClick={addOption}>Add option</Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={createPoll} disabled={saving}>{saving ? 'Creating…' : 'Create Poll'}</Button>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {loading && <Card className="p-4">Loading polls…</Card>}
            {!loading && polls.map(p => (
              <Card key={p.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => toggleOpen(p)}>{p.is_open ? 'Close' : 'Open'}</Button>
                    {!p.published && <Button onClick={() => publishResults(p)}>Publish Results</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassVotings;
