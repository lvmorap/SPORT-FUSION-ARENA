import Phaser from 'phaser';
import { GameMode } from './GameMode';
import type { GameScene, Goal } from '../types';
import { createImpactParticles, isArcadeBody } from '../utils/helpers';

export class FootballMode extends GameMode {
  private bg: Phaser.GameObjects.Image | null = null;
  private ball: Phaser.Physics.Arcade.Image | null = null;
  private p1: Phaser.Physics.Arcade.Image | null = null;
  private p2: Phaser.Physics.Arcade.Image | null = null;
  private goal1: Goal = { x: 80, y: 300, width: 18, height: 100, speed: 100, dir: 1 };
  private goal2: Goal = { x: 720, y: 300, width: 18, height: 100, speed: 100, dir: -1 };
  private goalGraphics: Phaser.GameObjects.Graphics | null = null;
  private particleGraphics: Phaser.GameObjects.Graphics | null = null;
  private justScored = false;

  public constructor(scene: GameScene) {
    super(scene);
  }

  public setup(): void {
    this.bg = this.scene.add
      .image(400, 300, 'bg_football')
      .setDisplaySize(800, 600)
      .setAlpha(0.35)
      .setDepth(-10);

    const g = this.scene.add.graphics();
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeRect(60, 40, 680, 520);
    g.lineBetween(400, 40, 400, 560);
    g.strokeCircle(400, 300, 70);

    g.lineStyle(2, 0xffffff, 0.4);
    g.beginPath();
    g.arc(60, 40, 20, 0, Math.PI / 2);
    g.strokePath();
    g.beginPath();
    g.arc(740, 40, 20, Math.PI / 2, Math.PI);
    g.strokePath();
    g.beginPath();
    g.arc(60, 560, 20, -Math.PI / 2, 0);
    g.strokePath();
    g.beginPath();
    g.arc(740, 560, 20, Math.PI, -Math.PI / 2);
    g.strokePath();

    this.ball = this.scene.physics.add.image(400, 300, 'ball_football');
    this.ball.setBounce(0.85);
    this.ball.setMaxVelocity(700, 700);
    this.ball.setCollideWorldBounds(true);
    this.ball.setDrag(30);
    this.ball.setMass(0.8);

    this.p1 = this.scene.physics.add.image(200, 300, 'p1_football');
    this.p2 = this.scene.physics.add.image(600, 300, 'p2_football');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.4);
    this.p2.setBounce(0.4);
    if (isArcadeBody(this.p1.body)) {
      this.p1.body.setDrag(350);
    }
    if (isArcadeBody(this.p2.body)) {
      this.p2.body.setDrag(350);
    }
    this.p1.setMass(1.2);
    this.p2.setMass(1.2);

    this.scene.physics.add.collider(this.ball, this.p1, () => {
      this.onBallHit(1);
    });
    this.scene.physics.add.collider(this.ball, this.p2, () => {
      this.onBallHit(2);
    });
    this.scene.physics.add.collider(this.p1, this.p2, () => {
      this.onPlayerCollision();
    });

    this.goalGraphics = this.scene.add.graphics();
    this.particleGraphics = this.scene.add.graphics();
  }

  private onBallHit(playerNum: 1 | 2): void {
    if (this.ball === null || this.p1 === null || this.p2 === null) {
      return;
    }

    const player = playerNum === 1 ? this.p1 : this.p2;
    const kickMultiplier = 1.3;
    const playerVelX = player.body?.velocity.x ?? 0;
    const playerVelY = player.body?.velocity.y ?? 0;

    if (this.ball.body !== null) {
      this.ball.body.velocity.x += playerVelX * kickMultiplier;
      this.ball.body.velocity.y += playerVelY * kickMultiplier;
    }

    this.scene.cameras.main.shake(50, 0.004);
    this.ball.setTint(playerNum === 1 ? 0x00e5ff : 0xff3d71);
    this.scene.time.delayedCall(100, () => {
      this.ball?.clearTint();
    });

    createImpactParticles(
      this.scene,
      this.ball.x,
      this.ball.y,
      playerNum === 1 ? 0x00e5ff : 0xff3d71
    );
  }

  private onPlayerCollision(): void {
    this.scene.cameras.main.shake(80, 0.006);
  }

  public update(_time: number, delta: number): void {
    if (this.p1 === null || this.p2 === null || this.ball === null) {
      return;
    }

    const speed = 300;
    const accel = 1200;
    const p1Body = this.p1.body;
    const p2Body = this.p2.body;

    if (isArcadeBody(p1Body)) {
      if (this.scene.keys.w.isDown) {
        p1Body.setAccelerationY(-accel);
      } else if (this.scene.keys.s.isDown) {
        p1Body.setAccelerationY(accel);
      } else {
        p1Body.setAccelerationY(0);
      }

      if (this.scene.keys.a.isDown) {
        p1Body.setAccelerationX(-accel);
      } else if (this.scene.keys.d.isDown) {
        p1Body.setAccelerationX(accel);
      } else {
        p1Body.setAccelerationX(0);
      }

      p1Body.velocity.x = Phaser.Math.Clamp(p1Body.velocity.x, -speed, speed);
      p1Body.velocity.y = Phaser.Math.Clamp(p1Body.velocity.y, -speed, speed);
    }

    if (isArcadeBody(p2Body)) {
      if (this.scene.cursors.up.isDown) {
        p2Body.setAccelerationY(-accel);
      } else if (this.scene.cursors.down.isDown) {
        p2Body.setAccelerationY(accel);
      } else {
        p2Body.setAccelerationY(0);
      }

      if (this.scene.cursors.left.isDown) {
        p2Body.setAccelerationX(-accel);
      } else if (this.scene.cursors.right.isDown) {
        p2Body.setAccelerationX(accel);
      } else {
        p2Body.setAccelerationX(0);
      }

      p2Body.velocity.x = Phaser.Math.Clamp(p2Body.velocity.x, -speed, speed);
      p2Body.velocity.y = Phaser.Math.Clamp(p2Body.velocity.y, -speed, speed);
    }

    const ballVelX = this.ball.body?.velocity.x ?? 0;
    const ballVelY = this.ball.body?.velocity.y ?? 0;
    const ballSpeed = Math.sqrt(ballVelX ** 2 + ballVelY ** 2);
    this.ball.rotation += (ballSpeed / 500) * (delta / 16);

    this.updateGoals(delta);
    this.checkGoal();
  }

  private updateGoals(delta: number): void {
    if (this.goalGraphics === null) {
      return;
    }

    this.goal1.y += this.goal1.speed * this.goal1.dir * (delta / 1000);
    this.goal2.y += this.goal2.speed * this.goal2.dir * (delta / 1000);

    if (this.goal1.y < 120 || this.goal1.y > 480) {
      this.goal1.dir *= -1;
    }
    if (this.goal2.y < 120 || this.goal2.y > 480) {
      this.goal2.dir *= -1;
    }

    this.goalGraphics.clear();
    this.goalGraphics.lineStyle(4, 0xffffff, 1);

    const g1top = this.goal1.y - this.goal1.height / 2;
    const g1bot = this.goal1.y + this.goal1.height / 2;
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x - 9, g1bot);
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x + 9, g1top);
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1bot, this.goal1.x + 9, g1bot);

    const g2top = this.goal2.y - this.goal2.height / 2;
    const g2bot = this.goal2.y + this.goal2.height / 2;
    this.goalGraphics.lineBetween(this.goal2.x + 9, g2top, this.goal2.x + 9, g2bot);
    this.goalGraphics.lineBetween(this.goal2.x - 9, g2top, this.goal2.x + 9, g2top);
    this.goalGraphics.lineBetween(this.goal2.x - 9, g2bot, this.goal2.x + 9, g2bot);
  }

  private checkGoal(): void {
    if (this.justScored || this.ball === null) {
      return;
    }

    const bx = this.ball.x;
    const by = this.ball.y;
    const bvx = this.ball.body?.velocity.x ?? 0;

    if (bvx > 50 && bx > this.goal2.x - 20 && bx < this.goal2.x + 20) {
      if (by > this.goal2.y - this.goal2.height / 2 && by < this.goal2.y + this.goal2.height / 2) {
        this.scoreGoal(1);
      }
    }

    if (bvx < -50 && bx > this.goal1.x - 20 && bx < this.goal1.x + 20) {
      if (by > this.goal1.y - this.goal1.height / 2 && by < this.goal1.y + this.goal1.height / 2) {
        this.scoreGoal(2);
      }
    }
  }

  private scoreGoal(player: 1 | 2): void {
    if (this.ball === null) {
      return;
    }

    if (player === 1) {
      this.p1Score++;
    } else {
      this.p2Score++;
    }

    this.justScored = true;

    this.scene.cameras.main.shake(300, 0.015);
    this.scene.cameras.main.flash(
      200,
      player === 1 ? 0 : 255,
      player === 1 ? 229 : 61,
      player === 1 ? 255 : 113,
      true
    );

    this.scene.showFloatingText(
      this.ball.x,
      this.ball.y,
      '¡GOL!',
      player === 1 ? '#00e5ff' : '#ff3d71'
    );

    const goalX = player === 1 ? this.goal2.x : this.goal1.x;
    const goalY = player === 1 ? this.goal2.y : this.goal1.y;
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 80);
      const particle = this.scene.add.circle(
        goalX,
        goalY,
        Phaser.Math.Between(3, 8),
        player === 1 ? 0x00e5ff : 0xff3d71,
        1
      );
      this.scene.tweens.add({
        targets: particle,
        x: goalX + Math.cos(angle) * dist,
        y: goalY + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    this.scene.time.delayedCall(1000, () => {
      if (this.ball !== null && isArcadeBody(this.ball.body)) {
        this.ball.setPosition(400, 300);
        this.ball.body.setVelocity(0, 0);
      }
      this.justScored = false;
    });
  }

  public cleanup(): void {
    this.goalGraphics?.destroy();
    this.particleGraphics?.destroy();
    this.bg?.destroy();
    this.ball?.destroy();
    this.p1?.destroy();
    this.p2?.destroy();
  }

  public get modeName(): 'football' {
    return 'football';
  }
}
