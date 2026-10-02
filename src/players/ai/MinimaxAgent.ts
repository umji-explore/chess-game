/**
 * MinimaxAgent.ts
 * 미니맥스 + 알파베타 가지치기 탐색 에이전트.
 *
 * - 깊이(depth)에 따라 Easy(1) / Medium(3) / Hard(5) 설정
 * - 알파베타 가지치기로 탐색 공간 최적화
 * - Web Worker로 이동 가능 (나중에 분리하면 UI 블로킹 없음)
 */

import { Board } from '../../core/Board';
import { Color, Move, PIECE_VALUES } from '../../core/types';
import { GameState } from '../../core/GameState';
import { IRuleSet } from '../../core/rules/IRuleSet';
import { evaluate } from './Evaluator';

const INFINITY = 1e9;

export class MinimaxAgent {
  private ruleSet: IRuleSet;
  private maxDepth: number;

  constructor(ruleSet: IRuleSet, depth: number = 3) {
    this.ruleSet = ruleSet;
    this.maxDepth = depth;
  }

  /**
   * 최선 수 탐색.
   * @param board 현재 보드
   * @param color 탐색할 색상
   * @param state 현재 게임 상태
   */
  findBestMove(board: Board, color: Color, state: GameState): Move | null {
    const moves = this.ruleSet.getAllLegalMoves(board, color, state);
    if (moves.length === 0) return null;

    const isMaximizing = color === Color.White;
    let bestMove: Move | null = null;
    let bestScore = isMaximizing ? -INFINITY : INFINITY;

    // 이동 순서 최적화: 포획 우선 (알파베타 효율 향상)
    const sortedMoves = this.sortMoves(moves, board);

    for (const move of sortedMoves) {
      const newBoard = board.applyMove(move);
      const score = this.minimax(
        newBoard,
        this.maxDepth - 1,
        -INFINITY,
        INFINITY,
        !isMaximizing,
        state,
      );

      if (isMaximizing ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * 재귀 미니맥스 (알파베타 가지치기).
   */
  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    state: GameState,
  ): number {
    const color = board.turn;

    // 터미널 노드 또는 최대 깊이 도달
    if (depth === 0) {
      return evaluate(board);
    }

    const moves = this.ruleSet.getAllLegalMoves(board, color, state);

    if (moves.length === 0) {
      if (this.ruleSet.isInCheck(board, color)) {
        // 체크메이트: 깊이가 깊을수록 패배가 더 나쁨 (빠른 메이트 선호)
        return isMaximizing ? -INFINITY + depth : INFINITY - depth;
      }
      // 스테일메이트
      return 0;
    }

    const drawReason = this.ruleSet.checkDraw(board, state);
    if (drawReason) return 0;

    const sortedMoves = this.sortMoves(moves, board);

    if (isMaximizing) {
      let maxScore = -INFINITY;
      for (const move of sortedMoves) {
        const newBoard = board.applyMove(move);
        const score = this.minimax(newBoard, depth - 1, alpha, beta, false, state);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // 베타 컷오프
      }
      return maxScore;
    } else {
      let minScore = INFINITY;
      for (const move of sortedMoves) {
        const newBoard = board.applyMove(move);
        const score = this.minimax(newBoard, depth - 1, alpha, beta, true, state);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // 알파 컷오프
      }
      return minScore;
    }
  }

  /**
   * 이동 순서 최적화 (MVV-LVA: Most Valuable Victim - Least Valuable Attacker).
   * 포획 이동을 먼저 탐색하여 알파베타 효율 향상.
   */
  private sortMoves(moves: Move[], board: Board): Move[] {
    return [...moves].sort((a, b) => {
      const capA = board.getPiece(a.to);
      const capB = board.getPiece(b.to);
      const valA = capA ? this.getCaptureScore(a, board) : 0;
      const valB = capB ? this.getCaptureScore(b, board) : 0;
      return valB - valA;
    });
  }

  private getCaptureScore(move: Move, board: Board): number {
    const victim = board.getPiece(move.to);
    const attacker = board.getPiece(move.from);
    if (!victim || !attacker) return 0;
    return PIECE_VALUES[victim.type] - PIECE_VALUES[attacker.type] / 10;
  }
}
