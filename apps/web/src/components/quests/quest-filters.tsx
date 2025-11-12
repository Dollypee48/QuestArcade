import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuestFiltersProps = {
  location: string;
  radius: number;
  rewardRange: [number, number];
  difficulty: string[];
  verification: string[];
  onLocationChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onRewardChange: (value: [number, number]) => void;
  onToggleFilter: (type: "difficulty" | "verification", value: string) => void;
  onReset: () => void;
};

const difficulties = ["Easy", "Medium", "Hard", "Mythic"];
const verifications = ["Photo", "Video", "GPS", "Proof of Work"];

export function QuestFilters({
  location,
  radius,
  rewardRange,
  difficulty,
  verification,
  onLocationChange,
  onRadiusChange,
  onRewardChange,
  onToggleFilter,
  onReset,
}: QuestFiltersProps) {
  const hasActiveFilters = useMemo(
    () =>
      Boolean(location) ||
      radius !== 10 ||
      rewardRange[0] !== 0 ||
      rewardRange[1] !== 100 ||
      difficulty.length > 0 ||
      verification.length > 0,
    [location, radius, rewardRange, difficulty, verification]
  );

  return (
    <div className="glass-card flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-card p-6 shadow-glow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-secondary" />
          <span className="text-sm font-semibold text-white/90">Quest filters</span>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" className="gap-2 text-xs" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-widest text-white/60">Search location</Label>
          <Input
            placeholder="e.g. Nairobi, Lagos, Accra"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
          />
        </div>
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-widest text-white/60">Within radius (km)</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={radius}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
          />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-widest text-white/60">Reward range (cUSD)</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              value={rewardRange[0]}
              onChange={(event) => onRewardChange([Number(event.target.value), rewardRange[1]])}
            />
            <Input
              type="number"
              min={0}
              value={rewardRange[1]}
              onChange={(event) => onRewardChange([rewardRange[0], Number(event.target.value)])}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-widest text-white/60">Difficulty</Label>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((item) => {
              const isActive = difficulty.includes(item);
              return (
                <Badge
                  key={item}
                  variant={isActive ? "primary" : "default"}
                  className={`cursor-pointer border border-dashed border-white/15 px-4 py-2 text-xs ${isActive ? "shadow-glow" : ""}`}
                  onClick={() => onToggleFilter("difficulty", item)}
                >
                  {item}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-widest text-white/60">Verification Type</Label>
        <div className="flex flex-wrap gap-2">
          {verifications.map((item) => {
            const isActive = verification.includes(item);
            return (
              <Badge
                key={item}
                variant={isActive ? "accent" : "default"}
                className={`cursor-pointer border border-dashed border-white/15 px-4 py-2 text-xs ${isActive ? "shadow-glow-sm" : ""}`}
                onClick={() => onToggleFilter("verification", item)}
              >
                {item}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

