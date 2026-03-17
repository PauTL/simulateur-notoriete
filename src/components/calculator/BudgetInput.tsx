import { CalcMode } from "@/lib/calculator";
import { Slider } from "@/components/ui/slider";

interface BudgetInputProps {
  mode: CalcMode;
  budget: number;
  onBudgetChange: (v: number) => void;
  goal: number;
  onGoalChange: (v: number) => void;
  currentAwareness: number;
  maxAwareness: number;
}

export function BudgetInput({
  mode,
  budget,
  onBudgetChange,
  goal,
  onGoalChange,
  currentAwareness,
  maxAwareness,
}: BudgetInputProps) {
  if (mode === "budget") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Budget net
          </label>
          <span className="text-lg font-display font-bold text-foreground">
            {budget.toLocaleString("fr-FR")} €
          </span>
        </div>
        <Slider
          value={[budget]}
          onValueChange={([v]) => onBudgetChange(v)}
          min={50000}
          max={5000000}
          step={50000}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>50K €</span>
          <span>5M €</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Objectif notoriété
        </label>
        <span className="text-lg font-display font-bold text-success">
          {goal}%
        </span>
      </div>
      <Slider
        value={[goal]}
        onValueChange={([v]) => onGoalChange(v)}
        min={Math.max(currentAwareness + 1, 1)}
        max={maxAwareness}
        step={1}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentAwareness + 1}%</span>
        <span>{maxAwareness}%</span>
      </div>
    </div>
  );
}
