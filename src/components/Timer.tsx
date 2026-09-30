import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import { audioManager } from '../game/AudioManager';

interface TimerProps {
  duration?: number; // seconds, default 30
  isPaused: boolean;
  onExpire: () => void;
  onTick?: (timeLeft: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  duration = 30,
  isPaused,
  onExpire,
  onTick,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const timeLeftRef = useRef<number>(duration);
  const lastTimeRef = useRef<number>(performance.now());
  const hasExpiredRef = useRef<boolean>(false);
  const lastWarnSecRef = useRef<number>(-1);

  // Reset when question changes
  useEffect(() => {
    setTimeLeft(duration);
    timeLeftRef.current = duration;
    lastTimeRef.current = performance.now();
    hasExpiredRef.current = false;
    lastWarnSecRef.current = -1;
  }, [duration]);

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (!isPaused && !hasExpiredRef.current) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
        const currentSeconds = Math.ceil(timeLeftRef.current);

        setTimeLeft(timeLeftRef.current);
        onTick?.(timeLeftRef.current);

        // Sound warning for last 5 seconds (5, 4, 3, 2, 1)
        if (currentSeconds <= 5 && currentSeconds > 0 && lastWarnSecRef.current !== currentSeconds) {
          lastWarnSecRef.current = currentSeconds;
          audioManager.playTimerWarning();
        }

        if (timeLeftRef.current <= 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpire();
          return;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [isPaused, onExpire, onTick]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  const isUrgent = timeLeft <= 6;
  const isCritical = timeLeft <= 3;

  return (
    <div className="w-full px-4 py-1.5 flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-400">
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
          <span>WAKTU</span>
        </div>
        <span
          className={`font-mono font-bold text-sm tracking-wider ${
            isCritical
              ? 'text-red-500 animate-ping'
              : isUrgent
              ? 'text-red-400 font-extrabold'
              : 'text-slate-200'
          }`}
        >
          {Math.ceil(timeLeft)}s
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full transition-all duration-100 ease-linear rounded-full ${
            isUrgent
              ? 'bg-gradient-to-r from-red-600 to-amber-500'
              : 'bg-gradient-to-r from-amber-400 to-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
