"use client";

import { useMemo, useState, useEffect } from "react";
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
  Edit,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/store/use-game-store";
import { useQuestActions } from "@/hooks/use-quest-actions";
import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";
import { uploadToPinata } from "@/lib/ipfs";

const proofOptions = [
  { value: "photo", label: "Photo evidence", icon: Camera },
  { value: "video", label: "Video submission", icon: Paperclip },
  { value: "gps", label: "GPS confirmation", icon: ShieldCheck },
];

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg)$/i;
const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

const formatProofTypeLabel = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.replace(/[_-]/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function QuestDetailsPage() {
  const params = useParams<{ id: string }>();
  const { address } = useAccount();
  const quests = useGameStore((state) => state.quests);
  const [selectedProof, setSelectedProof] = useState<string>("photo");
  const [note, setNote] = useState("");
  const [proofCid, setProofCid] = useState("");
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [currentVideoGatewayIndex, setCurrentVideoGatewayIndex] = useState(0);

  const { refresh } = useQuestArcadeSync();
  const { acceptQuest, submitProof, verifyQuest, claimReward, states } = useQuestActions({ onSettled: refresh });

  const quest = useMemo(() => quests.find((item) => item.id === params?.id), [quests, params?.id]);
  const progress = useGameStore((state) => state.progress);
  const questProgress = useMemo(
    () => progress.find((item) => item.questId === quest?.id),
    [progress, quest?.id]
  );

  const isAccepting = states.accept.status === "pending" && states.accept.questId === quest?.id;
  const isSubmitting = states.submit.status === "pending" && states.submit.questId === quest?.id;
  const isVerifying = states.verify?.status === "pending" && states.verify.questId === quest?.id;
  const isClaiming = states.claim?.status === "pending" && states.claim.questId === quest?.id;
  const submitFeedback =
    states.submit.status === "error" && states.submit.questId === quest?.id ? states.submit.error : submitError;

  const hasAcceptedQuest = useMemo(() => {
    if (!questProgress) {
      return false;
    }

    return ["accepted", "in-progress", "submitted", "completed"].includes(questProgress.status);
  }, [questProgress]);

  const hasSubmittedProof = useMemo(() => {
    if (!questProgress) return false;
    return ["submitted", "completed"].includes(questProgress.status) || quest.onChainState === "submitted";
  }, [questProgress, quest?.onChainState]);

  // Check if current user is the quest creator and quest is still editable (Open status)
  const isCreator = useMemo(() => {
    if (!quest || !address) return false;
    return quest.creator?.toLowerCase() === address.toLowerCase();
  }, [quest, address]);

  const isWorker = useMemo(() => {
    if (!quest?.worker || !address) return false;
    return quest.worker.toLowerCase() === address.toLowerCase();
  }, [quest?.worker, address]);

  const canEdit = useMemo(() => {
    if (!isCreator || !quest) return false;
    // Can only edit if quest hasn't been accepted yet
    // Check both onChainState and progress status
    const hasBeenAccepted =
      questProgress?.status === "accepted" ||
      questProgress?.status === "submitted" ||
      questProgress?.status === "completed" ||
      quest.onChainState === "submitted" ||
      quest.onChainState === "verified";
    
    return !hasBeenAccepted && (quest.onChainState === "active" || quest.onChainState === "draft" || !quest.onChainState);
  }, [isCreator, quest, questProgress]);

  // Reset error states and gateway index when quest or proof changes
  useEffect(() => {
    setVideoError(false);
    setImageError(false);
    setCurrentVideoGatewayIndex(0);
    setVideoLoading(true);
    setVideoReady(false);
  }, [quest?.id, quest?.proof?.url, quest?.proof?.cid]);

  // Get alternative IPFS gateway URLs for video fallback
  const getVideoGateways = useMemo(() => {
    if (!quest?.proof?.cid) return [];
    const cid = quest.proof.cid.replace(/^ipfs:\/\//, "");
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];
    return gateways;
  }, [quest?.proof?.cid]);

  const videoUrl = useMemo(() => {
    if (!quest?.proof?.url) return undefined;
    // Always use the primary URL first
    if (currentVideoGatewayIndex === 0) {
      return quest.proof.url;
    }
    // Try alternative gateways if primary failed
    if (getVideoGateways.length > 0 && currentVideoGatewayIndex > 0 && currentVideoGatewayIndex < getVideoGateways.length) {
      return getVideoGateways[currentVideoGatewayIndex];
    }
    return quest.proof.url;
  }, [quest?.proof?.url, getVideoGateways, currentVideoGatewayIndex]);

  const proofMediaType = useMemo(() => {
    if (!quest?.proof) return undefined;
    const normalizedType = quest.proof.proofType?.toLowerCase();
    if (normalizedType === "video") {
      return "video";
    }
    if (normalizedType === "photo" || normalizedType === "image") {
      return "image";
    }
    const url = quest.proof.url ?? "";
    if (url && VIDEO_EXT_REGEX.test(url)) {
      return "video";
    }
    if (url && IMAGE_EXT_REGEX.test(url)) {
      return "image";
    }
    return undefined;
  }, [quest?.proof]);
  const proofLinkHref = quest?.proof?.url ?? quest?.proof?.cid;
  const proofExists = Boolean(quest?.proof?.cid || quest?.proof?.note);
  const showProofPreview = (isWorker || isCreator) && proofExists;
  const proofSectionTitle = isCreator ? "Hunter submission" : "Your submitted proof";
  const proofSectionDescription = isCreator
    ? "Review the evidence submitted before approving or rejecting."
    : "Preview the evidence you shared with the creator.";
  const canReviewSubmission = isCreator && quest?.onChainState === "submitted" && proofExists;
  const canClaimReward = isWorker && quest?.onChainState === "verified" && !quest?.rewardClaimed;
  const workerLabel = quest?.worker ? `${quest.worker.slice(0, 6)}…${quest.worker.slice(-4)}` : null;
  const isCompleted = quest?.onChainState === "verified" && quest?.rewardClaimed;
  const isRejected = quest?.onChainState === "rejected";
  const isVerified = quest?.onChainState === "verified";
  const countdown = quest?.timeLimitHours ? `${quest.timeLimitHours} hours remaining` : "No time limit";
  const proofTypeLabel = formatProofTypeLabel(quest?.proof?.proofType);
  
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
            {(isCompleted || isRejected || isVerified) && (
              <div className="mt-3">
                <Badge
                  variant={isCompleted || (isVerified && !quest.rewardClaimed) ? "accent" : isRejected ? "destructive" : "outline"}
                  className="text-[10px] uppercase tracking-widest"
                >
                  {isCompleted ? "Completed" : isVerified ? "Verified" : isRejected ? "Rejected" : quest.onChainState}
                </Badge>
                {isCompleted && (
                  <p className="mt-2 text-xs text-white/60">
                    This quest has been completed and rewards have been claimed. This is a read-only view of the quest history.
                  </p>
                )}
                {isRejected && (
                  <p className="mt-2 text-xs text-white/60">
                    This quest submission was rejected. This is a read-only view of the quest history.
                  </p>
                )}
              </div>
            )}
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
          {canEdit && (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 px-6"
            >
              <Link href={`/quests/${quest.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit quest
              </Link>
            </Button>
          )}
          {!isCreator && (
            <Button
              className="rounded-full px-6"
              onClick={() => acceptQuest(quest!.id)}
              disabled={isAccepting || hasAcceptedQuest}
            >
              {hasAcceptedQuest ? "Quest accepted" : isAccepting ? "Accepting…" : "Accept quest"}
            </Button>
          )}
          {canClaimReward && (
            <Button
              variant="secondary"
              className="rounded-full border border-white/20 px-6"
              onClick={() => claimReward(quest!.id)}
              disabled={isClaiming}
            >
              {isClaiming ? "Claiming…" : "Claim reward"}
            </Button>
          )}
          <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full border border-white/20 px-6"
                disabled={!hasAcceptedQuest || hasSubmittedProof}
              >
                {hasSubmittedProof ? "Proof submitted" : "Submit proof"}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-xl border-white/10 bg-gradient-secondary text-white max-h-[85vh] overflow-y-auto">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl text-white">Submit quest proof</DialogTitle>
                <p className="mt-2 text-sm text-white/70">
                  Upload your evidence. Files will be uploaded to IPFS before on-chain submission.
                </p>
              </DialogHeader>
              <div className="flex h-full flex-col gap-6">
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
                    {isUploading
                      ? "Uploading to IPFS…"
                      : uploadedFileName
                        ? `Uploaded: ${uploadedFileName}`
                        : "Drag & drop files or click to browse"}
                    <input
                      type="file"
                      className="hidden"
                      multiple={false}
                      accept="image/*,video/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        setSubmitError(null);
                        setIsUploading(true);
                        setUploadedFileName(null);

                        try {
                          const { cid } = await uploadToPinata(file);
                          setProofCid(`ipfs://${cid}`);
                          setUploadedFileName(file.name);
                        } catch (error) {
                          if (error instanceof Error) {
                            setSubmitError(error.message);
                          } else {
                            setSubmitError("Failed to upload file. Please try again.");
                          }
                        } finally {
                          setIsUploading(false);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-white/50">Proof reference (CID or URL)</p>
                  <Input
                    placeholder="ipfs://..."
                    value={proofCid}
                    onChange={(event) => setProofCid(event.target.value)}
                    disabled={isUploading}
                  />
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
                {submitFeedback && (
                  <p className="text-sm text-destructive">
                    {submitFeedback}
                  </p>
                )}
                <DialogFooter className="mt-auto">
                  <DialogClose asChild>
                    <Button variant="ghost" className="flex-1 rounded-full border border-white/20">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    className="flex-1 rounded-full"
                    onClick={async () => {
                      setSubmitError(null);
                      try {
                        if (!proofCid.trim()) {
                          throw new Error("Upload a proof file or provide a CID.");
                        }
                        await submitProof({
                          questId: quest!.id,
                          proofCid: proofCid.trim(),
                          metadataCid: JSON.stringify({
                            proofType: selectedProof,
                            note: note.trim(),
                            fileName: uploadedFileName ?? undefined,
                          }),
                        });
                        setIsProofModalOpen(false);
                        setProofCid("");
                        setNote("");
                        setUploadedFileName(null);
                      } catch (error) {
                        if (error instanceof Error) {
                          setSubmitError(error.message);
                        } else {
                          setSubmitError("Failed to submit proof. Try again.");
                        }
                      }
                    }}
                    disabled={isSubmitting || isUploading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting…" : "Submit proof"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {showProofPreview && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">{proofSectionTitle}</p>
                <p className="text-base text-white">{proofSectionDescription}</p>
                {isCreator && quest.worker && (
                  <p className="mt-2 text-xs text-white/60">
                    Submitted by <span className="font-mono text-white">{workerLabel}</span>
                  </p>
                )}
              </div>
              <Badge variant="outline" className="border-secondary/40 text-secondary">
                {proofTypeLabel ?? "Submitted"}
              </Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">Proof reference</p>
                  {proofLinkHref ? (
                    <a
                      href={proofLinkHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-secondary transition hover:text-secondary/80"
                    >
                      {quest?.proof?.fileName ?? quest?.proof?.cid ?? "Open submission"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-white/60">Reference unavailable.</p>
                  )}
                  {quest?.proof?.cid && (
                    <p className="mt-2 break-all text-[11px] text-white/40">CID: {quest.proof.cid}</p>
                  )}
                </div>
                {quest?.proof?.note && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-widest text-white/50">Notes you shared</p>
                    <p className="mt-2 text-sm text-white/80">{quest.proof.note}</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                {proofMediaType === "image" && quest?.proof?.url && !imageError ? (
                  <img
                    src={quest.proof.url}
                    alt="Submitted proof preview"
                    className="h-64 w-full rounded-xl object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : proofMediaType === "image" && imageError ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 text-center text-white/60 p-4">
                    <FileText className="h-10 w-10 text-secondary" />
                    <p className="text-sm">Image failed to load.</p>
                    {quest.proof?.url && (
                      <a
                        href={quest.proof.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 text-xs text-secondary hover:underline"
                      >
                        Open image in new tab
                      </a>
                    )}
                  </div>
                ) : proofMediaType === "video" && videoUrl && !videoError ? (
                  <div className="relative">
                    {videoLoading && !videoReady && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/80">
                        <div className="text-center text-white/70">
                          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-secondary" />
                          <p className="text-xs">Loading video from IPFS...</p>
                          {currentVideoGatewayIndex > 0 && (
                            <p className="mt-1 text-xs text-white/50">Trying gateway {currentVideoGatewayIndex + 1}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <video
                      ref={(video) => {
                        if (video && videoReady && video.videoWidth === 0 && video.videoHeight === 0) {
                          console.warn("Video element exists but has no dimensions - possible codec issue or empty file");
                        }
                      }}
                      key={`video-${videoUrl}-${currentVideoGatewayIndex}`}
                      controls
                      playsInline
                      preload="auto"
                      muted={false}
                      src={videoUrl}
                      className="h-64 w-full rounded-xl border border-white/10 bg-black"
                      style={{ backgroundColor: "#000" }}
                      onError={(e) => {
                        console.error("Video error:", e);
                        const videoEl = e.currentTarget;
                        console.error("Video error details:", {
                          networkState: videoEl.networkState,
                          readyState: videoEl.readyState,
                          error: videoEl.error,
                          src: videoUrl,
                        });
                        setVideoLoading(false);
                        // Try next gateway if available
                        if (currentVideoGatewayIndex < getVideoGateways.length - 1) {
                          setCurrentVideoGatewayIndex((prev) => prev + 1);
                        } else {
                          setVideoError(true);
                        }
                      }}
                      onLoadStart={() => {
                        console.log("Video load start:", videoUrl);
                        setVideoLoading(true);
                        setVideoReady(false);
                      }}
                      onLoadedMetadata={(e) => {
                        const videoEl = e.currentTarget;
                        console.log("Video metadata loaded:", {
                          duration: videoEl.duration,
                          videoWidth: videoEl.videoWidth,
                          videoHeight: videoEl.videoHeight,
                          readyState: videoEl.readyState,
                        });
                        setVideoLoading(false);
                        // If video has dimensions, it likely has content
                        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                          setVideoReady(true);
                        }
                      }}
                      onLoadedData={(e) => {
                        const videoEl = e.currentTarget;
                        console.log("Video data loaded:", {
                          videoWidth: videoEl.videoWidth,
                          videoHeight: videoEl.videoHeight,
                          readyState: videoEl.readyState,
                        });
                        setVideoLoading(false);
                        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                          setVideoReady(true);
                        }
                      }}
                      onCanPlay={(e) => {
                        const videoEl = e.currentTarget;
                        console.log("Video can play:", {
                          videoWidth: videoEl.videoWidth,
                          videoHeight: videoEl.videoHeight,
                          duration: videoEl.duration,
                        });
                        setVideoLoading(false);
                        // Check if video has valid dimensions
                        if (videoEl.videoWidth === 0 && videoEl.videoHeight === 0 && videoEl.duration === 0) {
                          console.warn("Video appears to have no content (black screen) - possible codec issue or empty file");
                          console.warn("Video URL:", videoUrl);
                          console.warn("Try opening the video in a new tab or check the browser console for more details");
                        }
                        setVideoReady(true);
                        if (videoError) setVideoError(false);
                      }}
                      onCanPlayThrough={() => {
                        setVideoLoading(false);
                        setVideoReady(true);
                      }}
                      onWaiting={() => {
                        setVideoLoading(true);
                      }}
                      onPlaying={(e) => {
                        const videoEl = e.currentTarget;
                        console.log("Video playing:", {
                          videoWidth: videoEl.videoWidth,
                          videoHeight: videoEl.videoHeight,
                          currentTime: videoEl.currentTime,
                        });
                        setVideoLoading(false);
                        setVideoReady(true);
                        // If video is playing but has no dimensions after 3 seconds, warn user
                        setTimeout(() => {
                          if (videoEl.videoWidth === 0 && videoEl.videoHeight === 0) {
                            console.warn("Video playing but showing black screen - possible codec issue");
                            console.warn("Try opening the video in a new tab or use a different browser");
                          }
                        }, 3000);
                      }}
                      onProgress={(e) => {
                        const videoEl = e.currentTarget;
                        const buffered = videoEl.buffered;
                        if (buffered.length > 0 && buffered.end(0) > 0) {
                          setVideoLoading(false);
                        }
                      }}
                      onStalled={() => {
                        console.warn("Video stalled - may have network issues");
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/quicktime" />
                      <source src={videoUrl} type="video/ogg" />
                      <source src={videoUrl} />
                      Your browser does not support the video tag.
                    </video>
                    {videoReady && !videoLoading && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white/70">
                        {currentVideoGatewayIndex === 0 ? "Primary gateway" : `Gateway ${currentVideoGatewayIndex + 1}`}
                      </div>
                    )}
                    {videoReady && !videoLoading && videoUrl && (
                      <div className="absolute bottom-2 left-2">
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-black/70 px-2 py-1 text-xs text-secondary hover:underline"
                          title="Open video in new tab (may work better if showing black screen)"
                        >
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                ) : proofMediaType === "video" && videoError ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 text-center text-white/60 p-4">
                    <svg className="h-10 w-10 text-secondary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Video failed to load from all gateways.</p>
                    <p className="text-xs text-white/50">This might be due to CORS restrictions or network issues.</p>
                    {quest.proof?.url && (
                      <a
                        href={quest.proof.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 text-xs text-secondary hover:underline"
                      >
                        Open video in new tab
                      </a>
                    )}
                    {quest.proof?.cid && getVideoGateways.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-white/40">
                        <p>Alternative gateways:</p>
                        <div className="space-y-1">
                          {getVideoGateways.map((gateway, idx) => (
                            <a
                              key={idx}
                              href={gateway}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-secondary hover:underline"
                            >
                              Try Gateway {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/60">
                    <FileText className="h-10 w-10 text-secondary" />
                    <p className="text-sm">Preview not available. Use the link to open your submission.</p>
                    {quest?.proof?.url && (
                      <a
                        href={quest.proof.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-secondary hover:underline"
                      >
                        Open in new tab
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            {canReviewSubmission && (
              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-end">
                <Button
                  variant="outline"
                  className="rounded-full border-red-400/60 px-6 text-red-300 hover:text-red-200"
                  onClick={() => verifyQuest({ questId: quest!.id, approve: false })}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Processing…" : "Reject proof"}
                </Button>
                <Button
                  className="rounded-full px-6"
                  onClick={() => verifyQuest({ questId: quest!.id, approve: true })}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Processing…" : "Approve & release reward"}
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}

