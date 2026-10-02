/**
 * ChessTimer.tsx
 * 체스 타이머 컴포넌트. 보드 위/아래에 렌더링됩니다.
 */

import React from 'react';
import { Color } from '../../core/types';
import { useTimerStore } from '../../store/timerStore';

interface ChessTimerProps {
  color: Color;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const ChessTimer: React.FC<ChessTimerProps> = ({ color }) => {
  const { whiteTime, blackTime, activeColor, timeControl, timeoutColor } = useTimerStore();

  if (timeControl === 'unlimited') return null;

  const seconds = color === Color.White ? whiteTime : blackTime;
  const isActive = activeColor === color;
  const isTimeout = timeoutColor === color;
  const isLow = seconds > 0 && seconds <= 30;

  return (
    <div
      className={[
        'chess-timer',
        isActive ? 'chess-timer--active' : '',
        isLow   ? 'chess-timer--low'    : '',
        isTimeout ? 'chess-timer--timeout' : '',
      ].join(' ')}
      aria-label={`${color === Color.White ? '백' : '흑'} 타이머: ${formatTime(seconds)}`}
    >
      <span className="chess-timer__label">
        {color === Color.White ? '⬜ 백' : '⬛ 흑'}
      </span>
      <span className="chess-timer__time">
        {isTimeout ? '0:00' : formatTime(seconds)}
      </span>
      {isTimeout && <span className="chess-timer__flag">🏳️</span>}
    </div>
  );
};
