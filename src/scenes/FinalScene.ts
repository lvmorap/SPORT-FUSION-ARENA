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
      .text(400, 40, 'FIN DEL JUEGO', {
        fontSize: '36px',
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
      .text(400, 100, winnerText, {
        fontSize: '40px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: winnerColor,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add.text(400, 150, '🏆', { fontSize: '50px' }).setOrigin(0.5);

    this.drawScoreTable();

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

  private drawScoreTable(): void {
    if (this.gameData === null) {
      return;
    }

    const tableX = 80;
    const tableY = 190;
    const tableW = 640;
    const rowH = 34;
    const headerH = 38;
    const modes = this.gameData.modeWinners;
    const totalRows = modes.length + 2;
    const tableH = headerH + totalRows * rowH;
    const col1W = 240;
    const col2W = 130;
    const col3W = 130;
    const col4W = 140;

    const g = this.add.graphics();

    g.fillStyle(0x111122, 0.9);
    g.fillRect(tableX, tableY, tableW, tableH);

    g.fillStyle(0x1a2a4a, 1);
    g.fillRect(tableX, tableY, tableW, headerH);

    g.lineStyle(2, 0x334466);
    g.strokeRect(tableX, tableY, tableW, tableH);

    const font = 'Share Tech Mono, Courier New, monospace';

    this.add
      .text(tableX + col1W / 2, tableY + headerH / 2, 'MODO', {
        fontSize: '15px',
        fontFamily: font,
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(tableX + col1W + col2W / 2, tableY + headerH / 2, 'P1', {
        fontSize: '15px',
        fontFamily: font,
        color: '#00e5ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(tableX + col1W + col2W + col3W / 2, tableY + headerH / 2, 'P2', {
        fontSize: '15px',
        fontFamily: font,
        color: '#ff3d71',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(tableX + col1W + col2W + col3W + col4W / 2, tableY + headerH / 2, 'GANADOR', {
        fontSize: '15px',
        fontFamily: font,
        color: '#ffeb00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    g.lineStyle(1, 0x334466);
    g.lineBetween(tableX + col1W, tableY, tableX + col1W, tableY + tableH);
    g.lineBetween(tableX + col1W + col2W, tableY, tableX + col1W + col2W, tableY + tableH);
    g.lineBetween(
      tableX + col1W + col2W + col3W,
      tableY,
      tableX + col1W + col2W + col3W,
      tableY + tableH
    );

    modes.forEach((mode, i) => {
      const rowY = tableY + headerH + i * rowH;

      if (i % 2 === 1) {
        g.fillStyle(0x0d1528, 0.5);
        g.fillRect(tableX, rowY, tableW, rowH);
      }

      g.lineStyle(1, 0x222244, 0.5);
      g.lineBetween(tableX, rowY, tableX + tableW, rowY);

      const winColor =
        mode.winner === 'P1' ? '#00e5ff' : mode.winner === 'P2' ? '#ff3d71' : '#ffeb00';
      const winLabel = mode.winner === 'P1' ? '← P1' : mode.winner === 'P2' ? 'P2 →' : 'EMPATE';

      this.add
        .text(tableX + 10, rowY + rowH / 2, `${i + 1}. ${mode.mode}`, {
          fontSize: '13px',
          fontFamily: font,
          color: '#cccccc',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(tableX + col1W + col2W / 2, rowY + rowH / 2, `${mode.p1Score}`, {
          fontSize: '14px',
          fontFamily: font,
          color: '#00e5ff',
        })
        .setOrigin(0.5);
      this.add
        .text(tableX + col1W + col2W + col3W / 2, rowY + rowH / 2, `${mode.p2Score}`, {
          fontSize: '14px',
          fontFamily: font,
          color: '#ff3d71',
        })
        .setOrigin(0.5);
      this.add
        .text(tableX + col1W + col2W + col3W + col4W / 2, rowY + rowH / 2, winLabel, {
          fontSize: '14px',
          fontFamily: font,
          color: winColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    });

    const sepY = tableY + headerH + modes.length * rowH;
    g.lineStyle(2, 0x334466);
    g.lineBetween(tableX, sepY, tableX + tableW, sepY);

    const totalY = sepY + rowH / 2;
    g.fillStyle(0x1a2a4a, 0.8);
    g.fillRect(tableX, sepY, tableW, rowH);

    this.add
      .text(tableX + 10, totalY, 'VICTORIAS TOTALES', {
        fontSize: '14px',
        fontFamily: font,
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(tableX + col1W + col2W / 2, totalY, `${this.gameData.globalScores.p1}`, {
        fontSize: '16px',
        fontFamily: font,
        color: '#00e5ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(tableX + col1W + col2W + col3W / 2, totalY, `${this.gameData.globalScores.p2}`, {
        fontSize: '16px',
        fontFamily: font,
        color: '#ff3d71',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    let finalWinner = 'EMPATE';
    let finalColor = '#ffeb00';
    if (this.gameData.globalScores.p1 > this.gameData.globalScores.p2) {
      finalWinner = '🏆 P1 GANA';
      finalColor = '#00e5ff';
    } else if (this.gameData.globalScores.p2 > this.gameData.globalScores.p1) {
      finalWinner = '🏆 P2 GANA';
      finalColor = '#ff3d71';
    }

    this.add
      .text(tableX + col1W + col2W + col3W + col4W / 2, totalY, finalWinner, {
        fontSize: '13px',
        fontFamily: font,
        color: finalColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }
}
