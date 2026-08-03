import { create } from 'zustand';

type TimerMode = 'pomodoro' | 'shift-countdown' | 'idle';

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  workMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  isBreak: boolean;
  intervalId: ReturnType<typeof setInterval> | null;

  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'idle',
  isRunning: false,
  workMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
  isBreak: false,
  intervalId: null,

  setMode: (mode) => {
    const { workMinutes, breakMinutes } = get();
    set({
      mode,
      isRunning: false,
      isBreak: false,
      remainingSeconds: mode === 'pomodoro' ? workMinutes * 60 : breakMinutes * 60,
    });
  },

  start: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null });
  },

  reset: () => {
    const { intervalId, workMinutes } = get();
    if (intervalId) clearInterval(intervalId);
    set({
      isRunning: false,
      intervalId: null,
      remainingSeconds: workMinutes * 60,
      isBreak: false,
    });
  },

  tick: () => {
    const { remainingSeconds, workMinutes, breakMinutes, isBreak, intervalId } = get();
    if (remainingSeconds <= 1) {
      if (intervalId) clearInterval(intervalId);
      const nextIsBreak = !isBreak;
      const nextSeconds = nextIsBreak ? breakMinutes * 60 : workMinutes * 60;
      set({
        remainingSeconds: nextSeconds,
        isBreak: nextIsBreak,
        isRunning: true,
        intervalId: setInterval(() => get().tick(), 1000),
      });
      // Play a subtle notification if supported
      if (typeof AudioContext !== 'undefined' || typeof window.Audio !== 'undefined') {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.05;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch { /* ignore audio errors */ }
      }
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
}));
