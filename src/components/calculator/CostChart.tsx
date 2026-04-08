import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { MarketType, generateCostCurve, getMarginalCost } from "@/lib/calculator";
import { motion } from "framer-motion";

interface CostChartProps {
  market: MarketType;
  currentAwareness: number;
  goalAwareness?: number;
}

export function CostChart({ market, currentAwareness, goalAwareness }: CostChartProps) {
  const data = useMemo(
    () => generateCostCurve(market, "assisted"),
    [market]
  );

  const currentCost = Math.round(getMarginalCost(market, "assisted", currentAwareness));
  const goalCost = goalAwareness != null ? Math.round(getMarginalCost(market, "assisted", goalAwareness)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border"
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Coût marginal du point de notoriété assistée
      </h3>
      <ResponsiveContainer width="100%" height={320}>
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
            label={{ value: "Notoriété assistée (%)", position: "insideBottom", offset: -5, fontSize: 11 }}
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
          {/* Current position - yellow dot */}
          <ReferenceDot
            x={currentAwareness}
            y={currentCost}
            r={8}
            fill="hsl(var(--secondary))"
            stroke="hsl(46 99% 35%)"
            strokeWidth={2}
            ifOverflow="extendDomain"
          />
          {/* Goal position - blue dot */}
          {goalAwareness != null && goalCost != null && (
            <ReferenceDot
              x={goalAwareness}
              y={goalCost}
              r={8}
              fill="hsl(var(--primary))"
              stroke="hsl(214 72% 42%)"
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span className="text-xs font-medium text-muted-foreground">Situation actuelle</span>
        </div>
        {goalAwareness != null && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground">Objectif</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
