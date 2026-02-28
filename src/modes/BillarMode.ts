import * as THREE from 'three';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

// --- Table geometry ---
const FELT_HW = 6;
const FELT_HD = 3;
const CUSHION_W = 0.5;
const TABLE_Y = 1;

// --- Ball physics ---
const BALL_R = 0.18;
const FRICTION = 0.985;
const MIN_VEL = 0.015;
const WALL_REST = 0.78;
const BALL_REST = 0.92;
const POCKET_R = 0.42;
const POWER_MIN = 4;
const POWER_MAX = 18;

// --- Controls ---
const AIM_SPEED = 2.0;
const POWER_SPEED = 0.8;

// --- Gameplay ---
const SETTLE_DELAY = 0.3;
const CUE_START_X = -3;

const POOL_BALL_COLORS: readonly number[] = [
  0xf5f0e8, // 0 cue (white)
  0xffcc00, // 1 yellow
  0x3366cc, // 2 blue
  0xcc3322, // 3 red
  0x9944aa, // 4 purple
  0xff8800, // 5 orange
  0x228844, // 6 green
  0x884422, // 7 brown
];

const POCKET_POSITIONS: ReadonlyArray<{ x: number; z: number }> = [
  { x: -FELT_HW + 0.1, z: -FELT_HD + 0.1 },
  { x: 0, z: -FELT_HD - 0.05 },
  { x: FELT_HW - 0.1, z: -FELT_HD + 0.1 },
  { x: -FELT_HW + 0.1, z: FELT_HD - 0.1 },
  { x: 0, z: FELT_HD + 0.05 },
  { x: FELT_HW - 0.1, z: FELT_HD - 0.1 },
];

const RACK_OFFSETS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [1, -0.5],
  [1, 0.5],
  [2, -1],
  [2, 0],
  [2, 1],
  [3, -0.5],
];

// --- Internal types ---
interface PoolBall {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  color: number;
  alive: boolean;
  sinking: boolean;
  sinkTimer: number;
  mesh: THREE.Mesh;
}

type TurnOwner = 'P1' | 'P2';
type TurnPhase = 'AIM' | 'ROLLING';

export class BillarMode extends GameMode {
  private balls: PoolBall[] = [];
  private currentTurn: TurnOwner = 'P1';
  private phase: TurnPhase = 'AIM';
  private aimAngle = 0;
  private power = 0.5;
  private settleTimer = 0;
  private ballPocketed = false;
  private cueScratched = false;
  private aimLine!: THREE.Line;
  private powerMesh!: THREE.Mesh;
  private turnRing!: THREE.Mesh;
  private sceneObjects: THREE.Object3D[] = [];
  private readonly ballY = TABLE_Y + 0.15 + BALL_R;

  // ─── Lifecycle ────────────────────────────────────────────

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.currentTurn = 'P1';
    this.phase = 'AIM';
    this.aimAngle = 0;
    this.power = 0.5;
    this.settleTimer = 0;
    this.ballPocketed = false;
    this.cueScratched = false;
    this.balls = [];
    this.sceneObjects = [];

    this.engine.clearScene();
    this.setupCamera();
    this.addLighting(0xeeeedd);
    this.createRoom();
    this.createTable();
    this.createPocketHoles();
    this.createBalls();
    this.createAimVisuals();
  }

  public update(delta: number): void {
    if (!this.isActive) {return;}

    if (this.phase === 'AIM') {
      this.updateAiming(delta);
    } else {
      this.updatePhysics(delta);
      this.checkPockets();

      if (this.allStopped() && !this.anySinking()) {
        this.settleTimer += delta;
        if (this.settleTimer >= SETTLE_DELAY) {
          this.resolveTurn();
        }
      } else {
        this.settleTimer = 0;
      }
    }

    this.updateSinking(delta);
    this.updateVisuals();
  }

  public cleanup(): void {
    for (const obj of this.sceneObjects) {
      this.engine.scene.remove(obj);
    }
    this.sceneObjects = [];
    this.balls = [];
  }

  // ─── Scene helpers ────────────────────────────────────────

  private addToScene(obj: THREE.Object3D): void {
    this.engine.scene.add(obj);
    this.sceneObjects.push(obj);
  }

  private setupCamera(): void {
    this.engine.camera.position.set(0, 11, 6);
    this.engine.camera.lookAt(0, TABLE_Y, 0);
  }

  private createRoom(): void {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.7,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addToScene(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2020, roughness: 0.8 });
    const backGeo = new THREE.PlaneGeometry(24, 8);
    const backWall = new THREE.Mesh(backGeo, wallMat);
    backWall.position.set(0, 4, -9);
    backWall.receiveShadow = true;
    this.addToScene(backWall);

    const sideGeo = new THREE.PlaneGeometry(18, 8);
    for (const xSign of [-1, 1]) {
      const wall = new THREE.Mesh(sideGeo, wallMat);
      wall.position.set(xSign * 12, 4, 0);
      wall.rotation.y = -xSign * Math.PI / 2;
      this.addToScene(wall);
    }

    // Overhead lamp
    const lampGeo = new THREE.BoxGeometry(8, 0.1, 4);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffee,
      emissiveIntensity: 1.2,
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, 5, 0);
    this.addToScene(lamp);

    const overLight = new THREE.PointLight(0xffeedd, 2, 20);
    overLight.position.set(0, 4.5, 0);
    overLight.castShadow = true;
    this.addToScene(overLight);
  }

  private createTable(): void {
    // Felt surface
    const feltGeo = new THREE.BoxGeometry(FELT_HW * 2, 0.1, FELT_HD * 2);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x0d5e2e,
      roughness: 0.85,
    });
    const felt = new THREE.Mesh(feltGeo, feltMat);
    felt.position.set(0, TABLE_Y + 0.1, 0);
    felt.receiveShadow = true;
    this.addToScene(felt);

    // Table body
    const surfW = FELT_HW * 2 + CUSHION_W * 2;
    const surfD = FELT_HD * 2 + CUSHION_W * 2;
    const frameGeo = new THREE.BoxGeometry(surfW, TABLE_Y, surfD);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a1e,
      roughness: 0.6,
      metalness: 0.1,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, TABLE_Y / 2, 0);
    frame.castShadow = true;
    this.addToScene(frame);

    // Cushions
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x2d8e4e,
      roughness: 0.5,
    });
    const cushionH = 0.2;
    const cushionY = TABLE_Y + 0.15 + cushionH / 2;

    // Top & bottom (along X)
    const hCushionGeo = new THREE.BoxGeometry(FELT_HW * 2, cushionH, CUSHION_W);
    for (const zSign of [-1, 1]) {
      const c = new THREE.Mesh(hCushionGeo, cushionMat);
      c.position.set(0, cushionY, zSign * (FELT_HD + CUSHION_W / 2));
      c.castShadow = true;
      this.addToScene(c);
    }

    // Left & right (along Z)
    const vCushionGeo = new THREE.BoxGeometry(CUSHION_W, cushionH, FELT_HD * 2);
    for (const xSign of [-1, 1]) {
      const c = new THREE.Mesh(vCushionGeo, cushionMat);
      c.position.set(xSign * (FELT_HW + CUSHION_W / 2), cushionY, 0);
      c.castShadow = true;
      this.addToScene(c);
    }

    // Wood rail strips
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x6b4226,
      roughness: 0.4,
      metalness: 0.15,
    });
    const railH = 0.08;
    const railY = TABLE_Y + 0.15 + cushionH + railH / 2;

    const hRailGeo = new THREE.BoxGeometry(surfW, railH, CUSHION_W);
    for (const zSign of [-1, 1]) {
      const r = new THREE.Mesh(hRailGeo, railMat);
      r.position.set(0, railY, zSign * (FELT_HD + CUSHION_W / 2));
      this.addToScene(r);
    }
    const vRailGeo = new THREE.BoxGeometry(CUSHION_W, railH, surfD);
    for (const xSign of [-1, 1]) {
      const r = new THREE.Mesh(vRailGeo, railMat);
      r.position.set(xSign * (FELT_HW + CUSHION_W / 2), railY, 0);
      this.addToScene(r);
    }

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, TABLE_Y - 0.01, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x3a2010,
      roughness: 0.5,
      metalness: 0.2,
    });
    for (const [lx, lz] of [
      [-FELT_HW - 0.2, -FELT_HD - 0.2],
      [-FELT_HW - 0.2, FELT_HD + 0.2],
      [FELT_HW + 0.2, -FELT_HD - 0.2],
      [FELT_HW + 0.2, FELT_HD + 0.2],
    ] as const) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, (TABLE_Y - 0.01) / 2, lz);
      leg.castShadow = true;
      this.addToScene(leg);
    }
  }

  private createPocketHoles(): void {
    const holeGeo = new THREE.CylinderGeometry(POCKET_R, POCKET_R, 0.12, 24);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    for (const p of POCKET_POSITIONS) {
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(p.x, TABLE_Y + 0.05, p.z);
      this.addToScene(hole);
    }
  }

  // ─── Ball creation ────────────────────────────────────────

  private createBalls(): void {
    this.balls = [];

    // Cue ball
    this.balls.push(this.makeBall(0, CUE_START_X, 0, POOL_BALL_COLORS[0]));

    // Object balls in rack
    const rackX = 3;
    const spacing = BALL_R * 2.2;
    for (let i = 0; i < 7; i++) {
      const off = RACK_OFFSETS[i];
      const bx = rackX + off[0] * spacing;
      const bz = off[1] * spacing;
      this.balls.push(this.makeBall(i + 1, bx, bz, POOL_BALL_COLORS[i + 1]));
    }
  }

  private makeBall(id: number, x: number, z: number, color: number): PoolBall {
    const geo = new THREE.SphereGeometry(BALL_R, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, this.ballY, z);
    mesh.castShadow = true;
    this.addToScene(mesh);
    return { id, x, z, vx: 0, vz: 0, color, alive: true, sinking: false, sinkTimer: 0, mesh };
  }

  // ─── Aim visuals ──────────────────────────────────────────

  private createAimVisuals(): void {
    // Aim direction line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3, 0, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: COLORS.P1,
      transparent: true,
      opacity: 0.8,
    });
    this.aimLine = new THREE.Line(lineGeo, lineMat);
    this.aimLine.position.y = this.ballY;
    this.addToScene(this.aimLine);

    // Power bar (small floating bar)
    const barGeo = new THREE.BoxGeometry(2, 0.08, 0.15);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.5,
    });
    this.powerMesh = new THREE.Mesh(barGeo, barMat);
    this.powerMesh.position.y = this.ballY + 0.5;
    this.addToScene(this.powerMesh);

    // Turn ring around cue ball
    const ringGeo = new THREE.TorusGeometry(BALL_R + 0.08, 0.03, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.P1,
      emissive: COLORS.P1,
      emissiveIntensity: 0.8,
    });
    this.turnRing = new THREE.Mesh(ringGeo, ringMat);
    this.turnRing.rotation.x = Math.PI / 2;
    this.turnRing.position.y = this.ballY;
    this.addToScene(this.turnRing);
  }

  // ─── Aiming ───────────────────────────────────────────────

  private updateAiming(delta: number): void {
    const cue = this.balls[0];
    if (!cue?.alive) {return;}

    const controls = this.currentTurn === 'P1' ? P1_CONTROLS : P2_CONTROLS;
    const input = this.engine.input;

    if (input.isDown(controls.left)) {this.aimAngle -= AIM_SPEED * delta;}
    if (input.isDown(controls.right)) {this.aimAngle += AIM_SPEED * delta;}
    if (input.isDown(controls.up)) {this.power = Math.min(1, this.power + POWER_SPEED * delta);}
    if (input.isDown(controls.down)) {this.power = Math.max(0.05, this.power - POWER_SPEED * delta);}

    if (input.wasPressed(controls.action1)) {
      this.fireShot();
    }
  }

  private fireShot(): void {
    const cue = this.balls[0];
    if (!cue?.alive) {return;}

    const vel = POWER_MIN + (POWER_MAX - POWER_MIN) * this.power;
    cue.vx = Math.cos(this.aimAngle) * vel;
    cue.vz = Math.sin(this.aimAngle) * vel;

    this.phase = 'ROLLING';
    this.settleTimer = 0;
    this.ballPocketed = false;
    this.cueScratched = false;
  }

  // ─── Physics ──────────────────────────────────────────────

  private updatePhysics(delta: number): void {
    const f = Math.pow(FRICTION, delta * 60);

    for (const b of this.balls) {
      if (!b.alive || b.sinking) {continue;}

      b.x += b.vx * delta * 60;
      b.z += b.vz * delta * 60;
      b.vx *= f;
      b.vz *= f;

      const spd = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      if (spd < MIN_VEL) {
        b.vx = 0;
        b.vz = 0;
      }

      // Wall bounces
      if (b.x - BALL_R < -FELT_HW) {
        b.x = -FELT_HW + BALL_R;
        b.vx = -b.vx * WALL_REST;
      }
      if (b.x + BALL_R > FELT_HW) {
        b.x = FELT_HW - BALL_R;
        b.vx = -b.vx * WALL_REST;
      }
      if (b.z - BALL_R < -FELT_HD) {
        b.z = -FELT_HD + BALL_R;
        b.vz = -b.vz * WALL_REST;
      }
      if (b.z + BALL_R > FELT_HD) {
        b.z = FELT_HD - BALL_R;
        b.vz = -b.vz * WALL_REST;
      }
    }

    // Ball-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i];
        const b = this.balls[j];
        if (!a || !b || !a.alive || !b.alive || a.sinking || b.sinking) {continue;}

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minD = BALL_R * 2;

        if (dist < minD && dist > 0) {
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = minD - dist;
          a.x -= nx * overlap * 0.5;
          a.z -= nz * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.z += nz * overlap * 0.5;

          const dvx = a.vx - b.vx;
          const dvz = a.vz - b.vz;
          const dvn = dvx * nx + dvz * nz;
          if (dvn > 0) {
            a.vx -= dvn * nx * BALL_REST;
            a.vz -= dvn * nz * BALL_REST;
            b.vx += dvn * nx * BALL_REST;
            b.vz += dvn * nz * BALL_REST;
          }
        }
      }
    }
  }

  // ─── Pockets & sinking ───────────────────────────────────

  private checkPockets(): void {
    for (const b of this.balls) {
      if (!b.alive || b.sinking) {continue;}
      for (const p of POCKET_POSITIONS) {
        const dx = b.x - p.x;
        const dz = b.z - p.z;
        if (Math.sqrt(dx * dx + dz * dz) < POCKET_R) {
          this.sinkBall(b);
          break;
        }
      }
    }
  }

  private sinkBall(ball: PoolBall): void {
    ball.sinking = true;
    ball.sinkTimer = 0.3;
    ball.vx = 0;
    ball.vz = 0;

    if (ball.id === 0) {
      this.cueScratched = true;
      if (this.currentTurn === 'P1') {this.scoreP1 -= 1;}
      else {this.scoreP2 -= 1;}
    } else {
      this.ballPocketed = true;
      if (this.currentTurn === 'P1') {this.scoreP1 += 1;}
      else {this.scoreP2 += 1;}
    }
  }

  private updateSinking(delta: number): void {
    for (const b of this.balls) {
      if (!b.sinking) {continue;}
      b.sinkTimer -= delta;
      b.mesh.scale.setScalar(Math.max(0, b.sinkTimer / 0.3));

      if (b.sinkTimer <= 0) {
        b.sinking = false;
        if (b.id === 0) {
          this.respawnCueBall(b);
        } else {
          b.alive = false;
          b.mesh.visible = false;
        }
      }
    }
  }

  private respawnCueBall(cue: PoolBall): void {
    cue.alive = true;
    cue.x = CUE_START_X;
    cue.z = 0;
    cue.vx = 0;
    cue.vz = 0;
    cue.mesh.visible = true;
    cue.mesh.scale.setScalar(1);

    // Unstick from other balls
    for (const other of this.balls) {
      if (other === cue || !other.alive) {continue;}
      const dx = cue.x - other.x;
      const dz = cue.z - other.z;
      if (Math.sqrt(dx * dx + dz * dz) < BALL_R * 3) {
        cue.z += BALL_R * 3;
      }
    }
  }

  // ─── Turn resolution ──────────────────────────────────────

  private allStopped(): boolean {
    for (const b of this.balls) {
      if (!b.alive || b.sinking) {continue;}
      if (Math.abs(b.vx) > 0.01 || Math.abs(b.vz) > 0.01) {return false;}
    }
    return true;
  }

  private anySinking(): boolean {
    return this.balls.some((b) => b.sinking);
  }

  private allObjectBallsSunk(): boolean {
    for (let i = 1; i < this.balls.length; i++) {
      if (this.balls[i]?.alive) { return false; }
    }
    return true;
  }

  private resolveTurn(): void {
    // Reset rack if all object balls are sunk
    if (this.allObjectBallsSunk()) {
      this.resetObjectBalls();
    }

    if (this.cueScratched) {
      this.currentTurn = this.currentTurn === 'P1' ? 'P2' : 'P1';
    } else if (!this.ballPocketed) {
      this.currentTurn = this.currentTurn === 'P1' ? 'P2' : 'P1';
    }
    // If ballPocketed && !cueScratched → extra turn (same player)

    this.phase = 'AIM';
    this.power = 0.5;
    this.settleTimer = 0;
    this.ballPocketed = false;
    this.cueScratched = false;
  }

  private resetObjectBalls(): void {
    const rackX = 3;
    const spacing = BALL_R * 2.2;
    for (let i = 0; i < 7; i++) {
      const ball = this.balls[i + 1];
      if (!ball) {continue;}
      const off = RACK_OFFSETS[i];
      ball.x = rackX + off[0] * spacing;
      ball.z = off[1] * spacing;
      ball.vx = 0;
      ball.vz = 0;
      ball.alive = true;
      ball.sinking = false;
      ball.mesh.visible = true;
      ball.mesh.scale.setScalar(1);
    }
  }

  // ─── Visuals update ───────────────────────────────────────

  private updateVisuals(): void {
    // Sync ball mesh positions
    for (const b of this.balls) {
      if (!b.alive && !b.sinking) {continue;}
      b.mesh.position.set(b.x, this.ballY, b.z);
    }

    const cue = this.balls[0];
    if (!cue) {return;}

    const turnColor = this.currentTurn === 'P1' ? COLORS.P1 : COLORS.P2;

    if (this.phase === 'AIM' && cue.alive) {
      this.aimLine.visible = true;
      this.powerMesh.visible = true;
      this.turnRing.visible = true;

      // Aim line
      const lineLen = 1 + this.power * 4;
      const positions = this.aimLine.geometry.attributes.position;
      if (positions) {
        positions.setXYZ(0, cue.x, 0, cue.z);
        positions.setXYZ(
          1,
          cue.x + Math.cos(this.aimAngle) * lineLen,
          0,
          cue.z + Math.sin(this.aimAngle) * lineLen,
        );
        positions.needsUpdate = true;
      }
      (this.aimLine.material as THREE.LineBasicMaterial).color.setHex(turnColor);

      // Power bar
      const barScale = 0.1 + this.power * 0.9;
      this.powerMesh.scale.set(barScale, 1, 1);
      this.powerMesh.position.set(cue.x, this.ballY + 0.5, cue.z - 0.5);

      // Turn ring
      this.turnRing.position.set(cue.x, this.ballY, cue.z);
      (this.turnRing.material as THREE.MeshStandardMaterial).color.setHex(turnColor);
      (this.turnRing.material as THREE.MeshStandardMaterial).emissive.setHex(turnColor);
    } else {
      this.aimLine.visible = false;
      this.powerMesh.visible = false;
      this.turnRing.visible = this.phase === 'ROLLING';
      if (this.turnRing.visible) {
        this.turnRing.position.set(cue.x, this.ballY, cue.z);
      }
    }
  }
}
