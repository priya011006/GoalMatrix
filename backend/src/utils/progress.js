/**
 * Progress score formulas per BRD (tracking only, not ratings)
 */
export function computeProgressScore(goal, actual, completionDate) {
  const target = parseFloat(goal.target);
  const achievement = actual !== undefined && actual !== null ? parseFloat(actual) : null;

  if (goal.uomType === 'zero') {
    if (achievement === null || isNaN(achievement)) return null;
    return achievement === 0 ? 100 : 0;
  }

  if (goal.uomType === 'timeline') {
    if (!completionDate || !goal.target) return null;
    const deadline = new Date(goal.target);
    const completed = new Date(completionDate);
    if (isNaN(deadline.getTime()) || isNaN(completed.getTime())) return null;
    if (completed <= deadline) return 100;
    const totalMs = completed.getTime() - deadline.getTime();
    const daysLate = totalMs / (1000 * 60 * 60 * 24);
    return Math.max(0, 100 - daysLate * 2);
  }

  if (achievement === null || isNaN(achievement) || isNaN(target) || target === 0) return null;

  const isMax = goal.uomType.includes('max');
  if (isMax) {
    if (achievement === 0) return 100;
    return Math.min(200, (target / achievement) * 100);
  }
  return Math.min(200, (achievement / target) * 100);
}

export const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric (Higher is better)' },
  { value: 'numeric_max', label: 'Numeric (Lower is better)' },
  { value: 'percentage_min', label: 'Percentage (Higher is better)' },
  { value: 'percentage_max', label: 'Percentage (Lower is better)' },
  { value: 'timeline', label: 'Timeline (Date-based)' },
  { value: 'zero', label: 'Zero-based (Zero = Success)' },
];

export const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Experience',
  'Operational Excellence',
  'Innovation',
  'People & Culture',
  'Compliance & Risk',
];
