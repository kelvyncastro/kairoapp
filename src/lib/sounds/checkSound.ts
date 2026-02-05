export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Gentle "bubble pop" - soft, satisfying plop sound.
// Volume set to 6% for minimal, gentle feedback.
// Uses Web Audio API for instant playback.
export function playCheckSound(options: CheckSoundOptions = {}): void {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.06));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Soft bubble pop - quick frequency drop for "plop" effect
    const bubble = ctx.createOscillator();
    const bubbleGain = ctx.createGain();
    bubble.type = "sine";
    bubble.frequency.setValueAtTime(600, now);
    bubble.frequency.exponentialRampToValueAtTime(150, now + 0.06);
    bubbleGain.gain.setValueAtTime(0.3, now);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    bubble.connect(bubbleGain);
    bubbleGain.connect(master);
    bubble.start(now);
    bubble.stop(now + 0.1);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 150);
  } catch {
    // best-effort; no-op
  }
}
