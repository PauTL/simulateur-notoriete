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
      className="bg-card rounded-2xl p-5 shadow-elevated"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Courbe Notoriété Spontanée vs Assistée
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis
            dataKey="assisted"
            label={{ value: "Notoriété assistée (%)", position: "insideBottom", offset: -5, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(215 14% 46%)"
          />
          <YAxis
            label={{ value: "Spontanée (%)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
            tick={{ fontSize: 10 }}
            stroke="hsl(215 14% 46%)"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Line
            type="monotone"
            dataKey="spontaneous"
            stroke="hsl(239 84% 67%)"
            strokeWidth={3}
            dot={false}
            animationDuration={600}
          />
          <ReferenceDot
            x={currentAssisted}
            y={currentSpontaneous}
            r={8}
            fill="hsl(350 89% 60%)"
            stroke="white"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-2 mt-3 justify-center">
        <div className="w-3 h-3 rounded-full bg-rose pulse-marker" />
        <span className="text-xs font-medium text-muted-foreground">Votre marque actuellement</span>
      </div>
    </motion.div>
  );
}
