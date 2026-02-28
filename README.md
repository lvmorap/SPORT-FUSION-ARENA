# PROMPT DEFINITIVO — GITHUB COPILOT AGENT
## Game Jam · Electronic Arts · "Reinventing Competition"
## Juego: SPORT FUSION ARENA

---

> ⚠️ LEE ESTE DOCUMENTO COMPLETO ANTES DE ESCRIBIR CÓDIGO.
> El orden de implementación y los detalles de cada modo son tan importantes como el código en sí.
> Tómate el tiempo necesario para ejecutar cada modo correctamente.

---

## 🎯 CONCEPTO DEL JUEGO

**SPORT FUSION ARENA** es un juego de deportes 2D local para 2 jugadores donde cada ronda presenta un deporte completamente diferente con sus propias reglas, física, ambientación visual y skins de personajes.

El gancho central: **5 deportes reinventados en 5 minutos. Cada deporte tiene una regla que no existiría en el mundo real.**

Esto responde directamente al tema **"Reinventing Competition"**:
- Fútbol donde los arcos se mueven
- Sumo donde la zona de batalla también se mueve
- Ping Pong donde el espacio y el ritmo lo son todo
- Golf donde dos jugadores compiten en la misma pista con física de potencia
- F1 donde el caos y la velocidad hacen que salirse sea parte del juego

---

## ⚠️ RESTRICCIONES TÉCNICAS (INAMOVIBLES)

```
- Solo frontend puro: HTML5, CSS3, JavaScript ES6+
- Phaser 3.60+ vía CDN
- Sin build tools, sin Node.js, sin TypeScript, sin frameworks
- Funciona abriendo index.html directamente (file://)
- Compatible con GitHub Pages sin configuración adicional
```

**CDN obligatorio:**
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
index.html     ← entrada única
style.css      ← estilos globales + fuentes
main.js        ← toda la lógica del juego
README.md      ← documentación obligatoria
```

---

## 🕹️ CONTROLES GLOBALES

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Movimiento (8 direcciones) | `W A S D` | `↑ ↓ ← →` |
| Acción principal | `F` | `Shift` |
| Acción secundaria | `G` | `Enter` |

> Cada modo puede re-definir qué hace cada acción, pero las teclas base son siempre estas.

---

## 🖼️ SISTEMA DE IMÁGENES DE FONDO (CRÍTICO)

Cada modo debe tener un fondo fotográfico real cargado desde internet.
Usar `picsum.photos` con IDs específicos para garantizar consistencia:

```javascript
// En BootScene.preload(), cargar TODAS las imágenes antes de empezar:
this.load.setCORS('anonymous');

// Fútbol — estadio de fútbol con césped verde
this.load.image('bg_football', 'https://picsum.photos/id/1063/800/600');

// Sumo — tatami japonés, interiores de madera
this.load.image('bg_sumo', 'https://picsum.photos/id/1062/800/600');

// Ping Pong — mesa de ping pong, ambiente de sala
this.load.image('bg_pingpong', 'https://picsum.photos/id/96/800/600');

// Golf — campo de golf, hierba verde, cielo despejado
this.load.image('bg_golf', 'https://picsum.photos/id/167/800/600');

// F1 — circuito de carreras, asfalto, tribunas
this.load.image('bg_f1', 'https://picsum.photos/id/1060/800/600');
```

**Cómo usar el fondo en cada modo:**
```javascript
// En el create() de cada modo:
const bg = this.add.image(400, 300, 'bg_football');
bg.setDisplaySize(800, 600);
bg.setAlpha(0.35); // Semi-transparente para que los elementos del juego sean legibles
bg.setDepth(-10);  // Siempre detrás de todo
```

> Si alguna imagen falla por CORS, usar un fallback de color sólido temático. Nunca romper el juego por una imagen.

```javascript
// Fallback seguro:
this.load.on('loaderror', (file) => {
  if (file.key.startsWith('bg_')) {
    // Crear textura de color sólido como reemplazo
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const colors = { bg_football: 0x1a4a1a, bg_sumo: 0x8B4513, bg_pingpong: 0x1a3a5c, bg_golf: 0x2d6a2d, bg_f1: 0x1a1a1a };
    g.fillStyle(colors[file.key] || 0x111111);
    g.fillRect(0, 0, 800, 600);
    g.generateTexture(file.key, 800, 600);
    g.destroy();
  }
});
```

---

## 🎨 SKINS DE PERSONAJES POR MODO

Cada modo cambia completamente la apariencia visual de los jugadores.
Todos los sprites se dibujan con Phaser Graphics API (sin imágenes externas).

### Función generadora de skins:
```javascript
function createPlayerSkin(graphics, mode, playerNum) {
  const color = playerNum === 1 ? 0x00e5ff : 0xff3d71;
  const darkColor = playerNum === 1 ? 0x0099aa : 0xaa1144;

  switch(mode) {
    case 'football':
      // Cuerpo ovalado de futbolista con camiseta
      // Círculo principal + número encima
      graphics.fillStyle(color);
      graphics.fillEllipse(0, 0, 32, 38);
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(0, -8, 8); // cabeza
      break;

    case 'sumo':
      // Luchador de sumo: círculo gordo, colores brillantes
      graphics.fillStyle(color, 0.9);
      graphics.fillCircle(0, 0, 22); // cuerpo grande
      graphics.fillStyle(darkColor);
      graphics.fillCircle(0, -14, 10); // cabeza
      // Cinturón mawashi
      graphics.lineStyle(4, 0xffcc00);
      graphics.strokeRect(-14, -4, 28, 10);
      break;

    case 'pingpong':
      // Raqueta de ping pong sostenida por un jugador estilizado
      graphics.fillStyle(color);
      graphics.fillRect(-6, -20, 12, 24); // cuerpo
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(0, -24, 7); // cabeza
      // Raqueta
      graphics.fillStyle(darkColor);
      graphics.fillEllipse(18, -10, 20, 24);
      graphics.lineStyle(3, 0x888888);
      graphics.lineBetween(6, -4, 18, -10);
      break;

    case 'golf':
      // El jugador ES una pelota de golf con carita
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(0, 0, 16); // pelota blanca
      // Hoyuelos del golf (dimples)
      graphics.fillStyle(0xdddddd);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        graphics.fillCircle(Math.cos(angle) * 8, Math.sin(angle) * 8, 2.5);
      }
      // Color del jugador como acento
      graphics.lineStyle(3, color);
      graphics.strokeCircle(0, 0, 16);
      break;

    case 'f1':
      // Carro de F1 visto desde arriba
      // Carrocería principal
      graphics.fillStyle(color);
      graphics.fillRect(-8, -20, 16, 40); // cuerpo del carro
      // Alas frontales y traseras
      graphics.fillStyle(darkColor);
      graphics.fillRect(-16, -18, 8, 6);  // ala frontal izq
      graphics.fillRect(8, -18, 8, 6);    // ala frontal der
      graphics.fillRect(-14, 14, 6, 8);   // ala trasera izq
      graphics.fillRect(8, 14, 6, 8);     // ala trasera der
      // Neumáticos
      graphics.fillStyle(0x222222);
      graphics.fillEllipse(-12, -10, 8, 12);
      graphics.fillEllipse(12, -10, 8, 12);
      graphics.fillEllipse(-12, 10, 8, 12);
      graphics.fillEllipse(12, 10, 8, 12);
      // Cabina del piloto
      graphics.fillStyle(0x111111);
      graphics.fillEllipse(0, -4, 10, 14);
      break;
  }
}
```

---

## 🏗️ ARQUITECTURA MODULAR OBLIGATORIA

```javascript
// Escenas Phaser
class BootScene       extends Phaser.Scene { } // carga imágenes, fuentes
class MenuScene       extends Phaser.Scene { } // pantalla título animada
class ModeIntroScene  extends Phaser.Scene { } // explicación 7s por modo
class GameScene       extends Phaser.Scene { } // lógica de juego activa
class ResultScene     extends Phaser.Scene { } // ganador del modo
class FinalScene      extends Phaser.Scene { } // ganador total

// Clases del juego
class Player {
  constructor(scene, x, y, playerNum, mode) { }
  setMode(mode)         { } // cambia skin y stats
  update(cursors, keys) { }
  applyKnockback(angle, force) { }
  get position()        { }
}

class GameMode {
  constructor(scene, p1, p2) { }
  setup()               { } // arena, jugadores, objetos
  update(time, delta)   { }
  checkEnd()            { } // null o { winner, p1Score, p2Score }
  cleanup()             { }
  get introData()       { } // { title, line1, line2 }
  get modeName()        { }
}

// Los 5 modos extienden GameMode:
class FootballMode    extends GameMode { }
class SumoMode        extends GameMode { }
class PingPongMode    extends GameMode { }
class GolfMode        extends GameMode { }
class F1Mode          extends GameMode { }

class UIManager {
  constructor(scene)    { }
  drawScoreboard(scores, time) { }
  showFloatingText(x, y, text, color) { }
  drawPowerBar(player, power) { } // para golf
  drawLapCounter(player, laps) { } // para F1
}

class GameModeManager {
  constructor()         { }
  getSequence()         { } // [football, sumo, pingpong, golf, f1] en orden
}
```

---

## 🎮 LOS 5 MODOS — ESPECIFICACIÓN COMPLETA

---

### MODO 1 — FÚTBOL CON ARCOS MÓVILES
**Duración: 60 segundos**

#### Reinvención del deporte
Los arcos se mueven arriba y abajo constantemente. Además, solo se puede anotar golpeando el balón **por el frente del arco** (no por los lados ni por atrás). Esto elimina el gol de rebote accidental y exige precisión real.

#### Setup del arena
```javascript
setup() {
  // Fondo fotográfico
  this.bg = this.scene.add.image(400, 300, 'bg_football').setDisplaySize(800,600).setAlpha(0.35).setDepth(-10);

  // Líneas del campo dibujadas sobre el fondo
  const g = this.scene.add.graphics();
  g.lineStyle(2, 0xffffff, 0.6);
  g.strokeRect(60, 40, 680, 520);       // bordes del campo
  g.lineBetween(400, 40, 400, 560);     // línea central
  g.strokeCircle(400, 300, 70);         // círculo central

  // Balón físico
  this.ball = this.scene.physics.add.image(400, 300, null);
  // Dibujar balón como círculo blanco con pentagones negros
  const ballGfx = this.scene.add.graphics();
  ballGfx.fillStyle(0xffffff); ballGfx.fillCircle(0,0,12);
  ballGfx.fillStyle(0x222222);
  // 5 puntos del balón de fútbol
  for (let i = 0; i < 5; i++) {
    const a = (i/5)*Math.PI*2 - Math.PI/2;
    ballGfx.fillCircle(Math.cos(a)*7, Math.sin(a)*7, 3);
  }
  ballGfx.generateTexture('ball_football', 24, 24);
  ballGfx.destroy();
  this.ball = this.scene.physics.add.image(400, 300, 'ball_football');
  this.ball.setBounce(0.75);
  this.ball.setMaxVelocity(600, 600);
  this.ball.setCollideWorldBounds(true);

  // Arcos: Jugador 1 a la izquierda (x=80), Jugador 2 a la derecha (x=720)
  // Cada arco es un rectángulo que se mueve arriba y abajo
  this.goal1 = { x: 80, y: 300, width: 18, height: 90, speed: 90, dir: 1 };
  this.goal2 = { x: 720, y: 300, width: 18, height: 90, speed: 90, dir: -1 };

  // Línea de "frente del arco" — solo el lado que mira al campo cuenta
  // Arco P1: el frente es su lado DERECHO (x + width/2)
  // Arco P2: el frente es su lado IZQUIERDO (x - width/2)
}
```

#### Mecánica de arcos móviles
```javascript
updateGoals(delta) {
  // Mover arcos arriba y abajo
  this.goal1.y += this.goal1.speed * this.goal1.dir * (delta/1000);
  this.goal2.y += this.goal2.speed * this.goal2.dir * (delta/1000);

  // Rebotar en los límites verticales (dejar margen)
  if (this.goal1.y < 120 || this.goal1.y > 480) this.goal1.dir *= -1;
  if (this.goal2.y < 120 || this.goal2.y > 480) this.goal2.dir *= -1;

  // Redibujar arcos cada frame
  this.goalGraphics.clear();
  this.goalGraphics.lineStyle(4, 0xffffff, 1);

  // Arco P1 (izquierda) — dibujar U abierta hacia la derecha
  const g1top = this.goal1.y - this.goal1.height/2;
  const g1bot = this.goal1.y + this.goal1.height/2;
  this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x - 9, g1bot);
  this.goalGraphics.lineBetween(this.goal1.x - 9, g1top, this.goal1.x + 9, g1top);
  this.goalGraphics.lineBetween(this.goal1.x - 9, g1bot, this.goal1.x + 9, g1bot);
  // El frente (derecha del arco) NO tiene línea — está abierto

  // Arco P2 (derecha) — U abierta hacia la izquierda
  const g2top = this.goal2.y - this.goal2.height/2;
  const g2bot = this.goal2.y + this.goal2.height/2;
  this.goalGraphics.lineBetween(this.goal2.x + 9, g2top, this.goal2.x + 9, g2bot);
  this.goalGraphics.lineBetween(this.goal2.x - 9, g2top, this.goal2.x + 9, g2top);
  this.goalGraphics.lineBetween(this.goal2.x - 9, g2bot, this.goal2.x + 9, g2bot);
}
```

#### Detección de gol (solo por el frente)
```javascript
checkGoal() {
  const bx = this.ball.x, by = this.ball.y;
  const bvx = this.ball.body.velocity.x;

  // GOL en arco P2 (lado derecho): balón entra moviéndose hacia la DERECHA (vx > 0)
  // y pasa por el frente izquierdo del arco 2
  if (bvx > 50 && bx > this.goal2.x - 20 && bx < this.goal2.x + 20) {
    if (by > this.goal2.y - this.goal2.height/2 && by < this.goal2.y + this.goal2.height/2) {
      this.scoreGoal(1); // Punto para jugador 1
    }
  }

  // GOL en arco P1: balón entra moviéndose hacia la IZQUIERDA (vx < 0)
  if (bvx < -50 && bx > this.goal1.x - 20 && bx < this.goal1.x + 20) {
    if (by > this.goal1.y - this.goal1.height/2 && by < this.goal1.y + this.goal1.height/2) {
      this.scoreGoal(2); // Punto para jugador 2
    }
  }
}
```

#### Pantalla de introducción
```
FÚTBOL CON ARCOS MÓVILES
Los arcos no se quedan quietos. Solo puedes anotar
por el frente del arco. El ángulo lo es todo.
```

---

### MODO 2 — SUMO CON ZONA MÓVIL
**Duración: 60 segundos**

#### Reinvención del deporte
No hay una sola zona circular fija. La zona se mueve por el campo, cambia de tamaño, y si un jugador queda fuera de ella pierde puntos progresivamente.

#### Setup
```javascript
setup() {
  this.bg = this.scene.add.image(400, 300, 'bg_sumo').setDisplaySize(800,600).setAlpha(0.35).setDepth(-10);

  // Zona de sumo — círculo que se mueve
  this.zone = {
    x: 400, y: 300,
    radius: 160,
    targetX: 400, targetY: 300,
    speed: 60  // px/seg
  };
  this.zoneGraphics = this.scene.add.graphics();

  // Jugadores sin balón — se empujan entre sí directamente
  // Activar colisión física jugador-jugador
  this.scene.physics.add.collider(this.p1.sprite, this.p2.sprite, this.onCollision, null, this);

  // Acción F / Shift = EMPUJÓN
  // Empujón aplica fuerza en dirección del vector jugador→rival
}

updateZone(delta) {
  // Mover zona hacia su objetivo
  const dx = this.zone.targetX - this.zone.x;
  const dy = this.zone.targetY - this.zone.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 5) {
    // Elegir nuevo objetivo aleatorio (con margen del borde)
    this.zone.targetX = Phaser.Math.Between(180, 620);
    this.zone.targetY = Phaser.Math.Between(150, 450);
  } else {
    this.zone.x += (dx/dist) * this.zone.speed * (delta/1000);
    this.zone.y += (dy/dist) * this.zone.speed * (delta/1000);
  }

  // El radio oscila entre 120 y 200 lentamente
  this.zone.radius = 160 + Math.sin(this.scene.time.now * 0.001) * 40;

  // Dibujar zona
  this.zoneGraphics.clear();
  this.zoneGraphics.lineStyle(4, 0xff6600, 1);
  this.zoneGraphics.strokeCircle(this.zone.x, this.zone.y, this.zone.radius);
  this.zoneGraphics.fillStyle(0xff6600, 0.12);
  this.zoneGraphics.fillCircle(this.zone.x, this.zone.y, this.zone.radius);
}
```

#### Sistema de puntos Sumo
```javascript
updatePoints(delta) {
  const p1Dist = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.zone.x, this.zone.y);
  const p2Dist = Phaser.Math.Distance.Between(this.p2.x, this.p2.y, this.zone.x, this.zone.y);

  // Si un jugador está FUERA de la zona, pierde 1 punto cada segundo
  if (p1Dist > this.zone.radius) {
    this.p1OutTimer += delta;
    if (this.p1OutTimer > 1000) {
      this.p1Score = Math.max(0, this.p1Score - 1);
      this.p1OutTimer = 0;
      // Indicador visual: parpadeo rojo en P1
    }
  } else {
    this.p1OutTimer = 0;
    // Dentro de la zona: +1 cada 2 segundos
    this.p1InTimer += delta;
    if (this.p1InTimer > 2000) { this.p1Score++; this.p1InTimer = 0; }
  }
  // Mismo para P2
}
```

#### Empujón en Sumo
```javascript
onPushAction(attacker, defender) {
  // Vector de dirección atacante → defensor
  const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
  const force = 520;
  defender.body.setVelocity(Math.cos(angle)*force, Math.sin(angle)*force);

  // Feedback visual
  this.scene.cameras.main.shake(100, 0.005);
  attacker.setTint(0xffff00); // flash amarillo
  this.scene.time.delayedCall(150, () => attacker.clearTint());
}
```

#### Pantalla de introducción
```
SUMO CON ZONA MÓVIL
La zona se mueve. Quédate dentro y empuja a tu rival fuera.
Cada segundo fuera de la zona pierdes puntos.
```

---

### MODO 3 — PING PONG
**Duración: 60 segundos**

#### Reinvención del deporte
Los jugadores solo se mueven verticalmente (arriba/abajo). La pelota rebota entre los dos extremos. Si la pelota sale por tu lado, el rival anota. Reinvención: la pelota acelera progresivamente cada vez que es golpeada.

#### Setup del arena
```javascript
setup() {
  this.bg = this.scene.add.image(400, 300, 'bg_pingpong').setDisplaySize(800,600).setAlpha(0.4).setDepth(-10);

  // Líneas de la mesa
  const g = this.scene.add.graphics();
  g.lineStyle(3, 0xffffff, 0.8);
  g.strokeRect(80, 80, 640, 440);   // borde de la mesa
  g.lineBetween(400, 80, 400, 520); // línea central (red)
  g.lineStyle(6, 0xffffff, 1);
  g.lineBetween(400, 75, 400, 525); // red más gruesa

  // Pelota
  this.ball = this.scene.physics.add.image(400, 300, 'ball_pingpong');
  // Crear textura de pelota naranja
  const bg2 = this.scene.make.graphics({ add: false });
  bg2.fillStyle(0xff6600); bg2.fillCircle(8, 8, 8);
  bg2.generateTexture('ball_pingpong', 16, 16); bg2.destroy();

  this.ball.setVelocity(220, Phaser.Math.Between(-150, 150));
  this.ball.setBounce(1, 1);
  this.ball.setMaxVelocity(900, 600);
  this.hitCount = 0; // contador de golpes para acelerar

  // Jugadores: SOLO se mueven verticalmente
  // P1 en x=100, P2 en x=700
  // Teclas W/S para P1, ↑↓ para P2
  this.p1.x = 100; this.p2.x = 700;
  this.p1.body.allowGravity = false;
  this.p2.body.allowGravity = false;

  // Límites: rebote en paredes superior/inferior, pero NO en los lados (sale = punto)
  this.ball.setCollideWorldBounds(false); // manejar manualmente
}
```

#### Lógica de golpe y aceleración
```javascript
update(time, delta) {
  // Solo permitir movimiento vertical
  if (upKey1.isDown) this.p1.body.setVelocityY(-280);
  else if (downKey1.isDown) this.p1.body.setVelocityY(280);
  else this.p1.body.setVelocityY(0);

  // Rebotar en techo y suelo
  if (this.ball.y < 85 || this.ball.y > 515) {
    this.ball.body.velocity.y *= -1;
    this.ball.y = Phaser.Math.Clamp(this.ball.y, 85, 515);
  }

  // Detección de golpe con raqueta (área de colisión de los jugadores)
  const hitRange = 28;
  if (Math.abs(this.ball.x - this.p1.x) < hitRange && Math.abs(this.ball.y - this.p1.y) < hitRange) {
    this.ball.body.velocity.x = Math.abs(this.ball.body.velocity.x) + 30; // acelera
    this.ball.body.velocity.y += Phaser.Math.Between(-60, 60); // ángulo variable
    this.hitCount++;
    this.onBallHit('p1');
  }

  // Salida por los lados = punto
  if (this.ball.x < 30) { this.scorePoint(2); this.resetBall(); }
  if (this.ball.x > 770) { this.scorePoint(1); this.resetBall(); }
}

onBallHit(player) {
  // Screen shake leve
  this.scene.cameras.main.shake(60, 0.003);
  // La pelota cambia levemente de color cada golpe para indicar velocidad
  const speed = Math.sqrt(this.ball.body.velocity.x**2 + this.ball.body.velocity.y**2);
  const intensity = Math.min(speed / 900, 1);
  const r = Math.floor(255 * intensity);
  const b = Math.floor(255 * (1-intensity));
  this.ball.setTint(Phaser.Display.Color.GetColor(r, 100, b));
}
```

#### Pantalla de introducción
```
PING PONG
Solo puedes moverte arriba y abajo. Golpea la pelota
para que no salga por tu lado. Cada golpe la acelera.
```

---

### MODO 4 — GOLF (COMPETICIÓN EN PISTA COMPARTIDA)
**Duración: 60 segundos**

#### Reinvención del deporte
Los dos jugadores son pelotas de golf que recorren la **misma pista** al mismo tiempo. Quien llegue al hoyo primero o esté más cerca al terminar el tiempo, gana. La fuerza del golpe se controla manteniendo presionado el botón de acción.

#### IMPORTANTE: En este modo los jugadores SON pelotas de golf
Los controles cambian completamente:
- `W A S D` / `↑↓←→`: Elegir dirección del golpe (rota una flecha indicadora)
- `F` / `Shift`: Mantener presionado para cargar fuerza, soltar para golpear

#### Setup de la pista de golf
```javascript
setup() {
  this.bg = this.scene.add.image(400, 300, 'bg_golf').setDisplaySize(800,600).setAlpha(0.4).setDepth(-10);

  // Pista de golf en forma de "S" o zigzag
  // Definida como una serie de waypoints y zonas de fairway
  this.fairways = [
    { x: 100, y: 490, w: 180, h: 80 },   // Tee (inicio)
    { x: 240, y: 430, w: 80, h: 200 },   // Canal vertical
    { x: 220, y: 250, w: 220, h: 80 },   // Canal horizontal
    { x: 400, y: 200, w: 80, h: 200 },   // Canal vertical 2
    { x: 380, y: 100, w: 300, h: 80 },   // Canal final
    { x: 660, y: 100, w: 80, h: 160 },   // Llegada
  ];

  // Obstáculos (agua, bunkers)
  this.obstacles = [
    { type: 'water', x: 320, y: 350, r: 35 },
    { type: 'bunker', x: 500, y: 150, r: 28 },
  ];

  // Hoyo (destino)
  this.hole = { x: 680, y: 180, r: 20 };

  // Los jugadores son pelotas con física de rebote bajo
  // P1 empieza en tee izquierdo, P2 un poco a la derecha
  this.p1Ball = this.scene.physics.add.image(110, 490, 'player1_golf');
  this.p2Ball = this.scene.physics.add.image(150, 490, 'player2_golf');
  this.p1Ball.setBounce(0.3).setDrag(200, 200).setMaxVelocity(700, 700);
  this.p2Ball.setBounce(0.3).setDrag(200, 200).setMaxVelocity(700, 700);

  // Estado de carga de golpe
  this.p1Power = 0; this.p1Charging = false;
  this.p2Power = 0; this.p2Charging = false;
  this.p1Angle = 0; this.p2Angle = 0; // ángulo del golpe
  this.p1Strokes = 0; this.p2Strokes = 0;
  this.p1Finished = false; this.p2Finished = false;
}
```

#### Barra de potencia visual
```javascript
drawPowerBar(x, y, power, color) {
  // Barra horizontal sobre el jugador
  const barW = 50, barH = 8;
  this.powerBarGraphics.fillStyle(0x333333);
  this.powerBarGraphics.fillRect(x - barW/2, y - 30, barW, barH);
  this.powerBarGraphics.fillStyle(color);
  this.powerBarGraphics.fillRect(x - barW/2, y - 30, barW * (power/100), barH);

  // Borde
  this.powerBarGraphics.lineStyle(1, 0xffffff, 0.8);
  this.powerBarGraphics.strokeRect(x - barW/2, y - 30, barW, barH);

  // Si power >= 90, parpadear en rojo (sobre-carga)
  if (power >= 90) {
    this.powerBarGraphics.fillStyle(0xff0000, Math.sin(this.scene.time.now * 0.01) * 0.5 + 0.5);
    this.powerBarGraphics.fillRect(x - barW/2, y - 30, barW * (power/100), barH);
  }
}

drawDirectionArrow(x, y, angle, color) {
  // Flecha que indica la dirección del golpe
  const len = 40;
  const ex = x + Math.cos(angle) * len;
  const ey = y + Math.sin(angle) * len;
  this.arrowGraphics.lineStyle(3, color, 0.9);
  this.arrowGraphics.lineBetween(x, y, ex, ey);
  // Punta de la flecha
  const headLen = 10;
  const a1 = angle + 2.5, a2 = angle - 2.5;
  this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a1)*headLen, ey + Math.sin(a1)*headLen);
  this.arrowGraphics.lineBetween(ex, ey, ex + Math.cos(a2)*headLen, ey + Math.sin(a2)*headLen);
}
```

#### Control de golpe
```javascript
handleGolfInput(player, ball, isCharging, power, angle, chargingKey, dirKeys) {
  // Rotar dirección con las teclas de movimiento
  if (dirKeys.left.isDown) angle -= 0.04;
  if (dirKeys.right.isDown) angle += 0.04;
  if (dirKeys.up.isDown) angle -= 0.02;
  if (dirKeys.down.isDown) angle += 0.02;

  // Solo se puede golpear si la pelota está casi quieta
  const isMoving = Math.abs(ball.body.velocity.x) > 15 || Math.abs(ball.body.velocity.y) > 15;

  if (!isMoving) {
    if (chargingKey.isDown) {
      // Cargar potencia
      power = Math.min(100, power + 1.5);
      isCharging = true;
    } else if (isCharging) {
      // Soltar → golpear
      const force = (power / 100) * 700;
      ball.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
      this['p' + player + 'Strokes']++;
      power = 0; isCharging = false;
      this.scene.cameras.main.shake(80, 0.004);
    }
  }
  return { power, isCharging, angle };
}
```

#### Penalización de obstáculos
```javascript
checkObstacles(ball, player) {
  for (const obs of this.obstacles) {
    const d = Phaser.Math.Distance.Between(ball.x, ball.y, obs.x, obs.y);
    if (d < obs.r + 14) {
      if (obs.type === 'water') {
        // Agua: regresa al último punto seguro + penalización
        ball.x = this['p'+player+'LastSafe'].x;
        ball.y = this['p'+player+'LastSafe'].y;
        ball.body.setVelocity(0, 0);
        this['p'+player+'Strokes'] += 2; // penalización
        this.showPenalty(ball.x, ball.y);
      } else if (obs.type === 'bunker') {
        // Bunker: reduce velocidad al 40%
        ball.body.velocity.x *= 0.4;
        ball.body.velocity.y *= 0.4;
      }
    }
  }
}
```

#### Pantalla de introducción
```
GOLF — MISMO CURSO, DOS PELOTAS
Mantén F/Shift para cargar fuerza. Suelta para golpear.
Evita el agua. Llega al hoyo antes que tu rival.
```

---

### MODO 5 — F1 (CARRERA EN CIRCUITO)
**Duración: 60 segundos**

#### Reinvención del deporte
Los carros van muy rápido y es muy fácil salirse del circuito. Salirse penaliza al jugador con velocidad reducida por 3 segundos. Gana quien dé más vueltas completas en 60 segundos.

#### Setup de la pista de F1
```javascript
setup() {
  this.bg = this.scene.add.image(400, 300, 'bg_f1').setDisplaySize(800,600).setAlpha(0.3).setDepth(-10);

  // Pista de F1 definida como un polígono cerrado (puntos del carril)
  // Forma ovalada/circuito con una curva chicane
  this.trackPoints = [
    {x:150, y:150}, {x:400, y:80},  {x:650, y:150},
    {x:700, y:250}, {x:600, y:300}, {x:680, y:370},
    {x:650, y:480}, {x:400, y:530}, {x:150, y:480},
    {x:100, y:350}, {x:150, y:250},
  ];
  this.trackWidth = 70; // ancho del carril

  // Dibujar pista
  this.drawTrack();

  // Los carros tienen física de steering (no movimiento 8 direcciones)
  // El carro siempre avanza; el jugador controla el ángulo
  this.p1Car = this.createCar(180, 170, 0x00e5ff, 'p1');
  this.p2Car = this.createCar(180, 210, 0xff3d71, 'p2');

  // Puntos de control para contar vueltas
  this.checkpoints = [
    { x: 400, y: 95, r: 60, id: 'top' },
    { x: 690, y: 300, r: 60, id: 'right' },
    { x: 400, y: 525, r: 60, id: 'bottom' },
    { x: 110, y: 300, r: 60, id: 'left' },
  ];
  this.p1Checkpoints = new Set(); this.p2Checkpoints = new Set();
  this.p1Laps = 0; this.p2Laps = 0;

  // Estado de "off-track"
  this.p1OffTrack = false; this.p2OffTrack = false;
  this.p1PenaltyTimer = 0; this.p2PenaltyTimer = 0;
}

createCar(x, y, color, player) {
  const carGfx = this.scene.make.graphics({ add: false });
  // Usar la función createPlayerSkin para el modo 'f1'
  carGfx.generateTexture(`car_${player}`, 36, 48);
  carGfx.destroy();

  const car = this.scene.physics.add.image(x, y, `car_${player}`);
  car.setMaxVelocity(400, 400);
  car.customData = { speed: 0, angle: -Math.PI/2, player }; // ángulo inicial: hacia arriba
  return car;
}
```

#### Física de steering de F1
```javascript
updateCarPhysics(car, leftKey, rightKey, delta) {
  const cd = car.customData;

  // El carro siempre acelera automáticamente hasta su velocidad máxima
  const maxSpeed = this.p1OffTrack && cd.player === 'p1' ? 120 : 340; // penalización off-track
  cd.speed = Math.min(maxSpeed, cd.speed + 180 * (delta/1000));

  // Girar con las teclas de dirección
  const turnRate = 2.2; // radianes/segundo
  if (leftKey.isDown) cd.angle -= turnRate * (delta/1000);
  if (rightKey.isDown) cd.angle += turnRate * (delta/1000);

  // Aplicar velocidad en la dirección actual
  car.body.setVelocity(
    Math.cos(cd.angle) * cd.speed,
    Math.sin(cd.angle) * cd.speed
  );

  // Rotar el sprite del carro para que mire en su dirección
  car.setRotation(cd.angle + Math.PI/2);

  // Detección off-track
  if (!this.isOnTrack(car.x, car.y)) {
    if (!this[cd.player + 'OffTrack']) {
      this[cd.player + 'OffTrack'] = true;
      this[cd.player + 'PenaltyTimer'] = 3000; // 3 segundos de penalización
      this.showOffTrackWarning(car.x, car.y);
      this.scene.cameras.main.shake(150, 0.007);
    }
  }

  // Timer de penalización
  if (this[cd.player + 'PenaltyTimer'] > 0) {
    this[cd.player + 'PenaltyTimer'] -= delta;
    if (this[cd.player + 'PenaltyTimer'] <= 0) {
      this[cd.player + 'OffTrack'] = false;
    }
  }
}
```

#### Detección de estar en la pista
```javascript
isOnTrack(x, y) {
  // Verificar si el punto (x,y) está dentro del polígono de la pista
  // Usando ray casting algorithm
  let inside = false;
  for (let i = 0, j = this.trackPoints.length - 1; i < this.trackPoints.length; j = i++) {
    const xi = this.trackPoints[i].x, yi = this.trackPoints[i].y;
    const xj = this.trackPoints[j].x, yj = this.trackPoints[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  // También debe estar dentro del carril (no muy lejos del centro de la pista)
  // Simplificación: considerar off-track si está fuera del bounding box principal
  return inside;
}

checkLaps(car, player) {
  for (const cp of this.checkpoints) {
    const d = Phaser.Math.Distance.Between(car.x, car.y, cp.x, cp.y);
    if (d < cp.r && !this[player + 'Checkpoints'].has(cp.id)) {
      this[player + 'Checkpoints'].add(cp.id);
      // Vuelta completa = pasó por todos los checkpoints
      if (this[player + 'Checkpoints'].size === this.checkpoints.length) {
        this[player + 'Laps']++;
        this[player + 'Checkpoints'].clear();
        this.showLapComplete(car.x, car.y, player);
      }
    }
  }
}
```

#### Pantalla de introducción
```
FÓRMULA 1 — CIRCUITO DE VELOCIDAD
Gira para mantenerte en la pista. Si te sales,
pierdes velocidad 3 segundos. ¡Más vueltas = más puntos!
```

---

## ⏱️ PANTALLA DE INTRODUCCIÓN POR MODO (7 SEGUNDOS)

```javascript
class ModeIntroScene extends Phaser.Scene {
  init(data) {
    this.modeData = data;
    this.countdown = 7;
  }

  create() {
    // Overlay oscuro semitransparente
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

    // Icono decorativo del deporte (texto grande en emoji o símbolo)
    const icons = { football: '⚽', sumo: '🥊', pingpong: '🏓', golf: '⛳', f1: '🏎️' };
    this.add.text(400, 140, icons[this.modeData.mode] || '🏆', {
      fontSize: '72px'
    }).setOrigin(0.5);

    // Título del modo
    this.add.text(400, 230, this.modeData.title, {
      fontSize: '44px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#00ffcc',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Líneas de descripción
    this.add.text(400, 308, this.modeData.line1, {
      fontSize: '20px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(400, 342, this.modeData.line2, {
      fontSize: '18px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Modo número
    this.add.text(400, 410, `MODO ${this.modeData.modeNumber} DE 5`, {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#555555'
    }).setOrigin(0.5);

    // Número del countdown — grande
    this.countdownText = this.add.text(400, 480, '7', {
      fontSize: '80px',
      fontFamily: 'Share Tech Mono, Courier New, monospace',
      color: '#ffeb00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Barra de progreso
    const barBg = this.add.rectangle(400, 555, 600, 10, 0x333333).setOrigin(0.5);
    this.progressBar = this.add.rectangle(100, 555, 0, 10, 0x00ffcc).setOrigin(0, 0.5);
    this.tweens.add({
      targets: this.progressBar, width: 600,
      duration: 7000, ease: 'Linear'
    });

    // Timer de countdown
    this.time.addEvent({
      delay: 1000, repeat: 6,
      callback: () => {
        this.countdown--;
        this.countdownText.setText(this.countdown > 0 ? this.countdown.toString() : '¡YA!');
        // Animar el número
        this.tweens.add({
          targets: this.countdownText,
          scaleX: 1.3, scaleY: 1.3, duration: 150,
          yoyo: true, ease: 'Power2'
        });
        if (this.countdown <= 0) {
          this.time.delayedCall(300, () => {
            this.scene.start('GameScene', this.modeData.gameData);
          });
        }
      }
    });
  }
}
```

---

## 📊 FLUJO DEL JUEGO Y GESTIÓN DE SCORES

```
BootScene (carga imágenes y crea texturas generativas)
  └→ MenuScene (título animado + "PRESS ANY KEY")
       └→ ModeIntroScene (modo 1 — Fútbol, 7s)
            └→ GameScene (60s, FootballMode)
                 └→ ResultScene (ganador del modo 1 + score acumulado)
                      └→ ModeIntroScene (modo 2 — Sumo, 7s)
                           └→ GameScene (60s, SumoMode)
                                └→ ResultScene
                                     └→ ... (mismo para Ping Pong, Golf, F1)
                                          └→ FinalScene (ganador total, desglose)
```

### Pasar datos entre escenas:
```javascript
// Al terminar un modo, pasar al ResultScene:
this.scene.start('ResultScene', {
  modeName: 'FÚTBOL',
  modeWinner: 'P1',    // o 'P2' o 'EMPATE'
  modeScores: { p1: 3, p2: 1 },
  globalScores: { p1: 3, p2: 1 },  // acumulado
  nextMode: 1,          // índice del siguiente modo
  modeNumber: 1
});
```

---

## 🎨 DIRECCIÓN VISUAL GLOBAL

### Paleta de colores
```css
:root {
  --p1: #00e5ff;      /* cyan — jugador 1 */
  --p2: #ff3d71;      /* coral — jugador 2 */
  --score: #ffeb00;   /* amarillo — puntuación */
  --danger: #ff2222;  /* rojo — peligro/penalización */
  --success: #00ff88; /* verde — éxito/punto */
  --text: #ffffff;
  --dark: #050510;
}
```

### Fuente
```html
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

### Scoreboard siempre visible
```javascript
class UIManager {
  drawScoreboard(p1Score, p2Score, timeLeft) {
    this.scoreGfx.clear();

    // Fondo del scoreboard
    this.scoreGfx.fillStyle(0x000000, 0.6);
    this.scoreGfx.fillRoundedRect(180, 10, 440, 50, 8);

    // Texto P1 (izquierda)
    this.p1Text.setText(`P1: ${p1Score}`);
    this.p1Text.setColor('#00e5ff');

    // Tiempo (centro) — últimos 10 segundos parpadea en rojo
    const color = timeLeft <= 10 ? '#ff2222' : '#ffeb00';
    this.timeText.setText(`${Math.ceil(timeLeft)}s`);
    this.timeText.setColor(color);

    // Texto P2 (derecha)
    this.p2Text.setText(`P2: ${p2Score}`);
    this.p2Text.setColor('#ff3d71');
  }
}
```

---

## 🛠️ IMPLEMENTACIÓN DE BOOTSCENE (CRÍTICO)

BootScene debe precargar TODOS los assets antes de que el juego empiece:

```javascript
class BootScene extends Phaser.Scene {
  preload() {
    // Mostrar barra de carga
    const prog = this.add.rectangle(100, 300, 0, 20, 0x00ffcc).setOrigin(0, 0.5);
    this.add.rectangle(400, 300, 610, 24, 0x333333).setOrigin(0.5);
    this.add.text(400, 260, 'CARGANDO SPORT FUSION ARENA...', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => prog.width = v * 600);

    // Registrar fallback para errores de carga
    this.load.on('loaderror', (file) => {
      if (file.key.startsWith('bg_')) {
        const g = this.make.graphics({ x:0, y:0, add:false });
        const bgColors = {
          bg_football: 0x0d3b0d,
          bg_sumo:     0x5c3a1e,
          bg_pingpong: 0x0d1f3c,
          bg_golf:     0x1a4a1a,
          bg_f1:       0x111111
        };
        g.fillStyle(bgColors[file.key] || 0x111111);
        g.fillRect(0, 0, 800, 600);
        g.generateTexture(file.key, 800, 600);
        g.destroy();
      }
    });

    // Imágenes de fondo desde picsum.photos (CORS abierto)
    this.load.setCORS('anonymous');
    this.load.image('bg_football', 'https://picsum.photos/id/1059/800/600'); // estadio verde
    this.load.image('bg_sumo',     'https://picsum.photos/id/1060/800/600'); // interior madera
    this.load.image('bg_pingpong', 'https://picsum.photos/id/96/800/600');   // interior azul
    this.load.image('bg_golf',     'https://picsum.photos/id/167/800/600');  // hierba verde
    this.load.image('bg_f1',       'https://picsum.photos/id/1028/800/600'); // asfalto oscuro

    // Crear texturas generativas para jugadores y objetos
    this.load.on('complete', () => this.createProceduralTextures());
  }

  createProceduralTextures() {
    // BALÓN DE FÚTBOL
    const bfg = this.make.graphics({ add: false });
    bfg.fillStyle(0xffffff); bfg.fillCircle(12,12,12);
    bfg.fillStyle(0x111111);
    const pts = [[12,2],[20,8],[18,18],[6,18],[4,8]];
    pts.forEach(([x,y]) => bfg.fillCircle(x,y,3));
    bfg.generateTexture('ball_football', 24, 24); bfg.destroy();

    // PELOTA PING PONG
    const bpg = this.make.graphics({ add: false });
    bpg.fillStyle(0xff6600); bpg.fillCircle(8,8,8);
    bpg.lineStyle(1,0xffffff,0.5); bpg.strokeCircle(8,8,8);
    bpg.generateTexture('ball_pingpong', 16, 16); bpg.destroy();

    // PELOTA GOLF
    const bgg = this.make.graphics({ add: false });
    bgg.fillStyle(0xffffff); bgg.fillCircle(10,10,10);
    bgg.fillStyle(0xcccccc);
    for (let i=0;i<8;i++){const a=(i/8)*Math.PI*2;bgg.fillCircle(10+Math.cos(a)*6,10+Math.sin(a)*6,2);}
    bgg.generateTexture('ball_golf', 20, 20); bgg.destroy();

    // JUGADOR 1 — cada modo (ver función createPlayerSkin)
    ['football','sumo','pingpong','golf','f1'].forEach(mode => {
      ['p1','p2'].forEach((p, pi) => {
        const g = this.make.graphics({ add: false });
        g.clear();
        // Llamar a createPlayerSkin con los parámetros correctos
        createPlayerSkin(g, mode, pi+1);
        g.generateTexture(`${p}_${mode}`, 48, 56);
        g.destroy();
      });
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
```

---

## 📄 README OBLIGATORIO

### Estructura del README.md:
1. **Qué es SPORT FUSION ARENA** — concepto en 3 párrafos
2. **Respuesta al tema "Reinventing Competition"** — explicar cómo cada modo reinventa el deporte original
3. **Cómo jugar** — controles de cada modo en tabla
4. **Los 5 modos** — descripción corta + reinvención específica de cada uno
5. **Arquitectura** — lista de clases y escenas
6. **Deploy en GitHub Pages** — 3 pasos
7. **Créditos de imágenes** — picsum.photos / Unsplash (sin atribución requerida)
8. **Roadmap futuro** — IA para jugador solo, sonido, más modos, móvil

---

## ✅ CHECKLIST DE CALIDAD ANTES DE ENTREGAR

### Funcionalidad mínima
- [ ] `index.html` abre sin errores en Chrome/Firefox sin servidor local
- [ ] Las imágenes de fondo cargan (o el fallback de color funciona sin crashear)
- [ ] Los 5 modos se suceden en orden con pantalla de 7 segundos
- [ ] Ambos jugadores se controlan correctamente en CADA modo
- [ ] El scoreboard es visible durante todo el tiempo
- [ ] La pantalla final muestra el ganador con desglose por modo

### Por modo
- [ ] **Fútbol**: Los arcos se mueven, el gol solo cuenta cuando el balón entra por el frente
- [ ] **Sumo**: La zona de color se mueve, el empujón aplica knockback real
- [ ] **Ping Pong**: Jugadores solo se mueven vertical, la pelota acelera con cada golpe
- [ ] **Golf**: La barra de potencia se llena al mantener presionado y vacía al soltar
- [ ] **F1**: Los carros giran con controles direccionales, salirse penaliza la velocidad

### Visual
- [ ] Cada modo tiene su imagen de fondo (o fallback de color correcto)
- [ ] Cada modo tiene skins diferentes para los jugadores
- [ ] Screen shake en colisiones impactantes
- [ ] Texto flotante de puntos (+1, +2, GOL, VUELTA, etc.)
- [ ] Fuente monoespaciada aplicada en UI

### No hacer
- [ ] No poner toda la lógica en el scope global o en `update()` directamente
- [ ] No duplicar físicas entre modos — usar el sistema de GameMode base
- [ ] No fallar silenciosamente si una imagen no carga (siempre usar fallback)
- [ ] No usar `alert()` para nada — todo feedback es visual in-game

---

## 💡 NOTAS FINALES PARA EL AGENTE

**Por qué este juego puede ganar los 3 premios del Game Jam de EA:**

- **Premio Innovación**: Cada uno de los 5 deportes tiene UNA regla que no existiría en el mundo real (arcos que se mueven, zona de sumo dinámica, pelota de ping pong que se acelera, golf competitivo simultáneo, F1 con penalización por salirse). No es variación cosmética — es diseño mecánico.

- **Premio Mejor Experiencia**: 5 deportes × 60 segundos = exactamente 5 minutos de gameplay variado y fresco. Nunca hay tiempo para aburrirse. El loop es predecible (siempre sabes qué viene en la pantalla de intro) pero el contenido es sorpresivo.

- **Premio Interpretación del Tema**: El tema "Reinventing Competition" está en CADA modo, no solo en el concepto. Los arcos móviles del fútbol reinventan dónde está la portería. La zona sumo reinventa qué es el territorio. El golf simultáneo reinventa quién compite contra quién.

**Prioriza en este orden:**
1. Que los 5 modos funcionen (aunque simplificados)
2. Que la transición entre modos sea suave
3. Que el scoreboard sea siempre legible
4. Añadir polish visual (efectos, skins, backgrounds)
5. Refinar físicas de cada modo

**Un juego con 5 modos que funcionan bien siempre gana sobre un juego con 2 modos perfectos.**
