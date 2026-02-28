import Phaser from 'phaser';
import type { ModeName } from '../types';

export function isArcadeBody(
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null
): body is Phaser.Physics.Arcade.Body {
  return body !== null && body instanceof Phaser.Physics.Arcade.Body;
}

export function createPlayerSkin(
  graphics: Phaser.GameObjects.Graphics,
  mode: ModeName,
  playerNum: 1 | 2
): void {
  const color = playerNum === 1 ? 0x00e5ff : 0xff3d71;
  const darkColor = playerNum === 1 ? 0x0099aa : 0xaa1144;

  const cx = 24;
  const cy = 28;

  switch (mode) {
    case 'football':
      graphics.fillStyle(color);
      graphics.fillEllipse(cx, cy, 32, 38);
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(cx, cy - 8, 8);
      break;

    case 'sumo':
      graphics.fillStyle(color, 0.9);
      graphics.fillCircle(cx, cy, 22);
      graphics.fillStyle(darkColor);
      graphics.fillCircle(cx, cy - 14, 10);
      graphics.lineStyle(4, 0xffcc00);
      graphics.strokeRect(cx - 14, cy - 4, 28, 10);
      break;

    case 'pingpong':
      graphics.fillStyle(color);
      graphics.fillRect(cx - 6, cy - 20, 12, 24);
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(cx, cy - 24, 7);
      graphics.fillStyle(darkColor);
      graphics.fillEllipse(cx + 14, cy - 10, 16, 20);
      graphics.lineStyle(3, 0x888888);
      graphics.lineBetween(cx + 6, cy - 4, cx + 14, cy - 10);
      break;

    case 'golf':
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(cx, cy, 16);
      graphics.fillStyle(0xdddddd);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        graphics.fillCircle(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8, 2.5);
      }
      graphics.lineStyle(3, color);
      graphics.strokeCircle(cx, cy, 16);
      break;

    case 'f1':
      graphics.fillStyle(color);
      graphics.fillRect(cx - 8, cy - 20, 16, 40);
      graphics.fillStyle(darkColor);
      graphics.fillRect(cx - 16, cy - 18, 8, 6);
      graphics.fillRect(cx + 8, cy - 18, 8, 6);
      graphics.fillRect(cx - 14, cy + 14, 6, 8);
      graphics.fillRect(cx + 8, cy + 14, 6, 8);
      graphics.fillStyle(0x222222);
      graphics.fillEllipse(cx - 12, cy - 10, 8, 12);
      graphics.fillEllipse(cx + 12, cy - 10, 8, 12);
      graphics.fillEllipse(cx - 12, cy + 10, 8, 12);
      graphics.fillEllipse(cx + 12, cy + 10, 8, 12);
      graphics.fillStyle(0x111111);
      graphics.fillEllipse(cx, cy - 4, 10, 14);
      break;
  }
}

export function createImpactParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  count = 6
): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const particle = scene.add.circle(x, y, 4, color, 0.8);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * 30,
      y: y + Math.sin(angle) * 30,
      alpha: 0,
      scale: 0.2,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        particle.destroy();
      },
    });
  }
}

export function showFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  const floatText = scene.add
    .text(x, y, text, {
      fontSize: '32px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: floatText,
    y: y - 60,
    alpha: 0,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => {
      floatText.destroy();
    },
  });
}

export function isPointInPolygon(
  x: number,
  y: number,
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]?.x ?? 0;
    const yi = polygon[i]?.y ?? 0;
    const xj = polygon[j]?.x ?? 0;
    const yj = polygon[j]?.y ?? 0;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
