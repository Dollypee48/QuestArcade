"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import type { Abi } from "viem";

import QuestArcadeArtifact from "../../../contracts/abi/QuestArcade.json";
import QuestRegistryArtifact from "../../../contracts/abi/QuestRegistry.json";
import RewardsVaultArtifact from "../../../contracts/abi/RewardsVault.json";
import ReputationArtifact from "../../../contracts/abi/Reputation.json";
import { CHAIN_CONFIG, CONTRACT_ADDRESSES } from "@/config/contractConfig";

// Log contract addresses on module load (only once in dev mode)
if (process.env.NODE_ENV === "development") {
  console.log("QuestArcade: Contract configuration:", {
    questArcade: CONTRACT_ADDRESSES.questArcade,
    questRegistry: CONTRACT_ADDRESSES.questRegistry,
    chainId: CHAIN_CONFIG.defaultChainId,
    stableToken: CHAIN_CONFIG.stableTokenAddress,
  });
}
import { useGameStore } from "@/store/use-game-store";
import type { LevelTier, Quest, QuestProgress, QuestProof } from "@/store/use-game-store";
import { buildIpfsGatewayUrl } from "@/lib/ipfs";

const QUEST_ARCADE_ABI = QuestArcadeArtifact.abi as Abi;
const QUEST_REGISTRY_ABI = QuestRegistryArtifact.abi as Abi;
const REWARDS_VAULT_ABI = RewardsVaultArtifact.abi as Abi;
const REPUTATION_ABI = ReputationArtifact.abi as Abi;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const STABLE_DECIMALS = 18;
const VERIFICATION_LABELS = ["Photo", "Video", "GPS"] as const;

const STATUS_MAP: Record<number, QuestProgress["status"]> = {
  0: "available", // Open
  1: "accepted", // Accepted
  2: "submitted", // Submitted
  3: "completed", // Verified
  4: "available", // Rejected -> return to pool
  5: "available", // Cancelled
};

const REGISTRY_STATUS_MAP: Record<number, QuestProgress["status"]> = {
  0: "available", // Draft
  1: "available", // Active
  2: "submitted", // Submitted
  3: "completed", // Verified
  4: "available", // Rejected
  5: "available", // Cancelled
};

type ContractQuest = {
  id: bigint;
  title: string;
  description: string;
  rewardAmount: bigint;
  verificationType: number;
  deadline: bigint;
  creator: `0x${string}`;
  worker: `0x${string}`;
  status: number;
  proofCID: string;
  proofMetadata: string;
  exists: boolean;
  rewardEscrowed: boolean;
  rewardClaimed: boolean;
};

type RegistryQuestRaw = {
  questId: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  metadataURI: string;
  deadline: bigint;
  rewardAmount: bigint;
  state: number;
  exists: boolean;
};

type RegistryQuest = {
  title?: string;
  description?: string;
  metadataUri?: string;
  deadline?: number;
  rewardAmount?: number;
  state?: number;
};

type RewardsEscrowRaw = {
  token: `0x${string}`;
  creator: `0x${string}`;
  amount: bigint;
  released: boolean;
  refunded: boolean;
  exists: boolean;
};

const toContractAddress = (value?: string): `0x${string}` | undefined =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value) ? (value as `0x${string}`) : undefined;

const calculateHoursRemaining = (deadline?: number) => {
  if (!deadline || deadline <= 0) {
    return undefined;
  }
  const now = Math.floor(Date.now() / 1000);
  const remaining = Math.ceil((deadline - now) / 3600);
  return Math.max(0, remaining);
};

const isQuestExpired = (deadline?: number): boolean => {
  if (!deadline || deadline <= 0) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return deadline <= now;
};

const QUEST_STATUS_LABELS: Record<number, Quest["onChainState"]> = {
  0: "active",
  1: "accepted",
  2: "submitted",
  3: "verified",
  4: "rejected",
  5: "cancelled",
};

const combineTags = (existing: string[] | undefined, ...additional: (string | undefined)[]) => {
  const merged = [...(existing ?? [])];
  additional.forEach((tag) => {
    if (tag && !merged.includes(tag)) {
      merged.push(tag);
    }
  });
  return merged;
};

const mapQuestStatusLabel = (status?: number): Quest["onChainState"] => {
  if (status === undefined || status === null) {
    return undefined;
  }
  return QUEST_STATUS_LABELS[status] ?? undefined;
};

const normalizeAddress = (value?: `0x${string}`): `0x${string}` | undefined => {
  if (!value) {
    return undefined;
  }
  return value.toLowerCase() === ZERO_ADDRESS ? undefined : value;
};

type ParsedProofMetadata = {
  proofType?: string;
  note?: string;
  fileName?: string;
};

const parseProofMetadata = (raw?: string): ParsedProofMetadata | undefined => {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as ParsedProofMetadata;
    return {
      proofType: typeof parsed.proofType === "string" ? parsed.proofType : undefined,
      note: typeof parsed.note === "string" ? parsed.note : undefined,
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : undefined,
    };
  } catch {
    return undefined;
  }
};

const mapQuestProof = (cid?: string, metadata?: ParsedProofMetadata): QuestProof | undefined => {
  const trimmedCid = cid?.trim();
  const normalizedCid = trimmedCid && trimmedCid.length > 0 ? trimmedCid : undefined;
  const hasMeta = Boolean(metadata?.note || metadata?.proofType || metadata?.fileName);

  if (!normalizedCid && !hasMeta) {
    return undefined;
  }

  return {
    cid: normalizedCid,
    url: buildIpfsGatewayUrl(normalizedCid),
    proofType: metadata?.proofType,
    note: metadata?.note,
    fileName: metadata?.fileName,
  };
};

const mapRegistryStateLabel = (state?: number): Quest["onChainState"] => {
  switch (state) {
    case 0:
      return "draft";
    case 1:
      return "active";
    case 2:
      return "submitted";
    case 3:
      return "verified";
    case 4:
      return "rejected";
    case 5:
      return "cancelled";
    default:
      return undefined;
  }
};

const mapRegistryQuest = (raw: RegistryQuestRaw): RegistryQuest => ({
  title: raw.title?.trim() || undefined,
  description: raw.description?.trim() || undefined,
  metadataUri: raw.metadataURI?.trim() || undefined,
  deadline: Number(raw.deadline),
  rewardAmount: Number(formatUnits(raw.rewardAmount, STABLE_DECIMALS)),
  state: Number(raw.state),
});

const normalizeLevelLabel = (label: string): LevelTier => {
  const normalized = label.trim().toLowerCase();
  switch (normalized) {
    case "bronze":
      return "Bronze";
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    case "legendary":
      return "Legendary";
    case "platinum":
      return "Platinum";
    case "mythic":
      return "Mythic";
    default:
      return "Rookie";
  }
};

const QUEST_ARCADE_ADDRESS = toContractAddress(CONTRACT_ADDRESSES.questArcade);
const QUEST_REGISTRY_ADDRESS = toContractAddress(CONTRACT_ADDRESSES.questRegistry);
const REWARDS_VAULT_ADDRESS = toContractAddress(CONTRACT_ADDRESSES.rewardsVault);
const REPUTATION_ADDRESS = toContractAddress(CONTRACT_ADDRESSES.reputation);
const STABLE_TOKEN_ADDRESS = toContractAddress(CHAIN_CONFIG.stableTokenAddress);

export function useQuestArcadeSync() {
  const publicClient = usePublicClient({ chainId: CHAIN_CONFIG.defaultChainId });
  const { address } = useAccount();
  const setQuests = useGameStore((state) => state.setQuests);
  const setProgress = useGameStore((state) => state.setProgress);
  const setBalance = useGameStore((state) => state.setBalance);
  const syncOnChainProfile = useGameStore((state) => state.syncOnChainProfile);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const syncFromChain = useCallback(async () => {
    if (!publicClient || !QUEST_ARCADE_ADDRESS) {
      return;
    }

    // Prevent multiple simultaneous syncs
    if (isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      // Verify contract exists by trying to read a public variable
      // First verify the contract exists by reading the owner (should always exist)
      try {
        await publicClient.readContract({
          address: QUEST_ARCADE_ADDRESS,
          abi: QUEST_ARCADE_ABI,
          functionName: "owner",
        });
      } catch (error) {
        console.error("QuestArcade sync: Contract verification failed:", error);
        throw new Error(`Contract not found at ${QUEST_ARCADE_ADDRESS}. Please verify the contract address and network.`);
      }

      const totalQuests = (await publicClient.readContract({
        address: QUEST_ARCADE_ADDRESS,
        abi: QUEST_ARCADE_ABI,
        functionName: "questCounter",
      })) as bigint;

      if (totalQuests === 0n) {
        // No quests yet, just set empty array and return early
        setQuests([]);
        setProgress([]);
        setLastUpdated(Date.now());
        return;
      }

      const questIds: bigint[] = [];
      for (let questId = 1n; questId <= totalQuests; questId += 1n) {
        questIds.push(questId);
      }

      const questDetails = await Promise.all(
        questIds.map(async (questId) => {
          try {
            const quest = (await publicClient.readContract({
              address: QUEST_ARCADE_ADDRESS,
              abi: QUEST_ARCADE_ABI,
              functionName: "getQuestDetails",
              args: [questId],
            })) as ContractQuest;
            
            return quest;
          } catch (error) {
            console.warn(`Unable to fetch quest ${questId.toString()}:`, error);
            return null;
          }
        })
      );

      const activeQuests = questDetails.filter((quest): quest is ContractQuest => quest !== null && quest.exists);
      const registryMetadataMap = new Map<string, RegistryQuest>();

      const mappedQuests = await Promise.all(
        activeQuests.map(async (quest) => {
          const questId = quest.id.toString();
          const baseReward = Number(formatUnits(quest.rewardAmount, STABLE_DECIMALS));
          const deadline = Number(quest.deadline);
          const hoursRemaining = calculateHoursRemaining(deadline);
          const isExpired = isQuestExpired(deadline);
          const verificationIndex = Number(quest.verificationType ?? 0);
          const rawProofMetadata = quest.proofMetadata?.trim() ?? "";
          const parsedProof = parseProofMetadata(rawProofMetadata);
          const questLocation =
            rawProofMetadata && !parsedProof ? rawProofMetadata : "On-chain quest";
          const questProof = mapQuestProof(quest.proofCID, parsedProof);
          const workerAddress = normalizeAddress(quest.worker);
          let statusLabel = mapQuestStatusLabel(Number(quest.status));

          const difficulty: Quest["difficulty"] =
            baseReward >= 50 ? "Hard" : baseReward >= 25 ? "Medium" : "Easy";

          // Determine if quest is expired and can be refunded
          const canRefund = isExpired && quest.rewardEscrowed && 
            (statusLabel === "active" || (statusLabel === "accepted" && !quest.proofCID));

          let questData: Quest = {
            id: questId,
            title: quest.title,
            description: quest.description,
            reward: baseReward,
            location: questLocation,
            difficulty,
            distance: "N/A",
            verification: VERIFICATION_LABELS[verificationIndex] ?? "Photo",
            timeLimitHours: hoursRemaining,
            tags: ["On-chain"],
            xp: Math.max(1, Math.round(baseReward * 10)),
            creator: quest.creator,
            worker: workerAddress,
            proof: questProof,
            onChainState: statusLabel,
            isExpired: canRefund,
            isEscrowFunded: quest.rewardEscrowed,
            rewardClaimed: quest.rewardClaimed,
          };

          if (QUEST_REGISTRY_ADDRESS) {
            try {
              const registryQuestRaw = (await publicClient.readContract({
                address: QUEST_REGISTRY_ADDRESS,
                abi: QUEST_REGISTRY_ABI,
                functionName: "getQuest",
                args: [quest.id],
              })) as RegistryQuestRaw;

              if (registryQuestRaw.exists) {
                const registryQuest = mapRegistryQuest(registryQuestRaw);
                registryMetadataMap.set(questId, registryQuest);

                const registryDeadline = registryQuest.deadline ? Number(registryQuest.deadline) : undefined;
                const registryIsExpired = registryDeadline ? isQuestExpired(registryDeadline) : false;
                const registryCanRefund = registryIsExpired && questData.isEscrowFunded && 
                  (questData.onChainState === "active" || (questData.onChainState === "accepted" && !quest.proofCID));

                questData = {
                  ...questData,
                  title: registryQuest.title ?? questData.title,
                  description: registryQuest.description ?? questData.description,
                  reward: registryQuest.rewardAmount ?? questData.reward,
                  timeLimitHours: calculateHoursRemaining(registryDeadline) ?? questData.timeLimitHours,
                  metadataUri: registryQuest.metadataUri ?? questData.metadataUri,
                  onChainState: questData.onChainState ?? mapRegistryStateLabel(registryQuest.state),
                  tags: combineTags(questData.tags, registryQuest.metadataUri ? "Registry" : undefined),
                  isExpired: registryCanRefund || questData.isExpired,
                };
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.debug("Quest registry lookup failed", questId, error);
            }
          }

          if (REWARDS_VAULT_ADDRESS) {
            try {
              const escrow = (await publicClient.readContract({
                address: REWARDS_VAULT_ADDRESS,
                abi: REWARDS_VAULT_ABI,
                functionName: "getEscrow",
                args: [quest.id],
              })) as RewardsEscrowRaw;

              if (escrow.exists) {
                const escrowAmount = Number(formatUnits(escrow.amount, STABLE_DECIMALS));
                const isEscrowFunded =
                  escrow.amount > 0n && escrow.exists && !escrow.released && !escrow.refunded;

                questData = {
                  ...questData,
                  reward: escrowAmount > 0 ? escrowAmount : questData.reward,
                  isEscrowFunded,
                  tags: combineTags(questData.tags, isEscrowFunded ? "Escrowed" : undefined),
                };
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.debug("Rewards vault lookup failed", questId, error);
            }
          }

          questData = {
            ...questData,
            xp: Math.max(1, Math.round((questData.reward ?? 0) * 10)),
          };

          return questData;
        })
      );

      setQuests(mappedQuests);

      // Calculate and add XP from verified and claimed quests
      if (address) {
        const { addXp, xp: currentXp } = useGameStore.getState();
        const userCompletedQuests = mappedQuests.filter(
          (quest) =>
            quest.worker?.toLowerCase() === address.toLowerCase() &&
            quest.onChainState === "verified" &&
            quest.rewardClaimed
        );
        
        // Calculate total XP from completed quests
        const totalXpFromQuests = userCompletedQuests.reduce((sum, quest) => sum + (quest.xp ?? 0), 0);
        
        // Only add XP if we haven't already added it (check if current XP is less than what we should have)
        // This prevents adding XP multiple times
        if (totalXpFromQuests > currentXp) {
          const xpToAdd = totalXpFromQuests - currentXp;
          if (xpToAdd > 0) {
            addXp(xpToAdd);
            if (process.env.NODE_ENV === "development") {
              console.log(`QuestArcade sync: Added ${xpToAdd} XP from ${userCompletedQuests.length} completed quests`);
            }
          }
        }
      }

      const progressRecords = activeQuests.map((quest) => {
        const questId = quest.id.toString();
        const statusIndex = Number(quest.status ?? 0);
        let status = STATUS_MAP[statusIndex] ?? "available";

        const registryState = registryMetadataMap.get(questId)?.state;
        if (registryState !== undefined) {
          status = REGISTRY_STATUS_MAP[registryState] ?? status;
        }

        return {
          questId,
          status,
          acceptedAt: undefined,
          submittedAt: undefined,
        };
      });

      setProgress(progressRecords);

      if (address && STABLE_TOKEN_ADDRESS) {
        try {
          const balanceRaw = await publicClient.readContract({
            address: STABLE_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          });
          const normalizedBalance = Number(formatUnits(balanceRaw as bigint, STABLE_DECIMALS));
          
          // Get current state to calculate local adjustments
          const currentState = useGameStore.getState();
          const currentLocalBalance = currentState.balance;
          let lastSyncedBalance = currentState.lastSyncedOnChainBalance;
          
          // If both local and last synced balances are zero and on-chain has a balance,
          // this is a fresh sync (e.g., after disconnect/reconnect) - trust on-chain balance.
          if (lastSyncedBalance === 0 && currentLocalBalance === 0) {
            setBalance(normalizedBalance, true, normalizedBalance);
            return;
          }

          // Handle first sync or uninitialized state when we already have a local balance
          if (lastSyncedBalance === 0 && currentLocalBalance > 0) {
            // Initialize last synced to current local balance as baseline
            lastSyncedBalance = currentLocalBalance;
          }
          
          // Calculate local adjustments (purchases made since last sync)
          // If local balance is less than last synced, user made purchases
          const localAdjustments = Math.max(0, lastSyncedBalance - currentLocalBalance);
          
          // Calculate new balance: on-chain balance minus local adjustments
          // This preserves local purchases while updating for new on-chain tokens
          let newBalance = Math.max(0, normalizedBalance - localAdjustments);
          
          // CRITICAL FIX: If local balance is lower than last synced (purchase was made),
          // and on-chain balance hasn't increased, ALWAYS keep the local balance
          // This prevents the balance from bouncing back after a purchase
          if (currentLocalBalance < lastSyncedBalance) {
            if (normalizedBalance <= lastSyncedBalance) {
              // No new tokens received - keep the reduced balance from purchase
              newBalance = currentLocalBalance;
            } else {
              // New tokens received - add them to the reduced balance
              const newTokens = normalizedBalance - lastSyncedBalance;
              newBalance = currentLocalBalance + newTokens;
            }
          }
          
          // Debug logging (only in development)
          if (process.env.NODE_ENV === "development") {
            console.log("[Balance Sync]", {
              onChain: normalizedBalance,
              local: currentLocalBalance,
              lastSynced: lastSyncedBalance,
              adjustments: localAdjustments,
              newBalance,
            });
          }
          
          // Update balance with on-chain sync flag, passing the actual on-chain balance
          setBalance(newBalance, true, normalizedBalance);
        } catch (error) {
          console.warn("Unable to fetch stable balance", error);
        }

        if (REPUTATION_ADDRESS) {
          try {
            const [profile, levelLabel] = (await publicClient.readContract({
              address: REPUTATION_ADDRESS,
              abi: REPUTATION_ABI,
              functionName: "getProfile",
              args: [address],
            })) as [{ xp: bigint; reputation: bigint }, string];

            const xp = Number(profile.xp);
            const normalizedLevel = normalizeLevelLabel(levelLabel);
            syncOnChainProfile({ xp, level: normalizedLevel });
          } catch (error) {
            // eslint-disable-next-line no-console
            console.debug("Unable to fetch reputation profile", error);
          }
        }
      }

      setLastUpdated(Date.now());
    } catch (error) {
      console.error("QuestArcade sync: Failed to sync state:", error);
      // Still set quests to empty array if there's an error to avoid stale data
      setQuests([]);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [address, publicClient, setBalance, setProgress, setQuests, syncOnChainProfile]);

  // Initial sync on mount or when dependencies change
  useEffect(() => {
    if (publicClient && QUEST_ARCADE_ADDRESS && !isSyncingRef.current) {
      void syncFromChain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, QUEST_ARCADE_ADDRESS, address]); // Only sync when these change

  // Watch for new blocks with throttling to prevent spam
  useEffect(() => {
    if (!publicClient || !QUEST_ARCADE_ADDRESS) {
      return;
    }

    let lastSyncTime = 0;
    const SYNC_THROTTLE_MS = 10000; // Only sync every 10 seconds max to prevent spam

    const unwatch = publicClient.watchBlockNumber({
      onBlockNumber: () => {
        const now = Date.now();
        // Throttle syncs to prevent spam
        if (now - lastSyncTime >= SYNC_THROTTLE_MS && !isSyncingRef.current) {
          lastSyncTime = now;
          void syncFromChain();
        }
      },
    });

    return () => {
      unwatch?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, QUEST_ARCADE_ADDRESS]); // Don't include syncFromChain to prevent loop

  const state = useMemo(
    () => ({
      lastUpdated,
      isSyncing,
      refresh: syncFromChain,
    }),
    [isSyncing, lastUpdated, syncFromChain]
  );

  return state;
}

