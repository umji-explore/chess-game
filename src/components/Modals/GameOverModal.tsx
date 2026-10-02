/**
 * GameOverModal.tsx
 * 게임 종료 모달. 결과(승패/무승부)와 원인을 표시합니다.
 */

import React from 'react';
import { Color, GameStatus } from '../../core/types';
import { useGameStore } from '../../store/gameStore';

const STATUS_DETAIL: Record<string, string> = {
  checkmate: '체크메이트',
  stalemate: '스테일메이트',
  draw_fifty_move: '50수 규칙',
  draw_repetition: '3회 반복',
  draw_insufficient_material: '기물 부족',
};

export const GameOverModal: React.FC = () => {
  const { showGameOver, setShowGameOver, gameState, startNewGame, gameMode, aiLevel, aiColor } =
    useGameStore();

  if (!showGameOver || !gameState) return null;

  const { status, winner } = gameState;
  const isDraw = !winner;
  const detail = STATUS_DETAIL[status] ?? '';

  let title = '';
  let emoji = '';
  if (isDraw) {
    title = '무승부!';
    emoji = '🤝';
  } else {
    const winnerLabel = winner === Color.White ? '백(White)' : '흑(Black)';
    title = `${winnerLabel} 승리!`;
    emoji = winner === Color.White ? '👑' : '🏆';
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="게임 종료">
      <div className="modal game-over-modal">
        <div className="game-over-emoji">{emoji}</div>
        <h2 className="modal__title">{title}</h2>
        {detail && <p className="modal__subtitle">{detail}</p>}

        <div className="game-over-actions">
          <button
            className="btn btn--primary"
            onClick={() => {
              setShowGameOver(false);
              startNewGame(gameMode, aiLevel, aiColor);
            }}
            id="btn-new-game-modal"
          >
            ♟ 새 게임
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => setShowGameOver(false)}
            id="btn-close-gameover"
          >
            기보 보기
          </button>
        </div>
      </div>
    </div>
  );
};
