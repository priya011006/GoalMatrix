import { useEffect, useState, useRef, useCallback } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { emptyGoal, calcTotalWeight } from '../../utils/helpers';
import { Plus, Trash2, Send, Save, Cloud } from 'lucide-react';

export default function EmployeeGoals() {
  const [config, setConfig] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const goalsRef = useRef(goals);
  const sheetRef = useRef(sheet);

  goalsRef.current = goals;
  sheetRef.current = sheet;

  const load = useCallback(async () => {
    setLoading(true);
    const [meta, sheetRes] = await Promise.all([
      client.get('/meta/config'),
      client.get('/goals/my-sheet'),
    ]);
    setConfig(meta.data);
    setSheet(sheetRes.data.sheet);
    const loaded = sheetRes.data.sheet?.goals?.length
      ? sheetRes.data.sheet.goals
      : [emptyGoal(), emptyGoal()];
    setGoals(loaded);
    setIsDirty(false);
    if (sheetRes.data.sheet?.updatedAt) setLastSaved(new Date(sheetRes.data.sheet.updatedAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editable = sheet && !sheet.locked && sheet.status !== 'submitted' && sheet.status !== 'approved';
  const totalWeight = calcTotalWeight(goals);

  const persistDraft = useCallback(async (silent = false) => {
    if (!editable) return true;
    if (!isDirty) return true;
    const currentGoals = goalsRef.current;
    const currentSheet = sheetRef.current;
    if (silent) setAutoSaving(true);
    else setSaving(true);
    if (!silent) {
      setMsg({ type: '', text: '' });
      setErrors([]);
    }
    try {
      const res = await client.put('/goals/my-sheet', {
        goals: currentGoals,
        cycleYear: currentSheet?.cycleYear || new Date().getFullYear(),
      });
      setSheet(res.data.sheet);
      setGoals(res.data.sheet.goals?.length ? res.data.sheet.goals : [emptyGoal()]);
      setIsDirty(false);
      setLastSaved(new Date());
      if (!silent) setMsg({ type: 'success', text: 'Goals saved to database.' });
      return true;
    } catch (err) {
      if (!silent) {
        setErrors(err.response?.data?.errors || []);
        setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
      }
      return false;
    } finally {
      setSaving(false);
      setAutoSaving(false);
    }
  }, [editable, isDirty]);

  useEffect(() => {
    if (!editable || !isDirty) return undefined;
    const timer = setTimeout(() => persistDraft(true), 2500);
    return () => clearTimeout(timer);
  }, [goals, editable, isDirty, persistDraft]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const updateGoal = (idx, field, value) => {
    const next = [...goals];
    next[idx] = { ...next[idx], [field]: value };
    setGoals(next);
    setIsDirty(true);
  };

  const addGoal = () => {
    if (goals.length >= 8) return setMsg({ type: 'error', text: 'Maximum 8 goals allowed.' });
    setGoals([...goals, emptyGoal()]);
    setIsDirty(true);
  };

  const removeGoal = (idx) => {
    if (goals.length <= 1) return;
    setGoals(goals.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const save = () => persistDraft(false);

  const submit = async () => {
    const saved = await persistDraft(false);
    if (!saved && isDirty) return;
    setSaving(true);
    try {
      const res = await client.post('/goals/submit', {
        cycleYear: sheet?.cycleYear || new Date().getFullYear(),
      });
      setSheet(res.data.sheet);
      setMsg({ type: 'success', text: 'Goals submitted for manager approval!' });
    } catch (err) {
      setErrors(err.response?.data?.errors || []);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submit failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Goal Sheet</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
            <span>Status: <StatusBadge status={sheet?.status || 'draft'} /></span>
            {autoSaving && <span className="text-brand-600">Auto-saving…</span>}
            {lastSaved && !autoSaving && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Cloud size={14} /> Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isDirty && editable && <span className="text-amber-600">Unsaved changes</span>}
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button onClick={addGoal} className="btn-secondary" disabled={goals.length >= 8}><Plus size={16} /> Add Goal</button>
            <button onClick={save} className="btn-secondary" disabled={saving}><Save size={16} /> Save Now</button>
            <button onClick={submit} className="btn-primary" disabled={saving || totalWeight !== 100}><Send size={16} /> Submit</button>
          </div>
        )}
      </div>

      {editable && (
        <Alert type="info" message="Changes auto-save to the database every few seconds. Reach 100% weight before Submit." />
      )}

      <Alert type={msg.type || 'error'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      {errors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc pl-6">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      <div className={`rounded-lg px-4 py-3 text-sm font-medium ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
        Total Weightage: {totalWeight}% / 100% {totalWeight !== 100 && '— Must equal 100% to submit'}
      </div>

      {sheet?.locked && <Alert type="warning" message="Goals are locked after approval. Contact Admin to unlock." />}

      {goals.map((goal, idx) => (
        <div key={goal._id || `goal-${idx}`} className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Goal {idx + 1} {goal.isShared && <span className="text-xs text-blue-600 font-normal">(Shared KPI)</span>}</h3>
            {editable && !goal.readOnlyFields && goals.length > 1 && (
              <button onClick={() => removeGoal(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Thrust Area</label>
              <select className="input" value={goal.thrustArea} disabled={!editable || goal.readOnlyFields} onChange={(e) => updateGoal(idx, 'thrustArea', e.target.value)}>
                <option value="">Select...</option>
                {config?.thrustAreas?.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit of Measurement</label>
              <select className="input" value={goal.uomType} disabled={!editable || goal.readOnlyFields} onChange={(e) => updateGoal(idx, 'uomType', e.target.value)}>
                {config?.uomTypes?.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Goal Title</label>
              <input className="input" value={goal.title} disabled={!editable || goal.readOnlyFields} onChange={(e) => updateGoal(idx, 'title', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={goal.description || ''} disabled={!editable || goal.readOnlyFields} onChange={(e) => updateGoal(idx, 'description', e.target.value)} />
            </div>
            <div>
              <label className="label">Target {goal.uomType === 'timeline' ? '(Deadline date)' : ''}</label>
              <input className="input" type={goal.uomType === 'timeline' ? 'date' : 'text'} value={goal.target} disabled={!editable || goal.readOnlyFields} onChange={(e) => updateGoal(idx, 'target', e.target.value)} />
            </div>
            <div>
              <label className="label">Weightage % (min 10%)</label>
              <input className="input" type="number" min={10} max={100} value={goal.weightage} disabled={!editable} onChange={(e) => updateGoal(idx, 'weightage', parseFloat(e.target.value))} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
