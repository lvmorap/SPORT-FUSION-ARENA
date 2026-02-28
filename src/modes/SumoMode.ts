import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

export class SumoMode extends GameMode {
  // Players
  private p1Mesh!: THREE.Group;
  private p2Mesh!: THREE.Group;
  private p1Body!: CANNON.Body;
  private p2Body!: CANNON.Body;

  // Arena
  private platformMesh!: THREE.Mesh;
  private outerGroundMesh!: THREE.Mesh;
  private ringMarkerInner!: THREE.Mesh;
  private ringMarkerOuter!: THREE.Mesh;
  private dangerZoneMesh!: THREE.Mesh;
  private edgeGlowMesh!: THREE.Mesh;
  private edgePosts: THREE.Mesh[] = [];
  private groundBody!: CANNON.Body;

  // Scoring zone
  private zoneMesh!: THREE.Mesh;
  private zoneGlowMesh!: THREE.Mesh;
  private zoneX = 0;
  private zoneZ = 0;
  private zoneVelX = 0;
  private zoneVelZ = 0;
  private currentZoneRadius = 4;
  private zoneRadiusTarget = 4;
  private zoneResizeTimer = 0;

  // Particles
  private particles!: THREE.Points;

  // Tracked objects for cleanup
  private sceneObjects: THREE.Object3D[] = [];

  // Dash cooldowns
  private p1DashCooldown = 0;
  private p2DashCooldown = 0;
  private p1LastDir = new CANNON.Vec3(0, 0, -1);
  private p2LastDir = new CANNON.Vec3(0, 0, 1);

  // Timing
  private elapsed = 0;

  // Earthquake
  private earthquakeTimer = 0;
  private readonly EARTHQUAKE_INTERVAL = 6;
  private readonly EARTHQUAKE_FORCE = 12;

  private readonly ARENA_RADIUS = 12;
  private readonly ZONE_RADIUS = 4;
  private readonly ZONE_RADIUS_MIN = 2;
  private readonly ZONE_RADIUS_MAX = 6;
  private readonly ZONE_RESIZE_INTERVAL = 4;
  private readonly PLAYER_SPEED = 10;
  private readonly DASH_FORCE = 35;
  private readonly DASH_COOLDOWN = 1.5;
  private readonly ZONE_WANDER_SPEED = 3;
  private readonly ZONE_DIR_CHANGE_INTERVAL = 2.5;
  private readonly PUSH_RADIUS = 2.2;
  private readonly PUSH_FORCE = 150;
  private readonly ARENA_MIN_RADIUS = 5;
  private readonly JUMP_FORCE = 8;
  private readonly JUMP_COOLDOWN = 2;
  private readonly DASH_ENEMY_PUSH = 200;
  private readonly BOUNDARY_SCORE_POINTS = 1;

  private currentArenaRadius = 12;
  private arenaCenterX = 0;
  private arenaCenterZ = 0;
  private p1JumpCooldown = 0;
  private p2JumpCooldown = 0;
  private p1IsJumping = false;
  private p2IsJumping = false;
  private zoneDirTimer = 0;
  private p1AtBoundary = false;
  private p2AtBoundary = false;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.elapsed = 0;
    this.p1DashCooldown = 0;
    this.p2DashCooldown = 0;
    this.p1LastDir = new CANNON.Vec3(0, 0, -1);
    this.p2LastDir = new CANNON.Vec3(0, 0, 1);
    this.currentArenaRadius = this.ARENA_RADIUS;
    this.arenaCenterX = 0;
    this.arenaCenterZ = 0;
    this.p1JumpCooldown = 0;
    this.p2JumpCooldown = 0;
    this.p1IsJumping = false;
    this.p2IsJumping = false;
    this.sceneObjects = [];
    this.edgePosts = [];
    this.zoneVelX = this.ZONE_WANDER_SPEED;
    this.zoneVelZ = 0;
    this.zoneDirTimer = 0;
    this.currentZoneRadius = this.ZONE_RADIUS;
    this.zoneRadiusTarget = this.ZONE_RADIUS;
    this.zoneResizeTimer = 0;
    this.earthquakeTimer = 0;
    this.p1AtBoundary = false;
    this.p2AtBoundary = false;

    this.setupCamera();
    this.addLighting(0xffe0a0);
    this.createArena();
    this.createArenaBoundaryVisuals();
    this.createScoringZone();
    this.createPlayers();
    this.createGround();
    this.createParticles();
  }

  public update(delta: number): void {
    if (!this.isActive) {
      return;
    }

    this.elapsed += delta;

    // Shrink arena over time
    this.updateArenaShrink(delta);

    // Direct velocity-based movement (responsive XZ-plane controls)
    this.handleSumoMovement(this.p1Body, P1_CONTROLS);
    this.handleSumoMovement(this.p2Body, P2_CONTROLS);

    // Track facing directions from velocity
    this.updateFacingDirection(this.p1Body, this.p1LastDir);
    this.updateFacingDirection(this.p2Body, this.p2LastDir);

    // Dash / push mechanic
    this.p1DashCooldown = Math.max(0, this.p1DashCooldown - delta);
    this.p2DashCooldown = Math.max(0, this.p2DashCooldown - delta);
    this.handleDash(this.p1Body, this.p1LastDir, P1_CONTROLS.action1, 'p1');
    this.handleDash(this.p2Body, this.p2LastDir, P2_CONTROLS.action1, 'p2');

    // Jump mechanic
    this.p1JumpCooldown = Math.max(0, this.p1JumpCooldown - delta);
    this.p2JumpCooldown = Math.max(0, this.p2JumpCooldown - delta);
    this.handleJump(this.p1Body, P1_CONTROLS.action2, 'p1');
    this.handleJump(this.p2Body, P2_CONTROLS.action2, 'p2');

    // Collision-based push between players
    this.handlePlayerCollisionPush();

    // Check if players landed from jump
    if (this.p1IsJumping && this.p1Body.position.y <= 0.8) {
      this.p1IsJumping = false;
    }
    if (this.p2IsJumping && this.p2Body.position.y <= 0.8) {
      this.p2IsJumping = false;
    }

    // Keep players on ground plane (only when not jumping)
    if (!this.p1IsJumping) {
      this.p1Body.position.y = 0.8;
      this.p1Body.velocity.y = 0;
    }
    if (!this.p2IsJumping) {
      this.p2Body.position.y = 0.8;
      this.p2Body.velocity.y = 0;
    }

    // Enforce arena bounds & score on boundary touch
    this.checkBoundaryScoring(this.p1Body, this.p2Body, 'p2');
    this.checkBoundaryScoring(this.p2Body, this.p1Body, 'p1');
    this.enforceArenaBounds(this.p1Body);
    this.enforceArenaBounds(this.p2Body);

    // Sync physics (copies body position/quaternion to mesh)
    this.engine.syncPhysics();

    // Override mesh rotation after syncPhysics to prevent physics quaternion artifacts
    this.p1Mesh.quaternion.set(0, 0, 0, 1);
    this.p2Mesh.quaternion.set(0, 0, 0, 1);
    this.rotateToVelocity(this.p1Mesh, this.p1Body);
    this.rotateToVelocity(this.p2Mesh, this.p2Body);

    // Earthquake effect: periodically push both players in random directions
    this.earthquakeTimer += delta;
    if (this.earthquakeTimer >= this.EARTHQUAKE_INTERVAL) {
      this.earthquakeTimer = 0;
      this.applyEarthquake();
    }

    // Dynamic zone direction change
    this.zoneDirTimer += delta;
    if (this.zoneDirTimer >= this.ZONE_DIR_CHANGE_INTERVAL) {
      this.zoneDirTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      this.zoneVelX = Math.cos(angle) * this.ZONE_WANDER_SPEED;
      this.zoneVelZ = Math.sin(angle) * this.ZONE_WANDER_SPEED;
    }

    // Dynamic zone radius change
    this.zoneResizeTimer += delta;
    if (this.zoneResizeTimer >= this.ZONE_RESIZE_INTERVAL) {
      this.zoneResizeTimer = 0;
      this.zoneRadiusTarget =
        this.ZONE_RADIUS_MIN +
        Math.random() * (this.ZONE_RADIUS_MAX - this.ZONE_RADIUS_MIN);
    }
    this.currentZoneRadius += (this.zoneRadiusTarget - this.currentZoneRadius) * delta * 2;

    // Move zone position with wandering velocity (constrained to shrinking arena)
    this.zoneX += this.zoneVelX * delta;
    this.zoneZ += this.zoneVelZ * delta;
    const maxOrbitRadius = Math.max(0, this.currentArenaRadius - this.currentZoneRadius - 0.5);
    const zoneDist = Math.sqrt(
      (this.zoneX - this.arenaCenterX) ** 2 + (this.zoneZ - this.arenaCenterZ) ** 2
    );
    if (zoneDist > maxOrbitRadius && zoneDist > 0.01) {
      const nx = (this.zoneX - this.arenaCenterX) / zoneDist;
      const nz = (this.zoneZ - this.arenaCenterZ) / zoneDist;
      this.zoneX = this.arenaCenterX + nx * maxOrbitRadius;
      this.zoneZ = this.arenaCenterZ + nz * maxOrbitRadius;
      // Reflect velocity away from boundary
      const dot = this.zoneVelX * nx + this.zoneVelZ * nz;
      if (dot > 0) {
        this.zoneVelX -= 2 * dot * nx;
        this.zoneVelZ -= 2 * dot * nz;
      }
    }
    this.zoneMesh.position.set(this.zoneX, 0.02, this.zoneZ);
    this.zoneGlowMesh.position.set(this.zoneX, 0.03, this.zoneZ);

    // Update zone visual scale based on dynamic radius
    const zoneScale = this.currentZoneRadius / this.ZONE_RADIUS;
    this.zoneMesh.scale.set(zoneScale, zoneScale, 1);
    this.zoneGlowMesh.scale.set(zoneScale, zoneScale, 1);

    // Pulse the zone glow
    const pulse = 0.6 + 0.4 * Math.sin(this.elapsed * 3);
    const glowMat = this.zoneGlowMesh.material as THREE.MeshStandardMaterial;
    glowMat.emissiveIntensity = pulse * 2;
    glowMat.opacity = 0.3 + 0.2 * pulse;

    // Animate edge boundary glow
    this.animateEdgeBoundary();

    // Scoring
    this.updateScoring(delta);

    // Animate particles
    this.animateParticles(delta);
  }

  public cleanup(): void {
    this.engine.clearScene();
    this.sceneObjects = [];
  }

  // --- Setup helpers ---

  private setupCamera(): void {
    this.engine.camera.position.set(0, 25, 0.1);
    this.engine.camera.lookAt(0, 0, 0);
  }

  private createArena(): void {
    // Sand-colored outer ground
    const outerGeo = new THREE.CircleGeometry(this.ARENA_RADIUS + 6, 64);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 0.9,
      metalness: 0.0,
    });
    this.outerGroundMesh = new THREE.Mesh(outerGeo, outerMat);
    this.outerGroundMesh.rotation.x = -Math.PI / 2;
    this.outerGroundMesh.position.y = -0.01;
    this.outerGroundMesh.receiveShadow = true;
    this.engine.scene.add(this.outerGroundMesh);
    this.sceneObjects.push(this.outerGroundMesh);

    // Dohyō platform (dark wood/tan, slightly elevated)
    const platformGeo = new THREE.CylinderGeometry(this.ARENA_RADIUS, this.ARENA_RADIUS, 0.3, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.7,
      metalness: 0.05,
    });
    this.platformMesh = new THREE.Mesh(platformGeo, platformMat);
    this.platformMesh.position.y = 0.15;
    this.platformMesh.receiveShadow = true;
    this.platformMesh.castShadow = true;
    this.engine.scene.add(this.platformMesh);
    this.sceneObjects.push(this.platformMesh);

    // Inner ring marker (tawara-style boundary)
    const innerRingGeo = new THREE.RingGeometry(this.ARENA_RADIUS - 0.4, this.ARENA_RADIUS, 64);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x3b2f1e,
      roughness: 0.6,
    });
    this.ringMarkerInner = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.ringMarkerInner.rotation.x = -Math.PI / 2;
    this.ringMarkerInner.position.y = 0.31;
    this.engine.scene.add(this.ringMarkerInner);
    this.sceneObjects.push(this.ringMarkerInner);

    // Decorative inner circle marker
    const outerRingGeo = new THREE.RingGeometry(
      this.ARENA_RADIUS - 1.5,
      this.ARENA_RADIUS - 1.2,
      64
    );
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.5,
      emissive: 0xf5deb3,
      emissiveIntensity: 0.1,
    });
    this.ringMarkerOuter = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.ringMarkerOuter.rotation.x = -Math.PI / 2;
    this.ringMarkerOuter.position.y = 0.32;
    this.engine.scene.add(this.ringMarkerOuter);
    this.sceneObjects.push(this.ringMarkerOuter);
  }

  private createArenaBoundaryVisuals(): void {
    // Danger zone ring (red translucent area near the edge)
    const dangerGeo = new THREE.RingGeometry(this.ARENA_RADIUS - 2.5, this.ARENA_RADIUS, 64);
    const dangerMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff2222,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    this.dangerZoneMesh = new THREE.Mesh(dangerGeo, dangerMat);
    this.dangerZoneMesh.rotation.x = -Math.PI / 2;
    this.dangerZoneMesh.position.y = 0.33;
    this.engine.scene.add(this.dangerZoneMesh);
    this.sceneObjects.push(this.dangerZoneMesh);

    // Bright glowing edge ring
    const edgeGlowGeo = new THREE.TorusGeometry(this.ARENA_RADIUS, 0.15, 16, 64);
    const edgeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff4444,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.8,
    });
    this.edgeGlowMesh = new THREE.Mesh(edgeGlowGeo, edgeGlowMat);
    this.edgeGlowMesh.rotation.x = Math.PI / 2;
    this.edgeGlowMesh.position.y = 0.35;
    this.engine.scene.add(this.edgeGlowMesh);
    this.sceneObjects.push(this.edgeGlowMesh);

    // Edge posts (pillars around the arena boundary)
    const postCount = 16;
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xff6644,
      emissive: 0xff4422,
      emissiveIntensity: 1.0,
      roughness: 0.3,
    });
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(
        Math.cos(angle) * this.ARENA_RADIUS,
        0.75,
        Math.sin(angle) * this.ARENA_RADIUS
      );
      post.castShadow = true;
      this.engine.scene.add(post);
      this.sceneObjects.push(post);
      this.edgePosts.push(post);
    }
  }

  private createScoringZone(): void {
    // Zone ring indicator
    const zoneGeo = new THREE.RingGeometry(this.ZONE_RADIUS - 0.15, this.ZONE_RADIUS, 64);
    const zoneMat = new THREE.MeshStandardMaterial({
      color: COLORS.SUCCESS,
      emissive: COLORS.SUCCESS,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    this.zoneMesh.rotation.x = -Math.PI / 2;
    this.zoneMesh.position.y = 0.02;
    this.engine.scene.add(this.zoneMesh);
    this.sceneObjects.push(this.zoneMesh);

    // Zone fill glow
    const glowGeo = new THREE.CircleGeometry(this.ZONE_RADIUS, 64);
    const glowMat = new THREE.MeshStandardMaterial({
      color: COLORS.SUCCESS,
      emissive: COLORS.SUCCESS,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    this.zoneGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.zoneGlowMesh.rotation.x = -Math.PI / 2;
    this.zoneGlowMesh.position.y = 0.03;
    this.engine.scene.add(this.zoneGlowMesh);
    this.sceneObjects.push(this.zoneGlowMesh);
  }

  private createPlayers(): void {
    this.p1Mesh = this.createSumoMesh(COLORS.P1);
    this.p1Body = this.createSumoBody(0, -4);
    this.engine.addPhysicsObject(this.p1Mesh, this.p1Body);

    this.p2Mesh = this.createSumoMesh(COLORS.P2);
    this.p2Body = this.createSumoBody(0, 4);
    this.engine.addPhysicsObject(this.p2Mesh, this.p2Body);
  }

  private createSumoMesh(color: number): THREE.Group {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.6,
    });
    const mawashiMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
    });

    // Big round belly (main sumo body shape)
    const bellyGeo = new THREE.SphereGeometry(0.75, 24, 24);
    const belly = new THREE.Mesh(bellyGeo, skinMat);
    belly.position.y = 0.85;
    belly.scale.set(1.0, 0.85, 0.9);
    belly.castShadow = true;
    group.add(belly);

    // Chest (upper body, slightly smaller)
    const chestGeo = new THREE.SphereGeometry(0.55, 20, 20);
    const chest = new THREE.Mesh(chestGeo, skinMat);
    chest.position.y = 1.25;
    chest.scale.set(0.95, 0.7, 0.8);
    chest.castShadow = true;
    group.add(chest);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);

    // Hair bun (chonmage topknot)
    const bunGeo = new THREE.SphereGeometry(0.13, 12, 12);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 1.88, -0.05);
    bun.castShadow = true;
    group.add(bun);

    // Mawashi (sumo belt) - torus around the waist
    const mawashiGeo = new THREE.TorusGeometry(0.72, 0.1, 12, 24);
    const mawashi = new THREE.Mesh(mawashiGeo, mawashiMat);
    mawashi.position.y = 0.6;
    mawashi.rotation.x = Math.PI / 2;
    mawashi.castShadow = true;
    group.add(mawashi);

    // Front flap of mawashi
    const flapGeo = new THREE.BoxGeometry(0.25, 0.3, 0.08);
    const flap = new THREE.Mesh(flapGeo, mawashiMat);
    flap.position.set(0, 0.5, 0.7);
    group.add(flap);

    // Thick arms in pushing pose
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.4, 8, 12);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.85, 1.0, 0.15);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.rotation.x = -0.2;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.85, 1.0, 0.15);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.rotation.x = -0.2;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-1.05, 0.75, 0.25);
    group.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(1.05, 0.75, 0.25);
    group.add(rightHand);

    // Thick legs
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.3, 8, 12);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.3, 0.25, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.3, 0.25, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.2, 0.08, 0.28);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.7,
    });
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.3, 0.04, 0.05);
    group.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.3, 0.04, 0.05);
    group.add(rightFoot);

    // Glow ring at feet (team indicator)
    const ringGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  private createSumoBody(x: number, z: number): CANNON.Body {
    const body = new CANNON.Body({
      mass: 8,
      shape: new CANNON.Sphere(0.8),
      position: new CANNON.Vec3(x, 0.8, z),
      linearDamping: 0.95,
      angularDamping: 0.99,
    });
    body.fixedRotation = true;
    body.updateMassProperties();
    return body;
  }

  private createGround(): void {
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.engine.world.addBody(this.groundBody);
  }

  private createParticles(): void {
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.ARENA_RADIUS * 0.8;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: COLORS.SCORE,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geo, mat);
    this.engine.scene.add(this.particles);
    this.sceneObjects.push(this.particles);
  }

  // --- Movement ---

  private handleSumoMovement(
    body: CANNON.Body,
    controls: { up: string; down: string; left: string; right: string }
  ): void {
    const input = this.engine.input;
    let dirX = 0;
    let dirZ = 0;

    if (input.isDown(controls.up)) {
      dirZ -= 1;
    }
    if (input.isDown(controls.down)) {
      dirZ += 1;
    }
    if (input.isDown(controls.left)) {
      dirX -= 1;
    }
    if (input.isDown(controls.right)) {
      dirX += 1;
    }

    const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0) {
      body.velocity.x = (dirX / len) * this.PLAYER_SPEED;
      body.velocity.z = (dirZ / len) * this.PLAYER_SPEED;
    } else {
      body.velocity.x *= 0.8;
      body.velocity.z *= 0.8;
    }
  }

  // --- Update helpers ---

  private updateFacingDirection(body: CANNON.Body, lastDir: CANNON.Vec3): void {
    const vx = body.velocity.x;
    const vz = body.velocity.z;
    const speed = Math.sqrt(vx * vx + vz * vz);
    if (speed > 0.5) {
      lastDir.x = vx / speed;
      lastDir.z = vz / speed;
    }
  }

  private handleDash(
    body: CANNON.Body,
    dir: CANNON.Vec3,
    actionKey: string,
    player: 'p1' | 'p2'
  ): void {
    const cooldown = player === 'p1' ? this.p1DashCooldown : this.p2DashCooldown;
    if (cooldown > 0) {
      return;
    }
    if (!this.engine.input.wasPressed(actionKey)) {
      return;
    }

    body.velocity.x += dir.x * this.DASH_FORCE;
    body.velocity.z += dir.z * this.DASH_FORCE;

    // Push enemy if nearby and in the dash direction
    const enemy = player === 'p1' ? this.p2Body : this.p1Body;
    const toEnemyX = enemy.position.x - body.position.x;
    const toEnemyZ = enemy.position.z - body.position.z;
    const distToEnemy = Math.sqrt(toEnemyX * toEnemyX + toEnemyZ * toEnemyZ);

    if (distToEnemy < 4 && distToEnemy > 0.01) {
      const dot = (toEnemyX * dir.x + toEnemyZ * dir.z) / distToEnemy;
      if (dot > 0.3) {
        const pushImpulse = new CANNON.Vec3(
          (toEnemyX / distToEnemy) * this.DASH_ENEMY_PUSH,
          0,
          (toEnemyZ / distToEnemy) * this.DASH_ENEMY_PUSH
        );
        enemy.applyImpulse(pushImpulse); // Apply at center of mass (no torque)
      }
    }

    if (player === 'p1') {
      this.p1DashCooldown = this.DASH_COOLDOWN;
    } else {
      this.p2DashCooldown = this.DASH_COOLDOWN;
    }
  }

  private updateScoring(delta: number): void {
    const zoneRadiusSq = this.currentZoneRadius * this.currentZoneRadius;
    const pointsPerSecond = 2;

    // Player 1 zone check
    const p1dx = this.p1Body.position.x - this.zoneX;
    const p1dz = this.p1Body.position.z - this.zoneZ;
    const p1DistSq = p1dx * p1dx + p1dz * p1dz;
    if (p1DistSq <= zoneRadiusSq) {
      this.scoreP1 += pointsPerSecond * delta;
    }

    // Player 2 zone check
    const p2dx = this.p2Body.position.x - this.zoneX;
    const p2dz = this.p2Body.position.z - this.zoneZ;
    const p2DistSq = p2dx * p2dx + p2dz * p2dz;
    if (p2DistSq <= zoneRadiusSq) {
      this.scoreP2 += pointsPerSecond * delta;
    }
  }

  private rotateToVelocity(mesh: THREE.Group, body: CANNON.Body): void {
    const vx = body.velocity.x;
    const vz = body.velocity.z;
    const speed = Math.sqrt(vx * vx + vz * vz);
    if (speed > 0.5) {
      mesh.rotation.y = Math.atan2(vx, vz);
    }
  }

  private handlePlayerCollisionPush(): void {
    const dx = this.p2Body.position.x - this.p1Body.position.x;
    const dz = this.p2Body.position.z - this.p1Body.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < this.PUSH_RADIUS && dist > 0.01) {
      const nx = dx / dist;
      const nz = dz / dist;
      const relVx = this.p1Body.velocity.x - this.p2Body.velocity.x;
      const relVz = this.p1Body.velocity.z - this.p2Body.velocity.z;
      const relDot = relVx * nx + relVz * nz;
      if (relDot > 0) {
        const pushImpulse = new CANNON.Vec3(
          nx * this.PUSH_FORCE * relDot * 0.02,
          0,
          nz * this.PUSH_FORCE * relDot * 0.02
        );
        this.p2Body.applyImpulse(pushImpulse);
        this.p1Body.applyImpulse(
          new CANNON.Vec3(-pushImpulse.x, 0, -pushImpulse.z)
        );
      }
    }
  }

  private checkBoundaryScoring(
    pushedBody: CANNON.Body,
    _pusherBody: CANNON.Body,
    scoringPlayer: 'p1' | 'p2'
  ): void {
    const dx = pushedBody.position.x - this.arenaCenterX;
    const dz = pushedBody.position.z - this.arenaCenterZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const boundaryThreshold = this.currentArenaRadius - 1.0;
    const atBoundary = dist >= boundaryThreshold;

    // Determine which player is being pushed (the one NOT scoring)
    const wasTouching = scoringPlayer === 'p1' ? this.p2AtBoundary : this.p1AtBoundary;

    if (atBoundary && !wasTouching) {
      if (scoringPlayer === 'p1') {
        this.scoreP1 += this.BOUNDARY_SCORE_POINTS;
      } else {
        this.scoreP2 += this.BOUNDARY_SCORE_POINTS;
      }
    }

    // Update tracking state for the pushed player
    if (scoringPlayer === 'p1') {
      this.p2AtBoundary = atBoundary;
    } else {
      this.p1AtBoundary = atBoundary;
    }
  }

  private applyEarthquake(): void {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const impulse1 = new CANNON.Vec3(
      Math.cos(angle1) * this.EARTHQUAKE_FORCE,
      0,
      Math.sin(angle1) * this.EARTHQUAKE_FORCE
    );
    const impulse2 = new CANNON.Vec3(
      Math.cos(angle2) * this.EARTHQUAKE_FORCE,
      0,
      Math.sin(angle2) * this.EARTHQUAKE_FORCE
    );
    this.p1Body.applyImpulse(impulse1);
    this.p2Body.applyImpulse(impulse2);
  }

  private updateArenaShrink(delta: number): void {
    // Linearly shrink arena from ARENA_RADIUS to ARENA_MIN_RADIUS over 60 seconds
    const shrinkRate = (this.ARENA_RADIUS - this.ARENA_MIN_RADIUS) / 60;
    this.currentArenaRadius = Math.max(
      this.ARENA_MIN_RADIUS,
      this.currentArenaRadius - shrinkRate * delta
    );

    // Asymmetric offset: shift center towards the losing player so their side shrinks less
    let targetCX = 0;
    let targetCZ = 0;

    if (this.scoreP1 !== this.scoreP2) {
      const losingBody = this.scoreP1 < this.scoreP2 ? this.p1Body : this.p2Body;
      const loserDx = losingBody.position.x;
      const loserDz = losingBody.position.z;
      const loserDist = Math.sqrt(loserDx * loserDx + loserDz * loserDz);

      if (loserDist > 0.1) {
        const shrinkProgress = 1 - this.currentArenaRadius / this.ARENA_RADIUS;
        const maxOffset = this.currentArenaRadius * 0.15;
        const offset = shrinkProgress * maxOffset;
        targetCX = (loserDx / loserDist) * offset;
        targetCZ = (loserDz / loserDist) * offset;
      }
    }

    // Smoothly interpolate arena center
    this.arenaCenterX += (targetCX - this.arenaCenterX) * delta * 2;
    this.arenaCenterZ += (targetCZ - this.arenaCenterZ) * delta * 2;

    this.updateArenaVisuals();
  }

  private updateArenaVisuals(): void {
    const scale = this.currentArenaRadius / this.ARENA_RADIUS;
    const cx = this.arenaCenterX;
    const cz = this.arenaCenterZ;

    // Platform (CylinderGeometry: scale X and Z for horizontal radius)
    this.platformMesh.scale.set(scale, 1, scale);
    this.platformMesh.position.set(cx, 0.15, cz);

    // Ring markers (RingGeometry rotated -PI/2: scale local X,Y for world XZ)
    this.ringMarkerInner.scale.set(scale, scale, 1);
    this.ringMarkerInner.position.set(cx, 0.31, cz);

    this.ringMarkerOuter.scale.set(scale, scale, 1);
    this.ringMarkerOuter.position.set(cx, 0.32, cz);

    // Danger zone
    this.dangerZoneMesh.scale.set(scale, scale, 1);
    this.dangerZoneMesh.position.set(cx, 0.33, cz);

    // Edge glow torus (rotated PI/2: local X,Y map to world X,Z)
    this.edgeGlowMesh.scale.set(scale, scale, 1);
    this.edgeGlowMesh.position.set(cx, 0.35, cz);

    // Edge posts: reposition around the new arena boundary
    const postCount = this.edgePosts.length;
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      this.edgePosts[i].position.x = cx + Math.cos(angle) * this.currentArenaRadius;
      this.edgePosts[i].position.z = cz + Math.sin(angle) * this.currentArenaRadius;
    }
  }

  private enforceArenaBounds(body: CANNON.Body): void {
    const dx = body.position.x - this.arenaCenterX;
    const dz = body.position.z - this.arenaCenterZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxDist = this.currentArenaRadius - 0.8;

    if (dist > maxDist && dist > 0.01) {
      const nx = dx / dist;
      const nz = dz / dist;
      body.position.x = this.arenaCenterX + nx * maxDist;
      body.position.z = this.arenaCenterZ + nz * maxDist;

      // Cancel outward velocity component
      const outwardDot = body.velocity.x * nx + body.velocity.z * nz;
      if (outwardDot > 0) {
        body.velocity.x -= nx * outwardDot;
        body.velocity.z -= nz * outwardDot;
      }
    }
  }

  private handleJump(body: CANNON.Body, actionKey: string, player: 'p1' | 'p2'): void {
    const cooldown = player === 'p1' ? this.p1JumpCooldown : this.p2JumpCooldown;
    const isJumping = player === 'p1' ? this.p1IsJumping : this.p2IsJumping;

    if (cooldown > 0 || isJumping) {
      return;
    }
    if (!this.engine.input.wasPressed(actionKey)) {
      return;
    }

    body.velocity.y = this.JUMP_FORCE;

    if (player === 'p1') {
      this.p1IsJumping = true;
      this.p1JumpCooldown = this.JUMP_COOLDOWN;
    } else {
      this.p2IsJumping = true;
      this.p2JumpCooldown = this.JUMP_COOLDOWN;
    }
  }

  private animateEdgeBoundary(): void {
    const edgePulse = 0.5 + 0.5 * Math.sin(this.elapsed * 4);
    const edgeMat = this.edgeGlowMesh.material as THREE.MeshStandardMaterial;
    edgeMat.emissiveIntensity = 1.0 + edgePulse * 1.5;
    edgeMat.opacity = 0.5 + 0.3 * edgePulse;

    const dangerMat = this.dangerZoneMesh.material as THREE.MeshStandardMaterial;
    dangerMat.opacity = 0.15 + 0.15 * edgePulse;

    for (let i = 0; i < this.edgePosts.length; i++) {
      const post = this.edgePosts[i];
      const phase = (i / this.edgePosts.length) * Math.PI * 2;
      post.scale.y = 0.8 + 0.3 * Math.sin(this.elapsed * 2 + phase);
    }
  }

  private animateParticles(delta: number): void {
    const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += delta * 0.3;
      if (arr[i + 1] > 3) {
        arr[i + 1] = 0.5;
      }
    }
    positions.needsUpdate = true;
  }
}
