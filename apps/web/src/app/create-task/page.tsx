"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Wallet, Clock, Shield, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const proofTypes = ["Photo", "Video", "GPS", "Proof of Work"];
const difficulties = ["Easy", "Medium", "Hard", "Mythic"];

export default function CreateTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState(10);
  const [location, setLocation] = useState("");
  const [selectedProof, setSelectedProof] = useState("Photo");
  const [difficulty, setDifficulty] = useState("Medium");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 space-y-3">
        <Badge variant="primary" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create a new quest
        </Badge>
        <h1 className="text-4xl font-semibold text-white">Launch a mission on QuestArcade</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Post a quest, set the reward budget in cUSD, and let the QuestArcade community complete your task.
          Payments are powered by Celo MiniPay and every proof is stored on IPFS for transparency.
        </p>
      </div>

      <motion.form
        className="glass-card grid gap-6 rounded-[32px] border border-white/10 bg-gradient-card p-10 shadow-glow md:grid-cols-[1.3fr_0.7fr]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proof type</Label>
              <div className="flex flex-wrap gap-2">
                {proofTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedProof(type)}
                    className={`rounded-full border px-4 py-2 text-xs transition ${
                      selectedProof === type
                        ? "border-secondary bg-secondary/20 text-white"
                        : "border-white/10 text-white/60"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`rounded-full border px-4 py-2 text-xs transition ${
                      difficulty === level
                        ? "border-primary bg-primary/25 text-white"
                        : "border-white/10 text-white/60"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quest-deadline">Time limit (hours)</Label>
            <Input id="quest-deadline" type="number" min={1} placeholder="e.g. 24" />
          </div>
          <Button className="mt-4 rounded-full px-6 py-3 text-sm font-semibold">
            Publish quest on-chain
          </Button>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <h2 className="text-lg font-semibold text-white">Quest funding summary</h2>
            <div className="mt-4 space-y-3 text-xs text-white/60">
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
                Expected completion within chosen time window
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/65">
            <h2 className="text-lg font-semibold text-white">Location preview</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_2px,transparent_2px,transparent_10px)] p-6 text-center text-xs text-white/50">
              <MapPin className="mx-auto mb-3 h-6 w-6 text-secondary" />
              Integrate Mapbox or Google Maps via the SDK to render live maps and capture GPS coordinates.
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

