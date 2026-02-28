import type { GameScene, ModeName } from '../types';

export abstract class GameMode {
  protected scene: GameScene;
  public p1Score = 0;
  public p2Score = 0;
  public timeLeft = 60;

  public constructor(scene: GameScene) {
    this.scene = scene;
  }

  public abstract setup(): void;
  public abstract update(time: number, delta: number): void;
  public abstract cleanup(): void;
  public abstract get modeName(): ModeName;
}
