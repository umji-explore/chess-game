/**
 * CapturedPieces.tsx
 * 잡힌 말 표시 컴포넌트.
 * 보드 위/아래에 각 진영이 잡은 말을 아이콘으로 표시하고,
 * 점수 차이를 표시합니다.
 */

import React from 'react';
import { Color, Piece, PieceType, PIECE_VALUES } from '../../core/types';
import { ChessPiece } from '../Board/ChessPieces';
import { useGameStore } from '../../store/gameStore';

interface CapturedGroupProps {
  pieces: Piece[];
  color: Color; // 잡은 측 색상
}

const ORDER: PieceType[] = [
  PieceType.Queen,
  PieceType.Rook,
  PieceType.Bishop,
  PieceType.Knight,
  PieceType.Pawn,
];

const CapturedGroup: React.FC<CapturedGroupProps> = ({ pieces, color }) => {
  const sorted = [...pieces].sort(
    (a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type),
  );
  const score = pieces.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);

  return (
    <div className="captured-group">
      <div className="captured-pieces">
        {sorted.map((p, i) => (
          <div key={`${p.id}-${i}`} className="captured-piece">
          <ChessPiece type={p.type} color={p.color} size={24} />
          </div>
        ))}
      </div>
      {score > 0 && <span className="captured-score">+{Math.round(score / 100)}</span>}
    </div>
  );
};

export const CapturedPieces: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const gameState = useGameStore(s => s.gameState);
  const boardFlipped = useGameStore(s => s.boardFlipped);

  if (!gameState) return null;

  // top = 상대방, bottom = 나 (보드 방향에 따라 다름)
  const isFlipped = boardFlipped;

  // top 위치: 흑 플레이어 정보 (또는 뒤집혔으면 백)
  // bottom 위치: 백 플레이어 정보 (또는 뒤집혔으면 흑)
  const showBlackInfo = (position === 'top' && !isFlipped) || (position === 'bottom' && isFlipped);

  const capturedByThisPlayer = showBlackInfo
    ? gameState.capturedByBlack   // 흑이 잡은 백 말
    : gameState.capturedByWhite;  // 백이 잡은 흑 말

  const playerColor = showBlackInfo ? Color.Black : Color.White;
  const playerLabel = showBlackInfo ? '흑 (Black)' : '백 (White)';

  return (
    <div className={`player-bar player-bar--${position}`}>
      <div className="player-info">
        <div className={`player-dot player-dot--${showBlackInfo ? 'black' : 'white'}`} />
        <span className="player-label">{playerLabel}</span>
      </div>
      <CapturedGroup pieces={capturedByThisPlayer} color={playerColor} />
    </div>
  );
};
