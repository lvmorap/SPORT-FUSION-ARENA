import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type ModeName = 'football' | 'sumo' | 'pingpong' | 'golf' | 'f1';
export type WinnerType = 'P1' | 'P2' | 'DRAW';
export type PlayerID = 'P1' | 'P2';
export type GameState = 'menu' | 'intro' | 'countdown' | 'playing' | 'result' | 'final';

export interface ModeResult {
  mode: ModeName;
  winner: WinnerType;
  scoreP1: number;
  scoreP2: number;
}

export interface GameData {
  currentModeIndex: number;
  modes: ModeName[];
  results: ModeResult[];
  winsP1: number;
  winsP2: number;
}

export interface PlayerControls {
  up: string;
  down: string;
  left: string;
  right: string;
  action1: string;
  action2: string;
}

export interface ModeConfig {
  name: ModeName;
  displayName: string;
  icon: string;
  description: string;
  duration: number;
  bgColor: number;
}

export const MODE_CONFIGS: ModeConfig[] = [
  {
    name: 'football',
    displayName: 'FUTBOL 3D',
    icon: '⚽',
    description: 'Las porterías se mueven verticalmente. ¡Marca goles en arcos que no paran!',
    duration: 60,
    bgColor: 0x0a2a0a,
  },
  {
    name: 'sumo',
    displayName: 'SUMO ARENA',
    icon: '🥊',
    description:
      'Empuja a tu rival fuera de la zona. ¡La arena se achica! Dash (F/Shift) y Salto (G/Enter)',
    duration: 60,
    bgColor: 0x3a2010,
  },
  {
    name: 'pingpong',
    displayName: 'PING PONG 3D',
    icon: '🏓',
    description: 'La pelota acelera con cada golpe. ¡Los reflejos lo son todo!',
    duration: 60,
    bgColor: 0x0a0a3a,
  },
  {
    name: 'golf',
    displayName: 'GOLF DUAL',
    icon: '⛳',
    description: 'Dos pelotas compiten al mismo tiempo. ¡Llega al hoyo primero!',
    duration: 60,
    bgColor: 0x0a3a1a,
  },
  {
    name: 'f1',
    displayName: 'FORMULA 3D',
    icon: '🏎️',
    description:
      '¡Carrera por vueltas con poderes! 3 vueltas para ganar. ¡Cuidado con los obstáculos!',
    duration: 120,
    bgColor: 0x1a1a2a,
  },
];

export const COLORS = {
  P1: 0x00e5ff,
  P2: 0xff3d71,
  SCORE: 0xffeb00,
  DANGER: 0xff2222,
  SUCCESS: 0x00ff88,
  WHITE: 0xffffff,
  DARK: 0x050510,
};

export const P1_CONTROLS: PlayerControls = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  action1: 'KeyF',
  action2: 'KeyG',
};

export const P2_CONTROLS: PlayerControls = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  action1: 'ShiftRight',
  action2: 'Enter',
};

export interface PhysicsObject {
  mesh: THREE.Object3D;
  body: CANNON.Body;
}
