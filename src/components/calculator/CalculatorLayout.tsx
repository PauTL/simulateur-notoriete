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
} from "@/lib/calculator";
import { MarketSelector } from "./MarketSelector";
import { AwarenessInputs } from "./AwarenessInputs";
import { ModeToggle } from "./ModeToggle";
import { BudgetInput } from "./BudgetInput";
import { HeroResult } from "./HeroResult";
import { AwarenessChart } from "./AwarenessChart";
import { CostChart } from "./CostChart";

export function CalculatorLayout() {
  const [market, setMarket] = useState<MarketType>("new_brand_low_competition");
  const [awarenessType, setAwarenessType] = useState<AwarenessType>("assisted");
  const [currentAwareness, setCurrentAwareness] = useState(15);
  const [mode, setMode] = useState<CalcMode>("budget");
  const [budget, setBudget] = useState(500000);
  const [goal, setGoal] = useState(40);

  const ceiling = getCeiling(market);

  // Clamp values when market changes
  const clampedAwareness = Math.min(currentAwareness, ceiling - 1);
  const clampedGoal = Math.min(Math.max(goal, clampedAwareness + 1), ceiling);

  const result = useMemo(() => {
    if (mode === "budget") {
      return computeFromBudget(market, awarenessType, clampedAwareness, budget);
    }
    return computeFromGoal(market, awarenessType, clampedAwareness, clampedGoal);
  }, [market, awarenessType, clampedAwareness, mode, budget, clampedGoal]);

  // Estimate spontaneous from assisted for the chart marker
  const curveData = useMemo(() => generateAwarenessCurve(market), [market]);
  const closestPoint = curveData.reduce((prev, curr) =>
    Math.abs(curr.assisted - clampedAwareness) < Math.abs(prev.assisted - clampedAwareness) ? curr : prev
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">BE</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-tight">
                Brand Equity Calculator
              </h1>
              <p className="text-xs text-muted-foreground">Simulateur de notoriété</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="lg:w-[380px] lg:min-w-[380px] border-r border-border bg-card/50 p-6 space-y-6 overflow-y-auto">
          <MarketSelector value={market} onChange={(m) => {
            setMarket(m);
            const newCeiling = getCeiling(m);
            if (currentAwareness >= newCeiling) setCurrentAwareness(Math.max(0, newCeiling - 5));
            if (goal >= newCeiling) setGoal(newCeiling - 1);
          }} />
          
          <div className="h-px bg-border" />

          <AwarenessInputs
            awarenessType={awarenessType}
            onTypeChange={setAwarenessType}
            currentAwareness={clampedAwareness}
            onAwarenessChange={setCurrentAwareness}
            max={ceiling - 1}
          />

          <div className="h-px bg-border" />

          <ModeToggle mode={mode} onChange={setMode} />

          <BudgetInput
            mode={mode}
            budget={budget}
            onBudgetChange={setBudget}
            goal={clampedGoal}
            onGoalChange={setGoal}
            currentAwareness={clampedAwareness}
            maxAwareness={ceiling}
          />
        </aside>

        {/* Results */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          <HeroResult
            mode={mode}
            costPerPoint={"costPerPoint" in result ? result.costPerPoint : 0}
            totalBudget={mode === "goal" && "totalBudget" in result ? result.totalBudget : undefined}
            pointsGained={mode === "budget" && "pointsGained" in result ? result.pointsGained : undefined}
            pointsNeeded={mode === "goal" && "pointsNeeded" in result ? result.pointsNeeded : undefined}
            finalAwareness={mode === "budget" && "finalAwareness" in result ? result.finalAwareness : undefined}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AwarenessChart
              market={market}
              currentAssisted={awarenessType === "assisted" ? clampedAwareness : Math.round(clampedAwareness * 1.5)}
              currentSpontaneous={closestPoint.spontaneous}
            />
            <CostChart
              market={market}
              awarenessType={awarenessType}
              currentAwareness={clampedAwareness}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-5 shadow-card"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              💡 Insight
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {mode === "budget" ? (
                <>
                  Avec un budget de <strong>{budget.toLocaleString("fr-FR")} €</strong>, votre marque peut gagner{" "}
                  <strong className="text-gradient-primary">
                    {"pointsGained" in result ? result.pointsGained : 0} points
                  </strong>{" "}
                  de notoriété, passant de {clampedAwareness}% à{" "}
                  {"finalAwareness" in result ? result.finalAwareness : clampedAwareness}%.
                  Le coût moyen par point est de{" "}
                  <strong>{result.costPerPoint.toLocaleString("fr-FR")} €</strong>.
                </>
              ) : (
                <>
                  Pour atteindre <strong>{clampedGoal}%</strong> de notoriété (contre {clampedAwareness}% aujourd'hui),
                  il vous faudra un budget estimé à{" "}
                  <strong className="text-gradient-primary">
                    {"totalBudget" in result ? result.totalBudget.toLocaleString("fr-FR") : 0} €
                  </strong>
                  , soit un coût moyen de{" "}
                  <strong>{result.costPerPoint.toLocaleString("fr-FR")} € par point</strong>.
                </>
              )}
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
