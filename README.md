# 🏆 SPORT FUSION ARENA

> **5 deportes reinventados en 5 minutos** — Un juego de deportes 2D local para 2 jugadores.

---

## 🎯 ¿Qué es SPORT FUSION ARENA?

**SPORT FUSION ARENA** es un juego de deportes arcade 2D diseñado para dos jugadores locales. Cada partida consta de 5 rondas de 60 segundos, donde cada ronda presenta un deporte completamente diferente con sus propias reglas, física y estética visual.

El concepto central del juego es simple pero poderoso: cada uno de los 5 deportes tiene una regla que **no existiría en el mundo real**. Esto crea una experiencia fresca y sorprendente en cada modo, manteniendo a los jugadores alerta y adaptándose constantemente.

El ganador se determina acumulando victorias en cada modo. Al final de los 5 modos, quien tenga más victorias gana la partida completa.

---

## 🎮 Respuesta al Tema: "Reinventing Competition"

Este juego responde directamente al tema **"Reinventing Competition"** reimaginando las reglas fundamentales de deportes clásicos:

| Deporte | Reinvención |
|---------|-------------|
| ⚽ **Fútbol** | Los arcos se mueven verticalmente. Solo puedes anotar entrando por el frente. |
| 🥊 **Sumo** | La zona de batalla se mueve por el campo y cambia de tamaño constantemente. |
| 🏓 **Ping Pong** | La pelota acelera con cada golpe, haciendo el juego más frenético. |
| ⛳ **Golf** | Dos jugadores compiten simultáneamente en el mismo campo. |
| 🏎️ **F1** | Salirse de la pista penaliza con 3 segundos de velocidad reducida. |

Cada modo desafía las expectativas del jugador sobre cómo "debería" funcionar el deporte, creando momentos de sorpresa y adaptación estratégica.

---

## 🕹️ Cómo Jugar

### Controles Globales

| Acción | Jugador 1 | Jugador 2 |
|--------|-----------|-----------|
| Movimiento | `W A S D` | `↑ ↓ ← →` |
| Acción Principal | `F` | `Shift` |
| Acción Secundaria | `G` | `Enter` |

### Controles por Modo

| Modo | Movimiento | Acción Especial |
|------|------------|-----------------|
| **Fútbol** | 8 direcciones | - |
| **Sumo** | 8 direcciones | F/Shift = Empujón |
| **Ping Pong** | Solo vertical | - |
| **Golf** | Rotar ángulo | F/Shift = Cargar/Golpear |
| **F1** | Girar izq/der | Automático |

---

## 🏅 Los 5 Modos

### ⚽ MODO 1 — Fútbol con Arcos Móviles
- **Duración:** 60 segundos
- **Objetivo:** Meter más goles que tu rival
- **Reinvención:** Los arcos se mueven arriba y abajo. Solo cuenta el gol si la pelota entra por el frente del arco.
- **Estrategia:** Anticipa el movimiento del arco y calcula el ángulo perfecto.

### 🥊 MODO 2 — Sumo con Zona Móvil
- **Duración:** 60 segundos  
- **Objetivo:** Tener más puntos que tu rival
- **Reinvención:** La zona circular se mueve por el campo. Estar dentro suma puntos; estar fuera los resta.
- **Mecánica:** Presiona F/Shift para empujar a tu rival fuera de la zona.
- **Estrategia:** Mantente en la zona mientras empujas a tu oponente fuera.

### 🏓 MODO 3 — Ping Pong
- **Duración:** 60 segundos
- **Objetivo:** Evitar que la pelota salga por tu lado
- **Reinvención:** La pelota acelera con cada golpe, haciendo el juego más difícil progresivamente.
- **Estrategia:** Los primeros puntos son lentos, ¡pero los últimos son furiosos!

### ⛳ MODO 4 — Golf Competitivo
- **Duración:** 60 segundos
- **Objetivo:** Llegar al hoyo o estar más cerca al terminar
- **Reinvención:** Dos pelotas de golf compiten simultáneamente en el mismo campo.
- **Mecánica:** Mantén presionado F/Shift para cargar potencia, suelta para golpear. Usa WASD/Flechas para ajustar el ángulo.
- **Peligro:** ¡Cuidado con el agua! Penaliza +2 golpes.

### 🏎️ MODO 5 — Fórmula 1
- **Duración:** 60 segundos
- **Objetivo:** Completar más vueltas que tu rival
- **Reinvención:** Salirse de la pista penaliza con 3 segundos de velocidad reducida.
- **Mecánica:** El carro acelera automáticamente. Usa A/D o ←/→ para girar.
- **Estrategia:** Velocidad vs. Precisión. ¿Arriesgas cortando curvas?

---

## 🏗️ Arquitectura del Juego

### Escenas Phaser
```
BootScene       → Carga imágenes y crea texturas
MenuScene       → Pantalla título animada
ModeIntroScene  → Explicación 7s por modo
GameScene       → Lógica de juego activa
ResultScene     → Ganador del modo
FinalScene      → Ganador total
```

### Clases Principales
```
GameMode (base)     → setup(), update(), cleanup()
├── FootballMode    → Arcos móviles, detección de gol
├── SumoMode        → Zona móvil, empujones
├── PingPongMode    → Movimiento vertical, aceleración
├── GolfMode        → Barra de potencia, detección de hoyo
└── F1Mode          → Física de steering, checkpoints
```

---

## 🚀 Deploy en GitHub Pages

1. Haz fork de este repositorio
2. Ve a **Settings → Pages**
3. En "Source", selecciona la rama `main` y carpeta `/root`
4. ¡Listo! Tu juego estará disponible en `https://[usuario].github.io/SPORT-FUSION-ARENA`

### Jugar Localmente
Simplemente abre `index.html` en tu navegador. El juego funciona con protocolo `file://`.

---

## 🖼️ Créditos de Imágenes

Los fondos del juego se cargan desde [picsum.photos](https://picsum.photos/), un servicio gratuito de imágenes que no requiere atribución (licencia Unsplash).

Si las imágenes no cargan, el juego utiliza colores de respaldo temáticos para cada modo.

---

## 🛣️ Roadmap Futuro

- [ ] **Modo IA** — Jugar solo contra un oponente controlado por computadora
- [ ] **Efectos de Sonido** — Audio para golpes, goles, vueltas, etc.
- [ ] **Más Modos** — Baloncesto, Voleibol, Boxeo
- [ ] **Soporte Móvil** — Controles táctiles para jugar en celular/tablet
- [ ] **Modo Online** — Multijugador por internet
- [ ] **Personalización** — Colores de jugador personalizables

---

## 📋 Stack Técnico

- **Motor:** Phaser 3.60+
- **Lenguaje:** JavaScript ES6+ (Vanilla)
- **Estilo:** CSS3 con variables
- **Sin dependencias de build:** Solo HTML, CSS, JS puros
- **Compatible:** Chrome, Firefox, Edge, Safari modernos

---

## 🎮 ¡A Jugar!

1. Abre `index.html` en tu navegador
2. Presiona cualquier tecla para comenzar
3. ¡Compite en 5 deportes reinventados!
4. El jugador con más victorias al final gana

---

**Desarrollado para el Game Jam de Electronic Arts — Tema: "Reinventing Competition"**
