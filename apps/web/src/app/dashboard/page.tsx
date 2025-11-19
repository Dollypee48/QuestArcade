"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import { Flame, Trophy, Map, ArrowRight, Crown, Bell, Coins, CheckCircle2, XCircle, Clock, History } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestCard } from "@/components/quests/quest-card";
import { truncateAddress } from "@/lib/app-utils";
import { useGameStore } from "@/store/use-game-store";
import { useQuestActions } from "@/hooks/use-quest-actions";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";

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
  const { address, isConnected } = useAccount();
  const { refresh } = useQuestArcadeSync();
  const { claimReward, states } = useQuestActions({ onSettled: refresh });
  const { addXp } = useGameStore();
  const xpCalculatedRef = useRef<Set<string>>(new Set());

  // Recalculate XP from completed quests to ensure accuracy
  useEffect(() => {
    if (!address || quests.length === 0) return;

    const userCompletedQuests = quests.filter(
      (quest) =>
        quest.worker?.toLowerCase() === address.toLowerCase() &&
        quest.onChainState === "verified" &&
        quest.rewardClaimed
    );

    // Only process quests we haven't already calculated XP for
    const unprocessedQuests = userCompletedQuests.filter(
      (quest) => !xpCalculatedRef.current.has(quest.id)
    );

    if (unprocessedQuests.length > 0) {
      const xpToAdd = unprocessedQuests.reduce((sum, quest) => sum + (quest.xp ?? 0), 0);
      
      if (xpToAdd > 0) {
        addXp(xpToAdd);
        // Mark these quests as processed
        unprocessedQuests.forEach((quest) => xpCalculatedRef.current.add(quest.id));
      }
    }
  }, [address, quests, addXp]);

  const xpProgress = Math.min(Math.round((xp / nextLevelXp) * 100), 100);
  const availableQuests = quests.filter(
    (quest) => !progress.find((item) => item.questId === quest.id && item.status !== "available")
  );
  const myCreatedQuests = useMemo(() => {
    if (!address) return [];
    return quests.filter((quest) => quest.creator?.toLowerCase() === address.toLowerCase());
  }, [address, quests]);
  // Creator: Active quests (Open, Accepted, Submitted - not yet finalized)
  const myActiveQuests = useMemo(() => {
    if (!address) return [];
    return myCreatedQuests.filter(
      (quest) =>
        !quest.onChainState ||
        quest.onChainState === "active" ||
        quest.onChainState === "draft" ||
        quest.onChainState === "accepted" ||
        quest.onChainState === "submitted"
    );
  }, [address, myCreatedQuests]);
  
  // Creator: Quest history (Verified, Rejected, Completed)
  const myQuestHistory = useMemo(() => {
    if (!address) return [];
    return myCreatedQuests.filter(
      (quest) =>
        (quest.onChainState === "verified" && quest.rewardClaimed) ||
        quest.onChainState === "rejected"
    );
  }, [address, myCreatedQuests]);
  
  // Worker: In-progress quests (Accepted, Submitted - not yet verified)
  const myInProgressQuests = useMemo(() => {
    if (!address) return [];
    return quests.filter(
      (quest) =>
        quest.worker?.toLowerCase() === address.toLowerCase() &&
        (quest.onChainState === "accepted" || quest.onChainState === "submitted")
    );
  }, [address, quests]);
  
  // Worker: Rewards ready to claim (Verified, not claimed yet)
  const claimableQuests = useMemo(() => {
    if (!address) return [];
    return quests.filter(
      (quest) =>
        quest.onChainState === "verified" &&
        quest.worker?.toLowerCase() === address.toLowerCase() &&
        !quest.rewardClaimed
    );
  }, [address, quests]);
  
  // Worker: Completed quests (Verified and claimed)
  const myCompletedQuests = useMemo(() => {
    if (!address) return [];
    return quests.filter(
      (quest) =>
        quest.onChainState === "verified" &&
        quest.worker?.toLowerCase() === address.toLowerCase() &&
        quest.rewardClaimed === true
    );
  }, [address, quests]);

  const primaryLabel = useMemo(() => {
    if (displayName?.trim()) {
      return displayName;
    }
    if (address) {
      return truncateAddress(address);
    }
    return "Explorer";
  }, [displayName, address]);

  const secondaryLabel = useMemo(() => {
    if (isConnected) {
      return "Wallet connected";
    }
    return "Connect your wallet to sync progress";
  }, [isConnected]);

  const formattedBalance = balance ? balance.toFixed(2) : "0.00";
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);

  // Reset avatar error when avatarUrl changes
  useEffect(() => {
    if (avatarUrl) {
      setAvatarError(false);
      setAvatarLoading(true);
    }
  }, [avatarUrl]);

  // Track completed quest IDs to detect new completions
  const completedQuestIdsRef = useRef<Set<string>>(new Set());

  // Recalculate streak based on completed quests and last completion date
  useEffect(() => {
    if (!address || quests.length === 0) return;

    const completedQuests = quests.filter(
      (quest) =>
        quest.worker?.toLowerCase() === address.toLowerCase() &&
        quest.onChainState === "verified" &&
        quest.rewardClaimed
    );

    const currentCompletedIds = new Set(completedQuests.map((q) => q.id));
    const previousCompletedIds = completedQuestIdsRef.current;

    // Check if there are new completed quests
    const newCompletedQuests = completedQuests.filter(
      (quest) => !previousCompletedIds.has(quest.id)
    );

    // Update the ref with current completed quest IDs
    completedQuestIdsRef.current = currentCompletedIds;

    const { streak: currentStreakState } = useGameStore.getState();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (completedQuests.length === 0) {
      // No completed quests - reset streak if it exists
      if (currentStreakState.current > 0 || currentStreakState.lastCompleted) {
        useGameStore.setState({
          streak: {
            current: 0,
            best: currentStreakState.best,
            lastCompleted: undefined,
          },
        });
      }
      return;
    }

    // Only update streak if there are new completions
    if (newCompletedQuests.length === 0) {
      // Check if streak should be reset due to time passing
      if (currentStreakState.lastCompleted) {
        const lastCompletedDate = new Date(currentStreakState.lastCompleted);
        const lastCompletedDay = new Date(
          lastCompletedDate.getFullYear(),
          lastCompletedDate.getMonth(),
          lastCompletedDate.getDate()
        );
        
        const daysDiff = Math.floor(
          (today.getTime() - lastCompletedDay.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // If more than 1 day passed since last completion, reset streak
        if (daysDiff > 1) {
          useGameStore.setState({
            streak: {
              current: 0,
              best: currentStreakState.best,
              lastCompleted: undefined,
            },
          });
        }
      }
      return;
    }

    // We have new completions - update streak
    let newStreak = { ...currentStreakState };
    
    if (currentStreakState.lastCompleted) {
      const lastCompletedDate = new Date(currentStreakState.lastCompleted);
      const lastCompletedDay = new Date(
        lastCompletedDate.getFullYear(),
        lastCompletedDate.getMonth(),
        lastCompletedDate.getDate()
      );
      
      const daysDiff = Math.floor(
        (today.getTime() - lastCompletedDay.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 0) {
        // Same day - keep current streak (multiple quests completed today)
        newStreak = {
          ...currentStreakState,
          lastCompleted: now.toISOString(),
        };
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak = {
          current: currentStreakState.current + 1,
          best: Math.max(currentStreakState.current + 1, currentStreakState.best),
          lastCompleted: now.toISOString(),
        };
      } else {
        // More than 1 day passed - reset streak to 1
        newStreak = {
          current: 1,
          best: currentStreakState.best,
          lastCompleted: now.toISOString(),
        };
      }
    } else {
      // First completion - start streak
      newStreak = {
        current: 1,
        best: 1,
        lastCompleted: now.toISOString(),
      };
    }

    // Update streak
    useGameStore.setState({ streak: newStreak });
  }, [address, quests]);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-12">
      <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Badge variant="primary" className="gap-2 border-2 font-bold">
            <Crown className="h-4 w-4" />
            🏆 {level} League
          </Badge>
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
            Welcome back, {primaryLabel}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-foreground/70">
            {secondaryLabel}
          </p>
        </div>
        <Button asChild className="rounded-full px-4 sm:px-6 text-sm sm:text-base w-full sm:w-auto">
          <Link href="/quests">
            Find new quests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <motion.div
            variants={gridVariant}
            initial="hidden"
            animate="show"
            className="glass-card rounded-2xl border-2 border-foreground/20 bg-card/80 shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
          >
            <Card className="border-0 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-foreground/30 bg-card shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-center relative">
                      {avatarError || !avatarUrl || avatarUrl === "/avatars/default.png" || avatarUrl.trim() === "" ? (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-foreground">
                          {primaryLabel.charAt(0).toUpperCase() || "U"}
                        </div>
                      ) : (
                        <>
                          {avatarLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
                            </div>
                          )}
                          <Image
                            src={
                              avatarUrl.startsWith("http") || 
                              avatarUrl.startsWith("ipfs://") || 
                              avatarUrl.startsWith("/")
                                ? avatarUrl.startsWith("ipfs://")
                                  ? avatarUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                                  : avatarUrl
                                : `/avatars/${avatarUrl}`
                            }
                            alt="Avatar"
                            width={64}
                            height={64}
                            className={`h-full w-full object-cover ${avatarLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
                            unoptimized
                            onError={() => {
                              setAvatarError(true);
                              setAvatarLoading(false);
                            }}
                            onLoad={() => setAvatarLoading(false)}
                            priority
                          />
                        </>
                      )}
                    </div>
                    <Badge variant="primary" className="absolute -bottom-2 left-1/2 w-max -translate-x-1/2 border-2 font-bold">
                      🏆 {level}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-foreground">{primaryLabel}</CardTitle>
                    <p className="text-xs uppercase tracking-widest text-foreground/60">
                      {secondaryLabel}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-foreground/20 bg-card/80 px-5 py-3 text-right shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">💰 Wallet Balance</p>
                  <p className="text-2xl font-bold text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    cUSD {formattedBalance}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>XP Progress</span>
                    <span>
                      {xp}/{nextLevelXp} XP
                    </span>
                  </div>
                  <Progress className="mt-3" value={xpProgress} />
                  <p className="mt-2 text-xs text-foreground/60">
                    Complete {Math.max(1, Math.ceil((nextLevelXp - xp) / 250))} missions to reach the
                    next tier.
                  </p>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                  <div className="rounded-xl border-2 border-orange-500/30 bg-orange-500/10 p-3 sm:p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/80">
                      <Flame className="h-4 w-4 text-orange-500" />
                      🔥 Streak
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">{streak.current} days</p>
                    <p className="text-[11px] font-semibold text-foreground/60">Best: {streak.best} days</p>
                  </div>
                  <div className="rounded-xl border-2 border-green-500/30 bg-green-500/10 p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/80">
                      <Trophy className="h-4 w-4 text-green-500" />
                      ✅ Completed
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                      {myCompletedQuests.length}
                    </p>
                    <p className="text-[11px] font-semibold text-foreground/60">Quests finished</p>
                  </div>
                  <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/10 p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/80">
                      <Map className="h-4 w-4 text-blue-500" />
                      🚀 Created
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                      {myCreatedQuests.length}
                    </p>
                    <p className="text-[11px] font-semibold text-foreground/60">Quests launched</p>
                  </div>
                  <div className="rounded-xl border-2 border-purple-500/30 bg-purple-500/10 p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/80">
                      <Clock className="h-4 w-4 text-purple-500" />
                      ⏳ Active
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                      {myInProgressQuests.length}
                    </p>
                    <p className="text-[11px] font-semibold text-foreground/60">In progress</p>
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
              <h2 className="text-lg font-semibold text-foreground">Available quests nearby</h2>
              <Link href="/quests" className="text-xs text-secondary hover:text-secondary/80">
                View all quests
              </Link>
            </div>
            <div className="space-y-4">
              {availableQuests.slice(0, 3).map((quest) => {
                const isCreator = address && quest.creator?.toLowerCase() === address.toLowerCase();
                const questProgress = progress.find((item) => item.questId === quest.id);
                const hasAcceptedQuest = 
                  quest.worker?.toLowerCase() === address?.toLowerCase() ||
                  questProgress?.status === "accepted" ||
                  questProgress?.status === "in-progress" ||
                  questProgress?.status === "submitted" ||
                  quest.onChainState === "accepted" ||
                  quest.onChainState === "submitted";
                
                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    showAcceptButton={!isCreator}
                    hasAcceptedQuest={hasAcceptedQuest}
                  />
                );
              })}
            </div>
          </motion.section>

          {/* Creator: Active Quests Section */}
          {address && myActiveQuests.length > 0 && (
            <motion.section
              className="space-y-4"
              variants={gridVariant}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">My active quests</h2>
                  <p className="text-xs text-foreground/60">Quests you created that are open, accepted, or awaiting review.</p>
                </div>
                <Badge variant="accent" className="text-[10px] uppercase tracking-widest">
                  {myActiveQuests.length} active
                </Badge>
              </div>
              <div className="space-y-3">
                {myActiveQuests.map((quest) => {
                  const isSubmitted = quest.onChainState === "submitted";
                  return (
                    <div
                      key={quest.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 text-sm text-foreground/80 md:flex-row md:items-center md:justify-between ${
                        isSubmitted
                          ? "border-secondary/30 bg-secondary/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div>
                        <p className="text-foreground">{quest.title}</p>
                        <p className="text-xs text-foreground/60">
                          Reward {quest.reward} cUSD • {quest.onChainState === "submitted" ? "Proof submitted" : quest.onChainState || "Open"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSubmitted && (
                          <Badge
                            variant="accent"
                            className="border border-secondary/40 bg-secondary/10 text-secondary"
                          >
                            Awaiting review
                          </Badge>
                        )}
                        <Link
                          href={`/quests/${quest.id}`}
                          className="rounded-full border border-white/20 px-4 py-1 text-xs text-secondary hover:text-secondary/80"
                        >
                          View quest
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Creator: Quest History Section */}
          {address && myQuestHistory.length > 0 && (
            <motion.section
              className="space-y-4"
              variants={gridVariant}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-foreground/60" />
                    Quest history
                  </h2>
                  <p className="text-xs text-foreground/60">Completed, verified, and rejected quests from your profile.</p>
                </div>
                <Badge
                  variant="accent"
                  className="text-[10px] uppercase tracking-widest border border-white/20 bg-white/5 text-foreground"
                >
                  {myQuestHistory.length} completed
                </Badge>
              </div>
              <div className="space-y-3">
                {myQuestHistory.slice(0, 5).map((quest) => {
                  const isVerified = quest.onChainState === "verified";
                  const isRejected = quest.onChainState === "rejected";
                  return (
                    <Link
                      key={quest.id}
                      href={`/quests/${quest.id}`}
                      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/75 transition hover:bg-white/10 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        {isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                        ) : isRejected ? (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        ) : null}
                        <div>
                          <p className="font-semibold text-foreground">{quest.title}</p>
                          <p className="text-xs text-foreground/50">
                            {isVerified ? "Verified and rewarded" : isRejected ? "Rejected" : "Completed"} • {quest.reward} cUSD
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={isVerified ? "accent" : "default"}
                        className={`text-[10] uppercase tracking-widest w-fit ${
                          isRejected ? "border border-destructive/40 text-destructive" : ""
                        }`}
                      >
                        {isVerified ? "Verified" : isRejected ? "Rejected" : "Completed"}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Worker: In-Progress Quests Section */}
          {address && myInProgressQuests.length > 0 && (
            <motion.section
              className="space-y-4"
              variants={gridVariant}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    In progress
                  </h2>
                  <p className="text-xs text-foreground/60">Quests you&apos;re currently working on or have submitted.</p>
                </div>
                <Badge variant="accent" className="text-[10px] uppercase tracking-widest">
                  {myInProgressQuests.length} active
                </Badge>
              </div>
              <div className="space-y-3">
                {myInProgressQuests.map((quest) => {
                  const isSubmitted = quest.onChainState === "submitted";
                  return (
                    <Link
                      key={quest.id}
                      href={`/quests/${quest.id}`}
                      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/75 transition hover:bg-white/10 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{quest.title}</p>
                        <p className="text-xs text-foreground/50">
                          {isSubmitted ? "Proof submitted, awaiting verification" : "Accepted, work in progress"} • {quest.reward} cUSD
                        </p>
                      </div>
                      <Badge
                        variant="accent"
                        className="text-[10px] uppercase tracking-widest border border-secondary/40 bg-secondary/10 text-secondary w-fit"
                      >
                        {isSubmitted ? "Submitted" : "In Progress"}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>

        <motion.aside
          className="space-y-6"
          variants={gridVariant}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.15 }}
        >
          {claimableQuests.length > 0 && (
            <Card className="glass-card border-secondary/30 bg-secondary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Rewards ready to claim</CardTitle>
                  <Badge variant="accent" className="text-[10px] uppercase tracking-widest">
                    {claimableQuests.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {claimableQuests.map((quest) => {
                  const isClaiming = states.claim?.status === "pending" && states.claim?.questId === quest.id;
                  return (
                    <div
                      key={quest.id}
                      className="flex flex-col gap-3 rounded-2xl border border-secondary/40 bg-background/60 p-4 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{quest.title}</p>
                        <p className="mt-1 text-xs text-foreground/60">
                          Reward: <span className="text-secondary font-semibold">{quest.reward} cUSD</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={async () => {
                            try {
                              await claimReward(quest.id);
                              // Mark quest as processed to prevent double XP calculation
                              xpCalculatedRef.current.add(quest.id);
                            } catch {
                              // Error handling is done in the hook
                            }
                          }}
                          disabled={isClaiming}
                          className="flex-1 rounded-full bg-secondary text-foreground hover:bg-secondary/80"
                          size="sm"
                        >
                          {isClaiming ? (
                            <>
                              <Trophy className="mr-2 h-3 w-3 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Coins className="mr-2 h-3 w-3" />
                              Claim reward
                            </>
                          )}
                        </Button>
                        <Link
                          href={`/quests/${quest.id}`}
                          className="rounded-full border border-white/20 px-3 py-2 text-xs text-foreground/70 hover:text-foreground hover:bg-white/10"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Worker: Completed Quests Section */}
          {address && myCompletedQuests.length > 0 && (
            <Card className="glass-card border-white/10 bg-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-secondary" />
                    Completed quests
                  </CardTitle>
                  <Badge variant="accent" className="text-[10px] uppercase tracking-widest">
                    {myCompletedQuests.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myCompletedQuests.slice(-5).map((quest) => (
                  <Link
                    key={quest.id}
                    href={`/quests/${quest.id}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 p-4 text-sm text-foreground/75 transition hover:bg-white/10"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{quest.title}</p>
                      <p className="text-xs text-foreground/50">
                        Reward claimed • {quest.reward} cUSD
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="glass-card border-white/10 bg-white/10">
            <CardHeader>
              <CardTitle className="text-foreground">Alerts & boosters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-background/60 p-5 text-sm text-foreground/70">
                  <Bell className="mb-2 h-5 w-5 text-secondary" />
                  <p>No new notifications. Complete a quest to trigger loot drops.</p>
                </div>
              ) : (
                notifications.slice(-4).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-white/10 bg-background/60 p-4 text-sm text-foreground/80"
                  >
                    <p className="font-semibold text-foreground">{notification.title}</p>
                    <p className="text-xs text-foreground/60">{notification.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-foreground/40">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </motion.aside>
      </div>
    </div>
  );
}

