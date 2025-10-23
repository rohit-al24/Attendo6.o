import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileHeader from "@/components/MobileHeader";

const ExamManagement = () => {
  const [name, setName] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [maxMarksByClass, setMaxMarksByClass] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('classes').select('id, class_name, department');
      setClasses(data || []);
    })();
  }, []);

  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const setMax = (id: string, v: string) => setMaxMarksByClass(m => ({ ...m, [id]: Number(v || 0) }));

  const handleCreate = async () => {
    if (!name) { toast.error('Enter exam name'); return; }
    const chosen = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
    if (chosen.length === 0) { toast.error('Select at least one class'); return; }
    setSaving(true);
    const sb: any = supabase;
    const { data: exam, error } = await sb.from('results_exams').insert({ name }).select('*').single();
    if (error || !exam) { toast.error('Failed to create exam'); setSaving(false); return; }
    const rows = chosen.map((cid: string) => ({ exam_id: exam.id, class_id: cid, max_marks: maxMarksByClass[cid] || 100 }));
    await sb.from('results_exam_classes').insert(rows);
    toast.success('Exam created');
    setSaving(false);
    setName("");
    setSelected({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Exam Management" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 shadow-medium">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Exam Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Mid Term, Semester, etc." />
            </div>
          </div>
          <div className="mt-4">
            <Label>Select Classes</Label>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={!!selected[cls.id]} onCheckedChange={() => toggle(cls.id)} id={`cls-${cls.id}`} />
                    <Label htmlFor={`cls-${cls.id}`}>{cls.department} - {cls.class_name}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Max</span>
                    <Input className="w-20 h-8" type="number" min={1} max={1000} value={maxMarksByClass[cls.id] || 100} onChange={e => setMax(cls.id, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              <PlusCircle className="w-4 h-4 mr-2" /> Create Exam
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ExamManagement;