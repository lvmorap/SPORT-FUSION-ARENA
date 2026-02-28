import Phaser from 'phaser';
import type { ResultData, ModeIntroData, ModeName } from '../types';

interface ModeIntroTexts {
  title: string;
  line1: string;
  line2: string;
}

const INTRO_TEXTS: Record<Exclude<ModeName, 'football'>, ModeIntroTexts> = {
  sumo: {
    title: 'SUMO CON ZONA MÓVIL',
    line1: 'La zona se mueve. Quédate dentro y empuja a tu rival fuera.',
    line2: 'Cada segundo fuera de la zona pierdes puntos.',
  },
  pingpong: {
    title: 'PING PONG',
    line1: 'Solo puedes moverte arriba y abajo. Golpea la pelota',
    line2: 'para que no salga por tu lado. Cada golpe la acelera.',
  },
  golf: {
    title: 'GOLF — MISMO CURSO, DOS PELOTAS',
    line1: 'Mantén F/Shift para cargar fuerza. Suelta para golpear.',
    line2: 'Evita el agua. Llega al hoyo antes que tu rival.',
  },
  f1: {
    title: 'FÓRMULA 1 — CIRCUITO DE VELOCIDAD',
    line1: 'Gira para mantenerte en la pista. Si te sales,',
    line2: 'pierdes velocidad 3 segundos. ¡Más vueltas = más puntos!',
  },
};

export class ResultScene extends Phaser.Scene {
  private resultData: ResultData | null = null;

  public constructor() {
    super({ key: 'ResultScene' });
  }

  public init(data: ResultData): void {
    this.resultData = data;
  }

  public create(): void {
    if (this.resultData === null) {
      return;
    }

    this.add.rectangle(400, 300, 800, 600, 0x050510);

    this.add
      .text(400, 80, this.resultData.modeName, {
        fontSize: '28px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00ffcc',
      })
      .setOrigin(0.5);

    const winnerColor =
      this.resultData.modeWinner === 'P1'
        ? '#00e5ff'
        : this.resultData.modeWinner === 'P2'
          ? '#ff3d71'
          : '#ffeb00';
    const winnerText =
      this.resultData.modeWinner === 'EMPATE' ? '¡EMPATE!' : `¡${this.resultData.modeWinner} GANA!`;

    this.add
      .text(400, 180, winnerText, {
        fontSize: '52px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: winnerColor,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(250, 280, `P1: ${this.resultData.modeScores.p1}`, {
        fontSize: '36px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00e5ff',
      })
      .setOrigin(0.5);

    this.add
      .text(550, 280, `P2: ${this.resultData.modeScores.p2}`, {
        fontSize: '36px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ff3d71',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 380, 'PUNTUACIÓN GLOBAL', {
        fontSize: '20px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.add
      .text(250, 430, `P1: ${this.resultData.globalScores.p1}`, {
        fontSize: '32px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00e5ff',
      })
      .setOrigin(0.5);

    this.add
      .text(550, 430, `P2: ${this.resultData.globalScores.p2}`, {
        fontSize: '32px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ff3d71',
      })
      .setOrigin(0.5);

    const continueText = this.add
      .text(400, 530, 'Presiona cualquier tecla para continuar', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffeb00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown', () => {
      this.nextMode();
    });
  }

  private nextMode(): void {
    if (this.resultData === null) {
      return;
    }

    const gameData = this.resultData.gameData;
    gameData.currentModeIndex++;

    if (gameData.currentModeIndex >= 5) {
      this.scene.start('FinalScene', gameData);
    } else {
      const nextMode = gameData.modes[gameData.currentModeIndex];
      if (nextMode === undefined || nextMode === 'football') {
        return;
      }

      const texts = INTRO_TEXTS[nextMode];

      const introData: ModeIntroData = {
        mode: nextMode,
        title: texts.title,
        line1: texts.line1,
        line2: texts.line2,
        modeNumber: gameData.currentModeIndex + 1,
        gameData: gameData,
      };

      this.scene.start('ModeIntroScene', introData);
    }
  }
}
