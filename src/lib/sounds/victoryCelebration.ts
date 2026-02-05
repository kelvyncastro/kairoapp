export type VictoryCelebrationSoundOptions = {
  volume?: number; // 0..1
};

// Local (instant) celebration sound using Web Audio API.
// This avoids network/API latency so the sound can start with the animation.
export async function playVictoryCelebrationSound(
  options: VictoryCelebrationSoundOptions = {}
): Promise<void> {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();

    // Some browsers block autoplay; resume may still fail without user gesture.
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
    }
    if (ctx.state !== "running") {
      // Autoplay blocked
      await ctx.close().catch(() => undefined);
      return;
    }

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.75));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Quick "ta-da" arpeggio + chord
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    const step = 0.09;
    const noteLen = 0.22;

    for (let i = 0; i < notes.length; i++) {
      const t = now + i * step;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[i], t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteLen);

      osc.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + noteLen + 0.02);
    }

    // Add a short sparkle/noise burst
    const noiseDur = 0.18;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // White noise with fast decay
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + noiseDur);

    noise.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now + 0.03);
    noise.stop(now + 0.03 + noiseDur);

    // Final chord sustain
    const chord = [523.25, 659.25, 783.99];
    chord.forEach((freq) => {
      const t = now + notes.length * step + 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Cleanup
    const totalMs = 1100;
    window.setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, totalMs);
  } catch {
    // best-effort; no-op
  }
}
