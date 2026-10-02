/**
 * IPlayer.ts
 * 플레이어 추상 인터페이스.
 *
 * HumanPlayer, AIPlayer, RemotePlayer(멀티플레이어) 모두 이 인터페이스를 구현합니다.
 * GameEngine은 IPlayer만 바라보므로, 플레이어 종류 교체가 자유롭습니다.
 */

import { Color, GameEvent, Move } from '../core/types';
import { GameState } from '../core/GameState';

export type PlayerType = 'human' | 'ai' | 'remote';

export interface IPlayer {
  /** 플레이어 색상 */
  readonly color: Color;

  /** 플레이어 종류 */
  readonly type: PlayerType;

  /**
   * 이동 요청.
   * - HumanPlayer: UI 이벤트를 기다렸다가 resolve
   * - AIPlayer: 계산 후 즉시 resolve
   * - RemotePlayer: 네트워크 응답을 기다렸다가 resolve
   *
   * @returns 선택한 Move (항상 합법 수여야 함)
   */
  requestMove(gameState: GameState): Promise<Move>;

  /**
   * 게임 이벤트 수신 (체크, 게임 종료 등 알림용).
   * 플레이어가 이벤트에 반응해야 할 경우 구현.
   */
  onGameEvent(event: GameEvent): void;

  /**
   * HumanPlayer 전용: UI로부터 이동 입력을 제공.
   * AIPlayer는 이 메서드를 구현하지 않아도 됨.
   */
  submitMove?(move: Move): void;

  /** 플레이어 정리 (구독 해제 등) */
  dispose?(): void;
}
