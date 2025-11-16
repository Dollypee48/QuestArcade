"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, ShieldCheck, Wallet, CheckCircle2, ChevronDown, LogOut, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain, useDisconnect } from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";

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
import { truncateAddress } from "@/lib/app-utils";

type NavLink = {
  name: string;
  href: string;
  external?: boolean;
};

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quests", href: "/quests" },
  { name: "Emporium", href: "/rewards" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Create Quest", href: "/create-task" },
];

const AVAILABLE_CHAINS = [celo, celoAlfajores, celoSepolia];

const CHAIN_NAMES: Record<number, string> = {
  42220: "Celo",
  44787: "Alfajores",
  11142220: "Celo Sepolia",
  31337: "Local",
};

function WalletDropdown({ address }: { address: string }) {
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const truncatedAddress = truncateAddress(address);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
        <span className="text-sm font-medium text-white">{truncatedAddress}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/10 bg-gradient-secondary p-2 shadow-lg"
        >
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs text-white/50">
              <p className="font-medium text-white/70">Wallet Address</p>
              <p className="mt-1 font-mono text-white/80">{address}</p>
            </div>
            <div className="border-t border-white/10"></div>
            <button
              onClick={handleCopyAddress}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                <span>{copied ? "Copied!" : "Copy Address"}</span>
              </div>
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentChain = AVAILABLE_CHAINS.find((chain) => chain.id === chainId);
  const networkName = CHAIN_NAMES[chainId] || currentChain?.name || `Chain ${chainId}`;

  const handleSwitchChain = (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="gap-2 border-white/20 bg-white/5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
      >
        <span>{networkName}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-xl border border-white/10 bg-gradient-secondary p-2 shadow-lg"
        >
          {AVAILABLE_CHAINS.map((chain) => {
            const isActive = chain.id === chainId;
            return (
              <button
                key={chain.id}
                onClick={() => handleSwitchChain(chain.id)}
                disabled={isActive || isPending}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{CHAIN_NAMES[chain.id] || chain.name}</span>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { isMiniPay, isReady } = useMiniPay();

  const renderNavLinks = (orientation: "horizontal" | "vertical") =>
    navLinks.map((link) => {
      const isActive = pathname === link.href;

      const baseClasses =
        orientation === "horizontal"
          ? "relative text-sm font-medium transition"
          : "group flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-base font-medium transition";

      const activeClasses =
        orientation === "horizontal"
          ? "text-white drop-shadow-[0_0_8px_rgba(124,58,237,0.65)]"
          : "bg-white/10 text-white shadow-glow";

      const inactiveClasses =
        orientation === "horizontal" ? "text-white/70 hover:text-white" : "text-white/80 hover:bg-white/10";

      return (
        <Link
          key={link.href}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <span className="relative z-10 flex items-center gap-1">
            {link.name}
            {link.external && (
              <ExternalLink className={orientation === "horizontal" ? "h-3.5 w-3.5" : "h-4 w-4"} />
            )}
          </span>
          {isActive && orientation === "horizontal" && (
            <motion.span
              layoutId="nav-active-indicator"
              className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-gradient-primary"
            />
          )}
        </Link>
      );
    });

  const showMinipayBadge = useMemo(() => isReady && isMiniPay, [isMiniPay, isReady]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-2 px-6 md:px-8 lg:px-12 md:gap-4">
        <div className="flex items-center gap-2 md:flex-[1.2] md:gap-4">
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
                  <p className="text-xs uppercase tracking-widest text-foreground/60">QuestArcade</p>
                  <p className="text-lg font-semibold text-white">Play-to-Earn Missions</p>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <span className="sr-only">Close</span>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col gap-2">{renderNavLinks("vertical")}</nav>
              <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                {isConnected && address ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Wallet Connected</p>
                      <div className="mt-2">
                        <WalletDropdown address={address} />
                      </div>
                      <div className="mt-3">
                        <NetworkSwitcher />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-white">MiniPay Wallet</p>
                      <p className="mt-1 text-sm text-white/70">
                        Earn cUSD rewards instantly when you complete quests with MiniPay.
                      </p>
                    </div>
                    <ConnectButton />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 md:gap-3">
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

        <nav className="hidden flex-1 items-center justify-center gap-4 md:flex lg:gap-5 whitespace-nowrap">
          {renderNavLinks("horizontal")}
        </nav>

        <div className="hidden flex items-center justify-end gap-3 md:flex md:flex-[1.2] lg:gap-4">
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <WalletDropdown address={address} />
              <NetworkSwitcher />
            </div>
          ) : (
            <>
              {showMinipayBadge && (
                <Badge variant="primary" className="hidden items-center gap-2 md:inline-flex">
                  <Wallet className="h-3.5 w-3.5" />
                  MiniPay Available
                </Badge>
              )}
              <ConnectButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
