/**
 * GameState.ts
 * 게임 전체 상태 컨테이너 (보드 외부 정보).
 * - 이동 이력 (기보)
 * - FEN 이력 (3회 반복 무승부 판정용)
 * - 잡힌 말 목록
 * - 게임 상태 (플레이 중 / 체크메이트 등)
 */

import { Color, GameStatus, Move, Piece } from './types';
import { Board } from './Board';

export interface GameState {
  /** 현재 보드 */
  board: Board;

  /** 현재 차례 */
  currentTurn: Color;

  /** 이동 이력 (순서대로) */
  moveHistory: Move[];

  /** 각 이동 후 FEN 기록 (3회 반복 판정용) */
  fenHistory: string[];

  /** 잡힌 흰색 말 (흑이 잡음) */
  capturedByBlack: Piece[];

  /** 잡힌 검은색 말 (백이 잡음) */
  capturedByWhite: Piece[];

  /** 게임 상태 */
  status: GameStatus;

  /** 승자 (없으면 null) */
  winner: Color | null;
}

/** 초기 게임 상태 생성 */
export function createInitialGameState(): GameState {
  const board = Board.createInitial();
  return {
    board,
    currentTurn: Color.White,
    moveHistory: [],
    fenHistory: [board.toFEN()],
    capturedByBlack: [],
    capturedByWhite: [],
    status: GameStatus.Playing,
    winner: null,
  };
}

/** 게임 상태 깊은 복사 (AI 탐색용) */
export function cloneGameState(state: GameState): GameState {
  return {
    board: state.board.clone(),
    currentTurn: state.currentTurn,
    moveHistory: [...state.moveHistory],
    fenHistory: [...state.fenHistory],
    capturedByBlack: [...state.capturedByBlack],
    capturedByWhite: [...state.capturedByWhite],
    status: state.status,
    winner: state.winner,
  };
}
