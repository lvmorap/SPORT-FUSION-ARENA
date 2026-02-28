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
  private readonly goalYOscillationSpeed = 0.8;
  private readonly goalYOscillationAmplitude = 3;
  private readonly goalHalfWidth = 3;
  private readonly goalHalfHeight = 1.25;

  // Goal scoring
  private goalCooldown = false;
  private goalResetTimer: ReturnType<typeof setTimeout> | null = null;
  private flashOverlay!: THREE.Mesh;

  // Ground physics
  private groundBody!: CANNON.Body;

  // Kick animation state
  private p1KickTimer = 0;
  private p2KickTimer = 0;
  private readonly KICK_ANIM_DURATION = 0.3;

  private readonly FIELD_WIDTH = 30;
  private readonly FIELD_DEPTH = 20;
  private readonly FIELD_HEIGHT = 12;
  private readonly PLAYER_SPEED = 80;
  private readonly KICK_FORCE = 18;
  private readonly BALL_RADIUS = 0.3;
  private readonly GOAL_LINE_X = 14;
  private readonly JUMP_IMPULSE = 28;
  private readonly LEVITATE_Y = 0.15;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.goalTime = 0;
    this.goalCooldown = false;
    this.p1KickTimer = 0;
    this.p2KickTimer = 0;

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

    // Jump mechanic
    this.handleJump(this.p1Body, P1_CONTROLS.action2);
    this.handleJump(this.p2Body, P2_CONTROLS.action2);

    // Kick mechanic: apply impulse to ball when action1 pressed near ball
    this.handleKick(this.p1Body, P1_CONTROLS.action1, 1);
    this.handleKick(this.p2Body, P2_CONTROLS.action1, 2);

    // Keep players from falling below the levitation height
    const playerGroundY = 0.85 + this.LEVITATE_Y;
    if (this.p1Body.position.y < playerGroundY) {
      this.p1Body.position.y = playerGroundY;
      if (this.p1Body.velocity.y < 0) {
        this.p1Body.velocity.y = 0;
      }
    }
    if (this.p2Body.position.y < playerGroundY) {
      this.p2Body.position.y = playerGroundY;
      if (this.p2Body.velocity.y < 0) {
        this.p2Body.velocity.y = 0;
      }
    }

    // Cap players at ceiling
    const playerCeilingY = this.FIELD_HEIGHT - 0.85;
    if (this.p1Body.position.y > playerCeilingY) {
      this.p1Body.position.y = playerCeilingY;
      if (this.p1Body.velocity.y > 0) {
        this.p1Body.velocity.y = 0;
      }
    }
    if (this.p2Body.position.y > playerCeilingY) {
      this.p2Body.position.y = playerCeilingY;
      if (this.p2Body.velocity.y > 0) {
        this.p2Body.velocity.y = 0;
      }
    }

    // Rotate player meshes to face movement direction
    this.rotatePlayerToVelocity(this.p1Mesh, this.p1Body);
    this.rotatePlayerToVelocity(this.p2Mesh, this.p2Body);

    // Kick animation
    this.updateKickAnimation(this.p1Mesh, delta, 1);
    this.updateKickAnimation(this.p2Mesh, delta, 2);

    // Oscillate goals along Z axis and Y axis
    const goalZ =
      Math.sin(this.goalTime * this.goalOscillationSpeed) * this.goalOscillationAmplitude;
    const goalY =
      this.goalHalfHeight +
      1 +
      Math.sin(this.goalTime * this.goalYOscillationSpeed + 1.5) *
        this.goalYOscillationAmplitude;
    this.goal1Group.position.z = goalZ;
    this.goal2Group.position.z = goalZ;
    this.goal1Group.position.y = goalY;
    this.goal2Group.position.y = goalY;

    // Sync physics
    this.engine.syncPhysics();

    // Remove gravity effect on ball (zero gravity ball)
    this.ballBody.force.y += this.ballBody.mass * 9.82;

    // Contain ball within the parallelepiped
    this.containBall();

    // Goal detection
    this.checkGoals(goalZ, goalY);

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
    this.engine.camera.position.set(0, 30, 24);
    this.engine.camera.lookAt(0, this.FIELD_HEIGHT / 2, 0);
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
    const wallThickness = 0.5;
    const fh = this.FIELD_HEIGHT;

    const wallMat = new CANNON.Material({ friction: 0.1, restitution: 0.9 });

    const createWall = (
      sx: number,
      sy: number,
      sz: number,
      px: number,
      py: number,
      pz: number,
      visible: boolean,
      opacity: number,
    ): void => {
      const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
      const body = new CANNON.Body({ mass: 0, shape, material: wallMat });
      body.position.set(px, py, pz);
      this.engine.world.addBody(body);
      this.wallBodies.push(body);

      if (visible) {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x225522,
          transparent: true,
          opacity,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        this.engine.scene.add(mesh);
        this.wallMeshes.push(mesh);
      }
    };

    // Front wall (z = -hd)
    createWall(
      this.FIELD_WIDTH + wallThickness * 2,
      fh,
      wallThickness,
      0,
      fh / 2,
      -hd - wallThickness / 2,
      true,
      0.08,
    );
    // Back wall (z = +hd)
    createWall(
      this.FIELD_WIDTH + wallThickness * 2,
      fh,
      wallThickness,
      0,
      fh / 2,
      hd + wallThickness / 2,
      true,
      0.08,
    );
    // Left wall (x = -hw)
    createWall(
      wallThickness,
      fh,
      this.FIELD_DEPTH,
      -hw - wallThickness / 2,
      fh / 2,
      0,
      true,
      0.08,
    );
    // Right wall (x = +hw)
    createWall(
      wallThickness,
      fh,
      this.FIELD_DEPTH,
      hw + wallThickness / 2,
      fh / 2,
      0,
      true,
      0.08,
    );
    // Ceiling (y = fh)
    createWall(
      this.FIELD_WIDTH + wallThickness * 2,
      wallThickness,
      this.FIELD_DEPTH + wallThickness * 2,
      0,
      fh + wallThickness / 2,
      0,
      true,
      0.05,
    );

    // Wireframe edges to show the 3D box
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.4 });
    const edgePoints = [
      // Vertical edges
      [[-hw, 0, -hd], [-hw, fh, -hd]],
      [[hw, 0, -hd], [hw, fh, -hd]],
      [[-hw, 0, hd], [-hw, fh, hd]],
      [[hw, 0, hd], [hw, fh, hd]],
      // Top edges
      [[-hw, fh, -hd], [hw, fh, -hd]],
      [[-hw, fh, hd], [hw, fh, hd]],
      [[-hw, fh, -hd], [-hw, fh, hd]],
      [[hw, fh, -hd], [hw, fh, hd]],
    ];
    for (const [start, end] of edgePoints) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(end[0], end[1], end[2]),
      ]);
      const line = new THREE.Line(geo, edgeMat);
      this.engine.scene.add(line);
      this.wallMeshes.push(line);
    }
  }

  private createGoals(): void {
    this.goal1Group = this.buildGoal(COLORS.P2, -this.FIELD_WIDTH / 2);
    this.goal2Group = this.buildGoal(COLORS.P1, this.FIELD_WIDTH / 2);
  }

  private buildGoal(color: number, xPos: number): THREE.Group {
    const group = new THREE.Group();
    const postHeight = this.goalHalfHeight * 2;
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
    leftPost.position.set(0, 0, -goalWidth / 2);
    leftPost.castShadow = true;
    group.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(0, 0, goalWidth / 2);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Crossbar (top)
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 12);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.position.set(0, postHeight / 2, 0);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.castShadow = true;
    group.add(crossbar);

    // Bottom bar
    const bottomBar = new THREE.Mesh(crossbarGeo, postMat);
    bottomBar.position.set(0, -postHeight / 2, 0);
    bottomBar.rotation.x = Math.PI / 2;
    bottomBar.castShadow = true;
    group.add(bottomBar);

    // Neon glow outline - left post
    const glowGeo = new THREE.CylinderGeometry(
      postRadius + 0.08,
      postRadius + 0.08,
      postHeight + 0.1,
      12,
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
      12,
    );
    const crossGlow = new THREE.Mesh(crossGlowGeo, glowMat);
    crossGlow.position.copy(crossbar.position);
    crossGlow.rotation.x = Math.PI / 2;
    group.add(crossGlow);

    // Neon glow outline - bottom bar
    const bottomGlow = new THREE.Mesh(crossGlowGeo, glowMat);
    bottomGlow.position.copy(bottomBar.position);
    bottomGlow.rotation.x = Math.PI / 2;
    group.add(bottomGlow);

    // Improved net - grid mesh behind the goal
    const netDepth = 1.5;
    const netColor = new THREE.Color(color);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const netSolidMat = new THREE.MeshStandardMaterial({
      color: netColor,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
    });

    const netOffsetX = xPos < 0 ? -netDepth / 2 : netDepth / 2;

    // Back net (vertical plane)
    const backNetGeo = new THREE.PlaneGeometry(goalWidth, postHeight, 12, 6);
    const backNetWire = new THREE.Mesh(backNetGeo, netMat);
    backNetWire.position.set(netOffsetX, 0, 0);
    group.add(backNetWire);
    const backNetSolid = new THREE.Mesh(backNetGeo, netSolidMat);
    backNetSolid.position.set(netOffsetX, 0, 0);
    group.add(backNetSolid);

    // Top net (horizontal plane)
    const topNetGeo = new THREE.PlaneGeometry(goalWidth, netDepth, 12, 3);
    const topNetWire = new THREE.Mesh(topNetGeo, netMat);
    topNetWire.rotation.x = Math.PI / 2;
    topNetWire.position.set(netOffsetX / 2, postHeight / 2, 0);
    group.add(topNetWire);

    // Bottom net
    const bottomNetWire = new THREE.Mesh(topNetGeo, netMat);
    bottomNetWire.rotation.x = Math.PI / 2;
    bottomNetWire.position.set(netOffsetX / 2, -postHeight / 2, 0);
    group.add(bottomNetWire);

    // Side nets
    const sideNetGeo = new THREE.PlaneGeometry(netDepth, postHeight, 3, 6);
    const leftSideNet = new THREE.Mesh(sideNetGeo, netMat);
    leftSideNet.rotation.y = Math.PI / 2;
    leftSideNet.position.set(netOffsetX / 2, 0, -goalWidth / 2);
    group.add(leftSideNet);
    const rightSideNet = new THREE.Mesh(sideNetGeo, netMat);
    rightSideNet.rotation.y = Math.PI / 2;
    rightSideNet.position.set(netOffsetX / 2, 0, goalWidth / 2);
    group.add(rightSideNet);

    group.position.set(xPos, postHeight / 2 + 1, 0);
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
    // Ball starts at center, slightly above ground
    this.ballBody = new CANNON.Body({
      mass: 0.5,
      shape: new CANNON.Sphere(this.BALL_RADIUS),
      position: new CANNON.Vec3(0, this.FIELD_HEIGHT / 2, 0),
      linearDamping: 0.15,
      angularDamping: 0.15,
    });

    // High restitution material for bouncy ball
    const ballMaterial = new CANNON.Material({ friction: 0.1, restitution: 0.95 });
    this.ballBody.material = ballMaterial;

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

  private handleJump(playerBody: CANNON.Body, actionKey: string): void {
    if (!this.engine.input.wasPressed(actionKey)) {
      return;
    }
    // Allow jump only when near ground (with small tolerance)
    const playerGroundY = 0.85 + this.LEVITATE_Y;
    if (playerBody.position.y < playerGroundY + 0.3) {
      playerBody.velocity.y = this.JUMP_IMPULSE;
    }
  }

  private handleKick(
    playerBody: CANNON.Body,
    actionKey: string,
    playerNum: number,
  ): void {
    if (!this.engine.input.wasPressed(actionKey)) {
      return;
    }

    // Always trigger kick animation for visual feedback
    if (playerNum === 1) {
      this.p1KickTimer = this.KICK_ANIM_DURATION;
    } else {
      this.p2KickTimer = this.KICK_ANIM_DURATION;
    }

    const dx = this.ballBody.position.x - playerBody.position.x;
    const dy = this.ballBody.position.y - playerBody.position.y;
    const dz = this.ballBody.position.z - playerBody.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 2.0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      this.ballBody.velocity.set(0, 0, 0);
      this.ballBody.applyImpulse(
        new CANNON.Vec3(
          nx * this.KICK_FORCE,
          ny * this.KICK_FORCE,
          nz * this.KICK_FORCE,
        ),
        this.ballBody.position,
      );
    }
  }

  private updateKickAnimation(mesh: THREE.Group, delta: number, playerNum: number): void {
    const timer = playerNum === 1 ? this.p1KickTimer : this.p2KickTimer;
    const leg = mesh.getObjectByName('kickLeg');
    const shoe = mesh.getObjectByName('kickShoe');
    if (!leg || !shoe) {
      return;
    }

    if (timer > 0) {
      // Animate kick: swing the right leg forward
      const progress = 1 - timer / this.KICK_ANIM_DURATION;
      const swingAngle = Math.sin(progress * Math.PI) * 1.2;
      leg.rotation.x = -swingAngle;
      leg.position.y = 0.28 + Math.sin(progress * Math.PI) * 0.1;
      leg.position.z = -Math.sin(progress * Math.PI) * 0.25;
      shoe.rotation.x = -swingAngle * 0.8;
      shoe.position.y = 0.04 + Math.sin(progress * Math.PI) * 0.15;
      shoe.position.z = 0.02 - Math.sin(progress * Math.PI) * 0.3;

      if (playerNum === 1) {
        this.p1KickTimer -= delta;
      } else {
        this.p2KickTimer -= delta;
      }
    } else {
      // Reset to default position
      leg.rotation.x = 0;
      leg.position.set(0.13, 0.28, 0);
      shoe.rotation.x = 0;
      shoe.position.set(0.13, 0.04, 0.02);
    }
  }

  // --- Ball containment ---

  private containBall(): void {
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const r = this.BALL_RADIUS;
    const fh = this.FIELD_HEIGHT;
    const b = this.ballBody;

    // Floor
    if (b.position.y < r) {
      b.position.y = r;
      b.velocity.y = Math.abs(b.velocity.y) * 0.9;
    }
    // Ceiling
    if (b.position.y > fh - r) {
      b.position.y = fh - r;
      b.velocity.y = -Math.abs(b.velocity.y) * 0.9;
    }
    // Left wall
    if (b.position.x < -hw + r) {
      b.position.x = -hw + r;
      b.velocity.x = Math.abs(b.velocity.x) * 0.9;
    }
    // Right wall
    if (b.position.x > hw - r) {
      b.position.x = hw - r;
      b.velocity.x = -Math.abs(b.velocity.x) * 0.9;
    }
    // Front wall (z negative)
    if (b.position.z < -hd + r) {
      b.position.z = -hd + r;
      b.velocity.z = Math.abs(b.velocity.z) * 0.9;
    }
    // Back wall (z positive)
    if (b.position.z > hd - r) {
      b.position.z = hd - r;
      b.velocity.z = -Math.abs(b.velocity.z) * 0.9;
    }
  }

  // --- Goal detection ---

  private checkGoals(goalZ: number, goalY: number): void {
    if (this.goalCooldown) {
      return;
    }

    const bx = this.ballBody.position.x;
    const bz = this.ballBody.position.z;
    const by = this.ballBody.position.y;
    const bvx = this.ballBody.velocity.x;

    const withinGoalZ = bz > goalZ - this.goalHalfWidth && bz < goalZ + this.goalHalfWidth;
    const withinGoalY = by > goalY - this.goalHalfHeight && by < goalY + this.goalHalfHeight;

    // Ball crossed left goal line → P2 scores (ball must be moving left, i.e., from front)
    if (bx < -this.GOAL_LINE_X && withinGoalZ && withinGoalY && bvx < 0) {
      this.scoreP2++;
      this.onGoalScored(COLORS.P2);
      return;
    }

    // Ball crossed right goal line → P1 scores (ball must be moving right, i.e., from front)
    if (bx > this.GOAL_LINE_X && withinGoalZ && withinGoalY && bvx > 0) {
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
    this.ballBody.position.set(0, this.FIELD_HEIGHT / 2, 0);
    this.ballBody.velocity.set(0, 0, 0);
    this.ballBody.angularVelocity.set(0, 0, 0);
  }
}
