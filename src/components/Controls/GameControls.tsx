/**
 * GameControls.tsx
 * 게임 컨트롤 버튼들: 새 게임, Undo, Redo, 보드 뒤집기, PGN 내보내기, 설정.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const GameControls: React.FC = () => {
  const { undo, redo, flipBoard, exportPGN, setShowSettings, startNewGame, gameMode, aiLevel, aiColor } =
    useGameStore();

  return (
    <div className="game-controls">
      <button
        className="btn btn--primary"
        onClick={() => startNewGame(gameMode, aiLevel, aiColor)}
        title="새 게임 시작"
        id="btn-new-game"
      >
        ♟ 새 게임
      </button>

      <div className="btn-group">
        <button
          className="btn btn--secondary"
          onClick={undo}
          title="되돌리기 (Ctrl+Z)"
          id="btn-undo"
        >
          ↩ 되돌리기
        </button>
        <button
          className="btn btn--secondary"
          onClick={redo}
          title="다시하기 (Ctrl+Y)"
          id="btn-redo"
        >
          ↪ 다시하기
        </button>
      </div>

      <div className="btn-group">
        <button
          className="btn btn--secondary"
          onClick={flipBoard}
          title="보드 뒤집기"
          id="btn-flip"
        >
          ⇅ 뒤집기
        </button>
        <button
          className="btn btn--secondary"
          onClick={exportPGN}
          title="PGN 내보내기"
          id="btn-pgn"
        >
          ↓ PGN
        </button>
      </div>

      <button
        className="btn btn--icon"
        onClick={() => setShowSettings(true)}
        title="설정"
        id="btn-settings"
      >
        ⚙
      </button>
    </div>
  );
};
