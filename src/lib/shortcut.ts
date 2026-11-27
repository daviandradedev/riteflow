"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

function detectShortcutLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl K";
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    navigator.userAgent ??
    "";
  return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘K" : "Ctrl K";
}

export function useCommandShortcutLabel(): string {
  return useSyncExternalStore(noopSubscribe, detectShortcutLabel, () => "Ctrl K");
}
