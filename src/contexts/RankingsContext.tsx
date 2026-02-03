import React, { createContext, useContext } from "react";

import { useRankings as useRankingsHook } from "@/hooks/useRankings";

type RankingsStore = ReturnType<typeof useRankingsHook>;

const RankingsContext = createContext<RankingsStore | null>(null);

export function RankingsProvider({ children }: { children: React.ReactNode }) {
  const store = useRankingsHook();
  return <RankingsContext.Provider value={store}>{children}</RankingsContext.Provider>;
}

export function useRankingsStore(): RankingsStore {
  const ctx = useContext(RankingsContext);
  if (!ctx) {
    throw new Error("useRankingsStore must be used within a RankingsProvider");
  }
  return ctx;
}
