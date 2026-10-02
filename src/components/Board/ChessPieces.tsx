/**
 * ChessPieces.tsx
 * 프리미엄 3D 스타일 인라인 SVG 체스 말.
 * 그라디언트, 광택, 입체감을 활용한 고급 디자인.
 */

import React from 'react';
import { Color, PieceType } from '../../core/types';

interface PieceSVGProps {
  color: Color;
  size?: number;
}

/* ── 공통 색상 토큰 ── */
const W = {
  body:    '#f5f0e8',
  bodyEnd: '#c8bfa8',
  shine:   'rgba(255,255,255,0.85)',
  shadow:  'rgba(0,0,0,0.18)',
  line:    '#7a6a50',
  dark:    '#8b7355',
};
const B = {
  body:    '#3a3028',
  bodyEnd: '#1a1510',
  shine:   'rgba(255,255,255,0.22)',
  shadow:  'rgba(0,0,0,0.55)',
  line:    '#6b5d4f',
  dark:    '#2c2520',
};

function tok(color: Color) { return color === Color.White ? W : B; }

/* ── 공통 defs (그라디언트 · 드롭섀도) ── */
function Defs({ id, color }: { id: string; color: Color }) {
  const t = tok(color);
  const isW = color === Color.White;
  return (
    <defs>
      <radialGradient id={`body-${id}`} cx="38%" cy="30%" r="65%">
        <stop offset="0%"   stopColor={t.body} />
        <stop offset="100%" stopColor={t.bodyEnd} />
      </radialGradient>
      <radialGradient id={`shine-${id}`} cx="35%" cy="20%" r="50%">
        <stop offset="0%"   stopColor={t.shine} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <radialGradient id={`base-${id}`} cx="50%" cy="30%" r="70%">
        <stop offset="0%"   stopColor={isW ? '#ddd5c0' : '#4a3e35'} />
        <stop offset="100%" stopColor={isW ? '#a89878' : '#1e1915'} />
      </radialGradient>
      <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
      </filter>
    </defs>
  );
}

/* ── 킹 ── */
export const KingSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `k${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        {/* 베이스 */}
        <ellipse cx="22.5" cy="40" rx="12" ry="2.5" fill={`url(#base-${id})`} />
        {/* 몸통 */}
        <path
          d="M13 37 Q10 30 13 22 Q17 14 22.5 12 Q28 14 32 22 Q35 30 32 37 Z"
          fill={`url(#body-${id})`}
          stroke={t.line} strokeWidth="0.8"
        />
        {/* 가슴 줄무늬 */}
        <path d="M14 32 Q22.5 30 31 32" stroke={t.dark} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <path d="M13.5 35 Q22.5 33 31.5 35" stroke={t.dark} strokeWidth="0.8" fill="none" opacity="0.6"/>
        {/* 십자가 세로 */}
        <path d="M22.5 4 V12" stroke={t.line} strokeWidth="2.2" strokeLinecap="round" />
        {/* 십자가 가로 */}
        <path d="M19 7 H26" stroke={t.line} strokeWidth="2.2" strokeLinecap="round" />
        {/* 광택 */}
        <path
          d="M15 20 Q17 14 22.5 12 Q25 13 27 16 Q22 14 17 20 Z"
          fill={`url(#shine-${id})`} opacity="0.9"
        />
      </g>
    </svg>
  );
};

/* ── 퀸 ── */
export const QueenSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `q${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        <ellipse cx="22.5" cy="40" rx="12" ry="2.5" fill={`url(#base-${id})`} />
        {/* 몸통 */}
        <path
          d="M12 37 Q9 26 13 18 Q18 10 22.5 9 Q27 10 32 18 Q36 26 33 37 Z"
          fill={`url(#body-${id})`}
          stroke={t.line} strokeWidth="0.8"
        />
        {/* 왕관 거치대 */}
        <path
          d="M13 20 Q17 13 22.5 9 Q28 13 32 20 L29 18 L22.5 11 L16 18 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8"
        />
        {/* 왕관 구슬 */}
        {[6, 14, 22.5, 31, 39].map((cx, i) => (
          <circle key={i} cx={cx} cy={i === 2 ? 8 : 10} r="2.2"
            fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        ))}
        <path d="M14 32 Q22.5 30 31 32" stroke={t.dark} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <path d="M13.5 35 Q22.5 33 31.5 35" stroke={t.dark} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <path
          d="M14 21 Q17 13 22.5 10 Q25 12 27 16 Q22 13 17 21 Z"
          fill={`url(#shine-${id})`} opacity="0.9"
        />
      </g>
    </svg>
  );
};

/* ── 룩 ── */
export const RookSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `r${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        <ellipse cx="22.5" cy="40" rx="12" ry="2.5" fill={`url(#base-${id})`} />
        {/* 몸통 */}
        <rect x="14" y="20" width="17" height="18" rx="1.5"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        {/* 흉부 */}
        <rect x="12" y="33" width="21" height="5" rx="1"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        {/* 총안 */}
        <rect x="14" y="10" width="4" height="10" rx="1"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        <rect x="20.5" y="10" width="4" height="10" rx="1"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        <rect x="27" y="10" width="4" height="10" rx="1"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        {/* 총안 연결 */}
        <rect x="12" y="18" width="21" height="3" rx="0.5"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.6" />
        {/* 광택 */}
        <rect x="15" y="11" width="5" height="8" rx="1"
          fill={`url(#shine-${id})`} opacity="0.7" />
      </g>
    </svg>
  );
};

/* ── 비숍 ── */
export const BishopSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `b${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        <ellipse cx="22.5" cy="40" rx="12" ry="2.5" fill={`url(#base-${id})`} />
        {/* 몸통 */}
        <path
          d="M15 38 Q12 28 14 20 Q17 11 22.5 8 Q28 11 31 20 Q33 28 30 38 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8"
        />
        {/* 꼭대기 볼 */}
        <circle cx="22.5" cy="7" r="3.5" fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        {/* 허리 밴드 */}
        <ellipse cx="22.5" cy="27" rx="7" ry="2" fill={t.dark} opacity="0.4" />
        {/* 베이스 */}
        <ellipse cx="22.5" cy="37" rx="9" ry="2" fill={`url(#base-${id})`} stroke={t.line} strokeWidth="0.6" />
        {/* 광택 */}
        <path
          d="M16 18 Q18 10 22.5 8 Q25 10 26 14 Q22 11 18 18 Z"
          fill={`url(#shine-${id})`} opacity="0.9"
        />
        {/* 중심선 */}
        <path d="M22.5 8 V 25" stroke={t.dark} strokeWidth="0.7" opacity="0.5" />
      </g>
    </svg>
  );
};

/* ── 나이트 ── */
export const KnightSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `n${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        <ellipse cx="22.5" cy="40" rx="12" ry="2.5" fill={`url(#base-${id})`} />
        {/* 말 몸통 + 머리 */}
        <path
          d="M11 38 Q10 30 14 25 Q14 20 12 16 Q13 12 17 10 Q19 8 22 8 Q28 8 31 13 Q34 19 33 28 Q33 35 34 38 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.9"
        />
        {/* 갈기 */}
        <path
          d="M12 16 Q10 12 13 9 Q16 7 20 8 Q16 10 15 14 Q14 18 14 22 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.7"
          opacity="0.9"
        />
        {/* 코 */}
        <ellipse cx="14" cy="18" rx="3" ry="4" fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.7" />
        {/* 눈 */}
        <circle cx="16" cy="13" r="1.8" fill={t.line} />
        <circle cx="16.6" cy="12.5" r="0.6" fill="rgba(255,255,255,0.7)" />
        {/* 콧구멍 */}
        <circle cx="13" cy="19.5" r="0.9" fill={t.dark} opacity="0.7" />
        {/* 베이스 */}
        <ellipse cx="22.5" cy="37.5" rx="10" ry="2" fill={`url(#base-${id})`} stroke={t.line} strokeWidth="0.6" />
        {/* 광택 */}
        <path
          d="M14 10 Q19 8 23 9 Q25 11 24 15 Q20 10 15 14 Z"
          fill={`url(#shine-${id})`} opacity="0.8"
        />
      </g>
    </svg>
  );
};

/* ── 폰 ── */
export const PawnSVG: React.FC<PieceSVGProps> = ({ color, size = 45 }) => {
  const t = tok(color);
  const id = `p${color}`;
  return (
    <svg viewBox="0 0 45 45" width={size} height={size}>
      <Defs id={id} color={color} />
      <g filter={`url(#shadow-${id})`}>
        <ellipse cx="22.5" cy="40" rx="10" ry="2.2" fill={`url(#base-${id})`} />
        {/* 몸통 */}
        <path
          d="M16 37 Q14 30 16 26 Q18 22 22.5 21 Q27 22 29 26 Q31 30 29 37 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8"
        />
        {/* 목 */}
        <path
          d="M19 21 Q20 17 22.5 16 Q25 17 26 21 Q24 20 22.5 20 Q21 20 19 21 Z"
          fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.7"
        />
        {/* 머리 */}
        <circle cx="22.5" cy="13" r="5" fill={`url(#body-${id})`} stroke={t.line} strokeWidth="0.8" />
        {/* 베이스 */}
        <ellipse cx="22.5" cy="36.5" rx="8" ry="1.8" fill={`url(#base-${id})`} stroke={t.line} strokeWidth="0.6" />
        {/* 광택 */}
        <ellipse cx="20.5" cy="11" rx="2.5" ry="2" fill={`url(#shine-${id})`} opacity="0.85" />
        <path
          d="M17 27 Q19 23 22.5 22 Q24 23 25 26 Q22 24 19 27 Z"
          fill={`url(#shine-${id})`} opacity="0.7"
        />
      </g>
    </svg>
  );
};

/* ── 통합 컴포넌트 ── */
export interface ChessPieceProps {
  type: PieceType;
  color: Color;
  size?: number;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, size = 45 }) => {
  const props = { color, size };
  switch (type) {
    case PieceType.King:   return <KingSVG   {...props} />;
    case PieceType.Queen:  return <QueenSVG  {...props} />;
    case PieceType.Rook:   return <RookSVG   {...props} />;
    case PieceType.Bishop: return <BishopSVG {...props} />;
    case PieceType.Knight: return <KnightSVG {...props} />;
    case PieceType.Pawn:   return <PawnSVG   {...props} />;
  }
};
