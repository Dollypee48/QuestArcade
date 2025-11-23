"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHAIN_CONFIG } from "@/config/contractConfig";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";

const MINT_AMOUNT = parseUnits("1000", 18); // 1000 tokens

// MockERC20 ABI with mint function
const MOCK_ERC20_ABI = [
  ...erc20Abi,
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export function MintTestToken() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: CHAIN_CONFIG.defaultChainId });
  const { refresh } = useQuestArcadeSync();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string } | null>(null);

  // Use the same token address as QuestArcade contract was deployed with
  const tokenAddress = CHAIN_CONFIG.stableTokenAddress as `0x${string}` | undefined;

  const shouldRender =
    isConnected &&
    Boolean(address) &&
    Boolean(tokenAddress) &&
    CHAIN_CONFIG.defaultChainId === 11142220;

  // Check if token has mint function (load token info)
  useEffect(() => {
    if (!publicClient || !tokenAddress || !shouldRender) {
      return;
    }

    let cancelled = false;

    Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      }) as Promise<string>,
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }) as Promise<string>,
    ])
      .then(([name, symbol]) => {
        if (!cancelled) {
          setTokenInfo({ name, symbol });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokenInfo(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicClient, shouldRender, tokenAddress]);

  if (!shouldRender) {
    return null;
  }

  const handleMint = async () => {
    if (!tokenAddress || !address) {
      setError("Token address or wallet address is missing");
      return;
    }

    setIsMinting(true);
    setError(null);
    setSuccess(false);

    try {
      // Try to call mint function - this will fail if token doesn't have mint
      const hash = await writeContractAsync({
        account: address,
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });

      await publicClient!.waitForTransactionReceipt({ hash });
      
      // Wait a moment for the transaction to be fully processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh balance from chain
      try {
        await refresh();
      } catch (refreshError) {
        console.warn("Failed to refresh balance after minting:", refreshError);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const errorMsg = errorObj?.message || "Failed to mint tokens";
      if (errorMsg.includes("mint") || errorMsg.includes("function")) {
        setError("This token doesn&apos;t support minting. You&apos;ll need to get tokens another way.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-8 border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-yellow-400">Get Test Tokens</CardTitle>
        <p className="text-sm text-foreground/70">
          Mint test tokens from the MockERC20 contract for testing quests.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-foreground/60">
          <p>Token: {tokenInfo ? `${tokenInfo.name} (${tokenInfo.symbol})` : "Loading..."}</p>
          <p>Amount: 1000 tokens</p>
          <p className="text-xs mt-2 text-foreground/50">
            Contract: {tokenAddress}
          </p>
          <p className="text-xs mt-1 text-yellow-400/70">
            ⚠️ If minting fails, this token may not support public minting.
          </p>
        </div>
        
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        
        {success && (
          <p className="text-sm text-green-400">
            Successfully minted 1000 test tokens! Your balance has been updated.
          </p>
        )}

        <Button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isMinting ? "Minting..." : "Mint 1000 Test Tokens"}
        </Button>

        <p className="text-xs text-foreground/50">
          Note: These are test tokens on Celo Sepolia. They have no real value.
        </p>
      </CardContent>
    </Card>
  );
}

