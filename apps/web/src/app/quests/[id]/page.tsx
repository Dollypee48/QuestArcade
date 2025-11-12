"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Trophy,
  Camera,
  Paperclip,
  Send,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useGameStore } from "@/store/use-game-store";

const proofOptions = [
  { value: "photo", label: "Photo evidence", icon: Camera },
  { value: "video", label: "Video submission", icon: Paperclip },
  { value: "gps", label: "GPS confirmation", icon: ShieldCheck },
];

export default function QuestDetailsPage() {
  const params = useParams<{ id: string }>();
  const { quests, acceptQuest, submitQuest } = useGameStore();
  const [selectedProof, setSelectedProof] = useState<string>("photo");
  const [note, setNote] = useState("");

  const quest = useMemo(() => quests.find((item) => item.id === params?.id), [quests, params?.id]);

  if (!quest) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center text-white/70">
        <h1 className="text-3xl font-semibold text-white">Quest not found</h1>
        <p className="text-sm">
          The quest you are looking for may have expired or is no longer available. Browse the quest
          directory to discover new missions.
        </p>
        <Link
          href="/quests"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm text-white transition hover:bg-white/15"
        >
          Back to quests
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const countdown = quest.timeLimitHours ? `${quest.timeLimitHours} hours remaining` : "No time limit";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/quests"
        className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quests
      </Link>

      <motion.section
        className="glass-card space-y-6 rounded-[32px] border border-white/10 bg-gradient-card p-8 shadow-glow"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="primary" className="border-0 px-3 py-1 text-[10px] uppercase tracking-wider">
                {quest?.difficulty}
              </Badge>
              <Badge variant="accent" className="text-[11px]">
                Reward cUSD {quest.reward}
              </Badge>
              <Badge variant="default" className="text-[11px]">
                +{quest.xp} XP
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white">{quest.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">{quest.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-widest text-white/60">Countdown</p>
            <p className="mt-2 text-lg font-semibold text-white">{countdown}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="h-4 w-4 text-secondary" />
              {quest.location}
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-white/50">
              Distance • {quest?.distance}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white/80">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Verification • {quest.verification}
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-white/50">Proof required</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="h-4 w-4 text-secondary" />
              Time requirement
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-white/50">
              {quest.timeLimitHours ? `${quest.timeLimitHours} hours` : "Flexible"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white/80">
              <Trophy className="h-4 w-4 text-secondary" />
              Season bonus
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-white/50">+10% streak bonus</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <h2 className="text-lg font-semibold text-white">Quest checklist</h2>
          <ul className="mt-3 space-y-2">
            <li>• Meet the partner on-site and verify the MiniPay wallet.</li>
            <li>• Help the partner accept at least one cUSD payment.</li>
            <li>• Record proof (photo/video) and capture GPS coordinates.</li>
            <li>• Submit the quest proof before the timer expires.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button className="rounded-full px-6" onClick={() => acceptQuest(quest!.id)}>
            Accept quest
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="rounded-full border border-white/20 px-6">
                Submit proof
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-md border-white/10 bg-gradient-secondary text-white"
            >
              <div className="flex h-full flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-semibold text-white">Submit quest proof</h3>
                  <p className="mt-2 text-sm text-white/70">
                    Upload your evidence. Files will be uploaded to IPFS before on-chain submission.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-white/50">Proof type</p>
                  <div className="flex flex-wrap gap-2">
                    {proofOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                          selectedProof === option.value
                            ? "border-secondary bg-secondary/20 text-white"
                            : "border-white/10 text-white/70"
                        }`}
                        onClick={() => setSelectedProof(option.value)}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-white/50">Upload evidence</p>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 py-10 text-center text-sm text-white/60 transition hover:border-white/40">
                    <Paperclip className="h-5 w-5" />
                    Drag & drop files or click to browse
                    <input type="file" className="hidden" multiple />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-white/50">Notes for reviewer</p>
                  <Textarea
                    rows={4}
                    placeholder="Add context for the verifier..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                  <Timer className="mb-2 h-4 w-4 text-secondary" />
                  Proof will be time-stamped and stored through QuestArcade’s IPFS gateway. Expect
                  review within 6 hours.
                </div>
                <div className="mt-auto flex gap-3">
                  <SheetClose asChild>
                    <Button
                      className="flex-1 rounded-full"
                      onClick={() => submitQuest(quest!.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit proof
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="ghost" className="flex-1 rounded-full border border-white/20">
                      Cancel
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.section>
    </div>
  );
}

