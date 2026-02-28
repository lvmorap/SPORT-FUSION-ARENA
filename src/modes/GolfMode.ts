import Phaser from 'phaser';
import { GameMode } from './GameMode';
import type { GameScene, Hole, Hazard, TrailPoint } from '../types';
import { isArcadeBody } from '../utils/helpers';

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpinnerObstacle {
  cx: number;
  cy: number;
  length: number;
  angle: number;
  speed: number;
  thickness: number;
}

interface GapWall {
  x: number;
  y: number;
  totalWidth: number;
  height: number;
  gapOffset: number;
  gapSize: number;
  vertical: boolean;
}

interface MovingBar {
  x: number;
  y: number;
  width: number;
  height: number;
  minPos: number;
  maxPos: number;
  speed: number;
  dir: number;
  vertical: boolean;
}

export class GolfMode extends GameMode {
  private bg: Phaser.GameObjects.Image | null = null;
  private courseGraphics: Phaser.GameObjects.Graphics | null = null;
  private holeGraphics: Phaser.GameObjects.Graphics | null = null;
  private ballTrailGraphics: Phaser.GameObjects.Graphics | null = null;
  private powerBarGraphics: Phaser.GameObjects.Graphics | null = null;
  private arrowGraphics: Phaser.GameObjects.Graphics | null = null;
  private obstacleGraphics: Phaser.GameObjects.Graphics | null = null;
  private strokeText: Phaser.GameObjects.Text | null = null;

  private hole: Hole = { x: 720, y: 80, r: 20 };
  private waterHazard: Hazard = { x: 200, y: 310, radius: 35 };
  private sandTrap: Hazard = { x: 500, y: 150, radius: 30 };

  private walls: Wall[] = [
    { x: 20, y: 390, w: 10, h: 180 },
    { x: 20, y: 560, w: 250, h: 10 },
    { x: 260, y: 390, w: 10, h: 180 },
    { x: 20, y: 390, w: 130, h: 10 },
    { x: 140, y: 150, w: 10, h: 250 },
    { x: 260, y: 150, w: 10, h: 250 },
    { x: 140, y: 150, w: 130, h: 10 },
    { x: 140, y: 85, w: 10, h: 75 },
    { x: 260, y: 60, w: 10, h: 100 },
    { x: 140, y: 85, w: 510, h: 10 },
    { x: 640, y: 60, w: 140, h: 10 },
    { x: 770, y: 60, w: 10, h: 180 },
    { x: 640, y: 230, w: 140, h: 10 },
    { x: 260, y: 60, w: 390, h: 10 },
  ];

  private spinner: SpinnerObstacle = {
    cx: 400,
    cy: 145,
    length: 65,
    angle: 0,
    speed: 1.8,
    thickness: 8,
  };

  private gapWall: GapWall = {
    x: 200,
    y: 230,
    totalWidth: 8,
    height: 150,
    gapOffset: 55,
    gapSize: 40,
    vertical: true,
  };

  private movingBar: MovingBar = {
    x: 500,
    y: 145,
    width: 8,
    height: 60,
    minPos: 95,
    maxPos: 220,
    speed: 120,
    dir: 1,
    vertical: true,
  };

  private p1Ball: Phaser.Physics.Arcade.Image | null = null;
  private p2Ball: Phaser.Physics.Arcade.Image | null = null;
  private p1Trail: TrailPoint[] = [];
  private p2Trail: TrailPoint[] = [];

  private p1Power = 0;
  private p2Power = 0;
  private p1Charging = false;
  private p2Charging = false;
  private p1Angle = -Math.PI / 2;
  private p2Angle = -Math.PI / 2;
  private p1Strokes = 0;
  private p2Strokes = 0;
  private p1Finished = false;
  private p2Finished = false;

  public constructor(scene: GameScene) {
    super(scene);
  }

  public setup(): void {
    this.bg = this.scene.add
      .image(400, 300, 'bg_golf')
      .setDisplaySize(800, 600)
      .setAlpha(0.4)
      .setDepth(-10);

    this.courseGraphics = this.scene.add.graphics();
    this.drawCourse();

    this.holeGraphics = this.scene.add.graphics();
    this.drawHole();

    this.obstacleGraphics = this.scene.add.graphics();

    this.ballTrailGraphics = this.scene.add.graphics();

    this.p1Ball = this.scene.physics.add.image(80, 490, 'p1_golf');
    this.p2Ball = this.scene.physics.add.image(120, 490, 'p2_golf');
    this.p1Ball.setBounce(0.5).setDrag(100).setMaxVelocity(800, 800);
    this.p2Ball.setBounce(0.5).setDrag(100).setMaxVelocity(800, 800);
    this.p1Ball.setCollideWorldBounds(true);
    this.p2Ball.setCollideWorldBounds(true);

    this.scene.physics.add.collider(this.p1Ball, this.p2Ball, () => {
      this.onBallCollision();
    });

    this.strokeText = this.scene.add
      .text(400, 585, 'P1: 0 golpes | P2: 0 golpes', {
        fontSize: '14px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.powerBarGraphics = this.scene.add.graphics();
    this.arrowGraphics = this.scene.add.graphics();
  }

  private onBallCollision(): void {
    if (this.p1Ball === null || this.p2Ball === null) {
      return;
    }

    this.scene.cameras.main.shake(60, 0.004);
    const midX = (this.p1Ball.x + this.p2Ball.x) / 2;
    const midY = (this.p1Ball.y + this.p2Ball.y) / 2;
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(midX, midY, 3, 0xffffff, 0.8);
      const angle = Math.random() * Math.PI * 2;
      this.scene.tweens.add({
        targets: particle,
        x: midX + Math.cos(angle) * 15,
        y: midY + Math.sin(angle) * 15,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private drawHole(): void {
    if (this.holeGraphics === null) {
      return;
    }

    this.holeGraphics.fillStyle(0x000000, 0.3);
    this.holeGraphics.fillCircle(this.hole.x + 3, this.hole.y + 3, this.hole.r);

    this.holeGraphics.fillStyle(0x000000);
    this.holeGraphics.fillCircle(this.hole.x, this.hole.y, this.hole.r);

    this.holeGraphics.lineStyle(3, 0xffffff, 0.8);
    this.holeGraphics.strokeCircle(this.hole.x, this.hole.y, this.hole.r);
    this.holeGraphics.lineStyle(3, 0xff0000);
    this.holeGraphics.strokeCircle(this.hole.x, this.hole.y, this.hole.r + 5);

    this.holeGraphics.lineStyle(3, 0x8b4513);
    this.holeGraphics.lineBetween(this.hole.x, this.hole.y, this.hole.x, this.hole.y - 55);

    this.holeGraphics.fillStyle(0xff0000);
    this.holeGraphics.fillTriangle(
      this.hole.x,
      this.hole.y - 55,
      this.hole.x + 30,
      this.hole.y - 42,
      this.hole.x,
      this.hole.y - 30
    );
    this.holeGraphics.lineStyle(2, 0xcc0000);
    this.holeGraphics.strokeTriangle(
      this.hole.x,
      this.hole.y - 55,
      this.hole.x + 30,
      this.hole.y - 42,
      this.hole.x,
      this.hole.y - 30
    );
  }

  private drawCourse(): void {
    if (this.courseGraphics === null) {
      return;
    }

    this.courseGraphics.fillStyle(0x1a3d1a, 0.5);
    this.courseGraphics.fillRect(20, 390, 250, 180);
    this.courseGraphics.fillRect(140, 85, 130, 320);
    this.courseGraphics.fillRect(140, 60, 520, 100);
    this.courseGraphics.fillRect(640, 60, 140, 180);

    this.courseGraphics.fillStyle(0x2d5a2d, 0.7);
    this.courseGraphics.fillRect(40, 410, 210, 140);
    this.courseGraphics.fillRect(155, 100, 100, 300);
    this.courseGraphics.fillRect(155, 75, 490, 70);
    this.courseGraphics.fillRect(655, 75, 110, 150);

    this.courseGraphics.fillStyle(0x3d7a3d, 0.8);
    this.courseGraphics.fillCircle(this.hole.x, this.hole.y, 50);

    this.courseGraphics.fillStyle(0xd4b896, 0.8);
    this.courseGraphics.fillCircle(this.sandTrap.x, this.sandTrap.y, this.sandTrap.radius);
    this.courseGraphics.lineStyle(2, 0xc4a886, 0.6);
    this.courseGraphics.strokeCircle(this.sandTrap.x, this.sandTrap.y, this.sandTrap.radius);

    this.courseGraphics.fillStyle(0x0066cc, 0.7);
    this.courseGraphics.fillCircle(this.waterHazard.x, this.waterHazard.y, this.waterHazard.radius);
    this.courseGraphics.lineStyle(2, 0x0088ff, 0.5);
    this.courseGraphics.strokeCircle(
      this.waterHazard.x,
      this.waterHazard.y,
      this.waterHazard.radius * 0.7
    );
    this.courseGraphics.strokeCircle(
      this.waterHazard.x,
      this.waterHazard.y,
      this.waterHazard.radius * 0.4
    );
    this.courseGraphics.fillStyle(0x66aaff, 0.5);
    this.courseGraphics.fillCircle(this.waterHazard.x - 8, this.waterHazard.y - 8, 8);

    for (const wall of this.walls) {
      this.courseGraphics.fillStyle(0x5c3a1e, 0.9);
      this.courseGraphics.fillRect(wall.x, wall.y, wall.w, wall.h);
      this.courseGraphics.lineStyle(1, 0x8b5e3c, 0.8);
      this.courseGraphics.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
  }

  private drawObstacles(): void {
    if (this.obstacleGraphics === null) {
      return;
    }

    this.obstacleGraphics.clear();

    const s = this.spinner;
    const ex1 = s.cx + Math.cos(s.angle) * s.length;
    const ey1 = s.cy + Math.sin(s.angle) * s.length;
    const ex2 = s.cx - Math.cos(s.angle) * s.length;
    const ey2 = s.cy - Math.sin(s.angle) * s.length;
    this.obstacleGraphics.lineStyle(s.thickness, 0xff6600, 0.9);
    this.obstacleGraphics.lineBetween(ex1, ey1, ex2, ey2);
    this.obstacleGraphics.fillStyle(0xff8800, 1);
    this.obstacleGraphics.fillCircle(s.cx, s.cy, 6);
    this.obstacleGraphics.lineStyle(2, 0xffaa00, 0.6);
    this.obstacleGraphics.strokeCircle(s.cx, s.cy, 8);

    const gw = this.gapWall;
    if (gw.vertical) {
      this.obstacleGraphics.fillStyle(0x666666, 0.9);
      this.obstacleGraphics.fillRect(gw.x, gw.y, gw.totalWidth, gw.gapOffset);
      this.obstacleGraphics.fillRect(
        gw.x,
        gw.y + gw.gapOffset + gw.gapSize,
        gw.totalWidth,
        gw.height - gw.gapOffset - gw.gapSize
      );
      this.obstacleGraphics.lineStyle(1, 0x888888, 0.7);
      this.obstacleGraphics.strokeRect(gw.x, gw.y, gw.totalWidth, gw.gapOffset);
      this.obstacleGraphics.strokeRect(
        gw.x,
        gw.y + gw.gapOffset + gw.gapSize,
        gw.totalWidth,
        gw.height - gw.gapOffset - gw.gapSize
      );
      this.obstacleGraphics.fillStyle(0x00ff00, 0.3);
      this.obstacleGraphics.fillRect(gw.x - 2, gw.y + gw.gapOffset, gw.totalWidth + 4, gw.gapSize);
    }

    const mb = this.movingBar;
    this.obstacleGraphics.fillStyle(0xcc0000, 0.9);
    this.obstacleGraphics.fillRect(mb.x, mb.y, mb.width, mb.height);
    this.obstacleGraphics.lineStyle(1, 0xff4444, 0.8);
    this.obstacleGraphics.strokeRect(mb.x, mb.y, mb.width, mb.height);
    const stripes = 3;
    for (let i = 0; i < stripes; i++) {
      const sy = mb.y + ((i + 0.5) / stripes) * mb.height;
      this.obstacleGraphics.lineStyle(2, 0xffcc00, 0.6);
      this.obstacleGraphics.lineBetween(mb.x + 1, sy, mb.x + mb.width - 1, sy);
    }
  }

  private updateObstacles(delta: number): void {
    this.spinner.angle += this.spinner.speed * (delta / 1000);

    if (this.movingBar.vertical) {
      this.movingBar.y += this.movingBar.speed * this.movingBar.dir * (delta / 1000);
      if (this.movingBar.y <= this.movingBar.minPos) {
        this.movingBar.y = this.movingBar.minPos;
        this.movingBar.dir = 1;
      } else if (this.movingBar.y + this.movingBar.height >= this.movingBar.maxPos) {
        this.movingBar.y = this.movingBar.maxPos - this.movingBar.height;
        this.movingBar.dir = -1;
      }
    }
  }

  private checkWallCollisions(ball: Phaser.Physics.Arcade.Image): void {
    if (ball.body === null) {
      return;
    }

    const bx = ball.x;
    const by = ball.y;
    const br = 10;

    for (const wall of this.walls) {
      const closestX = Phaser.Math.Clamp(bx, wall.x, wall.x + wall.w);
      const closestY = Phaser.Math.Clamp(by, wall.y, wall.y + wall.h);
      const dx = bx - closestX;
      const dy = by - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < br) {
        if (wall.w > wall.h) {
          ball.body.velocity.y *= -0.7;
          ball.y = by < wall.y ? wall.y - br : wall.y + wall.h + br;
        } else {
          ball.body.velocity.x *= -0.7;
          ball.x = bx < wall.x ? wall.x - br : wall.x + wall.w + br;
        }
      }
    }
  }

  private checkSpinnerCollision(ball: Phaser.Physics.Arcade.Image): void {
    if (ball.body === null) {
      return;
    }

    const s = this.spinner;
    const br = 10;
    const ex1 = s.cx + Math.cos(s.angle) * s.length;
    const ey1 = s.cy + Math.sin(s.angle) * s.length;
    const ex2 = s.cx - Math.cos(s.angle) * s.length;
    const ey2 = s.cy - Math.sin(s.angle) * s.length;

    const dist = this.pointToSegmentDist(ball.x, ball.y, ex1, ey1, ex2, ey2);

    if (dist < br + s.thickness / 2) {
      const perpAngle = s.angle + Math.PI / 2;
      const pushForce = 350;
      const side =
        (ball.x - s.cx) * Math.sin(s.angle) - (ball.y - s.cy) * Math.cos(s.angle) > 0 ? 1 : -1;
      ball.body.velocity.x += Math.cos(perpAngle) * pushForce * side * 0.016;
      ball.body.velocity.y += Math.sin(perpAngle) * pushForce * side * 0.016;
    }
  }

  private checkGapWallCollision(ball: Phaser.Physics.Arcade.Image): void {
    if (ball.body === null) {
      return;
    }

    const gw = this.gapWall;
    const br = 10;

    if (gw.vertical) {
      const inGap = ball.y >= gw.y + gw.gapOffset && ball.y <= gw.y + gw.gapOffset + gw.gapSize;
      if (!inGap) {
        const closestX = Phaser.Math.Clamp(ball.x, gw.x, gw.x + gw.totalWidth);
        const closestY = Phaser.Math.Clamp(ball.y, gw.y, gw.y + gw.height);
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < br) {
          ball.body.velocity.x *= -0.7;
          ball.x = ball.x < gw.x ? gw.x - br : gw.x + gw.totalWidth + br;
        }
      }
    }
  }

  private checkMovingBarCollision(ball: Phaser.Physics.Arcade.Image): void {
    if (ball.body === null) {
      return;
    }

    const mb = this.movingBar;
    const br = 10;
    const closestX = Phaser.Math.Clamp(ball.x, mb.x, mb.x + mb.width);
    const closestY = Phaser.Math.Clamp(ball.y, mb.y, mb.y + mb.height);
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < br) {
      if (mb.vertical) {
        ball.body.velocity.y *= -0.7;
        ball.body.velocity.y += mb.speed * mb.dir * 0.5;
        ball.y = ball.y < mb.y ? mb.y - br : mb.y + mb.height + br;
      } else {
        ball.body.velocity.x *= -0.7;
        ball.body.velocity.x += mb.speed * mb.dir * 0.5;
        ball.x = ball.x < mb.x ? mb.x - br : mb.x + mb.width + br;
      }
    }
  }

  private pointToSegmentDist(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): number {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 < 0.0001) {
      return Math.sqrt(apx * apx + apy * apy);
    }
    const t = Phaser.Math.Clamp((apx * abx + apy * aby) / ab2, 0, 1);
    const closestX = ax + t * abx;
    const closestY = ay + t * aby;
    const dx = px - closestX;
    const dy = py - closestY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public update(_time: number, delta: number): void {
    if (this.p1Ball === null || this.p2Ball === null || this.strokeText === null) {
      return;
    }

    if (!this.p1Finished) {
      this.handleGolfInput(1, this.p1Ball, delta);
    }

    if (!this.p2Finished) {
      this.handleGolfInput(2, this.p2Ball, delta);
    }

    this.updateObstacles(delta);

    if (!this.p1Finished) {
      this.checkWallCollisions(this.p1Ball);
      this.checkSpinnerCollision(this.p1Ball);
      this.checkGapWallCollision(this.p1Ball);
      this.checkMovingBarCollision(this.p1Ball);
    }
    if (!this.p2Finished) {
      this.checkWallCollisions(this.p2Ball);
      this.checkSpinnerCollision(this.p2Ball);
      this.checkGapWallCollision(this.p2Ball);
      this.checkMovingBarCollision(this.p2Ball);
    }

    this.checkHole();
    this.drawUI();
    this.drawObstacles();
    this.checkWater();
    this.checkSand();
    this.updateBallTrails();

    this.strokeText.setText(`P1: ${this.p1Strokes} golpes | P2: ${this.p2Strokes} golpes`);

    if (!this.p1Finished) {
      this.p1Score = Math.floor(
        1000 - Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y)
      );
    }
    if (!this.p2Finished) {
      this.p2Score = Math.floor(
        1000 - Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y)
      );
    }

    const p1Speed = Math.sqrt(
      (this.p1Ball.body?.velocity.x ?? 0) ** 2 + (this.p1Ball.body?.velocity.y ?? 0) ** 2
    );
    const p2Speed = Math.sqrt(
      (this.p2Ball.body?.velocity.x ?? 0) ** 2 + (this.p2Ball.body?.velocity.y ?? 0) ** 2
    );
    this.p1Ball.rotation += (p1Speed / 500) * (delta / 16);
    this.p2Ball.rotation += (p2Speed / 500) * (delta / 16);
  }

  private updateBallTrails(): void {
    if (this.p1Ball === null || this.p2Ball === null || this.ballTrailGraphics === null) {
      return;
    }

    const p1Speed = Math.sqrt(
      (this.p1Ball.body?.velocity.x ?? 0) ** 2 + (this.p1Ball.body?.velocity.y ?? 0) ** 2
    );
    const p2Speed = Math.sqrt(
      (this.p2Ball.body?.velocity.x ?? 0) ** 2 + (this.p2Ball.body?.velocity.y ?? 0) ** 2
    );

    if (p1Speed > 50 && !this.p1Finished) {
      this.p1Trail.push({ x: this.p1Ball.x, y: this.p1Ball.y });
      if (this.p1Trail.length > 10) {
        this.p1Trail.shift();
      }
    } else {
      this.p1Trail = [];
    }

    if (p2Speed > 50 && !this.p2Finished) {
      this.p2Trail.push({ x: this.p2Ball.x, y: this.p2Ball.y });
      if (this.p2Trail.length > 10) {
        this.p2Trail.shift();
      }
    } else {
      this.p2Trail = [];
    }

    this.ballTrailGraphics.clear();
    for (let i = 0; i < this.p1Trail.length; i++) {
      const point = this.p1Trail[i];
      if (point !== undefined) {
        const alpha = (i / this.p1Trail.length) * 0.4;
        this.ballTrailGraphics.fillStyle(0x00e5ff, alpha);
        this.ballTrailGraphics.fillCircle(point.x, point.y, 4);
      }
    }
    for (let i = 0; i < this.p2Trail.length; i++) {
      const point = this.p2Trail[i];
      if (point !== undefined) {
        const alpha = (i / this.p2Trail.length) * 0.4;
        this.ballTrailGraphics.fillStyle(0xff3d71, alpha);
        this.ballTrailGraphics.fillCircle(point.x, point.y, 4);
      }
    }
  }

  private checkSand(): void {
    if (this.p1Ball === null || this.p2Ball === null) {
      return;
    }

    const d1 = Phaser.Math.Distance.Between(
      this.p1Ball.x,
      this.p1Ball.y,
      this.sandTrap.x,
      this.sandTrap.y
    );
    const d2 = Phaser.Math.Distance.Between(
      this.p2Ball.x,
      this.p2Ball.y,
      this.sandTrap.x,
      this.sandTrap.y
    );

    if (d1 < this.sandTrap.radius && !this.p1Finished && this.p1Ball.body !== null) {
      this.p1Ball.body.velocity.x *= 0.95;
      this.p1Ball.body.velocity.y *= 0.95;
    }
    if (d2 < this.sandTrap.radius && !this.p2Finished && this.p2Ball.body !== null) {
      this.p2Ball.body.velocity.x *= 0.95;
      this.p2Ball.body.velocity.y *= 0.95;
    }
  }

  private handleGolfInput(player: 1 | 2, ball: Phaser.Physics.Arcade.Image, delta: number): void {
    const isP1 = player === 1;
    const chargeKey = isP1 ? this.scene.keys.f : this.scene.keys.shift;

    const rotSpeed = 2.8 * (delta / 1000);
    if (isP1) {
      if (this.scene.keys.a.isDown) {
        this.p1Angle -= rotSpeed;
      }
      if (this.scene.keys.d.isDown) {
        this.p1Angle += rotSpeed;
      }
      if (this.scene.keys.w.isDown) {
        this.p1Angle -= rotSpeed * 0.4;
      }
      if (this.scene.keys.s.isDown) {
        this.p1Angle += rotSpeed * 0.4;
      }
    } else {
      if (this.scene.cursors.left.isDown) {
        this.p2Angle -= rotSpeed;
      }
      if (this.scene.cursors.right.isDown) {
        this.p2Angle += rotSpeed;
      }
      if (this.scene.cursors.up.isDown) {
        this.p2Angle -= rotSpeed * 0.4;
      }
      if (this.scene.cursors.down.isDown) {
        this.p2Angle += rotSpeed * 0.4;
      }
    }

    const ballVelX = ball.body?.velocity.x ?? 0;
    const ballVelY = ball.body?.velocity.y ?? 0;
    const isMoving = Math.abs(ballVelX) > 12 || Math.abs(ballVelY) > 12;

    if (!isMoving) {
      if (chargeKey.isDown) {
        const currentPower = isP1 ? this.p1Power : this.p2Power;
        const chargeSpeed = 1.5 + (currentPower / 100) * 0.5;
        if (isP1) {
          this.p1Power = Math.min(100, this.p1Power + chargeSpeed);
          this.p1Charging = true;
        } else {
          this.p2Power = Math.min(100, this.p2Power + chargeSpeed);
          this.p2Charging = true;
        }
        ball.setScale(1 + ((isP1 ? this.p1Power : this.p2Power) / 100) * 0.15);
      } else if (isP1 ? this.p1Charging : this.p2Charging) {
        const power = isP1 ? this.p1Power : this.p2Power;
        const angle = isP1 ? this.p1Angle : this.p2Angle;
        const powerCurve = Math.pow(power / 100, 0.9);
        const force = powerCurve * 750;
        if (isArcadeBody(ball.body)) {
          ball.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
        }

        if (isP1) {
          this.p1Strokes++;
          this.p1Power = 0;
          this.p1Charging = false;
        } else {
          this.p2Strokes++;
          this.p2Power = 0;
          this.p2Charging = false;
        }
        ball.setScale(1);

        this.scene.cameras.main.shake(60 + force / 15, 0.003 + force / 100000);

        for (let i = 0; i < 5; i++) {
          const particle = this.scene.add.circle(ball.x, ball.y, 3, 0x2d5a2d, 0.8);
          const particleAngle = angle + Math.PI + (Phaser.Math.Between(-30, 30) * Math.PI) / 180;
          this.scene.tweens.add({
            targets: particle,
            x: ball.x + Math.cos(particleAngle) * 25,
            y: ball.y + Math.sin(particleAngle) * 25,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              particle.destroy();
            },
          });
        }
      }
    }
  }

  private drawUI(): void {
    if (
      this.powerBarGraphics === null ||
      this.arrowGraphics === null ||
      this.p1Ball === null ||
      this.p2Ball === null
    ) {
      return;
    }

    this.powerBarGraphics.clear();
    this.arrowGraphics.clear();

    if (!this.p1Finished) {
      const p1VelX = this.p1Ball.body?.velocity.x ?? 0;
      const p1VelY = this.p1Ball.body?.velocity.y ?? 0;
      const isMoving1 = Math.abs(p1VelX) > 12 || Math.abs(p1VelY) > 12;
      if (!isMoving1) {
        this.drawPowerBar(this.p1Ball.x, this.p1Ball.y, this.p1Power, 0x00e5ff);
        this.drawDirectionArrow(this.p1Ball.x, this.p1Ball.y, this.p1Angle, 0x00e5ff, this.p1Power);
      }
    }

    if (!this.p2Finished) {
      const p2VelX = this.p2Ball.body?.velocity.x ?? 0;
      const p2VelY = this.p2Ball.body?.velocity.y ?? 0;
      const isMoving2 = Math.abs(p2VelX) > 12 || Math.abs(p2VelY) > 12;
      if (!isMoving2) {
        this.drawPowerBar(this.p2Ball.x, this.p2Ball.y, this.p2Power, 0xff3d71);
        this.drawDirectionArrow(this.p2Ball.x, this.p2Ball.y, this.p2Angle, 0xff3d71, this.p2Power);
      }
    }
  }

  private drawPowerBar(x: number, y: number, power: number, color: number): void {
    if (this.powerBarGraphics === null) {
      return;
    }

    const barW = 50;
    const barH = 8;
    this.powerBarGraphics.fillStyle(0x222222, 0.8);
    this.powerBarGraphics.fillRect(x - barW / 2 - 2, y - 42, barW + 4, barH + 4);
    this.powerBarGraphics.fillStyle(0x333333);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW, barH);
    const fillColor = power > 80 ? 0xff4444 : power > 50 ? 0xffaa00 : color;
    this.powerBarGraphics.fillStyle(fillColor);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW * (power / 100), barH);
    this.powerBarGraphics.lineStyle(1, 0xffffff, 0.8);
    this.powerBarGraphics.strokeRect(x - barW / 2, y - 40, barW, barH);
  }

  private drawDirectionArrow(
    x: number,
    y: number,
    angle: number,
    color: number,
    power: number
  ): void {
    if (this.arrowGraphics === null) {
      return;
    }

    const baseLen = 35;
    const len = baseLen + (power / 100) * 25;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;

    this.arrowGraphics.lineStyle(5, color, 0.3);
    this.arrowGraphics.lineBetween(x, y, ex, ey);
    this.arrowGraphics.lineStyle(3, color, 0.9);
    this.arrowGraphics.lineBetween(x, y, ex, ey);

    const headLen = 12;
    const a1 = angle + 2.6;
    const a2 = angle - 2.6;
    this.arrowGraphics.lineStyle(3, color, 0.9);
    this.arrowGraphics.lineBetween(
      ex,
      ey,
      ex + Math.cos(a1) * headLen,
      ey + Math.sin(a1) * headLen
    );
    this.arrowGraphics.lineBetween(
      ex,
      ey,
      ex + Math.cos(a2) * headLen,
      ey + Math.sin(a2) * headLen
    );
  }

  private checkHole(): void {
    if (this.p1Ball === null || this.p2Ball === null) {
      return;
    }

    const d1 = Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y);
    const d2 = Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y);

    if (d1 < 40 && d1 > this.hole.r && !this.p1Finished) {
      const pullForce = 80 * (1 - d1 / 40);
      const angle = Phaser.Math.Angle.Between(
        this.p1Ball.x,
        this.p1Ball.y,
        this.hole.x,
        this.hole.y
      );
      if (this.p1Ball.body !== null) {
        this.p1Ball.body.velocity.x += Math.cos(angle) * pullForce * 0.016;
        this.p1Ball.body.velocity.y += Math.sin(angle) * pullForce * 0.016;
      }
    }
    if (d2 < 40 && d2 > this.hole.r && !this.p2Finished) {
      const pullForce = 80 * (1 - d2 / 40);
      const angle = Phaser.Math.Angle.Between(
        this.p2Ball.x,
        this.p2Ball.y,
        this.hole.x,
        this.hole.y
      );
      if (this.p2Ball.body !== null) {
        this.p2Ball.body.velocity.x += Math.cos(angle) * pullForce * 0.016;
        this.p2Ball.body.velocity.y += Math.sin(angle) * pullForce * 0.016;
      }
    }

    if (d1 < this.hole.r && !this.p1Finished) {
      this.p1Finished = true;
      this.p1Score = 1000 + (100 - this.p1Strokes * 10);
      this.p1Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y - 20, '¡HOYO P1!', '#00e5ff');
      this.scene.cameras.main.shake(150, 0.01);
      this.createHoleInEffect(0x00e5ff);
    }

    if (d2 < this.hole.r && !this.p2Finished) {
      this.p2Finished = true;
      this.p2Score = 1000 + (100 - this.p2Strokes * 10);
      this.p2Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y - 20, '¡HOYO P2!', '#ff3d71');
      this.scene.cameras.main.shake(150, 0.01);
      this.createHoleInEffect(0xff3d71);
    }
  }

  private createHoleInEffect(color: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.circle(this.hole.x, this.hole.y, 6, color, 1);
      this.scene.tweens.add({
        targets: particle,
        x: this.hole.x + Math.cos(angle) * 60,
        y: this.hole.y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private checkWater(): void {
    if (this.p1Ball === null || this.p2Ball === null) {
      return;
    }

    const d1 = Phaser.Math.Distance.Between(
      this.p1Ball.x,
      this.p1Ball.y,
      this.waterHazard.x,
      this.waterHazard.y
    );
    const d2 = Phaser.Math.Distance.Between(
      this.p2Ball.x,
      this.p2Ball.y,
      this.waterHazard.x,
      this.waterHazard.y
    );

    if (d1 < this.waterHazard.radius && !this.p1Finished) {
      this.p1Ball.setPosition(80, 490);
      if (isArcadeBody(this.p1Ball.body)) {
        this.p1Ball.body.setVelocity(0, 0);
      }
      this.p1Strokes += 2;
      this.scene.showFloatingText(
        this.waterHazard.x,
        this.waterHazard.y,
        '+2 PENALIDAD',
        '#ff2222'
      );
      this.scene.cameras.main.shake(100, 0.008);
      this.createSplashEffect(this.waterHazard.x, this.waterHazard.y);
    }

    if (d2 < this.waterHazard.radius && !this.p2Finished) {
      this.p2Ball.setPosition(120, 490);
      if (isArcadeBody(this.p2Ball.body)) {
        this.p2Ball.body.setVelocity(0, 0);
      }
      this.p2Strokes += 2;
      this.scene.showFloatingText(
        this.waterHazard.x,
        this.waterHazard.y,
        '+2 PENALIDAD',
        '#ff2222'
      );
      this.scene.cameras.main.shake(100, 0.008);
      this.createSplashEffect(this.waterHazard.x, this.waterHazard.y);
    }
  }

  private createSplashEffect(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 5, 0x66aaff, 0.9);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30 - 20,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  public cleanup(): void {
    this.powerBarGraphics?.destroy();
    this.arrowGraphics?.destroy();
    this.courseGraphics?.destroy();
    this.holeGraphics?.destroy();
    this.strokeText?.destroy();
    this.ballTrailGraphics?.destroy();
    this.obstacleGraphics?.destroy();
    this.bg?.destroy();
    this.p1Ball?.destroy();
    this.p2Ball?.destroy();
  }

  public get modeName(): 'golf' {
    return 'golf';
  }
}
