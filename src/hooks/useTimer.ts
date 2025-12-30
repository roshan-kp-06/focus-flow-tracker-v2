import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerConfig, TimerMode, TimerState, WorkSession } from '@/types';
import { addSession } from '@/lib/storage';

const initialConfig: TimerConfig = {
  mode: 'countdown',
  duration: 60 * 60, // 1 hour default
  elapsed: 0,
  state: 'idle',
  taskName: '',
  projectIds: [],
};

export function useTimer() {
  const [config, setConfig] = useState<TimerConfig>(initialConfig);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(null);

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
    }));
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
    setMode,
    setDuration,
    setTaskName,
    setProjectIds,
    formatTime,
  };
}
