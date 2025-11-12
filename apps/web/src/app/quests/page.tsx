"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuestCard } from "@/components/quests/quest-card";
import { QuestFilters } from "@/components/quests/quest-filters";
import { QuestMap } from "@/components/quests/quest-map";
import { useGameStore } from "@/store/use-game-store";

export default function QuestsPage() {
  const { quests, acceptQuest } = useGameStore();
  const [locationQuery, setLocationQuery] = useState("");
  const [radius, setRadius] = useState(10);
  const [rewardRange, setRewardRange] = useState<[number, number]>([0, 100]);
  const [difficulty, setDifficulty] = useState<string[]>([]);
  const [verification, setVerification] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
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
    setRewardRange([0, 100]);
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
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Choose your next mission
          </h1>
          <p className="text-sm text-white/70">
            Discover quests funded by merchants, NGOs, and community partners. Filter by reward, location,
            or proof requirements.
          </p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search quests"
            className="rounded-full pl-12"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
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
            {filteredQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onAccept={acceptQuest} />
            ))}
            {filteredQuests.length === 0 && (
              <motion.div
                className="rounded-3xl border border-white/10 bg-background/60 p-10 text-center text-sm text-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No quests match your filters. Try widening your radius or adjusting difficulty.
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

