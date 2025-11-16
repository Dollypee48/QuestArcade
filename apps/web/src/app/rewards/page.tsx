"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Gift, Star, Zap, ShoppingBag, Wallet, CheckCircle2, Sparkles, Shield, Award, TrendingUp, Package } from "lucide-react";
import { useAccount } from "wagmi";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/use-game-store";

type RewardType = "all" | "booster" | "skin" | "badge" | "perk" | "claimed";

export default function RewardsPage() {
  const { rewards, balance, claimReward, claimedRewards } = useGameStore();
  const { address, isConnected } = useAccount();
  const truncatedAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;
  const [selectedType, setSelectedType] = useState<RewardType>("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validate and normalize data
  const safeRewards = useMemo(() => {
    if (!rewards || !Array.isArray(rewards)) {
      return [];
    }
    return rewards.filter((r) => r && r.id && typeof r.id === "string");
  }, [rewards]);

  const safeClaimedRewards = useMemo(() => {
    if (!claimedRewards || !Array.isArray(claimedRewards)) {
      return [];
    }
    return claimedRewards.filter((id) => id && typeof id === "string");
  }, [claimedRewards]);

  const safeBalance = useMemo(() => {
    if (typeof balance !== "number" || isNaN(balance)) {
      return 0;
    }
    return Math.max(0, balance);
  }, [balance]);

  // Get claimed rewards
  const claimedRewardsList = useMemo(() => {
    return safeRewards.filter((reward) => reward?.id && safeClaimedRewards.includes(reward.id));
  }, [safeRewards, safeClaimedRewards]);

  // Group rewards by type
  const rewardsByType = useMemo(() => {
    if (selectedType === "claimed") {
      // Show claimed rewards grouped by type
      return claimedRewardsList.reduce((acc, reward) => {
        if (!reward || !reward.type) return acc;
        if (!acc[reward.type]) {
          acc[reward.type] = [];
        }
        acc[reward.type].push(reward);
        return acc;
      }, {} as Record<string, typeof safeRewards>);
    }
    
    const filtered = selectedType === "all" 
      ? safeRewards.filter((r) => r?.id && !safeClaimedRewards.includes(r.id)) // Exclude claimed from "all"
      : safeRewards.filter((r) => r?.type === selectedType && r?.id && !safeClaimedRewards.includes(r.id));
    
    return filtered.reduce((acc, reward) => {
      if (!reward || !reward.type) return acc;
      if (!acc[reward.type]) {
        acc[reward.type] = [];
      }
      acc[reward.type].push(reward);
      return acc;
    }, {} as Record<string, typeof safeRewards>);
  }, [safeRewards, selectedType, safeClaimedRewards, claimedRewardsList]);

  const handleClaimReward = (rewardId: string) => {
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    // Validate rewardId
    if (!rewardId || typeof rewardId !== "string") {
      setError("Invalid item ID");
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      const result = claimReward(rewardId);
      
      if (result.success) {
        const reward = safeRewards.find((r) => r?.id === rewardId);
        const rewardName = reward?.name || "Item";
        setSuccess(`Successfully purchased ${rewardName}!`);
        setTimeout(() => setError(null), 5000);
      } else {
        const errorMessage = result.error || "Failed to purchase item. Please try again.";
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const typeTabs: Array<{ id: RewardType; label: string; icon: typeof Gift; badge?: number }> = [
    { id: "all", label: "All Items", icon: Gift },
    { id: "booster", label: "Boosters", icon: Zap },
    { id: "skin", label: "Skins", icon: Sparkles },
    { id: "badge", label: "Badges", icon: Award },
    { id: "perk", label: "Streak Perks", icon: TrendingUp },
    { id: "claimed", label: "My Collection", icon: Package, badge: safeClaimedRewards.length },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booster":
        return Zap;
      case "skin":
        return Sparkles;
      case "badge":
        return Award;
      case "perk":
        return TrendingUp;
      default:
        return Gift;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booster":
        return "BOOSTER";
      case "skin":
        return "SKIN";
      case "badge":
        return "BADGE";
      case "perk":
        return "PERK";
      default:
        return type.toUpperCase();
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 space-y-3 text-center">
        <Badge variant="accent" className="gap-2">
          <Gift className="h-4 w-4" />
          Arcade Emporium
        </Badge>
        <h1 className="text-4xl font-semibold text-white">Redeem boosters, skins, badges, and streak perks</h1>
        <p className="mx-auto max-w-2xl text-sm text-white/70">
          Spend your cUSD earnings on collectible upgrades. MiniPay handles secure, gasless payments for every purchase.
        </p>
      </div>

      {/* Balance and Wallet Section */}
      <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-secondary px-6 py-8 text-sm text-white/80 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">Wallet balance</p>
            <p className="text-2xl font-semibold text-white">cUSD {safeBalance.toFixed(2)}</p>
          </div>
        </div>
        {isConnected && address ? (
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-full border-green-500/30 bg-green-500/10 px-6 py-3 text-green-400 hover:bg-green-500/20"
          >
            <Link href="/dashboard">
              <CheckCircle2 className="h-4 w-4" />
              {truncatedAddress}
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/20 bg-white/10 px-6 py-3 text-white hover:bg-white/20"
          >
            <Link href="/login">
              <Wallet className="mr-2 h-4 w-4" />
              Connect MiniPay to checkout
            </Link>
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
        >
          {success}
        </motion.div>
      )}

      {/* Type Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={selectedType === tab.id ? "default" : "outline"}
              className={`gap-2 rounded-full border-white/20 px-4 py-2 text-sm ${
                selectedType === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
              onClick={() => setSelectedType(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="accent" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Emporium Items Grid by Type */}
      <div className="space-y-12">
        {Object.entries(rewardsByType).map(([type, typeRewards]) => {
          const TypeIcon = getTypeIcon(type);
          return (
            <div key={type} className="space-y-4">
              <div className="flex items-center gap-3">
                <TypeIcon className="h-5 w-5 text-secondary" />
                <h2 className="text-2xl font-semibold text-white">{getTypeLabel(type)}</h2>
                <Badge variant="outline" className="border-white/20 text-white/60">
                  {typeRewards.length} available
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {typeRewards.map((reward, index) => {
                  if (!reward || !reward.id) return null;
                  const isClaimed = safeClaimedRewards.includes(reward.id);
                  const rewardCost = typeof reward.cost === "number" ? reward.cost : 0;
                  const canAfford = safeBalance >= rewardCost;
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-card rounded-[28px] border p-6 shadow-glow-sm ${
                        isClaimed
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-white/10 bg-gradient-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-2">
                            <Badge
                              variant="accent"
                              className="text-xs"
                              style={{ backgroundColor: `${reward.badgeColor ?? "#2DD6B5"}33` }}
                            >
                              {getTypeLabel(reward.type)}
                            </Badge>
                            {isClaimed && (
                              <Badge variant="outline" className="border-green-500/30 text-xs text-green-400">
                                Claimed
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white">{reward.name}</h3>
                          <p className="mt-2 text-sm text-white/70">{reward.description}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-widest text-white/50">Cost</p>
                          <p className="text-lg font-semibold text-white">cUSD {reward.cost}</p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Star className="h-3.5 w-3.5 text-secondary" />
                          {reward.type === "booster" && "Lasts 3 quests"}
                          {reward.type === "skin" && "Avatar upgrade"}
                          {reward.type === "badge" && "Profile badge"}
                          {reward.type === "perk" && "Active perk"}
                        </div>
                        <Button
                          className="rounded-full px-6"
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={isClaimed || !canAfford || !isConnected}
                          variant={isClaimed ? "outline" : "default"}
                        >
                          {isClaimed ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Claimed
                            </>
                          ) : !canAfford ? (
                            "Insufficient Funds"
                          ) : !isConnected ? (
                            "Connect Wallet"
                          ) : (
                            "Redeem"
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Cards */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-secondary" />
              How Emporium Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-white/65">
            <p>• <strong>Boosters:</strong> Apply instantly and last for three quests. Multiple boosters stack up to +200% XP gain.</p>
            <p>• <strong>Skins:</strong> Update your avatar appearance on the leaderboard and profile.</p>
            <p>• <strong>Badges:</strong> Showcase achievements and milestones on your profile.</p>
            <p>• <strong>Perks:</strong> Active benefits that enhance your quest experience automatically.</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShoppingBag className="h-5 w-5 text-secondary" />
              My Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-white/65">
            <p>• View your claimed items in your profile.</p>
            <p>• Boosters activate automatically on your next quest.</p>
            <p>• Skins and badges are applied to your avatar instantly.</p>
            <p>• Perks provide ongoing benefits until they expire.</p>
            {claimedRewards.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/80">You have {claimedRewards.length} claimed item{claimedRewards.length > 1 ? "s" : ""}.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
