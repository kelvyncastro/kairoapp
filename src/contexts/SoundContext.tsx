import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { playCheckSound } from "@/lib/sounds/checkSound";

interface SoundContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  playCheck: () => void;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const STORAGE_KEY = "kairo_sound_enabled";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const playCheck = useCallback(() => {
    if (soundEnabled) {
      playCheckSound({ volume: 0.5 });
    }
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playCheck }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return ctx;
}
