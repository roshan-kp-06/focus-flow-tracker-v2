import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerConfig, TimerMode, TimerState, WorkSession } from '@/types';
import { addSession } from '@/lib/storage';

const TIMER_STORAGE_KEY = 'focus-flow-timer';

interface StoredTimerState {
  config: TimerConfig;
  startTime: string | null;
  lastUpdateTime: string | null;
}

const initialConfig: TimerConfig = {
  mode: 'stopwatch',
  duration: 0,
  elapsed: 0,
  state: 'idle',
  taskName: '',
  projectIds: [],
};

function loadTimerState(): { config: TimerConfig; startTime: string | null } {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (stored) {
      const parsed: StoredTimerState = JSON.parse(stored);

      // If timer was running, recalculate elapsed time
      if (parsed.config.state === 'running' && parsed.startTime && parsed.lastUpdateTime) {
        const lastUpdate = new Date(parsed.lastUpdateTime).getTime();
        const now = Date.now();
        const additionalSeconds = Math.floor((now - lastUpdate) / 1000);
        parsed.config.elapsed += additionalSeconds;
      }

      return {
        config: parsed.config,
        startTime: parsed.startTime,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { config: initialConfig, startTime: null };
}

function saveTimerState(config: TimerConfig, startTime: string | null) {
  const state: StoredTimerState = {
    config,
    startTime,
    lastUpdateTime: new Date().toISOString(),
  };
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

function clearTimerState() {
  localStorage.removeItem(TIMER_STORAGE_KEY);
}

export function useTimer() {
  const [config, setConfig] = useState<TimerConfig>(() => loadTimerState().config);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(() => loadTimerState().startTime);

  // Initialize startTimeRef from localStorage
  useEffect(() => {
    const { startTime } = loadTimerState();
    startTimeRef.current = startTime;
  }, []);

  // Save timer state whenever config changes
  useEffect(() => {
    if (config.state === 'idle' && config.taskName === '' && config.projectIds.length === 0) {
      clearTimerState();
    } else {
      saveTimerState(config, startTimeRef.current);
    }
  }, [config]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getDisplayTime = useCallback(() => {
    if (config.mode === 'countdown') {
      if (config.elapsed >= config.duration) {
        // Past the countdown - show overtime (elapsed - duration)
        return config.elapsed - config.duration;
      }
      // Still counting down - show remaining
      return config.duration - config.elapsed;
    }
    return config.elapsed;
  }, [config.mode, config.duration, config.elapsed]);

  const isOvertime = useCallback(() => {
    return config.mode === 'countdown' && config.elapsed > config.duration;
  }, [config.mode, config.elapsed, config.duration]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const start = useCallback(() => {
    if (config.state === 'idle') {
      startTimeRef.current = new Date().toISOString();
      setCountdownComplete(false);
    }
    setConfig(prev => ({ ...prev, state: 'running' }));
  }, [config.state]);

  const pause = useCallback(() => {
    setConfig(prev => ({ ...prev, state: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    setConfig(prev => ({ ...prev, state: 'running' }));
  }, []);

  const stop = useCallback(() => {
    clearTimerInterval();

    // Save session if there was any elapsed time
    if (config.elapsed > 0 && startTimeRef.current) {
      const now = new Date();
      const session: WorkSession = {
        id: crypto.randomUUID(),
        taskName: config.taskName || 'Untitled Session',
        projectIds: config.projectIds,
        date: now.toISOString().split('T')[0],
        duration: config.elapsed,
        startTime: startTimeRef.current,
        endTime: now.toISOString(),
      };
      addSession(session);
    }

    startTimeRef.current = null;
    setCountdownComplete(false);
    setConfig(prev => ({
      ...prev,
      elapsed: 0,
      state: 'idle',
      taskName: '',
      projectIds: [],
    }));
    clearTimerState();
  }, [config.elapsed, config.taskName, config.projectIds, clearTimerInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    setCountdownComplete(false);
    setConfig(prev => ({
      ...prev,
      elapsed: 0,
      state: 'idle',
    }));
  }, [clearTimerInterval]);

  const discard = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    setCountdownComplete(false);
    setConfig(prev => ({
      ...prev,
      elapsed: 0,
      state: 'idle',
      taskName: '',
      projectIds: [],
    }));
    clearTimerState();
  }, [clearTimerInterval]);

  const setMode = useCallback((mode: TimerMode) => {
    if (config.state === 'idle') {
      setConfig(prev => ({ ...prev, mode, elapsed: 0 }));
    }
  }, [config.state]);

  const setDuration = useCallback((duration: number) => {
    if (config.state === 'idle') {
      setConfig(prev => ({ ...prev, duration }));
    }
  }, [config.state]);

  const setTaskName = useCallback((taskName: string) => {
    setConfig(prev => ({ ...prev, taskName }));
  }, []);

  const setProjectIds = useCallback((projectIds: string[]) => {
    setConfig(prev => ({ ...prev, projectIds }));
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (config.state === 'running') {
      intervalRef.current = setInterval(() => {
        setConfig(prev => {
          const newElapsed = prev.elapsed + 1;

          // Check if countdown just hit zero (for notification purposes)
          if (prev.mode === 'countdown' && newElapsed === prev.duration) {
            setCountdownComplete(true);
            // Don't stop - just mark as complete and keep counting
          }

          return { ...prev, elapsed: newElapsed };
        });
      }, 1000);
    } else {
      clearTimerInterval();
    }

    return () => clearTimerInterval();
  }, [config.state, clearTimerInterval]);

  return {
    config,
    displayTime: getDisplayTime(),
    formattedTime: formatTime(getDisplayTime()),
    isOvertime: isOvertime(),
    countdownComplete,
    start,
    pause,
    resume,
    stop,
    reset,
    discard,
    setMode,
    setDuration,
    setTaskName,
    setProjectIds,
    formatTime,
  };
}
