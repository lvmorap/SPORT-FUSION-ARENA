import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameMode } from './GameMode';
import { P1_CONTROLS, P2_CONTROLS, COLORS } from '../types';

export class FootballMode extends GameMode {
  // ── Players ──
  private p1Mesh!: THREE.Group;
  private p2Mesh!: THREE.Group;
  private p1Body!: CANNON.Body;
  private p2Body!: CANNON.Body;

  // ── Ball ──
  private ballMesh!: THREE.Mesh;
  private ballBody!: CANNON.Body;

  // ── Goals ──
  private goal1Group!: THREE.Group;
  private goal2Group!: THREE.Group;

  // ── Scene objects ──
  private extraObjects: THREE.Object3D[] = [];
  private wallBodies: CANNON.Body[] = [];

  // ── Goal random movement ──
  private goalTargetZ = 0;
  private goalTargetY = 3;
  private goalCurrentZ = 0;
  private goalCurrentY = 3;
  private goalMoveTimer = 0;
  private readonly GOAL_MOVE_INTERVAL = 1.8;
  private readonly GOAL_LERP_SPEED = 2.5;

  // ── Goal dimensions ──
  private readonly GOAL_HALF_WIDTH = 3.5;
  private readonly GOAL_HALF_HEIGHT = 2.0;

  // ── Goal scoring ──
  private goalCooldown = false;
  private goalResetTimer: ReturnType<typeof setTimeout> | null = null;
  private flashOverlay!: THREE.Mesh;

  // ── Kick animation ──
  private p1KickTimer = 0;
  private p2KickTimer = 0;
  private readonly KICK_ANIM_DURATION = 0.25;

  // ── Field & gameplay constants ──
  private readonly FIELD_WIDTH = 34;
  private readonly FIELD_DEPTH = 22;
  private readonly WALL_HEIGHT = 1.5;
  private readonly PLAYER_SPEED = 120;
  private readonly KICK_FORCE = 28;
  private readonly BALL_RADIUS = 0.45;
  private readonly GOAL_LINE_X = 16;
  private readonly JUMP_IMPULSE = 18;
  private readonly FALL_GRAVITY_MULT = 3.0;
  private readonly PLAYER_HALF_H = 1.1;
  private readonly PLAYER_SCALE = 1.5;
  private readonly MIN_KICK_DIST_EPSILON = 0.01;
  private readonly WALL_BOUNCE_DAMPING = 0.85;
  private readonly FLOOR_BOUNCE_DAMPING = 0.6;

  // ── Physics materials ──
  private matGround!: CANNON.Material;
  private matPlayer!: CANNON.Material;
  private matBall!: CANNON.Material;
  private matWall!: CANNON.Material;

  /* ================================================================
   *  SETUP
   * ================================================================ */
  public setup(): void {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.goalCooldown = false;
    this.p1KickTimer = 0;
    this.p2KickTimer = 0;
    this.goalMoveTimer = 0;
    this.goalCurrentZ = 0;
    this.goalCurrentY = this.GOAL_HALF_HEIGHT + 0.5;
    this.goalTargetZ = 0;
    this.goalTargetY = this.goalCurrentY;

    this.setupPhysicsMaterials();
    this.setupCamera();
    this.addLighting(0x88ff88);
    this.createStadium();
    this.createField();
    this.createFieldLines();
    this.createWalls();
    this.createGround();
    this.createGoals();
    this.createPlayers();
    this.createBall();
    this.createFlashOverlay();
  }

  /* ================================================================
   *  UPDATE
   * ================================================================ */
  public update(delta: number): void {
    if (!this.isActive) {return;}

    // ── Player movement ──
    this.handlePlayerMovement(this.p1Body, P1_CONTROLS, this.PLAYER_SPEED);
    this.handlePlayerMovement(this.p2Body, P2_CONTROLS, this.PLAYER_SPEED);

    // ── Jump ──
    this.handleJump(this.p1Body, P1_CONTROLS.action2);
    this.handleJump(this.p2Body, P2_CONTROLS.action2);

    // ── Kick ──
    this.handleKick(this.p1Body, P1_CONTROLS.action1, 1);
    this.handleKick(this.p2Body, P2_CONTROLS.action1, 2);

    // ── Extra downward gravity for fast falling ──
    const extraG = -9.82 * this.FALL_GRAVITY_MULT;
    this.p1Body.force.y += this.p1Body.mass * extraG;
    this.p2Body.force.y += this.p2Body.mass * extraG;
    this.ballBody.force.y += this.ballBody.mass * extraG;

    // ── Keep players always upright ──
    this.enforceUpright(this.p1Body, this.p1Mesh);
    this.enforceUpright(this.p2Body, this.p2Mesh);

    // ── Clamp players to field area ──
    this.clampPlayerPosition(this.p1Body);
    this.clampPlayerPosition(this.p2Body);

    // ── Kick animation ──
    this.updateKickAnimation(this.p1Mesh, delta, 1);
    this.updateKickAnimation(this.p2Mesh, delta, 2);

    // ── Random goal movement ──
    this.updateGoalMovement(delta);

    // ── Physics sync ──
    this.engine.syncPhysics();

    // ── Face movement direction (after sync so mesh is positioned) ──
    this.faceVelocity(this.p1Mesh, this.p1Body);
    this.faceVelocity(this.p2Mesh, this.p2Body);

    // ── Ball spin visual (rotate mesh by angular vel) ──
    this.ballMesh.rotation.x += this.ballBody.angularVelocity.x * delta;
    this.ballMesh.rotation.y += this.ballBody.angularVelocity.y * delta;
    this.ballMesh.rotation.z += this.ballBody.angularVelocity.z * delta;

    // ── Contain ball ──
    this.containBall();

    // ── Goal detection ──
    this.checkGoals();

    // ── Fade flash ──
    const flashMat = this.flashOverlay.material as THREE.MeshBasicMaterial;
    if (flashMat.opacity > 0) {
      flashMat.opacity = Math.max(0, flashMat.opacity - delta * 3);
    }
  }

  /* ================================================================
   *  CLEANUP
   * ================================================================ */
  public cleanup(): void {
    if (this.goalResetTimer !== null) {
      clearTimeout(this.goalResetTimer);
      this.goalResetTimer = null;
    }
    this.engine.clearScene();
    this.extraObjects = [];
    this.wallBodies = [];
  }

  /* ----------------------------------------------------------------
   *  Physics materials & contact materials
   * ---------------------------------------------------------------- */
  private setupPhysicsMaterials(): void {
    this.matGround = new CANNON.Material('ground');
    this.matPlayer = new CANNON.Material('player');
    this.matBall = new CANNON.Material('ball');
    this.matWall = new CANNON.Material('wall');

    const world = this.engine.world;

    world.addContactMaterial(new CANNON.ContactMaterial(this.matBall, this.matGround, {
      friction: 0.4,
      restitution: 0.6,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.matBall, this.matWall, {
      friction: 0.1,
      restitution: 0.8,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.matBall, this.matPlayer, {
      friction: 0.3,
      restitution: 0.5,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.matPlayer, this.matGround, {
      friction: 0.9,
      restitution: 0.0,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.matPlayer, this.matWall, {
      friction: 0.2,
      restitution: 0.1,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.matPlayer, this.matPlayer, {
      friction: 0.3,
      restitution: 0.2,
    }));
  }

  /* ----------------------------------------------------------------
   *  Camera
   * ---------------------------------------------------------------- */
  private setupCamera(): void {
    this.engine.camera.position.set(0, 28, 30);
    this.engine.camera.lookAt(0, 1, 0);
  }

  /* ----------------------------------------------------------------
   *  Stadium scenery
   * ---------------------------------------------------------------- */
  private createStadium(): void {
    // Sky color
    this.engine.scene.background = new THREE.Color(0x0a2a0a);

    // Surrounding stands (simple boxes)
    const standMat = new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.9 });
    const standPositions: Array<[number, number, number, number, number, number]> = [
      [this.FIELD_WIDTH + 8, 4, 2, 0, 2, -(this.FIELD_DEPTH / 2 + 4)],
      [this.FIELD_WIDTH + 8, 4, 2, 0, 2, this.FIELD_DEPTH / 2 + 4],
      [2, 4, this.FIELD_DEPTH + 8, -(this.FIELD_WIDTH / 2 + 4), 2, 0],
      [2, 4, this.FIELD_DEPTH + 8, this.FIELD_WIDTH / 2 + 4, 2, 0],
    ];
    for (const [sx, sy, sz, px, py, pz] of standPositions) {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, standMat);
      mesh.position.set(px, py, pz);
      mesh.receiveShadow = true;
      this.engine.scene.add(mesh);
      this.extraObjects.push(mesh);
    }

    // Floodlights at corners
    const lightPositions = [
      [-this.FIELD_WIDTH / 2 - 2, 16, -this.FIELD_DEPTH / 2 - 2],
      [this.FIELD_WIDTH / 2 + 2, 16, -this.FIELD_DEPTH / 2 - 2],
      [-this.FIELD_WIDTH / 2 - 2, 16, this.FIELD_DEPTH / 2 + 2],
      [this.FIELD_WIDTH / 2 + 2, 16, this.FIELD_DEPTH / 2 + 2],
    ];
    for (const [lx, ly, lz] of lightPositions) {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
      const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, ly, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, ly / 2, lz);
      this.engine.scene.add(pole);
      this.extraObjects.push(pole);

      const spot = new THREE.SpotLight(0xffffff, 1.5, 50, Math.PI / 4, 0.5);
      spot.position.set(lx, ly, lz);
      spot.target.position.set(0, 0, 0);
      spot.castShadow = false;
      this.engine.scene.add(spot);
      this.engine.scene.add(spot.target);
      this.extraObjects.push(spot, spot.target);
    }
  }

  /* ----------------------------------------------------------------
   *  Field (grass)
   * ---------------------------------------------------------------- */
  private createField(): void {
    const geo = new THREE.PlaneGeometry(this.FIELD_WIDTH, this.FIELD_DEPTH);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a8a1a, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);
    this.extraObjects.push(mesh);
  }

  /* ----------------------------------------------------------------
   *  Field lines
   * ---------------------------------------------------------------- */
  private createFieldLines(): void {
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const t = 0.1;

    const addLine = (w: number, d: number, x: number, z: number): void => {
      const geo = new THREE.PlaneGeometry(w, d);
      const m = new THREE.Mesh(geo, lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.02, z);
      this.engine.scene.add(m);
      this.extraObjects.push(m);
    };

    // Boundary
    addLine(this.FIELD_WIDTH, t, 0, -hd);
    addLine(this.FIELD_WIDTH, t, 0, hd);
    addLine(t, this.FIELD_DEPTH, -hw, 0);
    addLine(t, this.FIELD_DEPTH, hw, 0);
    // Center line
    addLine(t, this.FIELD_DEPTH, 0, 0);
    // Center circle
    const circleGeo = new THREE.RingGeometry(3, 3.15, 64);
    const circle = new THREE.Mesh(circleGeo, lineMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    this.engine.scene.add(circle);
    this.extraObjects.push(circle);
    // Goal areas
    const ga = 6;
    const gd = 10;
    addLine(ga, t, -hw + ga / 2, -gd / 2);
    addLine(ga, t, -hw + ga / 2, gd / 2);
    addLine(t, gd, -hw + ga, 0);
    addLine(ga, t, hw - ga / 2, -gd / 2);
    addLine(ga, t, hw - ga / 2, gd / 2);
    addLine(t, gd, hw - ga, 0);
  }

  /* ----------------------------------------------------------------
   *  Walls (invisible physics boundaries + short visible walls)
   * ---------------------------------------------------------------- */
  private createWalls(): void {
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const wt = 0.5;
    const wh = this.WALL_HEIGHT;

    const addWall = (sx: number, sy: number, sz: number, px: number, py: number, pz: number, visible: boolean): void => {
      const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
      const body = new CANNON.Body({ mass: 0, shape, material: this.matWall });
      body.position.set(px, py, pz);
      this.engine.world.addBody(body);
      this.wallBodies.push(body);

      if (visible) {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x226622,
          transparent: true,
          opacity: 0.35,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        this.engine.scene.add(mesh);
        this.extraObjects.push(mesh);
      }
    };

    // Four side walls
    addWall(this.FIELD_WIDTH + wt * 2, wh, wt, 0, wh / 2, -hd - wt / 2, true);
    addWall(this.FIELD_WIDTH + wt * 2, wh, wt, 0, wh / 2, hd + wt / 2, true);
    addWall(wt, wh, this.FIELD_DEPTH, -hw - wt / 2, wh / 2, 0, true);
    addWall(wt, wh, this.FIELD_DEPTH, hw + wt / 2, wh / 2, 0, true);
  }

  /* ----------------------------------------------------------------
   *  Ground physics body
   * ---------------------------------------------------------------- */
  private createGround(): void {
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.matGround,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.engine.world.addBody(groundBody);
  }

  /* ----------------------------------------------------------------
   *  Goals
   * ---------------------------------------------------------------- */
  private createGoals(): void {
    this.goal1Group = this.buildGoal(COLORS.P2, -this.FIELD_WIDTH / 2);
    this.goal2Group = this.buildGoal(COLORS.P1, this.FIELD_WIDTH / 2);
  }

  private buildGoal(color: number, xPos: number): THREE.Group {
    const group = new THREE.Group();
    const ph = this.GOAL_HALF_HEIGHT * 2;
    const gw = this.GOAL_HALF_WIDTH * 2;
    const r = 0.18;

    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.8 });
    const glowMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.3,
    });

    const postGeo = new THREE.CylinderGeometry(r, r, ph, 12);
    const crossGeo = new THREE.CylinderGeometry(r, r, gw, 12);

    // Posts
    const lp = new THREE.Mesh(postGeo, postMat);
    lp.position.set(0, 0, -gw / 2);
    lp.castShadow = true;
    group.add(lp);

    const rp = new THREE.Mesh(postGeo, postMat);
    rp.position.set(0, 0, gw / 2);
    rp.castShadow = true;
    group.add(rp);

    // Crossbar
    const cb = new THREE.Mesh(crossGeo, postMat);
    cb.position.set(0, ph / 2, 0);
    cb.rotation.x = Math.PI / 2;
    cb.castShadow = true;
    group.add(cb);

    // Bottom bar
    const bb = new THREE.Mesh(crossGeo, postMat);
    bb.position.set(0, -ph / 2, 0);
    bb.rotation.x = Math.PI / 2;
    group.add(bb);

    // Glow outlines
    const gr = r + 0.1;
    const glowPostGeo = new THREE.CylinderGeometry(gr, gr, ph + 0.15, 12);
    const glowCrossGeo = new THREE.CylinderGeometry(gr, gr, gw + 0.15, 12);

    const lg = new THREE.Mesh(glowPostGeo, glowMat);
    lg.position.copy(lp.position);
    group.add(lg);
    const rg = new THREE.Mesh(glowPostGeo, glowMat);
    rg.position.copy(rp.position);
    group.add(rg);

    const cg = new THREE.Mesh(glowCrossGeo, glowMat);
    cg.position.copy(cb.position);
    cg.rotation.x = Math.PI / 2;
    group.add(cg);
    const bg = new THREE.Mesh(glowCrossGeo, glowMat);
    bg.position.copy(bb.position);
    bg.rotation.x = Math.PI / 2;
    group.add(bg);

    // Net
    const nd = 2;
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, wireframe: true,
    });
    const ox = xPos < 0 ? -nd / 2 : nd / 2;
    const backGeo = new THREE.PlaneGeometry(gw, ph, 14, 8);
    group.add(new THREE.Mesh(backGeo, netMat).translateX(ox));
    const topGeo = new THREE.PlaneGeometry(gw, nd, 14, 4);
    const topNet = new THREE.Mesh(topGeo, netMat);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(ox / 2, ph / 2, 0);
    group.add(topNet);
    const botNet = new THREE.Mesh(topGeo, netMat);
    botNet.rotation.x = Math.PI / 2;
    botNet.position.set(ox / 2, -ph / 2, 0);
    group.add(botNet);
    const sideGeo = new THREE.PlaneGeometry(nd, ph, 4, 8);
    const ls = new THREE.Mesh(sideGeo, netMat);
    ls.rotation.y = Math.PI / 2;
    ls.position.set(ox / 2, 0, -gw / 2);
    group.add(ls);
    const rs = new THREE.Mesh(sideGeo, netMat);
    rs.rotation.y = Math.PI / 2;
    rs.position.set(ox / 2, 0, gw / 2);
    group.add(rs);

    group.position.set(xPos, ph / 2 + 0.5, 0);
    this.engine.scene.add(group);
    return group;
  }

  /* ----------------------------------------------------------------
   *  Players – bigger humanoid meshes
   * ---------------------------------------------------------------- */
  private createPlayers(): void {
    this.p1Mesh = this.buildPlayerMesh(COLORS.P1);
    this.p1Body = this.buildPlayerBody(-6, 0);
    this.engine.addPhysicsObject(this.p1Mesh, this.p1Body);

    this.p2Mesh = this.buildPlayerMesh(COLORS.P2);
    this.p2Body = this.buildPlayerBody(6, 0);
    this.engine.addPhysicsObject(this.p2Mesh, this.p2Body);
  }

  private buildPlayerMesh(color: number): THREE.Group {
    const s = this.PLAYER_SCALE;
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.2 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 0.6 * s, 0.35 * s), bodyMat);
    torso.position.y = 1.0 * s;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 16, 16), skinMat);
    head.position.y = 1.55 * s;
    head.castShadow = true;
    group.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14 * s, 0.5 * s, 0.14 * s);
    const la = new THREE.Mesh(armGeo, skinMat);
    la.position.set(-0.40 * s, 1.0 * s, 0);
    la.castShadow = true;
    group.add(la);
    const ra = new THREE.Mesh(armGeo, skinMat);
    ra.position.set(0.40 * s, 1.0 * s, 0);
    ra.castShadow = true;
    group.add(ra);

    // Shorts
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.50 * s, 0.22 * s, 0.32 * s), shortsMat);
    hips.position.y = 0.60 * s;
    hips.castShadow = true;
    group.add(hips);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.16 * s, 0.45 * s, 0.16 * s);
    const ll = new THREE.Mesh(legGeo, skinMat);
    ll.position.set(-0.15 * s, 0.30 * s, 0);
    ll.castShadow = true;
    group.add(ll);
    const rl = new THREE.Mesh(legGeo, skinMat);
    rl.position.set(0.15 * s, 0.30 * s, 0);
    rl.castShadow = true;
    rl.name = 'kickLeg';
    group.add(rl);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.18 * s, 0.10 * s, 0.26 * s);
    const lsh = new THREE.Mesh(shoeGeo, shoeMat);
    lsh.position.set(-0.15 * s, 0.05 * s, 0.02 * s);
    group.add(lsh);
    const rsh = new THREE.Mesh(shoeGeo, shoeMat);
    rsh.position.set(0.15 * s, 0.05 * s, 0.02 * s);
    rsh.name = 'kickShoe';
    group.add(rsh);

    // Team indicator ring
    const ringGeo = new THREE.TorusGeometry(0.55 * s, 0.05 * s, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.03;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  private buildPlayerBody(x: number, z: number): CANNON.Body {
    const s = this.PLAYER_SCALE;
    const hh = this.PLAYER_HALF_H;
    const body = new CANNON.Body({
      mass: 15,
      shape: new CANNON.Box(new CANNON.Vec3(0.35 * s, hh, 0.35 * s)),
      position: new CANNON.Vec3(x, hh, z),
      linearDamping: 0.92,
      angularDamping: 1.0,
      material: this.matPlayer,
    });
    body.fixedRotation = true;
    body.updateMassProperties();
    return body;
  }

  /* ----------------------------------------------------------------
   *  Ball – procedural football texture
   * ---------------------------------------------------------------- */
  private createBall(): void {
    const tex = this.generateFootballTexture();
    const geo = new THREE.SphereGeometry(this.BALL_RADIUS, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.05 });
    this.ballMesh = new THREE.Mesh(geo, mat);
    this.ballMesh.castShadow = true;
    this.ballMesh.receiveShadow = true;

    this.ballBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(this.BALL_RADIUS),
      position: new CANNON.Vec3(0, 2, 0),
      linearDamping: 0.08,
      angularDamping: 0.15,
      material: this.matBall,
    });

    this.engine.addPhysicsObject(this.ballMesh, this.ballBody);
  }

  private generateFootballTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    // White base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw black pentagons in a tiled pattern
    ctx.fillStyle = '#222222';
    const pentR = 38;
    const cols = 7;
    const rows = 5;
    const spacingX = size / cols;
    const spacingY = size / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = spacingX * (col + 0.5) + (row % 2 === 1 ? spacingX / 2 : 0);
        const cy = spacingY * (row + 0.5);
        this.drawPentagon(ctx, cx % size, cy, pentR);
      }
    }

    // Seam lines
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = spacingX * (col + 0.5) + (row % 2 === 1 ? spacingX / 2 : 0);
        const cy = spacingY * (row + 0.5);
        ctx.beginPath();
        ctx.arc(cx % size, cy, pentR + 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private drawPentagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {ctx.moveTo(x, y);}
      else {ctx.lineTo(x, y);}
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ----------------------------------------------------------------
   *  Flash overlay for goal celebration
   * ---------------------------------------------------------------- */
  private createFlashOverlay(): void {
    const geo = new THREE.PlaneGeometry(120, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthTest: false,
    });
    this.flashOverlay = new THREE.Mesh(geo, mat);
    this.flashOverlay.position.set(0, 20, 0);
    this.flashOverlay.rotation.x = -Math.PI / 2;
    this.flashOverlay.renderOrder = 999;
    this.engine.scene.add(this.flashOverlay);
  }

  /* ================================================================
   *  PLAYER DYNAMICS
   * ================================================================ */

  private enforceUpright(body: CANNON.Body, mesh: THREE.Group): void {
    // Zero out all rotation – players always stand vertical
    body.quaternion.set(0, 0, 0, 1);
    body.angularVelocity.set(0, 0, 0);
    // Mesh rotation is handled separately for facing direction
    mesh.quaternion.set(0, 0, 0, 1);
  }

  private clampPlayerPosition(body: CANNON.Body): void {
    const hw = this.FIELD_WIDTH / 2 - 0.5;
    const hd = this.FIELD_DEPTH / 2 - 0.5;
    const hh = this.PLAYER_HALF_H;

    if (body.position.y < hh) {
      body.position.y = hh;
      if (body.velocity.y < 0) {body.velocity.y = 0;}
    }
    if (body.position.x < -hw) { body.position.x = -hw; body.velocity.x = 0; }
    if (body.position.x > hw) { body.position.x = hw; body.velocity.x = 0; }
    if (body.position.z < -hd) { body.position.z = -hd; body.velocity.z = 0; }
    if (body.position.z > hd) { body.position.z = hd; body.velocity.z = 0; }
  }

  private faceVelocity(mesh: THREE.Group, body: CANNON.Body): void {
    const vx = body.velocity.x;
    const vz = body.velocity.z;
    if (vx * vx + vz * vz > 0.5) {
      mesh.rotation.y = Math.atan2(vx, vz);
    }
  }

  private handleJump(body: CANNON.Body, key: string): void {
    if (!this.engine.input.wasPressed(key)) {return;}
    const hh = this.PLAYER_HALF_H;
    if (body.position.y < hh + 0.25) {
      body.velocity.y = this.JUMP_IMPULSE;
    }
  }

  private handleKick(body: CANNON.Body, key: string, pn: number): void {
    if (!this.engine.input.wasPressed(key)) {return;}

    if (pn === 1) {this.p1KickTimer = this.KICK_ANIM_DURATION;}
    else {this.p2KickTimer = this.KICK_ANIM_DURATION;}

    const dx = this.ballBody.position.x - body.position.x;
    const dy = this.ballBody.position.y - body.position.y;
    const dz = this.ballBody.position.z - body.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 3.0) {
      const inv = 1 / Math.max(dist, this.MIN_KICK_DIST_EPSILON);
      const nx = dx * inv;
      const ny = dy * inv;
      const nz = dz * inv;
      // Reset ball velocity before kick for crisp response
      this.ballBody.velocity.set(0, 0, 0);
      this.ballBody.applyImpulse(
        new CANNON.Vec3(nx * this.KICK_FORCE, ny * this.KICK_FORCE * 0.7, nz * this.KICK_FORCE),
        new CANNON.Vec3(0, 0, 0),
      );
    }
  }

  private updateKickAnimation(mesh: THREE.Group, delta: number, pn: number): void {
    const s = this.PLAYER_SCALE;
    const timer = pn === 1 ? this.p1KickTimer : this.p2KickTimer;
    const leg = mesh.getObjectByName('kickLeg');
    const shoe = mesh.getObjectByName('kickShoe');
    if (!leg || !shoe) {return;}

    if (timer > 0) {
      const progress = 1 - timer / this.KICK_ANIM_DURATION;
      const swing = Math.sin(progress * Math.PI) * 1.2;
      leg.rotation.x = -swing;
      leg.position.y = 0.30 * s + Math.sin(progress * Math.PI) * 0.12 * s;
      leg.position.z = -Math.sin(progress * Math.PI) * 0.3 * s;
      shoe.rotation.x = -swing * 0.8;
      shoe.position.y = 0.05 * s + Math.sin(progress * Math.PI) * 0.18 * s;
      shoe.position.z = 0.02 * s - Math.sin(progress * Math.PI) * 0.35 * s;

      if (pn === 1) {this.p1KickTimer -= delta;}
      else {this.p2KickTimer -= delta;}
    } else {
      leg.rotation.x = 0;
      leg.position.set(0.15 * s, 0.30 * s, 0);
      shoe.rotation.x = 0;
      shoe.position.set(0.15 * s, 0.05 * s, 0.02 * s);
    }
  }

  /* ================================================================
   *  GOAL MOVEMENT – random targets along Z and Y
   * ================================================================ */
  private updateGoalMovement(delta: number): void {
    this.goalMoveTimer += delta;
    if (this.goalMoveTimer >= this.GOAL_MOVE_INTERVAL) {
      this.goalMoveTimer = 0;
      const maxZ = this.FIELD_DEPTH / 2 - this.GOAL_HALF_WIDTH - 1;
      const maxY = 6;
      const minY = this.GOAL_HALF_HEIGHT + 0.5;
      this.goalTargetZ = (Math.random() * 2 - 1) * maxZ;
      this.goalTargetY = minY + Math.random() * (maxY - minY);
    }

    // Smooth lerp towards target
    this.goalCurrentZ += (this.goalTargetZ - this.goalCurrentZ) * this.GOAL_LERP_SPEED * delta;
    this.goalCurrentY += (this.goalTargetY - this.goalCurrentY) * this.GOAL_LERP_SPEED * delta;

    this.goal1Group.position.z = this.goalCurrentZ;
    this.goal2Group.position.z = this.goalCurrentZ;
    this.goal1Group.position.y = this.goalCurrentY;
    this.goal2Group.position.y = this.goalCurrentY;
  }

  /* ================================================================
   *  BALL CONTAINMENT
   * ================================================================ */
  private containBall(): void {
    const hw = this.FIELD_WIDTH / 2;
    const hd = this.FIELD_DEPTH / 2;
    const r = this.BALL_RADIUS;
    const b = this.ballBody;

    if (b.position.x < -hw + r) { b.position.x = -hw + r; b.velocity.x = Math.abs(b.velocity.x) * this.WALL_BOUNCE_DAMPING; }
    if (b.position.x > hw - r)  { b.position.x = hw - r;  b.velocity.x = -Math.abs(b.velocity.x) * this.WALL_BOUNCE_DAMPING; }
    if (b.position.z < -hd + r) { b.position.z = -hd + r; b.velocity.z = Math.abs(b.velocity.z) * this.WALL_BOUNCE_DAMPING; }
    if (b.position.z > hd - r)  { b.position.z = hd - r;  b.velocity.z = -Math.abs(b.velocity.z) * this.WALL_BOUNCE_DAMPING; }
    // Floor bounce is handled by physics, but add safety net
    if (b.position.y < r) { b.position.y = r; if (b.velocity.y < 0) {b.velocity.y *= -this.FLOOR_BOUNCE_DAMPING;} }
  }

  /* ================================================================
   *  GOAL DETECTION
   * ================================================================ */
  private checkGoals(): void {
    if (this.goalCooldown) {return;}

    const bx = this.ballBody.position.x;
    const bz = this.ballBody.position.z;
    const by = this.ballBody.position.y;
    const bvx = this.ballBody.velocity.x;
    const gz = this.goalCurrentZ;
    const gy = this.goalCurrentY;

    const inZ = bz > gz - this.GOAL_HALF_WIDTH && bz < gz + this.GOAL_HALF_WIDTH;
    const inY = by > gy - this.GOAL_HALF_HEIGHT && by < gy + this.GOAL_HALF_HEIGHT;

    if (bx < -this.GOAL_LINE_X && inZ && inY && bvx < 0) {
      this.scoreP2++;
      this.onGoalScored(COLORS.P2);
      return;
    }
    if (bx > this.GOAL_LINE_X && inZ && inY && bvx > 0) {
      this.scoreP1++;
      this.onGoalScored(COLORS.P1);
    }
  }

  private onGoalScored(flashColor: number): void {
    this.goalCooldown = true;
    const flashMat = this.flashOverlay.material as THREE.MeshBasicMaterial;
    flashMat.color.setHex(flashColor);
    flashMat.opacity = 0.6;

    this.goalResetTimer = setTimeout(() => {
      this.resetBall();
      this.goalCooldown = false;
      this.goalResetTimer = null;
    }, 800);
  }

  private resetBall(): void {
    this.ballBody.position.set(0, 2, 0);
    this.ballBody.velocity.set(0, 0, 0);
    this.ballBody.angularVelocity.set(0, 0, 0);
  }
}
