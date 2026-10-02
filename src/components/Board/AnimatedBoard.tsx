/**
 * AnimatedBoard.tsx
 * 이동·잡힘 애니메이션을 담당하는 오버레이 레이어.
 *
 * 접근 방식:
 * - 보드 위에 absolute 포지션 레이어
 * - 각 말을 translate(x, y) CSS로 배치
 * - 이동 시 `transition: transform 0.22s cubic-bezier`로 슬라이딩
 * - 잡힘 시 scale(0)+opacity(0) 애니메이션 후 제거
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChessPiece } from './ChessPieces';
import { useGameStore } from '../../store/gameStore';
import { Color, PieceType } from '../../core/types';

interface PieceState {
  id: string;
  type: PieceType;
  color: Color;
  /** 실제 보드 위치 */
  row: number;
  col: number;
  /** 애니메이션 목적지 위치 (이동 시 변경) */
  animRow: number;
  animCol: number;
  /** 잡혀서 사라지는 중 */
  dying: boolean;
}

export const AnimatedPieceLayer: React.FC<{ cellSizePx: number }> = ({ cellSizePx }) => {
  const { gameState, boardFlipped, lastMove } = useGameStore();
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const prevPiecesRef = useRef<PieceState[]>([]);
  const prevMoveCountRef = useRef<number>(-1);

  const buildFromBoard = useCallback((): PieceState[] => {
    if (!gameState) return [];
    const result: PieceState[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = gameState.board.grid[row]?.[col];
        if (p) {
          result.push({
            id: p.id,
            type: p.type,
            color: p.color,
            row, col,
            animRow: row,
            animCol: col,
            dying: false,
          });
        }
      }
    }
    return result;
  }, [gameState]);

  useEffect(() => {
    if (!gameState) return;

    const moveCount = gameState.moveHistory.length;

    // 게임 리셋 / 되돌리기 / 기보 점프 → 즉시 재빌드
    if (moveCount <= prevMoveCountRef.current || !lastMove) {
      const fresh = buildFromBoard();
      setPieces(fresh);
      prevPiecesRef.current = fresh;
      prevMoveCountRef.current = moveCount;
      return;
    }

    prevMoveCountRef.current = moveCount;
    const move = lastMove;

    // 이전 상태에서 이동한 말 식별 (from 위치)
    const movedPrev = prevPiecesRef.current.find(
      p => p.row === move.from.row && p.col === move.from.col && !p.dying
    );
    const capturedId = move.capturedPiece?.id;

    // 이전 상태를 베이스로 애니메이션 구성
    const animated: PieceState[] = prevPiecesRef.current
      .filter(p => !p.dying)           // 이미 사라진 말 제외
      .map(prev => {
        if (capturedId && prev.id === capturedId) {
          return { ...prev, dying: true };
        }
        if (movedPrev && prev.id === movedPrev.id) {
          // 말을 목적지로 이동
          return { ...prev, animRow: move.to.row, animCol: move.to.col };
        }
        return prev;
      });

    // 새 보드에만 있는 말 (프로모션 퀸 등)
    const existingIds = new Set(animated.map(p => p.id));
    const nextBoard = buildFromBoard();
    nextBoard.forEach(n => {
      if (!existingIds.has(n.id)) animated.push(n);
    });

    setPieces(animated);

    // dying → 제거, 이후 최종 상태로 정착
    const t1 = setTimeout(() => {
      setPieces(prev => prev.filter(p => !p.dying));
    }, 300);
    const t2 = setTimeout(() => {
      const final = buildFromBoard();
      setPieces(final);
      prevPiecesRef.current = final;
    }, 350);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.moveHistory.length, boardFlipped]);

  if (cellSizePx === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {pieces.map(p => {
        const dispCol = boardFlipped ? 7 - p.animCol : p.animCol;
        const dispRow = boardFlipped ? 7 - p.animRow : p.animRow;
        const x = dispCol * cellSizePx;
        const y = dispRow * cellSizePx;

        return (
          <div
            key={p.id}
            className={`anim-piece${p.dying ? ' anim-piece--dying' : ''}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width:  cellSizePx,
              height: cellSizePx,
              transform: `translate(${x}px, ${y}px)`,
              transition: p.dying
                ? 'none'
                : 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <ChessPiece type={p.type} color={p.color} size={Math.round(cellSizePx * 0.86)} />
          </div>
        );
      })}
    </div>
  );
};
