/**
 * IRuleSet.ts
 * 규칙 엔진 플러그인 인터페이스.
 * 표준 체스 외에 Chess960, 3-Check 등 변형 룰을 구현할 때
 * 이 인터페이스를 구현하면 됩니다.
 *
 * GameEngine과 AI는 이 인터페이스만 바라보므로,
 * 새 룰셋으로 교체해도 나머지 코드 변경 없이 동작합니다.
 */

import { Board } from '../Board';
import { Color, Move, Position } from '../types';
import { GameState } from '../GameState';

export interface IRuleSet {
  /**
   * 특정 위치의 말이 이동 가능한 모든 합법 수를 반환합니다.
   * 체크 상태로 남는 수는 제외합니다.
   */
  getLegalMoves(board: Board, pos: Position, state: GameState): Move[];

  /**
   * 현재 색상의 모든 합법 수 반환.
   * 체크메이트/스테일메이트 판정에 사용.
   */
  getAllLegalMoves(board: Board, color: Color, state: GameState): Move[];

  /** 해당 색상이 체크 상태인지 */
  isInCheck(board: Board, color: Color): boolean;

  /** 체크메이트 (합법 수 없음 + 체크) */
  isCheckmate(board: Board, color: Color, state: GameState): boolean;

  /** 스테일메이트 (합법 수 없음 + 체크 아님) */
  isStalemate(board: Board, color: Color, state: GameState): boolean;

  /**
   * 무승부 조건 확인 (50수 규칙, 3회 반복, 기물 부족 등)
   * 조건 충족 시 무승부 이유 문자열 반환, 아니면 null
   */
  checkDraw(board: Board, state: GameState): string | null;

  /** 프로모션이 필요한 이동인지 */
  isPromotionRequired(move: Move, board: Board): boolean;

  /** Move에 SAN 표기를 달아서 반환 */
  annotateSAN(board: Board, move: Move, state: GameState): Move;
}
