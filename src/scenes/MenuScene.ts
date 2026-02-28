import Phaser from 'phaser';
import type { GameData, ModeIntroData } from '../types';

export class MenuScene extends Phaser.Scene {
  public constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    this.add.rectangle(400, 300, 800, 600, 0x050510);

    const title = this.add
      .text(400, 180, 'SPORT FUSION\nARENA', {
        fontSize: '64px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00ffcc',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 320, '5 deportes reinventados en 5 minutos', {
        fontSize: '22px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 400, 'Jugador 1: WASD + F/G', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00e5ff',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 430, 'Jugador 2: ↑↓←→ + Shift/Enter', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ff3d71',
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(400, 520, 'PRESIONA CUALQUIER TECLA PARA COMENZAR', {
        fontSize: '20px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffeb00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.input.keyboard?.on('keydown', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    const gameData: GameData = {
      currentModeIndex: 0,
      modes: ['football', 'sumo', 'pingpong', 'golf', 'f1'] as const,
      modeNames: [
        'FÚTBOL CON ARCOS MÓVILES',
        'SUMO CON ZONA MÓVIL',
        'PING PONG',
        'GOLF — MISMO CURSO',
        'FÓRMULA 1',
      ] as const,
      globalScores: { p1: 0, p2: 0 },
      modeWinners: [],
    };

    const introData: ModeIntroData = {
      mode: 'football',
      title: 'FÚTBOL CON ARCOS MÓVILES',
      line1: 'Los arcos no se quedan quietos. Solo puedes anotar',
      line2: 'por el frente del arco. El ángulo lo es todo.',
      modeNumber: 1,
      gameData: gameData,
    };

    this.scene.start('ModeIntroScene', introData);
  }
}
