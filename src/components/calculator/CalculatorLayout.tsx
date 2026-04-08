import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MarketType,
  CalcMode,
  computeFromBudget,
  computeFromGoal,
  getSpontaneousFromAssisted,
  getTopOfMindFromSpontaneous,
} from "@/lib/calculator";
import { MarketSelector } from "./MarketSelector";
import { AwarenessChart } from "./AwarenessChart";
import { TopOfMindChart } from "./TopOfMindChart";
import { CostChart } from "./CostChart";
import { Slider } from "@/components/ui/slider";

export function CalculatorLayout() {
  const [mode, setMode] = useState<CalcMode>("budget");
  const [market, setMarket] = useState<MarketType>("new_brand_low_competition");
  const [currentAwareness, setCurrentAwareness] = useState(15);
  const [budget, setBudget] = useState(500000);
  const [goal, setGoal] = useState(40);

  const result = useMemo(() => {
    if (mode === "budget") {
      return computeFromBudget(market, "assisted", currentAwareness, budget);
    }
    return computeFromGoal(market, "assisted", currentAwareness, goal);
  }, [market, currentAwareness, mode, budget, goal]);

  // Derived awareness values
  const currentSpontaneous = getSpontaneousFromAssisted(market, currentAwareness);
  const currentTopOfMind = getTopOfMindFromSpontaneous(market, currentSpontaneous);

  const finalAssisted = mode === "budget" 
    ? ("finalAwareness" in result ? result.finalAwareness : currentAwareness)
    : goal;
  const finalSpontaneous = getSpontaneousFromAssisted(market, finalAssisted);
  const finalTopOfMind = getTopOfMindFromSpontaneous(market, finalSpontaneous);

  const pointsGainedAssisted = Math.round((finalAssisted - currentAwareness) * 10) / 10;
  const pointsGainedSpontaneous = Math.round((finalSpontaneous - currentSpontaneous) * 10) / 10;
  const pointsGainedTopOfMind = Math.round((finalTopOfMind - currentTopOfMind) * 10) / 10;

  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Brand Equity Calculator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulateur de notoriété de marque
        </p>
      </motion.div>

      {/* Step 1: Mode choice */}
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
            💰 J'ai un budget → quel objectif puis-je atteindre ?
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
            <MarketSelector value={market} onChange={(m) => setMarket(m)} />
          </div>

          {/* Current awareness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notoriété assistée actuelle
              </label>
              <span className="text-base font-bold text-foreground">{currentAwareness}%</span>
            </div>
            <Slider
              value={[currentAwareness]}
              onValueChange={([v]) => setCurrentAwareness(v)}
              min={0}
              max={100}
              step={1}
              className="py-2"
            />
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Objectif notoriété
                  </label>
                  <span className="text-base font-bold text-primary">
                    {goal}%
                  </span>
                </div>
                <Slider
                  value={[goal]}
                  onValueChange={([v]) => setGoal(v)}
                  min={0}
                  max={100}
                  step={1}
                  className="py-2"
                />
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Result block + Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Main result card */}
        <motion.div className="rounded-2xl p-5 bg-primary text-primary-foreground shadow-elevated">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
            Notoriété assistée
          </p>
          {mode === "budget" ? (
            <>
              <p className="text-3xl font-bold tracking-tight">
                {result.costPerPoint.toLocaleString("fr-FR")} €
              </p>
              <p className="text-xs mt-2 opacity-70">
                par point · +{"pointsGained" in result ? result.pointsGained : 0} pts → {"finalAwareness" in result ? result.finalAwareness : 0}%
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight">
                {"totalBudget" in result ? result.totalBudget.toLocaleString("fr-FR") : 0} €
              </p>
              <p className="text-xs mt-2 opacity-70">
                budget · {"pointsNeeded" in result ? result.pointsNeeded : 0} pts à gagner · {result.costPerPoint.toLocaleString("fr-FR")} €/pt
              </p>
            </>
          )}
        </motion.div>

        {/* Insight block - takes 2 columns */}
        <motion.div className="md:col-span-2 bg-secondary/50 border border-secondary rounded-2xl p-5 flex items-center">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-bold text-secondary-foreground">💡 Insight —</span>{" "}
            {mode === "budget" ? (
              <>
                Avec un budget de <strong>{budget.toLocaleString("fr-FR")} €</strong>, votre marque peut gagner{" "}
                <strong className="text-primary">
                  {"pointsGained" in result ? result.pointsGained : 0} points
                </strong>{" "}
                de notoriété assistée, passant de {currentAwareness}% à{" "}
                {"finalAwareness" in result ? result.finalAwareness : currentAwareness}%.
                Le coût moyen par point est de{" "}
                <strong>{result.costPerPoint.toLocaleString("fr-FR")} €</strong>.
              </>
            ) : (
              <>
                Pour atteindre <strong>{goal}%</strong> de notoriété assistée (contre {currentAwareness}% aujourd'hui),
                il vous faudra un budget estimé à{" "}
                <strong className="text-primary">
                  {"totalBudget" in result ? result.totalBudget.toLocaleString("fr-FR") : 0} €
                </strong>
                , soit un coût moyen de{" "}
                <strong>{result.costPerPoint.toLocaleString("fr-FR")} € par point</strong>.
              </>
            )}
          </p>
        </motion.div>
      </motion.div>

      {/* Cost chart - full width */}
      <CostChart
        market={market}
        currentAwareness={currentAwareness}
        goalAwareness={finalAssisted}
      />

      {/* 3 small blocks: points gained */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="rounded-2xl p-5 bg-primary text-primary-foreground shadow-elevated text-center">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-2">
            Points à gagner en assistée
          </p>
          <p className="text-3xl font-bold tracking-tight">+{pointsGainedAssisted}</p>
          <p className="text-xs mt-1 opacity-70">{currentAwareness}% → {finalAssisted}%</p>
        </div>
        <div className="rounded-2xl p-5 bg-secondary text-secondary-foreground shadow-card text-center">
          <p className="text-xs font-medium uppercase tracking-wider mb-2">
            Points à gagner en spontanée
          </p>
          <p className="text-3xl font-bold tracking-tight">+{pointsGainedSpontaneous}</p>
          <p className="text-xs mt-1 opacity-70">{currentSpontaneous}% → {finalSpontaneous}%</p>
        </div>
        <div className="rounded-2xl p-5 bg-secondary text-secondary-foreground shadow-card text-center">
          <p className="text-xs font-medium uppercase tracking-wider mb-2">
            Points à gagner en top of mind
          </p>
          <p className="text-3xl font-bold tracking-tight">+{pointsGainedTopOfMind}</p>
          <p className="text-xs mt-1 opacity-70">{currentTopOfMind}% → {finalTopOfMind}%</p>
        </div>
      </motion.div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AwarenessChart
          market={market}
          currentAssisted={currentAwareness}
          currentSpontaneous={currentSpontaneous}
        />
        <TopOfMindChart
          market={market}
          currentSpontaneous={currentSpontaneous}
          currentTopOfMind={currentTopOfMind}
        />
      </div>
    </div>
  );
}
