/**
 * ChessBoard.tsx
 * 체스판 전체 컴포넌트.
 * - 8×8 Square 배열 (배경/하이라이트)
 * - AnimatedPieceLayer (말 렌더링 + 이동 애니메이션)
 */

import React, { useRef, useEffect, useState } from 'react';
import { Square } from './Square';
import { AnimatedPieceLayer } from './AnimatedBoard';
import { useGameStore } from '../../store/gameStore';

export const ChessBoard: React.FC = () => {
  const boardFlipped = useGameStore(s => s.boardFlipped);
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSizePx, setCellSizePx] = useState(60);

  // 실제 렌더된 보드 크기에서 셀 크기 계산
  useEffect(() => {
    const update = () => {
      if (boardRef.current) {
        setCellSizePx(boardRef.current.clientWidth / 8);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boardRef}
      className="chessboard"
      role="grid"
      aria-label="체스 보드"
      style={{ position: 'relative' }}
    >
      {/* ── 칸 배경 레이어 ── */}
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => (
          <Square
            key={`${row}-${col}`}
            row={row}
            col={col}
            flipped={boardFlipped}
          />
        )),
      )}

      {/* ── 말 애니메이션 레이어 ── */}
      <AnimatedPieceLayer cellSizePx={cellSizePx} />
    </div>
  );
};
