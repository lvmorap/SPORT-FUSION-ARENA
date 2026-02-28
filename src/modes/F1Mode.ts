import Phaser from 'phaser';
import { GameMode } from './GameMode';
import type { GameScene, Checkpoint, TrackPoint, TrailPoint, CarCustomData } from '../types';
import { isPointInPolygon, isArcadeBody } from '../utils/helpers';

interface F1Car extends Phaser.Physics.Arcade.Image {
  customData: CarCustomData;
}

export class F1Mode extends GameMode {
  private bg: Phaser.GameObjects.Image | null = null;
  private trackGraphics: Phaser.GameObjects.Graphics | null = null;
  private trailGraphics: Phaser.GameObjects.Graphics | null = null;
  private lapText: Phaser.GameObjects.Text | null = null;
  private speedText: Phaser.GameObjects.Text | null = null;

  private trackPoints: TrackPoint[] = [
    { x: 100, y: 120 },
    { x: 400, y: 55 },
    { x: 700, y: 120 },
    { x: 760, y: 230 },
    { x: 640, y: 300 },
    { x: 740, y: 390 },
    { x: 700, y: 520 },
    { x: 400, y: 560 },
    { x: 100, y: 520 },
    { x: 50, y: 370 },
    { x: 100, y: 230 },
  ];

  private checkpoints: Checkpoint[] = [
    { x: 400, y: 70, r: 75, id: 'top' },
    { x: 750, y: 300, r: 75, id: 'right' },
    { x: 400, y: 555, r: 75, id: 'bottom' },
    { x: 60, y: 370, r: 75, id: 'left' },
  ];

  private p1Car: F1Car | null = null;
  private p2Car: F1Car | null = null;
  private p1Trail: TrailPoint[] = [];
  private p2Trail: TrailPoint[] = [];

  private p1Checkpoints = new Set<string>();
  private p2Checkpoints = new Set<string>();
  private p1Laps = 0;
  private p2Laps = 0;
  private p1BestLap = Infinity;
  private p2BestLap = Infinity;
  private p1LapStartTime = 0;
  private p2LapStartTime = 0;

  private p1OffTrack = false;
  private p2OffTrack = false;
  private p1PenaltyTimer = 0;
  private p2PenaltyTimer = 0;

  private p1Boost = 0;
  private p2Boost = 0;
  private p1BoostActive = false;
  private p2BoostActive = false;

  public constructor(scene: GameScene) {
    super(scene);
  }

  public setup(): void {
    this.bg = this.scene.add
      .image(400, 300, 'bg_f1')
      .setDisplaySize(800, 600)
      .setAlpha(0.3)
      .setDepth(-10);

    this.trackGraphics = this.scene.add.graphics();
    this.drawTrack();

    this.trailGraphics = this.scene.add.graphics();

    const p1CarBase = this.scene.physics.add.image(130, 140, 'p1_f1');
    p1CarBase.setMaxVelocity(500, 500);
    this.p1Car = p1CarBase as F1Car;
    this.p1Car.customData = { speed: 0, angle: 0, driftAngle: 0 };

    const p2CarBase = this.scene.physics.add.image(130, 180, 'p2_f1');
    p2CarBase.setMaxVelocity(500, 500);
    this.p2Car = p2CarBase as F1Car;
    this.p2Car.customData = { speed: 0, angle: 0, driftAngle: 0 };

    this.lapText = this.scene.add
      .text(400, 560, 'P1: 0 vueltas | P2: 0 vueltas', {
        fontSize: '16px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.speedText = this.scene.add
      .text(400, 580, '', {
        fontSize: '12px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#888888',
      })
      .setOrigin(0.5);
  }

  private drawTrack(): void {
    if (this.trackGraphics === null) {
      return;
    }

    this.trackGraphics.lineStyle(85, 0x333333, 1);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(100, 120);
    this.trackGraphics.lineTo(400, 55);
    this.trackGraphics.lineTo(700, 120);
    this.trackGraphics.lineTo(760, 230);
    this.trackGraphics.lineTo(640, 300);
    this.trackGraphics.lineTo(740, 390);
    this.trackGraphics.lineTo(700, 520);
    this.trackGraphics.lineTo(400, 560);
    this.trackGraphics.lineTo(100, 520);
    this.trackGraphics.lineTo(50, 370);
    this.trackGraphics.lineTo(100, 230);
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();

    this.trackGraphics.lineStyle(4, 0xff0000, 0.6);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(100, 120);
    this.trackGraphics.lineTo(400, 55);
    this.trackGraphics.lineTo(700, 120);
    this.trackGraphics.strokePath();

    this.trackGraphics.lineStyle(2, 0xffffff, 0.4);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(100, 120);
    this.trackGraphics.lineTo(400, 55);
    this.trackGraphics.lineTo(700, 120);
    this.trackGraphics.lineTo(760, 230);
    this.trackGraphics.lineTo(640, 300);
    this.trackGraphics.lineTo(740, 390);
    this.trackGraphics.lineTo(700, 520);
    this.trackGraphics.lineTo(400, 560);
    this.trackGraphics.lineTo(100, 520);
    this.trackGraphics.lineTo(50, 370);
    this.trackGraphics.lineTo(100, 230);
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();

    this.trackGraphics.lineStyle(8, 0xffffff, 1);
    this.trackGraphics.lineBetween(100, 105, 100, 205);
    this.trackGraphics.lineStyle(4, 0x000000, 1);
    this.trackGraphics.lineBetween(100, 115, 100, 125);
    this.trackGraphics.lineBetween(100, 135, 100, 145);
    this.trackGraphics.lineBetween(100, 155, 100, 165);
    this.trackGraphics.lineBetween(100, 175, 100, 185);
  }

  public update(time: number, delta: number): void {
    if (
      this.p1Car === null ||
      this.p2Car === null ||
      this.lapText === null ||
      this.speedText === null
    ) {
      return;
    }

    this.updateCarPhysics(
      this.p1Car,
      this.scene.keys.a,
      this.scene.keys.d,
      this.scene.keys.w,
      delta,
      'p1'
    );
    this.updateCarPhysics(
      this.p2Car,
      this.scene.cursors.left,
      this.scene.cursors.right,
      this.scene.cursors.up,
      delta,
      'p2'
    );

    this.updateTrails();

    this.checkLaps(this.p1Car, 'p1', time);
    this.checkLaps(this.p2Car, 'p2', time);

    this.lapText.setText(`P1: ${this.p1Laps} vueltas | P2: ${this.p2Laps} vueltas`);

    const p1Speed = Math.round(this.p1Car.customData.speed);
    const p2Speed = Math.round(this.p2Car.customData.speed);
    this.speedText.setText(`P1: ${p1Speed} km/h | P2: ${p2Speed} km/h`);

    this.p1Score = this.p1Laps * 100;
    this.p2Score = this.p2Laps * 100;
  }

  private updateTrails(): void {
    if (this.p1Car === null || this.p2Car === null || this.trailGraphics === null) {
      return;
    }

    if (this.p1Car.customData.speed > 200) {
      this.p1Trail.push({ x: this.p1Car.x, y: this.p1Car.y });
      if (this.p1Trail.length > 15) {
        this.p1Trail.shift();
      }
    }
    if (this.p2Car.customData.speed > 200) {
      this.p2Trail.push({ x: this.p2Car.x, y: this.p2Car.y });
      if (this.p2Trail.length > 15) {
        this.p2Trail.shift();
      }
    }

    this.trailGraphics.clear();

    for (let i = 0; i < this.p1Trail.length; i++) {
      const point = this.p1Trail[i];
      if (point !== undefined) {
        const alpha = (i / this.p1Trail.length) * 0.5;
        const size = 2 + (i / this.p1Trail.length) * 3;
        this.trailGraphics.fillStyle(0x00e5ff, alpha);
        this.trailGraphics.fillCircle(point.x, point.y, size);
      }
    }

    for (let i = 0; i < this.p2Trail.length; i++) {
      const point = this.p2Trail[i];
      if (point !== undefined) {
        const alpha = (i / this.p2Trail.length) * 0.5;
        const size = 2 + (i / this.p2Trail.length) * 3;
        this.trailGraphics.fillStyle(0xff3d71, alpha);
        this.trailGraphics.fillCircle(point.x, point.y, size);
      }
    }
  }

  private updateCarPhysics(
    car: F1Car,
    leftKey: Phaser.Input.Keyboard.Key,
    rightKey: Phaser.Input.Keyboard.Key,
    boostKey: Phaser.Input.Keyboard.Key,
    delta: number,
    player: 'p1' | 'p2'
  ): void {
    const cd = car.customData;
    const isOffTrack = player === 'p1' ? this.p1OffTrack : this.p2OffTrack;
    const isBoostActive = player === 'p1' ? this.p1BoostActive : this.p2BoostActive;

    const baseMaxSpeed = isOffTrack ? 100 : 380;
    const boostMaxSpeed = 480;
    const maxSpeed = isBoostActive ? boostMaxSpeed : baseMaxSpeed;
    const acceleration = isOffTrack ? 100 : 220;
    const deceleration = isOffTrack ? 50 : 30;

    if (cd.speed < maxSpeed) {
      cd.speed += acceleration * (delta / 1000);
    } else {
      cd.speed -= deceleration * (delta / 1000);
    }
    cd.speed = Math.max(0, cd.speed);

    if (!isOffTrack) {
      if (player === 'p1') {
        this.p1Boost = Math.min(100, this.p1Boost + delta * 0.02);
      } else {
        this.p2Boost = Math.min(100, this.p2Boost + delta * 0.02);
      }
    }

    const currentBoost = player === 'p1' ? this.p1Boost : this.p2Boost;
    if (boostKey.isDown && currentBoost > 20 && !isOffTrack) {
      if (player === 'p1') {
        this.p1BoostActive = true;
        this.p1Boost -= delta * 0.05;
      } else {
        this.p2BoostActive = true;
        this.p2Boost -= delta * 0.05;
      }
      car.setTint(player === 'p1' ? 0x00ffff : 0xff6688);
    } else {
      if (player === 'p1') {
        this.p1BoostActive = false;
      } else {
        this.p2BoostActive = false;
      }
      if (!isOffTrack) {
        car.clearTint();
      }
    }

    const speedFactor = 1 - (cd.speed / 500) * 0.3;
    const turnRate = 2.8 * speedFactor;

    if (leftKey.isDown) {
      cd.angle -= turnRate * (delta / 1000);
      cd.driftAngle = Math.min(0.1, cd.driftAngle + 0.01);
    } else if (rightKey.isDown) {
      cd.angle += turnRate * (delta / 1000);
      cd.driftAngle = Math.min(0.1, cd.driftAngle + 0.01);
    } else {
      cd.driftAngle *= 0.9;
    }

    const effectiveAngle = cd.angle + cd.driftAngle * (leftKey.isDown ? 1 : -1);
    if (isArcadeBody(car.body)) {
      car.body.setVelocity(
        Math.cos(effectiveAngle) * cd.speed,
        Math.sin(effectiveAngle) * cd.speed
      );
    }

    car.setRotation(cd.angle + Math.PI / 2);

    if (!isPointInPolygon(car.x, car.y, this.trackPoints)) {
      const wasOffTrack = player === 'p1' ? this.p1OffTrack : this.p2OffTrack;
      if (!wasOffTrack) {
        if (player === 'p1') {
          this.p1OffTrack = true;
          this.p1PenaltyTimer = 2500;
        } else {
          this.p2OffTrack = true;
          this.p2PenaltyTimer = 2500;
        }
        this.scene.cameras.main.shake(120, 0.008);
        car.setTint(0xff0000);
        this.scene.showFloatingText(car.x, car.y - 30, '¡FUERA!', '#ff0000');

        for (let i = 0; i < 5; i++) {
          const particle = this.scene.add.circle(
            car.x + Phaser.Math.Between(-15, 15),
            car.y + Phaser.Math.Between(-15, 15),
            4,
            0x8b4513,
            0.8
          );
          this.scene.tweens.add({
            targets: particle,
            y: particle.y + 20,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              particle.destroy();
            },
          });
        }
      }
    }

    const penaltyTimer = player === 'p1' ? this.p1PenaltyTimer : this.p2PenaltyTimer;
    if (penaltyTimer > 0) {
      if (player === 'p1') {
        this.p1PenaltyTimer -= delta;
        if (this.p1PenaltyTimer <= 0) {
          this.p1OffTrack = false;
          car.clearTint();
        }
      } else {
        this.p2PenaltyTimer -= delta;
        if (this.p2PenaltyTimer <= 0) {
          this.p2OffTrack = false;
          car.clearTint();
        }
      }
    }

    car.x = Phaser.Math.Clamp(car.x, 15, 785);
    car.y = Phaser.Math.Clamp(car.y, 15, 585);
  }

  private checkLaps(car: F1Car, player: 'p1' | 'p2', time: number): void {
    const checkpointsSet = player === 'p1' ? this.p1Checkpoints : this.p2Checkpoints;

    for (const cp of this.checkpoints) {
      const d = Phaser.Math.Distance.Between(car.x, car.y, cp.x, cp.y);
      if (d < cp.r && !checkpointsSet.has(cp.id)) {
        checkpointsSet.add(cp.id);

        const checkpointNum = checkpointsSet.size;
        if (checkpointNum < this.checkpoints.length) {
          const isOffTrack = player === 'p1' ? this.p1OffTrack : this.p2OffTrack;
          const isBoostActive = player === 'p1' ? this.p1BoostActive : this.p2BoostActive;
          car.setTint(player === 'p1' ? 0x00ff88 : 0xff88aa);
          this.scene.time.delayedCall(150, () => {
            if (!isOffTrack && !isBoostActive) {
              car.clearTint();
            }
          });
        }

        if (checkpointsSet.size === this.checkpoints.length) {
          let isBestLap = false;
          if (player === 'p1') {
            this.p1Laps++;
            this.p1Checkpoints.clear();
            const lapTime = time - this.p1LapStartTime;
            isBestLap = lapTime < this.p1BestLap;
            if (isBestLap) {
              this.p1BestLap = lapTime;
            }
            this.p1LapStartTime = time;
          } else {
            this.p2Laps++;
            this.p2Checkpoints.clear();
            const lapTime = time - this.p2LapStartTime;
            isBestLap = lapTime < this.p2BestLap;
            if (isBestLap) {
              this.p2BestLap = lapTime;
            }
            this.p2LapStartTime = time;
          }

          const lapText = isBestLap ? '¡MEJOR VUELTA!' : '¡VUELTA!';
          this.scene.showFloatingText(
            car.x,
            car.y - 20,
            lapText,
            player === 'p1' ? '#00e5ff' : '#ff3d71'
          );
          this.scene.cameras.main.shake(150, 0.01);
          this.scene.cameras.main.flash(
            100,
            player === 'p1' ? 0 : 255,
            player === 'p1' ? 229 : 61,
            player === 'p1' ? 255 : 113,
            true
          );

          for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const particle = this.scene.add.circle(
              car.x,
              car.y,
              5,
              player === 'p1' ? 0x00e5ff : 0xff3d71,
              1
            );
            this.scene.tweens.add({
              targets: particle,
              x: car.x + Math.cos(angle) * 50,
              y: car.y + Math.sin(angle) * 50,
              alpha: 0,
              scale: 0.2,
              duration: 500,
              onComplete: () => {
                particle.destroy();
              },
            });
          }
        }
      }
    }
  }

  public cleanup(): void {
    this.trackGraphics?.destroy();
    this.trackGraphics = null;
    this.lapText?.destroy();
    this.lapText = null;
    this.speedText?.destroy();
    this.speedText = null;
    this.trailGraphics?.destroy();
    this.trailGraphics = null;
    this.bg?.destroy();
    this.bg = null;
    this.p1Car?.destroy();
    this.p1Car = null;
    this.p2Car?.destroy();
    this.p2Car = null;
  }

  public get modeName(): 'f1' {
    return 'f1';
  }
}
