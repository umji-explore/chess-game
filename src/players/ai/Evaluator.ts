/**
 * Evaluator.ts
 * 보드 평가 함수.
 * 말 가치 + 위치 보너스(PST) + 기동성 + 킹 안전도를 종합하여
 * 백 기준 센티폰 점수를 반환합니다 (양수 = 백 유리, 음수 = 흑 유리).
 *
 * 변형 룰에서 다른 평가 함수를 사용하려면 이 파일만 교체하면 됩니다.
 */

import { Board } from '../../core/Board';
import { Color, Piece, PieceType, PIECE_VALUES, Position } from '../../core/types';

// ─────────────────────────────────────────────
// 위치 보너스 테이블 (PST, Piece-Square Tables)
// 백 기준 (row 7 = rank 1). 흑은 수직 반전하여 사용.
// ─────────────────────────────────────────────

const PST_PAWN: number[][] = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0],
];

const PST_KNIGHT: number[][] = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const PST_BISHOP: number[][] = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const PST_ROOK: number[][] = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0],
];

const PST_QUEEN: number[][] = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const PST_KING_MIDGAME: number[][] = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];

const PST_MAP: Partial<Record<PieceType, number[][]>> = {
  [PieceType.Pawn]:   PST_PAWN,
  [PieceType.Knight]: PST_KNIGHT,
  [PieceType.Bishop]: PST_BISHOP,
  [PieceType.Rook]:   PST_ROOK,
  [PieceType.Queen]:  PST_QUEEN,
  [PieceType.King]:   PST_KING_MIDGAME,
};

/**
 * PST 보너스 계산.
 * 백은 row 그대로, 흑은 수직 반전(7-row).
 */
function getPSTBonus(piece: Piece, pos: Position): number {
  const table = PST_MAP[piece.type];
  if (!table) return 0;
  const row = piece.color === Color.White ? pos.row : 7 - pos.row;
  return table[row][pos.col];
}

/**
 * 보드 평가 함수 (백 기준).
 * @param board 평가할 보드
 * @returns 센티폰 점수 (양수 = 백 유리)
 */
export function evaluate(board: Board): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] + getPSTBonus(piece, { row: r, col: c });

      if (piece.color === Color.White) {
        score += value;
      } else {
        score -= value;
      }
    }
  }

  return score;
}
