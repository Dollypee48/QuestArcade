import Link from "next/link";
import { MapPin, Clock, Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Quest } from "@/store/use-game-store";

type QuestCardProps = {
  quest: Quest;
  onAccept?: (questId: string) => void;
  isAccepting?: boolean;
  showAcceptButton?: boolean;
  hasAcceptedQuest?: boolean;
};

const difficultyColors: Record<Quest["difficulty"], string> = {
  Easy: "border-green-500/50 bg-green-500 text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
  Medium: "border-yellow-500/50 bg-yellow-500 text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
  Hard: "border-orange-500/50 bg-orange-500 text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
  Mythic: "border-purple-500/50 bg-purple-500 text-white shadow-[0_4px_8px_rgba(0,0,0,0.4),0_0_12px_rgba(147,51,234,0.5)]",
};

export function QuestCard({ quest, onAccept, isAccepting = false, showAcceptButton = true, hasAcceptedQuest = false }: QuestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card relative flex flex-col gap-6 rounded-2xl border-2 border-foreground/20 bg-card/80 p-6 shadow-[0_6px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge
              variant="default"
              className={`border-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColors[quest.difficulty]}`}
            >
              ⚡ {quest.difficulty}
            </Badge>
            {quest.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="accent" className="border-2 border-accent/50 bg-accent text-white text-[11px] font-bold shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className="mt-3 text-xl font-semibold text-foreground">{quest.title}</h3>
          <p className="mt-2 text-sm text-foreground/70">{quest.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">💰 Reward</p>
          <p className="text-2xl font-bold text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">cUSD {quest.reward}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-foreground/80">
            <Trophy className="h-4 w-4 text-yellow-500" /> +{quest.xp} XP
          </p>
        </div>
      </div>
      <div className="grid gap-3 text-sm text-foreground/70 sm:grid-cols-4">
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
        <div className="text-xs text-foreground/50">
          Powered by Celo Composer • Proof stored on IPFS • Creator funded
        </div>
        <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-lg font-bold uppercase tracking-wide">
              <Link href={`/quests/${quest.id}`}>📋 View Details</Link>
            </Button>
          {showAcceptButton && (
            <Button
              className="rounded-lg font-bold uppercase tracking-wide"
              onClick={() => onAccept?.(quest.id)}
              disabled={isAccepting || hasAcceptedQuest}
            >
              {isAccepting ? "⚡ Accepting…" : hasAcceptedQuest ? "✓ Accepted" : "🎯 Accept Quest"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

