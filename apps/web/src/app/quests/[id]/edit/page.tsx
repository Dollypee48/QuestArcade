"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Clock, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuestActions } from "@/hooks/use-quest-actions";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";
import { useGameStore } from "@/store/use-game-store";
import { useAccount } from "wagmi";

export default function EditQuestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { address } = useAccount();
  const quests = useGameStore((state) => state.quests);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState(10);
  const [location, setLocation] = useState("");
  const [timeLimitHours, setTimeLimitHours] = useState<number | undefined>(24);
  const [formError, setFormError] = useState<string | null>(null);

  const { refresh } = useQuestArcadeSync();
  const { updateQuest, states } = useQuestActions({ onSettled: refresh });

  const quest = useMemo(() => quests.find((item) => item.id === params?.id), [quests, params?.id]);

  // Check if user is the quest creator
  const isCreator = useMemo(() => {
    if (!quest || !address) return false;
    return quest.creator?.toLowerCase() === address.toLowerCase();
  }, [quest, address]);

  // Initialize form with quest data
  useEffect(() => {
    if (quest) {
      setTitle(quest.title);
      setDescription(quest.description.replace(/\n\nLocation:.*$/, ""));
      setReward(quest.reward);
      setTimeLimitHours(quest.timeLimitHours);
      // Extract location if it exists in description
      const locationMatch = quest.description.match(/Location: (.+)$/);
      if (locationMatch) {
        setLocation(locationMatch[1]);
      } else if (quest.location && quest.location !== "On-chain quest") {
        setLocation(quest.location);
      }
    }
  }, [quest]);

  const isUpdating = states.update.status === "pending" && states.update.questId === quest?.id;
  const updateError = states.update.status === "error" && states.update.questId === quest?.id ? states.update.error : null;

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!Number.isFinite(reward) || reward <= 0) return false;
    return true;
  }, [title, description, reward]);

  // Redirect if quest not found or user is not creator
  useEffect(() => {
    if (quest === undefined) {
      // Quest might still be loading, wait a bit
      return;
    }
    if (!quest) {
      router.push("/quests");
      return;
    }
    if (!isCreator) {
      router.push(`/quests/${quest.id}`);
      return;
    }
  }, [quest, isCreator, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!canSubmit) {
      setFormError("Fill out the required fields before updating.");
      return;
    }

    if (!quest) {
      setFormError("Quest not found.");
      return;
    }

    try {
      const augmentedDescription = location
        ? `${description.trim()}\n\nLocation: ${location.trim()}`
        : description.trim();
      await updateQuest({
        questId: quest.id,
        title: title.trim(),
        description: augmentedDescription,
        reward,
        timeLimitHours,
      });

      router.push(`/quests/${quest.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Updating failed. Please try again.");
      }
    }
  };

  if (!quest || !isCreator) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center text-foreground/70">
        <h1 className="text-3xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm">You can only edit quests that you created.</p>
        <Link
          href={`/quests/${params?.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm text-foreground transition hover:bg-white/15"
        >
          Back to quest
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Link
        href={`/quests/${quest.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quest
      </Link>

      <div className="mb-10 space-y-3">
        <Badge variant="primary" className="gap-2">
          <Shield className="h-4 w-4" />
          Edit quest
        </Badge>
        <h1 className="text-4xl font-semibold text-foreground">Edit Quest</h1>
        <p className="max-w-2xl text-sm text-foreground/70">
          Update your quest details. You can only edit quests that are still open and haven&apos;t been accepted yet.
        </p>
      </div>

      <motion.form
        className="glass-card grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-glow md:grid-cols-[1.3fr_0.7fr]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="quest-title">Quest title</Label>
            <Input
              id="quest-title"
              placeholder="Onboard vendors to MiniPay"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quest-description">Description</Label>
            <Textarea
              id="quest-description"
              rows={6}
              placeholder="Describe the mission, deliverables, and expected outcomes..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quest-reward">Reward (cUSD)</Label>
              <Input
                id="quest-reward"
                type="number"
                min={1}
                step={1}
                value={reward}
                onChange={(event) => setReward(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quest-location">Location</Label>
              <Input
                id="quest-location"
                placeholder="City, venue, or coordinates"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quest-deadline">Time limit (hours)</Label>
            <Input
              id="quest-deadline"
              type="number"
              min={1}
              placeholder="e.g. 24"
              value={timeLimitHours ?? ""}
              onChange={(event) => {
                const numeric = Number(event.target.value);
                setTimeLimitHours(Number.isFinite(numeric) && numeric > 0 ? numeric : undefined);
              }}
            />
          </div>
          {formError && (
            <p className="text-sm text-destructive">
              {formError}
            </p>
          )}
          {updateError && (
            <p className="text-sm text-destructive">
              {updateError}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="rounded-full px-6 py-3 text-sm font-semibold"
              disabled={isUpdating || !canSubmit}
            >
              {isUpdating ? "Updating…" : "Update quest"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full px-6 py-3 text-sm font-semibold border border-white/20"
              onClick={() => router.push(`/quests/${quest.id}`)}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-foreground/70">
            <h2 className="text-lg font-semibold text-foreground">Update summary</h2>
            <div className="mt-4 space-y-3 text-xs text-foreground/60">
              <p className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-secondary" />
                Reward budget: {reward || 0} cUSD
              </p>
              <p className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-secondary" />
                IPFS storage and verification included
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                Time limit: {timeLimitHours ? `${timeLimitHours} hours` : "Not set"}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-foreground/65">
            <h2 className="text-lg font-semibold text-foreground">Edit restrictions</h2>
            <div className="mt-4 space-y-2 text-xs text-foreground/60">
              <p>• You can only edit quests that are still open</p>
              <p>• You cannot edit if a worker has already accepted</p>
              <p>• Changing the reward amount may require additional token approvals</p>
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

