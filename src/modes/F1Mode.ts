import * as THREE from 'three';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

// Track geometry
const TRACK_CENTER_RADIUS = 15;
const TRACK_INNER_RADIUS = 12;
const TRACK_OUTER_RADIUS = 18;
const TRACK_WIDTH = TRACK_OUTER_RADIUS - TRACK_INNER_RADIUS;
const TRACK_Y = 0.01;

// Car physics
const MAX_SPEED = 15;
const ACCELERATION = 12;
const BRAKE_DECEL = 18;
const FRICTION = 4;
const STEER_SPEED = 2.8;
const PENALTY_SPEED_FACTOR = 0.3;
const PENALTY_DURATION = 3;

// Starting grid
const START_LINE_LANE_OFFSET = 1.2;

// Checkpoints (4 evenly spaced around the track)
const CHECKPOINT_COUNT = 4;
const CHECKPOINT_ANGLES: number[] = [];
for (let i = 0; i < CHECKPOINT_COUNT; i++) {
  CHECKPOINT_ANGLES.push((i * Math.PI * 2) / CHECKPOINT_COUNT);
}
const CHECKPOINT_RADIUS = 2.5;

// Camera
const CAMERA_HEIGHT = 35;

interface CarState {
  x: number;
  z: number;
  angle: number;
  speed: number;
  nextCheckpoint: number;
  penaltyTimer: number;
  onTrack: boolean;
}

export class F1Mode extends GameMode {
  private sceneObjects: THREE.Object3D[] = [];
  private carP1!: THREE.Group;
  private carP2!: THREE.Group;
  private stateP1: CarState = this.defaultCarState();
  private stateP2: CarState = this.defaultCarState();
  private penaltyLabelP1: THREE.Sprite | null = null;
  private penaltyLabelP2: THREE.Sprite | null = null;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.engine.clearScene();
    this.sceneObjects = [];

    this.setupCamera();
    this.addLighting(0xfff4e0);
    this.createGrass();
    this.createTrackSurface();
    this.createKerbs();
    this.createStartFinishLine();
    this.createCheckpointMarkers();
    this.carP1 = this.createCar(COLORS.P1);
    this.carP2 = this.createCar(COLORS.P2);
    this.addToScene(this.carP1);
    this.addToScene(this.carP2);

    // Place cars at start line, side by side
    this.stateP1 = this.defaultCarState();
    this.stateP1.x = TRACK_CENTER_RADIUS;
    this.stateP1.z = -START_LINE_LANE_OFFSET;
    this.stateP1.angle = Math.PI / 2;

    this.stateP2 = this.defaultCarState();
    this.stateP2.x = TRACK_CENTER_RADIUS;
    this.stateP2.z = START_LINE_LANE_OFFSET;
    this.stateP2.angle = Math.PI / 2;

    this.syncCarMesh(this.carP1, this.stateP1);
    this.syncCarMesh(this.carP2, this.stateP2);
  }

  public update(delta: number): void {
    if (!this.isActive) { return; }

    this.updateCar(this.stateP1, P1_CONTROLS, delta);
    this.updateCar(this.stateP2, P2_CONTROLS, delta);
    this.checkTrackBounds(this.stateP1);
    this.checkTrackBounds(this.stateP2);
    this.updatePenalties(this.stateP1, delta);
    this.updatePenalties(this.stateP2, delta);
    this.checkCheckpoints(this.stateP1, 'P1');
    this.checkCheckpoints(this.stateP2, 'P2');
    this.syncCarMesh(this.carP1, this.stateP1);
    this.syncCarMesh(this.carP2, this.stateP2);
    this.updatePenaltyLabels();
  }

  public cleanup(): void {
    for (const obj of this.sceneObjects) {
      this.engine.scene.remove(obj);
    }
    this.sceneObjects = [];
    this.penaltyLabelP1 = null;
    this.penaltyLabelP2 = null;
  }

  // --- Helpers ---

  private addToScene(obj: THREE.Object3D): void {
    this.engine.scene.add(obj);
    this.sceneObjects.push(obj);
  }

  private defaultCarState(): CarState {
    return {
      x: TRACK_CENTER_RADIUS,
      z: 0,
      angle: Math.PI / 2,
      speed: 0,
      nextCheckpoint: 1,
      penaltyTimer: 0,
      onTrack: true,
    };
  }

  private setupCamera(): void {
    this.engine.camera.position.set(0, CAMERA_HEIGHT, 0);
    this.engine.camera.lookAt(0, 0, 0);
  }

  // --- Environment ---

  private createGrass(): void {
    const geo = new THREE.PlaneGeometry(60, 60);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d7a2d,
      roughness: 0.9,
      metalness: 0,
    });
    const grass = new THREE.Mesh(geo, mat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0;
    grass.receiveShadow = true;
    this.addToScene(grass);
  }

  private createTrackSurface(): void {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, TRACK_OUTER_RADIUS, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, TRACK_INNER_RADIUS, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ShapeGeometry(shape, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.05,
    });
    const track = new THREE.Mesh(geo, mat);
    track.rotation.x = -Math.PI / 2;
    track.position.y = TRACK_Y;
    track.receiveShadow = true;
    this.addToScene(track);

    // Center racing line (dashed circle at center radius)
    this.createDashedCircle(TRACK_CENTER_RADIUS, 0xffffff, 0.08, TRACK_Y + 0.005);
  }

  private createDashedCircle(radius: number, color: number, lineWidth: number, y: number): void {
    const segments = 60;
    const dashRatio = 0.5;
    for (let i = 0; i < segments; i++) {
      if (i % 2 !== 0) { continue; }
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + dashRatio) / segments) * Math.PI * 2;
      const mid = (a1 + a2) / 2;
      const arcLen = (a2 - a1) * radius;
      const geo = new THREE.PlaneGeometry(arcLen, lineWidth);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const dash = new THREE.Mesh(geo, mat);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = -mid;
      dash.position.set(
        Math.cos(mid) * radius,
        y,
        Math.sin(mid) * radius,
      );
      this.addToScene(dash);
    }
  }

  private createKerbs(): void {
    const segments = 48;
    const kerbWidth = 0.5;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const mid = (a1 + a2) / 2;
      const color = i % 2 === 0 ? 0xff0000 : 0xffffff;
      const arcLen = ((a2 - a1) * TRACK_INNER_RADIUS) + 0.02;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });

      // Inner kerb
      const geoIn = new THREE.PlaneGeometry(arcLen, kerbWidth);
      const kerbIn = new THREE.Mesh(geoIn, mat);
      kerbIn.rotation.x = -Math.PI / 2;
      kerbIn.rotation.z = -mid;
      kerbIn.position.set(
        Math.cos(mid) * (TRACK_INNER_RADIUS + kerbWidth / 2),
        TRACK_Y + 0.005,
        Math.sin(mid) * (TRACK_INNER_RADIUS + kerbWidth / 2),
      );
      this.addToScene(kerbIn);

      // Outer kerb
      const geoOut = new THREE.PlaneGeometry(
        ((a2 - a1) * TRACK_OUTER_RADIUS) + 0.02,
        kerbWidth,
      );
      const kerbOut = new THREE.Mesh(geoOut, mat);
      kerbOut.rotation.x = -Math.PI / 2;
      kerbOut.rotation.z = -mid;
      kerbOut.position.set(
        Math.cos(mid) * (TRACK_OUTER_RADIUS - kerbWidth / 2),
        TRACK_Y + 0.005,
        Math.sin(mid) * (TRACK_OUTER_RADIUS - kerbWidth / 2),
      );
      this.addToScene(kerbOut);
    }
  }

  private createStartFinishLine(): void {
    const geo = new THREE.PlaneGeometry(TRACK_WIDTH, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const line = new THREE.Mesh(geo, mat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(TRACK_CENTER_RADIUS, TRACK_Y + 0.008, 0);
    this.addToScene(line);

    // Checkerboard pattern overlay
    const tileSize = 0.3;
    const cols = Math.floor(TRACK_WIDTH / tileSize);
    const rows = Math.floor(1.2 / tileSize);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2 === 0) { continue; }
        const tGeo = new THREE.PlaneGeometry(tileSize, tileSize);
        const tMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        const tile = new THREE.Mesh(tGeo, tMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          TRACK_INNER_RADIUS + tileSize / 2 + c * tileSize,
          TRACK_Y + 0.01,
          -1.2 / 2 + tileSize / 2 + r * tileSize,
        );
        this.addToScene(tile);
      }
    }
  }

  private createCheckpointMarkers(): void {
    for (let i = 0; i < CHECKPOINT_COUNT; i++) {
      const angle = CHECKPOINT_ANGLES[i];
      const x = Math.cos(angle) * TRACK_CENTER_RADIUS;
      const z = Math.sin(angle) * TRACK_CENTER_RADIUS;
      const geo = new THREE.RingGeometry(0.3, 0.5, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, TRACK_Y + 0.015, z);
      this.addToScene(marker);
    }
  }

  // --- Car creation ---

  private createCar(color: number): THREE.Group {
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.3, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.4,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.1, 0.52, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels (4 cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
      metalness: 0.1,
    });
    const wheelPositions = [
      [0.4, 0.12, 0.4],
      [0.4, 0.12, -0.4],
      [-0.4, 0.12, 0.4],
      [-0.4, 0.12, -0.4],
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }

    // Front wing (nose)
    const wingGeo = new THREE.BoxGeometry(0.15, 0.06, 0.8);
    const wingMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.3,
    });
    const frontWing = new THREE.Mesh(wingGeo, wingMat);
    frontWing.position.set(0.65, 0.18, 0);
    group.add(frontWing);

    // Rear wing
    const rearWingGeo = new THREE.BoxGeometry(0.08, 0.2, 0.7);
    const rearWing = new THREE.Mesh(rearWingGeo, wingMat);
    rearWing.position.set(-0.6, 0.45, 0);
    group.add(rearWing);

    return group;
  }

  // --- Car update ---

  private updateCar(
    state: CarState,
    controls: { up: string; down: string; left: string; right: string },
    delta: number,
  ): void {
    const input = this.engine.input;
    const effectiveMax = state.penaltyTimer > 0 ? MAX_SPEED * PENALTY_SPEED_FACTOR : MAX_SPEED;

    // Acceleration / braking
    if (input.isDown(controls.up)) {
      state.speed += ACCELERATION * delta;
    } else if (input.isDown(controls.down)) {
      state.speed -= BRAKE_DECEL * delta;
    } else {
      // Natural friction
      if (state.speed > 0) {
        state.speed = Math.max(0, state.speed - FRICTION * delta);
      } else if (state.speed < 0) {
        state.speed = Math.min(0, state.speed + FRICTION * delta);
      }
    }

    // Clamp speed
    state.speed = Math.max(-effectiveMax * 0.4, Math.min(effectiveMax, state.speed));

    // Steering (only when moving)
    if (Math.abs(state.speed) > 0.5) {
      const steerFactor = Math.min(Math.abs(state.speed) / MAX_SPEED, 1);
      if (input.isDown(controls.left)) {
        state.angle += STEER_SPEED * steerFactor * delta;
      }
      if (input.isDown(controls.right)) {
        state.angle -= STEER_SPEED * steerFactor * delta;
      }
    }

    // Move car
    state.x += Math.cos(state.angle) * state.speed * delta;
    state.z -= Math.sin(state.angle) * state.speed * delta;
  }

  private checkTrackBounds(state: CarState): void {
    const dist = Math.sqrt(state.x * state.x + state.z * state.z);
    state.onTrack = dist >= TRACK_INNER_RADIUS && dist <= TRACK_OUTER_RADIUS;
    if (!state.onTrack && state.penaltyTimer <= 0) {
      state.penaltyTimer = PENALTY_DURATION;
    }
  }

  private updatePenalties(state: CarState, delta: number): void {
    if (state.penaltyTimer > 0) {
      state.penaltyTimer = Math.max(0, state.penaltyTimer - delta);
    }
  }

  private checkCheckpoints(state: CarState, player: 'P1' | 'P2'): void {
    const cpAngle = CHECKPOINT_ANGLES[state.nextCheckpoint];
    const cpX = Math.cos(cpAngle) * TRACK_CENTER_RADIUS;
    const cpZ = Math.sin(cpAngle) * TRACK_CENTER_RADIUS;
    const dx = state.x - cpX;
    const dz = state.z - cpZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
      state.nextCheckpoint++;
      if (state.nextCheckpoint >= CHECKPOINT_COUNT) {
        // Completed a lap
        state.nextCheckpoint = 0;
        if (player === 'P1') {
          this.scoreP1++;
        } else {
          this.scoreP2++;
        }
      }
    }
  }

  private syncCarMesh(mesh: THREE.Group, state: CarState): void {
    mesh.position.set(state.x, 0, state.z);
    mesh.rotation.y = state.angle;
  }

  // --- Penalty labels ---

  private updatePenaltyLabels(): void {
    this.penaltyLabelP1 = this.updatePenaltyLabel(
      this.penaltyLabelP1,
      this.stateP1,
      this.carP1,
    );
    this.penaltyLabelP2 = this.updatePenaltyLabel(
      this.penaltyLabelP2,
      this.stateP2,
      this.carP2,
    );
  }

  private updatePenaltyLabel(
    existing: THREE.Sprite | null,
    state: CarState,
    car: THREE.Group,
  ): THREE.Sprite | null {
    if (state.penaltyTimer > 0) {
      if (!existing) {
        existing = this.createTextSprite('PENALTY', COLORS.DANGER);
        this.addToScene(existing);
      }
      existing.position.set(car.position.x, 2.2, car.position.z);
      existing.visible = true;
    } else if (existing) {
      existing.visible = false;
    }
    return existing;
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
