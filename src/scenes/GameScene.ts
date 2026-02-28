import Phaser from 'phaser';
import type { GameData, GameScene as IGameScene, GameSceneKeys, WinnerType } from '../types';
import { FootballMode, SumoMode, PingPongMode, GolfMode, F1Mode, GameMode } from '../modes';
import { showFloatingText } from '../utils/helpers';

export class GameScene extends Phaser.Scene implements IGameScene {
  public keys!: GameSceneKeys;
  public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameData: GameData | null = null;
  private currentMode: GameMode | null = null;
  private timeLeft = 60;
  private p1ScoreText: Phaser.GameObjects.Text | null = null;
  private p2ScoreText: Phaser.GameObjects.Text | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private scoreboardBg: Phaser.GameObjects.Rectangle | null = null;

  public constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: GameData): void {
    this.gameData = data;
  }

  public create(): void {
    if (this.gameData === null) {
      return;
    }

    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input not available');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      w: keyboard.addKey('W'),
      a: keyboard.addKey('A'),
      s: keyboard.addKey('S'),
      d: keyboard.addKey('D'),
      f: keyboard.addKey('F'),
      g: keyboard.addKey('G'),
      shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      enter: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    };

    const modeIndex = this.gameData.currentModeIndex;
    const modeName = this.gameData.modes[modeIndex];

    if (modeName === undefined) {
      throw new Error(`Invalid mode index: ${modeIndex}`);
    }

    switch (modeName) {
      case 'football':
        this.currentMode = new FootballMode(this);
        break;
      case 'sumo':
        this.currentMode = new SumoMode(this);
        break;
      case 'pingpong':
        this.currentMode = new PingPongMode(this);
        break;
      case 'golf':
        this.currentMode = new GolfMode(this);
        break;
      case 'f1':
        this.currentMode = new F1Mode(this);
        break;
    }

    this.currentMode.setup();

    this.timeLeft = 60;
    this.time.addEvent({
      delay: 1000,
      repeat: 59,
      callback: () => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.endMode();
        }
      },
    });

    this.createUI();
  }

  private createUI(): void {
    this.scoreboardBg = this.add.rectangle(400, 30, 440, 50, 0x000000, 0.6);
    this.scoreboardBg.setStrokeStyle(2, 0x333333);

    this.p1ScoreText = this.add
      .text(230, 30, 'P1: 0', {
        fontSize: '24px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00e5ff',
      })
      .setOrigin(0.5);

    this.timerText = this.add
      .text(400, 30, '60s', {
        fontSize: '28px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffeb00',
      })
      .setOrigin(0.5);

    this.p2ScoreText = this.add
      .text(570, 30, 'P2: 0', {
        fontSize: '24px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ff3d71',
      })
      .setOrigin(0.5);
  }

  public override update(time: number, delta: number): void {
    if (this.currentMode === null) {
      return;
    }

    this.currentMode.update(time, delta);

    if (this.p1ScoreText !== null) {
      this.p1ScoreText.setText(`P1: ${this.currentMode.p1Score}`);
    }
    if (this.p2ScoreText !== null) {
      this.p2ScoreText.setText(`P2: ${this.currentMode.p2Score}`);
    }
    if (this.timerText !== null) {
      this.timerText.setText(`${this.timeLeft}s`);

      if (this.timeLeft <= 10) {
        this.timerText.setColor('#ff2222');
      }
    }
  }

  public showFloatingText(x: number, y: number, text: string, color: string): void {
    showFloatingText(this, x, y, text, color);
  }

  private endMode(): void {
    if (this.currentMode === null || this.gameData === null) {
      return;
    }

    this.currentMode.cleanup();

    let modeWinner: WinnerType = 'EMPATE';
    if (this.currentMode.p1Score > this.currentMode.p2Score) {
      modeWinner = 'P1';
    } else if (this.currentMode.p2Score > this.currentMode.p1Score) {
      modeWinner = 'P2';
    }

    if (modeWinner === 'P1') {
      this.gameData.globalScores.p1++;
    } else if (modeWinner === 'P2') {
      this.gameData.globalScores.p2++;
    }

    const currentModeName = this.gameData.modeNames[this.gameData.currentModeIndex];
    if (currentModeName !== undefined) {
      this.gameData.modeWinners.push({
        mode: currentModeName,
        winner: modeWinner,
        p1Score: this.currentMode.p1Score,
        p2Score: this.currentMode.p2Score,
      });
    }

    this.scene.start('ResultScene', {
      modeName: currentModeName ?? 'Unknown',
      modeWinner: modeWinner,
      modeScores: { p1: this.currentMode.p1Score, p2: this.currentMode.p2Score },
      globalScores: this.gameData.globalScores,
      modeNumber: this.gameData.currentModeIndex + 1,
      gameData: this.gameData,
    });
  }
}
