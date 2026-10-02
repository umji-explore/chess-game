/**
 * types.ts
 * 체스 게임 전체에서 사용되는 공통 타입 및 열거형 정의.
 * 이 파일은 UI, 엔진, AI 모두에서 공유됩니다.
 */

// ─────────────────────────────────────────────
// 기본 열거형
// ─────────────────────────────────────────────

/** 말의 색상 */
export enum Color {
  White = 'w',
  Black = 'b',
}

/** 말의 종류 */
export enum PieceType {
  King   = 'K',
  Queen  = 'Q',
  Rook   = 'R',
  Bishop = 'B',
  Knight = 'N',
  Pawn   = 'P',
}

/** 게임 상태 */
export enum GameStatus {
  Playing     = 'playing',
  Check       = 'check',
  Checkmate   = 'checkmate',
  Stalemate   = 'stalemate',
  DrawFiftyMove    = 'draw_fifty_move',
  DrawRepetition   = 'draw_repetition',
  DrawInsufficientMaterial = 'draw_insufficient_material',
  DrawAgreement    = 'draw_agreement',
}

/** 특수 이동 종류 */
export enum MoveFlag {
  Normal         = 0,
  DoublePawnPush = 1,   // 폰 두 칸 전진
  EnPassant      = 2,   // 앙파상
  CastleKingside = 3,   // 킹사이드 캐슬링
  CastleQueenside= 4,   // 퀸사이드 캐슬링
  PromoteQueen   = 5,
  PromoteRook    = 6,
  PromoteBishop  = 7,
  PromoteKnight  = 8,
}

/** 게임 모드 */
export enum GameMode {
  HumanVsHuman = 'hvh',
  HumanVsAI   = 'hvai',
  AIVsHuman   = 'aivh',
}

/** AI 레벨 */
export enum AILevel {
  Random   = 'random',   // 랜덤 합법 수
  Easy     = 'easy',     // 미니맥스 깊이 1
  Medium   = 'medium',   // 미니맥스 깊이 3
  Hard     = 'hard',     // 미니맥스 깊이 5 (알파베타)
}

// ─────────────────────────────────────────────
// 위치 타입
// ─────────────────────────────────────────────

/**
 * 보드 위치 (0-indexed, row: 0=rank8, col: 0=file a)
 * rank = 7 - row (체스 표기: rank1 = row7)
 */
export interface Position {
  row: number; // 0~7
  col: number; // 0~7
}

// ─────────────────────────────────────────────
// 말 타입
// ─────────────────────────────────────────────

export interface Piece {
  type: PieceType;
  color: Color;
  /** 고유 ID (UI 애니메이션 추적용) */
  id: string;
}

// ─────────────────────────────────────────────
// 이동 타입
// ─────────────────────────────────────────────

export interface Move {
  from: Position;
  to: Position;
  flag: MoveFlag;
  /** 프로모션 시 변환할 말 종류 (PromoteXxx 플래그일 때 사용) */
  promoteTo?: PieceType;
  /** 앙파상 시 잡히는 폰의 위치 */
  capturePos?: Position;
  /** 이동 전 잡힌 말 (Undo 복원용) */
  capturedPiece?: Piece;
  /** SAN (Standard Algebraic Notation) 표기 (기보용) */
  san?: string;
}

// ─────────────────────────────────────────────
// 캐슬링 권한
// ─────────────────────────────────────────────

export interface CastlingRights {
  whiteKingside:  boolean;
  whiteQueenside: boolean;
  blackKingside:  boolean;
  blackQueenside: boolean;
}

// ─────────────────────────────────────────────
// 게임 이벤트 (Observer 패턴 — UI 연동용)
// ─────────────────────────────────────────────

export type GameEventType =
  | 'move'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'promotion_required'
  | 'turn_changed'
  | 'game_reset'
  | 'undo'
  | 'redo';

export interface GameEvent {
  type: GameEventType;
  payload?: unknown;
}

// ─────────────────────────────────────────────
// 유틸리티 타입
// ─────────────────────────────────────────────

/** 8x8 보드 셀. null = 빈 칸 */
export type BoardMatrix = (Piece | null)[][];

/** 상대 색상 반환 */
export function oppositeColor(color: Color): Color {
  return color === Color.White ? Color.Black : Color.White;
}

/** 말 가치 (센티폰 단위, 평가 함수용) */
export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.Pawn]:   100,
  [PieceType.Knight]: 320,
  [PieceType.Bishop]: 330,
  [PieceType.Rook]:   500,
  [PieceType.Queen]:  900,
  [PieceType.King]:   20000,
};
