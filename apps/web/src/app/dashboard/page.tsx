"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Wallet,
  Map,
  ArrowRight,
  Crown,
  Bell,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestCard } from "@/components/quests/quest-card";
import { useGameStore } from "@/store/use-game-store";

const gridVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const {
    displayName,
    avatarUrl,
    level,
    xp,
    nextLevelXp,
    balance,
    streak,
    quests,
    progress,
    notifications,
  } = useGameStore();

  const xpProgress = Math.min(Math.round((xp / nextLevelXp) * 100), 100);
  const availableQuests = quests.filter(
    (quest) => !progress.find((item) => item.questId === quest.id && item.status !== "available")
  );

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge variant="primary" className="gap-2">
            <Crown className="h-4 w-4" />
            {level} League
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-white/70">
            Track your missions, XP growth, and upcoming quests. Complete seven quests this week to
            enter the Platinum leaderboard.
          </p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link href="/quests">
            Find new quests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <motion.div
            variants={gridVariant}
            initial="hidden"
            animate="show"
            className="glass-card rounded-[28px] border border-white/10 bg-gradient-card"
          >
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                    <Badge variant="accent" className="absolute -bottom-2 left-1/2 w-max -translate-x-1/2">
                      {level}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">{displayName}</CardTitle>
                    <p className="text-xs uppercase tracking-widest text-white/60">
                      Quest Pioneer • MiniPay verified
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-right">
                  <p className="text-xs uppercase tracking-widest text-white/60">Wallet balance</p>
                  <p className="text-2xl font-semibold text-white">cUSD {balance.toFixed(2)}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>XP Progress</span>
                    <span>
                      {xp}/{nextLevelXp} XP
                    </span>
                  </div>
                  <Progress className="mt-3" value={xpProgress} />
                  <p className="mt-2 text-xs text-white/60">
                    Complete {Math.max(1, Math.ceil((nextLevelXp - xp) / 250))} missions to reach the
                    next tier.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
                      <Flame className="h-4 w-4 text-secondary" />
                      Streak
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">{streak.current} days</p>
                    <p className="text-[11px] text-white/50">Best streak {streak.best} days</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
                      <Trophy className="h-4 w-4 text-secondary" />
                      Completed
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {progress.filter((item) => item.status === "completed").length}
                    </p>
                    <p className="text-[11px] text-white/50">All-time missions</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
                      <Map className="h-4 w-4 text-secondary" />
                      In progress
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {progress.filter((item) => item.status === "accepted" || item.status === "in-progress").length}
                    </p>
                    <p className="text-[11px] text-white/50">Active quests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.section
            className="space-y-4"
            variants={gridVariant}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Available quests nearby</h2>
              <Link href="/quests" className="text-xs text-secondary hover:text-secondary/80">
                View all quests
              </Link>
            </div>
            <div className="space-y-4">
              {availableQuests.slice(0, 3).map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          </motion.section>
        </div>

        <motion.aside
          className="space-y-6"
          variants={gridVariant}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.15 }}
        >
          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="text-white">Alerts & boosters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-background/60 p-5 text-sm text-white/70">
                  <Bell className="mb-2 h-5 w-5 text-secondary" />
                  <p>No new notifications. Complete a quest to trigger loot drops.</p>
                </div>
              ) : (
                notifications.slice(-4).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-white/10 bg-background/60 p-4 text-sm text-white/80"
                  >
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="text-xs text-white/60">{notification.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-white">MiniPay wallet status</CardTitle>
              <p className="text-xs text-white/60">
                Auto-sync with Celo contracts and claim cUSD rewards in real time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-background/60 p-4 text-sm text-white/70">
                <Wallet className="mb-2 h-5 w-5 text-secondary" />
                <p>Connect MiniPay to auto-claim quest rewards and gasless payouts.</p>
              </div>
              <Button variant="outline" className="w-full rounded-full border-white/20 bg-white/10">
                Connect MiniPay
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent completions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.filter((item) => item.status === "completed").slice(-3).map((item) => {
                const quest = quests.find((questItem) => questItem.id === item.questId);
                if (!quest) return null;
                return (
                  <div
                    key={item.questId}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 p-4 text-sm text-white/75"
                  >
                    <div>
                      <p className="font-semibold text-white">{quest.title}</p>
                      <p className="text-xs text-white/50">{quest.location}</p>
                    </div>
                    <div className="text-right text-xs text-secondary">
                      <CheckCircle2 className="ml-auto h-4 w-4" />
                      cUSD {quest.reward}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="text-white">Seasonal goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-white/70">
              <p>• Complete 5 impact quests to unlock the Aurora Avatar skin.</p>
              <p>• Maintain a 7-day streak for double XP booster next week.</p>
              <p>• Refer 3 MiniPay merchants to unlock Gold league status.</p>
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </div>
  );
}

