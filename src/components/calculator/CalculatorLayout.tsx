import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MarketType,
  AwarenessType,
  CalcMode,
  computeFromBudget,
  computeFromGoal,
  getCeiling,
  generateAwarenessCurve,
  getMarginalCost,
} from "@/lib/calculator";
import { MarketSelector } from "./MarketSelector";
import { AwarenessChart } from "./AwarenessChart";
import { CostChart } from "./CostChart";
import { Slider } from "@/components/ui/slider";

export function CalculatorLayout() {
  const [mode, setMode] = useState<CalcMode>("budget");
  const [market, setMarket] = useState<MarketType>("new_brand_low_competition");
  const [awarenessType, setAwarenessType] = useState<AwarenessType>("assisted");
  const [currentAwareness, setCurrentAwareness] = useState(15);
  const [budget, setBudget] = useState(500000);
  const [goal, setGoal] = useState(40);

  const ceiling = getCeiling(market);
  const clampedAwareness = Math.min(currentAwareness, ceiling - 1);
  const clampedGoal = Math.min(Math.max(goal, clampedAwareness + 1), ceiling);

  const result = useMemo(() => {
    if (mode === "budget") {
      return computeFromBudget(market, "assisted", clampedAwareness, budget);
    }
    return computeFromGoal(market, "assisted", clampedAwareness, clampedGoal);
  }, [market, clampedAwareness, mode, budget, clampedGoal]);

  // Compute all 3 awareness results for the hero
  const allResults = useMemo(() => {
    if (mode === "budget") {
      return {
        assisted: computeFromBudget(market, "assisted", clampedAwareness, budget),
        spontaneous: computeFromBudget(market, "spontaneous", clampedAwareness, budget),
        top_of_mind: computeFromBudget(market, "top_of_mind", clampedAwareness, budget),
      };
    }
    return {
      assisted: computeFromGoal(market, "assisted", clampedAwareness, clampedGoal),
      spontaneous: computeFromGoal(market, "spontaneous", clampedAwareness, clampedGoal),
      top_of_mind: computeFromGoal(market, "top_of_mind", clampedAwareness, clampedGoal),
    };
  }, [market, clampedAwareness, mode, budget, clampedGoal]);

  const curveData = useMemo(() => generateAwarenessCurve(market), [market]);
  const closestPoint = curveData.reduce((prev, curr) =>
    Math.abs(curr.assisted - clampedAwareness) < Math.abs(prev.assisted - clampedAwareness) ? curr : prev
  );

  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto">
      {/* Step 1: Mode choice — prominent, first thing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Que souhaitez-vous savoir ?
        </h2>
        <div className="inline-flex bg-card rounded-xl p-1 shadow-card border border-border">
          <button
            onClick={() => setMode("budget")}
            className={`px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "budget"
                ? "bg-primary text-primary-foreground shadow-elevated"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            💰 J'ai un budget → combien coûte un point ?
          </button>
          <button
            onClick={() => setMode("goal")}
            className={`px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "goal"
                ? "bg-primary text-primary-foreground shadow-elevated"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🎯 J'ai un objectif → quel budget nécessaire ?
          </button>
        </div>
      </motion.div>

      {/* Step 2: Configuration bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-5 shadow-card border border-border"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Market */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type de marché
            </label>
            <MarketSelector value={market} onChange={(m) => {
              setMarket(m);
              const newCeiling = getCeiling(m);
              if (currentAwareness >= newCeiling) setCurrentAwareness(Math.max(0, newCeiling - 5));
              if (goal >= newCeiling) setGoal(newCeiling - 1);
            }} />
          </div>

          {/* Current awareness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notoriété assistée actuelle
              </label>
              <span className="text-base font-bold text-foreground">{clampedAwareness}%</span>
            </div>
            <Slider
              value={[clampedAwareness]}
              onValueChange={([v]) => setCurrentAwareness(v)}
              min={0}
              max={ceiling - 1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{ceiling - 1}%</span>
            </div>
          </div>

          {/* Budget or Goal */}
          <div className="space-y-2">
            {mode === "budget" ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Budget net
                  </label>
                  <span className="text-base font-bold text-foreground">
                    {budget.toLocaleString("fr-FR")} €
                  </span>
                </div>
                <Slider
                  value={[budget]}
                  onValueChange={([v]) => setBudget(v)}
                  min={50000}
                  max={5000000}
                  step={50000}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50K €</span>
                  <span>5M €</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Objectif notoriété
                  </label>
                  <span className="text-base font-bold text-primary">
                    {clampedGoal}%
                  </span>
                </div>
                <Slider
                  value={[clampedGoal]}
                  onValueChange={([v]) => setGoal(v)}
                  min={Math.max(clampedAwareness + 1, 1)}
                  max={ceiling}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{clampedAwareness + 1}%</span>
                  <span>{ceiling}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hero results — all 3 awareness types */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {(["assisted", "spontaneous", "top_of_mind"] as AwarenessType[]).map((type) => {
          const r = allResults[type];
          const labels = { assisted: "Assistée", spontaneous: "Spontanée", top_of_mind: "Top of Mind" };
          const isMain = type === "assisted";

          return (
            <motion.div
              key={type}
              className={`rounded-2xl p-5 ${
                isMain
                  ? "bg-primary text-primary-foreground shadow-elevated"
                  : "bg-card text-foreground border border-border shadow-card"
              }`}
            >
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                isMain ? "opacity-80" : "text-muted-foreground"
              }`}>
                {labels[type]}
              </p>
              {mode === "budget" ? (
                <>
                  <p className="text-3xl font-bold tracking-tight">
                    {r.costPerPoint.toLocaleString("fr-FR")} €
                  </p>
                  <p className={`text-xs mt-2 ${isMain ? "opacity-70" : "text-muted-foreground"}`}>
                    par point · +{"pointsGained" in r ? r.pointsGained : 0} pts → {"finalAwareness" in r ? r.finalAwareness : 0}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold tracking-tight">
                    {"totalBudget" in r ? r.totalBudget.toLocaleString("fr-FR") : 0} €
                  </p>
                  <p className={`text-xs mt-2 ${isMain ? "opacity-70" : "text-muted-foreground"}`}>
                    budget · {"pointsNeeded" in r ? r.pointsNeeded : 0} pts à gagner · {r.costPerPoint.toLocaleString("fr-FR")} €/pt
                  </p>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Insight — above charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-secondary/50 border border-secondary rounded-2xl p-4"
      >
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-bold text-secondary-foreground">💡 Insight —</span>{" "}
          {mode === "budget" ? (
            <>
              Avec un budget de <strong>{budget.toLocaleString("fr-FR")} €</strong>, votre marque peut gagner{" "}
              <strong className="text-primary">
                {"pointsGained" in allResults.assisted ? allResults.assisted.pointsGained : 0} points
              </strong>{" "}
              de notoriété assistée, passant de {clampedAwareness}% à{" "}
              {"finalAwareness" in allResults.assisted ? allResults.assisted.finalAwareness : clampedAwareness}%.
              Le coût moyen par point est de{" "}
              <strong>{allResults.assisted.costPerPoint.toLocaleString("fr-FR")} €</strong>.
            </>
          ) : (
            <>
              Pour atteindre <strong>{clampedGoal}%</strong> de notoriété assistée (contre {clampedAwareness}% aujourd'hui),
              il vous faudra un budget estimé à{" "}
              <strong className="text-primary">
                {"totalBudget" in allResults.assisted ? allResults.assisted.totalBudget.toLocaleString("fr-FR") : 0} €
              </strong>
              , soit un coût moyen de{" "}
              <strong>{allResults.assisted.costPerPoint.toLocaleString("fr-FR")} € par point</strong>.
            </>
          )}
        </p>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AwarenessChart
          market={market}
          currentAssisted={clampedAwareness}
          currentSpontaneous={closestPoint.spontaneous}
        />
        <CostChart
          market={market}
          awarenessType={awarenessType}
          onAwarenessTypeChange={setAwarenessType}
          currentAwareness={clampedAwareness}
        />
      </div>
    </div>
  );
}
