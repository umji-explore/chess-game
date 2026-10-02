/**
 * MoveGenerator.ts
 * 말 종류별 유사 합법 수(pseudo-legal moves) 생성기.
 * 체크 상태로 남는 수는 StandardRules에서 필터링합니다.
 *
 * 각 말 종류별 이동 패턴:
 * - 슬라이딩(Rook/Bishop/Queen): 방향별 반복
 * - 점프(Knight/King): 고정 델타
 * - 폰: 방향 의존적, 특수 이동 처리
 */

import { Board } from './Board';
import { Color, Move, MoveFlag, Piece, PieceType, Position } from './types';
import { isInBounds } from '../utils/coordinate';

/** 나이트 이동 델타 */
const KNIGHT_DELTAS: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2],  [1, 2],  [2, -1],  [2, 1],
];

/** 킹 이동 델타 */
const KING_DELTAS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

/** 슬라이딩 방향: 룩 */
const ROOK_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
/** 슬라이딩 방향: 비숍 */
const BISHOP_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
/** 슬라이딩 방향: 퀸 */
const QUEEN_DIRS: [number, number][] = [...ROOK_DIRS, ...BISHOP_DIRS];

/**
 * 특정 위치 말의 유사 합법 수 생성 (체크 필터 없음).
 * @param board 현재 보드
 * @param pos 말의 위치
 * @returns 유사 합법 수 목록
 */
export function generatePseudoLegalMoves(board: Board, pos: Position): Move[] {
  const piece = board.getPiece(pos);
  if (!piece) return [];

  switch (piece.type) {
    case PieceType.Pawn:   return generatePawnMoves(board, pos, piece);
    case PieceType.Knight: return generateJumpMoves(board, pos, piece, KNIGHT_DELTAS);
    case PieceType.King:   return generateKingMoves(board, pos, piece);
    case PieceType.Rook:   return generateSlidingMoves(board, pos, piece, ROOK_DIRS);
    case PieceType.Bishop: return generateSlidingMoves(board, pos, piece, BISHOP_DIRS);
    case PieceType.Queen:  return generateSlidingMoves(board, pos, piece, QUEEN_DIRS);
    default: return [];
  }
}

/** ── 슬라이딩 이동 (Rook / Bishop / Queen) ── */
function generateSlidingMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  dirs: [number, number][],
): Move[] {
  const moves: Move[] = [];
  for (const [dr, dc] of dirs) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (isInBounds(r, c)) {
      const target = board.getPiece({ row: r, col: c });
      if (target) {
        // 적 말이면 포획 후 중단
        if (target.color !== piece.color) {
          moves.push(makeMove(pos, { row: r, col: c }, MoveFlag.Normal, target));
        }
        break;
      }
      moves.push(makeMove(pos, { row: r, col: c }, MoveFlag.Normal));
      r += dr;
      c += dc;
    }
  }
  return moves;
}

/** ── 점프 이동 (Knight) ── */
function generateJumpMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  deltas: [number, number][],
): Move[] {
  const moves: Move[] = [];
  for (const [dr, dc] of deltas) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (!isInBounds(r, c)) continue;
    const target = board.getPiece({ row: r, col: c });
    if (target && target.color === piece.color) continue; // 아군 말
    moves.push(makeMove(pos, { row: r, col: c }, MoveFlag.Normal, target ?? undefined));
  }
  return moves;
}

/** ── 킹 이동 (일반 + 캐슬링) ── */
function generateKingMoves(board: Board, pos: Position, piece: Piece): Move[] {
  const moves = generateJumpMoves(board, pos, piece, KING_DELTAS);

  // 캐슬링 (체크 여부 검증은 StandardRules에서 수행)
  const cr = board.castlingRights;
  const isWhite = piece.color === Color.White;
  const row = isWhite ? 7 : 0;

  if (pos.row === row && pos.col === 4) {
    // 킹사이드 캐슬링: f, g 열이 비어 있어야 함
    const ksRight = isWhite ? cr.whiteKingside : cr.blackKingside;
    if (
      ksRight &&
      !board.hasPiece({ row, col: 5 }) &&
      !board.hasPiece({ row, col: 6 })
    ) {
      moves.push(makeMove(pos, { row, col: 6 }, MoveFlag.CastleKingside));
    }

    // 퀸사이드 캐슬링: b, c, d 열이 비어 있어야 함
    const qsRight = isWhite ? cr.whiteQueenside : cr.blackQueenside;
    if (
      qsRight &&
      !board.hasPiece({ row, col: 3 }) &&
      !board.hasPiece({ row, col: 2 }) &&
      !board.hasPiece({ row, col: 1 })
    ) {
      moves.push(makeMove(pos, { row, col: 2 }, MoveFlag.CastleQueenside));
    }
  }

  return moves;
}

/** ── 폰 이동 ── */
function generatePawnMoves(board: Board, pos: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  const dir = piece.color === Color.White ? -1 : 1; // 백: 위쪽, 흑: 아래쪽
  const startRow = piece.color === Color.White ? 6 : 1;
  const promoteRow = piece.color === Color.White ? 0 : 7;

  // 한 칸 전진
  const oneStep = { row: pos.row + dir, col: pos.col };
  if (isInBounds(oneStep.row, oneStep.col) && !board.hasPiece(oneStep)) {
    if (oneStep.row === promoteRow) {
      // 프로모션
      moves.push(...makePromotionMoves(pos, oneStep));
    } else {
      moves.push(makeMove(pos, oneStep, MoveFlag.Normal));
    }

    // 두 칸 전진 (시작 위치에서)
    if (pos.row === startRow) {
      const twoStep = { row: pos.row + dir * 2, col: pos.col };
      if (!board.hasPiece(twoStep)) {
        moves.push(makeMove(pos, twoStep, MoveFlag.DoublePawnPush));
      }
    }
  }

  // 대각선 포획
  for (const dc of [-1, 1]) {
    const capPos = { row: pos.row + dir, col: pos.col + dc };
    if (!isInBounds(capPos.row, capPos.col)) continue;

    const target = board.getPiece(capPos);

    if (target && target.color !== piece.color) {
      if (capPos.row === promoteRow) {
        moves.push(...makePromotionMoves(pos, capPos, target));
      } else {
        moves.push(makeMove(pos, capPos, MoveFlag.Normal, target));
      }
    }

    // 앙파상
    if (
      board.enPassantCol === capPos.col &&
      ((piece.color === Color.White && pos.row === 3) ||
       (piece.color === Color.Black && pos.row === 4))
    ) {
      const capturedPawnPos = { row: pos.row, col: capPos.col };
      const capturedPawn = board.getPiece(capturedPawnPos);
      if (capturedPawn && capturedPawn.color !== piece.color) {
        moves.push({
          from: pos,
          to: capPos,
          flag: MoveFlag.EnPassant,
          capturePos: capturedPawnPos,
          capturedPiece: capturedPawn,
        });
      }
    }
  }

  return moves;
}

/** 프로모션 이동 4종 생성 */
function makePromotionMoves(
  from: Position,
  to: Position,
  captured?: Piece,
): Move[] {
  const promoTypes = [
    { flag: MoveFlag.PromoteQueen,  type: PieceType.Queen },
    { flag: MoveFlag.PromoteRook,   type: PieceType.Rook },
    { flag: MoveFlag.PromoteBishop, type: PieceType.Bishop },
    { flag: MoveFlag.PromoteKnight, type: PieceType.Knight },
  ];
  return promoTypes.map(({ flag, type }) => ({
    from,
    to,
    flag,
    promoteTo: type,
    capturedPiece: captured,
  }));
}

/** Move 객체 헬퍼 */
function makeMove(
  from: Position,
  to: Position,
  flag: MoveFlag,
  captured?: Piece,
): Move {
  return {
    from: { ...from },
    to: { ...to },
    flag,
    capturedPiece: captured,
  };
}

/**
 * 특정 위치가 해당 색상에게 공격받고 있는지 확인.
 * (체크 판정, 캐슬링 통과 칸 검증에 사용)
 */
export function isSquareAttackedBy(
  board: Board,
  pos: Position,
  attackerColor: Color,
): boolean {
  // 모든 공격자 말의 유사 합법 수 확인
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece || piece.color !== attackerColor) continue;
      const pMoves = generatePseudoLegalMoves(board, { row: r, col: c });
      if (pMoves.some(m => m.to.row === pos.row && m.to.col === pos.col)) {
        return true;
      }
    }
  }
  return false;
}
