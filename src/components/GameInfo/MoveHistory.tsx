/**
 * MoveHistory.tsx
 * 기보(이동 이력) 사이드바 컴포넌트.
 * PGN 스타일로 수 번호 + SAN 표기를 표시합니다.
 * 수를 클릭하면 해당 시점으로 보드가 이동합니다.
 */

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const MoveHistory: React.FC = () => {
  const { gameState, jumpIndex, jumpToMove, exportPGN } = useGameStore();
  const moveHistory = gameState?.moveHistory ?? [];
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 최신 수일 때 자동 스크롤
  useEffect(() => {
    if (jumpIndex === null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [moveHistory.length, jumpIndex]);

  // 수를 쌍으로 묶기 (백 수 + 흑 수)
  const movePairs: Array<{ whiteIdx: number; blackIdx?: number; num: number }> = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      whiteIdx: i,
      blackIdx: i + 1 < moveHistory.length ? i + 1 : undefined,
    });
  }

  const isViewing = jumpIndex !== null;

  return (
    <div className="move-history">
      <div className="move-history__header">
        <h3 className="move-history__title">기보</h3>
        <div className="move-history__actions">
          {isViewing && (
            <button
              className="btn btn--icon move-history__back-btn"
              onClick={() => jumpToMove(null)}
              title="최신 수로 돌아가기"
            >
              ⏭ 최신
            </button>
          )}
          {moveHistory.length > 0 && (
            <button
              className="btn btn--icon"
              onClick={exportPGN}
              title="PGN 내보내기"
            >
              ↓
            </button>
          )}
        </div>
      </div>

      {isViewing && (
        <div className="move-history__viewing-notice">
          📖 기보 탐색 중 — 게임이 일시 정지됩니다
        </div>
      )}

      <div className="move-history__list" ref={listRef}>
        {movePairs.length === 0 ? (
          <p className="move-history__empty">게임을 시작하세요</p>
        ) : (
          movePairs.map(({ num, whiteIdx, blackIdx }) => {
            const whiteSan = moveHistory[whiteIdx]?.san ?? '?';
            const blackSan = blackIdx !== undefined ? moveHistory[blackIdx]?.san : undefined;
            const whiteActive = jumpIndex === whiteIdx;
            const blackActive = blackIdx !== undefined && jumpIndex === blackIdx;

            return (
              <div key={num} className="move-pair">
                <span className="move-pair__num">{num}.</span>
                <button
                  className={`move-pair__white move-pair__btn ${whiteActive ? 'move-pair__btn--active' : ''}`}
                  onClick={() => jumpToMove(whiteIdx)}
                  title={`${num}수 백: ${whiteSan}`}
                >
                  {whiteSan}
                </button>
                {blackSan !== undefined ? (
                  <button
                    className={`move-pair__black move-pair__btn ${blackActive ? 'move-pair__btn--active' : ''}`}
                    onClick={() => jumpToMove(blackIdx!)}
                    title={`${num}수 흑: ${blackSan}`}
                  >
                    {blackSan}
                  </button>
                ) : (
                  <span className="move-pair__black" />
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
