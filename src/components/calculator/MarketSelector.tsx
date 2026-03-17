import { motion } from "framer-motion";
import { MarketType, MARKET_LABELS, MARKET_ICONS } from "@/lib/calculator";

interface MarketSelectorProps {
  value: MarketType;
  onChange: (value: MarketType) => void;
}

const markets: MarketType[] = [
  "new_brand_new_market",
  "new_brand_low_competition",
  "new_brand_high_competition",
  "established_high_competition",
  "established_saturated",
];

export function MarketSelector({ value, onChange }: MarketSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Type de marché
      </label>
      <div className="space-y-2">
        {markets.map((market) => (
          <motion.button
            key={market}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(market)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
              value === market
                ? "bg-primary text-primary-foreground shadow-hero"
                : "bg-card text-foreground shadow-card hover:shadow-elevated"
            }`}
          >
            <span className="text-lg">{MARKET_ICONS[market]}</span>
            <span className="leading-tight">{MARKET_LABELS[market]}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
