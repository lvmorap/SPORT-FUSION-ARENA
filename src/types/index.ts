import Phaser from 'phaser';

export interface GameData {
  currentModeIndex: number;
  modes: readonly ModeName[];
  modeNames: readonly string[];
  globalScores: GlobalScores;
  modeWinners: ModeResult[];
}

export interface GlobalScores {
  p1: number;
  p2: number;
}

export interface ModeResult {
  mode: string;
  winner: WinnerType;
  p1Score: number;
  p2Score: number;
}

export interface ModeIntroData {
  mode: ModeName;
  title: string;
  line1: string;
  line2: string;
  modeNumber: number;
  gameData: GameData;
}

export interface ResultData {
  modeName: string;
  modeWinner: WinnerType;
  modeScores: { p1: number; p2: number };
  globalScores: GlobalScores;
  modeNumber: number;
  gameData: GameData;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dir: number;
}

export interface Zone {
  x: number;
  y: number;
  radius: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export interface Hole {
  x: number;
  y: number;
  r: number;
}

export interface Hazard {
  x: number;
  y: number;
  radius: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  r: number;
  id: string;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha?: number;
}

export interface CarCustomData {
  speed: number;
  angle: number;
  driftAngle: number;
}

export type ModeName = 'football' | 'sumo' | 'pingpong' | 'golf' | 'f1';
export type WinnerType = 'P1' | 'P2' | 'EMPATE';

export interface GameSceneKeys {
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  f: Phaser.Input.Keyboard.Key;
  g: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
  enter: Phaser.Input.Keyboard.Key;
}

export interface GameScene extends Phaser.Scene {
  keys: GameSceneKeys;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  showFloatingText: (x: number, y: number, text: string, color: string) => void;
}

export const COLORS = {
  P1: 0x00e5ff,
  P1_DARK: 0x0099aa,
  P2: 0xff3d71,
  P2_DARK: 0xaa1144,
  SCORE: 0xffeb00,
  DANGER: 0xff2222,
  SUCCESS: 0x00ff88,
  TEXT: 0xffffff,
  DARK: 0x050510,
} as const;

export const MODE_ICONS: Record<ModeName, string> = {
  football: '⚽',
  sumo: '🥊',
  pingpong: '🏓',
  golf: '⛳',
  f1: '🏎️',
} as const;

export const BG_COLORS: Record<string, number> = {
  bg_football: 0x0d3b0d,
  bg_sumo: 0x5c3a1e,
  bg_pingpong: 0x0d1f3c,
  bg_golf: 0x1a4a1a,
  bg_f1: 0x111111,
} as const;
