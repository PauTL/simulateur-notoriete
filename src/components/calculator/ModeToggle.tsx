import { motion } from "framer-motion";
import { CalcMode } from "@/lib/calculator";

interface ModeToggleProps {
  mode: CalcMode;
  onChange: (mode: CalcMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Mode de calcul
      </label>
      <div className="relative bg-card rounded-xl p-1 shadow-card">
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-gradient-primary shadow-hero"
          initial={false}
          animate={{
            left: mode === "budget" ? "4px" : "50%",
            right: mode === "goal" ? "4px" : "50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
        <div className="relative flex">
          <button
            onClick={() => onChange("budget")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors duration-200 ${
              mode === "budget" ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            💰 Budget
          </button>
          <button
            onClick={() => onChange("goal")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors duration-200 ${
              mode === "goal" ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            🎯 Objectif
          </button>
        </div>
      </div>
    </div>
  );
}
