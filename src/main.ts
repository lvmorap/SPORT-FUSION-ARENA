import * as THREE from 'three';
import { Engine } from './core/Engine';
import { Overlay } from './ui/Overlay';
import { GameMode, FootballMode, SumoMode, PingPongMode, F1Mode, BillarMode } from './modes';
import { GameData, GameState, MODE_CONFIGS, ModeConfig, ModeName } from './types';

// --- State ---
const engine = new Engine();
const overlay = new Overlay();

let state: GameState = 'menu';
let currentMode: GameMode | null = null;
let modeTimer = 0;
let countdownValue = 3;
let countdownAccum = 0;

const gameData: GameData = {
  currentModeIndex: 0,
  modes: ['football', 'sumo', 'pingpong', 'f1', 'billar'],
  results: [],
  winsP1: 0,
  winsP2: 0,
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getConfigByName(name: ModeName): ModeConfig {
  const config = MODE_CONFIGS.find((c) => c.name === name);
  if (!config) {
    throw new Error(`Config not found for mode: ${name}`);
  }
  return config;
}

// --- Menu background scene ---
let menuObjects: THREE.Object3D[] = [];

function createMenuScene(): void {
  engine.clearScene();
  engine.scene.background = new THREE.Color(0x050510);
  engine.scene.fog = new THREE.FogExp2(0x050510, 0.02);

  engine.camera.position.set(0, 12, 20);
  engine.camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.2);
  engine.scene.add(ambient);
  menuObjects.push(ambient);

  const p1Light = new THREE.PointLight(0x00e5ff, 2, 40);
  p1Light.position.set(-8, 8, 0);
  engine.scene.add(p1Light);
  menuObjects.push(p1Light);

  const p2Light = new THREE.PointLight(0xff3d71, 2, 40);
  p2Light.position.set(8, 8, 0);
  engine.scene.add(p2Light);
  menuObjects.push(p2Light);

  const scoreLight = new THREE.PointLight(0xffeb00, 1.5, 30);
  scoreLight.position.set(0, 10, 5);
  engine.scene.add(scoreLight);
  menuObjects.push(scoreLight);

  // Floating sports-themed shapes
  const shapes = [
    { geo: new THREE.SphereGeometry(1, 32, 32), color: 0xffffff, pos: [-5, 4, -3] },
    { geo: new THREE.BoxGeometry(1.5, 1.5, 1.5), color: 0x00e5ff, pos: [4, 6, -5] },
    { geo: new THREE.TorusGeometry(1, 0.3, 16, 32), color: 0xff3d71, pos: [0, 3, -2] },
    { geo: new THREE.ConeGeometry(0.8, 2, 16), color: 0xffeb00, pos: [-3, 7, -6] },
    { geo: new THREE.DodecahedronGeometry(0.9), color: 0x00ff88, pos: [6, 5, -4] },
    { geo: new THREE.OctahedronGeometry(0.8), color: 0xff8800, pos: [-6, 5, -7] },
    { geo: new THREE.IcosahedronGeometry(0.7), color: 0x8866ff, pos: [2, 8, -8] },
  ];

  for (const s of shapes) {
    const mat = new THREE.MeshStandardMaterial({
      color: s.color,
      roughness: 0.3,
      metalness: 0.2,
      emissive: s.color,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(s.geo, mat);
    mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
    mesh.castShadow = true;
    engine.scene.add(mesh);
    menuObjects.push(mesh);
  }

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  engine.scene.add(ground);
  menuObjects.push(ground);
}

function animateMenuScene(delta: number): void {
  const time = performance.now() * 0.001;
  // Rotate floating shapes (skip lights and ground: first 4 are lights, last is ground)
  for (let i = 4; i < menuObjects.length - 1; i++) {
    const obj = menuObjects[i];
    obj.rotation.x += delta * 0.3;
    obj.rotation.y += delta * 0.5;
    obj.position.y += Math.sin(time + i) * delta * 0.3;
  }
}

function clearMenuScene(): void {
  menuObjects = [];
}

// --- Mode factory ---
function createMode(name: ModeName): GameMode {
  switch (name) {
    case 'football': return new FootballMode(engine);
    case 'sumo': return new SumoMode(engine);
    case 'pingpong': return new PingPongMode(engine);
    case 'f1': return new F1Mode(engine);
    case 'billar': return new BillarMode(engine);
  }
}

// --- State transitions ---
function goToMenu(): void {
  state = 'menu';
  gameData.currentModeIndex = 0;
  gameData.modes = shuffleArray(['football', 'sumo', 'pingpong', 'f1', 'billar']);
  gameData.results = [];
  gameData.winsP1 = 0;
  gameData.winsP2 = 0;
  currentMode = null;

  createMenuScene();
  overlay.showMenu(() => {
    goToIntro();
  });
}

function goToIntro(): void {
  state = 'intro';
  clearMenuScene();
  engine.clearScene();

  const config = getConfigByName(gameData.modes[gameData.currentModeIndex]);
  engine.scene.background = new THREE.Color(config.bgColor);
  engine.scene.fog = new THREE.FogExp2(config.bgColor, 0.015);

  // Set up the mode's 3D scene during intro
  currentMode = createMode(config.name);
  currentMode.setup();

  overlay.showModeIntro(config, gameData.currentModeIndex, gameData.modes.length, () => {
    goToCountdown();
  });
}

function goToCountdown(): void {
  state = 'countdown';
  countdownValue = 3;
  countdownAccum = 0;
  overlay.showCountdown(countdownValue);
}

function goToPlaying(): void {
  state = 'playing';
  const config = getConfigByName(gameData.modes[gameData.currentModeIndex]);
  modeTimer = config.duration;

  const isF1 = gameData.modes[gameData.currentModeIndex] === 'f1';
  if (isF1) {
    overlay.showF1HUD(config.displayName);
  } else {
    overlay.showHUD(config.displayName);
  }

  if (currentMode) {
    currentMode.start();
  }
}

function goToResult(): void {
  state = 'result';

  if (currentMode) {
    currentMode.stop();

    const config = getConfigByName(gameData.modes[gameData.currentModeIndex]);
    const winner = currentMode.getWinner();
    const scoreP1 = Math.round(currentMode.getScoreP1());
    const scoreP2 = Math.round(currentMode.getScoreP2());

    const result = {
      mode: config.name,
      winner,
      scoreP1,
      scoreP2,
    };
    gameData.results.push(result);

    if (winner === 'P1') { gameData.winsP1++; }
    else if (winner === 'P2') { gameData.winsP2++; }

    overlay.showResult(winner, scoreP1, scoreP2, config.displayName, () => {
      // Clean up current mode
      if (currentMode) {
        currentMode.cleanup();
        currentMode = null;
      }

      gameData.currentModeIndex++;
      if (gameData.currentModeIndex < gameData.modes.length) {
        goToIntro();
      } else {
        goToFinal();
      }
    });
  }
}

function goToFinal(): void {
  state = 'final';
  engine.clearScene();
  createMenuScene();
  overlay.showFinal(gameData, () => {
    clearMenuScene();
    goToMenu();
  });
}

// --- Game loop ---
function gameLoop(): void {
  requestAnimationFrame(gameLoop);

  engine.timer.update();
  const delta = Math.min(engine.timer.getDelta(), 0.05);

  switch (state) {
    case 'menu':
      animateMenuScene(delta);
      break;

    case 'intro':
      // Mode scene is visible, just render
      break;

    case 'countdown':
      countdownAccum += delta;
      if (countdownAccum >= 1) {
        countdownAccum -= 1;
        countdownValue--;
        if (countdownValue > 0) {
          overlay.showCountdown(countdownValue);
        } else if (countdownValue === 0) {
          overlay.showCountdown(0); // Shows "¡GO!"
        } else {
          goToPlaying();
        }
      }
      break;

    case 'playing':
      if (currentMode) {
        // Physics step for modes that use it
        engine.world.step(1 / 60, delta, 3);

        currentMode.update(delta);

        // Update HUD
        const p1 = Math.round(currentMode.getScoreP1());
        const p2 = Math.round(currentMode.getScoreP2());

        const isF1Mode = gameData.modes[gameData.currentModeIndex] === 'f1';
        if (isF1Mode) {
          const f1 = currentMode as F1Mode;
          overlay.updateF1Laps(f1.getLapsP1(), f1.getLapsP2(), 3);
          overlay.updateF1Powers(f1.getP1PowerInfo(), f1.getP2PowerInfo());
        } else {
          overlay.updateScore(p1, p2);
        }

        modeTimer -= delta;
        overlay.updateTimer(modeTimer);

        if (modeTimer <= 0 || currentMode.isFinished()) {
          goToResult();
        }
      }
      break;

    case 'result':
      // Scene still visible behind result overlay
      break;

    case 'final':
      animateMenuScene(delta);
      break;
  }

  engine.render();
  engine.input.clearJustPressed();
}

// --- Start ---
goToMenu();
gameLoop();
