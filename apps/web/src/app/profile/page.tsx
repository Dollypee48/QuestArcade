"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Camera,
  PenLine,
  Shield,
  Wallet,
  Award,
  Flame,
  Trophy,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/store/use-game-store";

export default function ProfilePage() {
  const { displayName, avatarUrl, level, xp, nextLevelXp, streak, updateProfile, progress } =
    useGameStore();
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState(avatarUrl);

  const completedQuests = progress.filter((item) => item.status === "completed").length;
  const reputation = Math.min(100, Math.round((completedQuests * 8 + xp / 10) / 2));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <motion.div
        className="glass-card rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-glow"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center">
              <div className="relative">
                <Image
                  src={avatar}
                  alt="Profile avatar"
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-3xl border border-white/10 object-cover"
                  unoptimized
                />
                <button className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-glow">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <Badge variant="accent" className="mb-3 inline-flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Reputation {reputation}%
                </Badge>
                <h1 className="text-3xl font-semibold text-foreground">{displayName}</h1>
                <p className="mt-1 text-sm text-foreground/60">
                  Level {level} • {xp}/{nextLevelXp} XP
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card border-white/10 bg-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <PenLine className="h-4 w-4 text-secondary" />
                    Edit profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input
                      id="display-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-url">Avatar URL</Label>
                    <Input
                      id="avatar-url"
                      value={avatar}
                      onChange={(event) => setAvatar(event.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <Button
                    className="w-full rounded-full"
                    onClick={() => updateProfile({ displayName: name, avatarUrl: avatar })}
                  >
                    Save changes
                  </Button>
                  <p className="text-xs text-foreground/50">
                    Tip: Upload avatar skins or boosters on the Rewards page to stand out on the leaderboard.
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-white/10 bg-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wallet className="h-4 w-4 text-secondary" />
                    MiniPay status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-foreground/70">
                  <p>
                    Connect MiniPay to auto-sync wallet balances, claim rewards instantly, and unlock gasless
                    quest submissions.
                  </p>
                  <Button variant="outline" className="w-full rounded-full border-white/20 bg-white/10">
                    Connect MiniPay
                  </Button>
                  <div className="rounded-2xl border border-white/10 bg-background/60 p-4 text-xs text-foreground/60">
                    <p>Upcoming: support for multiple wallets, including crypto-to-fiat ramps.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="w-full lg:w-64">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-foreground/70">
              <h2 className="text-lg font-semibold text-foreground">Your stats</h2>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Flame className="h-4 w-4 text-secondary" />
                  Streak
                </span>
                <span>{streak.current} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Trophy className="h-4 w-4 text-secondary" />
                  Missions
                </span>
                <span>{completedQuests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Star className="h-4 w-4 text-secondary" />
                  XP
                </span>
                <span>{xp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Award className="h-4 w-4 text-secondary" />
                  Best streak
                </span>
                <span>{streak.best} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Users className="h-4 w-4 text-secondary" />
                  Team invites
                </span>
                <span>4 pending</span>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-secondary/30 bg-secondary/15 p-6 text-sm text-secondary-foreground">
              <h3 className="text-lg font-semibold text-foreground">Reputation ladder</h3>
              <p className="mt-2 text-xs text-foreground/70">
                Complete verification quests to improve your reputation score and unlock high-tier missions.
              </p>
              <div className="mt-4 space-y-2 text-xs text-foreground/60">
                <p>• 0 - 40: Rookie explorer</p>
                <p>• 40 - 70: Bronze Guardian</p>
                <p>• 70 - 90: Gold Vanguard</p>
                <p>• 90+: Mythic Champion</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

