import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

type PomodoroMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLong: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

interface PomodoroState {
  mode: PomodoroMode;
  isRunning: boolean;
  endAt: number | null;
  remainingMs: number;
  cycleCount: number;
}

interface UtilityContextValue {
  settings: PomodoroSettings;
  state: PomodoroState;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (next: Partial<PomodoroSettings>) => Promise<void>;
  lofiUrl: string;
  setLofiUrl: (url: string) => void;
  isLofiPlaying: boolean;
  toggleLofi: () => void;
}

const defaultSettings: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLong: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

const defaultState: PomodoroState = {
  mode: 'FOCUS',
  isRunning: false,
  endAt: null,
  remainingMs: 25 * 60 * 1000,
  cycleCount: 0,
};

const STORAGE_KEY = 'habithive_pomodoro_state';
const LOFI_KEY = 'habithive_lofi_url';

const UtilityContext = createContext<UtilityContextValue | undefined>(undefined);

export const useUtility = () => {
  const ctx = useContext(UtilityContext);
  if (!ctx) throw new Error('useUtility must be used within UtilityProvider');
  return ctx;
};

export const UtilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [state, setState] = useState<PomodoroState>(defaultState);
  const [lofiUrl, setLofiUrlState] = useState<string>(() => localStorage.getItem(LOFI_KEY) || '');
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PomodoroState;
        setState(parsed);
      } catch {
        setState(defaultState);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!token) return;
    api.getPomodoroSettings(token)
      .then((data: any) => {
        setSettings({
          focusMinutes: data.focusMinutes,
          shortBreakMinutes: data.shortBreakMinutes,
          longBreakMinutes: data.longBreakMinutes,
          cyclesBeforeLong: data.cyclesBeforeLong,
          autoStartBreaks: data.autoStartBreaks,
          autoStartFocus: data.autoStartFocus,
        });
      })
      .catch(() => {
        // keep defaults
      });
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning || !prev.endAt) return prev;
        const remaining = Math.max(prev.endAt - Date.now(), 0);
        if (remaining > 0) {
          return { ...prev, remainingMs: remaining };
        }

        const nextMode: PomodoroMode =
          prev.mode === 'FOCUS'
            ? (prev.cycleCount + 1) % settings.cyclesBeforeLong === 0
              ? 'LONG_BREAK'
              : 'SHORT_BREAK'
            : 'FOCUS';
        const nextCycleCount = prev.mode === 'FOCUS' ? prev.cycleCount + 1 : prev.cycleCount;
        const nextDuration =
          nextMode === 'FOCUS'
            ? settings.focusMinutes
            : nextMode === 'SHORT_BREAK'
            ? settings.shortBreakMinutes
            : settings.longBreakMinutes;
        const autoStart = nextMode === 'FOCUS' ? settings.autoStartFocus : settings.autoStartBreaks;

        return {
          mode: nextMode,
          isRunning: autoStart,
          endAt: autoStart ? Date.now() + nextDuration * 60 * 1000 : null,
          remainingMs: nextDuration * 60 * 1000,
          cycleCount: nextCycleCount,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const start = () => {
    setState((prev) => {
      if (prev.isRunning) return prev;
      return {
        ...prev,
        isRunning: true,
        endAt: Date.now() + prev.remainingMs,
      };
    });
  };

  const pause = () => {
    setState((prev) => ({ ...prev, isRunning: false, endAt: null }));
  };

  const reset = () => {
    const duration =
      state.mode === 'FOCUS'
        ? settings.focusMinutes
        : state.mode === 'SHORT_BREAK'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
    setState((prev) => ({
      ...prev,
      isRunning: false,
      endAt: null,
      remainingMs: duration * 60 * 1000,
    }));
  };

  const skip = () => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      endAt: Date.now(),
      remainingMs: 0,
    }));
  };

  const updateSettings = async (next: Partial<PomodoroSettings>) => {
    const updated = { ...settings, ...next };
    setSettings(updated);
    if (token) {
      await api.updatePomodoroSettings(token, updated);
    }
  };

  const setLofiUrl = (url: string) => {
    setLofiUrlState(url);
    localStorage.setItem(LOFI_KEY, url);
  };

  const toggleLofi = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(lofiUrl || '');
      audioRef.current.loop = true;
    }

    if (!lofiUrl) return;
    audioRef.current.src = lofiUrl;
    if (isLofiPlaying) {
      audioRef.current.pause();
      setIsLofiPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsLofiPlaying(true)).catch(() => setIsLofiPlaying(false));
    }
  };

  const value = useMemo(
    () => ({
      settings,
      state,
      start,
      pause,
      reset,
      skip,
      updateSettings,
      lofiUrl,
      setLofiUrl,
      isLofiPlaying,
      toggleLofi,
    }),
    [settings, state, lofiUrl, isLofiPlaying]
  );

  return <UtilityContext.Provider value={value}>{children}</UtilityContext.Provider>;
};
