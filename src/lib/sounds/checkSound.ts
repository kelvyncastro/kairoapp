export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Subtle, gentle "ping" check sound - soft and minimal.
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
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.25));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Simple gentle "ping" - high pitched, short, subtle
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = "sine";
    ping.frequency.setValueAtTime(880, now); // A5 note
    ping.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
    pingGain.gain.setValueAtTime(0.3, now);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    ping.connect(pingGain);
    pingGain.connect(master);
    ping.start(now);
    ping.stop(now + 0.15);

    // Soft harmonic - adds warmth
    const harmonic = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(1320, now); // E6 - perfect fifth above
    harmonicGain.gain.setValueAtTime(0.1, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(master);
    harmonic.start(now);
    harmonic.stop(now + 0.1);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 200);
  } catch {
    // best-effort; no-op
  }
}
