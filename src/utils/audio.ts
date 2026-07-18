type MusicMood = "idle" | "battle1" | "battle2" | "battle3" | "victory" | "defeat";
type WaveType = OscillatorType | "noise";
type PowerupSoundKind = "speed" | "double" | "freeze" | "ultraman" | "wukong";

const AUDIO_MUTE_STORAGE_KEY = "sun-strike-audio-muted";

type Listener = (muted: boolean) => void;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface NoteOptions {
  gain?: number;
  type?: WaveType;
  attack?: number;
  release?: number;
  pan?: number;
}

class GameAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicIntervalId: number | null = null;
  private beatIndex = 0;
  private currentMood: MusicMood = "idle";
  private muted = false;
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(AUDIO_MUTE_STORAGE_KEY) === "1";
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.muted);

    return () => {
      this.listeners.delete(listener);
    };
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
  }

  setMuted(nextMuted: boolean) {
    this.muted = nextMuted;
    this.syncMuteState();
    this.listeners.forEach((listener) => listener(this.muted));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, nextMuted ? "1" : "0");
    }
  }

  resume() {
    const context = this.ensureContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }
  }

  setMood(nextMood: MusicMood) {
    if (this.currentMood === nextMood) {
      return;
    }

    this.currentMood = nextMood;
    this.restartMusicLoop();
  }

  playArrowShot() {
    this.playNote(698.46, 0.08, { gain: 0.045, type: "square", pan: -0.18 });
    this.playNote(932.33, 0.06, { gain: 0.03, type: "triangle", attack: 0.002, pan: 0.22 });
  }

  playSunHit() {
    this.playNote(392, 0.12, { gain: 0.04, type: "triangle" });
    this.playNote(311.13, 0.14, { gain: 0.036, type: "sawtooth", attack: 0.002 });
  }

  playPlayerHit() {
    this.playNote(220, 0.16, { gain: 0.05, type: "sawtooth", attack: 0.002 });
    this.playNote(164.81, 0.22, { gain: 0.04, type: "square", attack: 0.002 });
    this.playNote(0, 0.08, { gain: 0.02, type: "noise" });
  }

  playMonsterBurst() {
    this.playNote(280, 0.06, { gain: 0.03, type: "noise" });
    this.playNote(523.25, 0.08, { gain: 0.024, type: "triangle" });
  }

  playPowerup(kind: PowerupSoundKind) {
    if (kind === "speed") {
      this.playNote(659.25, 0.09, { gain: 0.04, type: "square" });
      this.playNote(880, 0.11, { gain: 0.05, type: "triangle" });
      return;
    }

    if (kind === "double") {
      this.playNote(523.25, 0.08, { gain: 0.04, type: "square", pan: -0.2 });
      this.playNote(659.25, 0.08, { gain: 0.04, type: "square", pan: 0.2 });
      this.playNote(783.99, 0.12, { gain: 0.045, type: "triangle" });
      return;
    }

    if (kind === "freeze") {
      this.playNote(783.99, 0.18, { gain: 0.035, type: "sine" });
      this.playNote(1174.66, 0.22, { gain: 0.03, type: "triangle" });
      this.playNote(0, 0.06, { gain: 0.018, type: "noise" });
      return;
    }

    if (kind === "wukong") {
      this.playNote(392, 0.08, { gain: 0.04, type: "square", pan: -0.18 });
      this.playNote(587.33, 0.1, { gain: 0.045, type: "triangle", pan: 0.18 });
      this.playNote(783.99, 0.16, { gain: 0.04, type: "sawtooth" });
      return;
    }

    this.playNote(392, 0.16, { gain: 0.04, type: "sawtooth" });
    this.playNote(523.25, 0.16, { gain: 0.045, type: "sawtooth" });
    this.playNote(659.25, 0.22, { gain: 0.05, type: "triangle" });
  }

  playVictory() {
    this.playNote(523.25, 0.14, { gain: 0.05, type: "triangle" });
    this.playNote(659.25, 0.16, { gain: 0.05, type: "triangle" });
    this.playNote(783.99, 0.22, { gain: 0.06, type: "triangle" });
  }

  playDefeat() {
    this.playNote(329.63, 0.18, { gain: 0.042, type: "square" });
    this.playNote(246.94, 0.2, { gain: 0.038, type: "sawtooth" });
    this.playNote(196, 0.26, { gain: 0.05, type: "triangle" });
  }

  private restartMusicLoop() {
    if (typeof window === "undefined") {
      return;
    }

    this.stopMusicLoop();
    this.beatIndex = 0;
    this.playMusicStep();

    const intervalMs = this.getMoodIntervalMs(this.currentMood);
    this.musicIntervalId = window.setInterval(() => {
      this.playMusicStep();
    }, intervalMs);
  }

  private stopMusicLoop() {
    if (this.musicIntervalId !== null && typeof window !== "undefined") {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private playMusicStep() {
    if (this.currentMood === "idle") {
      this.playMusicPattern([[261.63, 0.14, 0.022], [329.63, 0.14, 0.018], [392, 0.18, 0.02]]);
    }

    if (this.currentMood === "battle1") {
      const patterns = [
        [[261.63, 0.12, 0.03], [392, 0.09, 0.018]],
        [[293.66, 0.12, 0.028], [440, 0.09, 0.02]],
        [[329.63, 0.12, 0.03], [392, 0.09, 0.018]],
        [[293.66, 0.12, 0.028], [349.23, 0.09, 0.018]],
      ] as const;
      this.playMusicPattern(patterns[this.beatIndex % patterns.length]);
    }

    if (this.currentMood === "battle2") {
      const patterns = [
        [[220, 0.1, 0.032], [329.63, 0.08, 0.018], [440, 0.06, 0.016]],
        [[246.94, 0.1, 0.03], [349.23, 0.08, 0.018], [493.88, 0.06, 0.016]],
        [[261.63, 0.1, 0.032], [392, 0.08, 0.018], [523.25, 0.06, 0.016]],
        [[246.94, 0.1, 0.03], [349.23, 0.08, 0.018], [440, 0.06, 0.016]],
      ] as const;
      this.playMusicPattern(patterns[this.beatIndex % patterns.length]);
    }

    if (this.currentMood === "battle3") {
      const patterns = [
        [[196, 0.08, 0.036], [293.66, 0.06, 0.018], [392, 0.08, 0.02]],
        [[220, 0.08, 0.034], [329.63, 0.06, 0.018], [440, 0.08, 0.02]],
        [[246.94, 0.08, 0.034], [349.23, 0.06, 0.018], [493.88, 0.08, 0.02]],
        [[220, 0.08, 0.034], [329.63, 0.06, 0.018], [440, 0.08, 0.02]],
      ] as const;
      this.playMusicPattern(patterns[this.beatIndex % patterns.length]);
    }

    if (this.currentMood === "victory") {
      const patterns = [
        [[523.25, 0.12, 0.03], [659.25, 0.12, 0.022]],
        [[783.99, 0.14, 0.03], [659.25, 0.1, 0.018]],
      ] as const;
      this.playMusicPattern(patterns[this.beatIndex % patterns.length]);
    }

    if (this.currentMood === "defeat") {
      const patterns = [
        [[220, 0.16, 0.025], [164.81, 0.12, 0.018]],
        [[196, 0.16, 0.025], [146.83, 0.12, 0.018]],
      ] as const;
      this.playMusicPattern(patterns[this.beatIndex % patterns.length]);
    }

    this.beatIndex += 1;
  }

  private playMusicPattern(pattern: readonly (readonly [number, number, number])[]) {
    pattern.forEach(([frequency, duration, gain], index) => {
      window.setTimeout(() => {
        this.playNote(frequency, duration, {
          gain,
          type: this.currentMood === "defeat" ? "triangle" : "square",
        });
      }, index * 90);
    });
  }

  private getMoodIntervalMs(mood: MusicMood) {
    if (mood === "battle3") {
      return 260;
    }

    if (mood === "battle2") {
      return 300;
    }

    if (mood === "battle1") {
      return 340;
    }

    if (mood === "victory" || mood === "defeat") {
      return 520;
    }

    return 680;
  }

  private playNote(frequency: number, durationSeconds: number, options: NoteOptions = {}) {
    const context = this.ensureContext();

    if (!context || context.state !== "running") {
      return;
    }

    const gainNode = context.createGain();
    const panner = context.createStereoPanner();
    gainNode.connect(panner);
    panner.connect(this.sfxGain ?? this.masterGain ?? context.destination);

    const attack = options.attack ?? 0.006;
    const release = options.release ?? Math.min(0.18, durationSeconds * 0.72);
    const targetGain = options.gain ?? 0.04;
    const startTime = context.currentTime;
    const stopTime = startTime + durationSeconds;

    panner.pan.value = options.pan ?? 0;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime + release);

    if (options.type === "noise") {
      const source = context.createBufferSource();
      source.buffer = this.createNoiseBuffer(context);
      source.connect(gainNode);
      source.start(startTime);
      source.stop(stopTime + release);
      return;
    }

    const oscillator = context.createOscillator();
    oscillator.type = options.type ?? "square";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.connect(gainNode);
    oscillator.start(startTime);
    oscillator.stop(stopTime + release);
  }

  private createNoiseBuffer(context: AudioContext) {
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.14)), context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    }

    return buffer;
  }

  private ensureContext() {
    if (typeof window === "undefined") {
      return null;
    }

    if (this.context) {
      return this.context;
    }

    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;

    if (!AudioCtor) {
      return null;
    }

    this.context = new AudioCtor();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    this.musicGain.gain.value = 0.55;
    this.sfxGain.gain.value = 0.8;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.syncMuteState();

    return this.context;
  }

  private syncMuteState() {
    const context = this.ensureContext();

    if (!context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.55, context.currentTime, 0.02);
  }
}

export const gameAudio = new GameAudioEngine();
