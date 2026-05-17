const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;
const TOTAL_WEIGHTAGE = 100;

function isGoalStarted(g) {
  return !!(g.title?.trim() || g.thrustArea || g.target || g.weightage);
}

/** Draft save: allow partial sheets; only validate goals the user has started */
export function validateGoalsDraft(goals) {
  const errors = [];
  const list = goals || [];

  if (list.length > MAX_GOALS) {
    errors.push(`Maximum ${MAX_GOALS} goals allowed per employee.`);
  }

  let totalWeight = 0;
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    if (!isGoalStarted(g)) continue;

    const w = parseFloat(g.weightage);
    if (!isNaN(w)) totalWeight += w;
    if (isNaN(w) || w < MIN_WEIGHTAGE) {
      errors.push(`Goal "${g.title || i + 1}": minimum weightage is ${MIN_WEIGHTAGE}%.`);
    }
    if (!g.title?.trim()) errors.push(`Goal ${i + 1}: title is required.`);
    if (!g.thrustArea) errors.push(`Goal ${i + 1}: thrust area is required.`);
    if (!g.uomType) errors.push(`Goal ${i + 1}: unit of measurement is required.`);
    if (g.target === undefined || g.target === '') errors.push(`Goal ${i + 1}: target is required.`);
  }

  return { valid: errors.length === 0, errors, totalWeight };
}

/** Submit / approve: full BRD rules including 100% total weightage */
export function validateGoals(goals) {
  const errors = [];

  if (!goals || goals.length === 0) {
    errors.push('At least one goal is required.');
    return { valid: false, errors };
  }

  if (goals.length > MAX_GOALS) {
    errors.push(`Maximum ${MAX_GOALS} goals allowed per employee.`);
  }

  let totalWeight = 0;
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const w = parseFloat(g.weightage);
    if (isNaN(w) || w < MIN_WEIGHTAGE) {
      errors.push(`Goal "${g.title || i + 1}": minimum weightage is ${MIN_WEIGHTAGE}%.`);
    }
    totalWeight += w || 0;
    if (!g.title?.trim()) errors.push(`Goal ${i + 1}: title is required.`);
    if (!g.thrustArea) errors.push(`Goal ${i + 1}: thrust area is required.`);
    if (!g.uomType) errors.push(`Goal ${i + 1}: unit of measurement is required.`);
    if (g.target === undefined || g.target === '') errors.push(`Goal ${i + 1}: target is required.`);
  }

  if (Math.abs(totalWeight - TOTAL_WEIGHTAGE) > 0.01) {
    errors.push(`Total weightage must equal ${TOTAL_WEIGHTAGE}% (current: ${totalWeight}%).`);
  }

  return { valid: errors.length === 0, errors, totalWeight };
}

export { MAX_GOALS, MIN_WEIGHTAGE, TOTAL_WEIGHTAGE };
