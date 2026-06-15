import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface GrpTabProps {
  currentAssisted: number;
  targetAssisted: number;
}

const WEEKS = 52;
const WEEKLY_FORGET = 0.08; // 8% decay per week without exposure

/**
 * Build a weekly GRP allocation that:
 * 1) ramps the brand from currentAssisted up to targetAssisted during a "boost" phase
 * 2) then holds it with a maintenance GRP level
 *
 * Model per week:
 *   decayed = awareness * (1 - forget)
 *   newReach = couverture * (1 - (1 - beta) ^ (grp / couverture))
 *   awareness = decayed + (100 - decayed) * newReach / 100
 */
function simulate(
  currentAssisted: number,
  targetAssisted: number,
  beta: number,
  couverture: number,
  costPerGrp: number
) {
  const target = Math.max(currentAssisted, Math.min(95, targetAssisted));
  const cov = Math.max(1, couverture);
  const b = Math.max(0.01, Math.min(0.95, beta));

  // GRP needed in a single week to maintain target awareness against decay
  const decayLoss = target * WEEKLY_FORGET; // points lost / week at equilibrium
  const remainingShare = Math.max(0.01, (100 - target * (1 - WEEKLY_FORGET)) / 100);
  const reachNeeded = Math.min(0.99, decayLoss / 100 / remainingShare); // fraction of pop to newly reach
  // reachNeeded = (cov/100) * (1 - (1-b)^(grp/cov)) → solve for grp
  const ratio = 1 - reachNeeded / (cov / 100);
  const maintenanceGrp = ratio > 0
    ? Math.max(0, Math.round((Math.log(ratio) / Math.log(1 - b)) * cov))
    : Math.round(cov * 5);

  // Boost phase: front-load GRP to climb to target within ~10 weeks
  const boostWeeks = 10;
  const boostGrp = Math.round(maintenanceGrp * 2.5 + cov * 1.2);

  const data: { week: number; grp: number; awareness: number; target: number }[] = [];
  let awareness = currentAssisted;

  for (let w = 1; w <= WEEKS; w++) {
    // taper boost linearly from boostGrp down to maintenanceGrp over boostWeeks
    let grp: number;
    if (w <= boostWeeks) {
      const t = (w - 1) / (boostWeeks - 1);
      grp = Math.round(boostGrp * (1 - t) + maintenanceGrp * t);
    } else {
      grp = maintenanceGrp;
    }

    const decayed = awareness * (1 - WEEKLY_FORGET);
    const newReachFrac = (cov / 100) * (1 - Math.pow(1 - b, grp / cov));
    awareness = decayed + (100 - decayed) * newReachFrac;
    awareness = Math.min(95, awareness);

    data.push({
      week: w,
      grp,
      awareness: Math.round(awareness * 10) / 10,
      target,
    });
  }

  const totalGrp = data.reduce((s, d) => s + d.grp, 0);
  const totalBudget = totalGrp * costPerGrp;

  return { data, maintenanceGrp, boostGrp, totalGrp, totalBudget };
}

export function GrpTab({ currentAssisted, targetAssisted }: GrpTabProps) {
  const [beta, setBeta] = useState(30); // %
  const [couverture, setCouverture] = useState(60); // %
  const [costPerGrp, setCostPerGrp] = useState(4000); // €

  const { data, maintenanceGrp, boostGrp, totalGrp, totalBudget } = useMemo(
    () => simulate(currentAssisted, targetAssisted, beta / 100, couverture, costPerGrp),
    [currentAssisted, targetAssisted, beta, couverture, costPerGrp]
  );

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-card border border-border"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Coût du GRP
            </label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={costPerGrp}
                onChange={(e) => setCostPerGrp(Math.max(0, Number(e.target.value)))}
                className="h-9 pr-8 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                €
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                BETA
              </label>
              <span className="text-base font-bold text-foreground">{beta}%</span>
            </div>
            <Slider
              value={[beta]}
              onValueChange={([v]) => setBeta(v)}
              min={5}
              max={80}
              step={1}
              className="py-2"
            />
            <p className="text-[11px] text-muted-foreground leading-tight">
              % de personnes qui se souviennent d'une publicité après une seule exposition
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Couverture
              </label>
              <span className="text-base font-bold text-foreground">{couverture}%</span>
            </div>
            <Slider
              value={[couverture]}
              onValueChange={([v]) => setCouverture(v)}
              min={10}
              max={95}
              step={1}
              className="py-2"
            />
            <p className="text-[11px] text-muted-foreground leading-tight">
              % maximal de la cible touchée par la campagne
            </p>
          </div>
        </div>
      </motion.div>


      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-card border border-border"
      >
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Répartition des GRP & courbe de mémorisation
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 88%)" />
            <XAxis
              dataKey="week"
              label={{ value: "Semaine", position: "insideBottom", offset: -5, fontSize: 11 }}
              tick={{ fontSize: 10 }}
              stroke="hsl(220 10% 46%)"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10 }}
              stroke="hsl(220 10% 46%)"
              label={{ value: "GRP", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              stroke="hsl(220 10% 46%)"
              label={{ value: "Notoriété assistée (%)", angle: 90, position: "insideRight", offset: 10, fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(220 14% 88%)",
                boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                if (name === "GRP") return [`${value}`, "GRP"];
                if (name === "Notoriété") return [`${value}%`, "Notoriété"];
                if (name === "Cible") return [`${value}%`, "Cible"];
                return [value, name];
              }}
              labelFormatter={(w) => `Semaine ${w}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="grp"
              name="GRP"
              fill="hsl(var(--secondary))"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="awareness"
              name="Notoriété"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
              animationDuration={600}
            />
            <ReferenceLine
              yAxisId="right"
              y={targetAssisted}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 4"
              label={{
                value: `Cible ${targetAssisted}%`,
                position: "insideTopRight",
                fontSize: 11,
                fill: "hsl(var(--primary))",
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
