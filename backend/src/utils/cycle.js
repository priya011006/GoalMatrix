/**
 * Check-in schedule enforcement per BRD
 */
const CYCLE_CONFIG = {
  goalSetting: { openMonth: 5, openDay: 1, label: 'Goal Setting' },
  Q1: { openMonth: 7, label: 'Q1 Check-in' },
  Q2: { openMonth: 10, label: 'Q2 Check-in' },
  Q3: { openMonth: 1, label: 'Q3 Check-in' },
  Q4: { openMonth: 3, label: 'Q4 / Annual Check-in' },
};

export function getCurrentCyclePhase(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 5 && month < 7) return { phase: 'goalSetting', year, ...CYCLE_CONFIG.goalSetting };
  if (month >= 7 && month < 10) return { phase: 'Q1', year, ...CYCLE_CONFIG.Q1 };
  if (month >= 10 && month <= 12) return { phase: 'Q2', year, ...CYCLE_CONFIG.Q2 };
  if (month === 1 || month === 2) return { phase: 'Q3', year: year, ...CYCLE_CONFIG.Q3 };
  return { phase: 'Q4', year, ...CYCLE_CONFIG.Q4 };
}

export function isGoalSettingOpen(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month > 5) return month < 7;
  if (month === 5) return day >= 1;
  return false;
}

export function isCheckInOpen(quarter, date = new Date()) {
  const month = date.getMonth() + 1;
  const windows = { Q1: 7, Q2: 10, Q3: 1, Q4: 3 };
  const openMonth = windows[quarter];
  if (!openMonth) return false;
  if (quarter === 'Q3') return month === 1 || month === 2;
  if (quarter === 'Q4') return month === 3 || month === 4;
  if (quarter === 'Q1') return month >= 7 && month < 10;
  if (quarter === 'Q2') return month >= 10;
  return false;
}

export function getActiveQuarters(date = new Date()) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  return quarters.filter((q) => isCheckInOpen(q, date));
}

/** Demo mode: bypass date restrictions when DEMO_MODE=true */
export function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}
