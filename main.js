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
// MODE INTRO SCENE - Fast 3 second intro before each mode with skip option
// =============================================================================
class ModeIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeIntroScene' });
  }

  init(data) {
    this.modeData = data;
    this.countdown = 3;
    this.isTransitioning = false;
  }

  create() {
    // Fade-in background
    const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
    this.tweens.add({
      targets: bg,
      alpha: 0.9,
      duration: 200,
      ease: 'Power2'
    });

    // Sport icon with entrance animation
    const icons = { football: '⚽', sumo: '🥊', pingpong: '🏓', golf: '⛳', f1: '🏎️' };
    const icon = this.add.text(400, -50, icons[this.modeData.mode] || '🏆', {
      fontSize: '72px'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: icon,
      y: 130,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Mode title with slide-in
    const title = this.add.text(-300, 220, this.modeData.title, {
      fontSize: '36px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: title,
      x: 400,
      duration: 400,
      delay: 100,
      ease: 'Power3.easeOut'
    });

    // Description lines with fade-in
    const desc1 = this.add.text(400, 298, this.modeData.line1, {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff',
      wordWrap: { width: 600 },
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    const desc2 = this.add.text(400, 332, this.modeData.line2, {
      fontSize: '16px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#aaaaaa',
      wordWrap: { width: 600 },
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [desc1, desc2],
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Power2'
    });

    // Mode number
    this.add.text(400, 400, `MODO ${this.modeData.modeNumber} DE 5`, {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#555555'
    }).setOrigin(0.5);

    // Countdown number with pulse effect
    this.countdownText = this.add.text(400, 470, '3', {
      fontSize: '80px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);
    
    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: 200,
      ease: 'Back.easeOut'
    });

    // Progress bar with glow effect
    this.add.rectangle(400, 540, 500, 8, 0x222222).setOrigin(0.5);
    this.progressBar = this.add.rectangle(150, 540, 0, 8, 0x00ffcc).setOrigin(0, 0.5);
    this.tweens.add({
      targets: this.progressBar,
      width: 500,
      duration: 3000,
      ease: 'Linear'
    });

    // Skip hint with blink
    const skipHint = this.add.text(400, 575, 'PRESIONA ESPACIO PARA SALTAR', {
      fontSize: '12px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#666666'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: skipHint,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Skip on spacebar
    this.input.keyboard.once('keydown-SPACE', () => {
      this.startGame();
    });

    // Countdown timer (faster: 3 seconds)
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown--;
        this.countdownText.setText(this.countdown > 0 ? this.countdown.toString() : '¡GO!');
        
        // Pulse animation
        this.tweens.add({
          targets: this.countdownText,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });
        
        // Color change as countdown progresses
        if (this.countdown === 2) {
          this.countdownText.setColor('#ffaa00');
        } else if (this.countdown === 1) {
          this.countdownText.setColor('#ff6600');
        } else if (this.countdown === 0) {
          this.countdownText.setColor('#00ff88');
          this.time.delayedCall(200, () => this.startGame());
        }
      }
    });
  }

  startGame() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    // Quick fade out
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.time.delayedCall(150, () => {
      this.scene.start('GameScene', this.modeData.gameData);
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
// FOOTBALL MODE - Moving goals with improved physics
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
    
    // Add corner arcs
    g.lineStyle(2, 0xffffff, 0.4);
    g.beginPath();
    g.arc(60, 40, 20, 0, Math.PI/2);
    g.strokePath();
    g.beginPath();
    g.arc(740, 40, 20, Math.PI/2, Math.PI);
    g.strokePath();
    g.beginPath();
    g.arc(60, 560, 20, -Math.PI/2, 0);
    g.strokePath();
    g.beginPath();
    g.arc(740, 560, 20, Math.PI, -Math.PI/2);
    g.strokePath();

    // Ball with improved physics
    this.ball = this.scene.physics.add.image(400, 300, 'ball_football');
    this.ball.setBounce(0.85); // More responsive bounce
    this.ball.setMaxVelocity(700, 700); // Faster max speed
    this.ball.setCollideWorldBounds(true);
    this.ball.setDrag(30); // Less drag for longer rolls
    this.ball.setMass(0.8); // Lighter ball

    // Players with improved physics
    this.p1 = this.scene.physics.add.image(200, 300, 'p1_football');
    this.p2 = this.scene.physics.add.image(600, 300, 'p2_football');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.4); // Better bounce
    this.p2.setBounce(0.4);
    this.p1.body.setDrag(350); // Slightly less drag for snappier movement
    this.p2.body.setDrag(350);
    this.p1.setMass(1.2); // Heavier players
    this.p2.setMass(1.2);

    // Ball-player collision with kick mechanic
    this.scene.physics.add.collider(this.ball, this.p1, (ball, player) => this.onBallHit(ball, player, 1));
    this.scene.physics.add.collider(this.ball, this.p2, (ball, player) => this.onBallHit(ball, player, 2));
    this.scene.physics.add.collider(this.p1, this.p2, () => this.onPlayerCollision());

    // Goals
    this.goal1 = { x: 80, y: 300, width: 18, height: 100, speed: 100, dir: 1 }; // Slightly larger and faster
    this.goal2 = { x: 720, y: 300, width: 18, height: 100, speed: 100, dir: -1 };
    this.goalGraphics = this.scene.add.graphics();
    
    // Particle graphics for effects
    this.particleGraphics = this.scene.add.graphics();

    // Scored flag to prevent double scoring
    this.justScored = false;
    
    // Ball trail effect
    this.ballTrail = [];
  }

  onBallHit(ball, player, playerNum) {
    // Add kick force based on player velocity
    const kickMultiplier = 1.3;
    const playerVelX = player.body.velocity.x;
    const playerVelY = player.body.velocity.y;
    
    ball.body.velocity.x += playerVelX * kickMultiplier;
    ball.body.velocity.y += playerVelY * kickMultiplier;
    
    // Visual feedback
    this.scene.cameras.main.shake(50, 0.004);
    
    // Flash the ball
    ball.setTint(playerNum === 1 ? 0x00e5ff : 0xff3d71);
    this.scene.time.delayedCall(100, () => ball.clearTint());
    
    // Add impact particles
    this.createImpactParticles(ball.x, ball.y, playerNum === 1 ? 0x00e5ff : 0xff3d71);
  }
  
  onPlayerCollision() {
    this.scene.cameras.main.shake(80, 0.006);
  }
  
  createImpactParticles(x, y, color) {
    // Simple particle burst effect
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 4, color, 0.8);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.2,
        duration: 250,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  update(time, delta) {
    // Player 1 movement (WASD) with acceleration
    const speed = 300;
    const accel = 1200;
    
    if (this.scene.keys.w.isDown) this.p1.body.setAccelerationY(-accel);
    else if (this.scene.keys.s.isDown) this.p1.body.setAccelerationY(accel);
    else this.p1.body.setAccelerationY(0);
    
    if (this.scene.keys.a.isDown) this.p1.body.setAccelerationX(-accel);
    else if (this.scene.keys.d.isDown) this.p1.body.setAccelerationX(accel);
    else this.p1.body.setAccelerationX(0);
    
    // Clamp player 1 velocity
    this.p1.body.velocity.x = Phaser.Math.Clamp(this.p1.body.velocity.x, -speed, speed);
    this.p1.body.velocity.y = Phaser.Math.Clamp(this.p1.body.velocity.y, -speed, speed);

    // Player 2 movement (Arrows) with acceleration
    if (this.scene.cursors.up.isDown) this.p2.body.setAccelerationY(-accel);
    else if (this.scene.cursors.down.isDown) this.p2.body.setAccelerationY(accel);
    else this.p2.body.setAccelerationY(0);
    
    if (this.scene.cursors.left.isDown) this.p2.body.setAccelerationX(-accel);
    else if (this.scene.cursors.right.isDown) this.p2.body.setAccelerationX(accel);
    else this.p2.body.setAccelerationX(0);
    
    // Clamp player 2 velocity
    this.p2.body.velocity.x = Phaser.Math.Clamp(this.p2.body.velocity.x, -speed, speed);
    this.p2.body.velocity.y = Phaser.Math.Clamp(this.p2.body.velocity.y, -speed, speed);
    
    // Ball spin visual effect based on velocity
    const ballSpeed = Math.sqrt(this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2);
    this.ball.rotation += (ballSpeed / 500) * (delta / 16);

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
    
    // Enhanced screen shake and flash
    this.scene.cameras.main.shake(300, 0.015);
    this.scene.cameras.main.flash(200, player === 1 ? 0 : 255, player === 1 ? 229 : 61, player === 1 ? 255 : 113, true);
    
    this.scene.showFloatingText(this.ball.x, this.ball.y, '¡GOL!', player === 1 ? '#00e5ff' : '#ff3d71');
    
    // Goal celebration particles
    const goalX = player === 1 ? this.goal2.x : this.goal1.x;
    const goalY = player === 1 ? this.goal2.y : this.goal1.y;
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 80);
      const particle = this.scene.add.circle(goalX, goalY, Phaser.Math.Between(3, 8), player === 1 ? 0x00e5ff : 0xff3d71, 1);
      this.scene.tweens.add({
        targets: particle,
        x: goalX + Math.cos(angle) * dist,
        y: goalY + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Reset ball
    this.scene.time.delayedCall(1000, () => {
      this.ball.setPosition(400, 300);
      this.ball.body.setVelocity(0, 0);
      this.justScored = false;
    });
  }

  cleanup() {
    this.goalGraphics.destroy();
    if (this.particleGraphics) this.particleGraphics.destroy();
  }

  get modeName() { return 'football'; }
}

// =============================================================================
// SUMO MODE - Moving zone with improved physics
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
      speed: 70 // Slightly faster zone
    };
    this.zoneGraphics = this.scene.add.graphics();
    
    // Zone pulse effect timer
    this.zonePulse = 0;

    // Players with improved physics
    this.p1 = this.scene.physics.add.image(350, 300, 'p1_sumo');
    this.p2 = this.scene.physics.add.image(450, 300, 'p2_sumo');
    this.p1.setCollideWorldBounds(true);
    this.p2.setCollideWorldBounds(true);
    this.p1.setBounce(0.6); // More bounce
    this.p2.setBounce(0.6);
    this.p1.body.setDrag(180); // Less drag for more momentum
    this.p2.body.setDrag(180);
    this.p1.setMass(1.5); // Heavy sumo wrestlers
    this.p2.setMass(1.5);

    this.scene.physics.add.collider(this.p1, this.p2, () => this.onCollision());

    // Timers for scoring
    this.p1OutTimer = 0;
    this.p1InTimer = 0;
    this.p2OutTimer = 0;
    this.p2InTimer = 0;
    
    // Push cooldown
    this.p1PushCooldown = 0;
    this.p2PushCooldown = 0;

    // Initial scores
    this.p1Score = 10;
    this.p2Score = 10;
  }

  onCollision() {
    this.scene.cameras.main.shake(120, 0.008);
    
    // Collision particles
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
        onComplete: () => particle.destroy()
      });
    }
  }

  update(time, delta) {
    // Update cooldowns
    this.p1PushCooldown = Math.max(0, this.p1PushCooldown - delta);
    this.p2PushCooldown = Math.max(0, this.p2PushCooldown - delta);
    
    // Player movement with acceleration
    const accel = 1100;
    const maxSpeed = 280;
    
    if (this.scene.keys.w.isDown) this.p1.body.setAccelerationY(-accel);
    else if (this.scene.keys.s.isDown) this.p1.body.setAccelerationY(accel);
    else this.p1.body.setAccelerationY(0);
    
    if (this.scene.keys.a.isDown) this.p1.body.setAccelerationX(-accel);
    else if (this.scene.keys.d.isDown) this.p1.body.setAccelerationX(accel);
    else this.p1.body.setAccelerationX(0);

    if (this.scene.cursors.up.isDown) this.p2.body.setAccelerationY(-accel);
    else if (this.scene.cursors.down.isDown) this.p2.body.setAccelerationY(accel);
    else this.p2.body.setAccelerationY(0);
    
    if (this.scene.cursors.left.isDown) this.p2.body.setAccelerationX(-accel);
    else if (this.scene.cursors.right.isDown) this.p2.body.setAccelerationX(accel);
    else this.p2.body.setAccelerationX(0);
    
    // Clamp velocities
    this.p1.body.velocity.x = Phaser.Math.Clamp(this.p1.body.velocity.x, -maxSpeed, maxSpeed);
    this.p1.body.velocity.y = Phaser.Math.Clamp(this.p1.body.velocity.y, -maxSpeed, maxSpeed);
    this.p2.body.velocity.x = Phaser.Math.Clamp(this.p2.body.velocity.x, -maxSpeed, maxSpeed);
    this.p2.body.velocity.y = Phaser.Math.Clamp(this.p2.body.velocity.y, -maxSpeed, maxSpeed);

    // Push action with cooldown
    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.f) && this.p1PushCooldown <= 0) {
      this.doPush(this.p1, this.p2, 1);
      this.p1PushCooldown = 500; // 0.5 second cooldown
    }
    if (Phaser.Input.Keyboard.JustDown(this.scene.keys.shift) && this.p2PushCooldown <= 0) {
      this.doPush(this.p2, this.p1, 2);
      this.p2PushCooldown = 500;
    }

    this.updateZone(delta);
    this.updatePoints(delta);
  }

  doPush(attacker, defender, playerNum) {
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);
    if (dist < 90) { // Slightly larger range
      const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
      const force = 600; // Stronger push
      
      // Add attacker's momentum to the push
      const momentumBonus = Math.sqrt(attacker.body.velocity.x ** 2 + attacker.body.velocity.y ** 2) * 0.3;
      const totalForce = force + momentumBonus;
      
      defender.body.setVelocity(Math.cos(angle) * totalForce, Math.sin(angle) * totalForce);
      
      // Attacker recoil
      attacker.body.velocity.x -= Math.cos(angle) * 150;
      attacker.body.velocity.y -= Math.sin(angle) * 150;
      
      this.scene.cameras.main.shake(150, 0.01);
      
      // Visual feedback
      attacker.setTint(0xffff00);
      defender.setTint(0xff6600);
      this.scene.time.delayedCall(150, () => {
        attacker.clearTint();
        defender.clearTint();
      });
      
      // Push impact effect
      const impactX = (attacker.x + defender.x) / 2;
      const impactY = (attacker.y + defender.y) / 2;
      this.scene.showFloatingText(impactX, impactY - 20, '¡PUSH!', playerNum === 1 ? '#00e5ff' : '#ff3d71');
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

    // Oscillate radius with smoother wave
    this.zonePulse += delta * 0.002;
    this.zone.radius = 160 + Math.sin(this.zonePulse) * 35;

    // Draw zone with enhanced visuals
    this.zoneGraphics.clear();
    
    // Outer glow rings
    for (let i = 3; i > 0; i--) {
      const alpha = 0.1 - (i * 0.02);
      this.zoneGraphics.lineStyle(3, 0xff6600, alpha);
      this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius + i * 8);
    }
    
    // Main zone border
    this.zoneGraphics.lineStyle(4, 0xff6600, 0.9);
    this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius);
    
    // Inner fill with gradient effect
    this.zoneGraphics.fillStyle(0xff6600, 0.1);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius);
    this.zoneGraphics.fillStyle(0xff8800, 0.08);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius * 0.7);
    
    // Center indicator
    this.zoneGraphics.fillStyle(0xffaa00, 0.3);
    this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, 15);
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
// PING PONG MODE - Enhanced with better physics and effects
// =============================================================================
class PingPongMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_pingpong').setDisplaySize(800, 600).setAlpha(0.4).setDepth(-10);

    // Table lines with enhanced visuals
    const g = this.scene.add.graphics();
    g.lineStyle(3, 0xffffff, 0.8);
    g.strokeRect(80, 80, 640, 440);
    g.lineStyle(6, 0xffffff, 1);
    g.lineBetween(400, 75, 400, 525);
    
    // Add corner dots
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(80, 80, 5);
    g.fillCircle(720, 80, 5);
    g.fillCircle(80, 520, 5);
    g.fillCircle(720, 520, 5);

    // Ball with enhanced physics
    this.ball = this.scene.physics.add.image(400, 300, 'ball_pingpong');
    this.ball.setVelocity(250, Phaser.Math.Between(-120, 120)); // Faster start
    this.ball.setBounce(1, 1);
    this.ball.setMaxVelocity(1000, 700); // Higher max speeds
    this.ball.setCollideWorldBounds(false);
    
    // Ball trail
    this.ballTrailGraphics = this.scene.add.graphics();
    this.ballTrail = [];

    // Players (paddles) with smoother movement
    this.p1 = this.scene.physics.add.image(100, 300, 'p1_pingpong');
    this.p2 = this.scene.physics.add.image(700, 300, 'p2_pingpong');
    this.p1.setImmovable(true);
    this.p2.setImmovable(true);
    this.p1.body.allowGravity = false;
    this.p2.body.allowGravity = false;

    this.hitCount = 0;
    this.justScored = false;
    this.rallyCount = 0; // Track rally length
  }

  update(time, delta) {
    // Smoother vertical movement with acceleration
    const accel = 1800;
    const maxSpeed = 400;
    
    if (this.scene.keys.w.isDown) this.p1.body.setAccelerationY(-accel);
    else if (this.scene.keys.s.isDown) this.p1.body.setAccelerationY(accel);
    else {
      this.p1.body.setAccelerationY(0);
      this.p1.body.velocity.y *= 0.85; // Smooth deceleration
    }

    if (this.scene.cursors.up.isDown) this.p2.body.setAccelerationY(-accel);
    else if (this.scene.cursors.down.isDown) this.p2.body.setAccelerationY(accel);
    else {
      this.p2.body.setAccelerationY(0);
      this.p2.body.velocity.y *= 0.85;
    }
    
    // Clamp paddle velocities
    this.p1.body.velocity.y = Phaser.Math.Clamp(this.p1.body.velocity.y, -maxSpeed, maxSpeed);
    this.p2.body.velocity.y = Phaser.Math.Clamp(this.p2.body.velocity.y, -maxSpeed, maxSpeed);

    // Clamp player positions
    this.p1.y = Phaser.Math.Clamp(this.p1.y, 110, 490);
    this.p2.y = Phaser.Math.Clamp(this.p2.y, 110, 490);

    // Ball bouncing on top/bottom with effects
    if (this.ball.y < 85) {
      this.ball.body.velocity.y = Math.abs(this.ball.body.velocity.y);
      this.ball.y = 86;
      this.createBounceEffect(this.ball.x, 80);
    }
    if (this.ball.y > 515) {
      this.ball.body.velocity.y = -Math.abs(this.ball.body.velocity.y);
      this.ball.y = 514;
      this.createBounceEffect(this.ball.x, 520);
    }

    // Enhanced paddle collision with spin mechanics
    const hitRange = 35;
    const paddleHitZone = 45;
    
    if (Math.abs(this.ball.x - this.p1.x) < hitRange && Math.abs(this.ball.y - this.p1.y) < paddleHitZone) {
      if (this.ball.body.velocity.x < 0) {
        // Add spin based on paddle velocity
        const spin = this.p1.body.velocity.y * 0.5;
        const speedBoost = 35 + (this.rallyCount * 2); // Ball gets faster each rally hit
        this.ball.body.velocity.x = Math.abs(this.ball.body.velocity.x) + speedBoost;
        this.ball.body.velocity.y += spin + Phaser.Math.Between(-40, 40);
        this.hitCount++;
        this.rallyCount++;
        this.onBallHit(1);
      }
    }

    if (Math.abs(this.ball.x - this.p2.x) < hitRange && Math.abs(this.ball.y - this.p2.y) < paddleHitZone) {
      if (this.ball.body.velocity.x > 0) {
        const spin = this.p2.body.velocity.y * 0.5;
        const speedBoost = 35 + (this.rallyCount * 2);
        this.ball.body.velocity.x = -Math.abs(this.ball.body.velocity.x) - speedBoost;
        this.ball.body.velocity.y += spin + Phaser.Math.Between(-40, 40);
        this.hitCount++;
        this.rallyCount++;
        this.onBallHit(2);
      }
    }
    
    // Update ball trail
    this.updateBallTrail();

    // Scoring
    if (!this.justScored) {
      if (this.ball.x < 30) {
        this.scorePoint(2);
      }
      if (this.ball.x > 770) {
        this.scorePoint(1);
      }
    }
    
    // Ball spin visual
    const ballSpeed = Math.sqrt(this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2);
    this.ball.rotation += (ballSpeed / 800) * (delta / 16);
  }
  
  createBounceEffect(x, y) {
    // Wall bounce particles
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.add.circle(x + Phaser.Math.Between(-10, 10), y, 3, 0xff6600, 0.8);
      this.scene.tweens.add({
        targets: particle,
        y: y + (y < 300 ? 20 : -20),
        alpha: 0,
        scale: 0.2,
        duration: 200,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  updateBallTrail() {
    // Add current position to trail
    this.ballTrail.push({ x: this.ball.x, y: this.ball.y, alpha: 0.6 });
    
    // Keep trail length limited
    if (this.ballTrail.length > 8) {
      this.ballTrail.shift();
    }
    
    // Draw trail
    this.ballTrailGraphics.clear();
    for (let i = 0; i < this.ballTrail.length; i++) {
      const point = this.ballTrail[i];
      const alpha = (i / this.ballTrail.length) * 0.4;
      const size = 4 + (i / this.ballTrail.length) * 4;
      this.ballTrailGraphics.fillStyle(0xff6600, alpha);
      this.ballTrailGraphics.fillCircle(point.x, point.y, size);
    }
  }

  onBallHit(playerNum) {
    this.scene.cameras.main.shake(50, 0.004);
    const speed = Math.sqrt(this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2);
    const intensity = Math.min(speed / 900, 1);
    const r = Math.floor(255 * intensity);
    const b = Math.floor(255 * (1 - intensity));
    this.ball.setTint(Phaser.Display.Color.GetColor(r, 100, b));
    
    // Paddle flash effect
    const paddle = playerNum === 1 ? this.p1 : this.p2;
    paddle.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => paddle.clearTint());
    
    // Rally milestone announcements
    if (this.rallyCount === 5) {
      this.scene.showFloatingText(400, 250, '¡RALLY!', '#ffaa00');
    } else if (this.rallyCount === 10) {
      this.scene.showFloatingText(400, 250, '¡INCREÍBLE!', '#ff6600');
    } else if (this.rallyCount === 15) {
      this.scene.showFloatingText(400, 250, '¡ÉPICO!', '#ff0000');
    }
  }

  scorePoint(player) {
    this.justScored = true;
    if (player === 1) this.p1Score++;
    else this.p2Score++;

    // Bonus points for long rallies
    const bonusText = this.rallyCount >= 5 ? ` +${Math.floor(this.rallyCount / 5)} BONUS` : '';
    if (this.rallyCount >= 5) {
      if (player === 1) this.p1Score += Math.floor(this.rallyCount / 5);
      else this.p2Score += Math.floor(this.rallyCount / 5);
    }

    this.scene.showFloatingText(this.ball.x, this.ball.y, '+1' + bonusText, player === 1 ? '#00e5ff' : '#ff3d71');
    this.scene.cameras.main.shake(120, 0.008);
    this.scene.cameras.main.flash(150, player === 1 ? 0 : 255, player === 1 ? 229 : 61, player === 1 ? 255 : 113, true);
    
    this.rallyCount = 0; // Reset rally

    this.scene.time.delayedCall(1000, () => {
      this.resetBall();
      this.justScored = false;
    });
  }

  resetBall() {
    this.ball.setPosition(400, 300);
    const dir = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.ball.setVelocity(250 * dir, Phaser.Math.Between(-120, 120));
    this.ball.clearTint();
    this.hitCount = 0;
    this.rallyCount = 0;
    this.ballTrail = [];
  }

  cleanup() {
    if (this.ballTrailGraphics) this.ballTrailGraphics.destroy();
  }

  get modeName() { return 'pingpong'; }
}

// =============================================================================
// GOLF MODE - Enhanced with better physics and effects
// =============================================================================
class GolfMode extends GameMode {
  constructor(scene) {
    super(scene, null, null);
  }

  setup() {
    // Background
    this.bg = this.scene.add.image(400, 300, 'bg_golf').setDisplaySize(800, 600).setAlpha(0.4).setDepth(-10);

    // Water hazard definition (must be defined before drawCourse)
    this.waterHazard = { x: 250, y: 350, radius: 40 };
    
    // Sand trap
    this.sandTrap = { x: 450, y: 180, radius: 30 };

    // Draw course
    this.courseGraphics = this.scene.add.graphics();
    this.drawCourse();

    // Hole with enhanced visuals
    this.hole = { x: 680, y: 120, r: 20 };
    this.holeGraphics = this.scene.add.graphics();
    this.drawHole();
    
    // Ball trail graphics
    this.ballTrailGraphics = this.scene.add.graphics();
    this.p1Trail = [];
    this.p2Trail = [];

    // Players as golf balls with better physics
    this.p1Ball = this.scene.physics.add.image(120, 500, 'p1_golf');
    this.p2Ball = this.scene.physics.add.image(160, 500, 'p2_golf');
    this.p1Ball.setBounce(0.5).setDrag(100).setMaxVelocity(800, 800);
    this.p2Ball.setBounce(0.5).setDrag(100).setMaxVelocity(800, 800);
    this.p1Ball.setCollideWorldBounds(true);
    this.p2Ball.setCollideWorldBounds(true);
    
    // Ball-ball collision
    this.scene.physics.add.collider(this.p1Ball, this.p2Ball, () => this.onBallCollision());

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
    
    // Stroke display
    this.strokeText = this.scene.add.text(400, 570, 'P1: 0 golpes | P2: 0 golpes', {
      fontSize: '14px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // UI graphics
    this.powerBarGraphics = this.scene.add.graphics();
    this.arrowGraphics = this.scene.add.graphics();
  }
  
  onBallCollision() {
    this.scene.cameras.main.shake(60, 0.004);
    // Collision spark
    const midX = (this.p1Ball.x + this.p2Ball.x) / 2;
    const midY = (this.p1Ball.y + this.p2Ball.y) / 2;
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(midX, midY, 3, 0xffffff, 0.8);
      const angle = Math.random() * Math.PI * 2;
      this.scene.tweens.add({
        targets: particle,
        x: midX + Math.cos(angle) * 15,
        y: midY + Math.sin(angle) * 15,
        alpha: 0,
        duration: 200,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  drawHole() {
    // Hole shadow
    this.holeGraphics.fillStyle(0x000000, 0.3);
    this.holeGraphics.fillCircle(this.hole.x + 3, this.hole.y + 3, this.hole.r);
    
    // Hole
    this.holeGraphics.fillStyle(0x000000);
    this.holeGraphics.fillCircle(this.hole.x, this.hole.y, this.hole.r);
    
    // Hole rim
    this.holeGraphics.lineStyle(3, 0xffffff, 0.8);
    this.holeGraphics.strokeCircle(this.hole.x, this.hole.y, this.hole.r);
    this.holeGraphics.lineStyle(3, 0xff0000);
    this.holeGraphics.strokeCircle(this.hole.x, this.hole.y, this.hole.r + 5);

    // Flag pole
    this.holeGraphics.lineStyle(3, 0x8B4513);
    this.holeGraphics.lineBetween(this.hole.x, this.hole.y, this.hole.x, this.hole.y - 55);
    
    // Flag with waving effect
    this.holeGraphics.fillStyle(0xff0000);
    this.holeGraphics.fillTriangle(this.hole.x, this.hole.y - 55, this.hole.x + 30, this.hole.y - 42, this.hole.x, this.hole.y - 30);
    this.holeGraphics.lineStyle(2, 0xcc0000);
    this.holeGraphics.strokeTriangle(this.hole.x, this.hole.y - 55, this.hole.x + 30, this.hole.y - 42, this.hole.x, this.hole.y - 30);
  }

  drawCourse() {
    // Rough (darker green border)
    this.courseGraphics.fillStyle(0x1a3d1a, 0.5);
    this.courseGraphics.fillRect(60, 430, 200, 130);
    this.courseGraphics.fillRect(110, 180, 120, 290);
    this.courseGraphics.fillRect(110, 180, 290, 120);
    this.courseGraphics.fillRect(280, 80, 120, 220);
    this.courseGraphics.fillRect(280, 80, 460, 120);
    
    // Fairway (main path)
    this.courseGraphics.fillStyle(0x2d5a2d, 0.7);
    this.courseGraphics.fillRect(80, 450, 160, 100);
    this.courseGraphics.fillRect(130, 200, 80, 260);
    this.courseGraphics.fillRect(130, 200, 250, 80);
    this.courseGraphics.fillRect(300, 100, 80, 180);
    this.courseGraphics.fillRect(300, 100, 420, 80);
    
    // Green (putting area)
    this.courseGraphics.fillStyle(0x3d7a3d, 0.8);
    this.courseGraphics.fillCircle(this.hole.x, this.hole.y, 50);
    
    // Sand trap
    this.courseGraphics.fillStyle(0xd4b896, 0.8);
    this.courseGraphics.fillCircle(this.sandTrap.x, this.sandTrap.y, this.sandTrap.radius);
    this.courseGraphics.lineStyle(2, 0xc4a886, 0.6);
    this.courseGraphics.strokeCircle(this.sandTrap.x, this.sandTrap.y, this.sandTrap.radius);

    // Water hazard with animated ripple effect
    this.courseGraphics.fillStyle(0x0066cc, 0.7);
    this.courseGraphics.fillCircle(this.waterHazard.x, this.waterHazard.y, this.waterHazard.radius);
    this.courseGraphics.lineStyle(2, 0x0088ff, 0.5);
    this.courseGraphics.strokeCircle(this.waterHazard.x, this.waterHazard.y, this.waterHazard.radius * 0.7);
    this.courseGraphics.strokeCircle(this.waterHazard.x, this.waterHazard.y, this.waterHazard.radius * 0.4);
    this.courseGraphics.fillStyle(0x66aaff, 0.5);
    this.courseGraphics.fillCircle(this.waterHazard.x - 8, this.waterHazard.y - 8, 8);
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

    // Check hazards
    this.checkWater();
    this.checkSand(delta);
    
    // Update ball trails
    this.updateBallTrails();
    
    // Update stroke display
    this.strokeText.setText(`P1: ${this.p1Strokes} golpes | P2: ${this.p2Strokes} golpes`);

    // Score based on distance to hole
    if (!this.p1Finished) {
      this.p1Score = Math.floor(1000 - Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y));
    }
    if (!this.p2Finished) {
      this.p2Score = Math.floor(1000 - Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y));
    }
    
    // Ball spin effect
    const p1Speed = Math.sqrt(this.p1Ball.body.velocity.x ** 2 + this.p1Ball.body.velocity.y ** 2);
    const p2Speed = Math.sqrt(this.p2Ball.body.velocity.x ** 2 + this.p2Ball.body.velocity.y ** 2);
    this.p1Ball.rotation += (p1Speed / 500) * (delta / 16);
    this.p2Ball.rotation += (p2Speed / 500) * (delta / 16);
  }
  
  updateBallTrails() {
    const p1Speed = Math.sqrt(this.p1Ball.body.velocity.x ** 2 + this.p1Ball.body.velocity.y ** 2);
    const p2Speed = Math.sqrt(this.p2Ball.body.velocity.x ** 2 + this.p2Ball.body.velocity.y ** 2);
    
    if (p1Speed > 50 && !this.p1Finished) {
      this.p1Trail.push({ x: this.p1Ball.x, y: this.p1Ball.y });
      if (this.p1Trail.length > 10) this.p1Trail.shift();
    } else {
      this.p1Trail = [];
    }
    
    if (p2Speed > 50 && !this.p2Finished) {
      this.p2Trail.push({ x: this.p2Ball.x, y: this.p2Ball.y });
      if (this.p2Trail.length > 10) this.p2Trail.shift();
    } else {
      this.p2Trail = [];
    }
    
    // Draw trails
    this.ballTrailGraphics.clear();
    for (let i = 0; i < this.p1Trail.length; i++) {
      const alpha = (i / this.p1Trail.length) * 0.4;
      this.ballTrailGraphics.fillStyle(0x00e5ff, alpha);
      this.ballTrailGraphics.fillCircle(this.p1Trail[i].x, this.p1Trail[i].y, 4);
    }
    for (let i = 0; i < this.p2Trail.length; i++) {
      const alpha = (i / this.p2Trail.length) * 0.4;
      this.ballTrailGraphics.fillStyle(0xff3d71, alpha);
      this.ballTrailGraphics.fillCircle(this.p2Trail[i].x, this.p2Trail[i].y, 4);
    }
  }
  
  checkSand(delta) {
    const st = this.sandTrap;
    const d1 = Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, st.x, st.y);
    const d2 = Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, st.x, st.y);
    
    // Sand slows down the ball significantly
    if (d1 < st.radius && !this.p1Finished) {
      this.p1Ball.body.velocity.x *= 0.95;
      this.p1Ball.body.velocity.y *= 0.95;
    }
    if (d2 < st.radius && !this.p2Finished) {
      this.p2Ball.body.velocity.x *= 0.95;
      this.p2Ball.body.velocity.y *= 0.95;
    }
  }

  handleGolfInput(player, ball, delta) {
    const isP1 = player === 1;
    const chargeKey = isP1 ? this.scene.keys.f : this.scene.keys.shift;
    const angleKey = isP1 ? 'p1Angle' : 'p2Angle';
    const powerKey = isP1 ? 'p1Power' : 'p2Power';
    const chargingKey = isP1 ? 'p1Charging' : 'p2Charging';
    const strokesKey = isP1 ? 'p1Strokes' : 'p2Strokes';

    // Rotate direction with smoother control
    const rotSpeed = 2.8 * (delta / 1000);
    if (isP1) {
      if (this.scene.keys.a.isDown) this[angleKey] -= rotSpeed;
      if (this.scene.keys.d.isDown) this[angleKey] += rotSpeed;
      if (this.scene.keys.w.isDown) this[angleKey] -= rotSpeed * 0.4;
      if (this.scene.keys.s.isDown) this[angleKey] += rotSpeed * 0.4;
    } else {
      if (this.scene.cursors.left.isDown) this[angleKey] -= rotSpeed;
      if (this.scene.cursors.right.isDown) this[angleKey] += rotSpeed;
      if (this.scene.cursors.up.isDown) this[angleKey] -= rotSpeed * 0.4;
      if (this.scene.cursors.down.isDown) this[angleKey] += rotSpeed * 0.4;
    }

    // Only allow shot when ball is nearly still
    const isMoving = Math.abs(ball.body.velocity.x) > 12 || Math.abs(ball.body.velocity.y) > 12;

    if (!isMoving) {
      if (chargeKey.isDown) {
        // Power charges with acceleration
        const chargeSpeed = 1.5 + (this[powerKey] / 100) * 0.5;
        this[powerKey] = Math.min(100, this[powerKey] + chargeSpeed);
        this[chargingKey] = true;
        
        // Charging visual feedback
        ball.setScale(1 + (this[powerKey] / 100) * 0.15);
      } else if (this[chargingKey]) {
        // Shoot with power curve
        const powerCurve = Math.pow(this[powerKey] / 100, 0.9); // Slight curve for better feel
        const force = powerCurve * 750;
        ball.body.setVelocity(Math.cos(this[angleKey]) * force, Math.sin(this[angleKey]) * force);
        this[strokesKey]++;
        
        // Reset
        this[powerKey] = 0;
        this[chargingKey] = false;
        ball.setScale(1);
        
        // Shot feedback
        this.scene.cameras.main.shake(60 + force / 15, 0.003 + force / 100000);
        
        // Shot particles
        for (let i = 0; i < 5; i++) {
          const particle = this.scene.add.circle(ball.x, ball.y, 3, 0x2d5a2d, 0.8);
          const angle = this[angleKey] + Math.PI + Phaser.Math.Between(-30, 30) * Math.PI / 180;
          this.scene.tweens.add({
            targets: particle,
            x: ball.x + Math.cos(angle) * 25,
            y: ball.y + Math.sin(angle) * 25,
            alpha: 0,
            duration: 300,
            onComplete: () => particle.destroy()
          });
        }
      }
    }
  }

  drawUI() {
    this.powerBarGraphics.clear();
    this.arrowGraphics.clear();

    // P1 power bar and arrow
    if (!this.p1Finished) {
      const isMoving1 = Math.abs(this.p1Ball.body.velocity.x) > 12 || Math.abs(this.p1Ball.body.velocity.y) > 12;
      if (!isMoving1) {
        this.drawPowerBar(this.p1Ball.x, this.p1Ball.y, this.p1Power, 0x00e5ff);
        this.drawDirectionArrow(this.p1Ball.x, this.p1Ball.y, this.p1Angle, 0x00e5ff, this.p1Power);
      }
    }

    // P2 power bar and arrow
    if (!this.p2Finished) {
      const isMoving2 = Math.abs(this.p2Ball.body.velocity.x) > 12 || Math.abs(this.p2Ball.body.velocity.y) > 12;
      if (!isMoving2) {
        this.drawPowerBar(this.p2Ball.x, this.p2Ball.y, this.p2Power, 0xff3d71);
        this.drawDirectionArrow(this.p2Ball.x, this.p2Ball.y, this.p2Angle, 0xff3d71, this.p2Power);
      }
    }
  }

  drawPowerBar(x, y, power, color) {
    const barW = 50, barH = 8;
    // Background
    this.powerBarGraphics.fillStyle(0x222222, 0.8);
    this.powerBarGraphics.fillRect(x - barW / 2 - 2, y - 42, barW + 4, barH + 4);
    // Empty bar
    this.powerBarGraphics.fillStyle(0x333333);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW, barH);
    // Filled bar with gradient effect
    const fillColor = power > 80 ? 0xff4444 : (power > 50 ? 0xffaa00 : color);
    this.powerBarGraphics.fillStyle(fillColor);
    this.powerBarGraphics.fillRect(x - barW / 2, y - 40, barW * (power / 100), barH);
    // Border
    this.powerBarGraphics.lineStyle(1, 0xffffff, 0.8);
    this.powerBarGraphics.strokeRect(x - barW / 2, y - 40, barW, barH);
  }

  drawDirectionArrow(x, y, angle, color, power) {
    // Arrow length based on power
    const baseLen = 35;
    const len = baseLen + (power / 100) * 25;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    
    // Arrow line with glow
    this.arrowGraphics.lineStyle(5, color, 0.3);
    this.arrowGraphics.lineBetween(x, y, ex, ey);
    this.arrowGraphics.lineStyle(3, color, 0.9);
    this.arrowGraphics.lineBetween(x, y, ex, ey);
    
    // Arrow head
    const headLen = 12;
    const a1 = angle + 2.6, a2 = angle - 2.6;
    this.arrowGraphics.lineStyle(3, color, 0.9);
    this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a1) * headLen, ey + Math.sin(a1) * headLen);
    this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a2) * headLen, ey + Math.sin(a2) * headLen);
  }

  checkHole() {
    const d1 = Phaser.Math.Distance.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y);
    const d2 = Phaser.Math.Distance.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y);
    
    // Gravity effect near hole
    if (d1 < 40 && d1 > this.hole.r && !this.p1Finished) {
      const pullForce = 80 * (1 - d1 / 40);
      const angle = Phaser.Math.Angle.Between(this.p1Ball.x, this.p1Ball.y, this.hole.x, this.hole.y);
      this.p1Ball.body.velocity.x += Math.cos(angle) * pullForce * 0.016;
      this.p1Ball.body.velocity.y += Math.sin(angle) * pullForce * 0.016;
    }
    if (d2 < 40 && d2 > this.hole.r && !this.p2Finished) {
      const pullForce = 80 * (1 - d2 / 40);
      const angle = Phaser.Math.Angle.Between(this.p2Ball.x, this.p2Ball.y, this.hole.x, this.hole.y);
      this.p2Ball.body.velocity.x += Math.cos(angle) * pullForce * 0.016;
      this.p2Ball.body.velocity.y += Math.sin(angle) * pullForce * 0.016;
    }

    if (d1 < this.hole.r && !this.p1Finished) {
      this.p1Finished = true;
      this.p1Score = 1000 + (100 - this.p1Strokes * 10);
      this.p1Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y - 20, '¡HOYO P1!', '#00e5ff');
      this.scene.cameras.main.shake(150, 0.01);
      this.createHoleInEffect(0x00e5ff);
    }

    if (d2 < this.hole.r && !this.p2Finished) {
      this.p2Finished = true;
      this.p2Score = 1000 + (100 - this.p2Strokes * 10);
      this.p2Ball.setVisible(false);
      this.scene.showFloatingText(this.hole.x, this.hole.y - 20, '¡HOYO P2!', '#ff3d71');
      this.scene.cameras.main.shake(150, 0.01);
      this.createHoleInEffect(0xff3d71);
    }
  }
  
  createHoleInEffect(color) {
    // Celebration particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.circle(this.hole.x, this.hole.y, 6, color, 1);
      this.scene.tweens.add({
        targets: particle,
        x: this.hole.x + Math.cos(angle) * 60,
        y: this.hole.y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
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
      this.scene.cameras.main.shake(100, 0.008);
      this.createSplashEffect(hz.x, hz.y);
    }

    if (d2 < hz.radius && !this.p2Finished) {
      this.p2Ball.setPosition(160, 500);
      this.p2Ball.body.setVelocity(0, 0);
      this.p2Strokes += 2;
      this.scene.showFloatingText(hz.x, hz.y, '+2 PENALIDAD', '#ff2222');
      this.scene.cameras.main.shake(100, 0.008);
      this.createSplashEffect(hz.x, hz.y);
    }
  }
  
  createSplashEffect(x, y) {
    // Water splash particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 5, 0x66aaff, 0.9);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30 - 20,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  cleanup() {
    this.powerBarGraphics.destroy();
    this.arrowGraphics.destroy();
    this.courseGraphics.destroy();
    this.holeGraphics.destroy();
    this.strokeText.destroy();
    if (this.ballTrailGraphics) this.ballTrailGraphics.destroy();
  }

  get modeName() { return 'golf'; }
}

// =============================================================================
// F1 MODE - Enhanced racing with better physics and effects
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
    
    // Car trails graphics
    this.trailGraphics = this.scene.add.graphics();
    this.p1Trail = [];
    this.p2Trail = [];

    // Cars with enhanced physics
    this.p1Car = this.scene.physics.add.image(180, 170, 'p1_f1');
    this.p2Car = this.scene.physics.add.image(180, 210, 'p2_f1');
    this.p1Car.setMaxVelocity(500, 500); // Higher max velocity
    this.p2Car.setMaxVelocity(500, 500);

    this.p1Car.customData = { speed: 0, angle: 0, driftAngle: 0 };
    this.p2Car.customData = { speed: 0, angle: 0, driftAngle: 0 };

    // Checkpoints
    this.checkpoints = [
      { x: 400, y: 95, r: 65, id: 'top' },
      { x: 690, y: 300, r: 65, id: 'right' },
      { x: 400, y: 525, r: 65, id: 'bottom' },
      { x: 110, y: 300, r: 65, id: 'left' }
    ];
    this.p1Checkpoints = new Set();
    this.p2Checkpoints = new Set();
    this.p1Laps = 0;
    this.p2Laps = 0;
    this.p1BestLap = Infinity;
    this.p2BestLap = Infinity;
    this.p1LapStartTime = 0;
    this.p2LapStartTime = 0;

    // Off-track penalty
    this.p1OffTrack = false;
    this.p2OffTrack = false;
    this.p1PenaltyTimer = 0;
    this.p2PenaltyTimer = 0;
    
    // Boost system
    this.p1Boost = 0;
    this.p2Boost = 0;
    this.p1BoostActive = false;
    this.p2BoostActive = false;

    // Lap indicator with enhanced styling
    this.lapText = this.scene.add.text(400, 560, 'P1: 0 vueltas | P2: 0 vueltas', {
      fontSize: '16px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Speed indicators
    this.speedText = this.scene.add.text(400, 580, '', {
      fontSize: '12px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#888888'
    }).setOrigin(0.5);
  }

  drawTrack() {
    // Track outline with better visuals
    this.trackGraphics.lineStyle(75, 0x333333, 1);
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
    
    // Track edge lines (curbs)
    this.trackGraphics.lineStyle(4, 0xff0000, 0.6);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(150, 150);
    this.trackGraphics.lineTo(400, 80);
    this.trackGraphics.lineTo(650, 150);
    this.trackGraphics.strokePath();

    // Track center line (dashed effect)
    this.trackGraphics.lineStyle(2, 0xffffff, 0.4);
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

    // Start/finish line with checkered pattern
    this.trackGraphics.lineStyle(8, 0xffffff, 1);
    this.trackGraphics.lineBetween(150, 135, 150, 225);
    this.trackGraphics.lineStyle(4, 0x000000, 1);
    this.trackGraphics.lineBetween(150, 145, 150, 155);
    this.trackGraphics.lineBetween(150, 165, 150, 175);
    this.trackGraphics.lineBetween(150, 185, 150, 195);
    this.trackGraphics.lineBetween(150, 205, 150, 215);
  }

  update(time, delta) {
    // Update car physics
    this.updateCarPhysics(this.p1Car, this.scene.keys.a, this.scene.keys.d, this.scene.keys.w, delta, 'p1');
    this.updateCarPhysics(this.p2Car, this.scene.cursors.left, this.scene.cursors.right, this.scene.cursors.up, delta, 'p2');
    
    // Update car trails
    this.updateTrails();

    // Check laps
    this.checkLaps(this.p1Car, 'p1', time);
    this.checkLaps(this.p2Car, 'p2', time);

    // Update lap display
    this.lapText.setText(`P1: ${this.p1Laps} vueltas | P2: ${this.p2Laps} vueltas`);
    
    // Speed display
    const p1Speed = Math.round(this.p1Car.customData.speed);
    const p2Speed = Math.round(this.p2Car.customData.speed);
    this.speedText.setText(`P1: ${p1Speed} km/h | P2: ${p2Speed} km/h`);

    // Scores based on laps
    this.p1Score = this.p1Laps * 100;
    this.p2Score = this.p2Laps * 100;
  }
  
  updateTrails() {
    // Add trail points
    if (this.p1Car.customData.speed > 200) {
      this.p1Trail.push({ x: this.p1Car.x, y: this.p1Car.y });
      if (this.p1Trail.length > 15) this.p1Trail.shift();
    }
    if (this.p2Car.customData.speed > 200) {
      this.p2Trail.push({ x: this.p2Car.x, y: this.p2Car.y });
      if (this.p2Trail.length > 15) this.p2Trail.shift();
    }
    
    // Draw trails
    this.trailGraphics.clear();
    
    // P1 trail (cyan)
    for (let i = 0; i < this.p1Trail.length; i++) {
      const alpha = (i / this.p1Trail.length) * 0.5;
      const size = 2 + (i / this.p1Trail.length) * 3;
      this.trailGraphics.fillStyle(0x00e5ff, alpha);
      this.trailGraphics.fillCircle(this.p1Trail[i].x, this.p1Trail[i].y, size);
    }
    
    // P2 trail (coral)
    for (let i = 0; i < this.p2Trail.length; i++) {
      const alpha = (i / this.p2Trail.length) * 0.5;
      const size = 2 + (i / this.p2Trail.length) * 3;
      this.trailGraphics.fillStyle(0xff3d71, alpha);
      this.trailGraphics.fillCircle(this.p2Trail[i].x, this.p2Trail[i].y, size);
    }
  }

  updateCarPhysics(car, leftKey, rightKey, boostKey, delta, player) {
    const cd = car.customData;
    const isOffTrack = this[player + 'OffTrack'];
    const isBoostActive = this[player + 'BoostActive'];

    // Speed calculation with acceleration curve
    const baseMaxSpeed = isOffTrack ? 100 : 380;
    const boostMaxSpeed = 480;
    const maxSpeed = isBoostActive ? boostMaxSpeed : baseMaxSpeed;
    const acceleration = isOffTrack ? 100 : 220;
    const deceleration = isOffTrack ? 50 : 30;
    
    // Auto accelerate with smooth curve
    if (cd.speed < maxSpeed) {
      cd.speed += acceleration * (delta / 1000);
    } else {
      cd.speed -= deceleration * (delta / 1000);
    }
    cd.speed = Math.max(0, cd.speed);
    
    // Boost mechanic
    if (!isOffTrack) {
      this[player + 'Boost'] = Math.min(100, this[player + 'Boost'] + delta * 0.02);
    }
    
    if (boostKey && boostKey.isDown && this[player + 'Boost'] > 20 && !isOffTrack) {
      this[player + 'BoostActive'] = true;
      this[player + 'Boost'] -= delta * 0.05;
      car.setTint(player === 'p1' ? 0x00ffff : 0xff6688);
    } else {
      this[player + 'BoostActive'] = false;
      if (!isOffTrack) car.clearTint();
    }

    // Turn rate depends on speed (slower at high speed for more realism)
    const speedFactor = 1 - (cd.speed / 500) * 0.3;
    const turnRate = 2.8 * speedFactor;
    
    if (leftKey.isDown) {
      cd.angle -= turnRate * (delta / 1000);
      cd.driftAngle = Math.min(0.1, cd.driftAngle + 0.01);
    } else if (rightKey.isDown) {
      cd.angle += turnRate * (delta / 1000);
      cd.driftAngle = Math.min(0.1, cd.driftAngle + 0.01);
    } else {
      cd.driftAngle *= 0.9; // Smooth out drift
    }

    // Apply velocity with slight drift
    const effectiveAngle = cd.angle + cd.driftAngle * (leftKey.isDown ? 1 : -1);
    car.body.setVelocity(
      Math.cos(effectiveAngle) * cd.speed,
      Math.sin(effectiveAngle) * cd.speed
    );

    // Rotate sprite
    car.setRotation(cd.angle + Math.PI / 2);

    // Off-track detection
    if (!this.isOnTrack(car.x, car.y)) {
      if (!this[player + 'OffTrack']) {
        this[player + 'OffTrack'] = true;
        this[player + 'PenaltyTimer'] = 2500; // Slightly shorter penalty
        this.scene.cameras.main.shake(120, 0.008);
        car.setTint(0xff0000);
        this.scene.showFloatingText(car.x, car.y - 30, '¡FUERA!', '#ff0000');
        
        // Spawn dirt particles
        for (let i = 0; i < 5; i++) {
          const particle = this.scene.add.circle(car.x + Phaser.Math.Between(-15, 15), car.y + Phaser.Math.Between(-15, 15), 4, 0x8B4513, 0.8);
          this.scene.tweens.add({
            targets: particle,
            y: particle.y + 20,
            alpha: 0,
            duration: 400,
            onComplete: () => particle.destroy()
          });
        }
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

  checkLaps(car, player, time) {
    for (const cp of this.checkpoints) {
      const d = Phaser.Math.Distance.Between(car.x, car.y, cp.x, cp.y);
      if (d < cp.r && !this[player + 'Checkpoints'].has(cp.id)) {
        this[player + 'Checkpoints'].add(cp.id);
        
        // Checkpoint feedback
        const checkpointNum = this[player + 'Checkpoints'].size;
        if (checkpointNum < this.checkpoints.length) {
          car.setTint(player === 'p1' ? 0x00ff88 : 0xff88aa);
          this.scene.time.delayedCall(150, () => {
            if (!this[player + 'OffTrack'] && !this[player + 'BoostActive']) car.clearTint();
          });
        }
        
        if (this[player + 'Checkpoints'].size === this.checkpoints.length) {
          this[player + 'Laps']++;
          this[player + 'Checkpoints'].clear();
          
          // Calculate lap time
          const lapTime = time - this[player + 'LapStartTime'];
          const isBestLap = lapTime < this[player + 'BestLap'];
          if (isBestLap) {
            this[player + 'BestLap'] = lapTime;
          }
          this[player + 'LapStartTime'] = time;
          
          // Enhanced lap celebration
          const lapText = isBestLap ? '¡MEJOR VUELTA!' : '¡VUELTA!';
          this.scene.showFloatingText(car.x, car.y - 20, lapText, player === 'p1' ? '#00e5ff' : '#ff3d71');
          this.scene.cameras.main.shake(150, 0.01);
          this.scene.cameras.main.flash(100, player === 'p1' ? 0 : 255, player === 'p1' ? 229 : 61, player === 'p1' ? 255 : 113, true);
          
          // Lap celebration particles
          for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const particle = this.scene.add.circle(car.x, car.y, 5, player === 'p1' ? 0x00e5ff : 0xff3d71, 1);
            this.scene.tweens.add({
              targets: particle,
              x: car.x + Math.cos(angle) * 50,
              y: car.y + Math.sin(angle) * 50,
              alpha: 0,
              scale: 0.2,
              duration: 500,
              onComplete: () => particle.destroy()
            });
          }
        }
      }
    }
  }

  cleanup() {
    this.trackGraphics.destroy();
    this.lapText.destroy();
    this.speedText.destroy();
    if (this.trailGraphics) this.trailGraphics.destroy();
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
