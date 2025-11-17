"use client";

import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { WagmiProvider, createConfig, http, fallback, useConnect, useAccount } from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";
import { useGameStore } from "@/store/use-game-store";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "questArcade",
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
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
            void connect({ connector: injectedConnector }).catch((error) => {
              console.warn("Failed to auto-connect MiniPay:", error);
            });
          }, 100);
        }
      }
    } catch (error) {
      // Silently handle wallet conflicts - user can connect manually
      console.debug("Wallet detection skipped due to multiple extensions:", error);
    }
  }, [connect, connectors]);

  // Reset local game state when wallet disconnects or when the connected address changes
  useEffect(() => {
    // Wallet disconnected or no address - always clear local state
    if (!isConnected || !address) {
      resetState();
      previousAddressRef.current = undefined;
      return;
    }

    const previousAddress = previousAddressRef.current;

    // First connect
    if (!previousAddress) {
      previousAddressRef.current = address;
      return;
    }

    // Address changed - clear previous user's state
    if (previousAddress.toLowerCase() !== address.toLowerCase()) {
      resetState();
      previousAddressRef.current = address;
    }
  }, [address, isConnected, resetState]);

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
