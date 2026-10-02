/**
 * Board.ts
 * 체스 보드 상태를 관리하는 불변(immutable) 클래스.
 * - 8×8 보드 매트릭스 유지
 * - 말 배치/제거/이동
 * - FEN 문자열 파싱 (보드 부분)
 * - 깊은 복사 지원 (Undo/Redo 및 AI 탐색용)
 */

import {
  BoardMatrix,
  CastlingRights,
  Color,
  Move,
  MoveFlag,
  Piece,
  PieceType,
  Position,
} from './types';
import { isInBounds, posEqual } from '../utils/coordinate';

/** 게임 내내 고유한 말 ID 생성용 카운터 */
let pieceIdCounter = 0;
export function createPieceId(): string {
  return `p${++pieceIdCounter}`;
}

/**
 * Board 클래스
 * 보드 상태는 직접 변경하지 않고, applyMove()가 새 Board를 반환합니다.
 * AI 탐색 시 clone()으로 복사하여 사용합니다.
 */
export class Board {
  /** 8×8 셀. grid[row][col] */
  readonly grid: BoardMatrix;

  /** 캐슬링 권한 */
  readonly castlingRights: CastlingRights;

  /** 앙파상 대상 열 (직전에 폰이 두 칸 전진했을 때의 열). null이면 없음 */
  readonly enPassantCol: number | null;

  /** 50수 규칙 카운터 (폰 전진 또는 포획이 없는 반수) */
  readonly halfMoveClock: number;

  /** 전체 수 수 (흑이 두면 +1) */
  readonly fullMoveNumber: number;

  /** 현재 차례 색상 */
  readonly turn: Color;

  constructor(
    grid: BoardMatrix,
    castlingRights: CastlingRights,
    enPassantCol: number | null,
    halfMoveClock: number,
    fullMoveNumber: number,
    turn: Color,
  ) {
    this.grid = grid;
    this.castlingRights = castlingRights;
    this.enPassantCol = enPassantCol;
    this.halfMoveClock = halfMoveClock;
    this.fullMoveNumber = fullMoveNumber;
    this.turn = turn;
  }

  /** 특정 위치의 말 반환. 범위 밖이면 null */
  getPiece(pos: Position): Piece | null {
    if (!isInBounds(pos.row, pos.col)) return null;
    return this.grid[pos.row][pos.col];
  }

  /** 특정 위치에 말이 있는지 */
  hasPiece(pos: Position): boolean {
    return this.getPiece(pos) !== null;
  }

  /** 특정 색상 말이 있는지 */
  hasPieceOfColor(pos: Position, color: Color): boolean {
    const p = this.getPiece(pos);
    return p !== null && p.color === color;
  }

  /** 보드에서 특정 색상 + 종류 말의 위치 모두 반환 */
  findPieces(color: Color, type?: PieceType): Position[] {
    const result: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.grid[r][c];
        if (p && p.color === color && (type === undefined || p.type === type)) {
          result.push({ row: r, col: c });
        }
      }
    }
    return result;
  }

  /** 킹 위치 반환 */
  findKing(color: Color): Position {
    const positions = this.findPieces(color, PieceType.King);
    if (positions.length === 0) throw new Error(`King not found for ${color}`);
    return positions[0];
  }

  /**
   * 이동을 적용하여 새 Board를 반환합니다 (불변 패턴).
   * 특수 이동 처리: 캐슬링, 앙파상, 프로모션.
   */
  applyMove(move: Move): Board {
    // 그리드 깊은 복사
    const newGrid: BoardMatrix = this.grid.map(row => [...row]);

    const piece = newGrid[move.from.row][move.from.col];
    if (!piece) throw new Error(`No piece at ${JSON.stringify(move.from)}`);

    let newCastling = { ...this.castlingRights };
    let newEnPassantCol: number | null = null;
    let newHalfMove = this.halfMoveClock + 1;
    const isCapture = !!newGrid[move.to.row][move.to.col];

    // 폰 이동 또는 포획 시 50수 카운터 리셋
    if (piece.type === PieceType.Pawn || isCapture) {
      newHalfMove = 0;
    }

    // ── 앙파상 처리 ──
    if (move.flag === MoveFlag.EnPassant && move.capturePos) {
      newGrid[move.capturePos.row][move.capturePos.col] = null;
    }

    // ── 캐슬링 처리 ──
    if (move.flag === MoveFlag.CastleKingside) {
      // 룩 이동 (h → f)
      const row = move.from.row;
      newGrid[row][5] = newGrid[row][7];
      newGrid[row][7] = null;
    }
    if (move.flag === MoveFlag.CastleQueenside) {
      // 룩 이동 (a → d)
      const row = move.from.row;
      newGrid[row][3] = newGrid[row][0];
      newGrid[row][0] = null;
    }

    // ── 말 이동 ──
    let movedPiece: Piece = piece;

    // 프로모션
    if (
      move.flag >= MoveFlag.PromoteQueen &&
      move.flag <= MoveFlag.PromoteKnight
    ) {
      const promoteType = move.promoteTo ?? PieceType.Queen;
      movedPiece = { ...piece, type: promoteType };
    }

    newGrid[move.to.row][move.to.col] = movedPiece;
    newGrid[move.from.row][move.from.col] = null;

    // ── 캐슬링 권한 업데이트 ──
    // 킹이 움직이면 해당 색상 캐슬링 권한 모두 소멸
    if (piece.type === PieceType.King) {
      if (piece.color === Color.White) {
        newCastling.whiteKingside = false;
        newCastling.whiteQueenside = false;
      } else {
        newCastling.blackKingside = false;
        newCastling.blackQueenside = false;
      }
    }
    // 룩이 움직이거나 잡히면 해당 캐슬링 권한 소멸
    if (piece.type === PieceType.Rook) {
      if (posEqual(move.from, { row: 7, col: 7 })) newCastling.whiteKingside = false;
      if (posEqual(move.from, { row: 7, col: 0 })) newCastling.whiteQueenside = false;
      if (posEqual(move.from, { row: 0, col: 7 })) newCastling.blackKingside = false;
      if (posEqual(move.from, { row: 0, col: 0 })) newCastling.blackQueenside = false;
    }
    // 상대 룩 위치에 포획이 발생하면 해당 캐슬링 권한 소멸
    if (posEqual(move.to, { row: 7, col: 7 })) newCastling.whiteKingside = false;
    if (posEqual(move.to, { row: 7, col: 0 })) newCastling.whiteQueenside = false;
    if (posEqual(move.to, { row: 0, col: 7 })) newCastling.blackKingside = false;
    if (posEqual(move.to, { row: 0, col: 0 })) newCastling.blackQueenside = false;

    // ── 앙파상 대상 설정 ──
    if (move.flag === MoveFlag.DoublePawnPush) {
      newEnPassantCol = move.to.col;
    }

    const newTurn = this.turn === Color.White ? Color.Black : Color.White;
    const newFullMove =
      this.turn === Color.Black ? this.fullMoveNumber + 1 : this.fullMoveNumber;

    return new Board(
      newGrid,
      newCastling,
      newEnPassantCol,
      newHalfMove,
      newFullMove,
      newTurn,
    );
  }

  /** 보드 깊은 복사 (AI 탐색용) */
  clone(): Board {
    return new Board(
      this.grid.map(row => [...row]),
      { ...this.castlingRights },
      this.enPassantCol,
      this.halfMoveClock,
      this.fullMoveNumber,
      this.turn,
    );
  }

  /**
   * 초기 배치 보드 생성 (표준 체스 시작 포지션)
   */
  static createInitial(): Board {
    const grid: BoardMatrix = Array.from({ length: 8 }, () =>
      Array(8).fill(null),
    );

    /** 헬퍼: 말 배치 */
    const place = (row: number, col: number, type: PieceType, color: Color) => {
      grid[row][col] = { type, color, id: createPieceId() };
    };

    // 흑 말 배치 (row 0~1)
    const backRank: PieceType[] = [
      PieceType.Rook, PieceType.Knight, PieceType.Bishop, PieceType.Queen,
      PieceType.King, PieceType.Bishop, PieceType.Knight, PieceType.Rook,
    ];
    backRank.forEach((t, c) => {
      place(0, c, t, Color.Black);
      place(7, c, t, Color.White);
    });
    for (let c = 0; c < 8; c++) {
      place(1, c, PieceType.Pawn, Color.Black);
      place(6, c, PieceType.Pawn, Color.White);
    }

    return new Board(
      grid,
      { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true },
      null,
      0,
      1,
      Color.White,
    );
  }

  /**
   * FEN 문자열로부터 Board 생성
   * 예: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   */
  static fromFEN(fen: string): Board {
    const parts = fen.split(' ');
    const ranks = parts[0].split('/');
    const grid: BoardMatrix = Array.from({ length: 8 }, () => Array(8).fill(null));

    const fenToType: Record<string, PieceType> = {
      k: PieceType.King, q: PieceType.Queen, r: PieceType.Rook,
      b: PieceType.Bishop, n: PieceType.Knight, p: PieceType.Pawn,
    };

    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of ranks[r]) {
        if (/\d/.test(ch)) {
          c += parseInt(ch);
        } else {
          const color = ch === ch.toUpperCase() ? Color.White : Color.Black;
          const type = fenToType[ch.toLowerCase()];
          grid[r][c] = { type, color, id: createPieceId() };
          c++;
        }
      }
    }

    const turn = parts[1] === 'w' ? Color.White : Color.Black;
    const castleStr = parts[2] ?? '-';
    const castlingRights: CastlingRights = {
      whiteKingside:  castleStr.includes('K'),
      whiteQueenside: castleStr.includes('Q'),
      blackKingside:  castleStr.includes('k'),
      blackQueenside: castleStr.includes('q'),
    };
    const epStr = parts[3] ?? '-';
    let enPassantCol: number | null = null;
    if (epStr !== '-') {
      enPassantCol = epStr.charCodeAt(0) - 'a'.charCodeAt(0);
    }
    const halfMove = parseInt(parts[4] ?? '0');
    const fullMove = parseInt(parts[5] ?? '1');

    return new Board(grid, castlingRights, enPassantCol, halfMove, fullMove, turn);
  }

  /** Board → FEN 문자열 변환 */
  toFEN(): string {
    const typeToFen: Record<PieceType, string> = {
      [PieceType.King]: 'k', [PieceType.Queen]: 'q', [PieceType.Rook]: 'r',
      [PieceType.Bishop]: 'b', [PieceType.Knight]: 'n', [PieceType.Pawn]: 'p',
    };

    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.grid[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) { fen += empty; empty = 0; }
          const ch = typeToFen[p.type];
          fen += p.color === Color.White ? ch.toUpperCase() : ch;
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }

    const turnStr = this.turn === Color.White ? 'w' : 'b';
    let castle = '';
    if (this.castlingRights.whiteKingside)  castle += 'K';
    if (this.castlingRights.whiteQueenside) castle += 'Q';
    if (this.castlingRights.blackKingside)  castle += 'k';
    if (this.castlingRights.blackQueenside) castle += 'q';
    if (!castle) castle = '-';

    let ep = '-';
    if (this.enPassantCol !== null) {
      const file = String.fromCharCode('a'.charCodeAt(0) + this.enPassantCol);
      ep = file + (this.turn === Color.White ? '6' : '3');
    }

    return `${fen} ${turnStr} ${castle} ${ep} ${this.halfMoveClock} ${this.fullMoveNumber}`;
  }
}
