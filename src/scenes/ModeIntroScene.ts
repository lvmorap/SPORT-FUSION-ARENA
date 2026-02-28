import Phaser from 'phaser';
import type { ModeIntroData } from '../types';
import { MODE_ICONS } from '../types';

export class ModeIntroScene extends Phaser.Scene {
  private modeData: ModeIntroData | null = null;
  private countdown = 3;
  private isTransitioning = false;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private progressBar: Phaser.GameObjects.Rectangle | null = null;

  public constructor() {
    super({ key: 'ModeIntroScene' });
  }

  public init(data: ModeIntroData): void {
    this.modeData = data;
    this.countdown = 3;
    this.isTransitioning = false;
  }

  public create(): void {
    if (this.modeData === null) {
      return;
    }

    const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
    this.tweens.add({
      targets: bg,
      alpha: 0.9,
      duration: 200,
      ease: 'Power2',
    });

    const iconChar = MODE_ICONS[this.modeData.mode];
    const icon = this.add.text(400, -50, iconChar, { fontSize: '72px' }).setOrigin(0.5);

    this.tweens.add({
      targets: icon,
      y: 130,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const title = this.add
      .text(-300, 220, this.modeData.title, {
        fontSize: '36px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#00ffcc',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        wordWrap: { width: 700 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      x: 400,
      duration: 400,
      delay: 100,
      ease: 'Power3.easeOut',
    });

    const desc1 = this.add
      .text(400, 298, this.modeData.line1, {
        fontSize: '18px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffffff',
        wordWrap: { width: 600 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const desc2 = this.add
      .text(400, 332, this.modeData.line2, {
        fontSize: '16px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#aaaaaa',
        wordWrap: { width: 600 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [desc1, desc2],
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Power2',
    });

    this.add
      .text(400, 400, `MODO ${this.modeData.modeNumber} DE 5`, {
        fontSize: '16px',
        fontFamily: 'Courier New, monospace',
        color: '#555555',
      })
      .setOrigin(0.5);

    this.countdownText = this.add
      .text(400, 470, '3', {
        fontSize: '80px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#ffeb00',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0);

    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: 200,
      ease: 'Back.easeOut',
    });

    this.add.rectangle(400, 540, 500, 8, 0x222222).setOrigin(0.5);
    this.progressBar = this.add.rectangle(150, 540, 0, 8, 0x00ffcc).setOrigin(0, 0.5);
    this.tweens.add({
      targets: this.progressBar,
      width: 500,
      duration: 3000,
      ease: 'Linear',
    });

    const skipHint = this.add
      .text(400, 575, 'PRESIONA ESPACIO PARA SALTAR', {
        fontSize: '12px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: '#666666',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: skipHint,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startGame();
    });

    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown--;
        if (this.countdownText !== null) {
          this.countdownText.setText(this.countdown > 0 ? this.countdown.toString() : '¡GO!');

          this.tweens.add({
            targets: this.countdownText,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 100,
            yoyo: true,
            ease: 'Power2',
          });

          if (this.countdown === 2) {
            this.countdownText.setColor('#ffaa00');
          } else if (this.countdown === 1) {
            this.countdownText.setColor('#ff6600');
          } else if (this.countdown === 0) {
            this.countdownText.setColor('#00ff88');
            this.time.delayedCall(200, () => {
              this.startGame();
            });
          }
        }
      },
    });
  }

  private startGame(): void {
    if (this.isTransitioning || this.modeData === null) {
      return;
    }
    this.isTransitioning = true;

    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.time.delayedCall(150, () => {
      if (this.modeData !== null) {
        this.scene.start('GameScene', this.modeData.gameData);
      }
    });
  }
}
