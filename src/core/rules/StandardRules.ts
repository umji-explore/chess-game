/**
 * StandardRules.ts
 * 표준 국제 체스 규칙 구현 (IRuleSet 인터페이스).
 *
 * 구현 항목:
 * - 합법 수 생성 (체크 필터링)
 * - 캐슬링 유효성 (통과 칸 공격 검사)
 * - 체크 / 체크메이트 / 스테일메이트 판정
 * - 무승부: 50수 규칙, 3회 반복, 기물 부족
 * - 프로모션 판정
 * - SAN (Standard Algebraic Notation) 생성
 */

import { Board } from '../Board';
import { GameState } from '../GameState';
import {
  Color,
  Move,
  MoveFlag,
  Piece,
  PieceType,
  Position,
  oppositeColor,
} from '../types';
import { posToAlgebraic } from '../../utils/coordinate';
import {
  generatePseudoLegalMoves,
  isSquareAttackedBy,
} from '../MoveGenerator';
import { IRuleSet } from './IRuleSet';

export class StandardRules implements IRuleSet {
  // ─────────────────────────────────────────────
  // 합법 수 생성
  // ─────────────────────────────────────────────

  /**
   * 특정 위치 말의 모든 합법 수 반환.
   * 체크 상태로 남는 수는 제외합니다.
   */
  getLegalMoves(board: Board, pos: Position, _state: GameState): Move[] {
    const piece = board.getPiece(pos);
    if (!piece || piece.color !== board.turn) return [];

    const pseudoMoves = generatePseudoLegalMoves(board, pos);
    return pseudoMoves.filter(move => {
      // 캐슬링: 통과 칸 공격 검사
      if (move.flag === MoveFlag.CastleKingside) {
        return this.isCastlingValid(board, piece.color, 'kingside');
      }
      if (move.flag === MoveFlag.CastleQueenside) {
        return this.isCastlingValid(board, piece.color, 'queenside');
      }
      // 이동 후 자기 킹이 체크 상태인지 확인
      const newBoard = board.applyMove(move);
      return !this.isInCheck(newBoard, piece.color);
    });
  }

  /** 현재 색상의 모든 합법 수 */
  getAllLegalMoves(board: Board, color: Color, state: GameState): Move[] {
    const moves: Move[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.grid[r][c];
        if (!piece || piece.color !== color) continue;
        moves.push(...this.getLegalMoves(board, { row: r, col: c }, state));
      }
    }
    return moves;
  }

  // ─────────────────────────────────────────────
  // 체크 / 메이트 / 스테일메이트
  // ─────────────────────────────────────────────

  /** 해당 색상이 체크 상태인지 */
  isInCheck(board: Board, color: Color): boolean {
    const kingPos = board.findKing(color);
    return isSquareAttackedBy(board, kingPos, oppositeColor(color));
  }

  /** 체크메이트 */
  isCheckmate(board: Board, color: Color, state: GameState): boolean {
    return (
      this.isInCheck(board, color) &&
      this.getAllLegalMoves(board, color, state).length === 0
    );
  }

  /** 스테일메이트 */
  isStalemate(board: Board, color: Color, state: GameState): boolean {
    return (
      !this.isInCheck(board, color) &&
      this.getAllLegalMoves(board, color, state).length === 0
    );
  }

  // ─────────────────────────────────────────────
  // 무승부 조건
  // ─────────────────────────────────────────────

  checkDraw(board: Board, state: GameState): string | null {
    // 50수 규칙
    if (board.halfMoveClock >= 100) {
      return 'fifty_move';
    }

    // 3회 반복 무승부
    const currentFEN = board.toFEN().split(' ').slice(0, 4).join(' ');
    const count = state.fenHistory
      .map(f => f.split(' ').slice(0, 4).join(' '))
      .filter(f => f === currentFEN).length;
    if (count >= 3) {
      return 'threefold_repetition';
    }

    // 기물 부족 무승부
    if (this.isInsufficientMaterial(board)) {
      return 'insufficient_material';
    }

    return null;
  }

  /** 기물 부족 판정 (K vs K, K+B vs K, K+N vs K, K+B vs K+B (같은 색)) */
  private isInsufficientMaterial(board: Board): boolean {
    const pieces: Piece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board.grid[r][c];
        if (p) pieces.push(p);
      }
    }

    if (pieces.length === 2) return true; // K vs K

    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== PieceType.King);
      const t = nonKings[0]?.type;
      return t === PieceType.Bishop || t === PieceType.Knight;
    }

    if (pieces.length === 4) {
      const nonKings = pieces.filter(p => p.type !== PieceType.King);
      if (nonKings.every(p => p.type === PieceType.Bishop)) {
        // 두 비숍이 같은 색 칸에 있는지 확인
        const positions: Position[] = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board.grid[r][c];
            if (p && p.type === PieceType.Bishop) positions.push({ row: r, col: c });
          }
        }
        if (positions.length === 2) {
          const sameDiag = (positions[0].row + positions[0].col) % 2 ===
                           (positions[1].row + positions[1].col) % 2;
          return sameDiag;
        }
      }
    }

    return false;
  }

  // ─────────────────────────────────────────────
  // 프로모션
  // ─────────────────────────────────────────────

  isPromotionRequired(move: Move, _board: Board): boolean {
    return (
      move.flag >= MoveFlag.PromoteQueen &&
      move.flag <= MoveFlag.PromoteKnight
    );
  }

  // ─────────────────────────────────────────────
  // 캐슬링 유효성 검사
  // ─────────────────────────────────────────────

  private isCastlingValid(
    board: Board,
    color: Color,
    side: 'kingside' | 'queenside',
  ): boolean {
    const row = color === Color.White ? 7 : 0;
    const opponent = oppositeColor(color);

    // 킹이 현재 체크 상태이면 캐슬링 불가
    if (this.isInCheck(board, color)) return false;

    if (side === 'kingside') {
      // e, f, g 열이 공격받으면 불가
      return (
        !isSquareAttackedBy(board, { row, col: 4 }, opponent) &&
        !isSquareAttackedBy(board, { row, col: 5 }, opponent) &&
        !isSquareAttackedBy(board, { row, col: 6 }, opponent)
      );
    } else {
      // e, d, c 열이 공격받으면 불가
      return (
        !isSquareAttackedBy(board, { row, col: 4 }, opponent) &&
        !isSquareAttackedBy(board, { row, col: 3 }, opponent) &&
        !isSquareAttackedBy(board, { row, col: 2 }, opponent)
      );
    }
  }

  // ─────────────────────────────────────────────
  // SAN 표기 생성
  // ─────────────────────────────────────────────

  annotateSAN(board: Board, move: Move, state: GameState): Move {
    const san = this.buildSAN(board, move, state);
    return { ...move, san };
  }

  private buildSAN(board: Board, move: Move, state: GameState): string {
    const piece = board.getPiece(move.from);
    if (!piece) return '';

    // 캐슬링
    if (move.flag === MoveFlag.CastleKingside) return 'O-O';
    if (move.flag === MoveFlag.CastleQueenside) return 'O-O-O';

    const isCapture = !!board.getPiece(move.to) || move.flag === MoveFlag.EnPassant;
    const toAlg = posToAlgebraic(move.to);

    let san = '';

    if (piece.type === PieceType.Pawn) {
      if (isCapture) {
        san += posToAlgebraic(move.from)[0] + 'x';
      }
      san += toAlg;
      // 프로모션
      if (move.promoteTo) {
        san += '=' + move.promoteTo;
      }
    } else {
      san += piece.type;
      // 모호성 해결 (같은 종류의 말이 같은 칸으로 이동 가능한 경우)
      const ambiguous = this.getAmbiguousMoves(board, move, piece, state);
      if (ambiguous.sameFile && ambiguous.sameRank) {
        san += posToAlgebraic(move.from); // 전체 좌표
      } else if (ambiguous.sameFile) {
        san += posToAlgebraic(move.from)[1]; // 랭크
      } else if (ambiguous.anyConflict) {
        san += posToAlgebraic(move.from)[0]; // 파일
      }
      if (isCapture) san += 'x';
      san += toAlg;
    }

    // 체크 / 메이트 후위
    const newBoard = board.applyMove(move);
    const opponent = oppositeColor(piece.color);
    if (this.isCheckmate(newBoard, opponent, state)) {
      san += '#';
    } else if (this.isInCheck(newBoard, opponent)) {
      san += '+';
    }

    return san;
  }

  private getAmbiguousMoves(
    board: Board,
    move: Move,
    piece: Piece,
    state: GameState,
  ): { anyConflict: boolean; sameFile: boolean; sameRank: boolean } {
    const allMoves = this.getAllLegalMoves(board, piece.color, state).filter(
      m =>
        board.getPiece(m.from)?.type === piece.type &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        !(m.from.row === move.from.row && m.from.col === move.from.col),
    );

    const anyConflict = allMoves.length > 0;
    const sameFile = allMoves.some(m => m.from.col === move.from.col);
    const sameRank = allMoves.some(m => m.from.row === move.from.row);

    return { anyConflict, sameFile, sameRank };
  }
}
