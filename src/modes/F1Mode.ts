import * as THREE from 'three';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS, PlayerControls } from '../types';

// ─── Track Waypoints (x, z) ──────────────────────────────────
const TRACK_WAYPOINTS: Array<[number, number]> = [
  [26, -4],
  [28, 6],
  [24, 14],
  [16, 17],
  [6, 13],
  [-4, 17],
  [-12, 13],
  [-20, 17],
  [-27, 13],
  [-29, 4],
  [-25, -2],
  [-18, -5],
  [-25, -10],
  [-28, -16],
  [-20, -18],
  [-8, -14],
  [4, -18],
  [14, -14],
  [22, -18],
  [28, -14],
  [29, -8],
];

// ─── Constants ────────────────────────────────────────────────
const LAPS_TO_WIN = 3;
const TRACK_HALF_WIDTH = 2.8;
const TRACK_SAMPLES = 300;
const CHECKPOINT_COUNT = 8;
const CHECKPOINT_RADIUS = 3.8;
const CAMERA_HEIGHT = 42;
const TRACK_Y = 0.01;

const MAX_SPEED = 18;
const ACCELERATION = 14;
const BRAKE_DECEL = 20;
const FRICTION = 5;
const STEER_SPEED = 3.0;
const PENALTY_SPEED_FACTOR = 0.3;
const PENALTY_DURATION = 2;

const TURBO_SPEED_MULT = 1.8;
const TURBO_DURATION = 3;
const MIRROR_DURATION = 5;
const OBSTACLE_SLOW_FACTOR = 0.2;
const OBSTACLE_SLOW_DURATION = 1.5;
const OBSTACLE_LIFETIME = 15;
const OBSTACLE_HIT_RADIUS = 1.5;

const TRAIL_STUN_DURATION = 1;
const TRAIL_SEGMENT_SPACING = 0.6;
const TRAIL_MAX_AGE = 1.0;
const TRAIL_HIT_RADIUS = 0.5;

const TURBO_ABILITY_SPEED_MULT = 2.0;
const TURBO_ABILITY_DURATION = 1.5;
const TURBO_COOLDOWN = 5;

const POWERUP_SPAWN_MIN = 4;
const POWERUP_SPAWN_MAX = 8;
const POWERUP_MAX_COUNT = 3;
const POWERUP_COLLECT_RADIUS = 2.5;

// ─── Types ────────────────────────────────────────────────────
enum PowerUpType {
  MIRROR = 'MIRROR',
  TURBO = 'TURBO',
  OBSTACLE = 'OBSTACLE',
}

const POWER_COLORS: Record<PowerUpType, number> = {
  [PowerUpType.MIRROR]: 0xaa44ff,
  [PowerUpType.TURBO]: 0xffee00,
  [PowerUpType.OBSTACLE]: 0xff4444,
};

interface CarState {
  x: number;
  z: number;
  angle: number;
  speed: number;
  laps: number;
  nextCheckpoint: number;
  penaltyTimer: number;
  onTrack: boolean;
  mirrorTimer: number;
  turboTimer: number;
  obstacleSlowTimer: number;
  stunTimer: number;
  turboAbilityTimer: number;
  turboCooldown: number;
}

interface PowerUpItem {
  type: PowerUpType;
  position: THREE.Vector3;
  mesh: THREE.Group;
}

interface ObstacleItem {
  position: THREE.Vector3;
  mesh: THREE.Group;
  timer: number;
}

interface TrailSegment {
  x: number;
  z: number;
  mesh: THREE.Mesh;
  time: number;
}

// ─── F1Mode ───────────────────────────────────────────────────
export class F1Mode extends GameMode {
  private sceneObjects: THREE.Object3D[] = [];
  private carP1!: THREE.Group;
  private carP2!: THREE.Group;
  private stateP1: CarState = this.defaultCarState();
  private stateP2: CarState = this.defaultCarState();
  private trackCurve!: THREE.CatmullRomCurve3;
  private trackSamples: THREE.Vector3[] = [];
  private checkpointPositions: THREE.Vector3[] = [];
  private powerUps: PowerUpItem[] = [];
  private obstacles: ObstacleItem[] = [];
  private powerUpTimer = 0;
  private nextSpawnTime = 0;
  private penaltyLabelP1: THREE.Sprite | null = null;
  private penaltyLabelP2: THREE.Sprite | null = null;
  private labelTextP1 = '';
  private labelTextP2 = '';
  private trailP1: TrailSegment[] = [];
  private trailP2: TrailSegment[] = [];
  private lastTrailPosP1 = { x: 0, z: 0 };
  private lastTrailPosP2 = { x: 0, z: 0 };
  private trailGeo!: THREE.BoxGeometry;
  private trailMatP1!: THREE.MeshStandardMaterial;
  private trailMatP2!: THREE.MeshStandardMaterial;

  // ─── Lifecycle ──────────────────────────────────────────────

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.engine.clearScene();
    this.sceneObjects = [];
    this.powerUps = [];
    this.obstacles = [];
    this.powerUpTimer = 0;
    this.nextSpawnTime = this.randomSpawnTime();
    this.penaltyLabelP1 = null;
    this.penaltyLabelP2 = null;

    this.buildTrackCurve();
    this.setupCamera();
    this.addLighting(0xfff4e0);
    this.createGrass();
    this.createTrackSurface();
    this.createKerbRibbon(TRACK_HALF_WIDTH);
    this.createKerbRibbon(-TRACK_HALF_WIDTH);
    this.createCenterLine();
    this.createStartFinishLine();
    this.createCheckpointMarkers();

    this.carP1 = this.createCar(COLORS.P1);
    this.carP2 = this.createCar(COLORS.P2);
    this.addToScene(this.carP1);
    this.addToScene(this.carP2);

    this.stateP1 = this.defaultCarState();
    this.stateP2 = this.defaultCarState();
    this.placeCarAtStart(this.stateP1, -1.2);
    this.placeCarAtStart(this.stateP2, 1.2);
    this.syncCarMesh(this.carP1, this.stateP1);
    this.syncCarMesh(this.carP2, this.stateP2);

    this.trailP1 = [];
    this.trailP2 = [];
    this.trailGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    this.trailMatP1 = new THREE.MeshStandardMaterial({
      color: COLORS.P1, emissive: COLORS.P1, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.7,
    });
    this.trailMatP2 = new THREE.MeshStandardMaterial({
      color: COLORS.P2, emissive: COLORS.P2, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.7,
    });
    this.lastTrailPosP1 = { x: this.stateP1.x, z: this.stateP1.z };
    this.lastTrailPosP2 = { x: this.stateP2.x, z: this.stateP2.z };
  }

  public update(delta: number): void {
    if (!this.isActive) { return; }

    this.handleTurboAbility(this.stateP1, P1_CONTROLS);
    this.handleTurboAbility(this.stateP2, P2_CONTROLS);

    this.updateCar(this.stateP1, P1_CONTROLS, delta);
    this.updateCar(this.stateP2, P2_CONTROLS, delta);
    this.checkTrackBounds(this.stateP1);
    this.checkTrackBounds(this.stateP2);
    this.updateTimers(this.stateP1, delta);
    this.updateTimers(this.stateP2, delta);
    this.checkCheckpoints(this.stateP1, 'P1');
    this.checkCheckpoints(this.stateP2, 'P2');

    this.updatePowerUpSpawning(delta);
    this.checkPowerUpCollection(this.stateP1, 'P1');
    this.checkPowerUpCollection(this.stateP2, 'P2');
    this.updateObstacles(delta);
    this.checkObstacleCollisions(this.stateP1);
    this.checkObstacleCollisions(this.stateP2);
    this.animatePowerUps();

    this.dropTrailSegments();
    this.checkTrailCollisions();

    this.syncCarMesh(this.carP1, this.stateP1);
    this.syncCarMesh(this.carP2, this.stateP2);
    this.updatePenaltyLabels();

    this.scoreP1 = this.stateP1.laps;
    this.scoreP2 = this.stateP2.laps;
  }

  public cleanup(): void {
    for (const obj of this.sceneObjects) {
      this.engine.scene.remove(obj);
    }
    this.sceneObjects = [];
    this.penaltyLabelP1 = null;
    this.penaltyLabelP2 = null;
    this.labelTextP1 = '';
    this.labelTextP2 = '';
    this.powerUps = [];
    this.obstacles = [];
    this.trailP1 = [];
    this.trailP2 = [];
  }

  public isFinished(): boolean {
    return this.stateP1.laps >= LAPS_TO_WIN || this.stateP2.laps >= LAPS_TO_WIN;
  }

  public getLapsP1(): number { return this.stateP1.laps; }
  public getLapsP2(): number { return this.stateP2.laps; }

  public getP1PowerInfo(): string { return this.getActivePowerInfo(this.stateP1); }
  public getP2PowerInfo(): string { return this.getActivePowerInfo(this.stateP2); }

  // ─── Helpers ────────────────────────────────────────────────

  private addToScene(obj: THREE.Object3D): void {
    this.engine.scene.add(obj);
    this.sceneObjects.push(obj);
  }

  private removeFromScene(obj: THREE.Object3D): void {
    this.engine.scene.remove(obj);
    const idx = this.sceneObjects.indexOf(obj);
    if (idx >= 0) { this.sceneObjects.splice(idx, 1); }
  }

  private defaultCarState(): CarState {
    return {
      x: 0, z: 0, angle: 0, speed: 0,
      laps: 0, nextCheckpoint: 1,
      penaltyTimer: 0, onTrack: true,
      mirrorTimer: 0, turboTimer: 0, obstacleSlowTimer: 0,
      stunTimer: 0, turboAbilityTimer: 0, turboCooldown: 0,
    };
  }

  private randomSpawnTime(): number {
    return POWERUP_SPAWN_MIN + Math.random() * (POWERUP_SPAWN_MAX - POWERUP_SPAWN_MIN);
  }

  private getActivePowerInfo(state: CarState): string {
    const effects: string[] = [];
    if (state.stunTimer > 0) { effects.push(`💥 ${Math.ceil(state.stunTimer)}s`); }
    if (state.mirrorTimer > 0) { effects.push(`🪞 ${Math.ceil(state.mirrorTimer)}s`); }
    if (state.turboTimer > 0) { effects.push(`⚡ ${Math.ceil(state.turboTimer)}s`); }
    if (state.turboAbilityTimer > 0) { effects.push(`🚀 ${Math.ceil(state.turboAbilityTimer)}s`); }
    if (state.obstacleSlowTimer > 0) { effects.push(`🛑 ${Math.ceil(state.obstacleSlowTimer)}s`); }
    if (state.turboCooldown > 0) { effects.push(`🔄 ${Math.ceil(state.turboCooldown)}s`); }
    else if (state.turboAbilityTimer <= 0) { effects.push('🚀 LISTO'); }
    return effects.join(' ');
  }

  // ─── Track Building ─────────────────────────────────────────

  private buildTrackCurve(): void {
    const points = TRACK_WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.trackCurve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);

    this.trackSamples = [];
    for (let i = 0; i < TRACK_SAMPLES; i++) {
      this.trackSamples.push(this.trackCurve.getPointAt(i / TRACK_SAMPLES));
    }

    this.checkpointPositions = [];
    for (let i = 0; i < CHECKPOINT_COUNT; i++) {
      const t = i / CHECKPOINT_COUNT;
      this.checkpointPositions.push(this.trackCurve.getPointAt(t));
    }
  }

  private setupCamera(): void {
    this.engine.camera.position.set(0, CAMERA_HEIGHT, 0);
    this.engine.camera.lookAt(0, 0, 0);
  }

  private createGrass(): void {
    const geo = new THREE.PlaneGeometry(100, 80);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d7a2d, roughness: 0.9, metalness: 0,
    });
    const grass = new THREE.Mesh(geo, mat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0;
    grass.receiveShadow = true;
    this.addToScene(grass);
  }

  private createTrackSurface(): void {
    const n = TRACK_SAMPLES;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < n; i++) {
      const t = i / n;
      const p = this.trackCurve.getPointAt(t);
      const tan = this.trackCurve.getTangentAt(t);
      const nx = -tan.z;
      const nz = tan.x;
      const len = Math.sqrt(nx * nx + nz * nz) || 1;

      vertices.push(
        p.x + (nx / len) * TRACK_HALF_WIDTH, TRACK_Y, p.z + (nz / len) * TRACK_HALF_WIDTH,
        p.x - (nx / len) * TRACK_HALF_WIDTH, TRACK_Y, p.z - (nz / len) * TRACK_HALF_WIDTH,
      );
    }

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const a = i * 2;
      const b = i * 2 + 1;
      const c = next * 2;
      const d = next * 2 + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333, roughness: 0.7, metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.addToScene(mesh);
  }

  private createCenterLine(): void {
    const segCount = 120;
    for (let i = 0; i < segCount; i++) {
      if (i % 2 !== 0) { continue; }
      const t1 = i / segCount;
      const t2 = (i + 0.5) / segCount;
      const p1 = this.trackCurve.getPointAt(t1);
      const p2 = this.trackCurve.getPointAt(t2 % 1);
      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.z + p2.z) / 2;
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const segLen = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const geo = new THREE.PlaneGeometry(segLen, 0.12);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const dash = new THREE.Mesh(geo, mat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(mx, TRACK_Y + 0.005, mz);
      dash.rotation.z = -angle;
      this.addToScene(dash);
    }
  }

  private createKerbRibbon(offset: number): void {
    const n = TRACK_SAMPLES;
    const width = 0.5;
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const segPerStripe = Math.max(1, Math.floor(n / 60));

    for (let i = 0; i < n; i++) {
      const t = i / n;
      const p = this.trackCurve.getPointAt(t);
      const tan = this.trackCurve.getTangentAt(t);
      const nx = -tan.z;
      const nz = tan.x;
      const len = Math.sqrt(nx * nx + nz * nz) || 1;
      const ux = nx / len;
      const uz = nz / len;

      vertices.push(
        p.x + ux * (offset - width / 2), TRACK_Y + 0.006, p.z + uz * (offset - width / 2),
        p.x + ux * (offset + width / 2), TRACK_Y + 0.006, p.z + uz * (offset + width / 2),
      );

      const stripe = Math.floor(i / segPerStripe);
      const isRed = stripe % 2 === 0;
      const r = 1;
      const g = isRed ? 0 : 1;
      const b = isRed ? 0 : 1;
      colors.push(r, g, b, r, g, b);
    }

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      indices.push(i * 2, next * 2, i * 2 + 1);
      indices.push(i * 2 + 1, next * 2, next * 2 + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.addToScene(mesh);
  }

  private createStartFinishLine(): void {
    const p = this.trackCurve.getPointAt(0);
    const tan = this.trackCurve.getTangentAt(0);
    const perpX = -tan.z;
    const perpZ = tan.x;
    const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;

    const lineWidth = TRACK_HALF_WIDTH * 2;
    const lineHeight = 1.5;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const tileSize = 8;
      for (let r = 0; r < canvas.height / tileSize; r++) {
        for (let c = 0; c < canvas.width / tileSize; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
          ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);

    const group = new THREE.Group();
    group.position.set(p.x, TRACK_Y + 0.008, p.z);

    const lookTarget = new THREE.Vector3(p.x + tan.x, TRACK_Y + 0.008, p.z + tan.z);
    group.lookAt(lookTarget);

    const geo = new THREE.PlaneGeometry(lineWidth, lineHeight);
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });
    const lineMesh = new THREE.Mesh(geo, mat);
    lineMesh.rotation.x = -Math.PI / 2;
    group.add(lineMesh);

    this.addToScene(group);

    // Add finish sign poles on each side
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    for (const side of [-1, 1]) {
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 3, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      const ox = (perpX / perpLen) * TRACK_HALF_WIDTH * side;
      const oz = (perpZ / perpLen) * TRACK_HALF_WIDTH * side;
      pole.position.set(p.x + ox, 1.5, p.z + oz);
      this.addToScene(pole);
    }
  }

  private createCheckpointMarkers(): void {
    for (let i = 1; i < CHECKPOINT_COUNT; i++) {
      const cp = this.checkpointPositions[i];
      const t = i / CHECKPOINT_COUNT;
      const tan = this.trackCurve.getTangentAt(t);
      const perpX = -tan.z;
      const perpZ = tan.x;
      const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;

      for (const side of [-1, 1]) {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3,
          transparent: true, opacity: 0.7,
        });
        const marker = new THREE.Mesh(geo, mat);
        const ox = (perpX / perpLen) * TRACK_HALF_WIDTH * side;
        const oz = (perpZ / perpLen) * TRACK_HALF_WIDTH * side;
        marker.position.set(cp.x + ox, 0.75, cp.z + oz);
        this.addToScene(marker);
      }
    }
  }

  // ─── Car ────────────────────────────────────────────────────

  private createCar(color: number): THREE.Group {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.2, 0.3, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.25, metalness: 0.4,
      emissive: color, emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x222222, roughness: 0.3, metalness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.1, 0.52, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.8, metalness: 0.1,
    });
    const wheelPositions = [
      [0.4, 0.12, 0.4], [0.4, 0.12, -0.4],
      [-0.4, 0.12, 0.4], [-0.4, 0.12, -0.4],
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }

    const wingMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.3, metalness: 0.3,
    });
    const frontWingGeo = new THREE.BoxGeometry(0.15, 0.06, 0.8);
    const frontWing = new THREE.Mesh(frontWingGeo, wingMat);
    frontWing.position.set(0.65, 0.18, 0);
    group.add(frontWing);

    const rearWingGeo = new THREE.BoxGeometry(0.08, 0.2, 0.7);
    const rearWing = new THREE.Mesh(rearWingGeo, wingMat);
    rearWing.position.set(-0.6, 0.45, 0);
    group.add(rearWing);

    return group;
  }

  private placeCarAtStart(state: CarState, lateralOffset: number): void {
    const p = this.trackCurve.getPointAt(0);
    const tan = this.trackCurve.getTangentAt(0);
    const perpX = -tan.z;
    const perpZ = tan.x;
    const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;

    state.x = p.x + (perpX / perpLen) * lateralOffset;
    state.z = p.z + (perpZ / perpLen) * lateralOffset;
    state.angle = Math.atan2(-tan.z, tan.x);
  }

  private syncCarMesh(mesh: THREE.Group, state: CarState): void {
    mesh.position.set(state.x, 0, state.z);
    mesh.rotation.y = state.angle;
  }

  // ─── Car Physics ────────────────────────────────────────────

  private updateCar(
    state: CarState,
    controls: PlayerControls,
    delta: number,
  ): void {
    const input = this.engine.input;

    if (state.stunTimer > 0) {
      state.speed = 0;
      return;
    }

    let effectiveMax = MAX_SPEED;
    if (state.penaltyTimer > 0) { effectiveMax *= PENALTY_SPEED_FACTOR; }
    if (state.turboTimer > 0) { effectiveMax *= TURBO_SPEED_MULT; }
    if (state.turboAbilityTimer > 0) { effectiveMax *= TURBO_ABILITY_SPEED_MULT; }
    if (state.obstacleSlowTimer > 0) { effectiveMax *= OBSTACLE_SLOW_FACTOR; }

    if (input.isDown(controls.up)) {
      state.speed += ACCELERATION * delta;
    } else if (input.isDown(controls.down)) {
      state.speed -= BRAKE_DECEL * delta;
    } else {
      if (state.speed > 0) {
        state.speed = Math.max(0, state.speed - FRICTION * delta);
      } else if (state.speed < 0) {
        state.speed = Math.min(0, state.speed + FRICTION * delta);
      }
    }

    state.speed = Math.max(-effectiveMax * 0.4, Math.min(effectiveMax, state.speed));

    if (Math.abs(state.speed) > 0.5) {
      const steerFactor = Math.min(Math.abs(state.speed) / MAX_SPEED, 1);
      const mirror = state.mirrorTimer > 0 ? -1 : 1;

      if (input.isDown(controls.left)) {
        state.angle += STEER_SPEED * steerFactor * delta * mirror;
      }
      if (input.isDown(controls.right)) {
        state.angle -= STEER_SPEED * steerFactor * delta * mirror;
      }
    }

    state.x += Math.cos(state.angle) * state.speed * delta;
    state.z -= Math.sin(state.angle) * state.speed * delta;
  }

  private checkTrackBounds(state: CarState): void {
    let minDistSq = Infinity;
    for (const p of this.trackSamples) {
      const dx = state.x - p.x;
      const dz = state.z - p.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistSq) { minDistSq = distSq; }
    }
    state.onTrack = minDistSq <= TRACK_HALF_WIDTH * TRACK_HALF_WIDTH;
    if (!state.onTrack && state.penaltyTimer <= 0) {
      state.penaltyTimer = PENALTY_DURATION;
    }
  }

  private updateTimers(state: CarState, delta: number): void {
    if (state.penaltyTimer > 0) { state.penaltyTimer = Math.max(0, state.penaltyTimer - delta); }
    if (state.mirrorTimer > 0) { state.mirrorTimer = Math.max(0, state.mirrorTimer - delta); }
    if (state.turboTimer > 0) { state.turboTimer = Math.max(0, state.turboTimer - delta); }
    if (state.obstacleSlowTimer > 0) { state.obstacleSlowTimer = Math.max(0, state.obstacleSlowTimer - delta); }
    if (state.stunTimer > 0) { state.stunTimer = Math.max(0, state.stunTimer - delta); }
    if (state.turboAbilityTimer > 0) { state.turboAbilityTimer = Math.max(0, state.turboAbilityTimer - delta); }
    if (state.turboCooldown > 0) { state.turboCooldown = Math.max(0, state.turboCooldown - delta); }
  }

  // ─── Checkpoints & Laps ─────────────────────────────────────
  // Checkpoint 0 is at the finish line (t=0). Checkpoints 1-7 are
  // intermediate markers. Cars start with nextCheckpoint=1 so they
  // must traverse all intermediate checkpoints before crossing the
  // finish line (checkpoint 0) to register a completed lap.

  private checkCheckpoints(state: CarState, _player: 'P1' | 'P2'): void {
    const cp = this.checkpointPositions[state.nextCheckpoint];
    const dx = state.x - cp.x;
    const dz = state.z - cp.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
      if (state.nextCheckpoint === 0) {
        state.laps++;
        state.nextCheckpoint = 1;
      } else {
        state.nextCheckpoint = (state.nextCheckpoint + 1) % CHECKPOINT_COUNT;
      }
    }
  }

  // ─── Power-Ups ──────────────────────────────────────────────

  private updatePowerUpSpawning(delta: number): void {
    this.powerUpTimer += delta;
    if (this.powerUpTimer >= this.nextSpawnTime && this.powerUps.length < POWERUP_MAX_COUNT) {
      this.spawnPowerUp();
      this.powerUpTimer = 0;
      this.nextSpawnTime = this.randomSpawnTime();
    }
  }

  private spawnPowerUp(): void {
    const types = [PowerUpType.MIRROR, PowerUpType.TURBO, PowerUpType.OBSTACLE];
    const type = types[Math.floor(Math.random() * types.length)];
    const t = 0.1 + Math.random() * 0.8;
    const pos = this.trackCurve.getPointAt(t);

    const mesh = this.createPowerUpMesh(type);
    mesh.position.set(pos.x, 1, pos.z);
    this.addToScene(mesh);
    this.powerUps.push({ type, position: pos.clone(), mesh });
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();
    const color = POWER_COLORS[type];

    let geo: THREE.BufferGeometry;
    switch (type) {
      case PowerUpType.MIRROR:
        geo = new THREE.OctahedronGeometry(0.6);
        break;
      case PowerUpType.TURBO:
        geo = new THREE.ConeGeometry(0.5, 1, 6);
        break;
      case PowerUpType.OBSTACLE:
        geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        break;
    }

    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.5,
      roughness: 0.3, metalness: 0.4,
    });
    const shape = new THREE.Mesh(geo, mat);
    group.add(shape);

    const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  private checkPowerUpCollection(state: CarState, player: 'P1' | 'P2'): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.powerUps.length; i++) {
      const pu = this.powerUps[i];
      const dx = state.x - pu.position.x;
      const dz = state.z - pu.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < POWERUP_COLLECT_RADIUS * POWERUP_COLLECT_RADIUS) {
        this.applyPowerUp(pu.type, player);
        this.removeFromScene(pu.mesh);
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.powerUps.splice(toRemove[i], 1);
    }
  }

  private applyPowerUp(type: PowerUpType, player: 'P1' | 'P2'): void {
    const opponent = player === 'P1' ? this.stateP2 : this.stateP1;
    const self = player === 'P1' ? this.stateP1 : this.stateP2;

    switch (type) {
      case PowerUpType.MIRROR:
        opponent.mirrorTimer = MIRROR_DURATION;
        break;
      case PowerUpType.TURBO:
        self.turboTimer = TURBO_DURATION;
        break;
      case PowerUpType.OBSTACLE:
        this.placeObstacle();
        break;
    }
  }

  // ─── Obstacles ──────────────────────────────────────────────

  private placeObstacle(): void {
    const t = 0.1 + Math.random() * 0.8;
    const pos = this.trackCurve.getPointAt(t);

    const group = new THREE.Group();
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.3, roughness: 0.5,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), coneMat);
    cone.position.y = 0.6;
    group.add(cone);

    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.2,
    });
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 8), stripeMat);
    stripe.position.y = 0.05;
    group.add(stripe);

    group.position.set(pos.x, 0, pos.z);
    this.addToScene(group);
    this.obstacles.push({ position: pos.clone(), mesh: group, timer: OBSTACLE_LIFETIME });
  }

  private updateObstacles(delta: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].timer -= delta;
      if (this.obstacles[i].timer <= 0) {
        this.removeFromScene(this.obstacles[i].mesh);
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.obstacles.splice(toRemove[i], 1);
    }
  }

  private checkObstacleCollisions(state: CarState): void {
    for (const obs of this.obstacles) {
      const dx = state.x - obs.position.x;
      const dz = state.z - obs.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < OBSTACLE_HIT_RADIUS * OBSTACLE_HIT_RADIUS && state.obstacleSlowTimer <= 0) {
        state.obstacleSlowTimer = OBSTACLE_SLOW_DURATION;
        state.speed *= 0.3;
      }
    }
  }

  private animatePowerUps(): void {
    const time = performance.now() * 0.001;
    for (const pu of this.powerUps) {
      pu.mesh.rotation.y += 0.02;
      pu.mesh.position.y = 1 + Math.sin(time * 3 + pu.position.x) * 0.3;
    }
    for (const obs of this.obstacles) {
      const scale = 1 + Math.sin(time * 5) * 0.1;
      obs.mesh.scale.set(scale, scale, scale);
    }
  }

  // ─── Tron Trail & Turbo Ability ─────────────────────────────

  private handleTurboAbility(state: CarState, controls: PlayerControls): void {
    if (state.stunTimer > 0) { return; }
    if (this.engine.input.isDown(controls.action1) && state.turboCooldown <= 0 && state.turboAbilityTimer <= 0) {
      state.turboAbilityTimer = TURBO_ABILITY_DURATION;
      state.turboCooldown = TURBO_COOLDOWN;
    }
  }

  private dropTrailSegments(): void {
    this.dropTrailForPlayer(this.stateP1, this.lastTrailPosP1, this.trailP1, this.trailMatP1);
    this.dropTrailForPlayer(this.stateP2, this.lastTrailPosP2, this.trailP2, this.trailMatP2);
    this.expireOldTrail(this.trailP1);
    this.expireOldTrail(this.trailP2);
  }

  private expireOldTrail(trail: TrailSegment[]): void {
    const now = performance.now();
    while (trail.length > 0 && (now - trail[0].time) > TRAIL_MAX_AGE * 1000) {
      const old = trail.shift();
      if (old) { this.removeFromScene(old.mesh); }
    }
  }

  private dropTrailForPlayer(
    state: CarState,
    lastPos: { x: number; z: number },
    trail: TrailSegment[],
    material: THREE.MeshStandardMaterial,
  ): void {
    const dx = state.x - lastPos.x;
    const dz = state.z - lastPos.z;
    if (dx * dx + dz * dz < TRAIL_SEGMENT_SPACING * TRAIL_SEGMENT_SPACING) { return; }

    const mesh = new THREE.Mesh(this.trailGeo, material);
    mesh.position.set(lastPos.x, 0.25, lastPos.z);
    this.addToScene(mesh);
    trail.push({ x: lastPos.x, z: lastPos.z, mesh, time: performance.now() });

    lastPos.x = state.x;
    lastPos.z = state.z;
  }

  private checkTrailCollisions(): void {
    this.checkTrailHit(this.stateP1, this.trailP2);
    this.checkTrailHit(this.stateP2, this.trailP1);
  }

  private checkTrailHit(state: CarState, opponentTrail: TrailSegment[]): void {
    if (state.stunTimer > 0) { return; }
    for (const seg of opponentTrail) {
      const dx = state.x - seg.x;
      const dz = state.z - seg.z;
      if (dx * dx + dz * dz < TRAIL_HIT_RADIUS * TRAIL_HIT_RADIUS) {
        state.stunTimer = TRAIL_STUN_DURATION;
        state.speed = 0;
        break;
      }
    }
  }

  // ─── Labels ─────────────────────────────────────────────────

  private updatePenaltyLabels(): void {
    const result1 = this.updatePenaltyLabel(
      this.penaltyLabelP1, this.labelTextP1, this.stateP1, this.carP1,
    );
    this.penaltyLabelP1 = result1.sprite;
    this.labelTextP1 = result1.text;

    const result2 = this.updatePenaltyLabel(
      this.penaltyLabelP2, this.labelTextP2, this.stateP2, this.carP2,
    );
    this.penaltyLabelP2 = result2.sprite;
    this.labelTextP2 = result2.text;
  }

  private updatePenaltyLabel(
    existing: THREE.Sprite | null,
    currentText: string,
    state: CarState,
    car: THREE.Group,
  ): { sprite: THREE.Sprite | null; text: string } {
    const hasPenalty = state.penaltyTimer > 0;
    const hasMirror = state.mirrorTimer > 0;
    const hasTurbo = state.turboTimer > 0;
    const hasSlow = state.obstacleSlowTimer > 0;
    const hasStun = state.stunTimer > 0;
    const hasTurboAbility = state.turboAbilityTimer > 0;
    const hasEffect = hasPenalty || hasMirror || hasTurbo || hasSlow || hasStun || hasTurboAbility;

    if (hasEffect) {
      const text = hasStun ? '💥 STUNNED' : hasPenalty ? 'PENALTY' : hasTurboAbility ? '🚀 TURBO' : hasMirror ? '🪞 MIRROR' : hasTurbo ? '⚡ TURBO' : '🛑 SLOW';
      const color = hasStun ? 0xff0000 : hasPenalty ? COLORS.DANGER : hasTurboAbility ? 0x00ffff : hasMirror ? 0xaa44ff : hasTurbo ? 0xffee00 : 0xff4444;

      if (!existing || currentText !== text) {
        if (existing) {
          existing.material.map?.dispose();
          existing.material.dispose();
          this.removeFromScene(existing);
        }
        existing = this.createTextSprite(text, color);
        this.addToScene(existing);
      }
      existing.position.set(car.position.x, 2.2, car.position.z);
      existing.visible = true;
      return { sprite: existing, text };
    } else if (existing) {
      existing.visible = false;
    }
    return { sprite: existing, text: '' };
  }

  private createTextSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const hex = '#' + new THREE.Color(color).getHexString();
      ctx.fillStyle = hex;
      ctx.fillText(text, 128, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 0.75, 1);
    return sprite;
  }
}
