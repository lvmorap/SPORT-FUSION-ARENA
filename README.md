# PROMPT — Recrear SPORT FUSION ARENA 3D desde cero

Usa este prompt completo para recrear el proyecto entero. Incluye cada archivo, constante, regla y mecánica exacta.

---

## 1. INICIALIZAR PROYECTO

```bash
mkdir sport-fusion-arena && cd sport-fusion-arena
npm init -y
```

Edita `package.json`:
```json
{
  "name": "sport-fusion-arena",
  "version": "2.0.0",
  "description": "4 deportes reinventados en 3D — Un juego de deportes 3D local para 2 jugadores con Three.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

Instala dependencias:
```bash
npm install three cannon-es
npm install -D typescript vite @types/three eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript-eslint prettier
```

Versiones exactas usadas: `three@^0.183.1`, `cannon-es@^0.20.0`, `typescript@^5.3.3`, `vite@^7.3.1`, `eslint@^8.56.0`, `@typescript-eslint/eslint-plugin@^8.56.1`, `@typescript-eslint/parser@^8.56.1`, `typescript-eslint@^8.20.0`, `prettier@^3.2.4`, `@types/three@^0.183.1`.

---

## 2. ARCHIVOS DE CONFIGURACIÓN

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": false,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### `vite.config.ts`
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          cannon: ['cannon-es'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `eslint.config.js`
```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: true,
        allowAny: false,
        allowNullish: false,
      }],
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js', '*.cjs', '*.mjs'],
  }
);
```

---

## 3. HTML Y CSS

### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SPORT FUSION ARENA 3D</title>
    <link rel="stylesheet" href="./style.css" />
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="game-container">
      <canvas id="game-canvas"></canvas>
      <div id="ui-overlay"></div>
    </div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### `style.css`
El CSS usa dos fuentes: **Orbitron** (títulos/HUD futurista) y **Rajdhani** (body/descripciones). Estructura:

- `#game-container`: relativo, 100vw × 100vh.
- `#game-canvas`: bloque, 100%.
- `#ui-overlay`: absoluto encima del canvas, z-index 10, `pointer-events: none` (hijos lo reactivan con `pointer-events: auto`).
- `.hud`: barra superior con flex (left=J1, center=modo+timer, right=J2). Fuente Orbitron.
  - `.hud-score.p1` → color `#00e5ff`, `.hud-score.p2` → color `#ff3d71`.
  - `.hud-timer` → `#ffeb00`, font-size 36px, font-weight 900.
- `.overlay-screen`: pantalla completa semitransparente (`rgba(5,5,16,0.92)`), flex column centrado, animación `fadeIn 0.5s`.
- `.overlay-title`: font-size 56px, font-weight 900, `background: linear-gradient(135deg, #00e5ff, #ff3d71)` con `-webkit-background-clip: text`, animación `pulse 2s infinite`.
- `.overlay-btn`: `background: linear-gradient(135deg, #00e5ff, #0088cc)`, border-radius 8px, box-shadow cyan.
- `.mode-intro`: animación `slideUp 0.6s`.
- `.mode-icon`: font-size 80px.
- `.mode-name`: font-size 48px.
- `.countdown`: centrado absoluto, font-size 120px, color `#ffeb00`.
- `.result-winner.p1` → `#00e5ff`, `.p2` → `#ff3d71`, `.draw` → `#ffeb00`.
- `.final-trophy`: font-size 100px.
- `.f1-power`: font-size 14px, fuente Rajdhani, `.p1` → cyan, `.p2` → rojo.
- Animaciones definidas: `fadeIn`, `pulse` (scale 1→1.05→1), `slideUp` (translateY 40px→0).

---

## 4. ESTRUCTURA DE ARCHIVOS src/

```
src/
├── main.ts
├── core/
│   ├── Engine.ts
│   └── InputManager.ts
├── modes/
│   ├── GameMode.ts
│   ├── FootballMode.ts
│   ├── SumoMode.ts
│   ├── PingPongMode.ts
│   ├── F1Mode.ts
│   └── index.ts
├── types/
│   └── index.ts
└── ui/
    └── Overlay.ts
```

---

## 5. TIPOS Y CONSTANTES — `src/types/index.ts`

```ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type ModeName = 'football' | 'sumo' | 'pingpong' | 'f1';
export type WinnerType = 'P1' | 'P2' | 'DRAW';
export type PlayerID = 'P1' | 'P2';
export type GameState = 'menu' | 'intro' | 'countdown' | 'playing' | 'result' | 'final';

export interface ModeResult {
  mode: ModeName;
  winner: WinnerType;
  scoreP1: number;
  scoreP2: number;
}

export interface GameData {
  currentModeIndex: number;
  modes: ModeName[];
  results: ModeResult[];
  winsP1: number;
  winsP2: number;
}

export interface PlayerControls {
  up: string;
  down: string;
  left: string;
  right: string;
  action1: string;
  action2: string;
}

export interface ModeConfig {
  name: ModeName;
  displayName: string;
  icon: string;
  description: string;
  duration: number;   // seconds
  bgColor: number;    // hex background for scene
}

export const MODE_CONFIGS: ModeConfig[] = [
  {
    name: 'football',
    displayName: 'FUTBOL 3D',
    icon: '⚽',
    description: 'Las porterías se mueven verticalmente. ¡Marca goles en arcos que no paran!',
    duration: 60,
    bgColor: 0x0a2a0a,
  },
  {
    name: 'sumo',
    displayName: 'SUMO ARENA',
    icon: '🥊',
    description: 'Empuja a tu rival al borde de la zona. ¡La arena se mueve y cambia de tamaño! ¡Cuidado con los terremotos!',
    duration: 60,
    bgColor: 0x3a2010,
  },
  {
    name: 'pingpong',
    displayName: 'PING PONG 3D',
    icon: '🏓',
    description: 'La pelota acelera con cada golpe. ¡Los reflejos lo son todo!',
    duration: 60,
    bgColor: 0x0a0a3a,
  },
  {
    name: 'f1',
    displayName: 'FORMULA 3D',
    icon: '🏎️',
    description: '¡Estilo TRON! Deja estela de luz que noquea rivales 1s. Turbo con cooldown (F/Shift). 3 vueltas para ganar.',
    duration: 120,
    bgColor: 0x1a1a2a,
  },
];

export const COLORS = {
  P1: 0x00e5ff,    // cyan
  P2: 0xff3d71,    // red-pink
  SCORE: 0xffeb00, // yellow
  DANGER: 0xff2222,
  SUCCESS: 0x00ff88,
  WHITE: 0xffffff,
  DARK: 0x050510,
};

export const P1_CONTROLS: PlayerControls = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
  action1: 'KeyF', action2: 'KeyG',
};

export const P2_CONTROLS: PlayerControls = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  action1: 'ShiftRight', action2: 'Enter',
};

export interface PhysicsObject {
  mesh: THREE.Object3D;
  body: CANNON.Body;
}
```

---

## 6. CORE — `src/core/InputManager.ts`

Gestiona teclado con dos Maps: `keys` (held state) y `justPressed` (one-shot).
- `keydown`: si la tecla NO estaba en keys, marcarla en justPressed. Setear keys true. `e.preventDefault()`.
- `keyup`: setear keys false. `e.preventDefault()`.
- `isDown(code)`: keys.get(code) === true.
- `wasPressed(code)`: justPressed.get(code) === true.
- `clearJustPressed()`: justPressed.clear() — llamado cada frame al final del game loop.
- `reset()`: limpia ambos maps.

---

## 7. CORE — `src/core/Engine.ts`

Clase pública con campos públicos: `renderer`, `scene`, `camera`, `world`, `input`, `timer`, `canvas`.
Array privado `physicsObjects: Array<{mesh, body}>`.

**Constructor:**
- Canvas: `document.getElementById('game-canvas')`.
- `THREE.WebGLRenderer`: antialias true, alpha false. `setPixelRatio(Math.min(devicePixelRatio, 2))`. `setSize(innerWidth, innerHeight)`. Sombras: `shadowMap.enabled = true`, `type = PCFSoftShadowMap`. `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.2`.
- `THREE.Scene`: `fog = new FogExp2(0x050510, 0.015)`.
- `THREE.PerspectiveCamera(60, aspect, 0.1, 500)`: posición (0, 20, 25), lookAt(0,0,0).
- `CANNON.World`: gravedad (0, -9.82, 0). `broadphase = SAPBroadphase`. `defaultContactMaterial.friction = 0.3`, `.restitution = 0.5`.
- `InputManager` y `THREE.Timer`.
- Listener resize.

**Métodos:**
- `addPhysicsObject(mesh, body)`: scene.add + world.addBody + push a array.
- `removePhysicsObject(mesh, body)`: scene.remove + world.removeBody + filter array.
- `syncPhysics()`: para cada {mesh, body}, copiar body.position → mesh.position, body.quaternion → mesh.quaternion.
- `clearScene()`: remove ALL scene.children, remove ALL world.bodies, vaciar physicsObjects.
- `render()`: renderer.render(scene, camera).

---

## 8. CLASE BASE — `src/modes/GameMode.ts`

Clase abstracta. Campos protegidos: `engine: Engine`, `scoreP1 = 0`, `scoreP2 = 0`, `isActive = false`.

Constructor recibe `engine`.

Métodos abstractos: `setup()`, `update(delta)`, `cleanup()`.

Métodos públicos:
- `getScoreP1()`, `getScoreP2()`.
- `getWinner()`: compara scores → 'P1', 'P2', o 'DRAW'.
- `start()`: isActive = true.
- `stop()`: isActive = false.
- `isFinished()`: false (override en F1Mode).

Métodos protegidos (helpers compartidos):
- `addLighting(color)`: AmbientLight(0xffffff, 0.4) + DirectionalLight(color, 1.2) con sombras (mapSize 2048, camera range ±30, near 0.5, far 80) + HemisphereLight(0x87ceeb, 0x362907, 0.3).
- `createPlayerMesh(color)`: Three.Group con torso (box 0.5×0.55×0.3, jersey color), head (sphere r=0.22, skin), arms (box 0.12×0.45×0.12, skin), shorts (box 0.45×0.2×0.28, negro), legs (box 0.14×0.4×0.14), shoes (box 0.16×0.08×0.22, negro, right named 'kickLeg'/'kickShoe'), glow ring (Torus r=0.4, tube=0.04, team color emissive 0.6).
- `createBallMesh(radius, color)`: SphereGeometry, roughness 0.2, metalness 0.1.
- `createPlayerBody(x, z)`: mass 5, CANNON.Box(0.25, 0.75, 0.25), position (x, 0.85, z), linearDamping 0.9, angularDamping 0.99, fixedRotation true.
- `createBallBody(radius, x, y, z, mass=1)`: Sphere shape, linearDamping 0.3, angularDamping 0.3.
- `handlePlayerMovement(body, controls, speed)`: lee input, aplica applyForce en XZ según dirección.

---

## 9. UI — `src/ui/Overlay.ts`

Clase que manipula `document.getElementById('ui-overlay')` via `innerHTML`.

Métodos:
- `showMenu(onStart)`: muestra título "SPORT FUSION" + "ARENA 3D" con gradient, subtítulo "4 deportes reinventados en 3 dimensiones", botón "COMENZAR", texto controles.
- `showModeIntro(config, modeIndex, onReady)`: muestra "MODO X DE 4", icono, nombre, descripción, duración. Llama `setTimeout(onReady, 4000)`.
- `showCountdown(num)`: muestra número o "¡GO!" si num=0.
- `showHUD(modeName)`: barra HUD con J1 score, timer central, J2 score, modo nombre.
- `updateScore(p1, p2)`: actualiza textContent de #score-p1 y #score-p2.
- `updateTimer(seconds)`: Math.max(0, Math.ceil(seconds)).
- `showF1HUD(modeName)`: HUD especial F1 con "Vuelta 0/3" y divs power-p1/power-p2.
- `updateF1Laps(p1Laps, p2Laps, maxLaps)`: "Vuelta X/Y".
- `updateF1Powers(p1Power, p2Power)`: texto de efectos activos.
- `showResult(winner, scoreP1, scoreP2, modeName, onNext)`: pantalla resultado con clase p1/p2/draw, scores, botón "SIGUIENTE".
- `showFinal(data, onRestart)`: trofeo 🏆, campeón, scores, detalle de cada modo (FOOTBALL: 🔵 J1, etc.), botón "JUGAR DE NUEVO".

---

## 10. MAIN LOOP — `src/main.ts`

**Estado global:**
- `engine = new Engine()`, `overlay = new Overlay()`.
- `state: GameState = 'menu'`, `currentMode: GameMode | null`, `modeTimer`, `countdownValue = 3`, `countdownAccum = 0`.
- `gameData: GameData` con `modes: ['football', 'sumo', 'pingpong', 'f1']`.

**Funciones clave:**
- `shuffleArray<T>(arr)`: Fisher-Yates shuffle.
- `getConfigByName(name)`: busca en MODE_CONFIGS.
- `createMode(name)`: switch que instancia FootballMode, SumoMode, PingPongMode, o F1Mode.

**Menú 3D animado:**
- `createMenuScene()`: clearScene, background 0x050510, fog 0.02. Camera(0, 12, 20). AmbientLight 0.2. PointLights: cyan(-8,8,0), rojo(8,8,0), amarillo(0,10,5). 7 formas flotantes (sphere, box, torus, cone, dodecahedron, octahedron, icosahedron) con colores variados, emissive 0.15. Ground plane 60×60 color 0x0a0a1a.
- `animateMenuScene(delta)`: rotar formas flotantes (x += delta*0.3, y += delta*0.5) + oscilar Y con sin.

**Máquina de estados:**
- `goToMenu()`: reset gameData, shuffleArray los 4 modos, createMenuScene, overlay.showMenu.
- `goToIntro()`: clearMenuScene, engine.clearScene, setear background/fog del modo, createMode + setup, overlay.showModeIntro(4s).
- `goToCountdown()`: countdown de 3→2→1→GO, 1s por número.
- `goToPlaying()`: setear timer=config.duration, mostrar HUD (F1HUD si es f1), currentMode.start().
- `goToResult()`: stop mode, calcular winner, guardar result, mostrar overlay, al click SIGUIENTE → cleanup + siguiente modo o final.
- `goToFinal()`: clearScene, createMenuScene, overlay.showFinal.

**Game loop (`requestAnimationFrame`):**
- `engine.timer.update()`, `delta = Math.min(engine.timer.getDelta(), 0.05)`.
- Según state:
  - `menu`: animateMenuScene.
  - `playing`: `engine.world.step(1/60, delta, 3)`, `currentMode.update(delta)`, actualizar HUD, decrementar timer, si timer ≤ 0 o `currentMode.isFinished()` → goToResult.
  - `final`: animateMenuScene.
- `engine.render()`, `engine.input.clearJustPressed()`.

---

## 11. MODO: FÚTBOL 3D — `FootballMode.ts`

### Constantes
| Constante | Valor |
|-----------|-------|
| FIELD_WIDTH | 34 |
| FIELD_DEPTH | 22 |
| WALL_HEIGHT | 1.5 |
| PLAYER_SPEED | 14 |
| KICK_FORCE | 28 |
| BALL_RADIUS | 0.45 |
| GOAL_LINE_X | 15.5 |
| JUMP_IMPULSE | 18 |
| FALL_GRAVITY_MULT | 3.0 |
| PLAYER_HALF_H | 1.1 |
| PLAYER_SCALE | 1.5 |
| WALL_BOUNCE_DAMPING | 0.85 |
| FLOOR_BOUNCE_DAMPING | 0.6 |
| ACCEL_RATE | 10 |
| DECEL_RATE | 8 |
| TURN_RATE | 12 |
| BOB_SPEED | 12 |
| BOB_AMOUNT | 0.08 |
| MIN_KICK_UP_RATIO | 0.4 |
| KICK_VERTICAL_SCALE | 0.7 |
| GOAL_HALF_WIDTH | 3.5 |
| GOAL_HALF_HEIGHT | 2.0 |
| GOAL_MOVE_INTERVAL | 2.5 s |
| GOAL_LERP_SPEED | 4.0 |
| KICK_ANIM_DURATION | 0.25 s |

### Materiales de Física (CANNON.ContactMaterial)
Se crean 4 materiales con nombre: ground, player, ball, wall. Combinaciones:
- ball↔ground: friction 0.4, restitution 0.6.
- ball↔wall: friction 0.1, restitution 0.8.
- ball↔player: friction 0.3, restitution 0.5.
- player↔ground: friction 0.9, restitution 0.0.
- player↔wall: friction 0.2, restitution 0.1.
- player↔player: friction 0.3, restitution 0.2.

### Escenario
- **Cámara**: (0, 28, 30), lookAt(0, 1, 0).
- **Estadio**: background 0x0a2a0a. 4 gradas (boxes color 0x334433). 4 focos en esquinas (postes cilíndricos + SpotLights blancos intensity 1.5, ángulo π/4).
- **Campo**: PlaneGeometry(34, 22), color 0x1a8a1a.
- **Líneas**: blancas, grosor 0.1. Boundary, center line, center circle (RingGeo r=3→3.15), áreas de gol (6×10).
- **Muros invisibles**: 4 paredes con CANNON.Box mass=0. Visuales: boxes semitransparentes (0x226622, opacity 0.35).
- **Suelo físico**: CANNON.Plane mass=0, rotado -π/2.

### Porterías (se mueven)
Cada portería es un Three.Group con:
- 2 postes verticales (CylinderGeo r=0.12, alto=GOAL_HALF_HEIGHT*2, material blanco metálico roughness 0.15, metalness 0.9).
- Crossbar (team-colored, emissive 0.8, r=0.12*1.1).
- Bottom bar (blanco metálico, r=0.12*0.9).
- Red (wireframe, blanco, opacity 0.3): back panel, top, bottom, left, right.
- Posición: goal1 en x = -FIELD_WIDTH/2 + 1.5, goal2 en x = FIELD_WIDTH/2 - 1.5.
- Ambas porterías se mueven **juntas** (mismo Z y Y).

**Movimiento de portería:**
- Cada GOAL_MOVE_INTERVAL (2.5s), elegir nuevo target: Z aleatorio en `[-FIELD_DEPTH/2 + GOAL_HALF_WIDTH + 1, +FIELD_DEPTH/2 - GOAL_HALF_WIDTH - 1]`, Y aleatorio en `[GOAL_HALF_HEIGHT + 0.5, 6]`.
- Suavizar con exponential lerp: `t = 1 - exp(-GOAL_LERP_SPEED * delta)`, `currentZ += (targetZ - currentZ) * t`.

### Jugadores
- Mesh escalado ×1.5 con torso, cabeza, brazos, shorts, piernas, zapatos, anillo team color. La pierna derecha se llama 'kickLeg' y el zapato 'kickShoe' para la animación de patada.
- Body: CANNON.Body mass 15, Box(0.35*scale, PLAYER_HALF_H, 0.35*scale), linearDamping 0.92, angularDamping 1.0, fixedRotation=true → updateMassProperties().
- J1 empieza en (-6, 0), J2 en (6, 0).

**Movimiento suavizado (velocity-based):**
- Input → dirección normalizada → target velocity = dir * PLAYER_SPEED.
- Smooth: `t = 1 - exp(-ACCEL_RATE * delta)`, `body.velocity.x += (targetVx - body.velocity.x) * t`.
- Sin input: `d = exp(-DECEL_RATE * delta)`, `velocity.x *= d`.
- Rotación hacia velocidad: smooth angle lerp con TURN_RATE.

**Salto:**
- `wasPressed(action2)` y body.position.y < PLAYER_HALF_H + 0.25 → body.velocity.y = JUMP_IMPULSE.
- Gravedad extra: cada frame se aplica force.y += mass * (-9.82 * FALL_GRAVITY_MULT) a ambos jugadores y pelota.

**Patada:**
- `wasPressed(action1)` → setear kickTimer = KICK_ANIM_DURATION.
- Calcular distancia 3D a la pelota. Si dist < 3.0:
  - Reset ball velocity a 0.
  - Dirección normalizada jugador→pelota.
  - kickY = max(ny * KICK_FORCE * KICK_VERTICAL_SCALE, KICK_FORCE * MIN_KICK_UP_RATIO).
  - `ballBody.applyImpulse(Vec3(nx * KICK_FORCE, kickY, nz * KICK_FORCE), Vec3(0,0,0))` — en centro de masa.
- **Animación de patada**: oscilar pierna/zapato con sin(progress * π) durante KICK_ANIM_DURATION.

**Walk bob**: si velocidad² > 1 → phase += BOB_SPEED * delta, mesh.position.y += |sin(phase)| * BOB_AMOUNT.

### Pelota
- SphereGeometry(0.45, 32). Textura procedural: canvas 512×512, fondo blanco, pentágonos negros en patrón (7 cols × 5 rows, r=38, offset alternado), líneas de costura grises. Wrap RepeatWrapping.
- CANNON.Body mass=1, Sphere(0.45), position(0,2,0), linearDamping 0.08, angularDamping 0.15.
- Rotación visual: mesh.rotation += angularVelocity * delta.

### Contención de pelota
Si pelota sale de campo en X o Z → rebote con WALL_BOUNCE_DAMPING (0.85). Si Y < radius → floor bounce con FLOOR_BOUNCE_DAMPING (0.6).

### Detección de gol
Si no hay goalCooldown:
- bx < -GOAL_LINE_X y bz en [gz - GOAL_HALF_WIDTH, gz + GOAL_HALF_WIDTH] y by en [gy - GOAL_HALF_HEIGHT, gy + GOAL_HALF_HEIGHT] y bvx < 0 → scoreP2++.
- bx > GOAL_LINE_X y mismas condiciones y bvx > 0 → scoreP1++.
- Al gol: flash overlay (plane 120×120 frente a cámara, color del equipo que anotó, opacity 0.6, fade delta*3). Reset pelota a (0,2,0) tras 800ms.

### Enforce upright
Cada frame: body.quaternion = (0,0,0,1), body.angularVelocity = (0,0,0). Mesh.quaternion = identity.

### Flash overlay
PlaneGeometry(120, 120), MeshBasicMaterial transparent, depthTest false, renderOrder 999. Position (0, 20, 0), rotation.x = -π/2.

---

## 12. MODO: SUMO ARENA — `SumoMode.ts`

### Constantes
| Constante | Valor |
|-----------|-------|
| ARENA_RADIUS | 12 |
| ARENA_MIN_RADIUS | 5 |
| ZONE_RADIUS | 4 |
| ZONE_RADIUS_MIN | 2 |
| ZONE_RADIUS_MAX | 6 |
| ZONE_RESIZE_INTERVAL | 4 s |
| PLAYER_SPEED | 10 |
| DASH_FORCE | 35 |
| DASH_COOLDOWN | 1.5 s |
| DASH_ENEMY_PUSH | 400 |
| ZONE_WANDER_SPEED | 3 |
| ZONE_DIR_CHANGE_INTERVAL | 2.5 s |
| PUSH_RADIUS | 2.2 |
| PUSH_FORCE | 300 |
| JUMP_FORCE | 8 |
| JUMP_COOLDOWN | 2 s |
| EARTHQUAKE_INTERVAL | 6 s |
| EARTHQUAKE_FORCE | 12 |
| BOUNDARY_SCORE_POINTS | 1 |

### Escenario
- **Cámara**: (0, 25, 0.1), lookAt(0,0,0) — vista cenital.
- **Arena**: suelo exterior circular r=ARENA_RADIUS+6, color 0xd2b48c (arena). Plataforma cilíndrica r=ARENA_RADIUS, alto 0.3, color 0x8b7355 (madera). Ring marker inner (RingGeo, 0x3b2f1e). Decorative outer ring (0xf5deb3).
- **Boundary visuals**: danger zone ring (RingGeo r-2.5 → r, rojo translúcido opacity 0.25). Edge glow torus (r=ARENA_RADIUS, tube 0.15, rojo emissive 2.0). 16 postes cilíndricos alrededor del borde (r=0.15, h=1.5, rojo-naranja emissive).
- **Scoring zone**: ring indicator (RingGeo, verde SUCCESS, emissive 1.2, opacity 0.5). Fill glow (CircleGeo, verde, emissive 1.0, opacity 0.15).
- **Partículas**: 80 puntos, color SCORE, size 0.12, ascienden lentamente y se reinician.
- **Suelo físico**: CANNON.Plane mass=0.

### Luchadores de Sumo (mesh)
Three.Group con:
- Belly: SphereGeo r=0.75, skin color 0xffdbac, scale(1.0, 0.85, 0.9).
- Chest: SphereGeo r=0.55, scale(0.95, 0.7, 0.8).
- Head: SphereGeo r=0.28.
- Bun (chonmage): SphereGeo r=0.13, negro.
- Mawashi belt: TorusGeo r=0.72, tube=0.1, team color emissive 0.2.
- Front flap: Box 0.25×0.3×0.08.
- Arms (pushing pose): CapsuleGeo r=0.13, length 0.4, rotados ±45° Z y -0.2 X.
- Hands: SphereGeo r=0.1.
- Legs: CapsuleGeo r=0.16, length 0.3.
- Feet: Box 0.2×0.08×0.28.
- Glow ring: TorusGeo r=0.65, tube=0.05, team color emissive 0.8.

Body: mass 8, Sphere r=0.8, linearDamping 0.95, angularDamping 0.99, fixedRotation true → updateMassProperties(). J1 en (0, -4), J2 en (0, 4).

### Movimiento (velocity-based directo)
Leer WASD/flechas → dirección normalizada → body.velocity.x/z = dir * PLAYER_SPEED. Sin input → velocity *= 0.8.

### Facing direction
Actualizar lastDir cuando speed > 0.5: lastDir = velocity / speed.
Mesh: override quaternion a identity tras syncPhysics, luego mesh.rotation.y = atan2(vx, vz).

### Dash
`wasPressed(action1)` y cooldown = 0:
- body.velocity += lastDir * DASH_FORCE.
- Si enemigo a dist < 4 y dot(dirToEnemy, lastDir) > 0.3 → enemy.applyImpulse(dirToEnemy_normalized * DASH_ENEMY_PUSH) — en centro de masa (sin segundo arg).
- Setear cooldown = DASH_COOLDOWN.

### Salto
`wasPressed(action2)` y cooldown = 0 y no isJumping:
- body.velocity.y = JUMP_FORCE. Setear isJumping=true, cooldown=JUMP_COOLDOWN.
- Detección de aterrizaje: si isJumping y body.position.y ≤ 0.8 → isJumping=false.
- Cuando no jumping: forzar position.y=0.8 y velocity.y=0.

### Player collision push
Si dist(p1, p2) < PUSH_RADIUS y dist > 0.01:
- Calcular normal y velocidad relativa dot.
- Si dot > 0: pushImpulse = normal * PUSH_FORCE * dot * 0.02.
- Aplicar impulso opuesto a cada jugador (centro de masa).

### Arena shrink
Lineal: shrinkRate = (ARENA_RADIUS - ARENA_MIN_RADIUS) / 60. Cada frame: currentRadius -= shrinkRate * delta.

**Asymmetric offset**: si scores difieren, mover centro hacia jugador perdedor con offset proporcional a shrinkProgress * 0.15 * currentRadius. Smooth lerp delta*2.

Actualizar visuals: escalar platform, rings, danger, glow, posts a nuevas posiciones/tamaños.

### Scoring zone movement
- Cada ZONE_DIR_CHANGE_INTERVAL (2.5s): nueva dirección aleatoria (ángulo → cos/sin * ZONE_WANDER_SPEED).
- Cada ZONE_RESIZE_INTERVAL (4s): nuevo tamaño target entre ZONE_RADIUS_MIN y ZONE_RADIUS_MAX.
- currentZoneRadius lerp hacia target: `+= (target - current) * delta * 2`.
- Mover posición += vel * delta. Constrañir al interior de la arena (reflect velocity en borde).
- Escalar meshes con zoneScale = currentZoneRadius / ZONE_RADIUS.
- Pulse glow: `0.6 + 0.4 * sin(elapsed * 3)`.

### Earthquake
Cada EARTHQUAKE_INTERVAL (6s): dos ángulos aleatorios, aplicar impulso de fuerza EARTHQUAKE_FORCE a cada jugador en dirección aleatoria.

### Edge boundary animation
Edge glow: emissiveIntensity = 1.0 + (0.5 + 0.5*sin(elapsed*4))*1.5. Danger opacity pulsing. Postes: scale.y oscila con sin.

### Scoring
- **Zone points**: si dist(player, zone_center) ≤ currentZoneRadius → +2 * delta por segundo.
- **Boundary points**: si dist(pushed player, arena center) ≥ currentArenaRadius - 1.0 y NO estaba en boundary antes → +1 punto al otro jugador. Tracking state per player (p1AtBoundary, p2AtBoundary).

### Enforce arena bounds
Si dist(body, arenaCenter) > currentArenaRadius - 0.8:
- Reposicionar al borde.
- Cancelar componente de velocidad hacia afuera.

---

## 13. MODO: PING PONG 3D — `PingPongMode.ts`

### Constantes
| Constante | Valor |
|-----------|-------|
| TABLE_WIDTH | 12 |
| TABLE_DEPTH | 8 |
| TABLE_Y | 1 |
| PADDLE_X | 5.5 |
| PADDLE_HALF_DEPTH | 1 |
| BALL_RADIUS | 0.15 |
| BALL_START_SPEED | 8 |
| BALL_MAX_SPEED | 25 |
| BALL_SPEED_MULTIPLIER | 1.1 |
| PADDLE_SPEED | 12 |
| Z_BOUND | 3.5 |
| SCORE_X | 6 |
| TRAIL_COUNT | 8 |

### Escenario (sin física CANNON — todo manual)
- **Cámara**: (0, 8, 12), lookAt(0, TABLE_Y, 0).
- **Room**: paredes (PlaneGeo, color 0x2a2a4a), techo (0x222244), 2 paneles de luz rectangulares (box 4×0.1×1.5, blanco emissive 1.5). 2 bancos de madera (color 0x5c3a1e) con patas. Scoreboard en pared trasera (box 3×1.5×0.1, 0x111133, emissive 0.3).
- **Floor**: PlaneGeo 20×16, color 0x3a2a1a. Líneas de court blancas.
- **Mesa**: Box TABLE_WIDTH×0.3×TABLE_DEPTH, color 0x006633. Líneas blancas (edges + center). 4 patas cilíndricas (0x333333, metalness 0.3).
- **Red**: Box 0.05×0.5×(TABLE_DEPTH+0.4), color 0xcccccc, opacity 0.7. 2 postes cilíndricos grises.
- **Paddles**: Box 0.3×0.8×2. P1 en x=-PADDLE_X (cyan emissive 0.15), P2 en x=+PADDLE_X (rojo emissive 0.15). Y = TABLE_Y + 0.15 + 0.4.
- **Ball**: SphereGeo r=0.15, color 0xff8800, emissive 0xff6600 intensity 0.3.
- **Trail**: 8 SphereGeo (r=BALL_RADIUS*0.6), opacity decreciente (0.3 * (1 - i/8)).

### Ball state (manual, no physics engine)
Interface: `{ x, y, z, vx, vz, speed }`. Y fijo = TABLE_Y + 0.15 + BALL_RADIUS.

**Reset ball:**
- Posición centro. Dirección: hacia el jugador que anotó (o random). Ángulo Z aleatorio ±0.4.
- Normalizar vx/vz. Speed = BALL_START_SPEED.

### Update loop
1. **Paddles**: mover en Z con W/S o ↑/↓ a PADDLE_SPEED * delta. Clamp en ±(Z_BOUND - PADDLE_HALF_DEPTH).
2. **Ball**: x += vx * speed * delta, z += vz * speed * delta.
3. **Bounce Z**: si z ≤ -Z_BOUND → z = -Z_BOUND, vz = |vz|. Si z ≥ Z_BOUND → z = Z_BOUND, vz = -|vz|.
4. **Paddle collision P1**: si vx < 0 y ball.x - BALL_RADIUS ≤ -PADDLE_X + 0.15 y ball.x + BALL_RADIUS ≥ -PADDLE_X - 0.15 y ball.z está dentro de paddle ± PADDLE_HALF_DEPTH → reposition, vx = |vx|, deflection, accelerate.
5. **Paddle collision P2**: simétrico.
6. **Deflexión**: relativeZ = (ball.z - paddle.z) / PADDLE_HALF_DEPTH → vz = relativeZ * 0.8, renormalizar.
7. **Aceleración**: speed = min(speed * BALL_SPEED_MULTIPLIER, BALL_MAX_SPEED).
8. **Trail**: shift positions, set [0] = ball pos. Mostrar meshes.
9. **Score check**: si x < -SCORE_X → P2++, resetBall('P2'). Si x > SCORE_X → P1++, resetBall('P1').

---

## 14. MODO: FORMULA 3D — `F1Mode.ts`

### Track Waypoints (21 puntos, circuito cerrado)
```
[26,-4], [28,6], [24,14], [16,17], [6,13], [-4,17], [-12,13],
[-20,17], [-27,13], [-29,4], [-25,-2], [-18,-5], [-25,-10],
[-28,-16], [-20,-18], [-8,-14], [4,-18], [14,-14], [22,-18],
[28,-14], [29,-8]
```
CatmullRomCurve3 con closed=true, tension=0.5.

### Constantes
| Constante | Valor |
|-----------|-------|
| LAPS_TO_WIN | 3 |
| TRACK_HALF_WIDTH | 2.8 |
| TRACK_SAMPLES | 300 |
| CHECKPOINT_COUNT | 8 |
| CHECKPOINT_RADIUS | 3.8 |
| CAMERA_HEIGHT | 42 |
| TRACK_Y | 0.01 |
| MAX_SPEED | 18 |
| ACCELERATION | 14 |
| BRAKE_DECEL | 20 |
| FRICTION | 5 |
| STEER_SPEED | 3.0 |
| PENALTY_SPEED_FACTOR | 0.3 |
| PENALTY_DURATION | 2 s |
| TURBO_SPEED_MULT | 1.8 |
| TURBO_DURATION | 3 s |
| MIRROR_DURATION | 5 s |
| OBSTACLE_SLOW_FACTOR | 0.2 |
| OBSTACLE_SLOW_DURATION | 1.5 s |
| OBSTACLE_LIFETIME | 15 s |
| OBSTACLE_HIT_RADIUS | 1.5 |
| TRAIL_STUN_DURATION | 1 s |
| TRAIL_SEGMENT_SPACING | 0.6 |
| TRAIL_MAX_AGE | 1.0 s |
| TRAIL_HIT_RADIUS | 0.5 |
| TURBO_ABILITY_SPEED_MULT | 2.0 |
| TURBO_ABILITY_DURATION | 1.5 s |
| TURBO_COOLDOWN | 5 s |
| POWERUP_SPAWN_MIN | 4 s |
| POWERUP_SPAWN_MAX | 8 s |
| POWERUP_MAX_COUNT | 3 |
| POWERUP_COLLECT_RADIUS | 2.5 |

### Car State
```ts
interface CarState {
  x, z, angle, speed: number;
  laps, nextCheckpoint: number;
  penaltyTimer, onTrack: number/boolean;
  mirrorTimer, turboTimer, obstacleSlowTimer: number;
  stunTimer, turboAbilityTimer, turboCooldown: number;
}
```

### Escenario (sin física CANNON — posición manual)
- **Cámara**: (0, 42, 0), lookAt(0,0,0) — vista cenital.
- **Césped**: PlaneGeo 100×80, color 0x2d7a2d.
- **Track surface**: geometría procedural con 300 samples del curve. Para cada sample, calcular tangente → perpendicular, crear dos vértices a ±TRACK_HALF_WIDTH. Triangulate. Color 0x333333.
- **Kerb ribbons** (2, uno a cada lado): igual procedimiento pero offset ±TRACK_HALF_WIDTH, width 0.5. Vertex colors alternando rojo/blanco cada ~5 segmentos.
- **Center line**: 120 segmentos, solo los pares (dashed). PlaneGeo orientado por ángulo de tangente.
- **Start/finish line**: checkerboard texture (canvas 128×32, tiles 8px). Plane en posición del curve.getPointAt(0). 2 postes blancos a los lados.
- **Checkpoint markers**: para checkpoints 1-7, 2 cilindros amarillos (emissive 0.3, opacity 0.7) a cada lado de la pista.

### Coches
Three.Group:
- Body: Box 1.2×0.3×0.7, team color, emissive 0.15.
- Cabin: Box 0.5×0.25×0.5, negro.
- 4 wheels: CylinderGeo r=0.12, h=0.1, rotated π/2, posiciones ±0.4 en X y Z.
- Front wing: Box 0.15×0.06×0.8.
- Rear wing: Box 0.08×0.2×0.7.

Placed at start: curve.getPointAt(0), lateral offset ±1.2, angle from tangent.

### Car physics (manual, no CANNON)
**updateCar(state, controls, delta):**
- Si stunned: speed = 0, return.
- effectiveMax = MAX_SPEED. Multiplicadores: penaltyTimer > 0 → ×0.3. turboTimer > 0 → ×1.8. turboAbilityTimer > 0 → ×2.0. obstacleSlowTimer > 0 → ×0.2.
- Up → speed += ACCELERATION * delta. Down → speed -= BRAKE_DECEL * delta. Else → friction toward 0.
- Clamp: speed en [-effectiveMax*0.4, effectiveMax].
- Si |speed| > 0.5: steerFactor = min(|speed|/MAX_SPEED, 1). mirror = mirrorTimer > 0 ? -1 : 1. Left → angle += STEER_SPEED * steerFactor * delta * mirror. Right → angle -= ...
- state.x += cos(angle) * speed * delta. state.z -= sin(angle) * speed * delta.

### Track bounds check
Buscar el sample más cercano (lineal sobre los 300 samples). Si minDist > TRACK_HALF_WIDTH → onTrack=false, si penaltyTimer=0 → penaltyTimer = PENALTY_DURATION.

### Checkpoints & Laps
Checkpoint 0 = finish line (t=0). Checkpoints 1-7 intermedios.
- Cars start with nextCheckpoint=1.
- Si dist(car, checkpoint[nextCheckpoint]) < CHECKPOINT_RADIUS:
  - Si nextCheckpoint == 0 → laps++, nextCheckpoint = 1.
  - Else → nextCheckpoint = (nextCheckpoint + 1) % CHECKPOINT_COUNT.

### Turbo Ability (action1)
`isDown(action1)` y turboCooldown ≤ 0 y turboAbilityTimer ≤ 0 → turboAbilityTimer = 1.5, turboCooldown = 5.

### TRON Trail
- Cada frame: para cada jugador, si dist(current, lastTrailPos) ≥ TRAIL_SEGMENT_SPACING:
  - Crear BoxGeometry(0.4, 0.5, 0.4) mesh con material (team color, emissive 0.8, opacity 0.7) en lastTrailPos.
  - Push to trail array con timestamp.
  - Update lastTrailPos.
- Expire: eliminar segmentos con age > TRAIL_MAX_AGE * 1000 (ms).
- **Collision**: si dist(car, segment de trail del OPONENTE) < TRAIL_HIT_RADIUS y no ya stunned → stunTimer = TRAIL_STUN_DURATION, speed = 0.

### Power-ups
Spawn cada POWERUP_SPAWN_MIN + random * (MAX - MIN) segundos, máximo POWERUP_MAX_COUNT.

**3 tipos (enum PowerUpType):**
- MIRROR (color 0xaa44ff): OctahedronGeometry(0.6). Efecto: opponent.mirrorTimer = 5.
- TURBO (color 0xffee00): ConeGeometry(0.5, 1, 6). Efecto: self.turboTimer = 3.
- OBSTACLE (color 0xff4444): BoxGeometry(0.8). Efecto: colocar obstáculo en pista.

Cada power-up mesh es un Group con la geometría + un ring (TorusGeo r=0.8, tube 0.05, emissive 0.8, opacity 0.6). Animación: rotate Y += 0.02, float Y = 1 + sin(time*3) * 0.3.

**Collection**: si dist(car, powerup) < POWERUP_COLLECT_RADIUS → aplicar efecto, removeFromScene.

### Obstacles
Group: ConeGeometry(0.6, 1.2, 4) rojo + CylinderGeometry(0.7, 0.7, 0.1) stripe amarilla. Timer = OBSTACLE_LIFETIME. Animate scale pulsing. Si dist(car, obstacle) < OBSTACLE_HIT_RADIUS y no ya slow → obstacleSlowTimer = OBSTACLE_SLOW_DURATION, speed *= 0.3.

### Penalty labels (sprites)
Canvas 256×64, bold 36px Arial, texto/color según efecto activo. THREE.Sprite con material transparent, scale(3, 0.75, 1). Posicionado sobre el coche (y=2.2). Textos: "💥 STUNNED", "PENALTY", "🚀 TURBO", "🪞 MIRROR", "⚡ TURBO", "🛑 SLOW".

### HUD info
`getActivePowerInfo(state)`: muestra string con efectos activos y timers. Ej: `"💥 2s 🪞 3s"`. Si turboCooldown > 0 → `"🔄 Xs"`. Si no cooldown ni turbo → `"🚀 LISTO"`.

### isFinished()
`stateP1.laps >= 3 || stateP2.laps >= 3`.

### Score
`scoreP1 = stateP1.laps`, `scoreP2 = stateP2.laps`.

### Timer decrements
Cada frame: decrementar penaltyTimer, mirrorTimer, turboTimer, obstacleSlowTimer, stunTimer, turboAbilityTimer, turboCooldown por delta. Min 0.

---

## 15. RE-EXPORTACIONES — `src/modes/index.ts`

```ts
export { GameMode } from './GameMode';
export { FootballMode } from './FootballMode';
export { SumoMode } from './SumoMode';
export { PingPongMode } from './PingPongMode';
export { F1Mode } from './F1Mode';
```

---

## 16. REGLAS IMPORTANTES DE IMPLEMENTACIÓN

1. **Física**: FootballMode y SumoMode usan CANNON.World (engine.world.step cada frame). PingPongMode y F1Mode son enteramente manuales (NO usan cannon).
2. **applyImpulse**: SIEMPRE sin segundo argumento o con Vec3(0,0,0) para aplicar en centro de masa. Pasar body.position crea torque no deseado.
3. **fixedRotation**: después de setear `body.fixedRotation = true`, llamar `body.updateMassProperties()`.
4. **Delta clamp**: `Math.min(engine.timer.getDelta(), 0.05)` para estabilidad.
5. **wasPressed vs isDown**: usar wasPressed para acciones one-shot (dash, salto, patada). Usar isDown para movimiento continuo y carga.
6. **Physics step**: `engine.world.step(1/60, delta, 3)` — 60 Hz, máximo 3 substeps.
7. **syncPhysics**: siempre después del step, copia positions/quaternions de cannon a three.
8. **Modos se aleatorizan**: `shuffleArray(['football', 'sumo', 'pingpong', 'f1'])` al inicio del torneo.
9. **F1Mode sobreescribe isFinished()**: retorna true si algún jugador llega a 3 vueltas.
10. **Cleanup**: cada modo implementa cleanup() que limpia la escena.
