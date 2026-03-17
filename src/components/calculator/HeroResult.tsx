import { motion, AnimatePresence } from "framer-motion";
import { CalcMode } from "@/lib/calculator";

interface HeroResultProps {
  mode: CalcMode;
  costPerPoint: number;
  totalBudget?: number;
  pointsGained?: number;
  pointsNeeded?: number;
  finalAwareness?: number;
}

export function HeroResult({
  mode,
  costPerPoint,
  totalBudget,
  pointsGained,
  pointsNeeded,
  finalAwareness,
}: HeroResultProps) {
  return (
    <motion.div
      layout
      className="bg-gradient-primary rounded-2xl p-6 shadow-hero text-primary-foreground"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${costPerPoint}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {mode === "budget" ? (
            <div className="space-y-4">
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Coût par point de notoriété
              </p>
              <p className="text-5xl font-display font-bold tracking-tight">
                {costPerPoint.toLocaleString("fr-FR")} €
              </p>
              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-xs opacity-70">Points gagnés</p>
                  <p className="text-xl font-display font-bold">
                    +{pointsGained} pts
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Notoriété finale</p>
                  <p className="text-xl font-display font-bold">
                    {finalAwareness}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Budget nécessaire
              </p>
              <p className="text-5xl font-display font-bold tracking-tight">
                {(totalBudget ?? 0).toLocaleString("fr-FR")} €
              </p>
              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-xs opacity-70">Points à gagner</p>
                  <p className="text-xl font-display font-bold">
                    +{pointsNeeded} pts
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Coût / point</p>
                  <p className="text-xl font-display font-bold">
                    {costPerPoint.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
