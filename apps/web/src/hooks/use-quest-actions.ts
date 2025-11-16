"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import type { Abi } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import QuestArcadeArtifact from "../../../contracts/abi/QuestArcade.json";
import { CHAIN_CONFIG, CONTRACT_ADDRESSES } from "@/config/contractConfig";
import { useGameStore } from "@/store/use-game-store";

const QUEST_ARCADE_ABI = QuestArcadeArtifact.abi as Abi;

const STABLE_DECIMALS = 18;

type MutationStatus = "idle" | "pending" | "success" | "error";

type MutationState = {
  status: MutationStatus;
  error?: string;
};

type CreateQuestArgs = {
  title: string;
  description: string;
  reward: number;
  proofType: string;
  timeLimitHours?: number;
};

type SubmitProofArgs = {
  questId: string;
  proofCid: string;
  metadataCid: string;
};

type UpdateQuestArgs = {
  questId: string;
  title: string;
  description: string;
  reward: number;
  timeLimitHours?: number;
};

type UseQuestActionsOptions = {
  onSettled?: () => void | Promise<void>;
};

const PROOF_TYPE_MAP: Record<string, number> = {
  Photo: 0,
  Video: 1,
  GPS: 2,
};

const toContractAddress = (value?: string): `0x${string}` | undefined =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value) ? (value as `0x${string}`) : undefined;

const parseQuestId = (questId: string): bigint => {
  try {
    return BigInt(questId);
  } catch {
    return 0n;
  }
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useQuestActions(options?: UseQuestActionsOptions) {
  const { onSettled } = options ?? {};
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_CONFIG.defaultChainId });
  const { writeContractAsync } = useWriteContract();
  const { addXp, quests } = useGameStore();

  const [createState, setCreateState] = useState<MutationState>({ status: "idle" });
  const [acceptState, setAcceptState] = useState<MutationState & { questId?: string }>({ status: "idle" });
  const [submitState, setSubmitState] = useState<MutationState & { questId?: string }>({ status: "idle" });
  const [claimState, setClaimState] = useState<MutationState & { questId?: string }>({ status: "idle" });
  const [updateState, setUpdateState] = useState<MutationState & { questId?: string }>({ status: "idle" });
  const [verifyState, setVerifyState] = useState<MutationState & { questId?: string }>({ status: "idle" });

  const questArcadeAddress = useMemo(
    () => toContractAddress(CONTRACT_ADDRESSES.questArcade),
    []
  );
  const stableTokenAddress = useMemo(
    () => toContractAddress(CHAIN_CONFIG.stableTokenAddress),
    []
  );

  const ensureWalletReady = useCallback(() => {
    if (!address) {
      throw new Error("Connect your wallet to continue.");
    }
    if (!questArcadeAddress || !stableTokenAddress) {
      throw new Error("Quest contract addresses are not configured.");
    }
    if (stableTokenAddress === ZERO_ADDRESS) {
      throw new Error(
        "Stable token address is not configured for this network. Set NEXT_PUBLIC_STABLE_TOKEN_ADDRESS."
      );
    }
    if (!publicClient) {
      throw new Error("Public client unavailable. Check your network connection.");
    }
  }, [address, publicClient, questArcadeAddress, stableTokenAddress]);

  const handleSettled = useCallback(async () => {
    if (onSettled) {
      await onSettled();
    }
  }, [onSettled]);

  const createQuest = useCallback(
    async ({ title, description, reward, proofType, timeLimitHours }: CreateQuestArgs) => {
      try {
        console.log("Quest creation: Starting...");
        console.log("Quest creation: Account:", address);
        console.log("Quest creation: Quest Arcade Address:", questArcadeAddress);
        console.log("Quest creation: Stable Token Address:", stableTokenAddress);
        console.log("Quest creation: Contract expects token:", await publicClient!.readContract({
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "stableToken",
        }));
        console.log("Quest creation: Addresses match:", stableTokenAddress.toLowerCase() === (await publicClient!.readContract({
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "stableToken",
        })).toLowerCase());
        
        ensureWalletReady();
        setCreateState({ status: "pending" });

        const rewardAmount = parseUnits(reward.toString(), STABLE_DECIMALS);
        const verificationType = PROOF_TYPE_MAP[proofType] ?? PROOF_TYPE_MAP.Photo;
        
        // Ensure deadline is at least 1 hour in the future
        const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        const hoursInSeconds = BigInt(Math.max(1, timeLimitHours ?? 24) * 3600);
        const deadlineSeconds = currentTimestamp + hoursInSeconds;
        
        // Validate deadline is in the future
        if (deadlineSeconds <= currentTimestamp) {
          throw new Error("Deadline must be in the future. Please increase the time limit.");
        }
        
        console.log("Quest creation: Quest details:", {
          title,
          description: description.substring(0, 50) + "...",
          reward,
          rewardAmount: rewardAmount.toString(),
          verificationType,
          deadline: new Date(Number(deadlineSeconds) * 1000).toISOString(),
          timeLimitHours,
        });
        console.log("Quest creation: Deadline calculation:", {
          currentTimestamp: currentTimestamp.toString(),
          hoursInSeconds: hoursInSeconds.toString(),
          deadlineSeconds: deadlineSeconds.toString(),
          deadlineDate: new Date(Number(deadlineSeconds) * 1000).toISOString(),
        });

        // Check token info and user balance
        try {
          // Get token name and symbol
          try {
            const [tokenName, tokenSymbol] = await Promise.all([
              publicClient!.readContract({
                address: stableTokenAddress!,
                abi: erc20Abi,
                functionName: "name",
              }) as Promise<string>,
              publicClient!.readContract({
                address: stableTokenAddress!,
                abi: erc20Abi,
                functionName: "symbol",
              }) as Promise<string>,
            ]);
            console.log("Quest creation: Token info:", {
              address: stableTokenAddress,
              name: tokenName,
              symbol: tokenSymbol,
            });
          } catch (tokenInfoError) {
            console.warn("Quest creation: Could not fetch token info:", tokenInfoError);
          }

          const balance = await publicClient!.readContract({
            address: stableTokenAddress!,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address!],
          }) as bigint;
          const formattedBalance = formatUnits(balance, STABLE_DECIMALS);
          console.log("Quest creation: User balance:", {
            raw: balance.toString(),
            formatted: formattedBalance,
            tokenAddress: stableTokenAddress,
          });
          if (balance < rewardAmount) {
            throw new Error(`Insufficient balance. You have ${formattedBalance} tokens but need ${reward} tokens. Please get more tokens at address ${stableTokenAddress}.`);
          }
        } catch (error) {
          console.error("Quest creation: Balance check failed:", error);
          throw error;
        }

        console.log("Quest creation: Approving token transfer...");
        const approveHash = await writeContractAsync({
          account: address,
          address: stableTokenAddress!,
          abi: erc20Abi,
          functionName: "approve",
          args: [questArcadeAddress!, rewardAmount],
        });
        console.log("Quest creation: Approval transaction hash:", approveHash);
        
        const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveHash });
        console.log("Quest creation: Approval confirmed in block:", approveReceipt.blockNumber);

        // Simulate the transaction first to catch errors before sending
        console.log("Quest creation: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "createQuest",
            args: [title, description, rewardAmount, verificationType, deadlineSeconds],
          });
          console.log("Quest creation: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Quest creation: Simulation failed BEFORE sending transaction:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage =
            sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          console.error("Quest creation: Full simulation error:", errorMessage);
          
          // Check if it's a token mismatch issue
          if (errorMessage.includes("SafeERC20FailedOperation")) {
            // Get the actual token address the contract expects
            try {
              const contractTokenAddress = await publicClient!.readContract({
                address: questArcadeAddress!,
                abi: QUEST_ARCADE_ABI,
                functionName: "stableToken",
              }) as `0x${string}`;
              
              if (contractTokenAddress.toLowerCase() !== stableTokenAddress!.toLowerCase()) {
                throw new Error(
                  `Token address mismatch! The contract expects token ${contractTokenAddress}, but you're using ${stableTokenAddress}. ` +
                  `Please update NEXT_PUBLIC_STABLE_TOKEN_ADDRESS environment variable to match the contract deployment.`
                );
              }
            } catch {
              // If we can't check, just throw the generic error
            }
            
            throw new Error(
              `Token transfer failed. This usually means: ` +
              `1) You don't have enough tokens, 2) The token approval failed, or ` +
              `3) The token address doesn't match what the contract expects. ` +
              `Check your balance and ensure the token address matches the contract deployment.`
            );
          }
          
          // Map simulation errors to user-friendly messages
          if (errorMessage.includes("QuestArcade__DeadlineElapsed") || errorMessage.includes("DeadlineElapsed")) {
            throw new Error("The deadline must be in the future. Please increase the time limit.");
          }
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("Invalid quest data. Please check that the title is not empty and reward is greater than 0.");
          }
          if (errorMessage.includes("QuestArcade__InvalidVerificationType") || errorMessage.includes("InvalidVerificationType")) {
            throw new Error("Invalid verification type selected.");
          }
          if (errorMessage.includes("ERC20") || errorMessage.includes("transfer") || errorMessage.includes("allowance") || errorMessage.includes("insufficient") || errorMessage.includes("revert")) {
            throw new Error(`Token transfer will fail: ${errorMessage}. Please ensure you have approved the contract and have sufficient balance.`);
          }
          throw new Error(`Transaction will fail: ${errorMessage}. Check console for details.`);
        }

        console.log("Quest creation: Creating quest on-chain...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "createQuest",
          args: [title, description, rewardAmount, verificationType, deadlineSeconds],
        });
        console.log("Quest creation: Quest creation transaction hash:", hash);

        let receipt;
        try {
          receipt = await publicClient!.waitForTransactionReceipt({ hash });
          console.log("Quest creation: Quest created in block:", receipt.blockNumber);
          console.log("Quest creation: Transaction receipt:", receipt);
        } catch (error: any) {
          console.error("Quest creation: Failed to get transaction receipt:", error);
          // Try to get the transaction to see if it was reverted
          try {
            const txReceipt = await publicClient!.getTransactionReceipt({ hash });
            console.log("Quest creation: Transaction receipt status:", txReceipt.status);
            
            if (txReceipt.status === "reverted") {
              // Try to decode the revert reason by simulating the transaction
              try {
                await publicClient!.simulateContract({
                  account: address,
                  address: questArcadeAddress!,
                  abi: QUEST_ARCADE_ABI,
                  functionName: "createQuest",
                  args: [title, description, rewardAmount, verificationType, deadlineSeconds],
                });
            } catch (simError: unknown) {
                console.error("Quest creation: Simulation error details:", {
                  error: simError,
                message: (simError as { message?: string })?.message,
                shortMessage: (simError as { shortMessage?: string })?.shortMessage,
                cause: (simError as { cause?: unknown })?.cause,
                details: (simError as { details?: string })?.details,
                });
                
              const sim = simError as { shortMessage?: string; message?: string; details?: string };
              const errorMessage = sim?.shortMessage || sim?.message || sim?.details || "Unknown error";
              const fullError = JSON.stringify(simError, null, 2);
                console.error("Quest creation: Full error object:", fullError);
                
                // Map common errors to user-friendly messages
                if (errorMessage.includes("QuestArcade__DeadlineElapsed") || errorMessage.includes("deadline") || errorMessage.includes("DeadlineElapsed")) {
                  throw new Error("The deadline must be in the future. Please increase the time limit.");
                }
                if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
                  throw new Error("Invalid quest data. Please check that the title is not empty and reward is greater than 0.");
                }
                if (errorMessage.includes("QuestArcade__InvalidVerificationType") || errorMessage.includes("InvalidVerificationType")) {
                  throw new Error("Invalid verification type selected.");
                }
                if (errorMessage.includes("ERC20") || errorMessage.includes("transfer") || errorMessage.includes("allowance") || errorMessage.includes("insufficient")) {
                  throw new Error("Token transfer failed. Please ensure you have approved the contract and have sufficient balance. Check your token balance.");
                }
                if (errorMessage.includes("revert") || errorMessage.includes("execution reverted")) {
                  // Try to extract the actual revert reason
                  const revertMatch = errorMessage.match(/revert (.+)/i) || errorMessage.match(/execution reverted: (.+)/i);
                  if (revertMatch) {
                    throw new Error(`Transaction reverted: ${revertMatch[1]}`);
                  }
                  throw new Error(`Transaction was reverted: ${errorMessage}`);
                }
                
                throw new Error(`Transaction failed: ${errorMessage}. Check console for full details.`);
              }
              
              throw new Error("Transaction was reverted. Please check the console for details.");
            }
        } catch (getTxError: unknown) {
          console.error("Quest creation: Error getting transaction details:", getTxError);
            // If we can't get details, check if it's a simulation error
          const txErr = getTxError as { message?: string };
          const mainErr = error as { message?: string } | undefined;
          const errorMsg = txErr?.message || mainErr?.message || "Unknown error";
            if (errorMsg.includes("revert") || errorMsg.includes("execution reverted")) {
              throw new Error(`Transaction reverted: ${errorMsg}`);
            }
            throw error || getTxError;
          }
          throw error;
        }

        // Check if the transaction succeeded
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. Please check your wallet for details.");
        }

        // Verify quest was created by checking the counter
        try {
          // Wait a moment for the state to update
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          const newCounter = await publicClient!.readContract({
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "questCounter",
          }) as bigint;
          console.log("Quest creation: New quest counter:", newCounter.toString());
          
          if (newCounter === 0n) {
            console.warn("Quest creation: Quest counter is still 0 after creation. This may indicate the transaction didn't execute properly.");
          }
        } catch {
          console.warn("Quest creation: Could not verify quest counter");
        }

        // Small delay to ensure blockchain state is updated
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setCreateState({ status: "success" });
        toast.success("Quest published successfully.");
        await handleSettled();
      } catch (error) {
        console.error("Quest creation: Error occurred:", error);
        setCreateState({ status: "error", error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, stableTokenAddress, writeContractAsync]
  );

  const acceptQuest = useCallback(
    async (questId: string) => {
      try {
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier.");
        }
        setAcceptState({ status: "pending", questId });

        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "acceptQuest",
          args: [id],
        });

        await publicClient!.waitForTransactionReceipt({ hash });

        setAcceptState({ status: "success", questId });
        toast.success("Quest accepted and synced.");
        await handleSettled();
      } catch (error) {
        setAcceptState({ status: "error", questId, error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const submitProof = useCallback(
    async ({ questId, proofCid, metadataCid }: SubmitProofArgs) => {
      try {
        ensureWalletReady();
        if (!proofCid.trim()) {
          throw new Error("Proof reference is required.");
        }
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier.");
        }
        setSubmitState({ status: "pending", questId });

        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "submitProof",
          args: [id, proofCid, metadataCid],
        });

        await publicClient!.waitForTransactionReceipt({ hash });

        setSubmitState({ status: "success", questId });
        toast.success("Proof submitted. Await verification.");
        await handleSettled();
      } catch (error) {
        setSubmitState({ status: "error", questId, error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const verifyQuest = useCallback(
    async ({ questId, approve }: { questId: string; approve: boolean }) => {
      try {
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier.");
        }
        setVerifyState({ status: "pending", questId });

        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "verifyQuest",
          args: [id, approve],
        });

        await publicClient!.waitForTransactionReceipt({ hash });

        setVerifyState({ status: "success", questId });
        toast.success(approve ? "Quest approved. Reward ready to claim." : "Quest rejected and funds returned.");
        await handleSettled();
      } catch (error) {
        setVerifyState({ status: "error", questId, error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const claimReward = useCallback(
    async (questId: string) => {
      try {
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier.");
        }
        setClaimState({ status: "pending", questId });

        // Find the quest to get XP value
        const quest = quests.find((q) => q.id === questId);
        const questXp = quest?.xp ?? 0;

        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "claimReward",
          args: [id],
        });

        await publicClient!.waitForTransactionReceipt({ hash });

        // Add XP when reward is successfully claimed
        if (questXp > 0) {
          addXp(questXp);
        }

        setClaimState({ status: "success", questId });
        toast.success(`Reward claimed successfully. ${questXp > 0 ? `+${questXp} XP earned!` : ""}`);
        await handleSettled();
      } catch (error) {
        setClaimState({ status: "error", questId, error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync, quests, addXp]
  );

  const updateQuest = useCallback(
    async ({ questId, title, description, reward, timeLimitHours }: UpdateQuestArgs) => {
      try {
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier.");
        }
        setUpdateState({ status: "pending", questId });

        const rewardAmount = parseUnits(reward.toString(), STABLE_DECIMALS);
        const deadlineSeconds =
          BigInt(Math.floor(Date.now() / 1000) + Math.max(1, timeLimitHours ?? 24) * 3600);

        // Check if reward amount changed - we may need to approve more tokens
        // The contract handles the difference, but we need to approve if increasing
        try {
          const currentQuest = (await publicClient!.readContract({
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "getQuestDetails",
            args: [id],
          })) as { rewardAmount: bigint };
          
          const currentReward = currentQuest.rewardAmount;
          if (rewardAmount > currentReward) {
            await writeContractAsync({
              account: address,
              address: stableTokenAddress!,
              abi: erc20Abi,
              functionName: "approve",
              args: [questArcadeAddress!, rewardAmount],
            });
          }
        } catch {
          // If we can't read current quest, just approve the full amount
          await writeContractAsync({
            account: address,
            address: stableTokenAddress!,
            abi: erc20Abi,
            functionName: "approve",
            args: [questArcadeAddress!, rewardAmount],
          });
        }

        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "updateQuest",
          args: [id, title, description, rewardAmount, deadlineSeconds],
        });

        await publicClient!.waitForTransactionReceipt({ hash });

        setUpdateState({ status: "success", questId });
        toast.success("Quest updated successfully.");
        await handleSettled();
      } catch (error) {
        setUpdateState({ status: "error", questId, error: formatError(error) });
        toast.error(formatError(error));
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, stableTokenAddress, writeContractAsync]
  );

  return {
    createQuest,
    acceptQuest,
    submitProof,
    verifyQuest,
    claimReward,
    updateQuest,
    states: {
      create: createState,
      accept: acceptState,
      submit: submitState,
      verify: verifyState,
      claim: claimState,
      update: updateState,
    },
    helpers: {
      formatReward: (amount: bigint) => formatUnits(amount, STABLE_DECIMALS),
    },
  };
}


