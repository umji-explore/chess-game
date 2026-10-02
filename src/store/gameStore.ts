/**
 * gameStore.ts
 * Zustand 기반 전역 게임 상태 스토어.
 *
 * UI 컴포넌트는 이 스토어만 구독하여 렌더링합니다.
 * GameEngine의 이벤트를 받아 상태를 업데이트합니다.
 */

import { create } from 'zustand';
import { GameEngine } from '../engine/GameEngine';
import { Board } from '../core/Board';
import { StandardRules } from '../core/rules/StandardRules';
import { HumanPlayer } from '../players/HumanPlayer';
import { AIPlayer } from '../players/ai/AIPlayer';
import { IPlayer } from '../players/IPlayer';
import {
  AILevel,
  Color,
  GameMode,
  GameStatus,
  Move,
  MoveFlag,
  PieceType,
  Position,
} from '../core/types';
import { GameState, cloneGameState } from '../core/GameState';
import { useTimerStore } from './timerStore';

interface GameStore {
  /** GameEngine 인스턴스 */
  engine: GameEngine | null;

  /** 미러링된 게임 상태 (렌더링용) */
  gameState: GameState | null;

  /** 선택된 칸 */
  selectedPos: Position | null;

  /** 선택된 말의 합법 수 */
  legalMoves: Move[];

  /** 마지막 이동 */
  lastMove: Move | null;

  /** 프로모션 대기 중인 이동 */
  pendingPromotion: { move: Move; color: Color } | null;

  /** 게임 종료 모달 표시 여부 */
  showGameOver: boolean;

  /** 설정 모달 표시 여부 */
  showSettings: boolean;

  /** 웰컴 모달 표시 여부 */
  showWelcome: boolean;

  /** 현재 게임 모드 */
  gameMode: GameMode;

  /** AI 레벨 */
  aiLevel: AILevel;

  /** AI 색상 */
  aiColor: Color;

  /** 보드 뒤집기 여부 */
  boardFlipped: boolean;

  /** 현재 테마 */
  theme: 'classic' | 'dark' | 'wooden';

  /** AI 계산 중 여부 */
  isAIThinking: boolean;

  /** 기보 점프 인덱스 (null = 최신 수) */
  jumpIndex: number | null;

  // 액션
  startNewGame: (mode?: GameMode, aiLevel?: AILevel, aiColor?: Color) => void;
  selectSquare: (pos: Position) => void;
  submitPromotion: (type: PieceType) => void;
  undo: () => void;
  redo: () => void;
  flipBoard: () => void;
  setTheme: (theme: 'classic' | 'dark' | 'wooden') => void;
  setShowSettings: (v: boolean) => void;
  setShowGameOver: (v: boolean) => void;
  setShowWelcome: (v: boolean) => void;
  exportPGN: () => void;
  jumpToMove: (index: number | null) => void;
}

const ruleSet = new StandardRules();

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  gameState: null,
  selectedPos: null,
  legalMoves: [],
  lastMove: null,
  pendingPromotion: null,
  showGameOver: false,
  showSettings: false,
  showWelcome: true,
  gameMode: GameMode.HumanVsHuman,
  aiLevel: AILevel.Medium,
  aiColor: Color.Black,
  boardFlipped: false,
  theme: 'classic',
  isAIThinking: false,
  jumpIndex: null,

  // ─────────────────────────────────────────────
  // 새 게임 시작
  // ─────────────────────────────────────────────
  startNewGame: (
    mode = GameMode.HumanVsHuman,
    aiLevelArg = AILevel.Medium,
    aiColorArg = Color.Black,
  ) => {
    // 기존 엔진 정리
    get().engine?.dispose();

    let whitePl: IPlayer;
    let blackPl: IPlayer;
    // 실제 AI 담당 색상
    let resolvedAiColor = aiColorArg;

    if (mode === GameMode.HumanVsHuman) {
      whitePl = new HumanPlayer(Color.White);
      blackPl = new HumanPlayer(Color.Black);
      resolvedAiColor = Color.Black; // 의미 없지만 기본값 유지
    } else if (mode === GameMode.HumanVsAI) {
      // 사람=백, AI=흑
      whitePl = new HumanPlayer(Color.White);
      blackPl = new AIPlayer(Color.Black, aiLevelArg, ruleSet);
      resolvedAiColor = Color.Black;
    } else {
      // AIVsHuman: AI=백, 사람=흑
      whitePl = new AIPlayer(Color.White, aiLevelArg, ruleSet);
      blackPl = new HumanPlayer(Color.Black);
      resolvedAiColor = Color.White;
    }

    const engine = new GameEngine(ruleSet, [whitePl, blackPl]);

    // 타이머 리셋
    useTimerStore.getState().resetTimer();

    // 엔진 이벤트 → 스토어 업데이트
    engine.on('*', (event) => {
      const state = engine.getState();
      set({
        gameState: { ...state },
        lastMove: state.moveHistory[state.moveHistory.length - 1] ?? null,
        selectedPos: null,
        legalMoves: [],
        jumpIndex: null,
      });

      // AI 생각 중 표시: turn_changed 이벤트 + AI 차례
      if (event.type === 'turn_changed') {
        const currentMode = get().gameMode;
        const currentAiColor = get().aiColor;
        const isAITurn =
          currentMode !== GameMode.HumanVsHuman &&
          state.currentTurn === currentAiColor;
        set({ isAIThinking: isAITurn });
        // 타이머: 이전 차례 멈추고 새 차례 시작
        const timer = useTimerStore.getState();
        timer.stopTimer();
        timer.startTimer(state.currentTurn);
      }

      // 이동 후 AI thinking 해제
      if (event.type === 'move') {
        set({ isAIThinking: false });
      }

      // 게임 종료 모달
      if (
        state.status === GameStatus.Checkmate ||
        state.status === GameStatus.Stalemate ||
        state.status === GameStatus.DrawFiftyMove ||
        state.status === GameStatus.DrawRepetition ||
        state.status === GameStatus.DrawInsufficientMaterial
      ) {
        set({ showGameOver: true, isAIThinking: false });
        useTimerStore.getState().stopTimer();
      }
    });

    set({
      engine,
      gameMode: mode,
      aiLevel: aiLevelArg,
      aiColor: resolvedAiColor,
      selectedPos: null,
      legalMoves: [],
      lastMove: null,
      pendingPromotion: null,
      showGameOver: false,
      showWelcome: false,
      isAIThinking: false,
      jumpIndex: null,
    });

    engine.start();
  },

  // ─────────────────────────────────────────────
  // 칸 선택 / 이동
  // ─────────────────────────────────────────────
  selectSquare: (pos: Position) => {
    const {
      engine, gameState, selectedPos, legalMoves,
      gameMode, aiColor, isAIThinking,
    } = get();
    if (!engine || !gameState) return;

    const { status, currentTurn, board } = gameState;

    // 게임 진행 중이 아니면 무시
    if (status !== GameStatus.Playing && status !== GameStatus.Check) return;

    // AI 생각 중이거나 AI 차례이면 클릭 무시
    if (isAIThinking) return;
    if (gameMode !== GameMode.HumanVsHuman && currentTurn === aiColor) return;

    const clickedPiece = board.getPiece(pos);

    // ── 이미 선택된 상태 ──
    if (selectedPos) {
      // 합법 수로 이동 시도
      const targetMove = legalMoves.find(
        m => m.to.row === pos.row && m.to.col === pos.col,
      );

      if (targetMove) {
        // 프로모션 체크 (PromoteXxx 플래그 = 5~8)
        if (
          targetMove.flag === MoveFlag.PromoteQueen ||
          targetMove.flag === MoveFlag.PromoteRook ||
          targetMove.flag === MoveFlag.PromoteBishop ||
          targetMove.flag === MoveFlag.PromoteKnight
        ) {
          // 같은 목적지로 가는 프로모션 이동 중 Queen 기본 선택
          // 모달을 띄워 사용자가 선택하도록 함
          set({
            pendingPromotion: { move: targetMove, color: currentTurn },
            selectedPos: null,
            legalMoves: [],
          });
          return;
        }

        // 일반 이동 실행
        engine.submitHumanMove(targetMove);
        set({ selectedPos: null, legalMoves: [] });
        return;
      }

      // 같은 색 다른 말 클릭 → 재선택
      if (clickedPiece && clickedPiece.color === currentTurn) {
        const moves = engine.getLegalMoves(pos);
        set({ selectedPos: pos, legalMoves: moves });
        return;
      }

      // 빈 칸 또는 상대 말 (이동 불가) → 선택 해제
      set({ selectedPos: null, legalMoves: [] });
      return;
    }

    // ── 새로 선택 ──
    if (clickedPiece && clickedPiece.color === currentTurn) {
      const moves = engine.getLegalMoves(pos);
      set({ selectedPos: pos, legalMoves: moves });
    }
  },

  // ─────────────────────────────────────────────
  // 프로모션
  // ─────────────────────────────────────────────
  submitPromotion: (type: PieceType) => {
    const { engine, pendingPromotion } = get();
    if (!engine || !pendingPromotion) return;

    // 프로모션 타입에 맞는 MoveFlag로 교체
    const flagByType: Record<string, MoveFlag> = {
      [PieceType.Queen]:  MoveFlag.PromoteQueen,
      [PieceType.Rook]:   MoveFlag.PromoteRook,
      [PieceType.Bishop]: MoveFlag.PromoteBishop,
      [PieceType.Knight]: MoveFlag.PromoteKnight,
    };

    const move: Move = {
      ...pendingPromotion.move,
      promoteTo: type,
      flag: flagByType[type] ?? MoveFlag.PromoteQueen,
    };

    engine.submitHumanMove(move);
    set({ pendingPromotion: null });
  },

  // ─────────────────────────────────────────────
  // 컨트롤
  // ─────────────────────────────────────────────
  undo: () => {
    const { engine } = get();
    if (!engine) return;
    set({ isAIThinking: false });
    engine.undo();
  },
  redo: () => {
    const { engine } = get();
    if (!engine) return;
    set({ isAIThinking: false });
    engine.redo();
  },
  flipBoard: () => set(s => ({ boardFlipped: !s.boardFlipped })),
  setTheme: (theme) => set({ theme }),
  setShowSettings: (v) => set({ showSettings: v }),
  setShowGameOver: (v) => set({ showGameOver: v }),
  setShowWelcome: (v) => set({ showWelcome: v }),

  exportPGN: () => {
    const pgn = get().engine?.exportPGN() ?? '';
    if (!pgn) return;
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess_${new Date().toISOString().slice(0, 10)}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 기보의 특정 수(index)로 상태를 점프합니다.
   * index = null 이면 최신 수로 돌아갑니다.
   */
  jumpToMove: (index) => {
    const { engine } = get();
    if (!engine) return;

    const fullState = engine.getState();
    if (index === null) {
      // 최신 상태 표시
      set({
        gameState: { ...fullState },
        jumpIndex: null,
        lastMove: fullState.moveHistory[fullState.moveHistory.length - 1] ?? null,
      });
      return;
    }

    // 인덱스 번째까지의 이동만 재현한 상태를 계산
    // GameEngine의 undoStack에서 꺼내는 대신 fenHistory를 활용
    // 간단히 moveHistory를 슬라이스하고 fenHistory에서 board를 재구성
    const fenAtIndex = fullState.fenHistory[index + 1]; // index+1: 0수=초기FEN, 1수후=index1
    if (!fenAtIndex) return;

    const snapshotBoard = Board.fromFEN(fenAtIndex);
    const slicedMoves = fullState.moveHistory.slice(0, index + 1);
    const snapshotState = {
      ...cloneGameState(fullState),
      board: snapshotBoard,
      moveHistory: slicedMoves,
      currentTurn: snapshotBoard.turn,
    };

    set({
      gameState: snapshotState,
      jumpIndex: index,
      lastMove: slicedMoves[slicedMoves.length - 1] ?? null,
    });
  },
}));
