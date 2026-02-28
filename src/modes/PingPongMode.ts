import * as THREE from 'three';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

const TABLE_WIDTH = 12;
const TABLE_DEPTH = 8;
const TABLE_Y = 1;
const PADDLE_X = 5.5;
const PADDLE_HALF_DEPTH = 1;
const BALL_RADIUS = 0.15;
const BALL_START_SPEED = 8;
const BALL_MAX_SPEED = 25;
const BALL_SPEED_MULTIPLIER = 1.1;
const PADDLE_SPEED = 12;
const Z_BOUND = 3.5;
const SCORE_X = 6;
const TRAIL_COUNT = 8;

interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
}

export class PingPongMode extends GameMode {
  private paddleP1!: THREE.Mesh;
  private paddleP2!: THREE.Mesh;
  private ballMesh!: THREE.Mesh;
  private ballState: BallState = { x: 0, y: 0, z: 0, vx: 0, vz: 0, speed: BALL_START_SPEED };
  private trailMeshes: THREE.Mesh[] = [];
  private trailPositions: THREE.Vector3[] = [];
  private sceneObjects: THREE.Object3D[] = [];

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.engine.clearScene();
    this.sceneObjects = [];
    this.trailMeshes = [];
    this.trailPositions = [];

    this.setupCamera();
    this.addLighting(0xeeeeff);
    this.createFloor();
    this.createTable();
    this.createNet();
    this.createTableLegs();
    this.createPaddles();
    this.createBall();
    this.createTrail();
    this.resetBall();
  }

  public update(delta: number): void {
    if (!this.isActive) return;

    this.updatePaddles(delta);
    this.updateBall(delta);
    this.updateTrail();
    this.checkScore();
  }

  public cleanup(): void {
    for (const obj of this.sceneObjects) {
      this.engine.scene.remove(obj);
    }
    this.sceneObjects = [];
    this.trailMeshes = [];
    this.trailPositions = [];
  }

  private addToScene(obj: THREE.Object3D): void {
    this.engine.scene.add(obj);
    this.sceneObjects.push(obj);
  }

  private setupCamera(): void {
    this.engine.camera.position.set(0, 8, 12);
    this.engine.camera.lookAt(0, TABLE_Y, 0);
  }

  private createFloor(): void {
    const geo = new THREE.PlaneGeometry(30, 30);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.addToScene(floor);
  }

  private createTable(): void {
    // Table surface
    const tableGeo = new THREE.BoxGeometry(TABLE_WIDTH, 0.3, TABLE_DEPTH);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x006633,
      roughness: 0.4,
      metalness: 0.05,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = TABLE_Y;
    table.receiveShadow = true;
    table.castShadow = true;
    this.addToScene(table);

    // White edge lines
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

    // Long edges (along X)
    for (const zSide of [-1, 1]) {
      const edgeGeo = new THREE.BoxGeometry(TABLE_WIDTH, 0.02, 0.05);
      const edge = new THREE.Mesh(edgeGeo, lineMat);
      edge.position.set(0, TABLE_Y + 0.16, zSide * (TABLE_DEPTH / 2));
      this.addToScene(edge);
    }

    // Short edges (along Z)
    for (const xSide of [-1, 1]) {
      const edgeGeo = new THREE.BoxGeometry(0.05, 0.02, TABLE_DEPTH);
      const edge = new THREE.Mesh(edgeGeo, lineMat);
      edge.position.set(xSide * (TABLE_WIDTH / 2), TABLE_Y + 0.16, 0);
      this.addToScene(edge);
    }

    // Center line (along Z)
    const centerGeo = new THREE.BoxGeometry(0.03, 0.02, TABLE_DEPTH);
    const centerLine = new THREE.Mesh(centerGeo, lineMat);
    centerLine.position.set(0, TABLE_Y + 0.16, 0);
    this.addToScene(centerLine);
  }

  private createNet(): void {
    const netGeo = new THREE.BoxGeometry(0.05, 0.5, TABLE_DEPTH + 0.4);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, TABLE_Y + 0.4, 0);
    net.castShadow = true;
    this.addToScene(net);

    // Net posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    for (const zSide of [-1, 1]) {
      const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, TABLE_Y + 0.5, zSide * (TABLE_DEPTH / 2 + 0.2));
      post.castShadow = true;
      this.addToScene(post);
    }
  }

  private createTableLegs(): void {
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, TABLE_Y - 0.15, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 });
    const halfW = TABLE_WIDTH / 2 - 0.4;
    const halfD = TABLE_DEPTH / 2 - 0.4;

    for (const [lx, lz] of [[-halfW, -halfD], [-halfW, halfD], [halfW, -halfD], [halfW, halfD]]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, (TABLE_Y - 0.15) / 2, lz);
      leg.castShadow = true;
      this.addToScene(leg);
    }
  }

  private createPaddles(): void {
    const paddleGeo = new THREE.BoxGeometry(0.3, 0.8, 2);
    const surfaceY = TABLE_Y + 0.15 + 0.4;

    const matP1 = new THREE.MeshStandardMaterial({
      color: COLORS.P1,
      roughness: 0.3,
      metalness: 0.1,
      emissive: COLORS.P1,
      emissiveIntensity: 0.15,
    });
    this.paddleP1 = new THREE.Mesh(paddleGeo, matP1);
    this.paddleP1.position.set(-PADDLE_X, surfaceY, 0);
    this.paddleP1.castShadow = true;
    this.addToScene(this.paddleP1);

    const matP2 = new THREE.MeshStandardMaterial({
      color: COLORS.P2,
      roughness: 0.3,
      metalness: 0.1,
      emissive: COLORS.P2,
      emissiveIntensity: 0.15,
    });
    this.paddleP2 = new THREE.Mesh(paddleGeo, matP2);
    this.paddleP2.position.set(PADDLE_X, surfaceY, 0);
    this.paddleP2.castShadow = true;
    this.addToScene(this.paddleP2);
  }

  private createBall(): void {
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0xff6600,
      emissiveIntensity: 0.3,
    });
    this.ballMesh = new THREE.Mesh(geo, mat);
    this.ballMesh.castShadow = true;
    this.addToScene(this.ballMesh);
  }

  private createTrail(): void {
    const geo = new THREE.SphereGeometry(BALL_RADIUS * 0.6, 8, 8);
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.3 * (1 - i / TRAIL_COUNT),
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.addToScene(mesh);
      this.trailMeshes.push(mesh);
      this.trailPositions.push(new THREE.Vector3());
    }
  }

  private resetBall(serveToward: 'P1' | 'P2' | null = null): void {
    let direction: number;
    if (serveToward === 'P1') {
      direction = -1;
    } else if (serveToward === 'P2') {
      direction = 1;
    } else {
      direction = Math.random() < 0.5 ? -1 : 1;
    }
    const zAngle = (Math.random() - 0.5) * 0.8;

    this.ballState = {
      x: 0,
      y: TABLE_Y + 0.15 + BALL_RADIUS,
      z: 0,
      vx: direction * Math.cos(zAngle),
      vz: Math.sin(zAngle),
      speed: BALL_START_SPEED,
    };

    // Normalize direction
    const len = Math.sqrt(this.ballState.vx ** 2 + this.ballState.vz ** 2);
    this.ballState.vx /= len;
    this.ballState.vz /= len;

    // Hide trail
    for (const t of this.trailMeshes) {
      t.visible = false;
    }
    for (const p of this.trailPositions) {
      p.set(0, this.ballState.y, 0);
    }
  }

  private updatePaddles(delta: number): void {
    const input = this.engine.input;
    const move = PADDLE_SPEED * delta;
    const zMin = -(Z_BOUND - PADDLE_HALF_DEPTH);
    const zMax = Z_BOUND - PADDLE_HALF_DEPTH;

    // P1 paddle (up/down mapped to Z axis)
    if (input.isDown(P1_CONTROLS.up)) {
      this.paddleP1.position.z = Math.max(this.paddleP1.position.z - move, zMin);
    }
    if (input.isDown(P1_CONTROLS.down)) {
      this.paddleP1.position.z = Math.min(this.paddleP1.position.z + move, zMax);
    }

    // P2 paddle
    if (input.isDown(P2_CONTROLS.up)) {
      this.paddleP2.position.z = Math.max(this.paddleP2.position.z - move, zMin);
    }
    if (input.isDown(P2_CONTROLS.down)) {
      this.paddleP2.position.z = Math.min(this.paddleP2.position.z + move, zMax);
    }
  }

  private updateBall(delta: number): void {
    const bs = this.ballState;
    bs.x += bs.vx * bs.speed * delta;
    bs.z += bs.vz * bs.speed * delta;

    // Bounce off top/bottom walls (Z limits)
    if (bs.z <= -Z_BOUND) {
      bs.z = -Z_BOUND;
      bs.vz = Math.abs(bs.vz);
    } else if (bs.z >= Z_BOUND) {
      bs.z = Z_BOUND;
      bs.vz = -Math.abs(bs.vz);
    }

    // Paddle collision P1 (left paddle at -PADDLE_X)
    if (
      bs.vx < 0 &&
      bs.x - BALL_RADIUS <= -PADDLE_X + 0.15 &&
      bs.x + BALL_RADIUS >= -PADDLE_X - 0.15 &&
      bs.z >= this.paddleP1.position.z - PADDLE_HALF_DEPTH &&
      bs.z <= this.paddleP1.position.z + PADDLE_HALF_DEPTH
    ) {
      bs.x = -PADDLE_X + 0.15 + BALL_RADIUS;
      bs.vx = Math.abs(bs.vx);
      this.applyPaddleDeflection(this.paddleP1);
      this.accelerateBall();
    }

    // Paddle collision P2 (right paddle at +PADDLE_X)
    if (
      bs.vx > 0 &&
      bs.x + BALL_RADIUS >= PADDLE_X - 0.15 &&
      bs.x - BALL_RADIUS <= PADDLE_X + 0.15 &&
      bs.z >= this.paddleP2.position.z - PADDLE_HALF_DEPTH &&
      bs.z <= this.paddleP2.position.z + PADDLE_HALF_DEPTH
    ) {
      bs.x = PADDLE_X - 0.15 - BALL_RADIUS;
      bs.vx = -Math.abs(bs.vx);
      this.applyPaddleDeflection(this.paddleP2);
      this.accelerateBall();
    }

    this.ballMesh.position.set(bs.x, bs.y, bs.z);
  }

  private applyPaddleDeflection(paddle: THREE.Mesh): void {
    const bs = this.ballState;
    const relativeZ = (bs.z - paddle.position.z) / PADDLE_HALF_DEPTH;
    bs.vz = relativeZ * 0.8;

    // Re-normalize direction
    const len = Math.sqrt(bs.vx ** 2 + bs.vz ** 2);
    if (len > 0) {
      bs.vx /= len;
      bs.vz /= len;
    }
  }

  private accelerateBall(): void {
    this.ballState.speed = Math.min(this.ballState.speed * BALL_SPEED_MULTIPLIER, BALL_MAX_SPEED);
  }

  private updateTrail(): void {
    // Shift trail positions
    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i].copy(this.trailPositions[i - 1]);
    }
    if (this.trailPositions.length > 0) {
      this.trailPositions[0].set(this.ballState.x, this.ballState.y, this.ballState.z);
    }

    for (let i = 0; i < this.trailMeshes.length; i++) {
      const mesh = this.trailMeshes[i];
      const pos = this.trailPositions[i];
      if (pos) {
        mesh.position.copy(pos);
        mesh.visible = true;
      }
    }
  }

  private checkScore(): void {
    const bs = this.ballState;

    if (bs.x < -SCORE_X) {
      // Ball passed P1's side → P2 scores
      this.scoreP2++;
      this.resetBall('P2');
    } else if (bs.x > SCORE_X) {
      // Ball passed P2's side → P1 scores
      this.scoreP1++;
      this.resetBall('P1');
    }
  }
}
