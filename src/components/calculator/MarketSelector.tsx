import { MARKET_LABELS, MARKET_ICONS, MarketType } from "@/lib/calculator";

interface MarketSelectorProps {
  value: MarketType;
  onChange: (market: MarketType) => void;
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MarketType)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {markets.map((m) => (
        <option key={m} value={m}>
          {MARKET_ICONS[m]} {MARKET_LABELS[m]}
        </option>
      ))}
    </select>
  );
}
