"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Eye, EyeOff, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMiniPay } from "@/hooks/use-minipay";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isMiniPay, connect, isConnecting, address } = useMiniPay();

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col items-center justify-center px-4 py-16">
      <motion.div
        className="glass-card w-full rounded-[32px] border border-white/10 bg-gradient-secondary/80 p-10 shadow-glow"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="flex-1 space-y-6">
            <Badge variant="primary" className="w-fit gap-2">
              <Sparkles className="h-4 w-4" />
              Join the Arcade
            </Badge>
            <h1 className="text-4xl font-semibold text-white">
              Create your QuestArcade profile
            </h1>
            <p className="text-sm text-white/70">
              Connect with MiniPay or use email to create a hybrid account. You can always upgrade to
              wallet-only access later. All quests require wallet verification before submitting proof.
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <p className="font-semibold text-white">Perks of registering</p>
              <ul className="mt-3 space-y-2">
                <li>• Save your XP progress and unlock tiered rewards.</li>
                <li>• Auto-sync quests and proofs across devices.</li>
                <li>• Early access to seasonal leagues and boosters.</li>
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@questarcade.xyz"
                    className="pl-12"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-12 pr-12"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full rounded-full py-3 text-sm font-semibold">
                Sign up with email
              </Button>
              <div className="relative py-2 text-center text-xs uppercase tracking-widest text-white/40">
                <span className="relative z-10 bg-transparent px-2">or</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-white/10" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-full border-white/20 bg-white/10 py-3 text-sm font-semibold text-white/85 hover:bg-white/15"
                onClick={connect}
                disabled={isConnecting}
              >
                <Wallet className="h-4 w-4" />
                {address ? "MiniPay Connected" : isMiniPay ? "Sign up with MiniPay" : "Connect Wallet"}
              </Button>
              {address && (
                <p className="text-xs text-white/50">
                  Connected: <span className="font-mono">{address}</span>
                </p>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-white/60">
              Already have an account?{" "}
              <Link href="/login" className="text-secondary hover:text-secondary/90">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

