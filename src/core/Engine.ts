import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { InputManager } from './InputManager';

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public world: CANNON.World;
  public input: InputManager;
  public timer: THREE.Timer;
  public canvas: HTMLCanvasElement;

  private physicsObjects: Array<{ mesh: THREE.Object3D; body: CANNON.Body }> = [];

  public constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.015);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 20, 25);
    this.camera.lookAt(0, 0, 0);

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.5;

    this.input = new InputManager();
    this.timer = new THREE.Timer();

    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public addPhysicsObject(mesh: THREE.Object3D, body: CANNON.Body): void {
    this.scene.add(mesh);
    this.world.addBody(body);
    this.physicsObjects.push({ mesh, body });
  }

  public removePhysicsObject(mesh: THREE.Object3D, body: CANNON.Body): void {
    this.scene.remove(mesh);
    this.world.removeBody(body);
    this.physicsObjects = this.physicsObjects.filter((o) => o.mesh !== mesh || o.body !== body);
  }

  public syncPhysics(): void {
    for (const obj of this.physicsObjects) {
      obj.mesh.position.copy(obj.body.position as unknown as THREE.Vector3);
      obj.mesh.quaternion.copy(obj.body.quaternion as unknown as THREE.Quaternion);
    }
  }

  public clearScene(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      if (child) {
        this.scene.remove(child);
      }
    }
    const bodiesToRemove = [...this.world.bodies];
    for (const body of bodiesToRemove) {
      this.world.removeBody(body);
    }
    // Clear accumulated contact materials from previous modes
    this.world.contactmaterials.length = 0;
    this.physicsObjects = [];
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
