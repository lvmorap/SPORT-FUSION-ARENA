# 🏆 SPORT FUSION ARENA 3D

> **5 deportes reinventados en 3 dimensiones** — Un juego de deportes 3D local para 2 jugadores.

---

## 🎯 ¿Qué es SPORT FUSION ARENA 3D?

**SPORT FUSION ARENA 3D** es un juego de deportes arcade 3D diseñado para dos jugadores locales. Cada partida consta de 5 rondas de 60 segundos, donde cada ronda presenta un deporte completamente diferente con sus propias reglas, física y escenario 3D.

El concepto central del juego es simple pero poderoso: cada uno de los 5 deportes tiene una regla que **no existiría en el mundo real**. Esto crea una experiencia fresca y sorprendente en cada modo, manteniendo a los jugadores alerta y adaptándose constantemente.

El ganador se determina acumulando victorias en cada modo. Al final de los 5 modos, quien tenga más victorias gana la partida completa.

---

## 🎮 Respuesta al Tema: "Reinventing Competition"

Este juego responde directamente al tema **"Reinventing Competition"** reimaginando las reglas fundamentales de deportes clásicos en un entorno 3D inmersivo:

| Deporte | Reinvención |
|---------|-------------|
| ⚽ **Fútbol 3D** | Los arcos se mueven verticalmente. ¡Marca goles en arcos que no paran! |
| 🥊 **Sumo Arena** | La zona de batalla se mueve por el campo. Empuja a tu rival fuera. |
| 🏓 **Ping Pong 3D** | La pelota acelera con cada golpe, haciendo el juego más frenético. |
| ⛳ **Golf Dual** | Dos pelotas compiten simultáneamente en el mismo campo con obstáculos. |
| 🏎️ **Formula 3D** | Carrera en circuito 3D. Salirse de la pista penaliza con velocidad reducida. |

---

## 🕹️ Cómo Jugar

### Controles

| Acción | Jugador 1 | Jugador 2 |
|--------|-----------|-----------|
| Movimiento | `W A S D` | `↑ ↓ ← →` |
| Acción Principal | `F` | `Shift` |
| Acción Secundaria | `G` | `Enter` |

### Controles por Modo

| Modo | Movimiento | Acción Especial |
|------|------------|-----------------|
| **Fútbol 3D** | 8 direcciones | - |
| **Sumo Arena** | 8 direcciones | F/Shift = Empujón |
| **Ping Pong 3D** | Solo vertical | - |
| **Golf Dual** | Apuntar dirección | F/Shift = Cargar/Golpear |
| **Formula 3D** | Acelerar/Frenar + Girar | Automático |

---

## 🏅 Los 5 Modos

### ⚽ MODO 1 — Fútbol 3D con Arcos Móviles
- **Duración:** 60 segundos
- **Escenario:** Campo de fútbol 3D con césped, líneas y porterías iluminadas
- **Objetivo:** Meter más goles que tu rival
- **Reinvención:** Los arcos se mueven verticalmente con efecto neón
- **Estrategia:** Anticipa el movimiento del arco y calcula el ángulo perfecto

### 🥊 MODO 2 — Sumo Arena con Zona Móvil
- **Duración:** 60 segundos
- **Escenario:** Dohyō japonés 3D elevado con arena de arena
- **Objetivo:** Tener más puntos que tu rival
- **Reinvención:** La zona circular se mueve por el campo. Estar dentro suma puntos; estar fuera los resta
- **Mecánica:** Presiona F/Shift para empujar a tu rival fuera de la zona

### 🏓 MODO 3 — Ping Pong 3D
- **Duración:** 60 segundos
- **Escenario:** Mesa de ping pong 3D con red y sala de juego
- **Objetivo:** Evitar que la pelota salga por tu lado
- **Reinvención:** La pelota acelera con cada golpe con efecto trail

### ⛳ MODO 4 — Golf Dual
- **Duración:** 60 segundos
- **Escenario:** Mini campo de golf 3D con obstáculos, trampas de arena y bandera
- **Objetivo:** Meter la pelota en el hoyo o estar más cerca al terminar
- **Mecánica:** Mantén presionado F/Shift para cargar potencia, suelta para golpear

### 🏎️ MODO 5 — Formula 3D
- **Duración:** 60 segundos
- **Escenario:** Circuito oval 3D con bordillos, césped y línea de meta
- **Objetivo:** Completar más vueltas que tu rival
- **Reinvención:** Salirse de la pista penaliza 3 segundos de velocidad reducida

---

## 🏗️ Arquitectura del Juego

### Motor 3D
```
Three.js          → Renderizado WebGL 3D con sombras, fog, PBR
cannon-es         → Motor de física 3D (gravedad, colisiones, impulsos)
TypeScript        → Código fuente tipado y estricto
Vite              → Bundler y servidor de desarrollo
```

### Flujo de Escenas
```
Menu (3D animado)   → Fondo con objetos flotantes y luces
ModeIntro           → Descripción del modo (4 segundos)
Countdown           → 3... 2... 1... ¡GO!
GameScene           → Gameplay 3D activo (60 segundos)
ResultScene         → Ganador del modo
FinalScene          → Campeón del torneo
```

### Clases Principales
```
Engine              → Renderer WebGL, cámara, mundo de física
InputManager        → Gestión de teclado
Overlay             → UI HTML superpuesta sobre el canvas 3D

GameMode (base)     → setup(), update(), cleanup()
├── FootballMode    → Campo 3D, arcos móviles, pelota con física
├── SumoMode        → Arena circular, zona móvil, empujones
├── PingPongMode    → Mesa 3D, paletas, aceleración de pelota
├── GolfMode        → Curso con obstáculos, mecánica de carga
└── F1Mode          → Pista oval, coches, checkpoints, penalizaciones
```

---

## 🎨 Assets

Los assets del juego están incluidos en el repositorio:

```
public/assets/textures/
├── grass.svg         → Textura de césped (fútbol, golf)
├── wood.svg          → Textura de madera (sumo)
├── asphalt.svg       → Textura de asfalto (F1)
├── table-green.svg   → Textura de mesa (ping pong)
├── sand.svg          → Textura de arena (sumo, golf)
├── sky.svg           → Textura de cielo
├── metal.svg         → Textura de metal (porterías)
└── ball-soccer.svg   → Pelota de fútbol
```

Los escenarios 3D se generan proceduralmente con geometrías Three.js y materiales PBR para un acabado profesional.

---

## 🚀 Deploy en GitHub Pages

El proyecto incluye un workflow de GitHub Actions:

1. Haz fork de este repositorio
2. Ve a **Settings → Pages**
3. En "Build and deployment", selecciona "GitHub Actions" como source
4. ¡Listo! Tu juego estará en `https://[usuario].github.io/SPORT-FUSION-ARENA`

---

## 📋 Stack Técnico

- **Motor 3D:** Three.js 0.183+
- **Física:** cannon-es 0.20
- **Lenguaje:** TypeScript con configuración estricta
- **Build Tool:** Vite 7+
- **Linting:** ESLint con reglas de TypeScript
- **Formato:** Prettier
- **Rendering:** WebGL con sombras, tone mapping, fog
- **Deploy:** GitHub Actions + GitHub Pages
- **Compatible:** Chrome, Firefox, Edge, Safari modernos

---

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos de TypeScript
npm run typecheck

# Ejecutar linter
npm run lint

# Formatear código
npm run format

# Compilar para producción
npm run build
```

---

## 🎮 ¡A Jugar!

1. Ejecuta `npm run dev` para iniciar el servidor de desarrollo
2. Abre tu navegador en `http://localhost:3000`
3. Haz click en "COMENZAR" para iniciar el torneo
4. ¡Compite en 5 deportes reinventados en 3D!
5. El jugador con más victorias al final es el campeón

---

**Desarrollado para el Game Jam de Electronic Arts — Tema: "Reinventing Competition"**
