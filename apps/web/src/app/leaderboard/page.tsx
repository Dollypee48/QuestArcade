"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Sparkles, TrendingUp, User } from "lucide-react";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore, type LeaderboardEntry } from "@/store/use-game-store";
import { buildIpfsGatewayUrl } from "@/lib/ipfs";

const TOP_USERS_COUNT = 50;

function computeLeaderboard(
  quests: ReturnType<typeof useGameStore>["quests"],
  currentUserAddress?: `0x${string}`,
  currentUserXp?: number,
  currentUserLevel?: string,
  currentUserDisplayName?: string,
  currentUserAvatar?: string
): LeaderboardEntry[] {
  // Map to track user stats
  const userStatsMap = new Map<
    string,
    {
      address: string;
      xp: number;
      earnings: number;
      questsCompleted: number;
      displayName?: string;
      avatar?: string;
      level?: string;
    }
  >();

  // Process all completed quests
  quests.forEach((quest) => {
    if (
      quest.worker &&
      quest.onChainState === "verified" &&
      quest.rewardClaimed
    ) {
      const address = quest.worker.toLowerCase();
      const existing = userStatsMap.get(address) || {
        address,
        xp: 0,
        earnings: 0,
        questsCompleted: 0,
      };

      existing.xp += quest.xp || 0;
      existing.earnings += quest.reward || 0;
      existing.questsCompleted += 1;

      userStatsMap.set(address, existing);
    }
  });

  // Add current user if they have stats but aren't in the map
  if (currentUserAddress) {
    const address = currentUserAddress.toLowerCase();
    if (!userStatsMap.has(address) && currentUserXp && currentUserXp > 0) {
      userStatsMap.set(address, {
        address,
        xp: currentUserXp,
        earnings: 0, // Will be calculated from quests
        questsCompleted: 0,
        displayName: currentUserDisplayName,
        avatar: currentUserAvatar,
        level: currentUserLevel,
      });
    } else if (userStatsMap.has(address)) {
      // Update with current user's display info
      const existing = userStatsMap.get(address)!;
      existing.displayName = currentUserDisplayName || existing.displayName;
      existing.avatar = currentUserAvatar || existing.avatar;
      existing.level = currentUserLevel || existing.level;
    }
  }

  // Convert to array and sort by XP (descending)
  const entries: LeaderboardEntry[] = Array.from(userStatsMap.values())
    .map((stats) => {
      // Generate a short name from address if no display name
      const name =
        stats.displayName ||
        `${stats.address.slice(0, 6)}...${stats.address.slice(-4)}`;

      // Determine level from XP if not provided
      let level = stats.level as LeaderboardEntry["level"];
      if (!level) {
        if (stats.xp >= 2500) level = "Mythic";
        else if (stats.xp >= 1000) level = "Gold";
        else if (stats.xp >= 400) level = "Silver";
        else if (stats.xp >= 150) level = "Bronze";
        else level = "Rookie";
      }

      return {
        id: stats.address,
        name,
        avatar: stats.avatar || "",
        level: level as LeaderboardEntry["level"],
        xp: Math.round(stats.xp),
        questsCompleted: stats.questsCompleted,
        earnings: Math.round(stats.earnings * 100) / 100,
      };
    })
    .sort((a, b) => b.xp - a.xp);

  return entries;
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { quests, xp, level, displayName, avatarUrl } = useGameStore();

  // Compute leaderboard from quests
  const leaderboard = useMemo(() => {
    return computeLeaderboard(
      quests,
      address,
      xp,
      level,
      displayName,
      avatarUrl
    );
  }, [quests, address, xp, level, displayName, avatarUrl]);

  // Get top users
  const topUsers = useMemo(() => {
    return leaderboard.slice(0, TOP_USERS_COUNT);
  }, [leaderboard]);

  // Find current user's position
  const currentUserEntry = useMemo(() => {
    if (!address) return null;
    const userAddress = address.toLowerCase();
    return leaderboard.find((entry) => entry.id.toLowerCase() === userAddress);
  }, [leaderboard, address]);

  const currentUserRank = useMemo(() => {
    if (!currentUserEntry) return null;
    return leaderboard.findIndex((entry) => entry.id === currentUserEntry.id) + 1;
  }, [leaderboard, currentUserEntry]);

  // Check if current user is in top list
  const isCurrentUserInTopList = useMemo(() => {
    if (!currentUserEntry) return false;
    return topUsers.some((entry) => entry.id === currentUserEntry.id);
  }, [topUsers, currentUserEntry]);

  const getAvatarUrl = (entry: LeaderboardEntry) => {
    if (entry.avatar) {
      if (entry.avatar.startsWith("ipfs://")) {
        return buildIpfsGatewayUrl(entry.avatar);
      }
      if (entry.avatar.startsWith("http://") || entry.avatar.startsWith("https://")) {
        return entry.avatar;
      }
      return entry.avatar;
    }
    return null;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <Badge variant="primary" className="gap-2">
          <Crown className="h-4 w-4" />
          Arcade leaderboard
        </Badge>
        <h1 className="mt-3 text-4xl font-semibold text-foreground">
          Seize the top of the QuestArcade ranks
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
          Weekly and monthly seasons reset every 30 days. Complete high-impact quests to earn bonus XP and
          unlock exclusive avatar skins.
        </p>
        {currentUserRank && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-foreground/80">
            <User className="h-4 w-4" />
            <span>
              Your rank: <strong className="text-foreground">#{currentUserRank}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {topUsers.length === 0 ? (
            <div className="glass-card rounded-3xl border border-border/50 bg-card/50 p-12 text-center">
              <Crown className="mx-auto h-12 w-12 text-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No rankings yet</h3>
              <p className="mt-2 text-sm text-foreground/60">
                Complete quests to start climbing the leaderboard!
              </p>
            </div>
          ) : (
            <>
              {topUsers.map((entry, index) => {
                const isCurrentUser = address && entry.id.toLowerCase() === address.toLowerCase();
                const avatarUrl = getAvatarUrl(entry);
                
                return (
                  <motion.div
                    key={entry.id}
                    className={`glass-card flex flex-col justify-between gap-4 rounded-3xl border p-6 shadow-glow-sm sm:flex-row sm:items-center ${
                      isCurrentUser
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-card/50"
                    }`}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border ${
                            index < 3
                              ? "border-primary/50 bg-primary/20"
                              : "border-border/50 bg-card/50"
                          }`}
                          style={
                            index < 3
                              ? { boxShadow: "0 0 25px rgba(102, 126, 234, 0.4)" }
                              : undefined
                          }
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={entry.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback to initial if image fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const span = document.createElement("span");
                                  span.className = "text-2xl font-semibold text-foreground";
                                  span.textContent = entry.name.charAt(0).toUpperCase();
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl font-semibold text-foreground">
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {index < 3 && (
                          <Badge
                            variant="accent"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]"
                          >
                            Top {index + 1}
                          </Badge>
                        )}
                        {isCurrentUser && index >= 3 && (
                          <Badge
                            variant="primary"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-foreground">{entry.name}</h3>
                          {index === 0 && <Sparkles className="h-4 w-4 text-secondary" />}
                          {isCurrentUser && (
                            <Badge variant="primary" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs uppercase tracking-widest text-foreground/60">
                          Level {entry.level} • {entry.questsCompleted} quest{entry.questsCompleted !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-foreground/70">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-foreground/50">XP</p>
                        <p className="text-lg font-semibold text-foreground">{entry.xp.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-foreground/50">Earnings</p>
                        <p className="text-lg font-semibold text-foreground">cUSD {entry.earnings.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Show current user if not in top list */}
              {currentUserEntry && !isCurrentUserInTopList && currentUserRank && (
                <>
                  <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs uppercase tracking-widest text-foreground/40">
                      Your position
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <motion.div
                    className="glass-card flex flex-col justify-between gap-4 rounded-3xl border border-primary/50 bg-primary/10 p-6 shadow-glow-sm sm:flex-row sm:items-center"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-primary/50 bg-primary/20">
                          {getAvatarUrl(currentUserEntry) ? (
                            <img
                              src={getAvatarUrl(currentUserEntry)!}
                              alt={currentUserEntry.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const span = document.createElement("span");
                                  span.className = "text-2xl font-semibold text-foreground";
                                  span.textContent = currentUserEntry.name.charAt(0).toUpperCase();
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl font-semibold text-foreground">
                              {currentUserEntry.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="primary"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]"
                        >
                          #{currentUserRank}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {currentUserEntry.name}
                          </h3>
                          <Badge variant="primary" className="text-[10px]">
                            You
                          </Badge>
                        </div>
                        <p className="text-xs uppercase tracking-widest text-foreground/60">
                          Level {currentUserEntry.level} • {currentUserEntry.questsCompleted} quest{currentUserEntry.questsCompleted !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-foreground/70">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-foreground/50">XP</p>
                        <p className="text-lg font-semibold text-foreground">
                          {currentUserEntry.xp.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-foreground/50">Earnings</p>
                        <p className="text-lg font-semibold text-foreground">
                          cUSD {currentUserEntry.earnings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </>
          )}
        </motion.section>

        <aside className="space-y-6">
          <Card className="glass-card border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Medal className="h-5 w-5 text-secondary" />
                Seasonal rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/70">
              <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                <p className="font-semibold text-foreground">Mythic Rank (Top 1)</p>
                <p className="mt-1 text-xs">Unlock the Radiant Neon avatar skin + 500 cUSD bonus.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                <p className="font-semibold text-foreground">Platinum Rank (Top 50)</p>
                <p className="mt-1 text-xs">Double XP on impact quests for the next season.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                <p className="font-semibold text-foreground">Weekly Streak Masters</p>
                <p className="mt-1 text-xs">
                  Maintain a 7-day streak and receive boosted referral rewards.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-secondary" />
                How to climb faster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-foreground/65">
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

