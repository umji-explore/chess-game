/**
 * GameEngine.ts
 * 게임 진행 오케스트레이터.
 *
 * 책임:
 * - 플레이어 턴 관리 (TurnManager 활용)
 * - IRuleSet을 통한 합법성 검사 및 게임 종료 판정
 * - 이동 이력 관리 (Undo/Redo)
 * - 이벤트 발행 (UI는 구독하여 반응)
 * - PGN 내보내기/가져오기
 *
 * UI와 AI는 GameEngine을 통해서만 게임 상태를 변경합니다.
 */

import { Board } from '../core/Board';
import {
  Color,
  GameEvent,
  GameEventType,
  GameStatus,
  Move,
  MoveFlag,
  PieceType,
} from '../core/types';
import {
  GameState,
  cloneGameState,
  createInitialGameState,
} from '../core/GameState';
import { IRuleSet } from '../core/rules/IRuleSet';
import { IPlayer } from '../players/IPlayer';
import { HumanPlayer } from '../players/HumanPlayer';

type EventHandler = (event: GameEvent) => void;

export class GameEngine {
  private ruleSet: IRuleSet;
  private players: [IPlayer, IPlayer]; // [White, Black]
  private state: GameState;

  /** Undo 스택 */
  private undoStack: GameState[] = [];
  /** Redo 스택 */
  private redoStack: GameState[] = [];

  /** 이벤트 핸들러 맵 */
  private handlers: Map<string, EventHandler[]> = new Map();

  /** 게임 루프 실행 중 여부 */
  private isRunning = false;

  /** 프로모션 대기 중 resolve */
  private promotionResolve: ((type: PieceType) => void) | null = null;

  constructor(ruleSet: IRuleSet, players: [IPlayer, IPlayer]) {
    this.ruleSet = ruleSet;
    this.players = players;
    this.state = createInitialGameState();
  }

  // ─────────────────────────────────────────────
  // 게임 상태 접근자
  // ─────────────────────────────────────────────

  getState(): GameState {
    return this.state;
  }

  getBoard(): Board {
    return this.state.board;
  }

  /** 특정 위치의 합법 수 반환 */
  getLegalMoves(pos: { row: number; col: number }): Move[] {
    if (this.state.status !== GameStatus.Playing &&
        this.state.status !== GameStatus.Check) return [];
    return this.ruleSet.getLegalMoves(this.state.board, pos, this.state);
  }

  // ─────────────────────────────────────────────
  // 게임 시작 / 리셋
  // ─────────────────────────────────────────────

  start(fen?: string): void {
    this.isRunning = false;
    this.undoStack = [];
    this.redoStack = [];

    const board = fen ? Board.fromFEN(fen) : Board.createInitial();
    this.state = {
      ...createInitialGameState(),
      board,
      currentTurn: board.turn,
      fenHistory: [board.toFEN()],
    };

    this.emit({ type: 'game_reset' });
    this.runLoop();
  }

  // ─────────────────────────────────────────────
  // 게임 루프
  // ─────────────────────────────────────────────

  private async runLoop(): Promise<void> {
    this.isRunning = true;

    while (
      this.isRunning &&
      (this.state.status === GameStatus.Playing ||
       this.state.status === GameStatus.Check)
    ) {
      const currentPlayer = this.getCurrentPlayer();
      this.emit({ type: 'turn_changed', payload: this.state.currentTurn });

      try {
        const move = await currentPlayer.requestMove(this.state);
        if (!this.isRunning) break;
        this.applyMoveInternal(move);
      } catch (e) {
        // 게임 리셋 등으로 인한 취소
        break;
      }
    }
  }

  private getCurrentPlayer(): IPlayer {
    return this.state.currentTurn === Color.White
      ? this.players[0]
      : this.players[1];
  }

  // ─────────────────────────────────────────────
  // 이동 처리
  // ─────────────────────────────────────────────

  /**
   * HumanPlayer에게 이동을 제출합니다.
   * UI에서 직접 호출하는 퍼블릭 메서드.
   */
  submitHumanMove(move: Move): void {
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer instanceof HumanPlayer) {
      currentPlayer.submitMove(move);
    }
  }

  /**
   * 프로모션 선택 결과를 제출합니다.
   * PromotionModal에서 호출합니다.
   */
  submitPromotion(pieceType: PieceType): void {
    if (this.promotionResolve) {
      this.promotionResolve(pieceType);
      this.promotionResolve = null;
    }
  }

  private applyMoveInternal(move: Move): void {
    // Undo 스택에 현재 상태 저장
    this.undoStack.push(cloneGameState(this.state));
    this.redoStack = []; // Redo 스택 초기화

    // SAN 주석 추가
    const annotatedMove = this.ruleSet.annotateSAN(
      this.state.board,
      move,
      this.state,
    );

    // 보드 적용
    const newBoard = this.state.board.applyMove(annotatedMove);

    // 잡힌 말 기록
    const capturedByBlack = [...this.state.capturedByBlack];
    const capturedByWhite = [...this.state.capturedByWhite];
    if (annotatedMove.capturedPiece) {
      const cap = annotatedMove.capturedPiece;
      if (cap.color === Color.White) {
        capturedByBlack.push(cap);
      } else {
        capturedByWhite.push(cap);
      }
    }

    const nextTurn =
      this.state.currentTurn === Color.White ? Color.Black : Color.White;

    // 게임 종료 판정
    let status: GameStatus = GameStatus.Playing;
    let winner: Color | null = null;

    const drawReason = this.ruleSet.checkDraw(newBoard, this.state);
    if (drawReason) {
      status = drawReason === 'fifty_move'
        ? GameStatus.DrawFiftyMove
        : drawReason === 'threefold_repetition'
          ? GameStatus.DrawRepetition
          : GameStatus.DrawInsufficientMaterial;
    } else if (this.ruleSet.isCheckmate(newBoard, nextTurn, this.state)) {
      status = GameStatus.Checkmate;
      winner = this.state.currentTurn;
    } else if (this.ruleSet.isStalemate(newBoard, nextTurn, this.state)) {
      status = GameStatus.Stalemate;
    } else if (this.ruleSet.isInCheck(newBoard, nextTurn)) {
      status = GameStatus.Check;
    }

    this.state = {
      board: newBoard,
      currentTurn: nextTurn,
      moveHistory: [...this.state.moveHistory, annotatedMove],
      fenHistory: [...this.state.fenHistory, newBoard.toFEN()],
      capturedByBlack,
      capturedByWhite,
      status,
      winner,
    };

    this.emit({ type: 'move', payload: annotatedMove });

    if (status === GameStatus.Check) {
      this.emit({ type: 'check', payload: nextTurn });
    } else if (
      status === GameStatus.Checkmate ||
      status === GameStatus.Stalemate ||
      status === GameStatus.DrawFiftyMove ||
      status === GameStatus.DrawRepetition ||
      status === GameStatus.DrawInsufficientMaterial
    ) {
      this.isRunning = false;
      this.emit({ type: 'checkmate', payload: { status, winner } });
    }
  }

  // ─────────────────────────────────────────────
  // Undo / Redo
  // ─────────────────────────────────────────────

  undo(): void {
    if (this.undoStack.length === 0) return;

    // AI 모드: 2수 되돌리기 (사람 수 + AI 수)
    const stepsBack = this.shouldUndoTwoMoves() ? 2 : 1;

    for (let i = 0; i < stepsBack && this.undoStack.length > 0; i++) {
      this.redoStack.push(cloneGameState(this.state));
      this.state = this.undoStack.pop()!;
    }

    // 현재 플레이어의 이동 대기 취소
    this.cancelCurrentPlayerMove();
    this.emit({ type: 'undo' });

    // 루프 재시작
    this.runLoop();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(cloneGameState(this.state));
    this.state = this.redoStack.pop()!;
    this.cancelCurrentPlayerMove();
    this.emit({ type: 'redo' });
    this.runLoop();
  }

  private shouldUndoTwoMoves(): boolean {
    // AI 플레이어가 있고, 현재 차례가 사람이면 2수 되돌리기
    const hasAI = this.players.some(p => p.type === 'ai');
    return hasAI && this.undoStack.length >= 2;
  }

  private cancelCurrentPlayerMove(): void {
    const player = this.getCurrentPlayer();
    if (player instanceof HumanPlayer) {
      player.cancelMove();
    }
    this.isRunning = false;
  }

  // ─────────────────────────────────────────────
  // PGN
  // ─────────────────────────────────────────────

  exportPGN(): string {
    const header = [
      '[Event "Local Game"]',
      `[Date "${new Date().toISOString().slice(0, 10)}"]`,
      '[White "White"]',
      '[Black "Black"]',
      `[Result "${this.getResultString()}"]`,
    ].join('\n');

    const moves: string[] = [];
    for (let i = 0; i < this.state.moveHistory.length; i++) {
      if (i % 2 === 0) {
        moves.push(`${Math.floor(i / 2) + 1}.`);
      }
      moves.push(this.state.moveHistory[i].san ?? '?');
    }

    return header + '\n\n' + moves.join(' ') + ' ' + this.getResultString();
  }

  private getResultString(): string {
    switch (this.state.status) {
      case GameStatus.Checkmate:
        return this.state.winner === Color.White ? '1-0' : '0-1';
      case GameStatus.Stalemate:
      case GameStatus.DrawFiftyMove:
      case GameStatus.DrawRepetition:
      case GameStatus.DrawInsufficientMaterial:
        return '1/2-1/2';
      default:
        return '*';
    }
  }

  // ─────────────────────────────────────────────
  // 이벤트 시스템
  // ─────────────────────────────────────────────

  on(eventType: GameEventType | string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // 구독 해제 함수 반환
    return () => {
      const arr = this.handlers.get(eventType) ?? [];
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    };
  }

  private emit(event: GameEvent): void {
    const handlers = this.handlers.get(event.type) ?? [];
    handlers.forEach(h => h(event));

    // 모든 이벤트를 수신하는 '*' 핸들러
    const allHandlers = this.handlers.get('*') ?? [];
    allHandlers.forEach(h => h(event));
  }

  dispose(): void {
    this.isRunning = false;
    this.players.forEach(p => p.dispose?.());
    this.handlers.clear();
  }
}
