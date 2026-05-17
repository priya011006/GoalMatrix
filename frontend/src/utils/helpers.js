export const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  not_started: 'bg-slate-100 text-slate-600',
  on_track: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

export function formatStatus(s) {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function uomLabel(type) {
  const map = {
    numeric_min: 'Numeric ↑',
    numeric_max: 'Numeric ↓',
    percentage_min: '% ↑',
    percentage_max: '% ↓',
    timeline: 'Timeline',
    zero: 'Zero-based',
  };
  return map[type] || type;
}

export const emptyGoal = () => ({
  thrustArea: '',
  title: '',
  description: '',
  uomType: 'numeric_min',
  target: '',
  weightage: 10,
  isShared: false,
  readOnlyFields: false,
});

export function calcTotalWeight(goals) {
  return (goals || []).reduce((s, g) => s + (parseFloat(g.weightage) || 0), 0);
}
