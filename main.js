// =============================================================================
// SPORT FUSION ARENA - Main Game Logic
// A 2D local multiplayer sports game with 5 reinvented sports modes
// =============================================================================

// Player Skin Generator Function
function createPlayerSkin(graphics, mode, playerNum) {
  const color = playerNum === 1 ? 0x00e5ff : 0xff3d71;
  const darkColor = playerNum === 1 ? 0x0099aa : 0xaa1144;

  // Center the graphics at 24, 28 (half of 48x56)
  const cx = 24, cy = 28;

  switch(mode) {
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

// =============================================================================
// BOOT SCENE - Load all assets
// =============================================================================
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    this.add.rectangle(400, 300, 610, 24, 0x333333).setOrigin(0.5);
    const prog = this.add.rectangle(100, 300, 0, 20, 0x00ffcc).setOrigin(0, 0.5);
    this.add.text(400, 260, 'CARGANDO SPORT FUSION ARENA...', {
      fontSize: '18px', fontFamily: 'Share Tech Mono, Courier New, monospace', color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => prog.width = v * 600);

    // Fallback for load errors
    this.load.on('loaderror', (file) => {
      if (file.key.startsWith('bg_')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const bgColors = {
          bg_football: 0x0d3b0d,
          bg_sumo: 0x5c3a1e,
          bg_pingpong: 0x0d1f3c,
          bg_golf: 0x1a4a1a,
          bg_f1: 0x111111
        };
        g.fillStyle(bgColors[file.key] || 0x111111);
        g.fillRect(0, 0, 800, 600);
        g.generateTexture(file.key, 800, 600);
        g.destroy();
      }
    });

    // Load background images
    this.load.setCORS('anonymous');
    this.load.image('bg_football', 'https://picsum.photos/id/1059/800/600');
    this.load.image('bg_sumo', 'https://picsum.photos/id/1060/800/600');
    this.load.image('bg_pingpong', 'https://picsum.photos/id/96/800/600');
    this.load.image('bg_golf', 'https://picsum.photos/id/167/800/600');
    this.load.image('bg_f1', 'https://picsum.photos/id/1028/800/600');
  }

  create() {
    this.createProceduralTextures();
    this.scene.start('MenuScene');
  }

  createProceduralTextures() {
    // Football ball
    const bfg = this.make.graphics({ add: false });
    bfg.fillStyle(0xffffff);
    bfg.fillCircle(12, 12, 12);
    bfg.fillStyle(0x111111);
    const pts = [[12, 2], [20, 8], [18, 18], [6, 18], [4, 8]];
    pts.forEach(([x, y]) => bfg.fillCircle(x, y, 3));
    bfg.generateTexture('ball_football', 24, 24);
    bfg.destroy();

    // Ping pong ball
    const bpg = this.make.graphics({ add: false });
    bpg.fillStyle(0xff6600);
    bpg.fillCircle(8, 8, 8);
    bpg.lineStyle(1, 0xffffff, 0.5);
    bpg.strokeCircle(8, 8, 8);
    bpg.generateTexture('ball_pingpong', 16, 16);
    bpg.destroy();

    // Golf ball
    const bgg = this.make.graphics({ add: false });
    bgg.fillStyle(0xffffff);
    bgg.fillCircle(10, 10, 10);
    bgg.fillStyle(0xcccccc);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      bgg.fillCircle(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 2);
    }
    bgg.generateTexture('ball_golf', 20, 20);
    bgg.destroy();

    // Player textures for each mode
    const modes = ['football', 'sumo', 'pingpong', 'golf', 'f1'];
    modes.forEach(mode => {
      ['p1', 'p2'].forEach((p, pi) => {
        const g = this.make.graphics({ add: false });
        createPlayerSkin(g, mode, pi + 1);
        g.generateTexture(`${p}_${mode}`, 48, 56);
        g.destroy();
      });
    });
  }
}

// =============================================================================
// MENU SCENE - Title screen
// =============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x050510);

    // Title
    const title = this.add.text(400, 180, 'SPORT FUSION\nARENA', {
      fontSize: '64px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(400, 320, '5 deportes reinventados en 5 minutos', {
      fontSize: '22px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(400, 400, 'Jugador 1: WASD + F/G', {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00e5ff'
    }).setOrigin(0.5);

    this.add.text(400, 430, 'Jugador 2: ↑↓←→ + Shift/Enter', {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ff3d71'
    }).setOrigin(0.5);

    // Press any key
    const startText = this.add.text(400, 520, 'PRESIONA CUALQUIER TECLA PARA COMENZAR', {
      fontSize: '20px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00'
    }).setOrigin(0.5);

    // Blinking animation
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Title animation
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Start game on any key
    this.input.keyboard.on('keydown', () => {
      this.startGame();
    });
  }

  startGame() {
    const gameData = {
      currentModeIndex: 0,
      modes: ['football', 'sumo', 'pingpong', 'golf', 'f1'],
      modeNames: ['FÚTBOL CON ARCOS MÓVILES', 'SUMO CON ZONA MÓVIL', 'PING PONG', 'GOLF — MISMO CURSO', 'FÓRMULA 1'],
      globalScores: { p1: 0, p2: 0 },
      modeWinners: []
    };
    
    const introData = {
      mode: 'football',
      title: 'FÚTBOL CON ARCOS MÓVILES',
      line1: 'Los arcos no se quedan quietos. Solo puedes anotar',
      line2: 'por el frente del arco. El ángulo lo es todo.',
      modeNumber: 1,
      gameData: gameData
    };
    
    this.scene.start('ModeIntroScene', introData);
  }
}

// =============================================================================
// MODE INTRO SCENE - 7 second intro before each mode
// =============================================================================
class ModeIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeIntroScene' });
  }

  init(data) {
    this.modeData = data;
    this.countdown = 7;
  }

  create() {
    // Dark overlay
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

    // Sport icon
    const icons = { football: '⚽', sumo: '🥊', pingpong: '🏓', golf: '⛳', f1: '🏎️' };
    this.add.text(400, 140, icons[this.modeData.mode] || '🏆', {
      fontSize: '72px'
    }).setOrigin(0.5);

    // Mode title
    this.add.text(400, 230, this.modeData.title, {
      fontSize: '36px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);

    // Description lines
    this.add.text(400, 308, this.modeData.line1, {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff',
      wordWrap: { width: 600 },
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(400, 342, this.modeData.line2, {
      fontSize: '16px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#aaaaaa',
      wordWrap: { width: 600 },
      align: 'center'
    }).setOrigin(0.5);

    // Mode number
    this.add.text(400, 410, `MODO ${this.modeData.modeNumber} DE 5`, {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#555555'
    }).setOrigin(0.5);

    // Countdown number
    this.countdownText = this.add.text(400, 480, '7', {
      fontSize: '80px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Progress bar
    this.add.rectangle(400, 555, 600, 10, 0x333333).setOrigin(0.5);
    this.progressBar = this.add.rectangle(100, 555, 0, 10, 0x00ffcc).setOrigin(0, 0.5);
    this.tweens.add({
      targets: this.progressBar,
      width: 600,
      duration: 7000,
      ease: 'Linear'
    });

    // Countdown timer
    this.time.addEvent({
      delay: 1000,
      repeat: 6,
      callback: () => {
        this.countdown--;
        this.countdownText.setText(this.countdown > 0 ? this.countdown.toString() : '¡YA!');
        this.tweens.add({
          targets: this.countdownText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 150,
          yoyo: true,
          ease: 'Power2'
        });
        if (this.countdown <= 0) {
          this.time.delayedCall(300, () => {
            this.scene.start('GameScene', this.modeData.gameData);
          });
        }
      }
    });
  }
}

// =============================================================================
// GAME MODE BASE CLASS
// =============================================================================
class GameMode {
  constructor(scene, p1, p2) {
    this.scene = scene;
    this.p1 = p1;
    this.p2 = p2;
    this.p1Score = 0;
    this.p2Score = 0;
    this.timeLeft = 60;
  }

  setup() { }
  update(time, delta) { }
  checkEnd() { return null; }
  cleanup() { }
  get modeName() { return 'Unknown'; }
  get introData() { return { title: '', line1: '', line2: '' }; }
}

// =============================================================================
// FOOTBALL MODE - Moving goals
// =============================================================================
class FootballMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_football').setDisplaySize(800, 600).setAlpha(0.35).setDepth(-10);

    // Field lines
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeRect(60, 40, 680, 520);
    g.lineBetween(400, 40, 400, 560);
    g.strokeCircle(400, 300, 70);

    // Ball
    this.ball = this.scene.physics.add.image(400, 300, 'ball_football');
    this.ball.setBounce(0.75);
    this.ball.setMaxVelocity(600, 600);
    this.ball.setCollideWorldBounds(true);
    this.ball.setDrag(50);

    // Players
    this.p1 = this.scene.physics.add.image(200, 300, 'p1_football');
    this.p2 = this.scene.physics.add.image(600, 300, 'p2_football');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.3);
    this.p2.setBounce(0.3);
    this.p1.body.setDrag(400);
    this.p2.body.setDrag(400);

    // Ball-player collision
    this.scene.physics.add.collider(this.ball, this.p1, () => this.onBallHit());
    this.scene.physics.add.collider(this.ball, this.p2, () => this.onBallHit());
    this.scene.physics.add.collider(this.p1, this.p2);

    // Goals
    this.goal1 = { x: 80, y: 300, width: 18, height: 90, speed: 90, dir: 1 };
    this.goal2 = { x: 720, y: 300, width: 18, height: 90, speed: 90, dir: -1 };
    this.goalGraphics = this.scene.add.graphics();

    // Scored flag to prevent double scoring
    this.justScored = false;
  }

  onBallHit() {
    this.scene.cameras.main.shake(60, 0.003);
  }

  update(time, delta) {
    // Player 1 movement (WASD)
    const speed = 280;
    if (this.scene.keys.w.isDown) this.p1.body.setVelocityY(-speed);
    else if (this.scene.keys.s.isDown) this.p1.body.setVelocityY(speed);
    if (this.scene.keys.a.isDown) this.p1.body.setVelocityX(-speed);
    else if (this.scene.keys.d.isDown) this.p1.body.setVelocityX(speed);

    // Player 2 movement (Arrows)
    if (this.scene.cursors.up.isDown) this.p2.body.setVelocityY(-speed);
    else if (this.scene.cursors.down.isDown) this.p2.body.setVelocityY(speed);
    if (this.scene.cursors.left.isDown) this.p2.body.setVelocityX(-speed);
    else if (this.scene.cursors.right.isDown) this.p2.body.setVelocityX(speed);

    // Update goals
    this.updateGoals(delta);

    // Check for goals
    this.checkGoal();
  }

  updateGoals(delta) {
    // Move goals up and down
    this.goal1.y += this.goal1.speed * this.goal1.dir * (delta / 1000);
    this.goal2.y += this.goal2.speed * this.goal2.dir * (delta / 1000);

    // Bounce at vertical limits
    if (this.goal1.y < 120 || this.goal1.y > 480) this.goal1.dir *= -1;
    if (this.goal2.y < 120 || this.goal2.y > 480) this.goal2.dir *= -1;

    // Redraw goals
    this.goalGraphics.clear();
    this.goalGraphics.lineStyle(4, 0xffffff, 1);

    // Goal P1 (left) - U shape open to right
    const g1top = this.goal1.y - this.goal1.height / 2;
    const g1bot = this.goal1.y + this.goal1.height / 2;
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x - 9, g1bot);
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x + 9, g1top);
    this.goalGraphics.lineBetween(this.goal1.x - 9, g1bot, this.goal1.x + 9, g1bot);

    // Goal P2 (right) - U shape open to left
    const g2top = this.goal2.y - this.goal2.height / 2;
    const g2bot = this.goal2.y + this.goal2.height / 2;
    this.goalGraphics.lineBetween(this.goal2.x + 9, g2top, this.goal2.x + 9, g2bot);
    this.goalGraphics.lineBetween(this.goal2.x - 9, g2top, this.goal2.x + 9, g2top);
    this.goalGraphics.lineBetween(this.goal2.x - 9, g2bot, this.goal2.x + 9, g2bot);
  }

  checkGoal() {
    if (this.justScored) return;

    const bx = this.ball.x, by = this.ball.y;
    const bvx = this.ball.body.velocity.x;

    // Goal in P2's goal (right): ball moving right (vx > 0)
    if (bvx > 50 && bx > this.goal2.x - 20 && bx < this.goal2.x + 20) {
      if (by > this.goal2.y - this.goal2.height / 2 && by < this.goal2.y + this.goal2.height / 2) {
        this.scoreGoal(1);
      }
    }

    // Goal in P1's goal (left): ball moving left (vx < 0)
    if (bvx < -50 && bx > this.goal1.x - 20 && bx < this.goal1.x + 20) {
      if (by > this.goal1.y - this.goal1.height / 2 && by < this.goal1.y + this.goal1.height / 2) {
        this.scoreGoal(2);
      }
    }
  }

  scoreGoal(player) {
    if (player === 1) this.p1Score++;
    else this.p2Score++;

    this.justScored = true;
    this.scene.cameras.main.shake(200, 0.01);
    this.scene.showFloatingText(this.ball.x, this.ball.y, '¡GOL!', player === 1 ? '#00e5ff' : '#ff3d71');

    // Reset ball
    this.scene.time.delayedCall(1000, () => {
      this.ball.setPosition(400, 300);
      this.ball.body.setVelocity(0, 0);
      this.justScored = false;
    });
  }

  cleanup() {
    this.goalGraphics.destroy();
  }

  get modeName() { return 'football'; }
}

// =============================================================================
// SUMO MODE - Moving zone
// =============================================================================
class SumoMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_sumo').setDisplaySize(800, 600).setAlpha(0.35).setDepth(-10);

    // Moving zone
    this.zone = {
      x: 400, y: 300,
      radius: 160,
      targetX: 400, targetY: 300,
      speed: 60
    };
    this.zoneGraphics = this.scene.add.graphics();

    // Players
    this.p1 = this.scene.physics.add.image(350, 300, 'p1_sumo');
    this.p2 = this.scene.physics.add.image(450, 300, 'p2_sumo');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.5);
    this.p2.setBounce(0.5);
    this.p1.body.setDrag(200);
    this.p2.body.setDrag(200);

    this.scene.physics.add.collider(this.p1, this.p2, () => this.onCollision());

    // Timers for scoring
    this.p1OutTimer = 0;
    this.p1InTimer = 0;
    this.p2OutTimer = 0;
    this.p2InTimer = 0;

    // Initial scores
    this.p1Score = 10;
    this.p2Score = 10;
  }

  onCollision() {
    this.scene.cameras.main.shake(100, 0.005);
  }

  update(time, delta) {
    // Player movement
    const speed = 260;
    if (this.scene.keys.w.isDown) this.p1.body.setVelocityY(-speed);
    else if (this.scene.keys.s.isDown) this.p1.body.setVelocityY(speed);
    if (this.scene.keys.a.isDown) this.p1.body.setVelocityX(-speed);
    else if (this.scene.keys.d.isDown) this.p1.body.setVelocityX(speed);

    if (this.scene.cursors.up.isDown) this.p2.body.setVelocityY(-speed);
    else if (this.scene.cursors.down.isDown) this.p2.body.setVelocityY(speed);
    if (this.scene.cursors.left.isDown) this.p2.body.setVelocityX(-speed);
    else if (this.scene.cursors.right.isDown) this.p2.body.setVelocityX(speed);

    // Push action
    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.f)) {
      this.doPush(this.p1, this.p2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.shift)) {
      this.doPush(this.p2, this.p1);
    }

    this.updateZone(delta);
    this.updatePoints(delta);
  }

  doPush(attacker, defender) {
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);
    if (dist < 80) {
      const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
      const force = 520;
      defender.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
      this.scene.cameras.main.shake(100, 0.005);
      attacker.setTint(0xffff00);
      this.scene.time.delayedCall(150, () => attacker.clearTint());
    }
  }

  updateZone(delta) {
    // Move zone towards target
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

    // Oscillate radius
    this.zone.radius = 160 + Math.sin(this.scene.time.now * 0.001) * 40;

    // Draw zone
    this.zoneGraphics.clear();
    this.zoneGraphics.lineStyle(4, 0xff6600, 1);
    this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius);
    this.zoneGraphics.fillStyle(0xff6600, 0.12);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius);
  }

  updatePoints(delta) {
    const p1Dist = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.zone.x, this.zone.y);
    const p2Dist = Phaser.Math.Distance.Between(this.p2.x, this.p2.y, this.zone.x, this.zone.y);

    // P1 scoring
    if (p1Dist > this.zone.radius) {
      this.p1OutTimer += delta;
      this.p1InTimer = 0;
      if (this.p1OutTimer > 1000) {
        this.p1Score = Math.max(0, this.p1Score - 1);
        this.p1OutTimer = 0;
        this.p1.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => this.p1.clearTint());
      }
    } else {
      this.p1OutTimer = 0;
      this.p1InTimer += delta;
      if (this.p1InTimer > 2000) {
        this.p1Score++;
        this.p1InTimer = 0;
      }
    }

    // P2 scoring
    if (p2Dist > this.zone.radius) {
      this.p2OutTimer += delta;
      this.p2InTimer = 0;
      if (this.p2OutTimer > 1000) {
        this.p2Score = Math.max(0, this.p2Score - 1);
        this.p2OutTimer = 0;
        this.p2.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => this.p2.clearTint());
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

  cleanup() {
    this.zoneGraphics.destroy();
  }

  get modeName() { return 'sumo'; }
}

// =============================================================================
// PING PONG MODE
// =============================================================================
class PingPongMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_pingpong').setDisplaySize(800, 600).setAlpha(0.4).setDepth(-10);

    // Table lines
    const g = this.scene.add.graphics();
    g.lineStyle(3, 0xffffff, 0.8);
    g.strokeRect(80, 80, 640, 440);
    g.lineStyle(6, 0xffffff, 1);
    g.lineBetween(400, 75, 400, 525);

    // Ball
    this.ball = this.scene.physics.add.image(400, 300, 'ball_pingpong');
    this.ball.setVelocity(220, Phaser.Math.Between(-150, 150));
    this.ball.setBounce(1, 1);
    this.ball.setMaxVelocity(900, 600);
    this.ball.setCollideWorldBounds(false);

    // Players (paddles)
    this.p1 = this.scene.physics.add.image(100, 300, 'p1_pingpong');
    this.p2 = this.scene.physics.add.image(700, 300, 'p2_pingpong');
    this.p1.setImmovable(true);
    this.p2.setImmovable(true);
    this.p1.body.allowGravity = false;
    this.p2.body.allowGravity = false;

    this.hitCount = 0;
    this.justScored = false;
  }

  update(time, delta) {
    // Vertical movement only
    const speed = 320;
    if (this.scene.keys.w.isDown) this.p1.body.setVelocityY(-speed);
    else if (this.scene.keys.s.isDown) this.p1.body.setVelocityY(speed);
    else this.p1.body.setVelocityY(0);

    if (this.scene.cursors.up.isDown) this.p2.body.setVelocityY(-speed);
    else if (this.scene.cursors.down.isDown) this.p2.body.setVelocityY(speed);
    else this.p2.body.setVelocityY(0);

    // Clamp player positions
    this.p1.y = Phaser.Math.Clamp(this.p1.y, 110, 490);
    this.p2.y = Phaser.Math.Clamp(this.p2.y, 110, 490);

    // Ball bouncing on top/bottom
    if (this.ball.y < 85) {
      this.ball.body.velocity.y = Math.abs(this.ball.body.velocity.y);
      this.ball.y = 86;
    }
    if (this.ball.y > 515) {
      this.ball.body.velocity.y = -Math.abs(this.ball.body.velocity.y);
      this.ball.y = 514;
    }

    // Paddle collision
    const hitRange = 30;
    if (Math.abs(this.ball.x - this.p1.x) < hitRange && Math.abs(this.ball.y - this.p1.y) < 40) {
      if (this.ball.body.velocity.x < 0) {
        this.ball.body.velocity.x = Math.abs(this.ball.body.velocity.x) + 30;
        this.ball.body.velocity.y += Phaser.Math.Between(-60, 60);
        this.hitCount++;
        this.onBallHit();
      }
    }

    if (Math.abs(this.ball.x - this.p2.x) < hitRange && Math.abs(this.ball.y - this.p2.y) < 40) {
      if (this.ball.body.velocity.x > 0) {
        this.ball.body.velocity.x = -Math.abs(this.ball.body.velocity.x) - 30;
        this.ball.body.velocity.y += Phaser.Math.Between(-60, 60);
        this.hitCount++;
        this.onBallHit();
      }
    }

    // Scoring
    if (!this.justScored) {
      if (this.ball.x < 30) {
        this.scorePoint(2);
      }
      if (this.ball.x > 770) {
        this.scorePoint(1);
      }
    }
  }

  onBallHit() {
    this.scene.cameras.main.shake(60, 0.003);
    const speed = Math.sqrt(this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2);
    const intensity = Math.min(speed / 900, 1);
    const r = Math.floor(255 * intensity);
    const b = Math.floor(255 * (1 - intensity));
    this.ball.setTint(Phaser.Display.Color.GetColor(r, 100, b));
  }

  scorePoint(player) {
    this.justScored = true;
    if (player === 1) this.p1Score++;
    else this.p2Score++;

    this.scene.showFloatingText(this.ball.x, this.ball.y, '+1', player === 1 ? '#00e5ff' : '#ff3d71');
    this.scene.cameras.main.shake(100, 0.005);

    this.scene.time.delayedCall(1000, () => {
      this.resetBall();
      this.justScored = false;
    });
  }

  resetBall() {
    this.ball.setPosition(400, 300);
    const dir = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.ball.setVelocity(220 * dir, Phaser.Math.Between(-150, 150));
    this.ball.clearTint();
    this.hitCount = 0;
  }

  cleanup() { }

  get modeName() { return 'pingpong'; }
}

// =============================================================================
// GOLF MODE
// =============================================================================
class GolfMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_golf').setDisplaySize(800, 600).setAlpha(0.4).setDepth(-10);

    // Draw course
    this.courseGraphics = this.scene.add.graphics();
    this.drawCourse();

    // Hole
    this.hole = { x: 680, y: 120, r: 18 };
    this.holeGraphics = this.scene.add.graphics();
    this.holeGraphics.fillStyle(0x000000);
    this.holeGraphics.fillCircle(this.hole.x, this.hole.y, this.hole.r);
    this.holeGraphics.lineStyle(3, 0xff0000);
    this.holeGraphics.strokeCircle(this.hole.x, this.hole.y, this.hole.r + 4);

    // Flag
    this.holeGraphics.fillStyle(0xff0000);
    this.holeGraphics.fillTriangle(this.hole.x, this.hole.y - 45, this.hole.x + 25, this.hole.y - 35, this.hole.x, this.hole.y - 25);
    this.holeGraphics.lineStyle(2, 0x000000);
    this.holeGraphics.lineBetween(this.hole.x, this.hole.y, this.hole.x, this.hole.y - 45);

    // Players as golf balls
    this.p1Ball = this.scene.physics.add.image(120, 500, 'p1_golf');
    this.p2Ball = this.scene.physics.add.image(160, 500, 'p2_golf');
    this.p1Ball.setBounce(0.4).setDrag(150).setMaxVelocity(700, 700);
    this.p2Ball.setBounce(0.4).setDrag(150).setMaxVelocity(700, 700);
    this.p1Ball.setCollideWorldBounds(true);
    this.p2Ball.setCollideWorldBounds(true);

    // Water hazard definition
    this.waterHazard = { x: 250, y: 350, radius: 35 };

    // Power and angle
    this.p1Power = 0;
    this.p2Power = 0;
    this.p1Charging = false;
    this.p2Charging = false;
    this.p1Angle = -Math.PI / 2;
    this.p2Angle = -Math.PI / 2;
    this.p1Strokes = 0;
    this.p2Strokes = 0;
    this.p1Finished = false;
    this.p2Finished = false;

    // UI graphics
    this.powerBarGraphics = this.scene.add.graphics();
    this.arrowGraphics = this.scene.add.graphics();
  }

  drawCourse() {
    // Simple fairway
    this.courseGraphics.fillStyle(0x2d5a2d, 0.6);
    // Start area
    this.courseGraphics.fillRect(80, 450, 160, 100);
    // Vertical path up
    this.courseGraphics.fillRect(130, 200, 80, 260);
    // Horizontal path right
    this.courseGraphics.fillRect(130, 200, 250, 80);
    // Another vertical
    this.courseGraphics.fillRect(300, 100, 80, 180);
    // Final horizontal to hole
    this.courseGraphics.fillRect(300, 100, 420, 80);

    // Water hazard - draw using stored coordinates
    this.courseGraphics.fillStyle(0x0066cc, 0.7);
    this.courseGraphics.fillCircle(this.waterHazard.x, this.waterHazard.y, this.waterHazard.radius);
    this.courseGraphics.fillStyle(0xffffff, 0.8);
    this.courseGraphics.fillCircle(this.waterHazard.x, this.waterHazard.y, 5);
  }

  update(time, delta) {
    // Handle input for P1
    if (!this.p1Finished) {
      this.handleGolfInput(1, this.p1Ball, delta);
    }

    // Handle input for P2
    if (!this.p2Finished) {
      this.handleGolfInput(2, this.p2Ball, delta);
    }

    // Check if balls reach hole
    this.checkHole();

    // Draw power bars and arrows
    this.drawUI();

    // Check water hazard
    this.checkWater();

    // Score based on distance to hole
    if (!this.p1Finished) {
      this.p1Score = Math.floor(1000 - Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y));
    }
    if (!this.p2Finished) {
      this.p2Score = Math.floor(1000 - Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y));
    }
  }

  handleGolfInput(player, ball, delta) {
    const isP1 = player === 1;
    const dirKeys = isP1 ? this.scene.keys : this.scene.cursors;
    const chargeKey = isP1 ? this.scene.keys.f : this.scene.keys.shift;
    const angleKey = isP1 ? 'p1Angle' : 'p2Angle';
    const powerKey = isP1 ? 'p1Power' : 'p2Power';
    const chargingKey = isP1 ? 'p1Charging' : 'p2Charging';
    const strokesKey = isP1 ? 'p1Strokes' : 'p2Strokes';

    // Rotate direction
    const rotSpeed = 2.5 * (delta / 1000);
    if (isP1) {
      if (this.scene.keys.a.isDown) this[angleKey] -= rotSpeed;
      if (this.scene.keys.d.isDown) this[angleKey] += rotSpeed;
      if (this.scene.keys.w.isDown) this[angleKey] -= rotSpeed * 0.5;
      if (this.scene.keys.s.isDown) this[angleKey] += rotSpeed * 0.5;
    } else {
      if (this.scene.cursors.left.isDown) this[angleKey] -= rotSpeed;
      if (this.scene.cursors.right.isDown) this[angleKey] += rotSpeed;
      if (this.scene.cursors.up.isDown) this[angleKey] -= rotSpeed * 0.5;
      if (this.scene.cursors.down.isDown) this[angleKey] += rotSpeed * 0.5;
    }

    // Only allow shot when ball is nearly still
    const isMoving = Math.abs(ball.body.velocity.x) > 15 || Math.abs(ball.body.velocity.y) > 15;

    if (!isMoving) {
      if (chargeKey.isDown) {
        this[powerKey] = Math.min(100, this[powerKey] + 1.5);
        this[chargingKey] = true;
      } else if (this[chargingKey]) {
        // Shoot
        const force = (this[powerKey] / 100) * 700;
        ball.body.setVelocity(Math.cos(this[angleKey]) * force, Math.sin(this[angleKey]) * force);
        this[strokesKey]++;
        this[powerKey] = 0;
        this[chargingKey] = false;
        this.scene.cameras.main.shake(80, 0.004);
      }
    }
  }

  drawUI() {
    this.powerBarGraphics.clear();
    this.arrowGraphics.clear();

    // P1 power bar and arrow
    if (!this.p1Finished) {
      const isMoving1 = Math.abs(this.p1Ball.body.velocity.x) > 15 || Math.abs(this.p1Ball.body.velocity.y) > 15;
      if (!isMoving1) {
        this.drawPowerBar(this.p1Ball.x, this.p1Ball.y, this.p1Power, 0x00e5ff);
        this.drawDirectionArrow(this.p1Ball.x, this.p1Ball.y, this.p1Angle, 0x00e5ff);
      }
    }

    // P2 power bar and arrow
    if (!this.p2Finished) {
      const isMoving2 = Math.abs(this.p2Ball.body.velocity.x) > 15 || Math.abs(this.p2Ball.body.velocity.y) > 15;
      if (!isMoving2) {
        this.drawPowerBar(this.p2Ball.x, this.p2Ball.y, this.p2Power, 0xff3d71);
        this.drawDirectionArrow(this.p2Ball.x, this.p2Ball.y, this.p2Angle, 0xff3d71);
      }
    }
  }

  drawPowerBar(x, y, power, color) {
    const barW = 50, barH = 8;
    this.powerBarGraphics.fillStyle(0x333333);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW, barH);
    this.powerBarGraphics.fillStyle(color);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW * (power / 100), barH);
    this.powerBarGraphics.lineStyle(1, 0xffffff, 0.8);
    this.powerBarGraphics.strokeRect(x - barW / 2, y - 40, barW, barH);
  }

  drawDirectionArrow(x, y, angle, color) {
    const len = 40;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    this.arrowGraphics.lineStyle(3, color, 0.9);
    this.arrowGraphics.lineBetween(x, y, ex, ey);
    const headLen = 10;
    const a1 = angle + 2.5, a2 = angle - 2.5;
    this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a1) * headLen, ey + Math.sin(a1) * headLen);
    this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a2) * headLen, ey + Math.sin(a2) * headLen);
  }

  checkHole() {
    const d1 = Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y);
    const d2 = Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y);

    if (d1 < this.hole.r && !this.p1Finished) {
      this.p1Finished = true;
      this.p1Score = 1000 + (100 - this.p1Strokes * 10);
      this.p1Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y, '¡HOYO P1!', '#00e5ff');
    }

    if (d2 < this.hole.r && !this.p2Finished) {
      this.p2Finished = true;
      this.p2Score = 1000 + (100 - this.p2Strokes * 10);
      this.p2Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y, '¡HOYO P2!', '#ff3d71');
    }
  }

  checkWater() {
    const hz = this.waterHazard;
    const d1 = Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, hz.x, hz.y);
    const d2 = Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, hz.x, hz.y);

    if (d1 < hz.radius && !this.p1Finished) {
      this.p1Ball.setPosition(120, 500);
      this.p1Ball.body.setVelocity(0, 0);
      this.p1Strokes += 2;
      this.scene.showFloatingText(hz.x, hz.y, '+2 PENALIDAD', '#ff2222');
    }

    if (d2 < hz.radius && !this.p2Finished) {
      this.p2Ball.setPosition(160, 500);
      this.p2Ball.body.setVelocity(0, 0);
      this.p2Strokes += 2;
      this.scene.showFloatingText(hz.x, hz.y, '+2 PENALIDAD', '#ff2222');
    }
  }

  cleanup() {
    this.powerBarGraphics.destroy();
    this.arrowGraphics.destroy();
    this.courseGraphics.destroy();
    this.holeGraphics.destroy();
  }

  get modeName() { return 'golf'; }
}

// =============================================================================
// F1 MODE
// =============================================================================
class F1Mode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_f1').setDisplaySize(800, 600).setAlpha(0.3).setDepth(-10);

    // Draw track
    this.trackGraphics = this.scene.add.graphics();
    this.drawTrack();

    // Track polygon for collision detection
    this.trackPoints = [
      { x: 150, y: 150 }, { x: 400, y: 80 }, { x: 650, y: 150 },
      { x: 700, y: 250 }, { x: 600, y: 300 }, { x: 680, y: 370 },
      { x: 650, y: 480 }, { x: 400, y: 530 }, { x: 150, y: 480 },
      { x: 100, y: 350 }, { x: 150, y: 250 }
    ];

    // Cars
    this.p1Car = this.scene.physics.add.image(180, 170, 'p1_f1');
    this.p2Car = this.scene.physics.add.image(180, 210, 'p2_f1');
    this.p1Car.setMaxVelocity(400, 400);
    this.p2Car.setMaxVelocity(400, 400);

    this.p1Car.customData = { speed: 0, angle: 0 };
    this.p2Car.customData = { speed: 0, angle: 0 };

    // Checkpoints
    this.checkpoints = [
      { x: 400, y: 95, r: 60, id: 'top' },
      { x: 690, y: 300, r: 60, id: 'right' },
      { x: 400, y: 525, r: 60, id: 'bottom' },
      { x: 110, y: 300, r: 60, id: 'left' }
    ];
    this.p1Checkpoints = new Set();
    this.p2Checkpoints = new Set();
    this.p1Laps = 0;
    this.p2Laps = 0;

    // Off-track penalty
    this.p1OffTrack = false;
    this.p2OffTrack = false;
    this.p1PenaltyTimer = 0;
    this.p2PenaltyTimer = 0;

    // Lap indicator
    this.lapText = this.scene.add.text(400, 560, 'P1 Vueltas: 0 | P2 Vueltas: 0', {
      fontSize: '16px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  drawTrack() {
    // Track outline
    this.trackGraphics.lineStyle(70, 0x333333, 1);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(150, 150);
    this.trackGraphics.lineTo(400, 80);
    this.trackGraphics.lineTo(650, 150);
    this.trackGraphics.lineTo(700, 250);
    this.trackGraphics.lineTo(600, 300);
    this.trackGraphics.lineTo(680, 370);
    this.trackGraphics.lineTo(650, 480);
    this.trackGraphics.lineTo(400, 530);
    this.trackGraphics.lineTo(150, 480);
    this.trackGraphics.lineTo(100, 350);
    this.trackGraphics.lineTo(150, 250);
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();

    // Track center line
    this.trackGraphics.lineStyle(2, 0xffffff, 0.5);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(150, 150);
    this.trackGraphics.lineTo(400, 80);
    this.trackGraphics.lineTo(650, 150);
    this.trackGraphics.lineTo(700, 250);
    this.trackGraphics.lineTo(600, 300);
    this.trackGraphics.lineTo(680, 370);
    this.trackGraphics.lineTo(650, 480);
    this.trackGraphics.lineTo(400, 530);
    this.trackGraphics.lineTo(150, 480);
    this.trackGraphics.lineTo(100, 350);
    this.trackGraphics.lineTo(150, 250);
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();

    // Start line
    this.trackGraphics.lineStyle(6, 0xffffff, 1);
    this.trackGraphics.lineBetween(150, 140, 150, 220);
  }

  update(time, delta) {
    // Update car physics
    this.updateCarPhysics(this.p1Car, this.scene.keys.a, this.scene.keys.d, delta, 'p1');
    this.updateCarPhysics(this.p2Car, this.scene.cursors.left, this.scene.cursors.right, delta, 'p2');

    // Check laps
    this.checkLaps(this.p1Car, 'p1');
    this.checkLaps(this.p2Car, 'p2');

    // Update lap display
    this.lapText.setText(`P1 Vueltas: ${this.p1Laps} | P2 Vueltas: ${this.p2Laps}`);

    // Scores based on laps
    this.p1Score = this.p1Laps * 100;
    this.p2Score = this.p2Laps * 100;
  }

  updateCarPhysics(car, leftKey, rightKey, delta, player) {
    const cd = car.customData;
    const isOffTrack = player === 'p1' ? this.p1OffTrack : this.p2OffTrack;

    // Auto accelerate
    const maxSpeed = isOffTrack ? 120 : 340;
    cd.speed = Math.min(maxSpeed, cd.speed + 180 * (delta / 1000));

    // Turn
    const turnRate = 2.2;
    if (leftKey.isDown) cd.angle -= turnRate * (delta / 1000);
    if (rightKey.isDown) cd.angle += turnRate * (delta / 1000);

    // Apply velocity
    car.body.setVelocity(
      Math.cos(cd.angle) * cd.speed,
      Math.sin(cd.angle) * cd.speed
    );

    // Rotate sprite
    car.setRotation(cd.angle + Math.PI / 2);

    // Off-track detection
    if (!this.isOnTrack(car.x, car.y)) {
      if (!this[player + 'OffTrack']) {
        this[player + 'OffTrack'] = true;
        this[player + 'PenaltyTimer'] = 3000;
        this.scene.cameras.main.shake(150, 0.007);
        car.setTint(0xff0000);
      }
    }

    // Penalty timer
    if (this[player + 'PenaltyTimer'] > 0) {
      this[player + 'PenaltyTimer'] -= delta;
      if (this[player + 'PenaltyTimer'] <= 0) {
        this[player + 'OffTrack'] = false;
        car.clearTint();
      }
    }

    // Keep cars in bounds
    car.x = Phaser.Math.Clamp(car.x, 30, 770);
    car.y = Phaser.Math.Clamp(car.y, 30, 570);
  }

  isOnTrack(x, y) {
    // Ray casting algorithm for point-in-polygon detection
    // Cast a ray from point (x,y) to infinity and count intersections with polygon edges
    // If odd number of intersections, point is inside; if even, point is outside
    // Reference: https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
    let inside = false;
    for (let i = 0, j = this.trackPoints.length - 1; i < this.trackPoints.length; j = i++) {
      const xi = this.trackPoints[i].x, yi = this.trackPoints[i].y;
      const xj = this.trackPoints[j].x, yj = this.trackPoints[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  checkLaps(car, player) {
    for (const cp of this.checkpoints) {
      const d = Phaser.Math.Distance.Between(car.x, car.y, cp.x, cp.y);
      if (d < cp.r && !this[player + 'Checkpoints'].has(cp.id)) {
        this[player + 'Checkpoints'].add(cp.id);
        if (this[player + 'Checkpoints'].size === this.checkpoints.length) {
          this[player + 'Laps']++;
          this[player + 'Checkpoints'].clear();
          this.scene.showFloatingText(car.x, car.y, '¡VUELTA!', player === 'p1' ? '#00e5ff' : '#ff3d71');
          this.scene.cameras.main.shake(100, 0.005);
        }
      }
    }
  }

  cleanup() {
    this.trackGraphics.destroy();
    this.lapText.destroy();
  }

  get modeName() { return 'f1'; }
}

// =============================================================================
// GAME SCENE - Main gameplay
// =============================================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.gameData = data;
  }

  create() {
    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D'),
      f: this.input.keyboard.addKey('F'),
      g: this.input.keyboard.addKey('G'),
      shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    };

    // Current mode
    const modeIndex = this.gameData.currentModeIndex;
    const modeName = this.gameData.modes[modeIndex];

    // Create appropriate game mode
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

    // Timer
    this.timeLeft = 60;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 59,
      callback: () => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.endMode();
        }
      }
    });

    // UI
    this.createUI();
  }

  createUI() {
    // Scoreboard background
    this.scoreboardBg = this.add.rectangle(400, 30, 440, 50, 0x000000, 0.6);
    this.scoreboardBg.setStrokeStyle(2, 0x333333);

    // Player 1 score
    this.p1ScoreText = this.add.text(230, 30, 'P1: 0', {
      fontSize: '24px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00e5ff'
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(400, 30, '60s', {
      fontSize: '28px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00'
    }).setOrigin(0.5);

    // Player 2 score
    this.p2ScoreText = this.add.text(570, 30, 'P2: 0', {
      fontSize: '24px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ff3d71'
    }).setOrigin(0.5);
  }

  update(time, delta) {
    // Update current mode
    this.currentMode.update(time, delta);

    // Update UI
    this.p1ScoreText.setText(`P1: ${this.currentMode.p1Score}`);
    this.p2ScoreText.setText(`P2: ${this.currentMode.p2Score}`);
    this.timerText.setText(`${this.timeLeft}s`);

    // Flash timer when low
    if (this.timeLeft <= 10) {
      this.timerText.setColor('#ff2222');
    }
  }

  showFloatingText(x, y, text, color) {
    const floatText = this.add.text(x, y, text, {
      fontSize: '32px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => floatText.destroy()
    });
  }

  endMode() {
    this.currentMode.cleanup();

    // Determine winner
    let modeWinner = 'EMPATE';
    if (this.currentMode.p1Score > this.currentMode.p2Score) modeWinner = 'P1';
    else if (this.currentMode.p2Score > this.currentMode.p1Score) modeWinner = 'P2';

    // Update global scores
    if (modeWinner === 'P1') this.gameData.globalScores.p1++;
    else if (modeWinner === 'P2') this.gameData.globalScores.p2++;

    this.gameData.modeWinners.push({
      mode: this.gameData.modeNames[this.gameData.currentModeIndex],
      winner: modeWinner,
      p1Score: this.currentMode.p1Score,
      p2Score: this.currentMode.p2Score
    });

    this.scene.start('ResultScene', {
      modeName: this.gameData.modeNames[this.gameData.currentModeIndex],
      modeWinner: modeWinner,
      modeScores: { p1: this.currentMode.p1Score, p2: this.currentMode.p2Score },
      globalScores: this.gameData.globalScores,
      modeNumber: this.gameData.currentModeIndex + 1,
      gameData: this.gameData
    });
  }
}

// =============================================================================
// RESULT SCENE - Mode result
// =============================================================================
class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.resultData = data;
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x050510);

    // Mode name
    this.add.text(400, 80, this.resultData.modeName, {
      fontSize: '28px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // Winner
    const winnerColor = this.resultData.modeWinner === 'P1' ? '#00e5ff' :
      this.resultData.modeWinner === 'P2' ? '#ff3d71' : '#ffeb00';
    const winnerText = this.resultData.modeWinner === 'EMPATE' ? '¡EMPATE!' :
      `¡${this.resultData.modeWinner} GANA!`;

    this.add.text(400, 180, winnerText, {
      fontSize: '52px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: winnerColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Mode scores
    this.add.text(250, 280, `P1: ${this.resultData.modeScores.p1}`, {
      fontSize: '36px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00e5ff'
    }).setOrigin(0.5);

    this.add.text(550, 280, `P2: ${this.resultData.modeScores.p2}`, {
      fontSize: '36px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ff3d71'
    }).setOrigin(0.5);

    // Global scores
    this.add.text(400, 380, 'PUNTUACIÓN GLOBAL', {
      fontSize: '20px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(250, 430, `P1: ${this.resultData.globalScores.p1}`, {
      fontSize: '32px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00e5ff'
    }).setOrigin(0.5);

    this.add.text(550, 430, `P2: ${this.resultData.globalScores.p2}`, {
      fontSize: '32px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ff3d71'
    }).setOrigin(0.5);

    // Continue prompt
    const continueText = this.add.text(400, 530, 'Presiona cualquier tecla para continuar', {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Wait for input
    this.input.keyboard.once('keydown', () => {
      this.nextMode();
    });
  }

  nextMode() {
    const gameData = this.resultData.gameData;
    gameData.currentModeIndex++;

    if (gameData.currentModeIndex >= 5) {
      // All modes complete
      this.scene.start('FinalScene', gameData);
    } else {
      // Next mode intro
      const introTexts = {
        sumo: {
          title: 'SUMO CON ZONA MÓVIL',
          line1: 'La zona se mueve. Quédate dentro y empuja a tu rival fuera.',
          line2: 'Cada segundo fuera de la zona pierdes puntos.'
        },
        pingpong: {
          title: 'PING PONG',
          line1: 'Solo puedes moverte arriba y abajo. Golpea la pelota',
          line2: 'para que no salga por tu lado. Cada golpe la acelera.'
        },
        golf: {
          title: 'GOLF — MISMO CURSO, DOS PELOTAS',
          line1: 'Mantén F/Shift para cargar fuerza. Suelta para golpear.',
          line2: 'Evita el agua. Llega al hoyo antes que tu rival.'
        },
        f1: {
          title: 'FÓRMULA 1 — CIRCUITO DE VELOCIDAD',
          line1: 'Gira para mantenerte en la pista. Si te sales,',
          line2: 'pierdes velocidad 3 segundos. ¡Más vueltas = más puntos!'
        }
      };

      const nextMode = gameData.modes[gameData.currentModeIndex];
      const texts = introTexts[nextMode];

      this.scene.start('ModeIntroScene', {
        mode: nextMode,
        title: texts.title,
        line1: texts.line1,
        line2: texts.line2,
        modeNumber: gameData.currentModeIndex + 1,
        gameData: gameData
      });
    }
  }
}

// =============================================================================
// FINAL SCENE - Game over
// =============================================================================
class FinalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalScene' });
  }

  init(data) {
    this.gameData = data;
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x050510);

    // Title
    this.add.text(400, 60, 'FIN DEL JUEGO', {
      fontSize: '40px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Determine overall winner
    let finalWinner = 'EMPATE';
    let winnerColor = '#ffeb00';
    if (this.gameData.globalScores.p1 > this.gameData.globalScores.p2) {
      finalWinner = 'JUGADOR 1';
      winnerColor = '#00e5ff';
    } else if (this.gameData.globalScores.p2 > this.gameData.globalScores.p1) {
      finalWinner = 'JUGADOR 2';
      winnerColor = '#ff3d71';
    }

    // Winner announcement
    const winnerText = finalWinner === 'EMPATE' ? '¡EMPATE TOTAL!' : `¡${finalWinner} GANA!`;
    this.add.text(400, 140, winnerText, {
      fontSize: '48px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: winnerColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Trophy emoji
    this.add.text(400, 200, '🏆', {
      fontSize: '60px'
    }).setOrigin(0.5);

    // Final scores
    this.add.text(200, 280, `P1: ${this.gameData.globalScores.p1}`, {
      fontSize: '40px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00e5ff'
    }).setOrigin(0.5);

    this.add.text(600, 280, `P2: ${this.gameData.globalScores.p2}`, {
      fontSize: '40px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ff3d71'
    }).setOrigin(0.5);

    // Mode breakdown
    this.add.text(400, 340, 'DESGLOSE POR MODO', {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    let yPos = 380;
    this.gameData.modeWinners.forEach((mode, index) => {
      const winColor = mode.winner === 'P1' ? '#00e5ff' :
        mode.winner === 'P2' ? '#ff3d71' : '#ffeb00';
      this.add.text(400, yPos, `${index + 1}. ${mode.mode}: ${mode.winner} (${mode.p1Score}-${mode.p2Score})`, {
        fontSize: '14px',
        fontFamily: 'Share Tech Mono, Courier New, monospace',
        color: winColor
      }).setOrigin(0.5);
      yPos += 25;
    });

    // Play again
    const playAgainText = this.add.text(400, 560, 'Presiona cualquier tecla para jugar de nuevo', {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: playAgainText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown', () => {
      this.scene.start('MenuScene');
    });
  }
}

// =============================================================================
// GAME CONFIGURATION
// =============================================================================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#050510',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, ModeIntroScene, GameScene, ResultScene, FinalScene]
};

// Start the game
const game = new Phaser.Game(config);
