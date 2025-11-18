"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestCard } from "@/components/quests/quest-card";
import { QuestFilters } from "@/components/quests/quest-filters";
import { QuestMap } from "@/components/quests/quest-map";
import { useQuestActions } from "@/hooks/use-quest-actions";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";
import { useGameStore } from "@/store/use-game-store";

export default function QuestsPage() {
  const quests = useGameStore((state) => state.quests);
  const progress = useGameStore((state) => state.progress);
  const { address } = useAccount();
  const { refresh, isSyncing } = useQuestArcadeSync();
  const { acceptQuest, states } = useQuestActions({ onSettled: refresh });

  const acceptingId =
    states.accept.status === "pending" || states.accept.status === "success"
      ? states.accept.questId
      : undefined;
  const [locationQuery, setLocationQuery] = useState("");
  const [radius, setRadius] = useState(10);
const DEFAULT_REWARD_MAX = 100_000;
const [rewardRange, setRewardRange] = useState<[number, number]>([0, DEFAULT_REWARD_MAX]);
  const [difficulty, setDifficulty] = useState<string[]>([]);
  const [verification, setVerification] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      // Only show Open/Available quests in the main listing (not completed/verified/rejected)
      const isAvailable =
        !quest.onChainState ||
        quest.onChainState === "active" ||
        quest.onChainState === "draft" ||
        (quest.onChainState !== "verified" &&
          quest.onChainState !== "rejected" &&
          quest.onChainState !== "cancelled");

      const matchesSearch =
        searchTerm.length === 0 ||
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        locationQuery.length === 0 ||
        quest.location.toLowerCase().includes(locationQuery.toLowerCase());

      const matchesReward =
        quest.reward >= rewardRange[0] && quest.reward <= rewardRange[1];

      const matchesDifficulty =
        difficulty.length === 0 || difficulty.includes(quest.difficulty);

      const matchesVerification =
        verification.length === 0 || verification.includes(quest.verification);

      return (
        isAvailable &&
        matchesSearch &&
        matchesLocation &&
        matchesReward &&
        matchesDifficulty &&
        matchesVerification
      );
    });
  }, [quests, searchTerm, locationQuery, rewardRange, difficulty, verification]);

  const toggleFilter = (type: "difficulty" | "verification", value: string) => {
    if (type === "difficulty") {
      setDifficulty((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    } else {
      setVerification((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    }
  };

  const resetFilters = () => {
    setLocationQuery("");
    setRadius(10);
    setRewardRange([0, DEFAULT_REWARD_MAX]);
    setDifficulty([]);
    setVerification([]);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge variant="accent" className="gap-2">
            <Filter className="h-4 w-4" />
            Quest directory
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            Choose your next mission
          </h1>
          <p className="text-sm text-foreground/70">
            Discover quests funded by merchants, NGOs, and community partners. Filter by reward, location,
            or proof requirements.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Search quests"
              className="rounded-full pl-12"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="rounded-full border-white/20"
            onClick={() => refresh()}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <QuestFilters
            location={locationQuery}
            radius={radius}
            rewardRange={rewardRange}
            difficulty={difficulty}
            verification={verification}
            onLocationChange={setLocationQuery}
            onRadiusChange={setRadius}
            onRewardChange={setRewardRange}
            onToggleFilter={toggleFilter}
            onReset={resetFilters}
          />
          <div className="space-y-4">
            {filteredQuests.length > 0 && (
              <div className="text-xs text-foreground/50">
                Showing {filteredQuests.length} of {quests.length} quests
              </div>
            )}
            {filteredQuests.map((quest) => {
              const isCreator = address && quest.creator?.toLowerCase() === address.toLowerCase();
              const questProgress = progress.find((item) => item.questId === quest.id);
              const hasAcceptedQuest = 
                quest.worker?.toLowerCase() === address?.toLowerCase() ||
                questProgress?.status === "accepted" ||
                questProgress?.status === "in-progress" ||
                questProgress?.status === "submitted" ||
                quest.onChainState === "accepted" ||
                quest.onChainState === "submitted";
              
              return (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onAccept={isCreator || hasAcceptedQuest ? undefined : () => acceptQuest(quest.id)}
                  isAccepting={acceptingId === quest.id && states.accept.status === "pending"}
                  showAcceptButton={!isCreator}
                  hasAcceptedQuest={hasAcceptedQuest}
                />
              );
            })}
            {filteredQuests.length === 0 && quests.length === 0 && (
              <motion.div
                className="rounded-3xl border border-white/10 bg-background/60 p-10 text-center text-sm text-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="mb-2">No quests found.</p>
                <p className="text-xs">Quests will appear here once they are published on-chain.</p>
              </motion.div>
            )}
            {filteredQuests.length === 0 && quests.length > 0 && (
              <motion.div
                className="rounded-3xl border border-white/10 bg-background/60 p-10 text-center text-sm text-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No quests match your filters. Try widening your search or adjusting filters.
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Reset all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        <QuestMap
          markers={filteredQuests.map((quest) => ({
            id: quest.id,
            title: quest.title,
            location: quest.location,
          }))}
        />
      </div>
    </div>
  );
}

