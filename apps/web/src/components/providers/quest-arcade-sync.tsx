"use client";

import { useQuestArcadeSync } from "@/hooks/use-quest-arcade";

export function QuestArcadeSyncProvider() {
  useQuestArcadeSync();
  return null;
}

