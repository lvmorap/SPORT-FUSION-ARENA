# ⚡ SPORT FUSION ARENA 3D

**4 deportes reinventados en 3 dimensiones — Juego local para 2 jugadores**

Cuatro deportes clásicos mezclados con mecánicas absurdas y caóticas. Porterías que vuelan, terremotos en el ring, carreras estilo TRON con estelas de luz mortales y ping pong a velocidad infernal. Todo en 3D, todo en el mismo teclado, todo al mismo tiempo ridículo y competitivo.

---

## 🏆 ESTRUCTURA DEL TORNEO

El juego es un **torneo de 4 rondas**. Cada ronda es un deporte diferente:

1. Los 4 modos se barajan aleatoriamente al iniciar la partida — nunca sabes cuál viene primero.
2. Antes de cada ronda se muestra una **intro de 4 segundos** con el icono, nombre y descripción del modo.
3. Cuenta regresiva **3 → 2 → 1 → ¡GO!** antes de cada ronda.
4. Cada ronda dura **60 segundos** (excepto Fórmula 3D que dura **120 segundos** o hasta que alguien complete 3 vueltas).
5. Al terminar cada ronda se muestra el resultado y se avanza a la siguiente.
6. Al finalizar las 4 rondas se corona al **campeón** según quién ganó más rondas, con detalle de cada resultado.

---

## 🎮 CONTROLES

| Acción | Jugador 1 (🔵 Cyan) | Jugador 2 (🔴 Rojo) |
|--------|---------------------|---------------------|
| Mover arriba | W | ↑ |
| Mover abajo | S | ↓ |
| Mover izquierda | A | ← |
| Mover derecha | D | → |
| Acción 1 (patada/dash/turbo) | F | Shift Derecho |
| Acción 2 (salto) | G | Enter |

> Los controles cambian de función según el modo — se detalla en cada sección.

---

## ⚽ MODO 1: FÚTBOL 3D

*"Las porterías se mueven verticalmente. ¡Marca goles en arcos que no paran!"*

### La cancha
- Campo rectangular con muros perimetrales que rebotan la pelota.
- Vista aérea en ángulo, tipo estadio.
- 4 focos en las esquinas iluminan la cancha. Gradas decorativas rodean el campo.
- Líneas de campo clásicas: centro, círculo central y áreas de gol.

### Las porterías (¡se mueven!)
- Hay una portería en cada extremo del campo, con postes, travesaño, barra inferior y red.
- El travesaño de cada portería brilla con el color del equipo que defiende.
- **Ambas porterías se mueven juntas** — cada 2.5 segundos eligen una nueva posición aleatoria, desplazándose tanto lateralmente como en altura.
- El movimiento es suave (no brusco), así que hay que leer hacia dónde van y anticipar.
- Solo cuenta gol si la pelota entra dentro del marco (entre postes, travesaño y barra inferior) y va en la dirección correcta.

### Los jugadores
- Personajes humanoides con camiseta del color del equipo, pantalones, piernas, zapatos y un anillo brillante del color del equipo.
- Movimiento libre en 4 direcciones con aceleración y frenado progresivo — no se detienen de golpe.
- Los jugadores giran suavemente hacia la dirección en que se mueven.
- Al caminar, los personajes balancean levemente arriba y abajo (walk bob).

### Patada (Acción 1)
- Pulsar para patear la pelota si está cerca (alcance generoso).
- La patada detiene la pelota un instante y la lanza con fuerza en la dirección jugador → pelota.
- Siempre hay un componente vertical mínimo — la pelota se eleva al menos un poco con cada patada.
- Si la pelota está por encima del jugador, la patada sube más; si está al nivel del suelo, sube menos pero siempre algo.
- Se ve la animación de la pierna derecha pateando.

### Salto (Acción 2)
- Salto potente para interceptar balones aéreos o intentar cabecear.
- Solo se puede saltar estando en el suelo.
- La caída es rápida — gravedad triple para que el juego sea ágil y no "flotante".

### La pelota
- Pelota clásica con textura de pentágonos blancos y negros.
- Rebota contra muros (con alta restitución) y contra el suelo (con rebote moderado).
- Rota visualmente al moverse, dando sensación realista.

### Gol
- Cuando se marca gol, la pantalla destella con el color del equipo anotador.
- La pelota se resetea al centro tras un breve instante.
- Gana quien tenga más goles al terminar el tiempo.

---

## 🥊 MODO 2: SUMO ARENA

*"Empuja a tu rival al borde de la zona. ¡La arena se mueve y cambia de tamaño! ¡Cuidado con los terremotos!"*

### La arena
- Plataforma circular de madera vista desde arriba (cenital).
- Rodeada por una zona de peligro roja brillante con 16 postes luminosos en el borde que pulsan.
- Arena decorativa exterior alrededor de la plataforma.
- Partículas doradas flotan y ascienden creando ambiente.

### Los luchadores
- Luchadores de sumo con barriga, pecho, cabeza con moño (chonmage), cinturón mawashi del color del equipo, brazos en pose de empuje, piernas gruesas y un anillo brillante.
- Movimiento directo y responsivo en 4 direcciones.
- Giran hacia donde se mueven.

### ¡La arena se encoge!
- La plataforma **se reduce linealmente durante los 60 segundos** — empieza grande y termina reducida a menos de la mitad.
- Todos los elementos visuales (plataforma, anillos, zona de peligro, postes) se actualizan en tiempo real.
- **Desplazamiento asimétrico**: si un jugador va perdiendo, el centro de la arena se desplaza sutilmente hacia él, dándole una ligera ventaja posicional. Cuanto más encogida la arena, más pronunciado el efecto.

### Zona de puntuación (verde)
- Hay una **zona circular verde** dentro de la arena que otorga puntos continuamente (2 puntos por segundo) a quien esté dentro.
- La zona **se mueve erráticamente** — cambia de dirección cada 2.5 segundos y rebota al tocar los bordes de la arena.
- La zona **cambia de tamaño** cada 4 segundos — a veces es muy pequeña (difícil de ocupar) y a veces grande (más fácil pero ambos caben).
- Brilla con un pulso suave para indicar dónde está.

### Dash / Embestida (Acción 1)
- Embestida potente en la dirección que mira el luchador.
- **Cooldown de 1.5 segundos** entre usos.
- Si el rival está cerca y en la trayectoria de la embestida, recibe un **empujón brutal** que puede sacarlo del ring o al menos de la zona de puntuación.

### Salto (Acción 2)
- Salto para esquivar embestidas o reposicionarse.
- **Cooldown de 2 segundos**.
- Al aterrizar se recupera el control inmediatamente.

### Empuje por contacto
- Cuando los luchadores chocan, se empujan mutuamente según la velocidad relativa del impacto.
- Ir rápido contra un rival estático lo manda volando; chocar a baja velocidad apenas los separa.

### 🌋 TERREMOTOS
- Cada **6 segundos** se produce un terremoto que sacude a ambos jugadores.
- Cada jugador recibe un **impulso en dirección aleatoria** — pueden salir disparados hacia el borde, hacia la zona de puntuación, o hacia el rival.
- Los terremotos no discriminan: afectan a ambos por igual pero en direcciones distintas.
- Son especialmente peligrosos cuando la arena ya se ha encogido — un terremoto puede empujarte directamente al borde cuando hay poco espacio.
- **Estrategia**: anticipar los terremotos manteniendo una posición central es clave, especialmente en la fase final cuando la arena es pequeña.

### Puntuación por borde
- Si un jugador es empujado hasta tocar el borde exterior de la arena, el **oponente gana 1 punto**.
- Solo se cuenta una vez por "visita" al borde — hay que salir y volver a entrar para que cuente de nuevo.

### Límites de la arena
- Los jugadores **no pueden salir** de la plataforma — son retenidos en el borde y su velocidad hacia afuera se cancela.

### Victoria
- Gana quien tenga más puntos al terminar los 60 segundos.
- Los puntos vienen de: estar en la zona verde (+2/s), empujar al rival al borde (+1 por vez).

---

## 🏓 MODO 3: PING PONG 3D

*"La pelota acelera con cada golpe. ¡Los reflejos lo son todo!"*

### El escenario
- Sala de ping pong con paredes, techo, paneles de luz, bancos de madera y un marcador en la pared trasera.
- Mesa verde clásica con líneas blancas, red central con postes y 4 patas.
- Vista en ángulo desde un extremo de la mesa.

### Las palas
- Cada jugador controla una pala en su lado de la mesa.
- Solo se mueven **arriba y abajo** (en el eje de profundidad de la mesa).
- La pala del J1 es cyan, la del J2 es roja — ambas con brillo sutil.

### Movimiento
- **J1**: W (arriba) / S (abajo)
- **J2**: ↑ (arriba) / ↓ (abajo)
- Las acciones 1 y 2 no tienen función en este modo — es puro reflejo y posicionamiento.

### La pelota
- Pelota naranja brillante con rastro visual (estela de 8 esferas que van desapareciendo).
- Rebota en los bordes superior e inferior de la mesa.

### ¡Cada golpe la acelera!
- La pelota empieza a velocidad moderada.
- **Con cada golpe de pala, la velocidad se multiplica ×1.1** — el rally se vuelve exponencialmente más frenético.
- Velocidad máxima: más de 3 veces la velocidad inicial. Los rallies largos se convierten en un caos visual.

### Deflexión angular
- La posición donde la pelota golpea la pala afecta su dirección de rebote.
- Golpear con el borde de la pala desvía más la pelota; golpear con el centro la devuelve más recta.
- Esto permite controlar la dirección y buscar ángulos difíciles para el rival.

### Puntuación
- Si la pelota pasa de largo por tu lado de la mesa, el oponente anota un punto.
- Tras cada punto, la pelota se resetea al centro y sale hacia el jugador que anotó, con un ángulo ligeramente aleatorio.
- La velocidad vuelve a la inicial tras cada punto — cada rally parte de cero.

### Victoria
- Gana quien tenga más puntos al terminar los 60 segundos.

---

## 🏎️ MODO 4: FÓRMULA 3D — Carrera estilo TRON

*"¡Estilo TRON! Deja estela de luz que noquea rivales 1s. Turbo con cooldown. 3 vueltas para ganar."*

### El circuito
- Circuito cerrado con 21 curvas que serpentea por un campo de césped, visto desde arriba (cenital).
- Asfalto gris oscuro con bordes de piano rojo/blanco (kerbs), línea central discontinua y línea de meta con patrón de cuadrícula.
- 8 checkpoints distribuidos por la pista, marcados con cilindros amarillos a cada lado.
- Los coches parten alineados en la línea de meta.

### Los coches
- Monoplazas tipo F1 con carrocería del color del equipo, cabina negra, 4 ruedas, alerón delantero y trasero.
- **Aceleración progresiva** — hay que mantener la tecla arriba para ganar velocidad.
- **Frenado fuerte** con la tecla abajo.
- **Dirección proporcional a la velocidad** — a mayor velocidad, más se nota el giro; parado casi no giran.
- Se puede ir marcha atrás (a velocidad reducida).

### Objetivo: 3 vueltas
- El primero en completar **3 vueltas** gana inmediatamente (no hace falta esperar al tiempo).
- Las vueltas solo cuentan si se pasan **todos los checkpoints intermedios** en orden — no se puede atajar.
- Si nadie completa 3 vueltas en 120 segundos, gana quien tenga más vueltas (o empate).
- El HUD muestra "Vuelta X/3" para cada jugador.

### Salirse de la pista
- Si el coche se sale del asfalto, recibe una **penalización de 2 segundos** donde su velocidad máxima baja al 30%.
- Aparece el texto "PENALTY" sobre el coche penalizado.
- Mientras dura la penalización no se puede recibir otra — pero al terminar, si sigues fuera, se activa de nuevo.

### 💡 ESTELA DE LUZ (TRON TRAIL)
- Cada coche deja una **estela de cubos brillantes** de su color detrás mientras avanza.
- Los segmentos de estela aparecen cada cierta distancia recorrida y **desaparecen tras 1 segundo**.
- **Si tocas la estela del OPONENTE**, tu coche queda **STUNNED (noqueado) durante 1 segundo** — velocidad a cero, sin control, completamente indefenso.
- Aparece "💥 STUNNED" sobre el coche noqueado.
- Tu propia estela no te afecta — solo la del rival.
- **Estrategia**: dejar estela en curvas cerradas o zonas estrechas para bloquear al rival. Anticipar por dónde pasará el oponente y cortar su camino.

### 🚀 TURBO MANUAL (Acción 1)
- Cada jugador tiene un **turbo activable** que duplica la velocidad máxima durante 1.5 segundos.
- **Cooldown de 5 segundos** entre usos.
- En el HUD aparece "🚀 LISTO" cuando está disponible o "🔄 Xs" con el tiempo restante de cooldown.
- Aparece "⚡ TURBO" sobre el coche cuando está activo.

### ⚡ POWER-UPS
Aparecen en la pista cada 4-8 segundos (máximo 3 a la vez). Flotan, rotan y tienen un anillo brillante. Se recogen al pasar cerca. Hay 3 tipos:

#### 🪞 Espejo (Púrpura — forma de octaedro)
- **Invierte los controles de dirección del oponente durante 5 segundos**.
- Izquierda se convierte en derecha y viceversa — caótico y desorientador.
- Aparece "🪞 MIRROR" sobre el coche afectado.

#### 🟡 Turbo (Amarillo — forma de cono)
- Aumenta tu velocidad máxima a ×1.8 durante 3 segundos.
- Se acumula con el turbo manual si ambos están activos.
- Aparece "🚀 TURBO" sobre el coche potenciado.

#### 🔴 Obstáculo (Rojo — forma de cubo)
- Coloca un **cono rojo con franja amarilla** en la pista.
- El obstáculo permanece **15 segundos** y pulsa para ser visible.
- El coche que lo toque queda **ralentizado al 20% de velocidad durante 1.5 segundos**.
- Aparece "🛑 SLOW" sobre el coche afectado.

### Efectos simultáneos
- Un coche puede tener **múltiples efectos activos** al mismo tiempo (stunned + mirror + penalty, etc.).
- Todos los multiplicadores de velocidad se aplican juntos — estar penalizado y ralentizado a la vez es devastador.
- El HUD muestra todos los efectos activos con sus temporizadores restantes.

### Indicadores visuales
- Sobre cada coche aparecen etiquetas flotantes mostrando el efecto activo: "💥 STUNNED", "PENALTY", "🚀 TURBO", "🪞 MIRROR", "⚡ TURBO", "🛑 SLOW".
- El HUD inferior muestra los power-ups activos y cooldowns de cada jugador.

---

## 🎯 RESUMEN DE MODOS

| Modo | Duración | Cómo se gana | Mecánica especial |
|------|----------|--------------|-------------------|
| ⚽ Fútbol 3D | 60s | Más goles | Porterías que se mueven en vertical y lateral |
| 🥊 Sumo Arena | 60s | Más puntos (zona + borde) | Arena que se encoge + terremotos cada 6s |
| 🏓 Ping Pong 3D | 60s | Más puntos | Pelota que acelera ×1.1 con cada golpe |
| 🏎️ Fórmula 3D | 120s o 3 vueltas | Primero en 3 vueltas | Estela TRON + power-ups + turbo manual |

---

## 💡 CONSEJOS GENERALES

- **Fútbol**: No persigas la pelota — anticipa a dónde van las porterías y colócate para rematar.
- **Sumo**: Quédate cerca del centro, especialmente cuando la arena es pequeña. Los terremotos pueden sacarte de la zona si estás en el borde.
- **Ping Pong**: Usa los bordes de la pala para crear ángulos difíciles. Los rallies largos son a muerte — un fallo a máxima velocidad es inevitable.
- **Fórmula**: Deja estela en las curvas cerradas para bloquear al rival. Guarda el turbo para las rectas largas o para escapar tras recoger un power-up.
