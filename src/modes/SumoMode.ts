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

  private readonly ARENA_RADIUS = 12;
  private readonly ZONE_RADIUS = 4;
  private readonly PLAYER_SPEED = 65;
  private readonly DASH_FORCE = 280;
  private readonly DASH_COOLDOWN = 1.5;
  private readonly ZONE_ORBIT_RADIUS = 5;
  private readonly ZONE_ORBIT_SPEED = 0.4;
  private readonly PUSH_RADIUS = 2.0;
  private readonly PUSH_FORCE = 150;

  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.elapsed = 0;
    this.p1DashCooldown = 0;
    this.p2DashCooldown = 0;
    this.p1LastDir = new CANNON.Vec3(0, 0, -1);
    this.p2LastDir = new CANNON.Vec3(0, 0, 1);
    this.sceneObjects = [];
    this.edgePosts = [];

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

    // Player movement with dynamic forces
    this.handlePlayerMovement(this.p1Body, P1_CONTROLS, this.PLAYER_SPEED);
    this.handlePlayerMovement(this.p2Body, P2_CONTROLS, this.PLAYER_SPEED);

    // Track facing directions from velocity
    this.updateFacingDirection(this.p1Body, this.p1LastDir);
    this.updateFacingDirection(this.p2Body, this.p2LastDir);

    // Rotate player meshes to face movement direction
    this.rotateToVelocity(this.p1Mesh, this.p1Body);
    this.rotateToVelocity(this.p2Mesh, this.p2Body);

    // Dash / push mechanic
    this.p1DashCooldown = Math.max(0, this.p1DashCooldown - delta);
    this.p2DashCooldown = Math.max(0, this.p2DashCooldown - delta);
    this.handleDash(this.p1Body, this.p1LastDir, P1_CONTROLS.action1, 'p1');
    this.handleDash(this.p2Body, this.p2LastDir, P2_CONTROLS.action1, 'p2');

    // Collision-based push between players
    this.handlePlayerCollisionPush();

    // Keep players on ground
    this.p1Body.position.y = 0.6;
    this.p2Body.position.y = 0.6;
    this.p1Body.velocity.y = 0;
    this.p2Body.velocity.y = 0;

    // Sync physics
    this.engine.syncPhysics();

    // Move scoring zone
    this.zoneX = Math.cos(this.elapsed * this.ZONE_ORBIT_SPEED) * this.ZONE_ORBIT_RADIUS;
    this.zoneZ = Math.sin(this.elapsed * this.ZONE_ORBIT_SPEED) * this.ZONE_ORBIT_RADIUS;
    this.zoneMesh.position.set(this.zoneX, 0.02, this.zoneZ);
    this.zoneGlowMesh.position.set(this.zoneX, 0.03, this.zoneZ);

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
    this.p1Mesh = this.createPlayerMesh(COLORS.P1);
    this.p1Body = this.createPlayerBody(0, -4);
    this.engine.addPhysicsObject(this.p1Mesh, this.p1Body);

    this.p2Mesh = this.createPlayerMesh(COLORS.P2);
    this.p2Body = this.createPlayerBody(0, 4);
    this.engine.addPhysicsObject(this.p2Mesh, this.p2Body);
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
    if (!this.engine.input.isDown(actionKey)) {
      return;
    }

    const impulse = new CANNON.Vec3(dir.x * this.DASH_FORCE, 0, dir.z * this.DASH_FORCE);
    body.applyImpulse(impulse, body.position);

    if (player === 'p1') {
      this.p1DashCooldown = this.DASH_COOLDOWN;
    } else {
      this.p2DashCooldown = this.DASH_COOLDOWN;
    }
  }

  private updateScoring(delta: number): void {
    const p1Dist = this.distToZone(this.p1Body);
    const p2Dist = this.distToZone(this.p2Body);

    if (p1Dist <= this.ZONE_RADIUS) {
      this.scoreP1 += 2 * delta;
    }

    if (p2Dist <= this.ZONE_RADIUS) {
      this.scoreP2 += 2 * delta;
    }
  }

  private distToZone(body: CANNON.Body): number {
    const dx = body.position.x - this.zoneX;
    const dz = body.position.z - this.zoneZ;
    return Math.sqrt(dx * dx + dz * dz);
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
      // Relative velocity along collision normal
      const relVx = this.p1Body.velocity.x - this.p2Body.velocity.x;
      const relVz = this.p1Body.velocity.z - this.p2Body.velocity.z;
      const relDot = relVx * nx + relVz * nz;
      if (relDot > 0) {
        const pushImpulse = new CANNON.Vec3(
          nx * this.PUSH_FORCE * relDot * 0.02,
          0,
          nz * this.PUSH_FORCE * relDot * 0.02
        );
        this.p2Body.applyImpulse(pushImpulse, this.p2Body.position);
        this.p1Body.applyImpulse(
          new CANNON.Vec3(-pushImpulse.x, 0, -pushImpulse.z),
          this.p1Body.position
        );
      }
    }
  }

  private animateEdgeBoundary(): void {
    // Pulse the edge glow
    const edgePulse = 0.5 + 0.5 * Math.sin(this.elapsed * 4);
    const edgeMat = this.edgeGlowMesh.material as THREE.MeshStandardMaterial;
    edgeMat.emissiveIntensity = 1.0 + edgePulse * 1.5;
    edgeMat.opacity = 0.5 + 0.3 * edgePulse;

    // Pulse danger zone
    const dangerMat = this.dangerZoneMesh.material as THREE.MeshStandardMaterial;
    dangerMat.opacity = 0.15 + 0.15 * edgePulse;

    // Animate posts height
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
