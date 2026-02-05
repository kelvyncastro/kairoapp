export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Calm, soothing chime - comfortable and relaxing.
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

    // Soft warm bell/chime - low frequency, gentle fade
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = "sine";
    bell.frequency.setValueAtTime(523, now); // C5 - pleasant middle tone
    bellGain.gain.setValueAtTime(0.35, now);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    bell.connect(bellGain);
    bellGain.connect(master);
    bell.start(now);
    bell.stop(now + 0.3);

    // Gentle lower octave for warmth
    const warmth = ctx.createOscillator();
    const warmthGain = ctx.createGain();
    warmth.type = "sine";
    warmth.frequency.setValueAtTime(262, now); // C4 - one octave below
    warmthGain.gain.setValueAtTime(0.15, now);
    warmthGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    warmth.connect(warmthGain);
    warmthGain.connect(master);
    warmth.start(now);
    warmth.stop(now + 0.25);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 350);
  } catch {
    // best-effort; no-op
  }
}
