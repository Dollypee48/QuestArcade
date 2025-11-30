"use client";

import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { metaMaskWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { WagmiProvider, createConfig, http, fallback, useConnect, useAccount } from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";
import { useGameStore } from "@/store/use-game-store";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";

// Get WalletConnect project ID or use a default one (required for RainbowKit)
// You can get a free project ID from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "21fef48091f12692cad42a4b4b54b2b8"; // Default project ID for testing

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "QuestArcade",
    projectId,
  }
);

// Create transports with fallback RPCs and better error handling
const createHttpTransport = (rpcUrl: string) => {
  return http(rpcUrl, {
    retryCount: 2,
    retryDelay: 1000,
    timeout: 15000,
    fetchOptions: {
      cache: 'no-store',
    },
  });
};

// Create wagmi config - WalletConnect will handle SSR gracefully
const wagmiConfig = createConfig({
  chains: [celoSepolia, celo, celoAlfajores],
  connectors,
  transports: {
    // Use fallback for Celo Sepolia to handle network issues
    [celoSepolia.id]: fallback([
      createHttpTransport('https://forno.celo-sepolia.celo-testnet.org'),
      createHttpTransport('https://rpc.ankr.com/celo_sepolia'),
      createHttpTransport('https://1rpc.io/celo/sepolia'),
    ], {
      rank: false, // Try in order
      retryCount: 2,
    }),
    [celo.id]: createHttpTransport('https://forno.celo.org'),
    [celoAlfajores.id]: createHttpTransport('https://alfajores-forno.celo-testnet.org'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

type MiniPayWindow = Window & {
  ethereum?: {
    isMiniPay?: boolean;
  };
};

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const resetState = useGameStore((state) => state.resetState);
  const previousAddressRef = useRef<string | undefined>(undefined);
  const { refresh } = useQuestArcadeSync();

  useEffect(() => {
    // Check if the app is running inside MiniPay
    // Handle wallet conflicts gracefully
    try {
      const { ethereum } = window as MiniPayWindow;
      if (ethereum?.isMiniPay) {
        // Find the injected connector, which is what MiniPay uses
        const injectedConnector = connectors.find((c) => c.id === "injected");
        if (injectedConnector) {
          // Use setTimeout to avoid conflicts with other wallet initialization
          setTimeout(() => {
            try {
              connect({ connector: injectedConnector });
            } catch (error) {
              console.warn("Failed to auto-connect MiniPay:", error);
            }
          }, 100);
        }
      }
    } catch (error) {
      // Silently handle wallet conflicts - user can connect manually
      console.debug("Wallet detection skipped due to multiple extensions:", error);
    }
  }, [connect, connectors]);

  // Reset local game state when wallet disconnects or when the connected address changes
  // Also sync balance when wallet connects
  useEffect(() => {
    // Wallet disconnected or no address - always clear local state
    if (!isConnected || !address) {
      resetState();
      previousAddressRef.current = undefined;
      return;
    }

    const previousAddress = previousAddressRef.current;

    // First connect or address changed - sync from chain
    if (!previousAddress || previousAddress.toLowerCase() !== address.toLowerCase()) {
      if (previousAddress && previousAddress.toLowerCase() !== address.toLowerCase()) {
        // Address changed - clear previous user's state
        resetState();
      }
      previousAddressRef.current = address;
      
      // Sync balance and quest data from chain after connecting
      // Use a small delay to ensure wallet is fully connected
      const syncTimer = setTimeout(() => {
        refresh().catch((error) => {
          console.warn("Failed to sync after wallet connection:", error);
        });
      }, 1000);
      
      return () => clearTimeout(syncTimer);
    }
  }, [address, isConnected, resetState, refresh]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={celoSepolia}>
          <WalletProviderInner>{children}</WalletProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
