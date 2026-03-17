import { AwarenessType, AWARENESS_LABELS } from "@/lib/calculator";
import { Slider } from "@/components/ui/slider";

interface AwarenessInputsProps {
  awarenessType: AwarenessType;
  onTypeChange: (type: AwarenessType) => void;
  currentAwareness: number;
  onAwarenessChange: (value: number) => void;
  max: number;
}

const types: AwarenessType[] = ["assisted", "spontaneous", "top_of_mind"];

export function AwarenessInputs({
  awarenessType,
  onTypeChange,
  currentAwareness,
  onAwarenessChange,
  max,
}: AwarenessInputsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Type de notoriété
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                awarenessType === type
                  ? "bg-primary text-primary-foreground shadow-hero"
                  : "bg-card text-muted-foreground shadow-card hover:shadow-elevated"
              }`}
            >
              {type === "assisted" ? "Assistée" : type === "spontaneous" ? "Spontanée" : "Top of Mind"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {AWARENESS_LABELS[awarenessType]} actuelle
          </label>
          <span className="text-lg font-display font-bold text-foreground">
            {currentAwareness}%
          </span>
        </div>
        <Slider
          value={[currentAwareness]}
          onValueChange={([v]) => onAwarenessChange(v)}
          min={0}
          max={max}
          step={1}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>{max}%</span>
        </div>
      </div>
    </div>
  );
}
