import Link from "next/link";
import { Github, Twitter, Globe, MessageCircle } from "lucide-react";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
  { label: "Docs", href: "https://docs.celo.org", external: true },
  { label: "MiniPay", href: "https://minipay.com", external: true },
];

const socials = [
  { icon: Twitter, href: "https://twitter.com/celoorg", label: "Twitter" },
  { icon: Github, href: "https://github.com/celo-org", label: "GitHub" },
  { icon: Globe, href: "https://celo.org", label: "Celo" },
  { icon: MessageCircle, href: "https://discord.gg/celo", label: "Discord" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-secondary">
      <div className="container grid gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-primary/80 p-1 shadow-glow">
            <div className="rounded-lg bg-background/90 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">QuestArcade</p>
              <p className="mt-1 text-lg font-semibold text-white">Complete missions. Earn cUSD.</p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-white/70">
            QuestArcade is the gamified gateway for real-world impact quests powered by the Celo
            MiniPay ecosystem.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">Explore</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/80">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">Resources</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>MiniPay SDK integration guides</li>
            <li>Quest creator toolkit</li>
            <li>Impact reporting templates</li>
            <li>Brand & design assets</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">Stay in loop</h3>
          <p className="mt-3 text-sm text-white/70">
            Follow the community to join seasonal leagues, unlock boosters, and claim new quests.
          </p>
          <div className="mt-4 flex gap-3">
            {socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:scale-105 hover:text-white"
              >
                <social.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-background/60">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-white/50 md:flex-row">
          <span>© {new Date().getFullYear()} QuestArcade. Built with love on Celo.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

