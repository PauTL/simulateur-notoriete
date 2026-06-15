import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
      {/* Inputs + Chart unified block */}
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

        <div className="mt-10">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Répartition des GRP & courbe de mémorisation
          </h3>


        {/* Line chart: % mémorisation */}
        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" vertical={true} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "hsl(220 12% 55%)" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(220 15% 88%)" }}
                interval={0}
                tickFormatter={(w) => (w % 2 === 1 ? String(w) : "")}
                height={28}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={{ fontSize: 11, fill: "hsl(220 12% 55%)" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(220 14% 88%)",
                  boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Mémorisation"]}
                labelFormatter={(w) => `Semaine ${w}`}
              />
              <Line
                type="monotone"
                dataKey="awareness"
                name="Mémorisation"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Week allocation row */}
        <div className="mt-4 overflow-x-auto scrollbar-thin" style={{ paddingLeft: 44, paddingRight: 24 }}>
          <div style={{ minWidth: "fit-content" }}>
            <div className="flex gap-1">
              {data.map((d) => {
                const active = d.grp > 0;
                return (
                  <div key={d.week} className="relative flex-shrink-0 pt-2 pr-2">
                    <button
                      type="button"
                      title={`S${d.week} — ${d.grp} GRP`}
                      className={[
                        "h-9 w-10 rounded-lg text-xs font-semibold transition-all duration-150 select-none focus:outline-none flex items-center justify-center",
                        active
                          ? "shadow-sm bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border",
                      ].join(" ")}
                    >
                      {d.week}
                    </button>
                    {active && (
                      <span className="absolute -top-0 -right-0 min-w-[22px] h-[18px] px-1.5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {d.grp}
                      </span>
                    )}
                  </div>

                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground" style={{ paddingLeft: 44 }}>
          <span className="font-semibold text-foreground">Recommandation —</span>{" "}
          {totalGrp.toLocaleString("fr-FR")} GRP distribués sur 52 semaines
        </div>
        </div>
      </motion.div>



    </div>
  );
}
