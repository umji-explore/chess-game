/**
 * GameStatus.tsx
 * 현재 게임 상태 표시 (차례, 체크, 메이트, AI 생각 중 등).
 */

import React from 'react';
import { Color, GameStatus as GS } from '../../core/types';
import { useGameStore } from '../../store/gameStore';

export const GameStatusBar: React.FC = () => {
  const gameState  = useGameStore(s => s.gameState);
  const isAIThinking = useGameStore(s => s.isAIThinking);

  if (!gameState) {
    return (
      <div className="game-status">
        <span className="game-status__main">체스에 오신 것을 환영합니다 ♟</span>
      </div>
    );
  }

  const { status, currentTurn, winner } = gameState;

  const turnLabel  = currentTurn === Color.White ? '백(White)' : '흑(Black)';
  const turnSymbol = currentTurn === Color.White ? '⬜' : '⬛';

  let mainText = '';
  let subText  = '';
  let statusClass = '';

  if (status === GS.Checkmate) {
    const winnerLabel = winner === Color.White ? '백(White)' : '흑(Black)';
    mainText = `${winnerLabel} 승리!`;
    subText  = '체크메이트 🏆';
    statusClass = 'game-status--end';
  } else if (status === GS.Stalemate) {
    mainText = '무승부 — 스테일메이트';
    subText  = '🤝';
    statusClass = 'game-status--end';
  } else if (status === GS.DrawFiftyMove) {
    mainText = '무승부 — 50수 규칙';
    subText  = '🤝';
    statusClass = 'game-status--end';
  } else if (status === GS.DrawRepetition) {
    mainText = '무승부 — 3회 반복';
    subText  = '🤝';
    statusClass = 'game-status--end';
  } else if (status === GS.DrawInsufficientMaterial) {
    mainText = '무승부 — 기물 부족';
    subText  = '🤝';
    statusClass = 'game-status--end';
  } else if (status === GS.Check) {
    mainText = `${turnSymbol} ${turnLabel} 차례`;
    subText  = '⚠️ 체크!';
    statusClass = 'game-status--check';
  } else {
    mainText = `${turnSymbol} ${turnLabel} 차례`;
  }

  return (
    <div className={`game-status ${statusClass}`}>
      <span className="game-status__main">{mainText}</span>

      {/* AI 생각 중 표시 */}
      {isAIThinking && (
        <span className="ai-thinking">
          <span className="ai-thinking__label">AI 계산 중</span>
          <span className="ai-thinking__dots">
            <span className="ai-thinking__dot" />
            <span className="ai-thinking__dot" />
            <span className="ai-thinking__dot" />
          </span>
        </span>
      )}

      {/* 체크/종료 메시지 (AI 생각 중이 아닐 때) */}
      {!isAIThinking && subText && (
        <span className="game-status__sub">{subText}</span>
      )}
    </div>
  );
};
