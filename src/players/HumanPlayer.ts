/**
 * HumanPlayer.ts
 * 마우스/터치 입력 기반 인간 플레이어.
 *
 * requestMove()는 Promise를 반환하고,
 * UI가 submitMove()를 호출하면 Promise가 resolve됩니다.
 * 이 방식으로 GameEngine은 플레이어 종류에 관계없이
 * await player.requestMove(state) 형태로 통일하여 사용합니다.
 */

import { Color, GameEvent, Move } from '../core/types';
import { GameState } from '../core/GameState';
import { IPlayer } from './IPlayer';

export class HumanPlayer implements IPlayer {
  readonly color: Color;
  readonly type = 'human' as const;

  /** 현재 대기 중인 이동 resolve 함수 */
  private pendingResolve: ((move: Move) => void) | null = null;

  constructor(color: Color) {
    this.color = color;
  }

  /**
   * UI 이벤트를 기다립니다.
   * submitMove()가 호출될 때까지 Promise가 pending 상태로 유지됩니다.
   */
  requestMove(_gameState: GameState): Promise<Move> {
    return new Promise(resolve => {
      this.pendingResolve = resolve;
    });
  }

  /**
   * UI에서 이 메서드를 호출하여 이동을 제출합니다.
   * GameEngine의 requestMove() Promise를 resolve합니다.
   */
  submitMove(move: Move): void {
    if (this.pendingResolve) {
      this.pendingResolve(move);
      this.pendingResolve = null;
    }
  }

  /** 현재 이동 대기 중인지 */
  isWaitingForMove(): boolean {
    return this.pendingResolve !== null;
  }

  /** 대기 중인 이동 취소 (게임 리셋 등) */
  cancelMove(): void {
    this.pendingResolve = null;
  }

  onGameEvent(_event: GameEvent): void {
    // HumanPlayer는 게임 이벤트에 특별히 반응하지 않음
    // (UI가 gameStore를 통해 별도로 처리)
  }

  dispose(): void {
    this.cancelMove();
  }
}
