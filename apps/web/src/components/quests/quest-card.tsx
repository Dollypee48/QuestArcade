import Link from "next/link";
import { MapPin, Clock, Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Quest } from "@/store/use-game-store";

type QuestCardProps = {
  quest: Quest;
  onAccept?: (questId: string) => void;
};

const difficultyColors: Record<Quest["difficulty"], string> = {
  Easy: "bg-success/20 text-success-foreground",
  Medium: "bg-secondary/20 text-secondary-foreground",
  Hard: "bg-destructive/20 text-destructive-foreground",
  Mythic: "bg-primary/30 text-primary-foreground",
};

export function QuestCard({ quest, onAccept }: QuestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-card p-6 shadow-glow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge
              variant="default"
              className={`border-0 px-3 py-1 text-[10px] uppercase tracking-wider ${difficultyColors[quest.difficulty]}`}
            >
              {quest.difficulty}
            </Badge>
            {quest.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="accent" className="border-transparent bg-accent/15 text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">{quest.title}</h3>
          <p className="mt-2 text-sm text-white/70">{quest.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-white/60">Reward</p>
          <p className="text-2xl font-semibold text-white">cUSD {quest.reward}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-white/60">
            <Trophy className="h-3.5 w-3.5" /> +{quest.xp} XP
          </p>
        </div>
      </div>
      <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-secondary" />
          {quest.location}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-secondary" />
          {quest.timeLimitHours ? `${quest.timeLimitHours}h limit` : "Flexible"}
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          {quest.verification}
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-secondary" />
          {quest.distance}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-white/50">
          Powered by Celo Composer • Proof stored on IPFS • Creator funded
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost" className="rounded-full border border-white/20">
            <Link href={`/quests/${quest.id}`}>View details</Link>
          </Button>
          <Button
            className="rounded-full"
            onClick={() => onAccept?.(quest.id)}
          >
            Accept Quest
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

