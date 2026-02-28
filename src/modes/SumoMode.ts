import Phaser from 'phaser';
import { GameMode } from './GameMode';
import type { GameScene, Zone } from '../types';
import { isArcadeBody } from '../utils/helpers';

export class SumoMode extends GameMode {
  private bg: Phaser.GameObjects.Image | null = null;
  private zone: Zone = { x: 400, y: 300, radius: 160, targetX: 400, targetY: 300, speed: 70 };
  private zoneGraphics: Phaser.GameObjects.Graphics | null = null;
  private zonePulse = 0;
  private p1: Phaser.Physics.Arcade.Image | null = null;
  private p2: Phaser.Physics.Arcade.Image | null = null;
  private p1OutTimer = 0;
  private p1InTimer = 0;
  private p2OutTimer = 0;
  private p2InTimer = 0;
  private p1PushCooldown = 0;
  private p2PushCooldown = 0;

  public constructor(scene: GameScene) {
    super(scene);
    this.p1Score = 10;
    this.p2Score = 10;
  }

  public setup(): void {
    this.bg = this.scene.add
      .image(400, 300, 'bg_sumo')
      .setDisplaySize(800, 600)
      .setAlpha(0.35)
      .setDepth(-10);

    this.zoneGraphics = this.scene.add.graphics();

    this.p1 = this.scene.physics.add.image(350, 300, 'p1_sumo');
    this.p2 = this.scene.physics.add.image(450, 300, 'p2_sumo');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.6);
    this.p2.setBounce(0.6);
    if (isArcadeBody(this.p1.body)) {
      this.p1.body.setDrag(180);
    }
    if (isArcadeBody(this.p2.body)) {
      this.p2.body.setDrag(180);
    }
    this.p1.setMass(1.5);
    this.p2.setMass(1.5);

    this.scene.physics.add.collider(this.p1, this.p2, () => {
      this.onCollision();
    });
  }

  private onCollision(): void {
    if (this.p1 === null || this.p2 === null) {
      return;
    }

    this.scene.cameras.main.shake(120, 0.008);

    const midX = (this.p1.x + this.p2.x) / 2;
    const midY = (this.p1.y + this.p2.y) / 2;
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(midX, midY, 5, 0xffff00, 0.8);
      const angle = Math.random() * Math.PI * 2;
      this.scene.tweens.add({
        targets: particle,
        x: midX + Math.cos(angle) * 25,
        y: midY + Math.sin(angle) * 25,
        alpha: 0,
        scale: 0.3,
        duration: 200,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  public update(_time: number, delta: number): void {
    if (this.p1 === null || this.p2 === null) {
      return;
    }

    this.p1PushCooldown = Math.max(0, this.p1PushCooldown - delta);
    this.p2PushCooldown = Math.max(0, this.p2PushCooldown - delta);

    const accel = 1100;
    const maxSpeed = 280;
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

      p1Body.velocity.x = Phaser.Math.Clamp(p1Body.velocity.x, -maxSpeed, maxSpeed);
      p1Body.velocity.y = Phaser.Math.Clamp(p1Body.velocity.y, -maxSpeed, maxSpeed);
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

      p2Body.velocity.x = Phaser.Math.Clamp(p2Body.velocity.x, -maxSpeed, maxSpeed);
      p2Body.velocity.y = Phaser.Math.Clamp(p2Body.velocity.y, -maxSpeed, maxSpeed);
    }

    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.f) && this.p1PushCooldown <= 0) {
      this.doPush(this.p1, this.p2, 1);
      this.p1PushCooldown = 500;
    }
    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.shift) && this.p2PushCooldown <= 0) {
      this.doPush(this.p2, this.p1, 2);
      this.p2PushCooldown = 500;
    }

    this.updateZone(delta);
    this.updatePoints(delta);
  }

  private doPush(
    attacker: Phaser.Physics.Arcade.Image,
    defender: Phaser.Physics.Arcade.Image,
    playerNum: 1 | 2
  ): void {
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);
    if (dist < 90) {
      const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
      const force = 600;

      const attackerVelX = attacker.body?.velocity.x ?? 0;
      const attackerVelY = attacker.body?.velocity.y ?? 0;
      const momentumBonus = Math.sqrt(attackerVelX ** 2 + attackerVelY ** 2) * 0.3;
      const totalForce = force + momentumBonus;

      if (isArcadeBody(defender.body)) {
        defender.body.setVelocity(Math.cos(angle) * totalForce, Math.sin(angle) * totalForce);
      }

      if (attacker.body !== null) {
        attacker.body.velocity.x -= Math.cos(angle) * 150;
        attacker.body.velocity.y -= Math.sin(angle) * 150;
      }

      this.scene.cameras.main.shake(150, 0.01);

      attacker.setTint(0xffff00);
      defender.setTint(0xff6600);
      this.scene.time.delayedCall(150, () => {
        attacker.clearTint();
        defender.clearTint();
      });

      const impactX = (attacker.x + defender.x) / 2;
      const impactY = (attacker.y + defender.y) / 2;
      this.scene.showFloatingText(
        impactX,
        impactY - 20,
        '¡PUSH!',
        playerNum === 1 ? '#00e5ff' : '#ff3d71'
      );
    }
  }

  private updateZone(delta: number): void {
    if (this.zoneGraphics === null) {
      return;
    }

    const dx = this.zone.targetX - this.zone.x;
    const dy = this.zone.targetY - this.zone.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      this.zone.targetX = Phaser.Math.Between(180, 620);
      this.zone.targetY = Phaser.Math.Between(150, 450);
    } else {
      this.zone.x += (dx / dist) * this.zone.speed * (delta / 1000);
      this.zone.y += (dy / dist) * this.zone.speed * (delta / 1000);
    }

    this.zonePulse += delta * 0.002;
    this.zone.radius = 160 + Math.sin(this.zonePulse) * 35;

    this.zoneGraphics.clear();

    for (let i = 3; i > 0; i--) {
      const alpha = 0.1 - i * 0.02;
      this.zoneGraphics.lineStyle(3, 0xff6600, alpha);
      this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius + i * 8);
    }

    this.zoneGraphics.lineStyle(4, 0xff6600, 0.9);
    this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius);

    this.zoneGraphics.fillStyle(0xff6600, 0.1);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius);
    this.zoneGraphics.fillStyle(0xff8800, 0.08);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius * 0.7);

    this.zoneGraphics.fillStyle(0xffaa00, 0.3);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, 15);
  }

  private updatePoints(delta: number): void {
    if (this.p1 === null || this.p2 === null) {
      return;
    }

    const p1Dist = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.zone.x, this.zone.y);
    const p2Dist = Phaser.Math.Distance.Between(this.p2.x, this.p2.y, this.zone.x, this.zone.y);

    if (p1Dist > this.zone.radius) {
      this.p1OutTimer += delta;
      this.p1InTimer = 0;
      if (this.p1OutTimer > 1000) {
        this.p1Score = Math.max(0, this.p1Score - 1);
        this.p1OutTimer = 0;
        this.p1.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
          this.p1?.clearTint();
        });
      }
    } else {
      this.p1OutTimer = 0;
      this.p1InTimer += delta;
      if (this.p1InTimer > 2000) {
        this.p1Score++;
        this.p1InTimer = 0;
      }
    }

    if (p2Dist > this.zone.radius) {
      this.p2OutTimer += delta;
      this.p2InTimer = 0;
      if (this.p2OutTimer > 1000) {
        this.p2Score = Math.max(0, this.p2Score - 1);
        this.p2OutTimer = 0;
        this.p2.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
          this.p2?.clearTint();
        });
      }
    } else {
      this.p2OutTimer = 0;
      this.p2InTimer += delta;
      if (this.p2InTimer > 2000) {
        this.p2Score++;
        this.p2InTimer = 0;
      }
    }
  }

  public cleanup(): void {
    this.zoneGraphics?.destroy();
    this.zoneGraphics = null;
    this.bg?.destroy();
    this.bg = null;
    this.p1?.destroy();
    this.p1 = null;
    this.p2?.destroy();
    this.p2 = null;
  }

  public get modeName(): 'sumo' {
    return 'sumo';
  }
}
