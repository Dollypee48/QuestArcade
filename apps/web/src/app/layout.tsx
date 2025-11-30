import type { Metadata, Viewport } from "next";
import "./globals.css";

import dynamic from "next/dynamic";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { QuestArcadeSyncProvider } from "@/components/providers/quest-arcade-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

// Dynamically import WalletProvider to avoid SSR issues with indexedDB
const WalletProvider = dynamic(
  () => import("@/components/wallet-provider").then((mod) => ({ default: mod.WalletProvider })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "questArcade",
  description: "A celo web3 project built on minipay using celo composer",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuestArcade",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans">
        <ThemeProvider>
          <WalletProvider>
            <QuestArcadeSyncProvider />
            <ToastProvider />
            <div className="relative flex min-h-screen flex-col overflow-hidden">
              <Navbar />
              <main className="relative z-10 flex-1">{children}</main>
              <Footer />
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
