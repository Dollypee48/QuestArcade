import type { Metadata } from "next";
import "./globals.css";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { WalletProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  title: "questArcade",
  description: "A celo web3 project built on minipay using celo composer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-secondary font-sans">
        <WalletProvider>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,94,169,0.22),_transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(45,214,181,0.18),_transparent_50%)]" />
            <Navbar />
            <main className="relative z-10 flex-1">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
