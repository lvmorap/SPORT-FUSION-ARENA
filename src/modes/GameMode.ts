import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Engine } from '../core/Engine';
import { WinnerType } from '../types';

export abstract class GameMode {
  protected engine: Engine;
  protected scoreP1 = 0;
  protected scoreP2 = 0;
  protected isActive = false;

  public constructor(engine: Engine) {
    this.engine = engine;
  }

  public abstract setup(): void;
  public abstract update(delta: number): void;
  public abstract cleanup(): void;

  public getScoreP1(): number {
    return this.scoreP1;
  }

  public getScoreP2(): number {
    return this.scoreP2;
  }

  public getWinner(): WinnerType {
    if (this.scoreP1 > this.scoreP2) {
      return 'P1';
    }
    if (this.scoreP2 > this.scoreP1) {
      return 'P2';
    }
    return 'DRAW';
  }

  public start(): void {
    this.isActive = true;
  }

  public stop(): void {
    this.isActive = false;
  }

  public isFinished(): boolean {
    return false;
  }

  protected addLighting(color = 0xffffff): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.engine.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(color, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.engine.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    this.engine.scene.add(hemiLight);
  }

  protected createPlayerMesh(color: number): THREE.Group {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.5,
    });
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.4,
      metalness: 0.2,
    });

    // Torso (jersey)
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.55, 0.3);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.42;
    head.castShadow = true;
    group.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.36, 0.95, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.36, 0.95, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Shorts / hips
    const hipsGeo = new THREE.BoxGeometry(0.45, 0.2, 0.28);
    const hips = new THREE.Mesh(hipsGeo, shortsMat);
    hips.position.y = 0.58;
    hips.castShadow = true;
    group.add(hips);

    // Left leg
    const legGeo = new THREE.BoxGeometry(0.14, 0.4, 0.14);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.13, 0.28, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    // Right leg (used for kick animation)
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.13, 0.28, 0);
    rightLeg.castShadow = true;
    rightLeg.name = 'kickLeg';
    group.add(rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.16, 0.08, 0.22);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.13, 0.04, 0.02);
    group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.13, 0.04, 0.02);
    rightShoe.name = 'kickShoe';
    group.add(rightShoe);

    // Glow ring at feet (team indicator)
    const ringGeo = new THREE.TorusGeometry(0.4, 0.04, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  protected createBallMesh(radius: number, color: number): THREE.Mesh {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  protected createPlayerBody(x: number, z: number): CANNON.Body {
    const body = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.75, 0.25)),
      position: new CANNON.Vec3(x, 0.85, z),
      linearDamping: 0.9,
      angularDamping: 0.99,
    });
    body.fixedRotation = true;
    return body;
  }

  protected createBallBody(radius: number, x: number, y: number, z: number, mass = 1): CANNON.Body {
    return new CANNON.Body({
      mass,
      shape: new CANNON.Sphere(radius),
      position: new CANNON.Vec3(x, y, z),
      linearDamping: 0.3,
      angularDamping: 0.3,
    });
  }

  protected handlePlayerMovement(
    body: CANNON.Body,
    controls: { up: string; down: string; left: string; right: string },
    speed: number
  ): void {
    const force = new CANNON.Vec3(0, 0, 0);
    const input = this.engine.input;

    if (input.isDown(controls.up)) {
      force.z -= speed;
    }
    if (input.isDown(controls.down)) {
      force.z += speed;
    }
    if (input.isDown(controls.left)) {
      force.x -= speed;
    }
    if (input.isDown(controls.right)) {
      force.x += speed;
    }

    body.applyForce(force);
  }
}
