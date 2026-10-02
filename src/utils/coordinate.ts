/**
 * coordinate.ts
 * 체스 좌표 변환 유틸리티.
 * - Position (row/col) ↔ Algebraic Notation (e.g. "e4")
 * - 인덱스 범위 검사
 */

import { Position } from '../core/types';

/** 파일 문자 배열 (열: a~h) */
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** 랭크 문자 배열 (행: 8~1, row 0=rank8) */
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Position → Algebraic Notation
 * 예: { row: 6, col: 4 } → "e2"
 */
export function posToAlgebraic(pos: Position): string {
  return FILES[pos.col] + RANKS[pos.row];
}

/**
 * Algebraic Notation → Position
 * 예: "e2" → { row: 6, col: 4 }
 */
export function algebraicToPos(alg: string): Position {
  const col = FILES.indexOf(alg[0]);
  const row = RANKS.indexOf(alg[1]);
  if (col === -1 || row === -1) throw new Error(`Invalid algebraic: ${alg}`);
  return { row, col };
}

/** 위치가 보드 범위 내인지 확인 */
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/** 두 Position이 같은지 비교 */
export function posEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Position 복사 */
export function posClone(p: Position): Position {
  return { row: p.row, col: p.col };
}

/** 파일 이름 (col → 'a'~'h') */
export function colToFile(col: number): string {
  return FILES[col];
}

/** 랭크 숫자 (row → 1~8) */
export function rowToRank(row: number): number {
  return 8 - row;
}
