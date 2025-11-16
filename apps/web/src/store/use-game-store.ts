import { create } from "zustand";
import { persist } from "zustand/middleware";

type LevelTier = "Rookie" | "Bronze" | "Silver" | "Gold" | "Legendary" | "Platinum" | "Mythic";

export type QuestProof = {
  cid?: string;
  url?: string;
  proofType?: string;
  note?: string;
  fileName?: string;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  reward: number;
  location: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Mythic";
  distance: string;
  verification: "Photo" | "Video" | "GPS" | "Proof of Work";
  timeLimitHours?: number;
  tags?: string[];
  xp: number;
  metadataUri?: string;
  onChainState?: "draft" | "active" | "accepted" | "submitted" | "verified" | "rejected" | "cancelled";
  isEscrowFunded?: boolean;
  rewardClaimed?: boolean;
  creator?: `0x${string}`;
  worker?: `0x${string}`;
  proof?: QuestProof;
};

type QuestProgress = {
  questId: string;
  status: "available" | "accepted" | "in-progress" | "submitted" | "completed";
  acceptedAt?: string;
  submittedAt?: string;
};

type StreakState = {
  current: number;
  best: number;
  lastCompleted?: string;
};

type RewardItem = {
  id: string;
  name: string;
  type: "booster" | "skin" | "badge" | "perk";
  description: string;
  cost: number;
  badgeColor?: string;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  avatar: string;
  level: LevelTier;
  xp: number;
  questsCompleted: number;
  earnings: number;
};

type GameState = {
  displayName: string;
  avatarUrl: string;
  level: LevelTier;
  xp: number;
  nextLevelXp: number;
  balance: number;
  lastSyncedOnChainBalance: number; // Track last synced on-chain balance to calculate local adjustments
  quests: Quest[];
  progress: QuestProgress[];
  streak: StreakState;
  rewards: RewardItem[];
  leaderboard: LeaderboardEntry[];
  notifications: { id: string; title: string; description: string; createdAt: string }[];
  claimedRewards: string[];
  updateProfile: (payload: Partial<Pick<GameState, "displayName" | "avatarUrl">>) => void;
  addXp: (amount: number) => void;
  syncOnChainProfile: (payload: { xp: number; level: LevelTier }) => void;
  acceptQuest: (questId: string) => void;
  submitQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  claimReward: (rewardId: string) => { success: boolean; error?: string };
  setQuests: (quests: Quest[]) => void;
  setProgress: (progress: QuestProgress[]) => void;
  setBalance: (balance: number, isOnChainSync?: boolean, onChainBalance?: number) => void;
};

const LEVEL_THRESHOLDS: Array<{ level: LevelTier; minXp: number }> = [
  { level: "Rookie", minXp: 0 },
  { level: "Bronze", minXp: 150 },
  { level: "Silver", minXp: 400 },
  { level: "Gold", minXp: 1000 },
  { level: "Legendary", minXp: 5000 },
  { level: "Platinum", minXp: 7000 },
  { level: "Mythic", minXp: 12000 },
];

const INITIAL_QUESTS: Quest[] = [];

const INITIAL_REWARDS: RewardItem[] = [
  // Boosters
  {
    id: "booster-2x-xp",
    name: "2x XP Booster",
    type: "booster",
    description: "Double your XP gain for the next 3 quests. Stack with other boosters for massive gains!",
    cost: 15,
    badgeColor: "#FF6B6B",
  },
  {
    id: "booster-1.5x-xp",
    name: "1.5x XP Booster",
    type: "booster",
    description: "Gain 50% more XP for the next 3 quests. Perfect for leveling up faster.",
    cost: 8,
    badgeColor: "#4ECDC4",
  },
  {
    id: "booster-streak-protector",
    name: "Streak Protector",
    type: "booster",
    description: "Protect your streak for 7 days. One free pass if you miss a day!",
    cost: 25,
    badgeColor: "#FFE66D",
  },
  // Skins
  {
    id: "skin-golden-warrior",
    name: "Golden Warrior Skin",
    type: "skin",
    description: "Unlock the exclusive Golden Warrior avatar skin. Stand out on the leaderboard!",
    cost: 50,
    badgeColor: "#FFD700",
  },
  {
    id: "skin-neon-arcade",
    name: "Neon Arcade Skin",
    type: "skin",
    description: "Retro-futuristic neon avatar skin with glowing effects. Perfect for night quests!",
    cost: 35,
    badgeColor: "#00FFFF",
  },
  {
    id: "skin-celestial",
    name: "Celestial Skin",
    type: "skin",
    description: "Cosmic-themed avatar with starry effects. Rare and majestic!",
    cost: 75,
    badgeColor: "#9B59B6",
  },
  // Badges
  {
    id: "badge-early-adopter",
    name: "Early Adopter Badge",
    type: "badge",
    description: "Show off your pioneer status with this exclusive early adopter badge.",
    cost: 20,
    badgeColor: "#3498DB",
  },
  {
    id: "badge-quest-master",
    name: "Quest Master Badge",
    type: "badge",
    description: "Prove your expertise with this prestigious quest master badge.",
    cost: 40,
    badgeColor: "#E74C3C",
  },
  {
    id: "badge-streak-legend",
    name: "Streak Legend Badge",
    type: "badge",
    description: "Unlock this badge to showcase your dedication to daily quests.",
    cost: 30,
    badgeColor: "#F39C12",
  },
  // Streak Perks
  {
    id: "perk-streak-multiplier",
    name: "7-Day Streak Multiplier",
    type: "perk",
    description: "Earn 2x rewards for maintaining a 7-day streak. Activates automatically!",
    cost: 45,
    badgeColor: "#1ABC9C",
  },
  {
    id: "perk-bonus-quest",
    name: "Bonus Quest Slot",
    type: "perk",
    description: "Unlock an extra active quest slot. Accept one more quest at a time!",
    cost: 60,
    badgeColor: "#E67E22",
  },
  {
    id: "perk-weekly-bonus",
    name: "Weekly Bonus Payout",
    type: "perk",
    description: "Get an extra 10% on all quest rewards for the next week.",
    cost: 55,
    badgeColor: "#16A085",
  },
  {
    id: "perk-instant-cashout",
    name: "Instant Cashout",
    type: "perk",
    description: "No waiting period for reward claiming. Instant access to your earnings!",
    cost: 80,
    badgeColor: "#27AE60",
  },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];

const getNextLevelXp = (xp: number): number => {
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    const threshold = LEVEL_THRESHOLDS[index];
    if (xp < threshold.minXp) {
      return threshold.minXp;
    }
  }
  return Math.max(xp + 1000, LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]?.minXp ?? xp + 1000);
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      displayName: "",
      avatarUrl: "/avatars/default.png",
      level: "Rookie",
      xp: 0,
      nextLevelXp: getNextLevelXp(0),
      balance: 0,
      lastSyncedOnChainBalance: 0,
      quests: INITIAL_QUESTS,
      progress: [],
      streak: {
        current: 0,
        best: 0,
        lastCompleted: undefined,
      },
      rewards: INITIAL_REWARDS,
      leaderboard: INITIAL_LEADERBOARD,
      notifications: [],
      claimedRewards: [],
      updateProfile: (payload) => set((state) => ({ ...state, ...payload })),
      addXp: (amount) =>
        set((state) => {
          const updatedXp = state.xp + amount;
          let updatedLevel = state.level;
          let nextLevelXp = state.nextLevelXp;
          let leveledUp = false;

          // Find the highest level threshold that the updated XP has reached
          let highestReachedLevel: LevelTier = "Rookie";
          let highestReachedIndex = 0;
          
          for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            const threshold = LEVEL_THRESHOLDS[i];
            if (updatedXp >= threshold.minXp) {
              highestReachedLevel = threshold.level;
              highestReachedIndex = i;
              break;
            }
          }

          // Check if level increased
          const tiers: LevelTier[] = ["Rookie", "Bronze", "Silver", "Gold", "Legendary", "Platinum", "Mythic"];
          const currentIndex = tiers.indexOf(state.level);
          const newIndex = tiers.indexOf(highestReachedLevel);
          
          if (newIndex > currentIndex) {
            updatedLevel = highestReachedLevel;
            leveledUp = true;
          }

          // Calculate next level XP from thresholds
          if (highestReachedIndex + 1 < LEVEL_THRESHOLDS.length) {
            nextLevelXp = LEVEL_THRESHOLDS[highestReachedIndex + 1].minXp;
          } else {
            // If at max level, keep increasing
            nextLevelXp = Math.max(updatedXp + 1000, LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].minXp + 1000);
          }

          return {
            xp: updatedXp,
            level: updatedLevel,
            nextLevelXp,
            notifications: [
              ...state.notifications,
              {
                id: `notif-${Date.now()}`,
                title: leveledUp ? "Level Up! 🎉" : "XP Boost",
                description: leveledUp 
                  ? `Congratulations! You've reached ${updatedLevel} level!`
                  : `+${amount} XP added to your journey.`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      syncOnChainProfile: ({ xp, level }) =>
        set((state) => {
          // Preserve local XP if it's higher than on-chain XP (user might have completed quests locally)
          // Only update if on-chain XP is higher or if local XP is 0
          const finalXp = state.xp > xp ? state.xp : xp;
          const finalLevel = state.xp > xp ? state.level : level;
          
          return {
            xp: finalXp,
            level: finalLevel,
            nextLevelXp: getNextLevelXp(finalXp),
            notifications: state.notifications,
          };
        }),
      acceptQuest: (questId) =>
        set((state) => ({
          progress: [
            ...state.progress.filter((item) => item.questId !== questId),
            { questId, status: "accepted", acceptedAt: new Date().toISOString() },
          ],
        })),
      submitQuest: (questId) =>
        set((state) => ({
          progress: state.progress.map((item) =>
            item.questId === questId
              ? { ...item, status: "submitted", submittedAt: new Date().toISOString() }
              : item
          ),
        })),
      completeQuest: (questId) =>
        set((state) => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          let newStreak = { ...state.streak };
          
          if (state.streak.lastCompleted) {
            const lastCompletedDate = new Date(state.streak.lastCompleted);
            const lastCompletedDay = new Date(
              lastCompletedDate.getFullYear(),
              lastCompletedDate.getMonth(),
              lastCompletedDate.getDate()
            );
            
            const daysDiff = Math.floor(
              (today.getTime() - lastCompletedDay.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysDiff === 0) {
              // Same day - don't increment streak
              newStreak = state.streak;
            } else if (daysDiff === 1) {
              // Consecutive day - increment streak
              newStreak = {
                current: state.streak.current + 1,
                best: Math.max(state.streak.current + 1, state.streak.best),
                lastCompleted: now.toISOString(),
              };
            } else {
              // More than 1 day passed - reset streak
              newStreak = {
                current: 1,
                best: state.streak.best,
                lastCompleted: now.toISOString(),
              };
            }
          } else {
            // First completion - start streak
            newStreak = {
              current: 1,
              best: 1,
              lastCompleted: now.toISOString(),
            };
          }
          
          return {
            balance:
              state.balance +
              (state.quests.find((quest) => quest.id === questId)?.reward ?? 0),
            progress: state.progress.map((item) =>
              item.questId === questId ? { ...item, status: "completed" } : item
            ),
            streak: newStreak,
          };
        }),
      claimReward: (rewardId) => {
        try {
          // Validate input
          if (!rewardId || typeof rewardId !== "string" || rewardId.trim() === "") {
            return { success: false, error: "Invalid reward ID" };
          }

          const state = useGameStore.getState();
          
          // Validate rewards array exists
          if (!state.rewards || !Array.isArray(state.rewards)) {
            return { success: false, error: "Rewards system not initialized" };
          }

          const reward = state.rewards.find((r) => r?.id === rewardId);
          
          if (!reward) {
            return { success: false, error: "Reward not found" };
          }

          // Validate reward properties
          if (typeof reward.cost !== "number" || reward.cost < 0) {
            return { success: false, error: "Invalid reward cost" };
          }
          
          // Check if already claimed
          if (!state.claimedRewards) {
            // Initialize if not exists
            set((prevState) => ({ ...prevState, claimedRewards: [] }));
            return { success: false, error: "Claimed rewards not initialized. Please try again." };
          }

          if (state.claimedRewards.includes(rewardId)) {
            return { success: false, error: "Reward already claimed" };
          }
          
          // Validate balance
          if (typeof state.balance !== "number" || isNaN(state.balance)) {
            return { success: false, error: "Invalid balance" };
          }

          // Check if user has enough balance
          if (state.balance < reward.cost) {
            return { 
              success: false, 
              error: `Insufficient balance. You need cUSD ${reward.cost.toFixed(2)} but have cUSD ${state.balance.toFixed(2)}` 
            };
          }
          
          // Claim the reward
          set((prevState) => {
            const newBalance = prevState.balance - reward.cost;
            
            // Ensure balance doesn't go negative (safety check)
            if (newBalance < 0) {
              return prevState; // Don't update if balance would go negative
            }

            // When making a purchase, ensure lastSyncedOnChainBalance is set if it's 0
            // This helps the sync logic correctly track local adjustments
            const updatedLastSynced = prevState.lastSyncedOnChainBalance === 0 
              ? prevState.balance // Use current balance as baseline if not synced yet
              : prevState.lastSyncedOnChainBalance;

            return {
              ...prevState,
              balance: newBalance,
              lastSyncedOnChainBalance: updatedLastSynced, // Preserve the last synced balance
              claimedRewards: [...(prevState.claimedRewards || []), rewardId],
              notifications: [
                ...(prevState.notifications || []).slice(-49), // Keep last 50 notifications
                {
                  id: `reward-${rewardId}-${Date.now()}-${Math.random()}`,
                  title: "Reward Claimed!",
                  description: `Successfully purchased ${reward.name}! ${reward.type === "booster" ? "It will activate on your next quest." : reward.type === "badge" ? "Check your profile to see your new badge." : "Check your profile to use it."}`,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          });
          
          return { success: true };
        } catch (error) {
          console.error("Error claiming reward:", error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred while claiming the reward" 
          };
        }
      },
      setQuests: (quests) =>
        set((state) => ({
          quests,
          progress: state.progress.filter((item) => quests.some((quest) => quest.id === item.questId)),
        })),
      setProgress: (progress) => set(() => ({ progress })),
      setBalance: (balance, isOnChainSync = false, onChainBalance) => 
        set((state) => {
          if (isOnChainSync && onChainBalance !== undefined) {
            // When syncing from chain, update balance and store the actual on-chain balance
            return { 
              balance, 
              lastSyncedOnChainBalance: onChainBalance 
            };
          }
          // Local balance updates (from purchases, etc.) - preserve the adjustment
          return { balance };
        }),
    }),
    {
      name: "quest-arcade-store",
      partialize: (state) => ({
        displayName: state.displayName,
        avatarUrl: state.avatarUrl,
        level: state.level,
        xp: state.xp,
        nextLevelXp: state.nextLevelXp,
        balance: state.balance,
        lastSyncedOnChainBalance: state.lastSyncedOnChainBalance,
        progress: state.progress,
        quests: state.quests,
        streak: state.streak,
        claimedRewards: state.claimedRewards,
      }),
    }
  )
);

export type { LeaderboardEntry, LevelTier, QuestProgress, QuestProof, RewardItem, StreakState };

