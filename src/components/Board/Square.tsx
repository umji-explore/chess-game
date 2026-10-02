/**
 * Square.tsx
 * 체스판 개별 칸 컴포넌트.
 * - 클릭 이벤트, 하이라이트, 레이블 표시
 * - 말은 AnimatedPieceLayer에서 absolute로 렌더링하므로 여기서는 표시하지 않음
 */

import React from 'react';
import { Position, PieceType, GameStatus } from '../../core/types';
import { useGameStore } from '../../store/gameStore';

interface SquareProps {
  row: number;
  col: number;
  flipped: boolean;
}

export const Square: React.FC<SquareProps> = ({ row, col, flipped }) => {
  const {
    gameState,
    selectedPos,
    legalMoves,
    lastMove,
    selectSquare,
    jumpIndex,
  } = useGameStore();

  // 뒤집힌 보드 좌표 변환
  const boardRow = flipped ? 7 - row : row;
  const boardCol = flipped ? 7 - col : col;
  const pos: Position = { row: boardRow, col: boardCol };

  const piece = gameState?.board.getPiece(pos) ?? null;

  const isLight = (row + col) % 2 === 0;
  const isSelected = selectedPos?.row === boardRow && selectedPos?.col === boardCol;
  const isLegalTarget = legalMoves.some(m => m.to.row === boardRow && m.to.col === boardCol);
  const isLegalCapture = isLegalTarget && !!piece;
  const isLastMoveFrom = lastMove?.from.row === boardRow && lastMove?.from.col === boardCol;
  const isLastMoveTo   = lastMove?.to.row   === boardRow && lastMove?.to.col   === boardCol;

  // 체크 표시 (킹 위치)
  const cellPiece = gameState?.board.grid[boardRow]?.[boardCol];
  const isKingInCheck =
    cellPiece?.type === PieceType.King &&
    cellPiece?.color === gameState?.currentTurn &&
    (gameState?.status === GameStatus.Check || gameState?.status === GameStatus.Checkmate);

  // 기보 탐색 중이면 클릭 막음
  const handleClick = () => {
    if (jumpIndex !== null) return;
    selectSquare(pos);
  };

  // 파일/랭크 레이블
  const showRank = col === 0;
  const showFile = row === 7;
  const files = flipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  const classNames = [
    'square',
    isLight ? 'square--light' : 'square--dark',
    isSelected ? 'square--selected' : '',
    isLastMoveFrom || isLastMoveTo ? 'square--last-move' : '',
    isKingInCheck ? 'square--check' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={handleClick}
      role="button"
      aria-label={`${files[col]}${ranks[row]}`}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      {/* 파일 레이블 (하단 행) */}
      {showFile && (
        <span className={`label label--file ${isLight ? 'label--dark' : 'label--light'}`}>
          {files[col]}
        </span>
      )}

      {/* 랭크 레이블 (왼쪽 열) */}
      {showRank && (
        <span className={`label label--rank ${isLight ? 'label--dark' : 'label--light'}`}>
          {ranks[row]}
        </span>
      )}

      {/* 합법 수 도트 / 포획 링 */}
      {isLegalTarget && !isLegalCapture && (
        <div className="legal-dot" />
      )}
      {isLegalCapture && (
        <div className="legal-capture-ring" />
      )}
    </div>
  );
};
