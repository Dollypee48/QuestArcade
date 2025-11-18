"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { Button } from "@/components/ui/button";
import { CHAIN_CONFIG } from "@/config/contractConfig";
import { Coins, Clock } from "lucide-react";
import { useGameStore } from "@/store/use-game-store";

const MINT_AMOUNT = parseUnits("100", 18); // 100 cUSD
const MINT_COOLDOWN_HOURS = 5; // 5 hours
const MINT_COOLDOWN_MS = MINT_COOLDOWN_HOURS * 60 * 60 * 1000;

const STORAGE_KEY = "quest-arcade-last-mint";

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

export function MintCUSDButton() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: CHAIN_CONFIG.defaultChainId });
  const { setBalance, balance } = useGameStore();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [supportsMinting, setSupportsMinting] = useState<boolean | null>(null);

  const tokenAddress = CHAIN_CONFIG.stableTokenAddress as `0x${string}` | undefined;

  // Check if contract supports minting
  useEffect(() => {
    if (!publicClient || !tokenAddress || !address) {
      setSupportsMinting(null);
      return;
    }

    const checkMintSupport = async () => {
      try {
        // Try to simulate a call to see if the function exists
        await publicClient.simulateContract({
          address: tokenAddress,
          abi: MOCK_ERC20_ABI,
          functionName: "mint",
          args: [address, parseUnits("1", 18)],
          account: address,
        });
        
        setSupportsMinting(true);
      } catch {
        // If simulation fails, the function likely doesn't exist
        setSupportsMinting(false);
      }
    };

    checkMintSupport();
  }, [publicClient, tokenAddress, address]);

  // Check cooldown status
  useEffect(() => {
    if (!address) {
      setTimeRemaining(null);
      return;
    }

    const checkCooldown = () => {
      const lastMintStr = localStorage.getItem(`${STORAGE_KEY}-${address}`);
      if (!lastMintStr) {
        setTimeRemaining(null);
        return;
      }

      const lastMintTime = parseInt(lastMintStr, 10);
      const now = Date.now();
      const timeSinceLastMint = now - lastMintTime;
      const remaining = MINT_COOLDOWN_MS - timeSinceLastMint;

      if (remaining > 0) {
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(null);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [address]);

  const canMint = isConnected && Boolean(address) && Boolean(tokenAddress) && timeRemaining === null;

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleMint = async () => {
    if (!address || !tokenAddress || !publicClient) {
      setError("Please connect your wallet");
      return;
    }

    if (timeRemaining !== null && timeRemaining > 0) {
      setError(`Please wait ${formatTimeRemaining(timeRemaining)} before minting again`);
      return;
    }

    setIsMinting(true);
    setError(null);
    setSuccess(false);

    try {
      // Try with MockERC20 ABI first (includes mint function)
      const hash = await writeContractAsync({
        account: address,
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      // Store the mint time
      localStorage.setItem(`${STORAGE_KEY}-${address}`, Date.now().toString());
      
      // Update balance in store
      const newBalance = balance + 100;
      setBalance(newBalance);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const errorMsg = errorObj?.message || "Failed to mint cUSD";
      console.error("Mint error:", err);
      
      if (
        errorMsg.includes("mint") ||
        errorMsg.includes("function") ||
        errorMsg.includes("execution reverted") ||
        errorMsg.includes("not found")
      ) {
        setError(
          "This token contract doesn&apos;t support public minting. " +
          "Please ensure you&apos;re using a MockERC20 contract on a test network. " +
          "The contract at this address may not have a mint function."
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  if (!tokenAddress) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/60">
        <p>Minting is only available on test networks with a configured token address.</p>
      </div>
    );
  }

  if (supportsMinting === false) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">Minting Not Available</h3>
        </div>
        <p className="mb-4 text-sm text-foreground/70">
          The token contract at this address doesn&apos;t support public minting. This feature requires a MockERC20 contract with a public mint function.
        </p>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-foreground/60">
          <p className="mb-2 font-semibold text-foreground/80">To enable minting:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Deploy a MockERC20 contract on your test network</li>
            <li>Update the STABLE_TOKEN_ADDRESS in your config</li>
            <li>Ensure the contract has a public mint(address, uint256) function</li>
          </ul>
          <p className="mt-3 text-foreground/50">
            Current token address: <span className="font-mono text-xs">{tokenAddress}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5 text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">Get Test cUSD</h3>
      </div>
      
      <p className="mb-4 text-sm text-foreground/70">
        Mint 100 cUSD for testing quests. You can mint once every 5 hours.
      </p>

      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <Clock className="h-4 w-4 text-secondary" />
          <p className="text-sm text-foreground/80">
            Cooldown: <span className="font-semibold text-secondary">{formatTimeRemaining(timeRemaining)}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Successfully minted 100 cUSD! Your balance has been updated.
        </div>
      )}

      <Button
        onClick={handleMint}
        disabled={isMinting || !canMint}
        className="w-full rounded-full bg-secondary text-foreground hover:bg-secondary/80"
      >
        {isMinting ? (
          <>
            <Coins className="mr-2 h-4 w-4 animate-spin" />
            Minting...
          </>
        ) : (
          <>
            <Coins className="mr-2 h-4 w-4" />
            Mint 100 cUSD
          </>
        )}
      </Button>

      <p className="mt-3 text-xs text-foreground/50">
        Note: This is for testing purposes only. Tokens have no real value.
      </p>
    </div>
  );
}

