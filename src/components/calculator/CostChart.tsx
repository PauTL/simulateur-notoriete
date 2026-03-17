import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { MarketType, AwarenessType, AWARENESS_LABELS, generateCostCurve } from "@/lib/calculator";
import { motion } from "framer-motion";

interface CostChartProps {
  market: MarketType;
  awarenessType: AwarenessType;
  onAwarenessTypeChange: (type: AwarenessType) => void;
  currentAwareness: number;
}

const types: AwarenessType[] = ["assisted", "spontaneous", "top_of_mind"];
const typeLabels: Record<AwarenessType, string> = {
  assisted: "Assistée",
  spontaneous: "Spontanée",
  top_of_mind: "Top of Mind",
};

export function CostChart({ market, awarenessType, onAwarenessTypeChange, currentAwareness }: CostChartProps) {
  const data = useMemo(
    () => generateCostCurve(market, awarenessType),
    [market, awarenessType]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Coût marginal du point
        </h3>
        <div className="inline-flex bg-muted rounded-lg p-0.5">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onAwarenessTypeChange(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                awarenessType === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(214 72% 52%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(214 72% 52%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
          <XAxis
            dataKey="awareness"
            label={{ value: `${AWARENESS_LABELS[awarenessType]} (%)`, position: "insideBottom", offset: -5, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(220 10% 46%)"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="hsl(220 10% 46%)"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            label={{ value: "€ / point", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(220 14% 88%)",
              boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toLocaleString("fr-FR")} €`, "Coût / point"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="hsl(214 72% 52%)"
            strokeWidth={2.5}
            fill="url(#costGradient)"
            animationDuration={600}
          />
          <ReferenceLine
            x={currentAwareness}
            stroke="hsl(var(--secondary))"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{
              value: "Vous",
              position: "top",
              fill: "hsl(46 99% 35%)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
