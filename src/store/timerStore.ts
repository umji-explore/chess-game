/**
 * timerStore.ts
 * 체스 타이머 전역 스토어 (Zustand).
 */

import { create } from 'zustand';
import { Color } from '../core/types';

export type TimeControl = 'unlimited' | '1+0' | '3+2' | '5+0' | '10+0' | '30+0';

export interface TimerConfig {
  label: string;
  initialSeconds: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS: Record<TimeControl, TimerConfig> = {
  'unlimited': { label: '무제한',      initialSeconds: 0,    incrementSeconds: 0 },
  '1+0':       { label: '1분',         initialSeconds: 60,   incrementSeconds: 0 },
  '3+2':       { label: '3분+2초',     initialSeconds: 180,  incrementSeconds: 2 },
  '5+0':       { label: '5분(블리츠)', initialSeconds: 300,  incrementSeconds: 0 },
  '10+0':      { label: '10분(래피드)',  initialSeconds: 600,  incrementSeconds: 0 },
  '30+0':      { label: '30분(클래식)', initialSeconds: 1800, incrementSeconds: 0 },
};

interface TimerStore {
  timeControl: TimeControl;
  whiteTime: number;
  blackTime: number;
  activeColor: Color | null;
  _intervalId: ReturnType<typeof setInterval> | null;
  timeoutColor: Color | null;

  setTimeControl: (tc: TimeControl) => void;
  startTimer: (color: Color) => void;
  stopTimer: () => void;
  resetTimer: (tc?: TimeControl) => void;
  tick: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timeControl: 'unlimited',
  whiteTime: 0,
  blackTime: 0,
  activeColor: null,
  _intervalId: null,
  timeoutColor: null,

  setTimeControl: (tc) => {
    const old = get()._intervalId;
    if (old) clearInterval(old);
    const cfg = TIME_CONTROLS[tc];
    set({ timeControl: tc, whiteTime: cfg.initialSeconds, blackTime: cfg.initialSeconds, activeColor: null, timeoutColor: null, _intervalId: null });
  },

  startTimer: (color) => {
    const { timeControl, _intervalId } = get();
    if (timeControl === 'unlimited') return;
    if (_intervalId) clearInterval(_intervalId);
    set({ activeColor: color });
    const id = setInterval(() => get().tick(), 1000);
    set({ _intervalId: id });
  },

  stopTimer: () => {
    const { _intervalId, timeControl, activeColor } = get();
    if (timeControl === 'unlimited') return;
    const cfg = TIME_CONTROLS[timeControl];
    if (cfg.incrementSeconds > 0 && activeColor) {
      if (activeColor === Color.White) {
        set(s => ({ whiteTime: s.whiteTime + cfg.incrementSeconds }));
      } else {
        set(s => ({ blackTime: s.blackTime + cfg.incrementSeconds }));
      }
    }
    if (_intervalId) clearInterval(_intervalId);
    set({ activeColor: null, _intervalId: null });
  },

  resetTimer: (tc) => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);
    const timeControl = tc ?? get().timeControl;
    const cfg = TIME_CONTROLS[timeControl];
    set({ timeControl, whiteTime: cfg.initialSeconds, blackTime: cfg.initialSeconds, activeColor: null, _intervalId: null, timeoutColor: null });
  },

  tick: () => {
    const { activeColor } = get();
    if (!activeColor) return;
    if (activeColor === Color.White) {
      const newTime = get().whiteTime - 1;
      if (newTime <= 0) {
        const old = get()._intervalId;
        if (old) clearInterval(old);
        set({ whiteTime: 0, activeColor: null, _intervalId: null, timeoutColor: Color.White });
      } else {
        set({ whiteTime: newTime });
      }
    } else {
      const newTime = get().blackTime - 1;
      if (newTime <= 0) {
        const old = get()._intervalId;
        if (old) clearInterval(old);
        set({ blackTime: 0, activeColor: null, _intervalId: null, timeoutColor: Color.Black });
      } else {
        set({ blackTime: newTime });
      }
    }
  },
}));
