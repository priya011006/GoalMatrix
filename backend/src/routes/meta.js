import express from 'express';
import { THRUST_AREAS, UOM_TYPES } from '../utils/progress.js';
import { getCurrentCyclePhase, isDemoMode, getActiveQuarters } from '../utils/cycle.js';
import { MAX_GOALS, MIN_WEIGHTAGE, TOTAL_WEIGHTAGE } from '../utils/validation.js';

const router = express.Router();

router.get('/config', (_req, res) => {
  res.json({
    thrustAreas: THRUST_AREAS,
    uomTypes: UOM_TYPES,
    validation: { maxGoals: MAX_GOALS, minWeightage: MIN_WEIGHTAGE, totalWeightage: TOTAL_WEIGHTAGE },
    cyclePhase: getCurrentCyclePhase(),
    activeQuarters: getActiveQuarters(),
    demoMode: isDemoMode(),
  });
});

export default router;
