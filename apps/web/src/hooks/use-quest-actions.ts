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

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    // If the error already has a user-friendly message, return it
    if (error.message && !error.message.includes("0x") && !error.message.includes("revert")) {
      return error.message;
    }
    
    // Extract meaningful error messages from common error formats
    const errorString = error.message || String(error);
    
    // Check for contract-specific errors
    if (errorString.includes("QuestArcade__InvalidQuest") || errorString.includes("InvalidQuest")) {
      return "The quest does not exist or is invalid. Please check the quest ID.";
    }
    if (errorString.includes("QuestArcade__InvalidStatusTransition") || errorString.includes("InvalidStatusTransition")) {
      return "This action is not allowed in the quest's current state. The quest may have already progressed or been cancelled.";
    }
    if (errorString.includes("QuestArcade__Unauthorized") || errorString.includes("Unauthorized")) {
      return "You are not authorized to perform this action. Please check that you are the correct user.";
    }
    if (errorString.includes("QuestArcade__DeadlineElapsed") || errorString.includes("DeadlineElapsed")) {
      return "The quest deadline has passed. This action is no longer available.";
    }
    if (errorString.includes("QuestArcade__QuestAlreadyAccepted") || errorString.includes("QuestAlreadyAccepted")) {
      return "This quest has already been accepted by another user.";
    }
    if (errorString.includes("QuestArcade__RewardAlreadyClaimed") || errorString.includes("RewardAlreadyClaimed")) {
      return "The reward for this quest has already been claimed.";
    }
    if (errorString.includes("QuestArcade__FundsNotEscrowed") || errorString.includes("FundsNotEscrowed")) {
      return "The quest funds have not been escrowed. The creator may need to fund the quest first.";
    }
    if (errorString.includes("QuestArcade__CreatorOnly") || errorString.includes("CreatorOnly")) {
      return "Only the quest creator can perform this action.";
    }
    if (errorString.includes("QuestArcade__WorkerOnly") || errorString.includes("WorkerOnly")) {
      return "Only the quest worker (the person who accepted the quest) can perform this action.";
    }
    if (errorString.includes("QuestArcade__InvalidVerificationType") || errorString.includes("InvalidVerificationType")) {
      return "Invalid verification type selected. Please choose a valid proof type.";
    }
    
    // Check for wallet/network errors
    if (errorString.includes("User rejected") || errorString.includes("user rejected") || errorString.includes("rejected the request")) {
      return "Transaction was cancelled. Please try again when ready.";
    }
    if (errorString.includes("insufficient funds") || errorString.includes("insufficient balance")) {
      return "Insufficient funds. Please ensure you have enough tokens to complete this transaction.";
    }
    if (errorString.includes("network") || errorString.includes("Network")) {
      return "Network error. Please check your connection and try again.";
    }
    if (errorString.includes("timeout") || errorString.includes("Timeout")) {
      return "Request timed out. Please check your network connection and try again.";
    }
    
    // Check for revert errors
    if (errorString.includes("revert") || errorString.includes("execution reverted")) {
      // Try to extract the revert reason
      const revertMatch = errorString.match(/revert (.+)/i) || errorString.match(/execution reverted: (.+)/i);
      if (revertMatch && revertMatch[1] && !revertMatch[1].includes("0x")) {
        return `Transaction failed: ${revertMatch[1]}`;
      }
      return "Transaction was reverted. Please check the quest status and try again.";
    }
    
    // Return the error message if it's meaningful
    if (error.message && error.message.length < 200) {
      return error.message;
    }
  }
  
  // For non-Error objects, try to extract a meaningful message
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object") {
    const errorObj = error as { message?: string; shortMessage?: string; details?: string };
    if (errorObj.message) return errorObj.message;
    if (errorObj.shortMessage) return errorObj.shortMessage;
    if (errorObj.details) return errorObj.details;
  }
  
  return "Something went wrong. Please try again. If the problem persists, check the console for details.";
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
  const [cancelState, setCancelState] = useState<MutationState & { questId?: string }>({ status: "idle" });

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
        ensureWalletReady();
        
        // Log debug info after validation
        if (stableTokenAddress && questArcadeAddress) {
          const contractTokenAddress = (await publicClient!.readContract({
            address: questArcadeAddress,
            abi: QUEST_ARCADE_ABI,
            functionName: "stableToken",
          })) as `0x${string}`;
          console.log("Quest creation: Account:", address);
          console.log("Quest creation: Quest Arcade Address:", questArcadeAddress);
          console.log("Quest creation: Stable Token Address:", stableTokenAddress);
          console.log("Quest creation: Contract expects token:", contractTokenAddress);
          console.log("Quest creation: Addresses match:", stableTokenAddress.toLowerCase() === contractTokenAddress.toLowerCase());
        }
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

        // Check current allowance first
        console.log("Quest creation: Checking current allowance...");
        const currentAllowance = await publicClient!.readContract({
          address: stableTokenAddress!,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address!, questArcadeAddress!],
        }) as bigint;
        
        console.log("Quest creation: Current allowance:", {
          raw: currentAllowance.toString(),
          formatted: formatUnits(currentAllowance, STABLE_DECIMALS),
          required: formatUnits(rewardAmount, STABLE_DECIMALS),
        });

        // Only approve if current allowance is insufficient
        if (currentAllowance < rewardAmount) {
          // Some tokens (like USDC) require resetting to 0 first if there's an existing approval
          if (currentAllowance > 0n) {
            console.log("Quest creation: Resetting approval to 0 first (required by some tokens)...");
            const resetHash = await writeContractAsync({
              account: address,
              address: stableTokenAddress!,
              abi: erc20Abi,
              functionName: "approve",
              args: [questArcadeAddress!, 0n],
            });
            const resetReceipt = await publicClient!.waitForTransactionReceipt({ hash: resetHash });
            
            if (resetReceipt.status === "reverted") {
              throw new Error("Failed to reset approval. The transaction was reverted. Please try again.");
            }
            console.log("Quest creation: Approval reset confirmed");
          }

          // Retry approval up to 3 times
          let approvalSuccess = false;
          let lastError: Error | null = null;
          const maxRetries = 3;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`Quest creation: Approving token transfer (attempt ${attempt}/${maxRetries})...`);
              
              // Simulate the approval first to catch errors early
              try {
                await publicClient!.simulateContract({
                  account: address,
                  address: stableTokenAddress!,
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [questArcadeAddress!, rewardAmount],
                });
                console.log("Quest creation: Approval simulation successful");
              } catch (simError: unknown) {
                const simMsg = simError instanceof Error ? simError.message : String(simError);
                console.error("Quest creation: Approval simulation failed:", simMsg);
                throw new Error(`Approval will fail: ${simMsg}. Please check your token balance and the token contract.`);
              }
              
              const approveHash = await writeContractAsync({
                account: address,
                address: stableTokenAddress!,
                abi: erc20Abi,
                functionName: "approve",
                args: [questArcadeAddress!, rewardAmount],
              });
              console.log("Quest creation: Approval transaction hash:", approveHash);
              
              const approveReceipt = await publicClient!.waitForTransactionReceipt({ 
                hash: approveHash,
                confirmations: 1,
              });
              
              // Check if transaction was reverted
              if (approveReceipt.status === "reverted") {
                throw new Error("Approval transaction was reverted. Please check your wallet for details.");
              }
              
              console.log("Quest creation: Approval confirmed in block:", approveReceipt.blockNumber);

              // Wait a bit for state to update (some networks need a moment)
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Verify the allowance was set correctly - retry reading a few times
              let newAllowance = 0n;
              for (let readAttempt = 0; readAttempt < 5; readAttempt++) {
                newAllowance = await publicClient!.readContract({
                  address: stableTokenAddress!,
                  abi: erc20Abi,
                  functionName: "allowance",
                  args: [address!, questArcadeAddress!],
                }) as bigint;
                
                if (newAllowance >= rewardAmount) {
                  break;
                }
                
                // Wait before retrying the read
                if (readAttempt < 4) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
              
              console.log("Quest creation: New allowance after approval:", {
                raw: newAllowance.toString(),
                formatted: formatUnits(newAllowance, STABLE_DECIMALS),
                required: formatUnits(rewardAmount, STABLE_DECIMALS),
              });

              if (newAllowance >= rewardAmount) {
                approvalSuccess = true;
                break;
              } else {
                lastError = new Error(
                  `Approval verification failed. Expected allowance of ${formatUnits(rewardAmount, STABLE_DECIMALS)} tokens, ` +
                  `but only ${formatUnits(newAllowance, STABLE_DECIMALS)} was approved.`
                );
                
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                  console.log("Quest creation: Retrying approval in 2 seconds...");
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            } catch (approvalError: unknown) {
              const errorMsg = approvalError instanceof Error ? approvalError.message : String(approvalError);
              console.error(`Quest creation: Approval attempt ${attempt} failed:`, errorMsg);
              lastError = approvalError instanceof Error ? approvalError : new Error(errorMsg);
              
              // If not the last attempt, wait before retrying
              if (attempt < maxRetries) {
                console.log("Quest creation: Retrying approval in 2 seconds...");
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }

          if (!approvalSuccess) {
            throw lastError || new Error(
              `Failed to approve tokens after ${maxRetries} attempts. ` +
              `Please check if the token contract supports standard ERC20 approvals. ` +
              `Token address: ${stableTokenAddress}`
            );
          }
          
          console.log("Quest creation: Approval successful!");
        } else {
          console.log("Quest creation: Sufficient allowance already exists, skipping approval");
        }

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
          
          // Check for SafeERC20FailedOperation error (signature 0xfb8f41b2)
          const errorString = JSON.stringify(simError);
          const isSafeERC20Error = 
            errorMessage.includes("SafeERC20FailedOperation") ||
            errorMessage.includes("0xfb8f41b2") ||
            errorString.includes("0xfb8f41b2") ||
            errorMessage.includes("token transfer failed") ||
            errorMessage.includes("ERC20 operation failed");

          if (isSafeERC20Error) {
            // Verify allowance one more time
            try {
              const finalAllowance = await publicClient!.readContract({
                address: stableTokenAddress!,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address!, questArcadeAddress!],
              }) as bigint;

              if (finalAllowance < rewardAmount) {
                throw new Error(
                  `Insufficient token approval. Current allowance: ${formatUnits(finalAllowance, STABLE_DECIMALS)} tokens, ` +
                  `required: ${formatUnits(rewardAmount, STABLE_DECIMALS)} tokens. ` +
                  `Please try approving again.`
                );
              }
            } catch {
              // If we can't check allowance, continue with generic error
            }

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
              `Token transfer failed (SafeERC20FailedOperation). This usually means: ` +
              `1) The token approval wasn't sufficient, 2) You don't have enough tokens, ` +
              `3) The token contract doesn't support standard transfers, or ` +
              `4) There was an issue with the token address. ` +
              `Please check your balance, try approving again, and ensure you're using the correct token.`
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
        } catch (error: unknown) {
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
                // Check for SafeERC20FailedOperation error signature
                const errorString = JSON.stringify(simError);
                const isSafeERC20Error = 
                  errorMessage.includes("SafeERC20FailedOperation") ||
                  errorMessage.includes("0xfb8f41b2") ||
                  errorString.includes("0xfb8f41b2") ||
                  errorMessage.includes("token transfer failed") ||
                  errorMessage.includes("ERC20 operation failed");

                if (isSafeERC20Error) {
                  // Verify allowance one more time
                  try {
                    const finalAllowance = await publicClient!.readContract({
                      address: stableTokenAddress!,
                      abi: erc20Abi,
                      functionName: "allowance",
                      args: [address!, questArcadeAddress!],
                    }) as bigint;

                    if (finalAllowance < rewardAmount) {
                      throw new Error(
                        `Insufficient token approval. Current allowance: ${formatUnits(finalAllowance, STABLE_DECIMALS)} tokens, ` +
                        `required: ${formatUnits(rewardAmount, STABLE_DECIMALS)} tokens. ` +
                        `Please try approving again.`
                      );
                    }
                  } catch {
                    // If we can't check allowance, continue with generic error
                  }

                  throw new Error(
                    `Token transfer failed (SafeERC20FailedOperation). Please ensure: ` +
                    `1) You have approved the contract with sufficient tokens, ` +
                    `2) You have enough balance, and ` +
                    `3) The token address matches the contract deployment.`
                  );
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
        console.log("Quest acceptance: Starting...");
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier. Please check the quest ID and try again.");
        }
        
        // Check quest state before attempting to accept
        try {
          const questDetails = await publicClient!.readContract({
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "getQuestDetails",
            args: [id],
          }) as { status: number; creator: `0x${string}`; worker: `0x${string}`; deadline: bigint };
          
          console.log("Quest acceptance: Quest details:", {
            status: questDetails.status,
            creator: questDetails.creator,
            worker: questDetails.worker,
            deadline: questDetails.deadline.toString(),
            currentTime: BigInt(Math.floor(Date.now() / 1000)).toString(),
            isExpired: questDetails.deadline <= BigInt(Math.floor(Date.now() / 1000)),
            isCreator: questDetails.creator.toLowerCase() === address!.toLowerCase(),
            alreadyAccepted: questDetails.worker !== "0x0000000000000000000000000000000000000000",
          });
          
          // Pre-check common issues
          if (questDetails.creator.toLowerCase() === address!.toLowerCase()) {
            throw new Error("You cannot accept your own quest. Only other users can accept quests you create.");
          }
          
          if (questDetails.worker !== "0x0000000000000000000000000000000000000000") {
            throw new Error("This quest has already been accepted by another user. Please find another quest.");
          }
          
          const currentTime = BigInt(Math.floor(Date.now() / 1000));
          if (questDetails.deadline <= currentTime) {
            throw new Error("This quest has expired. The deadline has passed and it can no longer be accepted.");
          }
          
          // Status 0 = Open, 1 = Accepted, 2 = Submitted, 3 = Verified, 4 = Rejected, 5 = Cancelled
          if (questDetails.status !== 0) {
            const statusNames = ["Open", "Accepted", "Submitted", "Verified", "Rejected", "Cancelled"];
            throw new Error(`This quest is not available for acceptance. Current status: ${statusNames[questDetails.status] || "Unknown"}.`);
          }
        } catch (preCheckError) {
          if (preCheckError instanceof Error && !preCheckError.message.includes("Invalid quest")) {
            console.error("Quest acceptance: Pre-check failed:", preCheckError);
            throw preCheckError;
          }
          // If it's a read error, continue to simulation which will catch it
          console.warn("Quest acceptance: Could not read quest details, will rely on simulation:", preCheckError);
        }
        
        setAcceptState({ status: "pending", questId });

        // Simulate the transaction first to catch errors before sending
        console.log("Quest acceptance: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "acceptQuest",
            args: [id],
          });
          console.log("Quest acceptance: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Quest acceptance: Simulation failed:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage = sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          
          // Map contract errors to user-friendly messages
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("This quest does not exist. It may have been deleted or the quest ID is incorrect.");
          }
          if (errorMessage.includes("QuestArcade__InvalidStatusTransition") || errorMessage.includes("InvalidStatusTransition")) {
            throw new Error("This quest is not in the correct state to be accepted. It may have already been accepted, submitted, or completed.");
          }
          if (errorMessage.includes("QuestArcade__Unauthorized") || errorMessage.includes("Unauthorized")) {
            throw new Error("You cannot accept your own quest. Only other users can accept quests you create.");
          }
          if (errorMessage.includes("QuestArcade__DeadlineElapsed") || errorMessage.includes("DeadlineElapsed") || errorMessage.includes("deadline")) {
            throw new Error("This quest has expired. The deadline has passed and it can no longer be accepted.");
          }
          if (errorMessage.includes("QuestArcade__QuestAlreadyAccepted") || errorMessage.includes("QuestAlreadyAccepted") || errorMessage.includes("already accepted")) {
            throw new Error("This quest has already been accepted by another user. Please find another quest.");
          }
          
          throw new Error(`Cannot accept quest: ${errorMessage}. Please check the quest status and try again.`);
        }

        console.log("Quest acceptance: Sending transaction...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "acceptQuest",
          args: [id],
        });
        console.log("Quest acceptance: Transaction hash:", hash);

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        console.log("Quest acceptance: Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. The quest may have been accepted by someone else or the status changed.");
        }

        setAcceptState({ status: "success", questId });
        toast.success("Quest accepted successfully! You can now submit proof when ready.");
        await handleSettled();
      } catch (error) {
        console.error("Quest acceptance: Error occurred:", error);
        const errorMessage = formatError(error);
        setAcceptState({ status: "error", questId, error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const submitProof = useCallback(
    async ({ questId, proofCid, metadataCid }: SubmitProofArgs) => {
      try {
        console.log("Proof submission: Starting...");
        ensureWalletReady();
        if (!proofCid.trim()) {
          throw new Error("Proof reference is required. Please upload a file or provide a CID.");
        }
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier. Please check the quest ID and try again.");
        }
        setSubmitState({ status: "pending", questId });

        // Simulate the transaction first
        console.log("Proof submission: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "submitProof",
            args: [id, proofCid.trim(), metadataCid],
          });
          console.log("Proof submission: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Proof submission: Simulation failed:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage = sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("This quest does not exist or the proof CID is invalid. Please check your proof and try again.");
          }
          if (errorMessage.includes("QuestArcade__InvalidStatusTransition") || errorMessage.includes("InvalidStatusTransition")) {
            throw new Error("You can only submit proof for quests you have accepted. Please accept the quest first.");
          }
          if (errorMessage.includes("QuestArcade__DeadlineElapsed") || errorMessage.includes("DeadlineElapsed")) {
            throw new Error("The quest deadline has passed. You can no longer submit proof for this quest.");
          }
          if (errorMessage.includes("QuestArcade__WorkerOnly") || errorMessage.includes("WorkerOnly")) {
            throw new Error("Only the user who accepted this quest can submit proof. Please accept the quest first.");
          }
          
          throw new Error(`Cannot submit proof: ${errorMessage}. Please check the quest status and try again.`);
        }

        console.log("Proof submission: Sending transaction...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "submitProof",
          args: [id, proofCid.trim(), metadataCid],
        });
        console.log("Proof submission: Transaction hash:", hash);

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        console.log("Proof submission: Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. Please check that you have accepted the quest and the deadline hasn't passed.");
        }

        setSubmitState({ status: "success", questId });
        toast.success("Proof submitted successfully! The quest creator will review it shortly.");
        await handleSettled();
      } catch (error) {
        console.error("Proof submission: Error occurred:", error);
        const errorMessage = formatError(error);
        setSubmitState({ status: "error", questId, error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const verifyQuest = useCallback(
    async ({ questId, approve }: { questId: string; approve: boolean }) => {
      try {
        console.log("Quest verification: Starting...", { questId, approve });
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier. Please check the quest ID and try again.");
        }
        setVerifyState({ status: "pending", questId });

        // Simulate the transaction first
        console.log("Quest verification: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "verifyQuest",
            args: [id, approve],
          });
          console.log("Quest verification: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Quest verification: Simulation failed:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage = sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("This quest does not exist. Please check the quest ID.");
          }
          if (errorMessage.includes("QuestArcade__InvalidStatusTransition") || errorMessage.includes("InvalidStatusTransition")) {
            throw new Error("You can only verify quests that have been submitted. The quest must be in 'Submitted' status.");
          }
          if (errorMessage.includes("QuestArcade__Unauthorized") || errorMessage.includes("Unauthorized")) {
            throw new Error("Only the quest creator can verify this quest. You are not authorized to perform this action.");
          }
          
          throw new Error(`Cannot verify quest: ${errorMessage}. Please check the quest status and try again.`);
        }

        console.log("Quest verification: Sending transaction...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "verifyQuest",
          args: [id, approve],
        });
        console.log("Quest verification: Transaction hash:", hash);

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        console.log("Quest verification: Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. Please check that the quest is in the correct status for verification.");
        }

        setVerifyState({ status: "success", questId });
        toast.success(approve ? "Quest approved successfully! The worker can now claim their reward." : "Quest rejected. Funds have been returned to you.");
        await handleSettled();
      } catch (error) {
        console.error("Quest verification: Error occurred:", error);
        const errorMessage = formatError(error);
        setVerifyState({ status: "error", questId, error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  const claimReward = useCallback(
    async (questId: string) => {
      try {
        console.log("Reward claim: Starting...");
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier. Please check the quest ID and try again.");
        }
        setClaimState({ status: "pending", questId });

        // Find the quest to get XP value
        const quest = quests.find((q) => q.id === questId);
        const questXp = quest?.xp ?? 0;

        // Simulate the transaction first
        console.log("Reward claim: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "claimReward",
            args: [id],
          });
          console.log("Reward claim: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Reward claim: Simulation failed:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage = sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("This quest does not exist. Please check the quest ID.");
          }
          if (errorMessage.includes("QuestArcade__InvalidStatusTransition") || errorMessage.includes("InvalidStatusTransition")) {
            throw new Error("The quest must be verified before you can claim the reward. Please wait for the creator to verify your submission.");
          }
          if (errorMessage.includes("QuestArcade__RewardAlreadyClaimed") || errorMessage.includes("RewardAlreadyClaimed")) {
            throw new Error("The reward for this quest has already been claimed.");
          }
          if (errorMessage.includes("QuestArcade__WorkerOnly") || errorMessage.includes("WorkerOnly")) {
            throw new Error("Only the user who completed this quest can claim the reward.");
          }
          
          throw new Error(`Cannot claim reward: ${errorMessage}. Please check the quest status and try again.`);
        }

        console.log("Reward claim: Sending transaction...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "claimReward",
          args: [id],
        });
        console.log("Reward claim: Transaction hash:", hash);

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        console.log("Reward claim: Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. Please check that the quest has been verified and the reward hasn't been claimed yet.");
        }

        // Add XP when reward is successfully claimed
        if (questXp > 0) {
          addXp(questXp);
        }

        setClaimState({ status: "success", questId });
        toast.success(`Reward claimed successfully! ${questXp > 0 ? `+${questXp} XP earned!` : ""}`);
        await handleSettled();
      } catch (error) {
        console.error("Reward claim: Error occurred:", error);
        const errorMessage = formatError(error);
        setClaimState({ status: "error", questId, error: errorMessage });
        toast.error(errorMessage);
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

  const cancelQuest = useCallback(
    async (questId: string) => {
      try {
        console.log("Quest cancellation: Starting...");
        ensureWalletReady();
        const id = parseQuestId(questId);
        if (id === 0n) {
          throw new Error("Invalid quest identifier. Please check the quest ID and try again.");
        }
        setCancelState({ status: "pending", questId });

        // Simulate the transaction first
        console.log("Quest cancellation: Simulating transaction...");
        try {
          await publicClient!.simulateContract({
            account: address,
            address: questArcadeAddress!,
            abi: QUEST_ARCADE_ABI,
            functionName: "cancelQuest",
            args: [id],
          });
          console.log("Quest cancellation: Simulation successful, sending transaction...");
        } catch (simError: unknown) {
          console.error("Quest cancellation: Simulation failed:", simError);
          const sim = simError as { shortMessage?: string; message?: string; details?: string };
          const errorMessage = sim?.shortMessage || sim?.message || sim?.details || JSON.stringify(simError);
          
          if (errorMessage.includes("QuestArcade__InvalidQuest") || errorMessage.includes("InvalidQuest")) {
            throw new Error("This quest does not exist. Please check the quest ID.");
          }
          if (errorMessage.includes("QuestArcade__InvalidStatusTransition") || errorMessage.includes("InvalidStatusTransition")) {
            throw new Error("This quest cannot be cancelled. It may have already been accepted, submitted, or completed.");
          }
          if (errorMessage.includes("QuestArcade__CreatorOnly") || errorMessage.includes("CreatorOnly")) {
            throw new Error("Only the quest creator can cancel this quest.");
          }
          if (errorMessage.includes("QuestArcade__FundsNotEscrowed") || errorMessage.includes("FundsNotEscrowed")) {
            throw new Error("The quest funds have not been escrowed. There is nothing to refund.");
          }
          
          throw new Error(`Cannot cancel quest: ${errorMessage}. Please check the quest status and try again.`);
        }

        console.log("Quest cancellation: Sending transaction...");
        const hash = await writeContractAsync({
          account: address,
          address: questArcadeAddress!,
          abi: QUEST_ARCADE_ABI,
          functionName: "cancelQuest",
          args: [id],
        });
        console.log("Quest cancellation: Transaction hash:", hash);

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        console.log("Quest cancellation: Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === "reverted") {
          throw new Error("Transaction was reverted. Please check that you are the quest creator and the quest can be cancelled.");
        }
        
        setCancelState({ status: "success", questId });
        toast.success("Quest cancelled successfully. Your funds have been refunded.");
        await handleSettled();
      } catch (error) {
        console.error("Quest cancellation: Error occurred:", error);
        const errorMessage = formatError(error);
        setCancelState({ status: "error", questId, error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [address, ensureWalletReady, handleSettled, publicClient, questArcadeAddress, writeContractAsync]
  );

  return {
    createQuest,
    acceptQuest,
    submitProof,
    verifyQuest,
    claimReward,
    updateQuest,
    cancelQuest,
    states: {
      create: createState,
      accept: acceptState,
      submit: submitState,
      verify: verifyState,
      claim: claimState,
      update: updateState,
      cancel: cancelState,
    },
    helpers: {
      formatReward: (amount: bigint) => formatUnits(amount, STABLE_DECIMALS),
    },
  };
}


