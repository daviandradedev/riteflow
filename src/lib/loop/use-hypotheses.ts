"use client";

import { useSyncExternalStore } from "react";
import { listHypotheses, subscribeHypotheses } from "@/lib/loop/store";
import type { Hypothesis } from "@/lib/loop/types";

const EMPTY: Hypothesis[] = [];

export function useHypotheses() {
  return useSyncExternalStore(subscribeHypotheses, listHypotheses, () => EMPTY);
}
