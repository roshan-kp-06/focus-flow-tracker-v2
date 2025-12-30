import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerConfig, TimerMode, TimerState, WorkSession } from '@/types';
import { addSession } from '@/lib/storage';

const TIMER_STORAGE_KEY = 'focus-flow-timer';

interface StoredTimerState {
  config: TimerConfig;
  startTime: string | null; // Current running segment start (null when paused)
  sessionStartTime: string | null; // Original session start (for the WorkSession record)
  pausedElapsed: number; // Time elapsed before pause (for pause/resume)
  notes?: string;
}

const initialConfig: TimerConfig = {
  mode: 'stopwatch',
  duration: 0,
  elapsed: 0,
  state: 'idle',
  taskName: '',
  projectIds: [],
};

// Track the groupId for sub-sessions (Continue feature)
let pendingGroupId: string | null = null;

function loadTimerState(): { config: TimerConfig; startTime: string | null; sessionStartTime: string | null; pausedElapsed: number; notes: string } {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (stored) {
      const parsed: StoredTimerState = JSON.parse(stored);

      // If timer was running, recalculate elapsed time from start time
      if (parsed.config.state === 'running' && parsed.startTime) {
        const startMs = new Date(parsed.startTime).getTime();
        const now = Date.now();
        const totalElapsed = (parsed.pausedElapsed || 0) + Math.floor((now - startMs) / 1000);
        parsed.config.elapsed = totalElapsed;
      }

      return {
        config: parsed.config,
        startTime: parsed.startTime,
        sessionStartTime: parsed.sessionStartTime || parsed.startTime, // fallback for old data
        pausedElapsed: parsed.pausedElapsed || 0,
        notes: parsed.notes || '',
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { config: initialConfig, startTime: null, sessionStartTime: null, pausedElapsed: 0, notes: '' };
}

function saveTimerState(config: TimerConfig, startTime: string | null, sessionStartTime: string | null, pausedElapsed: number, notes: string) {
  const state: StoredTimerState = {
    config,
    startTime,
    sessionStartTime,
    pausedElapsed,
    notes,
  };
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

function clearTimerState() {
  localStorage.removeItem(TIMER_STORAGE_KEY);
}

export function useTimer() {
  const initialState = loadTimerState();
  const [config, setConfig] = useState<TimerConfig>(initialState.config);
  const [notes, setNotes] = useState<string>(initialState.notes);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(initialState.startTime);
  const pausedElapsedRef = useRef<number>(initialState.pausedElapsed);
  const sessionStartTimeRef = useRef<string | null>(initialState.sessionStartTime);

  // Initialize refs from localStorage
  useEffect(() => {
    const { startTime, sessionStartTime, pausedElapsed, notes: storedNotes } = loadTimerState();
    startTimeRef.current = startTime;
    sessionStartTimeRef.current = sessionStartTime;
    pausedElapsedRef.current = pausedElapsed;
    if (storedNotes) setNotes(storedNotes);
  }, []);

  // Save timer state whenever config or notes changes
  useEffect(() => {
    if (config.state === 'idle' && config.taskName === '' && config.projectIds.length === 0 && !notes) {
      clearTimerState();
    } else {
      saveTimerState(config, startTimeRef.current, sessionStartTimeRef.current, pausedElapsedRef.current, notes);
    }
  }, [config, notes]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Calculate elapsed time from actual timestamps (works even when tab is hidden)
  const calculateElapsed = useCallback(() => {
    if (config.state === 'running' && startTimeRef.current) {
      const startMs = new Date(startTimeRef.current).getTime();
      const now = Date.now();
      return pausedElapsedRef.current + Math.floor((now - startMs) / 1000);
    }
    return config.elapsed;
  }, [config.state, config.elapsed]);

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
      const now = new Date().toISOString();
      startTimeRef.current = now;
      sessionStartTimeRef.current = now;
      pausedElapsedRef.current = 0;
      setCountdownComplete(false);
    }
    setConfig(prev => ({ ...prev, state: 'running' }));
  }, [config.state]);

  const pause = useCallback(() => {
    // When pausing, calculate the elapsed time and store it
    if (startTimeRef.current) {
      const startMs = new Date(startTimeRef.current).getTime();
      const now = Date.now();
      pausedElapsedRef.current = pausedElapsedRef.current + Math.floor((now - startMs) / 1000);
    }
    startTimeRef.current = null; // Clear the running start time
    setConfig(prev => ({ ...prev, state: 'paused', elapsed: pausedElapsedRef.current }));
  }, []);

  const resume = useCallback(() => {
    // When resuming, set a new start time (pausedElapsed already has previous time)
    startTimeRef.current = new Date().toISOString();
    setConfig(prev => ({ ...prev, state: 'running' }));
  }, []);

  const stop = useCallback(() => {
    clearTimerInterval();

    // Calculate final elapsed time
    const finalElapsed = calculateElapsed();

    // Save session if there was any elapsed time
    if (finalElapsed > 0 && sessionStartTimeRef.current) {
      const now = new Date();
      const session: WorkSession = {
        id: crypto.randomUUID(),
        taskName: config.taskName || 'Untitled Session',
        projectIds: config.projectIds,
        date: now.toISOString().split('T')[0],
        duration: finalElapsed,
        startTime: sessionStartTimeRef.current,
        endTime: now.toISOString(),
        groupId: pendingGroupId || undefined,
        notes: notes || undefined,
      };
      addSession(session);
    }

    startTimeRef.current = null;
    sessionStartTimeRef.current = null;
    pausedElapsedRef.current = 0;
    pendingGroupId = null;
    setCountdownComplete(false);
    setNotes('');
    setConfig(prev => ({
      ...prev,
      elapsed: 0,
      state: 'idle',
      taskName: '',
      projectIds: [],
    }));
    clearTimerState();
  }, [config.taskName, config.projectIds, notes, clearTimerInterval, calculateElapsed]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    sessionStartTimeRef.current = null;
    pausedElapsedRef.current = 0;
    setCountdownComplete(false);
    setNotes('');
    setConfig(prev => ({
      ...prev,
      elapsed: 0,
      state: 'idle',
    }));
  }, [clearTimerInterval]);

  const discard = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    sessionStartTimeRef.current = null;
    pausedElapsedRef.current = 0;
    setCountdownComplete(false);
    setNotes('');
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

  const setGroupId = useCallback((groupId: string | null) => {
    pendingGroupId = groupId;
  }, []);

  // Timer tick effect - recalculates from actual timestamp each tick
  useEffect(() => {
    if (config.state === 'running') {
      const updateElapsed = () => {
        if (startTimeRef.current) {
          const startMs = new Date(startTimeRef.current).getTime();
          const now = Date.now();
          const newElapsed = pausedElapsedRef.current + Math.floor((now - startMs) / 1000);

          setConfig(prev => {
            // Check if countdown just hit zero (for notification purposes)
            if (prev.mode === 'countdown' && prev.elapsed < prev.duration && newElapsed >= prev.duration) {
              setCountdownComplete(true);
            }

            return { ...prev, elapsed: newElapsed };
          });
        }
      };

      // Update immediately when starting
      updateElapsed();

      // Then update every second
      intervalRef.current = setInterval(updateElapsed, 1000);

      // Also update when tab becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          updateElapsed();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearTimerInterval();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
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
    notes,
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
    setGroupId,
    setNotes,
    formatTime,
  };
}
