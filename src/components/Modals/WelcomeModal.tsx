/**
 * WelcomeModal.tsx
 * 앱 시작 시 표시되는 웰컴 모달.
 * 게임 모드(사람 vs 사람 / 사람 vs AI)와 AI 레벨을 선택합니다.
 */

import React, { useState } from 'react';
import { AILevel, Color, GameMode } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
import { useTimerStore, TimeControl, TIME_CONTROLS } from '../../store/timerStore';

const AI_LEVEL_INFO: Record<AILevel, { label: string; desc: string; emoji: string }> = {
  [AILevel.Random]: { label: '입문',   desc: '랜덤하게 둡니다',             emoji: '🎲' },
  [AILevel.Easy]:   { label: '쉬움',   desc: '기초적인 전략을 사용합니다',  emoji: '🌱' },
  [AILevel.Medium]: { label: '보통',   desc: '중급 수준의 AI입니다',        emoji: '⚡' },
  [AILevel.Hard]:   { label: '어려움', desc: '강력한 알파베타 탐색을 합니다', emoji: '🔥' },
};

export const WelcomeModal: React.FC = () => {
  const { showWelcome, startNewGame } = useGameStore();
  const { setTimeControl } = useTimerStore();
  const [mode,    setMode]    = useState<GameMode>(GameMode.HumanVsHuman);
  const [level,   setLevel]   = useState<AILevel>(AILevel.Medium);
  const [tc,      setTc]      = useState<TimeControl>('unlimited');

  if (!showWelcome) return null;

  const handleStart = () => {
    setTimeControl(tc);
    startNewGame(mode, level, Color.Black);
  };

  return (
    <div className="modal-overlay welcome-overlay" role="dialog" aria-modal="true" aria-label="새 게임 시작">
      <div className="modal welcome-modal">
        {/* 헤더 */}
        <div className="welcome-header">
          <div className="welcome-piece-row">
            <span>♜</span><span>♞</span><span>♝</span>
            <span className="welcome-king">♛</span>
            <span>♝</span><span>♞</span><span>♜</span>
          </div>
          <h2 className="welcome-title">Chess</h2>
          <p className="welcome-subtitle">국제 표준 체스 — 모든 규칙 완전 지원</p>
        </div>

        {/* 모드 선택 */}
        <div className="settings-section">
          <h3 className="settings-label">게임 모드</h3>
          <div className="mode-cards">
            {[
              { value: GameMode.HumanVsHuman, emoji: '👥', title: '사람 vs 사람', desc: '같은 기기에서 번갈아 플레이' },
              { value: GameMode.HumanVsAI,   emoji: '🤖', title: '사람 vs AI',   desc: '내가 백, AI가 흑' },
              { value: GameMode.AIVsHuman,   emoji: '🤖', title: 'AI vs 사람',   desc: 'AI가 백, 내가 흑' },
            ].map(({ value, emoji, title, desc }) => (
              <button
                key={value}
                className={`mode-card ${mode === value ? 'mode-card--active' : ''}`}
                onClick={() => setMode(value)}
                id={`mode-card-${value}`}
              >
                <span className="mode-card__emoji">{emoji}</span>
                <span className="mode-card__title">{title}</span>
                <span className="mode-card__desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI 레벨 선택 (AI 모드일 때만) */}
        {mode !== GameMode.HumanVsHuman && (
          <div className="settings-section">
            <h3 className="settings-label">AI 레벨</h3>
            <div className="level-cards">
              {(Object.entries(AI_LEVEL_INFO) as [AILevel, typeof AI_LEVEL_INFO[AILevel]][]).map(
                ([value, info]) => (
                  <button
                    key={value}
                    className={`level-card ${level === value ? 'level-card--active' : ''}`}
                    onClick={() => setLevel(value)}
                    id={`level-card-${value}`}
                  >
                    <span className="level-card__emoji">{info.emoji}</span>
                    <span className="level-card__label">{info.label}</span>
                    <span className="level-card__desc">{info.desc}</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 타이머 설정 */}
        <div className="settings-section">
          <h3 className="settings-label">시간 제한</h3>
          <div className="timer-cards">
            {(Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][]).map(
              ([value, cfg]) => (
                <button
                  key={value}
                  className={`timer-card ${tc === value ? 'timer-card--active' : ''}`}
                  onClick={() => setTc(value)}
                  id={`timer-card-${value}`}
                >
                  {cfg.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          className="btn btn--primary welcome-start-btn"
          onClick={handleStart}
          id="btn-welcome-start"
        >
          ♟ 게임 시작
        </button>

        {/* 기능 요약 */}
        <div className="welcome-features">
          <span>✓ 캐슬링</span>
          <span>✓ 앙파상</span>
          <span>✓ 프로모션</span>
          <span>✓ PGN 저장</span>
          <span>✓ 되돌리기</span>
        </div>
      </div>
    </div>
  );
};
