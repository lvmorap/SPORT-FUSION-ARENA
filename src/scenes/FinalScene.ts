import Phaser from 'phaser';
import type { GameData } from '../types';

export class FinalScene extends Phaser.Scene {
  private gameData: GameData | null = null;

  public constructor() {
    super({ key: 'FinalScene' });
  }

  public init(data: GameData): void {
    this.gameData = data;
  }

  public create(): void {
    if (this.gameData === null) {
      return;
    }

    this.add.rectangle(400, 300, 800, 600, 0x050510);

    this.add
      .text(400, 60, 'FIN DEL JUEGO', {
        fontSize: '40px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00ffcc',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    let finalWinner = 'EMPATE';
    let winnerColor = '#ffeb00';
    if (this.gameData.globalScores.p1 > this.gameData.globalScores.p2) {
      finalWinner = 'JUGADOR 1';
      winnerColor = '#00e5ff';
    } else if (this.gameData.globalScores.p2 > this.gameData.globalScores.p1) {
      finalWinner = 'JUGADOR 2';
      winnerColor = '#ff3d71';
    }

    const winnerText = finalWinner === 'EMPATE' ? '¡EMPATE TOTAL!' : `¡${finalWinner} GANA!`;
    this.add
      .text(400, 140, winnerText, {
        fontSize: '48px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: winnerColor,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add.text(400, 200, '🏆', { fontSize: '60px' }).setOrigin(0.5);

    this.add
      .text(200, 280, `P1: ${this.gameData.globalScores.p1}`, {
        fontSize: '40px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00e5ff',
      })
      .setOrigin(0.5);

    this.add
      .text(600, 280, `P2: ${this.gameData.globalScores.p2}`, {
        fontSize: '40px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ff3d71',
      })
      .setOrigin(0.5);

    this.add
      .text(400, 340, 'DESGLOSE POR MODO', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    let yPos = 380;
    this.gameData.modeWinners.forEach((mode, index) => {
      const winColor =
        mode.winner === 'P1' ? '#00e5ff' : mode.winner === 'P2' ? '#ff3d71' : '#ffeb00';
      this.add
        .text(
          400,
          yPos,
          `${index + 1}. ${mode.mode}: ${mode.winner} (${mode.p1Score}-${mode.p2Score})`,
          {
            fontSize: '14px',
            fontFamily: 'Share Tech Mono, Courier New, monospace',
            color: winColor,
          }
        )
        .setOrigin(0.5);
      yPos += 25;
    });

    const playAgainText = this.add
      .text(400, 560, 'Presiona cualquier tecla para jugar de nuevo', {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffeb00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: playAgainText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown', () => {
      this.scene.start('MenuScene');
    });
  }
}
