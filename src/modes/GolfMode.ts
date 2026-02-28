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
}

export class GolfMode extends GameMode {
  private p1!: PlayerState;
  private p2!: PlayerState;

  // Course elements
  private groundBody!: CANNON.Body;
  private wallBodies: CANNON.Body[] = [];
  private obstacleBodies: CANNON.Body[] = [];
  private obstacleMeshes: THREE.Object3D[] = [];

  // Hole
  private readonly HOLE_X = 0;
  private readonly HOLE_Z = -12;
  private readonly HOLE_RADIUS = 0.5;

  // Course dimensions
  private readonly COURSE_WIDTH = 20;
  private readonly COURSE_DEPTH = 30;

  // Ball
  private readonly BALL_RADIUS = 0.2;
  private readonly MAX_CHARGE = 2;
  private readonly MAX_POWER = 25;
  private readonly SCORE_POINTS = 10;

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
    this.createCourse();
    this.createWalls();
    this.createHole();
    this.createObstacles();
    this.createSandTraps();
    this.createGround();
    this.p1 = this.createPlayer(COLORS.P1, -2, 10);
    this.p2 = this.createPlayer(COLORS.P2, 2, 10);
  }

  public update(delta: number): void {
    if (!this.isActive) {return;}

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
    this.engine.camera.position.set(0, 30, 20);
    this.engine.camera.lookAt(0, 0, -2);
  }

  // --- Course ---

  private createCourse(): void {
    const geo = new THREE.PlaneGeometry(this.COURSE_WIDTH, this.COURSE_DEPTH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d8a4e,
      roughness: 0.9,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0, -1);
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
  }

  private createGround(): void {
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.engine.world.addBody(this.groundBody);
  }

  // --- Walls ---

  private createWalls(): void {
    const hw = this.COURSE_WIDTH / 2;
    const hd = this.COURSE_DEPTH / 2;
    const cy = -1; // course center z offset
    const wallH = 1;
    const wallT = 0.5;

    // Top (far end)
    this.addWall(this.COURSE_WIDTH, wallH, wallT, 0, wallH / 2, cy - hd - wallT / 2, 0x3a7a3a);
    // Bottom (near end)
    this.addWall(this.COURSE_WIDTH, wallH, wallT, 0, wallH / 2, cy + hd + wallT / 2, 0x3a7a3a);
    // Left
    this.addWall(wallT, wallH, this.COURSE_DEPTH, -hw - wallT / 2, wallH / 2, cy, 0x3a7a3a);
    // Right
    this.addWall(wallT, wallH, this.COURSE_DEPTH, hw + wallT / 2, wallH / 2, cy, 0x3a7a3a);
  }

  private addWall(
    sx: number, sy: number, sz: number,
    px: number, py: number, pz: number,
    color: number
  ): void {
    const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
    const body = new CANNON.Body({ mass: 0, shape });
    body.position.set(px, py, pz);
    this.engine.world.addBody(body);
    this.wallBodies.push(body);

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
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
    holeMesh.position.set(this.HOLE_X, 0.01, this.HOLE_Z);
    this.engine.scene.add(holeMesh);

    // White ring around hole
    const ringGeo = new THREE.RingGeometry(this.HOLE_RADIUS, this.HOLE_RADIUS + 0.1, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(this.HOLE_X, 0.015, this.HOLE_Z);
    this.engine.scene.add(ringMesh);

    // Flag pole
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 3, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(this.HOLE_X, 1.5, this.HOLE_Z);
    pole.castShadow = true;
    this.engine.scene.add(pole);

    // Flag (triangle)
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.8, 0.25);
    flagShape.lineTo(0, 0.5);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      side: THREE.DoubleSide,
      roughness: 0.4,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(this.HOLE_X, 2.5, this.HOLE_Z);
    flag.rotation.y = -Math.PI / 2;
    this.engine.scene.add(flag);
  }

  // --- Obstacles ---

  private createObstacles(): void {
    // Wall obstacles on the course
    this.addObstacleWall(4, 0.6, 0.4, -3, 0.3, 2, 0x6b5b3a);
    this.addObstacleWall(3, 0.6, 0.4, 4, 0.3, -4, 0x6b5b3a);
    this.addObstacleWall(0.4, 0.6, 4, -2, 0.3, -7, 0x6b5b3a);
    this.addObstacleWall(5, 0.6, 0.4, 1, 0.3, 5, 0x6b5b3a);

    // Central bumper (cylinder)
    this.addBumper(0, -1, 1.0, 0x8b7355);
  }

  private addObstacleWall(
    sx: number, sy: number, sz: number,
    px: number, py: number, pz: number,
    color: number
  ): void {
    const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
    const body = new CANNON.Body({ mass: 0, shape });
    body.position.set(px, py, pz);
    this.engine.world.addBody(body);
    this.obstacleBodies.push(body);

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
    this.obstacleMeshes.push(mesh);
  }

  private addBumper(x: number, z: number, radius: number, color: number): void {
    const height = 0.6;
    const shape = new CANNON.Cylinder(radius, radius, height, 16);
    const body = new CANNON.Body({ mass: 0, shape });
    body.position.set(x, height / 2, z);
    this.engine.world.addBody(body);
    this.obstacleBodies.push(body);

    const geo = new THREE.CylinderGeometry(radius, radius, height, 32);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
    this.obstacleMeshes.push(mesh);
  }

  // --- Sand Traps ---

  private createSandTraps(): void {
    this.addSandTrap(5, 0, 2.5, 1.8);
    this.addSandTrap(-4, -9, 3, 2);
    this.addSandTrap(3, 7, 2, 1.5);
  }

  private addSandTrap(x: number, z: number, w: number, d: number): void {
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 1,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.005, z);
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
  }

  // --- Player creation ---

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

  // --- Update logic ---

  private updatePlayer(
    player: PlayerState,
    controls: { up: string; down: string; left: string; right: string; action1: string; action2: string },
    delta: number
  ): void {
    if (player.scored) {return;}

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
    player.body.applyImpulse(
      new CANNON.Vec3(dirX * power, 0, dirZ * power),
      player.body.position
    );
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
    if (player.scored) {return;}

    const dx = player.body.position.x - this.HOLE_X;
    const dz = player.body.position.z - this.HOLE_Z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < this.HOLE_RADIUS) {
      player.scored = true;
      if (playerId === 'P1') {
        this.scoreP1 += this.SCORE_POINTS;
      } else {
        this.scoreP2 += this.SCORE_POINTS;
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
  }

  // --- Aim / Power visuals ---

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
    while (angle > Math.PI) {angle -= 2 * Math.PI;}
    while (angle < -Math.PI) {angle += 2 * Math.PI;}
    return angle;
  }
}
