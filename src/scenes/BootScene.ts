import Phaser from 'phaser';
import { createPlayerSkin } from '../utils/helpers';
import { BG_COLORS, type ModeName } from '../types';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    this.add.rectangle(400, 300, 610, 24, 0x333333).setOrigin(0.5);
    const prog = this.add.rectangle(100, 300, 0, 20, 0x00ffcc).setOrigin(0, 0.5);
    this.add
      .text(400, 260, 'CARGANDO SPORT FUSION ARENA...', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      prog.width = v * 600;
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key.startsWith('bg_')) {
        const g = this.add.graphics();
        const bgColor = BG_COLORS[file.key] ?? 0x111111;
        g.fillStyle(bgColor);
        g.fillRect(0, 0, 800, 600);
        g.generateTexture(file.key, 800, 600);
        g.destroy();
      }
    });

    this.load.setCORS('anonymous');
    this.load.image('bg_football', 'https://picsum.photos/id/1059/800/600');
    this.load.image('bg_sumo', 'https://picsum.photos/id/1060/800/600');
    this.load.image('bg_pingpong', 'https://picsum.photos/id/96/800/600');
    this.load.image('bg_golf', 'https://picsum.photos/id/167/800/600');
    this.load.image('bg_f1', 'https://picsum.photos/id/1028/800/600');
  }

  public create(): void {
    this.createProceduralTextures();
    this.scene.start('MenuScene');
  }

  private createProceduralTextures(): void {
    const bfg = this.add.graphics();
    bfg.fillStyle(0xffffff);
    bfg.fillCircle(12, 12, 12);
    bfg.fillStyle(0x111111);
    const pts: Array<[number, number]> = [
      [12, 2],
      [20, 8],
      [18, 18],
      [6, 18],
      [4, 8],
    ];
    pts.forEach(([x, y]) => {
      bfg.fillCircle(x, y, 3);
    });
    bfg.generateTexture('ball_football', 24, 24);
    bfg.destroy();

    const bpg = this.add.graphics();
    bpg.fillStyle(0xff6600);
    bpg.fillCircle(8, 8, 8);
    bpg.lineStyle(1, 0xffffff, 0.5);
    bpg.strokeCircle(8, 8, 8);
    bpg.generateTexture('ball_pingpong', 16, 16);
    bpg.destroy();

    const bgg = this.add.graphics();
    bgg.fillStyle(0xffffff);
    bgg.fillCircle(10, 10, 10);
    bgg.fillStyle(0xcccccc);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      bgg.fillCircle(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 2);
    }
    bgg.generateTexture('ball_golf', 20, 20);
    bgg.destroy();

    const modes: ModeName[] = ['football', 'sumo', 'pingpong', 'golf', 'f1'];
    modes.forEach((mode) => {
      (['p1', 'p2'] as const).forEach((p, pi) => {
        const g = this.add.graphics();
        createPlayerSkin(g, mode, (pi + 1) as 1 | 2);
        g.generateTexture(`${p}_${mode}`, 48, 56);
        g.destroy();
      });
    });
  }
}
