import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

interface PlayerState {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  aimAngle: number;
  charging: boolean;
  chargeTime: number;
  aimLine: THREE.Line;
  powerLine: THREE.Line;
  startX: number;
  startZ: number;
  scored: boolean;
  strokes: number;
}

export class GolfMode extends GameMode {
  private p1!: PlayerState;
  private p2!: PlayerState;

  // Course elements
  private groundBody!: CANNON.Body;
  private wallBodies: CANNON.Body[] = [];
  private obstacleBodies: CANNON.Body[] = [];
  private obstacleMeshes: THREE.Object3D[] = [];

  // Shared physics material
  private readonly wallMaterial = new CANNON.Material({ restitution: 0.8 });

  // Hole — spec: (X=0, Y=20.5) mapped to Three.js (x=0, z=-20.5)
  private readonly HOLE_X = 0;
  private readonly HOLE_Z = -20.5;
  private readonly HOLE_RADIUS = 0.2;

  // Ball
  private readonly BALL_RADIUS = 0.1;
  private readonly MAX_CHARGE = 2;
  private readonly MAX_POWER = 18;
  private readonly STROKE_SCORES = [10, 7, 5, 3, 2, 1];

  // Course layout constants
  private readonly WALL_HEIGHT = 0.35;
  private readonly WALL_THICKNESS = 0.25;
  private readonly BARRIER_HEIGHT = 0.3;
  private readonly BARRIER_THICKNESS = 0.3;
  private readonly WALL_COLOR = 0x404040;
  private readonly SURFACE_COLOR = 0x44dd44;

  // Reset cooldown
  private p1ResetTimer: ReturnType<typeof setTimeout> | null = null;
  private p2ResetTimer: ReturnType<typeof setTimeout> | null = null;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.wallBodies = [];
    this.obstacleBodies = [];
    this.obstacleMeshes = [];
    this.p1ResetTimer = null;
    this.p2ResetTimer = null;

    this.setupCamera();
    this.addLighting(0x88ff88);
    this.createGround();
    this.createSurroundingTerrain();
    this.createCourseSurface();
    this.createPerimeterWalls();
    this.createSection1Obstacles();
    this.createSection2Obstacles();
    this.createSection3Obstacles();
    this.createHole();
    this.p1 = this.createPlayer(COLORS.P1, -0.5, -1);
    this.p2 = this.createPlayer(COLORS.P2, 0.5, -1);
  }

  public update(delta: number): void {
    if (!this.isActive) {
      return;
    }

    this.updatePlayer(this.p1, P1_CONTROLS, delta);
    this.updatePlayer(this.p2, P2_CONTROLS, delta);

    this.engine.syncPhysics();

    // Keep balls on ground
    this.clampBall(this.p1);
    this.clampBall(this.p2);

    // Check scoring
    this.checkHole(this.p1, 'P1');
    this.checkHole(this.p2, 'P2');

    // Update visual elements
    this.updateAimVisual(this.p1);
    this.updateAimVisual(this.p2);
  }

  public cleanup(): void {
    if (this.p1ResetTimer !== null) {
      clearTimeout(this.p1ResetTimer);
      this.p1ResetTimer = null;
    }
    if (this.p2ResetTimer !== null) {
      clearTimeout(this.p2ResetTimer);
      this.p2ResetTimer = null;
    }
    this.wallBodies = [];
    this.obstacleBodies = [];
    this.obstacleMeshes = [];
    this.engine.clearScene();
  }

  // --- Camera ---

  private setupCamera(): void {
    this.engine.camera.position.set(0, 28, 8);
    this.engine.camera.lookAt(0, 0, -11);
  }

  // --- Ground & Terrain ---

  private createGround(): void {
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.engine.world.addBody(this.groundBody);
  }

  private createSurroundingTerrain(): void {
    const grassGeo = new THREE.PlaneGeometry(60, 60);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4a8a2a,
      roughness: 1,
      metalness: 0,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.set(0, -0.01, -11);
    grassMesh.receiveShadow = true;
    this.engine.scene.add(grassMesh);
  }

  // --- Course Surface ---

  private createCourseSurface(): void {
    // Shape coords: X = world X, Y = -world Z (rotation maps Y → -Z)
    const shape = new THREE.Shape();
    shape.moveTo(1.5, 0);
    shape.lineTo(1.5, 14);
    shape.lineTo(3, 18);
    shape.lineTo(4, 18);
    shape.lineTo(4, 22);
    shape.lineTo(-4, 22);
    shape.lineTo(-4, 18);
    shape.lineTo(-3, 18);
    shape.lineTo(-1.5, 14);
    shape.lineTo(-1.5, 0);
    shape.closePath();

    // Bright green felt playing surface
    const surfaceGeo = new THREE.ShapeGeometry(shape);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: this.SURFACE_COLOR,
      roughness: 0.9,
      metalness: 0,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.y = 0.01;
    surfaceMesh.receiveShadow = true;
    this.engine.scene.add(surfaceMesh);

    // Dark border base slightly larger than the playing surface
    const border = 0.3;
    const baseShape = new THREE.Shape();
    baseShape.moveTo(1.5 + border, -border);
    baseShape.lineTo(1.5 + border, 14);
    baseShape.lineTo(3 + border, 18);
    baseShape.lineTo(4 + border, 18);
    baseShape.lineTo(4 + border, 22 + border);
    baseShape.lineTo(-4 - border, 22 + border);
    baseShape.lineTo(-4 - border, 18);
    baseShape.lineTo(-3 - border, 18);
    baseShape.lineTo(-1.5 - border, 14);
    baseShape.lineTo(-1.5 - border, -border);
    baseShape.closePath();

    const baseGeo = new THREE.ShapeGeometry(baseShape);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -0.005;
    baseMesh.receiveShadow = true;
    this.engine.scene.add(baseMesh);
  }

  // --- Perimeter Walls ---

  private createPerimeterWalls(): void {
    const wh = this.WALL_HEIGHT;
    const wt = this.WALL_THICKNESS;
    const c = this.WALL_COLOR;

    // Back wall (start, at z ≈ 0)
    this.addWall(3.5, wh, wt, 0, wh / 2, wt / 2, c);

    // Right wall: entrance + maze (z=0 → z=-14)
    this.addWall(wt, wh, 14.5, 1.5 + wt / 2, wh / 2, -7, c);

    // Right funnel (z=-14 → z=-18, angled)
    this.addWallSegment(1.5, -14, 3, -18, wh, wt, c);

    // Right step at z=-18 (bridges funnel → green)
    this.addWall(1.5, wh, wt, 3.5, wh / 2, -18, c);

    // Right green wall (z=-18 → z=-22)
    this.addWall(wt, wh, 4.5, 4 + wt / 2, wh / 2, -20, c);

    // Far wall (end)
    this.addWall(8.5, wh, wt, 0, wh / 2, -22 - wt / 2, c);

    // Left green wall (z=-22 → z=-18)
    this.addWall(wt, wh, 4.5, -4 - wt / 2, wh / 2, -20, c);

    // Left step at z=-18
    this.addWall(1.5, wh, wt, -3.5, wh / 2, -18, c);

    // Left funnel (z=-18 → z=-14, angled)
    this.addWallSegment(-3, -18, -1.5, -14, wh, wt, c);

    // Left wall: entrance + maze (z=-14 → z=0)
    this.addWall(wt, wh, 14.5, -1.5 - wt / 2, wh / 2, -7, c);
  }

  // --- Section 1: Entrance Corridor (z=0 → z=-6) ---

  private createSection1Obstacles(): void {
    // V-shaped angled walls narrowing the path
    // Wall A: from (-1, z=-3) to (0, z=-5)
    this.addWallSegment(-1, -3, 0, -5, this.BARRIER_HEIGHT, this.WALL_THICKNESS, this.WALL_COLOR);
    // Wall B: from (1, z=-3) to (0, z=-5)
    this.addWallSegment(1, -3, 0, -5, this.BARRIER_HEIGHT, this.WALL_THICKNESS, this.WALL_COLOR);
  }

  // --- Section 2: Central Maze (z=-6 → z=-14) ---

  private createSection2Obstacles(): void {
    const bh = this.BARRIER_HEIGHT;
    const bt = this.BARRIER_THICKNESS;
    const c = this.WALL_COLOR;

    // Zig-zag barriers alternating sides (gap ≈ 1 unit for ball)
    // Barrier 1 at z=-7: left-to-center, gap on right
    this.addObstacleWall(2.0, bh, bt, -0.5, bh / 2, -7, c);
    // Barrier 2 at z=-9: center-to-right, gap on left
    this.addObstacleWall(2.0, bh, bt, 0.5, bh / 2, -9, c);
    // Barrier 3 at z=-11: left-to-center, gap on right
    this.addObstacleWall(2.0, bh, bt, -0.5, bh / 2, -11, c);
    // Barrier 4 at z=-13: center-to-right, gap on left
    this.addObstacleWall(2.0, bh, bt, 0.5, bh / 2, -13, c);

    // Central ramp-shaped guide
    this.addObstacleWall(this.WALL_THICKNESS, bh, 1.5, 0, bh / 2, -10, c);
  }

  // --- Section 3: Transition Funnel (z=-14 → z=-18) ---

  private createSection3Obstacles(): void {
    // Two angled walls directing ball toward center
    this.addWallSegment(
      -1, -15, 0, -17.5, this.BARRIER_HEIGHT, this.WALL_THICKNESS, this.WALL_COLOR
    );
    this.addWallSegment(
      1, -15, 0, -17.5, this.BARRIER_HEIGHT, this.WALL_THICKNESS, this.WALL_COLOR
    );
  }

  // --- Wall Helpers ---

  private addWall(
    sx: number,
    sy: number,
    sz: number,
    px: number,
    py: number,
    pz: number,
    color: number
  ): void {
    const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
    const body = new CANNON.Body({ mass: 0, shape, material: this.wallMaterial });
    body.position.set(px, py, pz);
    this.engine.world.addBody(body);
    this.wallBodies.push(body);

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
  }

  private addWallSegment(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    height: number,
    thickness: number,
    color: number
  ): void {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(-dz, dx);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const shape = new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, thickness / 2));
    const body = new CANNON.Body({ mass: 0, shape, material: this.wallMaterial });
    body.position.set(cx, height / 2, cz);
    body.quaternion.setFromEuler(0, angle, 0);
    this.engine.world.addBody(body);
    this.wallBodies.push(body);

    const geo = new THREE.BoxGeometry(length, height, thickness);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, height / 2, cz);
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
  }

  private addObstacleWall(
    sx: number,
    sy: number,
    sz: number,
    px: number,
    py: number,
    pz: number,
    color: number
  ): void {
    const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
    const body = new CANNON.Body({ mass: 0, shape, material: this.wallMaterial });
    body.position.set(px, py, pz);
    this.engine.world.addBody(body);
    this.obstacleBodies.push(body);

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
    this.obstacleMeshes.push(mesh);
  }

  // --- Hole & Flag ---

  private createHole(): void {
    // Dark circle for the hole
    const holeGeo = new THREE.CircleGeometry(this.HOLE_RADIUS, 32);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 1,
    });
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.rotation.x = -Math.PI / 2;
    holeMesh.position.set(this.HOLE_X, 0.02, this.HOLE_Z);
    this.engine.scene.add(holeMesh);

    // White ring around hole
    const ringGeo = new THREE.RingGeometry(this.HOLE_RADIUS, this.HOLE_RADIUS + 0.08, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(this.HOLE_X, 0.025, this.HOLE_Z);
    this.engine.scene.add(ringMesh);

    // Flag pole
    const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(this.HOLE_X, 1.25, this.HOLE_Z);
    pole.castShadow = true;
    this.engine.scene.add(pole);

    // Flag (triangle)
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.6, 0.2);
    flagShape.lineTo(0, 0.4);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      side: THREE.DoubleSide,
      roughness: 0.4,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(this.HOLE_X, 2.1, this.HOLE_Z);
    flag.rotation.y = -Math.PI / 2;
    this.engine.scene.add(flag);
  }

  // --- Player Creation ---

  private createPlayer(color: number, startX: number, startZ: number): PlayerState {
    const mesh = this.createBallMesh(this.BALL_RADIUS, color);
    const body = this.createBallBody(this.BALL_RADIUS, startX, this.BALL_RADIUS, startZ, 1);
    body.linearDamping = 0.6;
    body.angularDamping = 0.6;
    this.engine.addPhysicsObject(mesh, body);

    const aimLine = this.createAimLine(color);
    const powerLine = this.createPowerLine(color);

    return {
      mesh,
      body,
      aimAngle: -Math.PI / 2, // aim toward hole by default
      charging: false,
      chargeTime: 0,
      aimLine,
      powerLine,
      startX,
      startZ,
      scored: false,
      strokes: 0,
    };
  }

  private createAimLine(color: number): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -2),
    ]);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(geometry, material);
    this.engine.scene.add(line);
    return line;
  }

  private createPowerLine(color: number): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.Line(geometry, material);
    this.engine.scene.add(line);
    return line;
  }

  // --- Update Logic ---

  private updatePlayer(
    player: PlayerState,
    controls: {
      up: string;
      down: string;
      left: string;
      right: string;
      action1: string;
      action2: string;
    },
    delta: number
  ): void {
    if (player.scored) {
      return;
    }

    const input = this.engine.input;

    // Aiming with directional keys
    const aimSpeed = 2.5;
    if (input.isDown(controls.left)) {
      player.aimAngle -= aimSpeed * delta;
    }
    if (input.isDown(controls.right)) {
      player.aimAngle += aimSpeed * delta;
    }
    if (input.isDown(controls.up)) {
      player.aimAngle = this.normalizeAngle(player.aimAngle);
      // Nudge toward -PI/2 (forward)
      player.aimAngle -= aimSpeed * 0.5 * delta;
    }
    if (input.isDown(controls.down)) {
      player.aimAngle = this.normalizeAngle(player.aimAngle);
      player.aimAngle += aimSpeed * 0.5 * delta;
    }

    // Charging with action1
    if (input.isDown(controls.action1)) {
      if (!player.charging) {
        player.charging = true;
        player.chargeTime = 0;
      }
      player.chargeTime = Math.min(player.chargeTime + delta, this.MAX_CHARGE);
    } else if (player.charging) {
      // Released - hit the ball
      this.hitBall(player);
      player.charging = false;
      player.chargeTime = 0;
    }
  }

  private hitBall(player: PlayerState): void {
    const power = (player.chargeTime / this.MAX_CHARGE) * this.MAX_POWER;
    const dirX = Math.cos(player.aimAngle);
    const dirZ = Math.sin(player.aimAngle);

    player.body.velocity.set(0, 0, 0);
    player.body.angularVelocity.set(0, 0, 0);
    player.body.applyImpulse(new CANNON.Vec3(dirX * power, 0, dirZ * power));
    player.strokes++;
  }

  private clampBall(player: PlayerState): void {
    if (player.body.position.y < this.BALL_RADIUS) {
      player.body.position.y = this.BALL_RADIUS;
      if (player.body.velocity.y < 0) {
        player.body.velocity.y = 0;
      }
    }
  }

  private checkHole(player: PlayerState, playerId: 'P1' | 'P2'): void {
    if (player.scored) {
      return;
    }

    const dx = player.body.position.x - this.HOLE_X;
    const dz = player.body.position.z - this.HOLE_Z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < this.HOLE_RADIUS) {
      player.scored = true;
      const idx = Math.min(Math.max(player.strokes - 1, 0), this.STROKE_SCORES.length - 1);
      const points = this.STROKE_SCORES[idx];
      if (playerId === 'P1') {
        this.scoreP1 += points;
      } else {
        this.scoreP2 += points;
      }

      // Hide ball briefly, then reset
      player.mesh.visible = false;
      const timer = setTimeout(() => {
        this.resetPlayer(player);
      }, 1000);

      if (playerId === 'P1') {
        this.p1ResetTimer = timer;
      } else {
        this.p2ResetTimer = timer;
      }
    }
  }

  private resetPlayer(player: PlayerState): void {
    player.body.position.set(player.startX, this.BALL_RADIUS, player.startZ);
    player.body.velocity.set(0, 0, 0);
    player.body.angularVelocity.set(0, 0, 0);
    player.mesh.visible = true;
    player.scored = false;
    player.aimAngle = -Math.PI / 2;
    player.charging = false;
    player.chargeTime = 0;
    player.strokes = 0;
  }

  // --- Aim / Power Visuals ---

  private updateAimVisual(player: PlayerState): void {
    const bx = player.body.position.x;
    const bz = player.body.position.z;
    const y = this.BALL_RADIUS + 0.05;

    const dirX = Math.cos(player.aimAngle);
    const dirZ = Math.sin(player.aimAngle);
    const aimLen = 2;

    // Aim line (always visible when ball is active)
    const aimPositions = player.aimLine.geometry.attributes.position as THREE.BufferAttribute;
    aimPositions.setXYZ(0, bx, y, bz);
    aimPositions.setXYZ(1, bx + dirX * aimLen, y, bz + dirZ * aimLen);
    aimPositions.needsUpdate = true;
    player.aimLine.visible = !player.scored;

    // Power line (visible only while charging)
    if (player.charging) {
      const powerFraction = player.chargeTime / this.MAX_CHARGE;
      const powerLen = aimLen + powerFraction * 3;
      const powerPositions = player.powerLine.geometry.attributes.position as THREE.BufferAttribute;
      powerPositions.setXYZ(0, bx, y, bz);
      powerPositions.setXYZ(1, bx + dirX * powerLen, y + 0.1, bz + dirZ * powerLen);
      powerPositions.needsUpdate = true;
      player.powerLine.visible = true;
    } else {
      player.powerLine.visible = false;
    }
  }

  // --- Utility ---

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) {
      angle -= 2 * Math.PI;
    }
    while (angle < -Math.PI) {
      angle += 2 * Math.PI;
    }
    return angle;
  }
}
