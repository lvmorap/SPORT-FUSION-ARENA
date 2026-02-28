import Phaser from 'phaser';
import { GameMode } from './GameMode';
import type { GameScene, TrailPoint } from '../types';
import { isArcadeBody } from '../utils/helpers';

export class PingPongMode extends GameMode {
  private bg: Phaser.GameObjects.Image | null = null;
  private ball: Phaser.Physics.Arcade.Image | null = null;
  private p1: Phaser.Physics.Arcade.Image | null = null;
  private p2: Phaser.Physics.Arcade.Image | null = null;
  private ballTrailGraphics: Phaser.GameObjects.Graphics | null = null;
  private ballTrail: TrailPoint[] = [];
  private hitCount = 0;
  private justScored = false;
  private rallyCount = 0;

  public constructor(scene: GameScene) {
    super(scene);
  }

  public setup(): void {
    this.bg = this.scene.add
      .image(400, 300, 'bg_pingpong')
      .setDisplaySize(800, 600)
      .setAlpha(0.4)
      .setDepth(-10);

    const g = this.scene.add.graphics();
    g.lineStyle(3, 0xffffff, 0.8);
    g.strokeRect(80, 80, 640, 440);
    g.lineStyle(6, 0xffffff, 1);
    g.lineBetween(400, 75, 400, 525);

    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(80, 80, 5);
    g.fillCircle(720, 80, 5);
    g.fillCircle(80, 520, 5);
    g.fillCircle(720, 520, 5);

    this.ball = this.scene.physics.add.image(400, 300, 'ball_pingpong');
    this.ball.setVelocity(250, Phaser.Math.Between(-120, 120));
    this.ball.setBounce(1, 1);
    this.ball.setMaxVelocity(1000, 700);
    this.ball.setCollideWorldBounds(false);

    this.ballTrailGraphics = this.scene.add.graphics();

    this.p1 = this.scene.physics.add.image(100, 300, 'p1_pingpong');
    this.p2 = this.scene.physics.add.image(700, 300, 'p2_pingpong');
    this.p1.setImmovable(true);
    this.p2.setImmovable(true);
    if (isArcadeBody(this.p1.body)) {
      this.p1.body.allowGravity = false;
    }
    if (isArcadeBody(this.p2.body)) {
      this.p2.body.allowGravity = false;
    }
  }

  public update(_time: number, delta: number): void {
    if (this.p1 === null || this.p2 === null || this.ball === null) {
      return;
    }

    const accel = 1800;
    const maxSpeed = 400;
    const p1Body = this.p1.body;
    const p2Body = this.p2.body;

    if (isArcadeBody(p1Body)) {
      if (this.scene.keys.w.isDown) {
        p1Body.setAccelerationY(-accel);
      } else if (this.scene.keys.s.isDown) {
        p1Body.setAccelerationY(accel);
      } else {
        p1Body.setAccelerationY(0);
        p1Body.velocity.y *= 0.85;
      }
      p1Body.velocity.y = Phaser.Math.Clamp(p1Body.velocity.y, -maxSpeed, maxSpeed);

      if (this.scene.keys.a.isDown) {
        p1Body.setAccelerationX(-accel);
      } else if (this.scene.keys.d.isDown) {
        p1Body.setAccelerationX(accel);
      } else {
        p1Body.setAccelerationX(0);
        p1Body.velocity.x *= 0.85;
      }
      p1Body.velocity.x = Phaser.Math.Clamp(p1Body.velocity.x, -maxSpeed, maxSpeed);
    }

    if (isArcadeBody(p2Body)) {
      if (this.scene.cursors.up.isDown) {
        p2Body.setAccelerationY(-accel);
      } else if (this.scene.cursors.down.isDown) {
        p2Body.setAccelerationY(accel);
      } else {
        p2Body.setAccelerationY(0);
        p2Body.velocity.y *= 0.85;
      }
      p2Body.velocity.y = Phaser.Math.Clamp(p2Body.velocity.y, -maxSpeed, maxSpeed);

      if (this.scene.cursors.left.isDown) {
        p2Body.setAccelerationX(-accel);
      } else if (this.scene.cursors.right.isDown) {
        p2Body.setAccelerationX(accel);
      } else {
        p2Body.setAccelerationX(0);
        p2Body.velocity.x *= 0.85;
      }
      p2Body.velocity.x = Phaser.Math.Clamp(p2Body.velocity.x, -maxSpeed, maxSpeed);
    }

    this.p1.y = Phaser.Math.Clamp(this.p1.y, 110, 490);
    this.p1.x = Phaser.Math.Clamp(this.p1.x, 85, 390);
    this.p2.y = Phaser.Math.Clamp(this.p2.y, 110, 490);
    this.p2.x = Phaser.Math.Clamp(this.p2.x, 410, 715);

    if (this.ball.y < 85) {
      if (this.ball.body !== null) {
        this.ball.body.velocity.y = Math.abs(this.ball.body.velocity.y);
      }
      this.ball.y = 86;
      this.createBounceEffect(this.ball.x, 80);
    }
    if (this.ball.y > 515) {
      if (this.ball.body !== null) {
        this.ball.body.velocity.y = -Math.abs(this.ball.body.velocity.y);
      }
      this.ball.y = 514;
      this.createBounceEffect(this.ball.x, 520);
    }

    const hitRange = 35;
    const paddleHitZone = 45;

    if (
      Math.abs(this.ball.x - this.p1.x) < hitRange &&
      Math.abs(this.ball.y - this.p1.y) < paddleHitZone
    ) {
      const ballVelX = this.ball.body?.velocity.x ?? 0;
      if (ballVelX < 0) {
        const spin = (this.p1.body?.velocity.y ?? 0) * 0.5;
        const speedBoost = 35 + this.rallyCount * 2;
        if (this.ball.body !== null) {
          this.ball.body.velocity.x = Math.abs(this.ball.body.velocity.x) + speedBoost;
          this.ball.body.velocity.y += spin + Phaser.Math.Between(-40, 40);
        }
        this.hitCount++;
        this.rallyCount++;
        this.onBallHit(1);
      }
    }

    if (
      Math.abs(this.ball.x - this.p2.x) < hitRange &&
      Math.abs(this.ball.y - this.p2.y) < paddleHitZone
    ) {
      const ballVelX = this.ball.body?.velocity.x ?? 0;
      if (ballVelX > 0) {
        const spin = (this.p2.body?.velocity.y ?? 0) * 0.5;
        const speedBoost = 35 + this.rallyCount * 2;
        if (this.ball.body !== null) {
          this.ball.body.velocity.x = -Math.abs(this.ball.body.velocity.x) - speedBoost;
          this.ball.body.velocity.y += spin + Phaser.Math.Between(-40, 40);
        }
        this.hitCount++;
        this.rallyCount++;
        this.onBallHit(2);
      }
    }

    this.updateBallTrail();

    if (!this.justScored) {
      if (this.ball.x < 30) {
        this.scorePoint(2);
      }
      if (this.ball.x > 770) {
        this.scorePoint(1);
      }
    }

    const ballVelX = this.ball.body?.velocity.x ?? 0;
    const ballVelY = this.ball.body?.velocity.y ?? 0;
    const ballSpeed = Math.sqrt(ballVelX ** 2 + ballVelY ** 2);
    this.ball.rotation += (ballSpeed / 800) * (delta / 16);
  }

  private createBounceEffect(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.add.circle(x + Phaser.Math.Between(-10, 10), y, 3, 0xff6600, 0.8);
      this.scene.tweens.add({
        targets: particle,
        y: y + (y < 300 ? 20 : -20),
        alpha: 0,
        scale: 0.2,
        duration: 200,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private updateBallTrail(): void {
    if (this.ball === null || this.ballTrailGraphics === null) {
      return;
    }

    this.ballTrail.push({ x: this.ball.x, y: this.ball.y, alpha: 0.6 });

    if (this.ballTrail.length > 8) {
      this.ballTrail.shift();
    }

    this.ballTrailGraphics.clear();
    for (let i = 0; i < this.ballTrail.length; i++) {
      const point = this.ballTrail[i];
      if (point !== undefined) {
        const alpha = (i / this.ballTrail.length) * 0.4;
        const size = 4 + (i / this.ballTrail.length) * 4;
        this.ballTrailGraphics.fillStyle(0xff6600, alpha);
        this.ballTrailGraphics.fillCircle(point.x, point.y, size);
      }
    }
  }

  private onBallHit(playerNum: 1 | 2): void {
    if (this.ball === null || this.p1 === null || this.p2 === null) {
      return;
    }

    this.scene.cameras.main.shake(50, 0.004);
    const ballVelX = this.ball.body?.velocity.x ?? 0;
    const ballVelY = this.ball.body?.velocity.y ?? 0;
    const speed = Math.sqrt(ballVelX ** 2 + ballVelY ** 2);
    const intensity = Math.min(speed / 900, 1);
    const r = Math.floor(255 * intensity);
    const b = Math.floor(255 * (1 - intensity));
    this.ball.setTint(Phaser.Display.Color.GetColor(r, 100, b));

    const paddle = playerNum === 1 ? this.p1 : this.p2;
    paddle.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      paddle.clearTint();
    });

    if (this.rallyCount === 5) {
      this.scene.showFloatingText(400, 250, '¡RALLY!', '#ffaa00');
    } else if (this.rallyCount === 10) {
      this.scene.showFloatingText(400, 250, '¡INCREÍBLE!', '#ff6600');
    } else if (this.rallyCount === 15) {
      this.scene.showFloatingText(400, 250, '¡ÉPICO!', '#ff0000');
    }
  }

  private scorePoint(player: 1 | 2): void {
    if (this.ball === null) {
      return;
    }

    this.justScored = true;
    if (player === 1) {
      this.p1Score++;
    } else {
      this.p2Score++;
    }

    const bonusText = this.rallyCount >= 5 ? ` +${Math.floor(this.rallyCount / 5)} BONUS` : '';
    if (this.rallyCount >= 5) {
      if (player === 1) {
        this.p1Score += Math.floor(this.rallyCount / 5);
      } else {
        this.p2Score += Math.floor(this.rallyCount / 5);
      }
    }

    this.scene.showFloatingText(
      this.ball.x,
      this.ball.y,
      '+1' + bonusText,
      player === 1 ? '#00e5ff' : '#ff3d71'
    );
    this.scene.cameras.main.shake(120, 0.008);
    this.scene.cameras.main.flash(
      150,
      player === 1 ? 0 : 255,
      player === 1 ? 229 : 61,
      player === 1 ? 255 : 113,
      true
    );

    this.rallyCount = 0;

    this.scene.time.delayedCall(1000, () => {
      this.resetBall();
      this.justScored = false;
    });
  }

  private resetBall(): void {
    if (this.ball === null) {
      return;
    }

    this.ball.setPosition(400, 300);
    const dir = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.ball.setVelocity(250 * dir, Phaser.Math.Between(-120, 120));
    this.ball.clearTint();
    this.hitCount = 0;
    this.rallyCount = 0;
    this.ballTrail = [];
  }

  public cleanup(): void {
    this.ballTrailGraphics?.destroy();
    this.ballTrailGraphics = null;
    this.bg?.destroy();
    this.bg = null;
    this.ball?.destroy();
    this.ball = null;
    this.p1?.destroy();
    this.p1 = null;
    this.p2?.destroy();
    this.p2 = null;
  }

  public get modeName(): 'pingpong' {
    return 'pingpong';
  }
}
