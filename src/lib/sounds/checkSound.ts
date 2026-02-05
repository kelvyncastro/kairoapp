export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Quick, satisfying "check" / "ding" sound using Web Audio API.
// Plays instantly (no network delay).
export function playCheckSound(options: CheckSoundOptions = {}): void {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();

    // Handle autoplay restrictions gracefully
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.5));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Main "ding" tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Harmonic overtone for richness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1760, now); // A6
    osc2.frequency.exponentialRampToValueAtTime(2637, now + 0.08); // E7
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now);
    osc2.stop(now + 0.22);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 400);
  } catch {
    // best-effort; no-op
  }
}
