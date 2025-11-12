"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Wallet,
  Trophy,
  Map,
  PlayCircle,
  Rocket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserBalance } from "@/components/user-balance";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/store/use-game-store";

const featureCards = [
  {
    title: "Instant cUSD Rewards",
    description: "Cash-out ready earnings via MiniPay with no gas friction on Celo.",
    icon: Wallet,
  },
  {
    title: "Quests with Real Impact",
    description: "Complete missions for local businesses, NGOs, and community partners.",
    icon: Map,
  },
  {
    title: "Gamified Progression",
    description: "Level up, unlock boosters, and climb the leaderboard each season.",
    icon: Trophy,
  },
];

const howItWorks = [
  {
    label: "01",
    title: "Discover real-world quests",
    description:
      "Browse geo-tagged missions around you and filter by reward size, time window, or difficulty.",
  },
  {
    label: "02",
    title: "Complete tasks & submit proof",
    description:
      "Use MiniPay to verify your presence, upload photo/video evidence, and submit reports on-chain.",
  },
  {
    label: "03",
    title: "Claim rewards instantly",
    description:
      "Earn cUSD directly in your MiniPay wallet, boost your streak, and unlock new tiers every week.",
  },
];

function HeroMetrics() {
  const { xp, nextLevelXp, level, balance, streak } = useGameStore();
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100);
  const lastCompleted = streak.lastCompleted ? new Date(streak.lastCompleted) : null;
  const lastCompletedLabel = lastCompleted ? lastCompleted.toLocaleDateString() : "No quests yet";

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card border-white/10 bg-white/10 p-6 shadow-glow">
        <CardContent className="p-0">
          <p className="text-xs uppercase tracking-widest text-white/60">Current Tier</p>
          <p className="mt-2 text-2xl font-semibold text-white">{level}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{xp} XP</span>
              <span>{nextLevelXp} XP</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-white/60">Earn 5 more quests to reach the next league.</p>
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card border-white/10 bg-white/10 p-6 shadow-glow-sm">
        <CardContent className="flex h-full flex-col justify-between p-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Wallet balance</p>
            <p className="mt-2 text-3xl font-semibold text-white">cUSD {balance.toFixed(2)}</p>
          </div>
          <UserBalance />
        </CardContent>
      </Card>
      <Card className="glass-card border-white/10 bg-white/10 p-6 shadow-glow-sm">
        <CardContent className="p-0">
          <p className="text-xs uppercase tracking-widest text-white/60">Daily streak</p>
          <p className="mt-2 text-3xl font-semibold text-white">{streak.current} days</p>
          <p className="mt-1 text-xs text-white/60">
            Best streak: {streak.best} days • last quest {lastCompletedLabel}
          </p>
        </CardContent>
      </Card>
      <Card className="glass-card border-white/10 bg-white/10 p-6 shadow-glow-sm">
        <CardContent className="p-0">
          <p className="text-xs uppercase tracking-widest text-white/60">Season perks</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>• Boosted cUSD rewards</li>
            <li>• Gold-tier referral bonuses</li>
            <li>• VIP quest drops every Friday</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
<main className="flex-1">
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-24">
        <div className="container relative z-10 mx-auto max-w-6xl px-4 text-center">
          <Badge variant="primary" className="mx-auto mb-6 w-fit gap-2 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            QuestArcade Missions
          </Badge>
          <motion.h1
            className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-[4.5rem]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Complete real-world missions.{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Earn stablecoins instantly.
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            QuestArcade transforms community tasks into gamified quests. Track your XP, grow your
            streak, and unlock boosters while getting paid in cUSD through MiniPay.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button size="lg" className="group gap-2 rounded-full px-8 py-6 text-base font-semibold">
              Get Started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-6 text-base text-white/80 hover:bg-white/10"
            >
              <Link href="/about">
                How It Works
                <PlayCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-white/20 bg-white/10 px-8 py-6 text-base text-white/85 hover:bg-white/20"
            >
              <Link href="/login">
                Connect Wallet
                <Wallet className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <HeroMetrics />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_65%)]" />
      </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="space-y-6 lg:w-1/2">
              <Badge variant="accent" className="w-fit gap-2 px-3 py-1.5">
                <Rocket className="h-3.5 w-3.5" />
                Quest Preview
              </Badge>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Pick a quest, plan your approach, and deploy proofs in minutes.
              </h2>
              <p className="text-base text-white/70">
                Every quest is backed by smart contracts and impact partners across Africa.
                On-chain verification ensures your work is recognized instantly and transparently.
              </p>
              <div className="grid gap-4">
                {featureCards.map((feature) => (
                  <div
                    key={feature.title}
                    className="glass-card flex items-start gap-4 rounded-2xl border border-white/10 bg-gradient-card p-5"
                  >
                    <feature.icon className="mt-1 h-6 w-6 text-secondary" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-white/70">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div
              className="glass-card relative flex min-h-[420px] flex-1 flex-col justify-between overflow-hidden rounded-[32px] border border-white/10 bg-gradient-secondary p-8 shadow-glow"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,197,66,0.25),_transparent_70%)]" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Featured Quest
                  </Badge>
                  <span className="text-sm text-white/70">Reward: cUSD 35</span>
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  Campus Quest: Onboard 10 Students
                </h3>
                <p className="text-sm text-white/75">
                  Teach students how to activate MiniPay, help them download the QuestArcade mobile
                  app, and submit proof with a group selfie.
                </p>
                <div className="grid gap-3 text-xs text-white/70 sm:grid-cols-2">
                  <p>Location: University of Lagos, Nigeria</p>
                  <p>Verification: Video + Attendance</p>
                  <p>Difficulty: Hard</p>
                  <p>Duration: 12 hours</p>
                </div>
              </div>
              <div className="relative z-10">
                <Button asChild className="w-full rounded-full">
                  <Link href="/quests/quest-campus-02">Preview Quest</Link>
          </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background/40">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold text-white sm:text-4xl">
            How QuestArcade works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-white/70">
            Built with Celo Composer, MiniPay, and IPFS for tamper-proof verification. Mobile-first
            by design, so every mission feels like a game level with real payouts.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {howItWorks.map((item) => (
              <motion.div
                key={item.label}
                className="glass-card flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-card p-8"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-sm font-semibold text-secondary">{item.label}</span>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </motion.div>
            ))}
      </div>
    </div>
  </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-gradient-secondary px-6 py-16 text-center shadow-glow lg:px-12">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Ready to launch your first quest or join the leaderboard?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/75">
            Connect with MiniPay, choose your quest path, and start collecting XP today. QuestArcade
            integrates with Celo contracts so rewards are instant and verifiable.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 py-6">
              <Link href="/register">Create an Account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-6 text-white/85 hover:bg-white/10"
            >
              <Link href="/quests">Browse Live Quests</Link>
            </Button>
          </div>
        </div>
      </section>
</main>
  );
}
