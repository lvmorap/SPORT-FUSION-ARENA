# 🏆 SPORT FUSION ARENA 3D

> **5 deportes reinventados en 3 dimensiones** — Un juego de deportes arcade 3D local para 2 jugadores construido con Three.js y cannon-es.

---

## Índice

1. [Descripción General](#-descripción-general)
2. [Requisitos Previos](#-requisitos-previos)
3. [Instalación desde Cero](#-instalación-desde-cero)
4. [Controles](#-controles)
5. [Sistema de Torneo y Puntuación General](#-sistema-de-torneo-y-puntuación-general)
6. [Los 5 Modos de Juego — Reglas Detalladas](#-los-5-modos-de-juego--reglas-detalladas)
   - [⚽ Fútbol 3D](#-fútbol-3d)
   - [🥊 Sumo Arena](#-sumo-arena)
   - [🏓 Ping Pong 3D](#-ping-pong-3d)
   - [⛳ Golf Dual](#-golf-dual)
   - [🏎️ Formula 3D](#️-formula-3d)
7. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
8. [Librerías y Dependencias](#-librerías-y-dependencias)
9. [Scripts Disponibles](#-scripts-disponibles)
10. [Deploy en GitHub Pages](#-deploy-en-github-pages)

---

## 🎯 Descripción General

**SPORT FUSION ARENA 3D** es un juego de deportes arcade 3D diseñado para **dos jugadores en el mismo teclado** (local). Cada partida es un torneo de **5 rondas**, donde cada ronda presenta un deporte completamente diferente con sus propias reglas, física y escenario 3D.

El concepto central: cada uno de los 5 deportes tiene una regla que **no existiría en el mundo real**, creando una experiencia fresca y sorprendente en cada modo.

El orden de los 5 modos se **aleatoriza** en cada nueva partida, así que nunca sabes qué deporte vendrá primero.

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Navegador moderno** | Chrome, Firefox, Edge o Safari | Debe soportar WebGL 2 |

---

## 🚀 Instalación desde Cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/lvmorap/SPORT-FUSION-ARENA.git
cd SPORT-FUSION-ARENA
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instala todas las dependencias de producción y desarrollo definidas en `package.json`.

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Se abrirá automáticamente en **http://localhost:3000**. El servidor de desarrollo tiene hot-reload: cualquier cambio en el código se refleja al instante.

### 4. Compilar para producción

```bash
npm run build
```

Genera la carpeta `dist/` con el juego optimizado y listo para servir como sitio estático.

### 5. Previsualizar la build de producción

```bash
npm run preview
```

---

## 🕹️ Controles

### Controles Globales

| Acción | Jugador 1 (Cyan) | Jugador 2 (Rojo) |
|--------|:-----------------:|:-----------------:|
| Arriba | `W` | `↑` |
| Abajo | `S` | `↓` |
| Izquierda | `A` | `←` |
| Derecha | `D` | `→` |
| **Acción Principal** | `F` | `Shift Derecho` |
| **Acción Secundaria** | `G` | `Enter` |

### Controles por Modo

| Modo | Movimiento | Acción Principal (`F` / `Shift`) | Acción Secundaria (`G` / `Enter`) |
|------|------------|----------------------------------|-----------------------------------|
| **Fútbol 3D** | 8 direcciones (W/A/S/D) | Patear la pelota | Saltar |
| **Sumo Arena** | 8 direcciones (W/A/S/D) | Embestida/Dash | Saltar |
| **Ping Pong 3D** | Solo vertical (W/S arriba/abajo) | — | — |
| **Golf Dual** | Apuntar dirección (A/D gira, W/S ajuste fino) | Mantener para cargar, soltar para golpear | — |
| **Formula 3D** | Acelerar (W/↑), Frenar (S/↓), Girar (A/D o ←/→) | Turbo (cooldown 5s) | — |

---

## 🏅 Sistema de Torneo y Puntuación General

### Estructura del Torneo

1. Al iniciar, se **aleatorizan** los 5 modos de juego.
2. Antes de cada modo se muestra una **pantalla de introducción** (4 segundos) con el nombre, icono y descripción del modo.
3. Hay una **cuenta regresiva** de 3 segundos: **3... 2... 1... ¡GO!**
4. Se juega el modo (60 segundos, excepto Formula 3D que tiene 120 segundos o hasta que alguien complete 3 vueltas).
5. Al terminar, se muestra el **resultado del modo**: quién ganó y con qué puntuación.
6. Tras los 5 modos se muestra la **pantalla final** con el campeón del torneo.

### Cómo se Determina el Ganador del Torneo

- Cada modo otorga **1 victoria** al jugador con mayor puntuación en ese modo.
- Si hay empate en un modo, ningún jugador suma victoria.
- Al final de los 5 modos, el jugador con **más victorias acumuladas** gana el torneo.
- En caso de empate global, se declara empate.

---

## 🎮 Los 5 Modos de Juego — Reglas Detalladas

---

### ⚽ Fútbol 3D

> *Las porterías se mueven verticalmente. ¡Marca goles en arcos que no paran!*

**Duración:** 60 segundos

**Escenario:** Campo de fútbol 3D con césped, líneas de campo, gradas y porterías iluminadas con efecto neón.

**Reglas de Juego:**
- Cada jugador controla un futbolista en 8 direcciones en un campo de 34×22 unidades.
- Hay **una pelota** en el centro del campo con física real (gravedad, rebotes, fricción).
- Las **dos porterías** (una a cada lado del campo) se mueven sincronizadamente:
  - Se desplazan **verticalmente** (eje Y) y **lateralmente** (eje Z) a posiciones aleatorias.
  - Cada **2.5 segundos** eligen un nuevo punto objetivo y se deslizan suavemente hacia él.
  - Rango vertical: entre 2.5 y 6 unidades de altura.
  - Rango lateral: cubren todo el ancho del campo.
- Dimensiones de la portería: **7 unidades de ancho × 4 unidades de alto**.

**Cómo se Puntúa:**
- Cuando la pelota cruza la línea de portería (`x < -15.5` o `x > 15.5`) **dentro del marco** de la portería (en Z y en Y), se anota un **gol** para el jugador atacante.
- Portería izquierda (`x < -15.5`): gol para **Jugador 2**.
- Portería derecha (`x > 15.5`): gol para **Jugador 1**.
- Tras un gol hay un flash de celebración y la pelota se resetea al centro tras 0.8 segundos.
- **Gana el jugador con más goles** al final de los 60 segundos.

**Mecánicas Especiales:**
- **Patear** (`F` / `Shift`): Si la pelota está a menos de 3 unidades de distancia, se aplica un impulso de fuerza 28 en la dirección jugador→pelota, con un componente vertical mínimo del 40% para crear tiros parabólicos.
- **Saltar** (`G` / `Enter`): Impulso vertical de 18. Solo funciona si el jugador está cerca del suelo. Útil para cabecear la pelota en el aire.
- La pelota rebota en las paredes laterales y en el suelo con amortiguación (85% horizontal, 60% vertical).
- Los jugadores tienen animación de caminar (bob) y de patada.

---

### 🥊 Sumo Arena

> *Empuja a tu rival al borde de la zona. ¡La arena se mueve y cambia de tamaño! ¡Cuidado con los terremotos!*

**Duración:** 60 segundos

**Escenario:** Dohyō japonés (ring de sumo) circular elevado con textura arena, luchadores de sumo con mawashi (cinturón) del color de su equipo.

**Reglas de Juego:**
- La arena es un **círculo de radio 12** que **se encoge linealmente** hasta radio 5 durante los 60 segundos.
- La arena se **desplaza sutilmente** hacia el jugador que va perdiendo, creando asimetría.
- Hay una **zona de puntuación circular** (radio entre 2 y 6) que se mueve por la arena con velocidad errática, cambiando dirección cada 2.5 segundos y cambiando de tamaño cada 4 segundos.
- Cada **6 segundos** ocurre un **terremoto**: ambos jugadores reciben un impulso aleatorio de fuerza 12 en una dirección al azar.
- Un **anillo rojo brillante** marca el borde de la arena; la zona de peligro (últimas 2.5 unidades del borde) pulsa en rojo.

**Cómo se Puntúa:**
- **Dentro de la zona verde**: +2 puntos por segundo. Ambos jugadores puntúan simultáneamente si están dentro.
- **Empujar al rival al borde**: +1 punto cada vez que el oponente **toca el borde** de la arena (radio - 1 unidad). Solo se cuenta la primera vez que toca; debe alejarse del borde para que cuente de nuevo.
- **Gana el jugador con más puntos** al final de los 60 segundos.

**Mecánicas Especiales:**
- **Dash/Embestida** (`F` / `Shift`): Impulso de velocidad 35 en la dirección actual. Si el rival está a menos de 4 unidades en la dirección del dash, recibe un empujón masivo (fuerza 400). Cooldown: **1.5 segundos**.
- **Saltar** (`G` / `Enter`): Velocidad vertical de 8. Cooldown: **2 segundos**. Útil para esquivar embestidas.
- **Colisión entre jugadores**: Cuando los jugadores están a menos de 2.2 unidades de distancia, hay empuje mutuo basado en la velocidad relativa (fuerza 300).
- Los jugadores **no pueden salirse** de la arena; son empujados de vuelta en el borde.

---

### 🏓 Ping Pong 3D

> *La pelota acelera con cada golpe. ¡Los reflejos lo son todo!*

**Duración:** 60 segundos

**Escenario:** Sala de ping pong 3D con mesa verde, red, patas metálicas, paneles de luz en el techo, bancos para espectadores y marcador en la pared.

**Reglas de Juego:**
- Mesa de **12 unidades de largo × 8 de ancho** con red central.
- Cada jugador controla una **paleta** que solo se mueve **verticalmente** (eje Z) a velocidad 12.
  - Jugador 1: paleta izquierda (posición X = -5.5).
  - Jugador 2: paleta derecha (posición X = +5.5).
- La paleta tiene 2 unidades de alto, permitiendo cubrir parte de la mesa.
- La pelota rebota automáticamente en los bordes superior e inferior (Z = ±3.5).

**Cómo se Puntúa:**
- Cuando la pelota sale por la **izquierda** (X < -6): **Jugador 2** anota 1 punto.
- Cuando la pelota sale por la **derecha** (X > +6): **Jugador 1** anota 1 punto.
- Tras cada punto, la pelota se sirve desde el centro hacia el jugador que anotó, con ángulo aleatorio.
- **Gana el jugador con más puntos** al final de los 60 segundos.

**Mecánicas Especiales:**
- **Aceleración progresiva**: La pelota empieza a velocidad **8** y se multiplica por **×1.1** con cada golpe de paleta, hasta un máximo de **25**. Esto hace que los rallies largos sean cada vez más frenéticos.
- **Deflexión**: El ángulo de rebote depende de **dónde golpea** la pelota en la paleta. Si golpea en el centro, sale recto; si golpea en el borde, sale con ángulo pronunciado. Esto permite apuntar los tiros.
- **Efecto trail**: La pelota deja un rastro visual de 8 esferas translúcidas que marcan su trayectoria reciente.
- Al resetear tras un punto, la velocidad vuelve a **8**.

---

### ⛳ Golf Dual

> *Dos pelotas compiten simultáneamente. ¡Llega al hoyo primero!*

**Duración:** 60 segundos

**Escenario:** Mini campo de golf 3D con 4 secciones: corredor de entrada, laberinto central con barreras en zigzag, embudo de transición y green final con hoyo y bandera.

**El Recorrido (22 unidades de largo):**
| Sección | Zona Z | Ancho | Descripción |
|---------|--------|-------|-------------|
| **Entrada** | 0 → -6 | 3 | Corredor estrecho con paredes en V que estrechan el paso |
| **Laberinto** | -6 → -14 | 3 | 4 barreras en zigzag alternas (izquierda-derecha) con guía central |
| **Embudo** | -14 → -18 | 3→6 | Se ensancha con paredes anguladas y dos obstáculos direccionales |
| **Green Final** | -18 → -22 | 8 | Zona amplia con hoyo en (0, -20.5) y bandera roja |

**Reglas de Juego:**
- Cada jugador controla una **pelota de golf** con física real.
- Jugador 1 empieza en (-0.5, -1), Jugador 2 en (0.5, -1).
- Se apunta con las **flechas direccionales** (A/D giran el ángulo de tiro, W/S hacen ajuste fino).
- Una **línea de puntería** muestra la dirección actual; una **línea de potencia** aparece al cargar.

**Mecánica de Golpe:**
1. **Mantener** `F` (J1) o `Shift` (J2) para **cargar potencia**. La carga máxima es de **2 segundos**.
2. **Soltar** para golpear. La fuerza del golpe es proporcional al tiempo de carga (máximo: impulso de **18**).
3. Cada golpe incrementa el contador de golpes (strokes) del jugador.

**Cómo se Puntúa:**
- Al meter la pelota en el hoyo (radio 0.2), se otorgan puntos según el **número de golpes**:

| Golpes | Puntos |
|:------:|:------:|
| 1 (Hole-in-one) | **10** |
| 2 | **7** |
| 3 | **5** |
| 4 | **3** |
| 5 | **2** |
| 6+ | **1** |

- Tras anotar, la pelota **desaparece 1 segundo** y reaparece en la posición inicial para intentar de nuevo.
- Los golpes se resetean a 0 con cada nuevo intento.
- **Gana el jugador con más puntos acumulados** al final de los 60 segundos.
- Los muros tienen rebote (restitución 0.8), así que la pelota rebota en las paredes.

---

### 🏎️ Formula 3D

> *¡Estilo TRON! Deja estela de luz que noquea rivales. Turbo con cooldown. 3 vueltas para ganar.*

**Duración:** 120 segundos **o hasta que un jugador complete 3 vueltas** (lo que ocurra primero).

**Escenario:** Circuito sinuoso 3D (CatmullRom spline con 21 waypoints) con césped, bordillos bicolores, línea central discontinua y línea de meta.

**Reglas de Juego:**
- Cada jugador controla un **coche de F1** que se desplaza con aceleración/frenado y giro.
- Velocidad máxima base: **18**. Aceleración: **14**. Frenado: **20**. Fricción natural: **5**.
- El giro depende de la velocidad: a mayor velocidad, más capacidad de giro (factor proporcional a `velocidad/velocidadMáxima`).
- La pista tiene un **semiancho de 2.8 unidades**; salirse penaliza.
- **8 checkpoints** distribuidos uniformemente en la pista. El checkpoint 0 es la línea de meta.
- Los coches empiezan con `nextCheckpoint = 1` y deben cruzar **todos los checkpoints intermedios** (1→2→3→4→5→6→7) antes de cruzar la línea de meta (checkpoint 0) para que cuente como **vuelta completada**.

**Cómo se Puntúa:**
- La puntuación es el **número de vueltas completadas**.
- **3 vueltas** = victoria instantánea (el modo termina inmediatamente).
- Si nadie llega a 3 vueltas en 120 segundos, gana quien tenga más vueltas.

**Mecánicas Especiales:**

**🚀 Turbo Manual** (`F` / `Shift`):
- Activa un turbo de velocidad **×2.0** durante **1.5 segundos**.
- Cooldown: **5 segundos** tras activarlo.
- Se muestra `🚀 LISTO` en el HUD cuando está disponible.

**💡 Estela de Luz (Estilo TRON):**
- Cada coche deja una **estela de bloques luminosos** de su color detrás de sí.
- Los segmentos de estela se depositan cada **0.6 unidades** de distancia recorrida.
- La estela **dura 1 segundo** antes de desaparecer.
- Si un coche toca la estela **del rival**, queda **aturdido 1 segundo** (velocidad = 0, no puede moverse).

**🎁 Power-ups** (aparecen aleatoriamente en la pista cada 4-8 segundos, máximo 3 a la vez):

| Power-up | Icono | Efecto | Duración |
|----------|:-----:|--------|:--------:|
| **Mirror** | 🪞 Octaedro morado | Invierte los controles de dirección **del rival** | 5 s |
| **Turbo** | ⚡ Cono amarillo | Velocidad **×1.8** para ti | 3 s |
| **Obstacle** | 🛑 Cubo rojo | Coloca un cono en la pista. Al chocar: velocidad **×0.2** durante 1.5 s | 15 s (vida del obstáculo) |

**⚠️ Penalización por Salirse de Pista:**
- Si el coche se sale de la pista (distancia > 2.8 del centro de la pista), su velocidad máxima se reduce al **30%** durante **2 segundos**.

**HUD de F1:**
- Muestra vueltas completadas de cada jugador (formato `X / 3`).
- Muestra los efectos activos con temporizador (💥 stunned, 🪞 mirror, ⚡ turbo, 🚀 turbo manual, 🛑 slow, 🔄 cooldown).

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos

```
SPORT-FUSION-ARENA/
├── index.html              # Punto de entrada HTML (canvas + overlay UI)
├── style.css               # Estilos globales (HUD, overlays, animaciones)
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración TypeScript (strict mode)
├── vite.config.ts          # Configuración Vite (bundler)
├── eslint.config.js        # Configuración ESLint
├── .prettierrc             # Configuración Prettier
├── public/
│   └── assets/textures/    # Texturas SVG (césped, madera, asfalto, etc.)
└── src/
    ├── main.ts             # Loop principal, máquina de estados, torneo
    ├── core/
    │   ├── Engine.ts       # Renderer WebGL, cámara, mundo de física, sync
    │   └── InputManager.ts # Gestión de teclado (isDown, wasPressed)
    ├── modes/
    │   ├── GameMode.ts     # Clase base abstracta para todos los modos
    │   ├── FootballMode.ts # Fútbol 3D con arcos móviles
    │   ├── SumoMode.ts     # Sumo Arena con zona y arena que se encogen
    │   ├── PingPongMode.ts # Ping Pong con aceleración progresiva
    │   ├── GolfMode.ts     # Golf Dual con recorrido y obstáculos
    │   ├── F1Mode.ts       # Formula 3D con estela TRON y power-ups
    │   └── index.ts        # Re-exportaciones de modos
    ├── types/
    │   └── index.ts        # Tipos, constantes, configuración de modos y controles
    └── ui/
        └── Overlay.ts      # Pantallas de UI HTML superpuestas sobre el canvas 3D
```

### Motor del Juego

| Componente | Responsabilidad |
|------------|----------------|
| **Engine** | Crea y gestiona el `WebGLRenderer` (sombras PCFSoft, ACES tone mapping), `Scene`, `PerspectiveCamera`, mundo `CANNON.World` (gravedad -9.82), y sincroniza posiciones de física→mesh cada frame. |
| **InputManager** | Registra eventos `keydown`/`keyup`. `isDown(code)` para mantener pulsado. `wasPressed(code)` para acciones de una sola pulsación (dash, salto, patada). |
| **Overlay** | Renderiza HTML sobre el canvas: menú, intro de modo, countdown, HUD de puntuación/timer, resultados y pantalla final. |

### Flujo de Escenas (Máquina de Estados)

```
menu → intro → countdown → playing → result → intro → ... → final → menu
       ↑_______________________________________________↑
```

- **menu**: Escena 3D animada con objetos flotantes. Botón "COMENZAR".
- **intro**: Escena del modo ya cargada de fondo; overlay con nombre, icono y descripción (4 segundos).
- **countdown**: 3... 2... 1... ¡GO! (1 segundo cada número).
- **playing**: Gameplay activo. El delta se clampea a máximo 0.05s para estabilidad. Física a 60 Hz.
- **result**: Muestra ganador y puntuación del modo.
- **final**: Muestra campeón del torneo y resultados de cada modo.

---

## 📚 Librerías y Dependencias

### Dependencias de Producción

| Librería | Versión | Descripción |
|----------|---------|-------------|
| [`three`](https://threejs.org/) | ^0.183.1 | Motor de renderizado 3D WebGL. Geometrías, materiales PBR, sombras, fog, tone mapping, CatmullRom curves. |
| [`cannon-es`](https://pmndrs.github.io/cannon-es/) | ^0.20.0 | Motor de física 3D. Gravedad, colisiones, cuerpos rígidos, impulsos, materiales de contacto (fricción/restitución). |

### Dependencias de Desarrollo

| Librería | Versión | Descripción |
|----------|---------|-------------|
| [`typescript`](https://www.typescriptlang.org/) | ^5.3.3 | Lenguaje tipado. Configuración estricta (`strict: true`, `noImplicitAny`, `strictNullChecks`). Target ES2020. |
| [`vite`](https://vitejs.dev/) | ^7.3.1 | Bundler y servidor de desarrollo con hot-reload. Code splitting: `three` y `cannon-es` en chunks separados. |
| [`eslint`](https://eslint.org/) | ^8.56.0 | Linter de JavaScript/TypeScript. |
| [`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io/) | ^8.56.1 | Reglas ESLint específicas para TypeScript. |
| [`@typescript-eslint/parser`](https://typescript-eslint.io/) | ^8.56.1 | Parser de TypeScript para ESLint. |
| [`typescript-eslint`](https://typescript-eslint.io/) | ^8.20.0 | Configuración integrada de TypeScript + ESLint. |
| [`prettier`](https://prettier.io/) | ^3.2.4 | Formateador de código automático. |
| [`@types/three`](https://www.npmjs.com/package/@types/three) | ^0.183.1 | Tipos TypeScript para Three.js. |

### Fuentes Externas (CDN)

| Recurso | Uso |
|---------|-----|
| [Google Fonts: Orbitron](https://fonts.google.com/specimen/Orbitron) | Fuente para títulos, HUD y UI del juego (estilo futurista). |
| [Google Fonts: Rajdhani](https://fonts.google.com/specimen/Rajdhani) | Fuente para descripciones y texto secundario. |

---

## 🛠️ Scripts Disponibles

```bash
# Servidor de desarrollo con hot-reload (puerto 3000, abre navegador automáticamente)
npm run dev

# Compilar TypeScript y generar build de producción en dist/
npm run build

# Previsualizar la build de producción
npm run preview

# Verificar tipos TypeScript sin emitir archivos
npm run typecheck

# Ejecutar ESLint sobre src/
npm run lint

# Ejecutar ESLint y auto-corregir problemas
npm run lint:fix

# Formatear todo el código con Prettier
npm run format

# Verificar formato sin modificar archivos
npm run format:check
```

---

## 🌐 Deploy en GitHub Pages

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`):

1. Haz **fork** de este repositorio.
2. Ve a **Settings → Pages**.
3. En "Build and deployment", selecciona **"GitHub Actions"** como source.
4. El workflow construirá y desplegará automáticamente.
5. Tu juego estará en `https://[tu-usuario].github.io/SPORT-FUSION-ARENA/`.

### Deploy Manual

También puedes servir la carpeta `dist/` con cualquier servidor de archivos estáticos después de ejecutar `npm run build`:

```bash
npm run build
npx serve dist
```

---

**Desarrollado para el Game Jam de Electronic Arts — Tema: "Reinventing Competition"**
