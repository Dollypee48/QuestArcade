import { create } from "zustand";
import { persist } from "zustand/middleware";

type LevelTier = "Rookie" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Mythic";

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
  quests: Quest[];
  progress: QuestProgress[];
  streak: StreakState;
  rewards: RewardItem[];
  leaderboard: LeaderboardEntry[];
  notifications: { id: string; title: string; description: string; createdAt: string }[];
  updateProfile: (payload: Partial<Pick<GameState, "displayName" | "avatarUrl">>) => void;
  addXp: (amount: number) => void;
  acceptQuest: (questId: string) => void;
  submitQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  claimReward: (rewardId: string) => void;
};

const INITIAL_QUESTS: Quest[] = [
  {
    id: "quest-cafe-01",
    title: "Share Celo at a Community Cafe",
    description: "Introduce a local vendor to MiniPay and help them set up their first cUSD wallet.",
    reward: 15,
    location: "Nairobi CBD, Kenya",
    difficulty: "Medium",
    distance: "1.2 km",
    verification: "Photo",
    timeLimitHours: 24,
    tags: ["Community", "Merchant", "Onboarding"],
    xp: 180,
  },
  {
    id: "quest-campus-02",
    title: "Campus Quest: Onboard 10 Students",
    description: "Host a quick workshop for students and help 10 new users claim their first quest reward.",
    reward: 35,
    location: "University of Lagos, Nigeria",
    difficulty: "Hard",
    distance: "4.5 km",
    verification: "Video",
    timeLimitHours: 12,
    tags: ["Education", "Event"],
    xp: 420,
  },
  {
    id: "quest-cleanup-03",
    title: "MiniPay Cleanup Mission",
    description: "Lead a cleanup squad, collect proof-of-impact photos, and split the earnings with your crew.",
    reward: 25,
    location: "Cape Coast, Ghana",
    difficulty: "Medium",
    distance: "3.8 km",
    verification: "Proof of Work",
    timeLimitHours: 48,
    tags: ["Impact", "Team"],
    xp: 260,
  },
  {
    id: "quest-delivery-04",
    title: "Deliver Essentials with cUSD",
    description: "Fulfill three deliveries using cUSD payment, and collect the recipient signatures via MiniPay.",
    reward: 18,
    location: "Attessia, Côte d’Ivoire",
    difficulty: "Easy",
    distance: "2.1 km",
    verification: "GPS",
    tags: ["Logistics"],
    xp: 140,
  },
];

const INITIAL_REWARDS: RewardItem[] = [
  {
    id: "reward-avatar-aurora",
    name: "Aurora Phoenix Skin",
    type: "skin",
    description: "Radiant avatar aura infused with the QuestArcade gradient.",
    cost: 55,
    badgeColor: "#FF5EA9",
  },
  {
    id: "reward-booster-xp",
    name: "Double XP Booster",
    type: "booster",
    description: "Double your XP earnings for the next 3 quests.",
    cost: 40,
    badgeColor: "#7C3AED",
  },
  {
    id: "reward-badge-streak",
    name: "Streak Shield",
    type: "badge",
    description: "Protect your streak from resetting once per month.",
    cost: 28,
    badgeColor: "#2DD6B5",
  },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "leader-aya",
    name: "Aya N.",
    avatar: "/avatars/aya.png",
    level: "Mythic",
    xp: 13890,
    questsCompleted: 128,
    earnings: 2150,
  },
  {
    id: "leader-kofi",
    name: "Kofi T.",
    avatar: "/avatars/kofi.png",
    level: "Platinum",
    xp: 9860,
    questsCompleted: 94,
    earnings: 1655,
  },
  {
    id: "leader-amina",
    name: "Amina R.",
    avatar: "/avatars/amina.png",
    level: "Gold",
    xp: 7640,
    questsCompleted: 78,
    earnings: 1240,
  },
  {
    id: "leader-emeka",
    name: "Emeka O.",
    avatar: "/avatars/emeka.png",
    level: "Gold",
    xp: 7025,
    questsCompleted: 74,
    earnings: 1180,
  },
];

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      displayName: "Quest Pioneer",
      avatarUrl: "/avatars/default.png",
      level: "Bronze",
      xp: 980,
      nextLevelXp: 1500,
      balance: 142.37,
      quests: INITIAL_QUESTS,
      progress: [],
      streak: {
        current: 4,
        best: 12,
        lastCompleted: new Date().toISOString(),
      },
      rewards: INITIAL_REWARDS,
      leaderboard: INITIAL_LEADERBOARD,
      notifications: [],
      updateProfile: (payload) => set((state) => ({ ...state, ...payload })),
      addXp: (amount) =>
        set((state) => {
          const updatedXp = state.xp + amount;
          let updatedLevel = state.level;
          let nextLevelXp = state.nextLevelXp;

          if (updatedXp >= state.nextLevelXp) {
            const tiers: LevelTier[] = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Mythic"];
            const currentIndex = tiers.indexOf(state.level);
            const newIndex = Math.min(currentIndex + 1, tiers.length - 1);
            updatedLevel = tiers[newIndex];
            nextLevelXp = Math.round(state.nextLevelXp * 1.4);
          }

          return {
            xp: updatedXp,
            level: updatedLevel,
            nextLevelXp,
            notifications: [
              ...state.notifications,
              {
                id: `notif-${Date.now()}`,
                title: "XP Boost",
                description: `+${amount} XP added to your journey.`,
                createdAt: new Date().toISOString(),
              },
            ],
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
        set((state) => ({
          balance:
            state.balance +
            (state.quests.find((quest) => quest.id === questId)?.reward ?? 0),
          progress: state.progress.map((item) =>
            item.questId === questId ? { ...item, status: "completed" } : item
          ),
          streak: {
            current: state.streak.current + 1,
            best: Math.max(state.streak.current + 1, state.streak.best),
            lastCompleted: new Date().toISOString(),
          },
        })),
      claimReward: (rewardId) =>
        set((state) => ({
          rewards: state.rewards.filter((reward) => reward.id !== rewardId),
          notifications: [
            ...state.notifications,
            {
              id: `reward-${rewardId}`,
              title: "Reward Claimed",
              description: "Your new collectible is waiting in the arcade!",
              createdAt: new Date().toISOString(),
            },
          ],
        })),
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
        progress: state.progress,
        streak: state.streak,
      }),
    }
  )
);

export type { LeaderboardEntry, QuestProgress, RewardItem, StreakState };

