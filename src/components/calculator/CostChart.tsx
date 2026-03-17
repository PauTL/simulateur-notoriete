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
  currentAwareness: number;
}

export function CostChart({ market, awarenessType, currentAwareness }: CostChartProps) {
  const data = useMemo(
    () => generateCostCurve(market, awarenessType),
    [market, awarenessType]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl p-5 shadow-elevated"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Coût marginal du point — {AWARENESS_LABELS[awarenessType]}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis
            dataKey="awareness"
            label={{ value: `${AWARENESS_LABELS[awarenessType]} (%)`, position: "insideBottom", offset: -5, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(215 14% 46%)"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="hsl(215 14% 46%)"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            label={{ value: "€ / point", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toLocaleString("fr-FR")} €`, "Coût / point"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="hsl(239 84% 67%)"
            strokeWidth={3}
            fill="url(#costGradient)"
            animationDuration={600}
          />
          <ReferenceLine
            x={currentAwareness}
            stroke="hsl(350 89% 60%)"
            strokeWidth={2}
            strokeDasharray="6 4"
            label={{
              value: "Vous",
              position: "top",
              fill: "hsl(350 89% 60%)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
