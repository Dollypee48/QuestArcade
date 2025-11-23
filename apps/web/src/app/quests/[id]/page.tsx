"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
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
import { loadVideo, revokeVideoBlobUrl, buildIpfsVideoUrl, getAllGatewayUrls, detectVideoType } from "@/lib/video-loader";

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
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [currentVideoGatewayIndex, setCurrentVideoGatewayIndex] = useState(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoDirectUrl, setVideoDirectUrl] = useState<string | null>(null);
  const [videoLoadMethod, setVideoLoadMethod] = useState<"blob" | "direct">("direct");

  const { refresh } = useQuestArcadeSync();
  const { acceptQuest, submitProof, verifyQuest, claimReward, cancelQuest, states } = useQuestActions({ onSettled: refresh });

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
  const isCancelling = states.cancel?.status === "pending" && states.cancel.questId === quest?.id;
  const acceptError = states.accept.status === "error" && states.accept.questId === quest?.id ? states.accept.error : null;
  const submitFeedback =
    states.submit.status === "error" && states.submit.questId === quest?.id ? states.submit.error : submitError;
  const verifyError = states.verify?.status === "error" && states.verify.questId === quest?.id ? states.verify.error : null;
  const claimError = states.claim?.status === "error" && states.claim.questId === quest?.id ? states.claim.error : null;
  const cancelError = states.cancel?.status === "error" && states.cancel.questId === quest?.id ? states.cancel.error : null;

  const hasAcceptedQuest = useMemo(() => {
    if (!questProgress) {
      return false;
    }

    return ["accepted", "in-progress", "submitted", "completed"].includes(questProgress.status);
  }, [questProgress]);

  const hasSubmittedProof = useMemo(() => {
    if (!quest || !questProgress) return false;
    return (
      ["submitted", "completed"].includes(questProgress.status) ||
      quest.onChainState === "submitted"
    );
  }, [quest, questProgress]);

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
    setVideoLoading(false);
    setVideoReady(false);
    // Clean up previous blob URL
    if (videoBlobUrl) {
      revokeVideoBlobUrl(videoBlobUrl);
      setVideoBlobUrl(null);
    }
    setVideoDirectUrl(null);
    setVideoLoadMethod("direct");
  }, [quest?.id, quest?.proof?.url, quest?.proof?.cid, videoBlobUrl]);

  // Get video source (CID or URL)
  const videoSource = useMemo(() => {
    if (!quest?.proof) return null;
    
    // Prefer CID if available
    if (quest.proof.cid) {
      return quest.proof.cid;
    }
    
    // Fallback to URL
    if (quest.proof.url) {
      return quest.proof.url;
    }
    
    return null;
  }, [quest?.proof]);

  // Get all gateway URLs for fallback
  const getVideoGateways = useMemo(() => {
    if (!quest?.proof?.cid) return [];
    return getAllGatewayUrls(quest.proof.cid);
  }, [quest?.proof?.cid]);

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

  // Optimized video loading with fast fallback (10s timeout, immediate direct URL fallback)
  useEffect(() => {
    if (!videoSource || proofMediaType !== "video") {
      return;
    }

    let isCancelled = false;

    const loadVideoAsync = async () => {
      try {
        setVideoLoading(true);
        setVideoError(false);
        setVideoReady(false);
        
        // Clean up previous blob URL
        if (videoBlobUrl) {
          revokeVideoBlobUrl(videoBlobUrl);
          setVideoBlobUrl(null);
        }

        // Use optimized video loader (10s timeout, fast fallback)
        const result = await loadVideo(videoSource, {
          preferBlob: true,
          maxRetries: 1, // Only try 1 alternative gateway for speed
          onProgress: (gatewayIndex, method) => {
            if (!isCancelled) {
              setCurrentVideoGatewayIndex(gatewayIndex);
              setVideoLoadMethod(method);
            }
          },
        });

        if (isCancelled) {
          if (result.blobUrl) {
            revokeVideoBlobUrl(result.blobUrl);
          }
          return;
        }

        // Set the loaded video URLs
        if (result.blobUrl) {
          setVideoBlobUrl(result.blobUrl);
          setVideoDirectUrl(result.directUrl);
          setVideoLoadMethod("blob");
          setVideoLoading(false);
        } else {
          // Use direct URL (faster, no blob conversion needed)
          setVideoBlobUrl(null);
          setVideoDirectUrl(result.directUrl);
          setVideoLoadMethod("direct");
          setVideoLoading(false);
        }

        if (result.error) {
          console.warn("Video load warning:", result.error);
        }
      } catch (error) {
        console.error("Error loading video:", error);
        if (!isCancelled) {
          // Set direct URL as immediate fallback
          if (videoSource) {
            const fallbackUrl = videoSource.startsWith("http") 
              ? videoSource 
              : buildIpfsVideoUrl(videoSource, currentVideoGatewayIndex);
            setVideoDirectUrl(fallbackUrl);
            setVideoBlobUrl(null);
            setVideoLoadMethod("direct");
            setVideoError(false); // Don't show error, try direct URL
            setVideoLoading(false);
          } else {
            setVideoError(true);
            setVideoLoading(false);
          }
        }
      }
    };

    // Start loading immediately
    loadVideoAsync();

    return () => {
      isCancelled = true;
      // Cleanup will be handled by the reset effect
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSource, proofMediaType, currentVideoGatewayIndex]);
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
  const isExpired = quest?.isExpired ?? false;
  const canRefund = isExpired && isCreator && quest?.isEscrowFunded && 
    (quest?.onChainState === "active" || (quest?.onChainState === "accepted" && !quest?.proof?.cid));
  const countdown = isExpired 
    ? "Expired" 
    : quest?.timeLimitHours !== undefined 
      ? quest.timeLimitHours > 0 
        ? `${quest.timeLimitHours} hours remaining` 
        : "Expired"
      : "No time limit";
  const proofTypeLabel = formatProofTypeLabel(quest?.proof?.proofType);
  
  if (!quest) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center text-foreground/70">
        <h1 className="text-3xl font-semibold text-foreground">Quest not found</h1>
        <p className="text-sm">
          The quest you are looking for may have expired or is no longer available. Browse the quest
          directory to discover new missions.
        </p>
        <Link
          href="/quests"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm text-foreground transition hover:bg-white/15"
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
        className="mb-4 inline-flex items-center gap-2 text-sm text-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quests
      </Link>

      <motion.section
        className="glass-card space-y-6 rounded-2xl border-2 border-foreground/20 bg-card/80 p-8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="primary" className="border-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                ⚡ {quest?.difficulty}
              </Badge>
              <Badge variant="accent" className="border-2 text-[11px] font-bold">
                💰 cUSD {quest.reward}
              </Badge>
              <Badge variant="default" className="border-2 text-[11px] font-bold">
                🏆 +{quest.xp} XP
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">{quest.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-foreground/70">{quest.description}</p>
            {(isCompleted || isRejected || isVerified || isExpired) && (
              <div className="mt-3">
                <Badge
                  variant={isCompleted || (isVerified && !quest?.rewardClaimed) ? "accent" : "default"}
                  className={`text-[10px] uppercase tracking-widest ${
                    isRejected ? "border border-destructive/40 text-destructive" : ""
                  } ${
                    isExpired ? "border border-warning/40 text-warning" : ""
                  }`}
                >
                  {isCompleted
                    ? "Completed"
                    : isVerified
                      ? "Verified"
                      : isRejected
                        ? "Rejected"
                        : isExpired
                          ? "Expired"
                          : quest?.onChainState}
                </Badge>
                {isCompleted && (
                  <p className="mt-2 text-xs text-foreground/60">
                    This quest has been completed and rewards have been claimed. This is a read-only view of the
                    quest history.
                  </p>
                )}
                {isRejected && (
                  <p className="mt-2 text-xs text-foreground/60">
                    This quest submission was rejected. This is a read-only view of the quest history.
                  </p>
                )}
                {isExpired && canRefund && (
                  <p className="mt-2 text-xs text-foreground/60">
                    This quest has expired. You can cancel it to receive a refund of the escrowed reward.
                  </p>
                )}
                {isExpired && !canRefund && (
                  <p className="mt-2 text-xs text-foreground/60">
                    This quest has expired and is no longer available.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border-2 border-foreground/20 bg-card/80 px-4 sm:px-5 py-3 sm:py-4 text-left sm:text-right w-full sm:w-auto shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">⏰ Countdown</p>
            <p className="mt-2 text-base sm:text-lg font-bold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">{countdown}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin className="h-4 w-4 text-secondary" />
              {quest.location}
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-foreground/50">
              Distance • {quest?.distance}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2 text-foreground/80">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Verification • {quest.verification}
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-foreground/50">Proof required</p>
          </div>
          <div className="rounded-xl border-2 border-foreground/20 bg-card/80 p-4 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-2 font-bold text-foreground/90">
              <Clock className="h-4 w-4 text-purple-500" />
              ⏰ Time Limit
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-foreground/60">
              {quest.timeLimitHours ? `${quest.timeLimitHours} hours` : "Flexible"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-foreground/20 bg-card/80 p-5 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-bold text-foreground">📋 Quest Checklist</h2>
          <ul className="mt-3 space-y-2 font-semibold">
            <li>✅ Meet the partner on-site and verify the MiniPay wallet.</li>
            <li>✅ Help the partner accept at least one cUSD payment.</li>
            <li>✅ Record proof (photo/video) and capture GPS coordinates.</li>
            <li>✅ Submit the quest proof before the timer expires.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {canEdit && (
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-2 font-bold uppercase tracking-wide px-6"
            >
              <Link href={`/quests/${quest.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit quest
              </Link>
            </Button>
          )}
          {!isCreator && !isExpired && (
            <div className="flex flex-col gap-2">
              <Button
                className="rounded-lg px-6 font-bold uppercase tracking-wide"
                onClick={async () => {
                  try {
                    await acceptQuest(quest!.id);
                  } catch (error) {
                    // Error is already handled by the hook and displayed via toast
                    console.error("Failed to accept quest:", error);
                  }
                }}
                disabled={isAccepting || hasAcceptedQuest}
              >
                {hasAcceptedQuest ? "✓ Accepted" : isAccepting ? "⚡ Accepting…" : "🎯 Accept Quest"}
              </Button>
              {acceptError && (
                <p className="text-xs text-destructive font-semibold">{acceptError}</p>
              )}
            </div>
          )}
          {canRefund && (
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="rounded-lg border-2 font-bold uppercase tracking-wide px-6"
                onClick={async () => {
                  try {
                    await cancelQuest(quest!.id);
                  } catch (error) {
                    console.error("Failed to cancel quest:", error);
                  }
                }}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling…" : "Cancel & Refund"}
              </Button>
              {cancelError && (
                <p className="text-xs text-destructive font-semibold">{cancelError}</p>
              )}
            </div>
          )}
          {canClaimReward && (
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="rounded-lg border-2 font-bold uppercase tracking-wide px-6"
                onClick={async () => {
                  try {
                    await claimReward(quest!.id);
                  } catch (error) {
                    console.error("Failed to claim reward:", error);
                  }
                }}
                disabled={isClaiming}
              >
                {isClaiming ? "⚡ Claiming…" : "💰 Claim Reward"}
              </Button>
              {claimError && (
                <p className="text-xs text-destructive font-semibold">{claimError}</p>
              )}
            </div>
          )}
          <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-lg border-2 font-bold uppercase tracking-wide px-6"
                disabled={!hasAcceptedQuest || hasSubmittedProof}
              >
                {hasSubmittedProof ? "✓ Proof Submitted" : "📸 Submit Proof"}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-xl border-white/10 bg-gradient-secondary text-foreground max-h-[85vh] overflow-y-auto">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl text-foreground">Submit quest proof</DialogTitle>
                <p className="mt-2 text-sm text-foreground/70">
                  Upload your evidence. Files will be uploaded to IPFS before on-chain submission.
                </p>
              </DialogHeader>
              <div className="flex h-full flex-col gap-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Proof type</p>
                  <div className="flex flex-wrap gap-2">
                    {proofOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                          selectedProof === option.value
                            ? "border-secondary bg-secondary/20 text-foreground"
                            : "border-white/10 text-foreground/70"
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
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Upload evidence</p>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 py-10 text-center text-sm text-foreground/60 transition hover:border-white/40">
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
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Proof reference (CID or URL)</p>
                  <Input
                    placeholder="ipfs://..."
                    value={proofCid}
                    onChange={(event) => setProofCid(event.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Notes for reviewer</p>
                  <Textarea
                    rows={4}
                    placeholder="Add context for the verifier..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-foreground/60">
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-foreground/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-foreground/50">{proofSectionTitle}</p>
                <p className="text-base text-foreground">{proofSectionDescription}</p>
                {isCreator && quest.worker && (
                  <p className="mt-2 text-xs text-foreground/60">
                    Submitted by <span className="font-mono text-foreground">{workerLabel}</span>
                  </p>
                )}
              </div>
              <Badge variant="default" className="border-secondary/40 text-secondary">
                {proofTypeLabel ?? "Submitted"}
              </Badge>
            </div>
            <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Proof reference</p>
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
                    <p className="mt-2 text-sm text-foreground/60">Reference unavailable.</p>
                  )}
                  {quest?.proof?.cid && (
                    <p className="mt-2 break-all text-[11px] text-foreground/40">CID: {quest.proof.cid}</p>
                  )}
                </div>
                {quest?.proof?.note && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-widest text-foreground/50">Notes you shared</p>
                    <p className="mt-2 text-sm text-foreground/80">{quest.proof.note}</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                {proofMediaType === "image" && quest?.proof?.url && !imageError ? (
                  <Image
                    src={quest.proof.url}
                    alt="Submitted proof preview"
                    width={800}
                    height={450}
                    className="h-64 w-full rounded-xl object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : proofMediaType === "image" && imageError ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 text-center text-foreground/60 p-4">
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
                ) : proofMediaType === "video" && (videoBlobUrl || videoDirectUrl) && !videoError ? (
                  <div className="relative">
                    {videoLoading && !videoReady && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/80">
                        <div className="text-center text-foreground/70">
                          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-secondary" />
                          <p className="text-xs">
                            {videoLoadMethod === "blob" ? "Preparing video..." : "Loading video..."}
                          </p>
                          {currentVideoGatewayIndex > 0 && (
                            <p className="mt-1 text-xs text-foreground/50">Trying gateway {currentVideoGatewayIndex + 1}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Use blob URL if available, otherwise use direct URL */}
                    {videoBlobUrl ? (
                      <video
                        key={`video-blob-${videoBlobUrl}`}
                        controls
                        playsInline
                        preload="auto"
                        muted={false}
                        autoPlay={false}
                        className="h-64 w-full rounded-xl border border-border/50 bg-black object-contain"
                        style={{ backgroundColor: "#000" }}
                        onLoadedMetadata={(e) => {
                          const videoEl = e.currentTarget;
                          const error = videoEl.error;
                          console.log("Video blob metadata loaded:", {
                            duration: videoEl.duration,
                            videoWidth: videoEl.videoWidth,
                            videoHeight: videoEl.videoHeight,
                            readyState: videoEl.readyState,
                            networkState: videoEl.networkState,
                            error: error ? { code: error.code, message: error.message } : null,
                          });
                          
                          // Check if video has valid dimensions
                          if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                            setVideoLoading(false);
                            setVideoReady(true);
                            console.log("Video has valid dimensions, should display content");
                          } else if (error) {
                            console.error("Video error detected:", error);
                            setVideoError(true);
                            setVideoLoading(false);
                          } else {
                            // Wait a bit more for dimensions
                            setTimeout(() => {
                              if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                                setVideoLoading(false);
                                setVideoReady(true);
                              } else {
                                console.warn("Video still has no dimensions after metadata load");
                              }
                            }, 500);
                          }
                        }}
                        onLoadedData={(e) => {
                          const videoEl = e.currentTarget;
                          console.log("Video blob data loaded:", {
                            videoWidth: videoEl.videoWidth,
                            videoHeight: videoEl.videoHeight,
                            readyState: videoEl.readyState,
                          });
                          if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                            setVideoLoading(false);
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
                          setVideoReady(true);
                          if (videoError) setVideoError(false);
                        }}
                        onCanPlayThrough={() => {
                          setVideoLoading(false);
                          setVideoReady(true);
                        }}
                        onError={(e) => {
                          const videoEl = e.currentTarget;
                          const error = videoEl.error;
                          console.error("Video blob error:", {
                            code: error?.code,
                            message: error?.message,
                            networkState: videoEl.networkState,
                            readyState: videoEl.readyState,
                          });
                          setVideoError(true);
                          setVideoLoading(false);
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
                        }}
                        onWaiting={() => {
                          setVideoLoading(true);
                        }}
                      >
                        {/* Try multiple source types to ensure compatibility */}
                        <source src={videoBlobUrl} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                        <source src={videoBlobUrl} type="video/mp4" />
                        <source src={videoBlobUrl} type="video/webm" />
                        <source src={videoBlobUrl} type="video/quicktime" />
                        <source src={videoBlobUrl} />
                        Your browser does not support the video tag.
                      </video>
                    ) : videoDirectUrl ? (
                      /* Fallback: Use direct URL if blob fetch failed */
                      <video
                        key={`video-direct-${videoDirectUrl}-${currentVideoGatewayIndex}`}
                        controls
                        playsInline
                        preload="metadata"
                        muted={false}
                        crossOrigin="anonymous"
                        className="h-64 w-full rounded-xl border border-border/50 bg-black object-contain"
                        style={{ backgroundColor: "#000" }}
                        onError={(e) => {
                          const videoEl = e.currentTarget;
                          const error = videoEl.error;
                          console.error("Direct video URL error:", {
                            code: error?.code,
                            message: error?.message,
                            networkState: videoEl.networkState,
                            readyState: videoEl.readyState,
                            url: videoDirectUrl,
                          });
                          setVideoLoading(false);
                          // Try next gateway if available
                          if (currentVideoGatewayIndex < getVideoGateways.length - 1) {
                            setTimeout(() => {
                              setCurrentVideoGatewayIndex((prev) => prev + 1);
                            }, 1000);
                          } else {
                            setVideoError(true);
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          const videoEl = e.currentTarget;
                          console.log("Direct video metadata loaded:", {
                            videoWidth: videoEl.videoWidth,
                            videoHeight: videoEl.videoHeight,
                            duration: videoEl.duration,
                          });
                          if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                            setVideoLoading(false);
                            setVideoReady(true);
                          }
                        }}
                        onLoadedData={(e) => {
                          const videoEl = e.currentTarget;
                          if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                            setVideoLoading(false);
                            setVideoReady(true);
                          }
                        }}
                        onCanPlay={() => {
                          setVideoLoading(false);
                          setVideoReady(true);
                          if (videoError) setVideoError(false);
                        }}
                        onCanPlayThrough={() => {
                          setVideoLoading(false);
                          setVideoReady(true);
                        }}
                        onPlaying={() => {
                          setVideoLoading(false);
                          setVideoReady(true);
                        }}
                        onWaiting={() => {
                          setVideoLoading(true);
                        }}
                      >
                        {videoDirectUrl && (() => {
                          const videoType = detectVideoType(videoDirectUrl);
                          return (
                            <>
                              <source src={videoDirectUrl} type={videoType} />
                              <source src={videoDirectUrl} type="video/mp4" />
                              <source src={videoDirectUrl} type="video/webm" />
                              <source src={videoDirectUrl} />
                            </>
                          );
                        })()}
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                    {videoReady && !videoLoading && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-foreground/70">
                        {videoLoadMethod === "blob" ? "Loaded via blob" : currentVideoGatewayIndex === 0 ? "Direct" : `Gateway ${currentVideoGatewayIndex + 1}`}
                      </div>
                    )}
                    {videoReady && !videoLoading && (videoBlobUrl || videoDirectUrl) && (
                      <div className="absolute bottom-2 left-2">
                        <a
                          href={videoDirectUrl || videoBlobUrl || ""}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-black/70 px-2 py-1 text-xs text-secondary hover:underline"
                          title="Open video in new tab"
                        >
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                ) : proofMediaType === "video" && videoError ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 text-center text-foreground/60 p-4">
                    <svg className="h-10 w-10 text-secondary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Video failed to load from all gateways.</p>
                    <p className="text-xs text-foreground/50">This might be due to CORS restrictions or network issues.</p>
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
                      <div className="mt-2 space-y-1 text-xs text-foreground/40">
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
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-foreground/60">
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
              <div className="mt-6 flex flex-col gap-3 border-t-2 border-foreground/20 pt-4 md:flex-row md:items-center md:justify-end">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Button
                      variant="outline"
                      className="rounded-lg border-2 border-red-500/50 bg-red-500/10 px-6 font-bold uppercase tracking-wide text-red-500 hover:bg-red-500/20"
                      onClick={async () => {
                        try {
                          await verifyQuest({ questId: quest!.id, approve: false });
                        } catch (error) {
                          console.error("Failed to reject proof:", error);
                        }
                      }}
                      disabled={isVerifying}
                    >
                      {isVerifying ? "⚡ Processing…" : "❌ Reject Proof"}
                    </Button>
                    <Button
                      className="rounded-lg px-6 font-bold uppercase tracking-wide"
                      onClick={async () => {
                        try {
                          await verifyQuest({ questId: quest!.id, approve: true });
                        } catch (error) {
                          console.error("Failed to approve proof:", error);
                        }
                      }}
                      disabled={isVerifying}
                    >
                      {isVerifying ? "⚡ Processing…" : "✅ Approve & Release Reward"}
                    </Button>
                  </div>
                  {verifyError && (
                    <p className="text-xs text-destructive font-semibold">{verifyError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}


