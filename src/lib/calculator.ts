// Market types with their cost-per-point models
export type MarketType =
  | "new_brand_new_market"
  | "new_brand_low_competition"
  | "new_brand_high_competition"
  | "established_high_competition"
  | "established_saturated";

export const MARKET_LABELS: Record<MarketType, string> = {
  new_brand_new_market: "Marque neuve & marché nouveau",
  new_brand_low_competition: "Marque neuve & marché peu concurrentiel",
  new_brand_high_competition: "Marque neuve & marché très concurrentiel",
  established_high_competition: "Marque installée & marché très concurrentiel",
  established_saturated: "Marque installée & marché saturé",
};

export const MARKET_ICONS: Record<MarketType, string> = {
  new_brand_new_market: "🌱",
  new_brand_low_competition: "🚀",
  new_brand_high_competition: "⚔️",
  established_high_competition: "🏛️",
  established_saturated: "🔒",
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
  new_brand_new_market: { baseCost: 8000, exponent: 1.6, ceiling: 95 },
  new_brand_low_competition: { baseCost: 12000, exponent: 1.8, ceiling: 90 },
  new_brand_high_competition: { baseCost: 18000, exponent: 2.0, ceiling: 80 },
  established_high_competition: { baseCost: 22000, exponent: 2.2, ceiling: 75 },
  established_saturated: { baseCost: 30000, exponent: 2.5, ceiling: 65 },
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
 * Generate awareness curve data (spontaneous vs assisted)
 * Shows S-curve relationship
 */
export function generateAwarenessCurve(market: MarketType): { assisted: number; spontaneous: number }[] {
  const data: { assisted: number; spontaneous: number }[] = [];
  const model = MARKET_MODELS[market];
  
  for (let assisted = 0; assisted <= model.ceiling; assisted += 2) {
    const x = assisted / model.ceiling;
    const spontaneous = model.ceiling * 0.6 * (1 / (1 + Math.exp(-8 * (x - 0.5))));
    data.push({
      assisted: Math.round(assisted),
      spontaneous: Math.round(Math.max(0, spontaneous) * 10) / 10,
    });
  }
  return data;
}

/**
 * Get spontaneous value for a given assisted value
 */
export function getSpontaneousFromAssisted(market: MarketType, assisted: number): number {
  const model = MARKET_MODELS[market];
  const x = assisted / model.ceiling;
  return Math.round(Math.max(0, model.ceiling * 0.6 * (1 / (1 + Math.exp(-8 * (x - 0.5))))) * 10) / 10;
}

/**
 * Get top_of_mind value for a given spontaneous value
 */
export function getTopOfMindFromSpontaneous(market: MarketType, spontaneous: number): number {
  const model = MARKET_MODELS[market];
  const maxSpontaneous = model.ceiling * 0.6;
  const x = spontaneous / maxSpontaneous;
  return Math.round(Math.max(0, maxSpontaneous * 0.4 * (1 / (1 + Math.exp(-8 * (x - 0.5))))) * 10) / 10;
}

/**
 * Generate top of mind vs spontaneous curve data
 */
export function generateTopOfMindCurve(market: MarketType): { spontaneous: number; topOfMind: number }[] {
  const data: { spontaneous: number; topOfMind: number }[] = [];
  const model = MARKET_MODELS[market];
  const maxSpontaneous = Math.round(model.ceiling * 0.6);

  for (let s = 0; s <= maxSpontaneous; s += 2) {
    data.push({
      spontaneous: s,
      topOfMind: getTopOfMindFromSpontaneous(market, s),
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
  
  for (let a = 0; a <= model.ceiling - 1; a += 2) {
    data.push({
      awareness: a,
      cost: Math.round(getMarginalCost(market, awarenessType, a)),
    });
  }
  return data;
}

export function getCeiling(market: MarketType): number {
  return MARKET_MODELS[market].ceiling;
}
