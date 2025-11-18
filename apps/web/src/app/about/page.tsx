"use client";

import { motion } from "framer-motion";
import { Globe, ShieldCheck, Users, Rocket, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    title: "Transparent impact",
    description:
      "Every quest submission is backed by IPFS storage, allowing partners to verify real-world evidence with on-chain hashes.",
    icon: ShieldCheck,
  },
  {
    title: "Community-first missions",
    description:
      "QuestArcade empowers local builders, NGOs, and brands to create quests that deliver measurable outcomes.",
    icon: Users,
  },
  {
    title: "Mobile-native experience",
    description:
      "Powered by Celo MiniPay, our onboarding is optimized for mobile devices with gasless transactions and instant payouts.",
    icon: Rocket,
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <Badge variant="primary" className="gap-2">
          <Globe className="h-4 w-4" />
          Our mission
        </Badge>
        <h1 className="mt-3 text-4xl font-semibold text-foreground">QuestArcade: Play-to-earn with purpose</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
          QuestArcade combines real-world missions with a gamified dashboard, letting players earn cUSD rewards
          while supporting community growth. We’re built with Celo Composer and the MiniPay SDK for frictionless,
          on-the-go transactions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            className="glass-card rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-glow-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <pillar.icon className="h-6 w-6 text-secondary" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">{pillar.title}</h2>
            <p className="mt-2 text-sm text-foreground/70">{pillar.description}</p>
          </motion.div>
        ))}
        <motion.div
          className="glass-card rounded-[28px] border border-white/10 bg-gradient-card p-6 shadow-glow-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="h-6 w-6 text-secondary" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Built for builders</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Celo Composer accelerates decentralized app development. QuestArcade provides ready-to-use quest
            templates, MiniPay integration, and on-chain verification patterns for developers.
          </p>
        </motion.div>
      </div>

      <section className="mt-12 space-y-6">
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="text-foreground">Why Celo MiniPay?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-foreground/70 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-foreground">Gasless onboarding</h3>
              <p className="mt-2 text-xs">
                MiniPay abstracts gas fees so new users can submit proofs and earn without worrying about wallet
                management.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Instant settlement</h3>
              <p className="mt-2 text-xs">
                Rewards are sent in cUSD immediately upon quest completion, so creators can reward players in real time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Mobile access</h3>
              <p className="mt-2 text-xs">
                Optimized for low-bandwidth environments, making Web3 missions accessible from any smartphone.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

