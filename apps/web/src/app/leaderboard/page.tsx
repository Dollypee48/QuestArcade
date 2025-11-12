"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Sparkles, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/use-game-store";

export default function LeaderboardPage() {
  const { leaderboard } = useGameStore();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <Badge variant="primary" className="gap-2">
          <Crown className="h-4 w-4" />
          Arcade leaderboard
        </Badge>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Seize the top of the QuestArcade ranks
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
          Weekly and monthly seasons reset every 30 days. Complete high-impact quests to earn bonus XP and
          unlock exclusive avatar skins.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.id}
              className="glass-card flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-card p-6 shadow-glow-sm sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10"
                    style={{ boxShadow: index < 3 ? "0 0 25px rgba(255,255,255,0.25)" : undefined }}
                  >
                    <span className="text-2xl font-semibold text-white">
                      {entry.name.charAt(0)}
                    </span>
                  </div>
                  {index < 3 && (
                    <Badge
                      variant="accent"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]"
                    >
                      Top {index + 1}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{entry.name}</h3>
                    {index === 0 && <Sparkles className="h-4 w-4 text-secondary" />}
                  </div>
                  <p className="text-xs uppercase tracking-widest text-white/60">
                    Level {entry.level} • {entry.questsCompleted} quests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/70">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-white/50">XP</p>
                  <p className="text-lg font-semibold text-white">{entry.xp.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-white/50">Earnings</p>
                  <p className="text-lg font-semibold text-white">cUSD {entry.earnings}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>

        <aside className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Medal className="h-5 w-5 text-secondary" />
                Seasonal rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
                <p className="font-semibold text-white">Mythic Rank (Top 1)</p>
                <p className="mt-1 text-xs">Unlock the Radiant Neon avatar skin + 500 cUSD bonus.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
                <p className="font-semibold text-white">Platinum Rank (Top 50)</p>
                <p className="mt-1 text-xs">Double XP on impact quests for the next season.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
                <p className="font-semibold text-white">Weekly Streak Masters</p>
                <p className="mt-1 text-xs">
                  Maintain a 7-day streak and receive boosted referral rewards.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-secondary" />
                How to climb faster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-white/65">
              <p>• Complete mission streaks for multiplier bonuses.</p>
              <p>• Choose quests with higher verification difficulty for extra XP.</p>
              <p>• Team up with partners to claim collaborative quests.</p>
              <p>• Submit proof early to earn fast-track review multipliers.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

