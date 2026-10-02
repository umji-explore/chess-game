/**
 * PromotionModal.tsx
 * 폰 프로모션 선택 모달.
 * 퀸/룩/비숍/나이트 중 하나를 선택합니다.
 */

import React from 'react';
import { Color, PieceType } from '../../core/types';
import { ChessPiece } from '../Board/ChessPieces';
import { useGameStore } from '../../store/gameStore';

const PROMOTE_OPTIONS: { type: PieceType; label: string }[] = [
  { type: PieceType.Queen,  label: '퀸' },
  { type: PieceType.Rook,   label: '룩' },
  { type: PieceType.Bishop, label: '비숍' },
  { type: PieceType.Knight, label: '나이트' },
];

export const PromotionModal: React.FC = () => {
  const { pendingPromotion, submitPromotion } = useGameStore();

  if (!pendingPromotion) return null;

  const { color } = pendingPromotion;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="프로모션 선택">
      <div className="modal promotion-modal">
        <h2 className="modal__title">♙ 프로모션</h2>
        <p className="modal__subtitle">변환할 말을 선택하세요</p>
        <div className="promotion-options">
          {PROMOTE_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              className="promotion-option"
              onClick={() => submitPromotion(type)}
              title={label}
              id={`promote-${type.toLowerCase()}`}
            >
              <ChessPiece type={type} color={color} size={60} />
              <span className="promotion-option__label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
