"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, ShieldCheck, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ConnectButton } from "@/components/connect-button";
import { useMiniPay } from "@/hooks/use-minipay";

type NavLink = {
  name: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
};

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quests", href: "/quests" },
  { name: "Rewards", href: "/rewards" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Create Quest", href: "/create-task", highlight: true },
];

function MiniPayStatus() {
  const { isMiniPay, isReady, address } = useMiniPay();

  const label = useMemo(() => {
    if (!isReady) return "Detecting MiniPay…";
    if (isMiniPay && address) return "MiniPay Connected";
    if (isMiniPay) return "MiniPay Ready";
    return "Wallet Ready";
  }, [address, isMiniPay, isReady]);

  return (
    <Badge variant={isMiniPay ? "primary" : "accent"} className="hidden md:inline-flex gap-2">
      <Wallet className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-white/10 bg-gradient-secondary text-foreground">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-foreground/60">
                    QuestArcade
                  </p>
                  <p className="text-lg font-semibold text-white">Play-to-Earn Missions</p>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <span className="sr-only">Close</span>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className={`group inline-flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition hover:bg-white/10 ${
                          isActive ? "bg-white/10 text-white shadow-glow" : "text-white/80"
                        }`}
                      >
                        <span>{link.name}</span>
                        {link.external && <ExternalLink className="h-4 w-4" />}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">MiniPay Wallet</p>
                <p className="mt-2 text-sm text-white/70">
                  Earn cUSD rewards instantly when you complete quests with MiniPay.
                </p>
                <div className="mt-4">
                  <ConnectButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg font-bold text-[#0B041A]">QA</span>
            </motion.div>
            <div className="hidden flex-col md:flex">
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/70">
                QuestArcade
              </span>
              <span className="text-xs text-foreground/50">Complete missions. Earn cUSD.</span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={`relative text-sm font-medium transition ${
                  isActive
                    ? "text-white drop-shadow-[0_0_8px_rgba(124,58,237,0.65)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground shadow-glow-sm">
                    New
                  </span>
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {link.name}
                  {link.external && <ExternalLink className="h-3.5 w-3.5" />}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-gradient-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <MiniPayStatus />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
