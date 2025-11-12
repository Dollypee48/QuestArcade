"use client";

import { motion } from "framer-motion";
import { HelpCircle, Wallet, ShieldCheck, Zap, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How do I connect my MiniPay wallet?",
    answer:
      "MiniPay is available inside the Opera Mini browser. Tap Connect Wallet on the navbar, approve the connection request, and your wallet will sync with QuestArcade. We recommend enabling notifications to receive quest updates.",
  },
  {
    question: "How fast are cUSD rewards paid out?",
    answer:
      "Once your proof is approved, payments are triggered immediately on-chain through Celo Composer smart contracts. In most cases, you’ll see the funds in your MiniPay wallet in under a minute.",
  },
  {
    question: "What happens to my proof submissions?",
    answer:
      "Photos, videos, and reports are stored on IPFS via our gateway. Only the IPFS hash is stored on-chain, ensuring transparency without exposing personal data.",
  },
  {
    question: "Can I use QuestArcade without MiniPay?",
    answer:
      "Yes, you can sign up with email to explore quests and plan missions. However, completing quests and claiming rewards requires MiniPay or a compatible Celo wallet.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <Badge variant="accent" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Help center
        </Badge>
        <h1 className="mt-3 text-4xl font-semibold text-white">FAQs & support for QuestArcade</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
          Learn how to connect MiniPay, submit quest proofs, earn cUSD, and stay safe while completing missions.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-secondary" />
              MiniPay onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>1. Install Opera Mini and enable MiniPay in settings.</p>
            <p>2. Tap Connect Wallet in QuestArcade.</p>
            <p>3. Approve the dapp connection and you’re ready to earn.</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              Proof & verification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>We support photo, video, and GPS proofs. Your submissions are timestamped, uploaded to IPFS, and verified by partners or automated scripts.</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-secondary" />
              Rewards & streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>
              Maintain streaks to unlock boosters. Rewards are paid in cUSD via MiniPay. Watch for weekly streak missions to keep your multiplier active.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.question}
            className="glass-card rounded-[28px] border border-white/10 bg-gradient-card p-6 shadow-glow-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <h2 className="text-lg font-semibold text-white">{faq.question}</h2>
            <p className="mt-2 text-sm text-white/70">{faq.answer}</p>
          </motion.div>
        ))}
      </section>

      <section className="mt-12 rounded-[32px] border border-white/10 bg-gradient-secondary p-10 text-center shadow-glow">
        <MessageCircle className="mx-auto mb-4 h-8 w-8 text-secondary" />
        <h2 className="text-3xl font-semibold text-white">Need more help?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
          Reach our support squad for quest disputes, MiniPay troubleshooting, and reward verification. We respond
          within 24 hours.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button className="rounded-full px-6 py-3">Open support ticket</Button>
          <Button variant="ghost" className="rounded-full border border-white/20 px-6 py-3 text-white">
            Explore documentation
          </Button>
        </div>
      </section>
    </div>
  );
}

