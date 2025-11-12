"use client";

import { motion } from "framer-motion";
import { Gift, Star, Zap, ShoppingBag, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/use-game-store";

export default function RewardsPage() {
  const { rewards, balance, claimReward } = useGameStore();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 space-y-3 text-center">
        <Badge variant="accent" className="gap-2">
          <Gift className="h-4 w-4" />
          Arcade rewards
        </Badge>
        <h1 className="text-4xl font-semibold text-white">Redeem boosters, skins, and streak perks</h1>
        <p className="mx-auto max-w-2xl text-sm text-white/70">
          Spend your cUSD earnings on collectible upgrades. MiniPay handles secure, gasless payments for every
          purchase.
        </p>
      </div>

      <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-secondary px-6 py-8 text-sm text-white/80 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">Wallet balance</p>
            <p className="text-2xl font-semibold text-white">cUSD {balance.toFixed(2)}</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full border-white/20 bg-white/10 px-6 py-3 text-white">
          Connect MiniPay to checkout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="glass-card rounded-[28px] border border-white/10 bg-gradient-card p-6 shadow-glow-sm"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <Badge
                  variant="accent"
                  className="mb-3"
                  style={{ backgroundColor: `${reward.badgeColor ?? "#2DD6B5"}33` }}
                >
                  {reward.type.toUpperCase()}
                </Badge>
                <h2 className="text-xl font-semibold text-white">{reward.name}</h2>
                <p className="mt-2 text-sm text-white/70">{reward.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-widest text-white/50">Cost</p>
                <p className="text-lg font-semibold text-white">cUSD {reward.cost}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white/50">
                <Star className="h-4 w-4 text-secondary" />
                Eligible for streak multiplier
              </div>
              <Button
                className="rounded-full px-6"
                onClick={() => claimReward(reward.id)}
              >
                Redeem
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-secondary" />
              Boosters explained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-white/65">
            <p>• Boosters apply instantly and last for three quests.</p>
            <p>• Multiple boosters stack, but cap at +200% XP gain.</p>
            <p>• Skins and badges update your avatar and leaderboard presence.</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShoppingBag className="h-5 w-5 text-secondary" />
              Coming soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-white/65">
            <p>• Partner marketplace for quest gear and swag.</p>
            <p>• Dynamic pricing based on leaderboard position.</p>
            <p>• MiniPay-powered peer-to-peer asset trading.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

