import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

export class FootballMode extends GameMode {
  // Players
  private p1Mesh!: THREE.Group;
  private p2Mesh!: THREE.Group;
  private p1Body!: CANNON.Body;
  private p2Body!: CANNON.Body;

  // Ball
  private ballMesh!: THREE.Mesh;
  private ballBody!: CANNON.Body;

  // Goals
  private goal1Group!: THREE.Group;
  private goal2Group!: THREE.Group;

  // Field objects
  private fieldMesh!: THREE.Mesh;
  private fieldLines: THREE.Object3D[] = [];
  private wallBodies: CANNON.Body[] = [];
  private wallMeshes: THREE.Object3D[] = [];

  // Goal animation
  private goalTime = 0;
  private readonly goalOscillationSpeed = 1.2;
  private readonly goalOscillationAmplitude = 5;
  private readonly goalHalfWidth = 3;

  // Goal scoring
  private goalCooldown = false;
  private goalResetTimer: ReturnType<typeof setTimeout> | null = null;
  private flashOverlay!: THREE.Mesh;

  // Ground physics
  private groundBody!: CANNON.Body;

  private readonly FIELD_WIDTH = 30;
  private readonly FIELD_DEPTH = 20;
  private readonly PLAYER_SPEED = 80;
  private readonly KICK_FORCE = 18;
  private readonly BALL_RADIUS = 0.3;
  private readonly GOAL_LINE_X = 14;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.goalTime = 0;
    this.goalCooldown = false;

    this.setupCamera();
    this.addLighting(0x88ff88);
    this.createField();
    this.createFieldLines();
    this.createWalls();
    this.createGoals();
    this.createPlayers();
    this.createBall();
    this.createFlashOverlay();
    this.createGround();
  }

  public update(delta: number): void {
    if (!this.isActive) {
      return;
    }

    this.goalTime += delta;

    // Player movement with dynamic forces
    this.handlePlayerMovement(this.p1Body, P1_CONTROLS, this.PLAYER_SPEED);
    this.handlePlayerMovement(this.p2Body, P2_CONTROLS, this.PLAYER_SPEED);

    // Kick mechanic: apply impulse to ball when action1 pressed near ball
    this.handleKick(this.p1Body, P1_CONTROLS.action1);
    this.handleKick(this.p2Body, P2_CONTROLS.action1);

    // Keep players on ground
    this.p1Body.position.y = 0.6;
    this.p2Body.position.y = 0.6;
    this.p1Body.velocity.y = 0;
    this.p2Body.velocity.y = 0;

    // Rotate player meshes to face movement direction
    this.rotatePlayerToVelocity(this.p1Mesh, this.p1Body);
    this.rotatePlayerToVelocity(this.p2Mesh, this.p2Body);

    // Oscillate goals along Z axis
    const goalZ =
      Math.sin(this.goalTime * this.goalOscillationSpeed) * this.goalOscillationAmplitude;
    this.goal1Group.position.z = goalZ;
    this.goal2Group.position.z = goalZ;

    // Sync physics
    this.engine.syncPhysics();

    // Keep ball on the ground plane
    if (this.ballBody.position.y < this.BALL_RADIUS) {
      this.ballBody.position.y = this.BALL_RADIUS;
      if (this.ballBody.velocity.y < 0) {
        this.ballBody.velocity.y = 0;
      }
    }

    // Goal detection
    this.checkGoals(goalZ);

    // Fade flash overlay
    const flashMat = this.flashOverlay.material as THREE.MeshBasicMaterial;
    if (flashMat.opacity > 0) {
      flashMat.opacity = Math.max(0, flashMat.opacity - delta * 3);
    }
  }

  public cleanup(): void {
    if (this.goalResetTimer !== null) {
      clearTimeout(this.goalResetTimer);
      this.goalResetTimer = null;
    }
    this.engine.clearScene();
    this.fieldLines = [];
    this.wallBodies = [];
    this.wallMeshes = [];
  }

  // --- Setup helpers ---

  private setupCamera(): void {
    this.engine.camera.position.set(0, 28, 18);
    this.engine.camera.lookAt(0, 0, 0);
  }

  private createField(): void {
    const geo = new THREE.PlaneGeometry(this.FIELD_WIDTH, this.FIELD_DEPTH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a6b1a,
      roughness: 0.8,
      metalness: 0.0,
    });
    this.fieldMesh = new THREE.Mesh(geo, mat);
    this.fieldMesh.rotation.x = -Math.PI / 2;
    this.fieldMesh.receiveShadow = true;
    this.engine.scene.add(this.fieldMesh);
  }

  private createFieldLines(): void {
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const createLine = (width: number, depth: number, x: number, z: number): THREE.Mesh => {
      const geo = new THREE.PlaneGeometry(width, depth);
      const mesh = new THREE.Mesh(geo, lineMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.01, z);
      this.engine.scene.add(mesh);
      this.fieldLines.push(mesh);
      return mesh;
    };

    // Outer boundary
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const t = 0.1; // line thickness

    createLine(this.FIELD_WIDTH, t, 0, -hd); // top
    createLine(this.FIELD_WIDTH, t, 0, hd); // bottom
    createLine(t, this.FIELD_DEPTH, -hw, 0); // left
    createLine(t, this.FIELD_DEPTH, hw, 0); // right

    // Center line
    createLine(t, this.FIELD_DEPTH, 0, 0);

    // Center circle
    const circleGeo = new THREE.RingGeometry(2.8, 3, 64);
    const circleMesh = new THREE.Mesh(circleGeo, lineMat);
    circleMesh.rotation.x = -Math.PI / 2;
    circleMesh.position.y = 0.01;
    this.engine.scene.add(circleMesh);
    this.fieldLines.push(circleMesh);

    // Goal area boxes
    const goalAreaWidth = 5;
    const goalAreaDepth = 8;
    createLine(goalAreaWidth, t, -hw + goalAreaWidth / 2, -goalAreaDepth / 2);
    createLine(goalAreaWidth, t, -hw + goalAreaWidth / 2, goalAreaDepth / 2);
    createLine(t, goalAreaDepth, -hw + goalAreaWidth, 0);

    createLine(goalAreaWidth, t, hw - goalAreaWidth / 2, -goalAreaDepth / 2);
    createLine(goalAreaWidth, t, hw - goalAreaWidth / 2, goalAreaDepth / 2);
    createLine(t, goalAreaDepth, hw - goalAreaWidth, 0);
  }

  private createWalls(): void {
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const wallHeight = 2;
    const wallThickness = 0.5;

    const createWall = (
      sx: number,
      sy: number,
      sz: number,
      px: number,
      py: number,
      pz: number
    ): void => {
      const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
      const body = new CANNON.Body({ mass: 0, shape });
      body.position.set(px, py, pz);
      this.engine.world.addBody(body);
      this.wallBodies.push(body);

      // Invisible wall mesh
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x225522,
        transparent: true,
        opacity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      this.engine.scene.add(mesh);
      this.wallMeshes.push(mesh);
    };

    // Top wall (z = -hd)
    createWall(
      this.FIELD_WIDTH + wallThickness * 2,
      wallHeight,
      wallThickness,
      0,
      wallHeight / 2,
      -hd - wallThickness / 2
    );
    // Bottom wall (z = +hd)
    createWall(
      this.FIELD_WIDTH + wallThickness * 2,
      wallHeight,
      wallThickness,
      0,
      wallHeight / 2,
      hd + wallThickness / 2
    );
    // Left wall (x = -hw)
    createWall(
      wallThickness,
      wallHeight,
      this.FIELD_DEPTH,
      -hw - wallThickness / 2,
      wallHeight / 2,
      0
    );
    // Right wall (x = +hw)
    createWall(
      wallThickness,
      wallHeight,
      this.FIELD_DEPTH,
      hw + wallThickness / 2,
      wallHeight / 2,
      0
    );
  }

  private createGoals(): void {
    this.goal1Group = this.buildGoal(COLORS.P2, -this.FIELD_WIDTH / 2);
    this.goal2Group = this.buildGoal(COLORS.P1, this.FIELD_WIDTH / 2);
  }

  private buildGoal(color: number, xPos: number): THREE.Group {
    const group = new THREE.Group();
    const postHeight = 2.5;
    const goalWidth = this.goalHalfWidth * 2;
    const postRadius = 0.15;

    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.3,
    });

    // Left post
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 12);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(0, postHeight / 2, -goalWidth / 2);
    leftPost.castShadow = true;
    group.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(0, postHeight / 2, goalWidth / 2);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Crossbar
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 12);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.position.set(0, postHeight, 0);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.castShadow = true;
    group.add(crossbar);

    // Neon glow outline - left post
    const glowGeo = new THREE.CylinderGeometry(
      postRadius + 0.08,
      postRadius + 0.08,
      postHeight + 0.1,
      12
    );
    const leftGlow = new THREE.Mesh(glowGeo, glowMat);
    leftGlow.position.copy(leftPost.position);
    group.add(leftGlow);

    // Neon glow outline - right post
    const rightGlow = new THREE.Mesh(glowGeo, glowMat);
    rightGlow.position.copy(rightPost.position);
    group.add(rightGlow);

    // Neon glow outline - crossbar
    const crossGlowGeo = new THREE.CylinderGeometry(
      postRadius + 0.08,
      postRadius + 0.08,
      goalWidth + 0.1,
      12
    );
    const crossGlow = new THREE.Mesh(crossGlowGeo, glowMat);
    crossGlow.position.copy(crossbar.position);
    crossGlow.rotation.x = Math.PI / 2;
    group.add(crossGlow);

    // Net (simple plane behind the goal)
    const netGeo = new THREE.PlaneGeometry(1.5, postHeight);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const backNet = new THREE.Mesh(netGeo, netMat);
    const netOffsetX = xPos < 0 ? -0.75 : 0.75;
    backNet.position.set(netOffsetX, postHeight / 2, 0);
    group.add(backNet);

    group.position.set(xPos, 0, 0);
    this.engine.scene.add(group);
    return group;
  }

  private createPlayers(): void {
    this.p1Mesh = this.createPlayerMesh(COLORS.P1);
    this.p1Body = this.createPlayerBody(-5, 0);
    this.engine.addPhysicsObject(this.p1Mesh, this.p1Body);

    this.p2Mesh = this.createPlayerMesh(COLORS.P2);
    this.p2Body = this.createPlayerBody(5, 0);
    this.engine.addPhysicsObject(this.p2Mesh, this.p2Body);
  }

  private createBall(): void {
    this.ballMesh = this.createBallMesh(this.BALL_RADIUS, COLORS.WHITE);
    this.ballBody = this.createBallBody(this.BALL_RADIUS, 0, this.BALL_RADIUS, 0, 1);
    this.engine.addPhysicsObject(this.ballMesh, this.ballBody);
  }

  private createFlashOverlay(): void {
    const geo = new THREE.PlaneGeometry(100, 100);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    this.flashOverlay = new THREE.Mesh(geo, mat);
    this.flashOverlay.position.set(0, 15, 0);
    this.flashOverlay.rotation.x = -Math.PI / 2;
    this.flashOverlay.renderOrder = 999;
    this.engine.scene.add(this.flashOverlay);
  }

  private createGround(): void {
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.engine.world.addBody(this.groundBody);
  }

  // --- Player dynamics ---

  private rotatePlayerToVelocity(mesh: THREE.Group, body: CANNON.Body): void {
    const vx = body.velocity.x;
    const vz = body.velocity.z;
    const speed = Math.sqrt(vx * vx + vz * vz);
    if (speed > 0.5) {
      const targetAngle = Math.atan2(vx, vz);
      mesh.rotation.y = targetAngle;
    }
  }

  private handleKick(playerBody: CANNON.Body, actionKey: string): void {
    if (!this.engine.input.wasPressed(actionKey)) {
      return;
    }
    const dx = this.ballBody.position.x - playerBody.position.x;
    const dz = this.ballBody.position.z - playerBody.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.5) {
      const nx = dx / dist;
      const nz = dz / dist;
      this.ballBody.velocity.set(nx * this.KICK_FORCE, 0, nz * this.KICK_FORCE);
    }
  }

  // --- Goal detection ---

  private checkGoals(goalZ: number): void {
    if (this.goalCooldown) {
      return;
    }

    const bx = this.ballBody.position.x;
    const bz = this.ballBody.position.z;

    const withinGoalZ = bz > goalZ - this.goalHalfWidth && bz < goalZ + this.goalHalfWidth;

    // Ball crossed left goal line → P2 scores
    if (bx < -this.GOAL_LINE_X && withinGoalZ) {
      this.scoreP2++;
      this.onGoalScored(COLORS.P2);
      return;
    }

    // Ball crossed right goal line → P1 scores
    if (bx > this.GOAL_LINE_X && withinGoalZ) {
      this.scoreP1++;
      this.onGoalScored(COLORS.P1);
    }
  }

  private onGoalScored(flashColor: number): void {
    this.goalCooldown = true;

    // Flash effect
    const flashMat = this.flashOverlay.material as THREE.MeshBasicMaterial;
    flashMat.color.setHex(flashColor);
    flashMat.opacity = 0.6;

    // Reset ball after short delay
    this.goalResetTimer = setTimeout(() => {
      this.resetBall();
      this.goalCooldown = false;
      this.goalResetTimer = null;
    }, 800);
  }

  private resetBall(): void {
    this.ballBody.position.set(0, this.BALL_RADIUS, 0);
    this.ballBody.velocity.set(0, 0, 0);
    this.ballBody.angularVelocity.set(0, 0, 0);
  }
}
