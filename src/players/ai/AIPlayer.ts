/**
 * AIPlayer.ts
 * AI 플레이어 (IPlayer 구현).
 * 레벨에 따라 RandomAgent 또는 MinimaxAgent를 사용합니다.
 * 나중에 StockfishPlayer로 교체하려면 이 파일만 수정하면 됩니다.
 */

import { Color, GameEvent, Move, AILevel } from '../../core/types';
import { GameState } from '../../core/GameState';
import { IPlayer } from '../IPlayer';
import { IRuleSet } from '../../core/rules/IRuleSet';
import { MinimaxAgent } from './MinimaxAgent';

/** 레벨별 미니맥스 깊이 */
const DEPTH_MAP: Record<AILevel, number> = {
  [AILevel.Random]: 0,
  [AILevel.Easy]:   1,
  [AILevel.Medium]: 3,
  [AILevel.Hard]:   5,
};

export class AIPlayer implements IPlayer {
  readonly color: Color;
  readonly type = 'ai' as const;
  readonly level: AILevel;

  private ruleSet: IRuleSet;

  constructor(color: Color, level: AILevel, ruleSet: IRuleSet) {
    this.color = color;
    this.level = level;
    this.ruleSet = ruleSet;
  }

  /**
   * AI가 최선 수를 계산하여 반환합니다.
   * 약간의 딜레이를 줘서 UI가 응답할 시간을 제공합니다.
   */
  async requestMove(gameState: GameState): Promise<Move> {
    // UI 업데이트를 위한 최소 딜레이
    await new Promise(resolve => setTimeout(resolve, 300));

    const board = gameState.board;
    const moves = this.ruleSet.getAllLegalMoves(board, this.color, gameState);

    if (moves.length === 0) {
      throw new Error('AI has no legal moves');
    }

    // 랜덤 레벨
    if (this.level === AILevel.Random) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // 미니맥스 레벨
    const depth = DEPTH_MAP[this.level];
    const agent = new MinimaxAgent(this.ruleSet, depth);
    const bestMove = agent.findBestMove(board, this.color, gameState);

    return bestMove ?? moves[Math.floor(Math.random() * moves.length)];
  }

  onGameEvent(_event: GameEvent): void {
    // AI는 게임 이벤트에 별도 반응 불필요
  }
}
