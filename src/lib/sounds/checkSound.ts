import checkSoundFile from "@/assets/sounds/check-sound.mp3";

export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Custom check sound from uploaded audio file.
// Volume set to 6% for minimal, gentle feedback.
export function playCheckSound(options: CheckSoundOptions = {}): void {
  try {
    const audio = new Audio(checkSoundFile);
    audio.volume = Math.max(0, Math.min(1, options.volume ?? 0.06));
    audio.play().catch(() => undefined);
  } catch {
    // best-effort; no-op
  }
}
