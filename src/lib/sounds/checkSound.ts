export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Ultra-soft "pop" - barely audible confirmation.
// Volume set to 8% for minimal, gentle feedback.
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
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.08));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Ultra-soft single pop - gentle and minimal
    const note1 = ctx.createOscillator();
    const note1Gain = ctx.createGain();
    note1.type = "sine";
    note1.frequency.setValueAtTime(440, now); // A4 - softer middle tone
    note1.frequency.exponentialRampToValueAtTime(380, now + 0.08); // gentle pitch drop
    note1Gain.gain.setValueAtTime(0.2, now);
    note1Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    note1.connect(note1Gain);
    note1Gain.connect(master);
    note1.start(now);
    note1.stop(now + 0.15);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 180);
  } catch {
    // best-effort; no-op
  }
}
