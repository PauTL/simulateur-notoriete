import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { MarketType, generateAwarenessCurve } from "@/lib/calculator";
import { motion } from "framer-motion";

interface AwarenessChartProps {
  market: MarketType;
  currentAssisted: number;
  currentSpontaneous: number;
}

export function AwarenessChart({ market, currentAssisted, currentSpontaneous }: AwarenessChartProps) {
  const data = useMemo(() => generateAwarenessCurve(market), [market]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border"
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Courbe Spontanée vs Assistée
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
          <XAxis
            dataKey="assisted"
            label={{ value: "Notoriété assistée (%)", position: "insideBottom", offset: -5, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(220 10% 46%)"
          />
          <YAxis
            label={{ value: "Spontanée (%)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(220 10% 46%)"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(220 14% 88%)",
              boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Line
            type="monotone"
            dataKey="spontaneous"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
            animationDuration={600}
          />
          <ReferenceDot
            x={currentAssisted}
            y={currentSpontaneous}
            r={8}
            fill="hsl(46 99% 50%)"
            stroke="hsl(46 99% 35%)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-2 mt-3 justify-center">
        <div className="w-3 h-3 rounded-full bg-secondary pulse-marker" />
        <span className="text-xs font-medium text-muted-foreground">Votre marque actuellement</span>
      </div>
    </motion.div>
  );
}
