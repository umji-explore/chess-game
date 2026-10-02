/**
 * SettingsModal.tsx
 * 설정 모달: 게임 모드, AI 레벨, 테마, 타이머, 보드 방향 설정.
 * 적용 시 새 게임을 시작합니다.
 */

import React, { useState } from 'react';
import { AILevel, GameMode } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
import { useTimerStore, TimeControl, TIME_CONTROLS } from '../../store/timerStore';

export const SettingsModal: React.FC = () => {
  const {
    showSettings,
    setShowSettings,
    gameMode,
    aiLevel,
    theme,
    setTheme,
    startNewGame,
    boardFlipped,
    flipBoard,
  } = useGameStore();
  const { timeControl, setTimeControl } = useTimerStore();

  const [localMode,    setLocalMode]    = useState<GameMode>(gameMode);
  const [localAiLevel, setLocalAiLevel] = useState<AILevel>(aiLevel);
  const [localTc,      setLocalTc]      = useState<TimeControl>(timeControl);

  if (!showSettings) return null;

  const handleApply = () => {
    setTimeControl(localTc);
    setShowSettings(false);
    startNewGame(localMode, localAiLevel);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="설정">
      <div className="modal settings-modal">
        <div className="modal__header">
          <h2 className="modal__title">⚙ 설정</h2>
          <button
            className="modal__close"
            onClick={() => setShowSettings(false)}
            aria-label="닫기"
            id="btn-close-settings"
          >
            ✕
          </button>
        </div>

        {/* 게임 모드 */}
        <div className="settings-section">
          <h3 className="settings-label">게임 모드</h3>
          <div className="radio-group">
            {[
              { value: GameMode.HumanVsHuman, label: '👥 사람 vs 사람', desc: '같은 기기에서 번갈아 플레이' },
              { value: GameMode.HumanVsAI,   label: '🤖 사람 vs AI',   desc: '내가 백, AI가 흑' },
              { value: GameMode.AIVsHuman,   label: '🤖 AI vs 사람',   desc: 'AI가 백, 내가 흑' },
            ].map(({ value, label, desc }) => (
              <label key={value} className="radio-label">
                <input
                  type="radio"
                  name="gameMode"
                  value={value}
                  checked={localMode === value}
                  onChange={() => setLocalMode(value)}
                  id={`mode-${value}`}
                />
                <span>
                  <span>{label}</span>
                  <span className="radio-desc">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* AI 레벨 (AI 모드만) */}
        {localMode !== GameMode.HumanVsHuman && (
          <div className="settings-section">
            <h3 className="settings-label">AI 레벨</h3>
            <div className="radio-group">
              {[
                { value: AILevel.Random, label: '🎲 입문',   desc: '랜덤하게 둡니다' },
                { value: AILevel.Easy,   label: '🌱 쉬움',   desc: '기초적인 전략' },
                { value: AILevel.Medium, label: '⚡ 보통',   desc: '미니맥스 깊이 3' },
                { value: AILevel.Hard,   label: '🔥 어려움', desc: '알파베타 깊이 5' },
              ].map(({ value, label, desc }) => (
                <label key={value} className="radio-label">
                  <input
                    type="radio"
                    name="aiLevel"
                    value={value}
                    checked={localAiLevel === value}
                    onChange={() => setLocalAiLevel(value)}
                    id={`level-${value}`}
                  />
                  <span>
                    <span>{label}</span>
                    <span className="radio-desc">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 시간 제한 */}
        <div className="settings-section">
          <h3 className="settings-label">시간 제한</h3>
          <div className="timer-cards">
            {(Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][]).map(
              ([value, cfg]) => (
                <button
                  key={value}
                  className={`timer-card ${localTc === value ? 'timer-card--active' : ''}`}
                  onClick={() => setLocalTc(value)}
                  id={`settings-timer-${value}`}
                >
                  {cfg.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* 테마 */}
        <div className="settings-section">
          <h3 className="settings-label">보드 테마</h3>
          <div className="theme-buttons">
            {([
              { key: 'classic', icon: '🟫', label: '클래식' },
              { key: 'dark',    icon: '⬛', label: '다크' },
              { key: 'wooden',  icon: '🪵', label: '우드' },
            ] as const).map(({ key, icon, label }) => (
              <button
                key={key}
                className={`theme-btn theme-btn--${key} ${theme === key ? 'theme-btn--active' : ''}`}
                onClick={() => setTheme(key)}
                id={`theme-${key}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* 기타 */}
        <div className="settings-section">
          <h3 className="settings-label">기타</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={boardFlipped}
              onChange={flipBoard}
              id="chk-flip"
            />
            보드 뒤집기 (흑 시점으로 보기)
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn btn--primary" onClick={handleApply} id="btn-apply-settings">
            ♟ 새 게임으로 적용
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => setShowSettings(false)}
            id="btn-cancel-settings"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

