import { useEffect, useState, useRef, useCallback } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import { formatStatus } from '../../utils/helpers';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const STATUSES = ['not_started', 'on_track', 'completed'];

export default function EmployeeCheckIn() {
  const [sheet, setSheet] = useState(null);
  const [config, setConfig] = useState(null);
  const [quarter, setQuarter] = useState('Q1');
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const updatesRef = useRef(updates);
  const sheetRef = useRef(sheet);
  updatesRef.current = updates;
  sheetRef.current = sheet;

  useEffect(() => {
    Promise.all([client.get('/goals/my-sheet'), client.get('/meta/config')]).then(([s, c]) => {
      setSheet(s.data.sheet);
      setConfig(c.data);
      const active = c.data.activeQuarters?.[0] || 'Q1';
      setQuarter(active);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const map = {};
    for (const g of sheet.goals || []) {
      const ci = sheet.checkIns?.find(
        (c) => c.quarter === quarter && String(c.goalId) === String(g._id)
      );
      map[g._id] = {
        actualAchievement: ci?.actualAchievement || '',
        completionDate: ci?.completionDate ? ci.completionDate.slice(0, 10) : '',
        status: ci?.status || 'not_started',
        progressScore: ci?.progressScore,
      };
    }
    setUpdates(map);
  }, [sheet, quarter]);

  const save = useCallback(async (silent = false) => {
    const currentSheet = sheetRef.current;
    const currentUpdates = updatesRef.current;
    if (!currentSheet) return;
    if (silent) setSaving(true);
    else {
      setSaving(true);
      setMsg({ type: '', text: '' });
    }
    try {
      const payload = Object.entries(currentUpdates).map(([goalId, u]) => ({ goalId, ...u }));
      const res = await client.post('/goals/check-in', {
        quarter,
        updates: payload,
        cycleYear: currentSheet.cycleYear,
      });
      setSheet(res.data.sheet);
      setLastSaved(new Date());
      if (!silent) setMsg({ type: 'success', text: `${quarter} check-in saved successfully.` });
    } catch (err) {
      if (!silent) setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }, [quarter]);

  useEffect(() => {
    if (sheet?.status !== 'approved' || loading) return undefined;
    const timer = setTimeout(() => save(true), 3000);
    return () => clearTimeout(timer);
  }, [updates, quarter, sheet?.status, loading, save]);

  if (loading) return <Loading />;
  if (sheet?.status !== 'approved') {
    return <Alert type="warning" message="Your goals must be approved by your manager before you can complete check-ins." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Quarterly Check-in</h1>
        <p className="text-slate-500 text-sm mt-1">
          Log actual achievement vs planned targets
          {lastSaved && <span className="text-emerald-600 ml-2">· Saved {lastSaved.toLocaleTimeString()}</span>}
        </p>
      </div>
      <Alert type="info" message="Check-in data auto-saves to the database as you type." />
      <Alert type={msg.type || 'error'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      {config?.demoMode && <Alert type="info" message="Demo mode: all check-in windows are open for testing." />}

      <div className="flex gap-2">
        {QUARTERS.map((q) => (
          <button key={q} onClick={() => setQuarter(q)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${quarter === q ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{q}</button>
        ))}
      </div>

      {(sheet?.goals || []).map((goal) => {
        const u = updates[goal._id] || {};
        return (
          <div key={goal._id} className="card space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="text-sm text-slate-500">{goal.thrustArea} · Target: {goal.target} · Weight: {goal.weightage}%</p>
              </div>
              {u.progressScore != null && <span className="text-sm font-medium text-brand-600">{u.progressScore.toFixed(1)}% progress</span>}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Actual Achievement</label>
                <input className="input" value={u.actualAchievement || ''} onChange={(e) => setUpdates({ ...updates, [goal._id]: { ...u, actualAchievement: e.target.value } })} placeholder={goal.uomType === 'zero' ? '0 = success' : 'Enter actual'} />
              </div>
              {goal.uomType === 'timeline' && (
                <div>
                  <label className="label">Completion Date</label>
                  <input type="date" className="input" value={u.completionDate || ''} onChange={(e) => setUpdates({ ...updates, [goal._id]: { ...u, completionDate: e.target.value } })} />
                </div>
              )}
              <div>
                <label className="label">Status</label>
                <select className="input" value={u.status} onChange={(e) => setUpdates({ ...updates, [goal._id]: { ...u, status: e.target.value } })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      })}

      <button onClick={() => save(false)} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : `Save ${quarter} Check-in now`}</button>
    </div>
  );
}
