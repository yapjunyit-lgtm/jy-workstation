import { useTimerStore } from '../../stores/useTimerStore';
import { formatTimer } from '../../lib/utils';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function PomodoroTimer() {
  const {
    mode, isRunning, workMinutes, breakMinutes,
    remainingSeconds, isBreak, start, pause, reset,
  } = useTimerStore();

  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - progress);

  const toggleTimer = () => {
    if (mode === 'idle') {
      useTimerStore.getState().setMode('pomodoro');
      useTimerStore.getState().start();
    } else if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
  };

  const modeLabel = mode === 'idle'
    ? 'Ready'
    : isBreak
    ? 'Break'
    : 'Focus Mode';

  const modeColor = isBreak ? 'var(--info)' : 'var(--accent)';

  return (
    <div className="card-static flex flex-col items-center" style={{ minWidth: 160 }}>
      <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
        Pomodoro
      </h3>

      {/* SVG Ring */}
      <div className="relative" style={{ width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={modeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        {/* Timer text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {formatTimer(remainingSeconds)}
          </span>
          <span className="text-[10px]" style={{ color: modeColor }}>
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 mt-3">
        <button onClick={toggleTimer} className="btn-sakura btn-secondary btn-sm">
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button onClick={handleReset} className="btn-sakura btn-ghost btn-sm">
          <RotateCcw size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px]" style={{ color: mode === 'pomodoro' && !isBreak ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          {workMinutes}m work
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>·</span>
        <span className="text-[10px]" style={{ color: isBreak ? 'var(--info)' : 'var(--text-tertiary)' }}>
          {breakMinutes}m break
        </span>
      </div>
    </div>
  );
}
