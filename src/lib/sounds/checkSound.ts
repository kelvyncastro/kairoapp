export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Subtle, gentle "ping" check sound - soft and minimal.
// Volume set to 15% for unobtrusive feedback.
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
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.15));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Soft bubble/water drop sound - very gentle
    const drop = ctx.createOscillator();
    const dropGain = ctx.createGain();
    drop.type = "sine";
    drop.frequency.setValueAtTime(1400, now);
    drop.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    dropGain.gain.setValueAtTime(0.4, now);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    drop.connect(dropGain);
    dropGain.connect(master);
    drop.start(now);
    drop.stop(now + 0.12);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 200);
  } catch {
    // best-effort; no-op
  }
}
