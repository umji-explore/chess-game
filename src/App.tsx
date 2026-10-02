/**
 * App.tsx
 * 루트 애플리케이션 컴포넌트.
 * - 레이아웃 조립 (헤더 / 보드 / 사이드바)
 * - 키보드 단축키 (Ctrl+Z Undo, Ctrl+Y Redo)
 * - 모달 레이어 관리
 */

import React, { useEffect } from 'react';
import { ChessBoard } from './components/Board/ChessBoard';
import { CapturedPieces } from './components/GameInfo/CapturedPieces';
import { GameStatusBar } from './components/GameInfo/GameStatus';
import { MoveHistory } from './components/GameInfo/MoveHistory';
import { ChessTimer } from './components/GameInfo/ChessTimer';
import { GameControls } from './components/Controls/GameControls';
import { PromotionModal } from './components/Modals/PromotionModal';
import { GameOverModal } from './components/Modals/GameOverModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { WelcomeModal } from './components/Modals/WelcomeModal';
import { useGameStore } from './store/gameStore';
import { Color } from './core/types';

function App() {
  const { undo, redo, theme, gameState } = useGameStore();

  // 키보드 단축키
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  return (
    <div className={`app theme--${theme}`}>
      {/* ── 헤더 ── */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">♛</span>
          <h1 className="logo-title">Chess</h1>
        </div>
        <GameStatusBar />
        <GameControls />
      </header>

      {/* ── 메인 ── */}
      <main className="app-main">
        {/* 보드 섹션 */}
        <section className="board-section" aria-label="체스 보드 영역">
          <ChessTimer color={Color.Black} />
          <CapturedPieces position="top" />
          <ChessBoard />
          <CapturedPieces position="bottom" />
          <ChessTimer color={Color.White} />
        </section>

        {/* 사이드바 */}
        {gameState && (
          <aside className="sidebar" aria-label="게임 정보">
            <MoveHistory />
          </aside>
        )}
      </main>

      {/* ── 모달 레이어 ── */}
      <WelcomeModal />
      <PromotionModal />
      <GameOverModal />
      <SettingsModal />
    </div>
  );
}

export default App;
