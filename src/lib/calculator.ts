// Market types with their cost-per-point models
export type MarketType =
  | "leader_low_competition"
  | "outsider_medium_competition"
  | "follower_high_competition"
  | "historical_player";

export const MARKET_LABELS: Record<MarketType, string> = {
  leader_low_competition: "Leader du segment / Concurrence faible",
  outsider_medium_competition: "Outsider du segment / Concurrence moyenne",
  follower_high_competition: "Suiveur du segment / Concurrence forte",
  historical_player: "Acteur historique",
};

export const MARKET_ICONS: Record<MarketType, string> = {
  leader_low_competition: "👑",
  outsider_medium_competition: "🚀",
  follower_high_competition: "⚔️",
  historical_player: "🏛️",
};

export type AwarenessType = "assisted" | "spontaneous" | "top_of_mind";

export const AWARENESS_LABELS: Record<AwarenessType, string> = {
  assisted: "Notoriété assistée",
  spontaneous: "Notoriété spontanée",
  top_of_mind: "Top of Mind",
};

export type CalcMode = "budget" | "goal";

// Each market type has different cost curves
// baseCost: base cost per point at low awareness
// exponent: how fast cost accelerates as awareness grows
// ceiling: max achievable awareness (%)
const MARKET_MODELS: Record<MarketType, { baseCost: number; exponent: number; ceiling: number }> = {
  leader_low_competition: { baseCost: 8000, exponent: 1.6, ceiling: 95 },
  outsider_medium_competition: { baseCost: 15000, exponent: 1.9, ceiling: 85 },
  follower_high_competition: { baseCost: 22000, exponent: 2.2, ceiling: 75 },
  historical_player: { baseCost: 12000, exponent: 1.8, ceiling: 90 },
};

// Awareness type multipliers (spontaneous & TOM cost more per point)
const AWARENESS_MULTIPLIERS: Record<AwarenessType, number> = {
  assisted: 1.0,
  spontaneous: 1.8,
  top_of_mind: 3.2,
};

/**
 * Get the marginal cost per point at a given awareness level
 */
export function getMarginalCost(
  market: MarketType,
  awarenessType: AwarenessType,
  currentAwareness: number
): number {
  const model = MARKET_MODELS[market];
  const mult = AWARENESS_MULTIPLIERS[awarenessType];
  const normalized = Math.min(currentAwareness / model.ceiling, 0.99);
  // Cost accelerates as you approach ceiling
  return model.baseCost * mult * Math.pow(1 + normalized, model.exponent) * (1 / (1 - normalized));
}

/**
 * Given a budget, compute how many points you can gain and cost per point
 */
export function computeFromBudget(
  market: MarketType,
  awarenessType: AwarenessType,
  currentAwareness: number,
  budget: number
): { pointsGained: number; costPerPoint: number; finalAwareness: number } {
  let remaining = budget;
  let awareness = currentAwareness;
  const step = 0.5; // half-point increments
  let totalCost = 0;

  while (remaining > 0) {
    const cost = getMarginalCost(market, awarenessType, awareness) * step;
    if (cost > remaining) break;
    remaining -= cost;
    totalCost += cost;
    awareness += step;
    if (awareness >= MARKET_MODELS[market].ceiling) break;
  }

  const pointsGained = Math.round((awareness - currentAwareness) * 10) / 10;
  const costPerPoint = pointsGained > 0 ? Math.round(totalCost / pointsGained) : 0;
  return { pointsGained, costPerPoint, finalAwareness: Math.round(awareness * 10) / 10 };
}

/**
 * Given a target awareness, compute the required budget
 */
export function computeFromGoal(
  market: MarketType,
  awarenessType: AwarenessType,
  currentAwareness: number,
  targetAwareness: number
): { totalBudget: number; costPerPoint: number; pointsNeeded: number } {
  let awareness = currentAwareness;
  let totalBudget = 0;
  const step = 0.5;
  const target = Math.min(targetAwareness, MARKET_MODELS[market].ceiling);

  while (awareness < target) {
    const cost = getMarginalCost(market, awarenessType, awareness) * step;
    totalBudget += cost;
    awareness += step;
  }

  const pointsNeeded = Math.round((target - currentAwareness) * 10) / 10;
  const costPerPoint = pointsNeeded > 0 ? Math.round(totalBudget / pointsNeeded) : 0;
  return { totalBudget: Math.round(totalBudget), costPerPoint, pointsNeeded };
}

/**
 * Raw (uncalibrated) spontaneous value for a given assisted value
 */
function rawSpontaneousFromAssisted(market: MarketType, assisted: number): number {
  const model = MARKET_MODELS[market];
  const x = Math.min(assisted, model.ceiling) / model.ceiling;
  return Math.max(0, model.ceiling * 0.6 * (1 / (1 + Math.exp(-8 * (x - 0.5)))));
}

/**
 * Raw (uncalibrated) top of mind value for a given spontaneous value
 */
function rawTopOfMindFromSpontaneous(market: MarketType, spontaneous: number): number {
  const model = MARKET_MODELS[market];
  const maxSpontaneous = model.ceiling * 0.6;
  const x = Math.min(spontaneous, maxSpontaneous) / maxSpontaneous;
  return Math.max(0, maxSpontaneous * 0.4 * (1 / (1 + Math.exp(-8 * (x - 0.5)))));
}

/**
 * Calibration: if the user declared a real value at a known anchor point,
 * we deform the raw curve so it passes through (anchorX, declaredY) while
 * keeping its shape. We use a smooth blended ratio that converges to 1 at
 * the extremes (0 and 100) so the curve isn't distorted everywhere.
 */
function calibrate(rawValue: number, rawAtAnchor: number, declaredAtAnchor: number, x: number, anchorX: number): number {
  if (declaredAtAnchor == null || rawAtAnchor <= 0 || anchorX <= 0) return rawValue;
  const ratio = declaredAtAnchor / rawAtAnchor;
  // Weight of calibration: full at anchor, fades to 0 at x=0 and x=100
  const distance = Math.abs(x - anchorX) / Math.max(anchorX, 100 - anchorX);
  const weight = Math.max(0, 1 - distance);
  const effectiveRatio = 1 + (ratio - 1) * weight;
  return Math.max(0, rawValue * effectiveRatio);
}

/**
 * Get spontaneous value for a given assisted value (with optional calibration)
 */
export function getSpontaneousFromAssisted(
  market: MarketType,
  assisted: number,
  anchorAssisted?: number,
  declaredSpontaneous?: number
): number {
  const raw = rawSpontaneousFromAssisted(market, assisted);
  if (anchorAssisted != null && declaredSpontaneous != null) {
    const rawAtAnchor = rawSpontaneousFromAssisted(market, anchorAssisted);
    const calibrated = calibrate(raw, rawAtAnchor, declaredSpontaneous, assisted, anchorAssisted);
    return Math.round(calibrated * 10) / 10;
  }
  return Math.round(raw * 10) / 10;
}

/**
 * Get top_of_mind value for a given spontaneous value (with optional calibration)
 */
export function getTopOfMindFromSpontaneous(
  market: MarketType,
  spontaneous: number,
  anchorSpontaneous?: number,
  declaredTopOfMind?: number
): number {
  const raw = rawTopOfMindFromSpontaneous(market, spontaneous);
  if (anchorSpontaneous != null && declaredTopOfMind != null) {
    const rawAtAnchor = rawTopOfMindFromSpontaneous(market, anchorSpontaneous);
    const calibrated = calibrate(raw, rawAtAnchor, declaredTopOfMind, spontaneous, anchorSpontaneous);
    return Math.round(calibrated * 10) / 10;
  }
  return Math.round(raw * 10) / 10;
}

/**
 * Generate awareness curve data (spontaneous vs assisted), optionally calibrated
 */
export function generateAwarenessCurve(
  market: MarketType,
  anchorAssisted?: number,
  declaredSpontaneous?: number
): { assisted: number; spontaneous: number }[] {
  const data: { assisted: number; spontaneous: number }[] = [];
  for (let assisted = 0; assisted <= 100; assisted += 2) {
    data.push({
      assisted,
      spontaneous: getSpontaneousFromAssisted(market, assisted, anchorAssisted, declaredSpontaneous),
    });
  }
  // Ensure the curve passes exactly through the anchor point
  if (anchorAssisted != null && !data.some((d) => d.assisted === anchorAssisted)) {
    data.push({
      assisted: anchorAssisted,
      spontaneous: getSpontaneousFromAssisted(market, anchorAssisted, anchorAssisted, declaredSpontaneous),
    });
    data.sort((a, b) => a.assisted - b.assisted);
  }
  return data;
}

/**
 * Generate top of mind vs spontaneous curve data, optionally calibrated
 */
export function generateTopOfMindCurve(
  market: MarketType,
  anchorSpontaneous?: number,
  declaredTopOfMind?: number
): { spontaneous: number; topOfMind: number }[] {
  const data: { spontaneous: number; topOfMind: number }[] = [];
  for (let s = 0; s <= 100; s += 2) {
    data.push({
      spontaneous: s,
      topOfMind: getTopOfMindFromSpontaneous(market, s, anchorSpontaneous, declaredTopOfMind),
    });
  }
  return data;
}

/**
 * Generate cost-per-point curve data
 */
export function generateCostCurve(
  market: MarketType,
  awarenessType: AwarenessType
): { awareness: number; cost: number }[] {
  const data: { awareness: number; cost: number }[] = [];
  const model = MARKET_MODELS[market];
  
  for (let a = 0; a <= 100; a += 2) {
    if (a < model.ceiling) {
      data.push({
        awareness: a,
        cost: Math.round(getMarginalCost(market, awarenessType, a)),
      });
    }
  }
  return data;
}

export function getCeiling(market: MarketType): number {
  return MARKET_MODELS[market].ceiling;
}
