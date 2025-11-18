"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMiniPay } from "@/hooks/use-minipay";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { connect, isMiniPay, isConnecting } = useMiniPay();

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center px-4 py-16">
      <motion.div
        className="glass-card w-full rounded-[32px] border border-white/10 bg-gradient-secondary/80 p-10 shadow-glow"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Badge variant="accent" className="gap-2">
            Welcome back
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Log in to your QuestArcade hub
          </h1>
          <p className="max-w-lg text-sm text-foreground/70">
            Track your XP, streaks, and cUSD rewards. Toggle between email and wallet access at any
            time, with seamless MiniPay authentication.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@questarcade.xyz"
                  className="pl-12"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-12 pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-foreground/65">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border border-white/20 bg-transparent" />
                Remember me
              </label>
              <Link href="/help" className="text-secondary hover:text-secondary/90">
                Forgot password?
              </Link>
            </div>
            <Button className="w-full rounded-full py-3 text-sm font-semibold">
              Log in with email
            </Button>
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
              <Wallet className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">MiniPay access</h2>
            <p className="text-sm text-foreground/70">
              Use your MiniPay wallet to sign in instantly. We’ll verify your account and sync your
              quest progress.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full border-white/20 bg-white/10 py-3 text-sm font-semibold text-foreground/85 hover:bg-white/15"
              onClick={connect}
              disabled={isConnecting}
            >
              {isMiniPay ? "Connect MiniPay" : "Connect wallet"}
            </Button>
            <p className="text-xs text-foreground/55">
              Need an account?{" "}
              <Link href="/register" className="text-secondary hover:text-secondary/90">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

