# Salta Números — Diario de progreso

Minijuego de plataformas educativo para Joel (8 años). PWA jugable en Chrome
de tablet Android, instalable en pantalla de inicio, funciona offline.
También hay un **`Salta Numeros.exe`** en la raíz para jugar en PC y compartir.

## Cómo retomar el proyecto

```
cd "C:\Users\Usuario\Desktop\minijuego Joel"
npm run dev        # abre http://localhost:5173
npm run build      # comprueba tipos + genera dist/ con la PWA
node tools\check-levels.mjs                                   # valida los mapas
powershell -ExecutionPolicy Bypass -File tools\build-exe.ps1  # regenera el exe
```

En PC se juega con flechas (o A/D) y espacio. En tablet, botones táctiles.
El exe lleva el juego dentro (dist comprimido): para actualizarlo hay que
hacer `npm run build` y después `build-exe.ps1`.

## Arquitectura (decidida 2026-06-11)

- **Vite + TypeScript vanilla**, sin motor de juegos: micro-motor propio
  (gravedad, salto, colisiones AABB contra rejilla de tiles) en `src/engine/`.
- **Canvas** para el mundo; **DOM/CSS** para menús, HUD, controles táctiles
  y puertas matemáticas. Entidades del mundo en `src/game/entities.ts`.
- **Niveles como datos**: mapa ASCII + metadatos en `src/levels/nivelXX.ts`.
  Leyenda: `#` sólido, `D` puerta, `M` meta, `P` aparición, `^` pinchos,
  `o` moneda, `E` enemigo, `m`/`w` plataforma móvil (h/v), `F` caediza,
  `C` punto de control. Validador en `tools/check-levels.mjs`.
- **Preguntas generadas** en `src/math/questions.ts` (distractores acotados
  al rango del nivel): suma/resta/mixta (niv. 1–3), resta/descomposición
  (4–6), multiplicación (7), división (8), lógica (9), reto mixto (10).
- **Progreso en localStorage** (`salta-numeros-v1`): estrellas, mejor tiempo,
  monedas y completado. Nivel n se desbloquea al completar n−1.
- **Estrellas**: 1 por completar, +1 sin fallos en puertas, +1 si tiempo
  ≤ `parMs`. El cronómetro se PAUSA durante las puertas.
- **PWA**: vite-plugin-pwa, precacheo total, fullscreen + landscape.
- **Lanzador exe**: `tools/launcher/` (C# .NET 8, single-file recortado,
  ~10 MB). Embebe `dist` como zip, lo sirve en `http://localhost:38754+`
  y abre el navegador. Flag `--sin-navegador` para pruebas.

## Personajes e intro (2026-06-11, tarde)

- `src/engine/character.ts`: personajes rediseñados al estilo Numberblocks
  (versión original propia) con un rasgo por número: 1 un ojo, 2 normal,
  3 bolitas, 4 ojos cuadrados, 5 pestañas, 6 añil con puntos de dado,
  7 bloques arcoíris con mechón, 8 cejas, 9 gris con ojazos, 10 blanco con
  gafas rojas. Juntas entre bloques, bracitos y piernas. `dibujarPersonaje`
  acepta `bsFijo` para dibujarlos a cualquier tamaño (lo usa la intro).
- `src/ui/intro.ts`: cinemática de inicio (~13,5 s, se salta tocando):
  "Juego creado por David Vaquero" → "Para Joel Vaquero ❤" → cubo de Rubik
  girando (falsa perspectiva con pegatinas 3×3) → estalla en cubitos que
  vuelan y se convierten en los 10 personajes en fila → título.
- Colores de nivel actualizados: 6 añil `#3f37c9`, 9 gris `#8d99ae`.

## Gafas rediseñadas y tutoriales de ítems (2026-06-11, noche⁵)

- Ítem gafas redibujado (parecía dos monedas): cristales rectangulares
  amarillos translúcidos con montura, puente y patillas, balanceándose.
- **Tutorial de primera vez**: al recoger cada tipo de ítem por primera
  vez, el juego se pausa y sale una tarjeta (emoji + título + texto corto
  + "¡Entendido!"). Visto queda guardado en localStorage
  `salta-numeros-tutoriales` (settings.ts); las siguientes veces solo toast.

## Ajustes y desbloqueo con contraseña (2026-06-11, noche⁴)

- Menú: botón **⚙️ Ajustes** (diálogo en #dialogo): sonido ON/OFF (silencia
  WebAudio vía `setSonidoActivado`), **botones gigantes** (clase
  `controles-grandes` en body) y **borrar progreso** (doble toque de
  confirmación). Guardado en localStorage `salta-numeros-ajustes`
  (`src/storage/settings.ts`), se aplica al arrancar (`aplicarAjustes`).
- Botón **🔓 Desbloquear todo** con contraseña **1566**: abre todos los
  niveles de forma persistente; el botón pasa a "🔒 Volver a bloquear"
  (sin contraseña). Sustituye al truco de los 7 toques en el título.

## Personajes 11-25 e inventario de poderes (2026-06-11, noche³)

- **Personajes 11-25 con identidad propia** (referencia: captura oficial que
  pasó Vaquero): los 11-20 blancos con borde rojo y su acento (rojo 11,
  naranja 12, amarillo 13, verde+gafas 14, **escalera con cian el 15**,
  cuadrado ojos cuadrados 16, pintor con manchas 17, columna rosa 18,
  columna gris 19, chistera+gafas moradas 20); los 21-25 crema con borde
  naranja (gorro verde 21, … gafas azules 25). Tabla `ESTILOS` en
  `character.ts` (base, borde, acentos por bloque, decos). El personaje del
  nivel n ES el número n (gen-levels pone `numero: n`); el color del botón
  del menú sigue ciclando la paleta 1-10.
- **Inventario de poderes** (feedback Vaquero): recoger un ítem ya NO lo
  activa; se guarda (`player.inventario`) y aparece su icono en la
  IZQUIERDA (#poderes); tocar el icono lo activa (muestra ×cantidad, y en
  activo los segundos restantes con pulso). Se pierde todo al morir o
  cambiar de nivel; los ítems del mapa reaparecen al morir.

## Expansión: 25 niveles y poderes (2026-06-11, noche²)

- **Niveles 11-25** generados con `tools/gen-levels.mjs` (colocación por
  coordenadas, sin contar puntos a mano; los .ts siguen siendo editables).
  Mates difíciles: tablas/divisiones hasta el 9, `logica2` (series ×2,
  descendentes, saltos grandes), `operacion` ((a+b)×c, a×b−c) y `reto2`.
- **Un poder nuevo cada 5 niveles** (los ítems reaparecen al morir y los
  poderes se pierden al morir o cambiar de nivel):
  - Nivel 10 → 🕶️ **gafas** (8 s invisible). Nuevo enemigo **vigilante** ('V'):
    haz de visión dibujado; si te ve carga contra ti; invisible no te ve;
    se mata con pisotón.
  - Nivel 15 → 🌈 **arcoíris** ('R'): volar 10 s manteniendo el salto
    (barrancos de hasta 14 tiles, validador avisado).
  - Nivel 20 → 🎩 **sombrero** ('H'): 1 teletransporte tocando la pantalla
    (muros de columna completa que solo se cruzan así; nivel 21 tiene una
    cámara del tesoro sellada con un 2º sombrero dentro para salir).
  - Nivel 25 → 🟢 **tubos** ('T', emparejados por orden) y **buceo**: agua
    ('~', braceo con el botón de salto), peces con pinchos ('f'), mapa de
    20 filas con cámara vertical (el renderer ya no escala por nivel).
- **Jefe final (ahora nivel 26)**: lanza bolas de fuego en arco hacia el
  jugador (más rápido con menos corazones); si estás invisible no te ve y
  deja de disparar. En la arena hay G, R y H para usar los poderes.
- **Menú**: rejilla 5×5. Truco para papás: **7 toques en el título**
  desbloquean todos los niveles durante la sesión (sin tocar el progreso).
- HUD nuevo: indicador de poderes (#hud-power) con segundos restantes.

## Nivel final: el Comecubos y Xiana (2026-06-11, noche)

- `src/levels/nivel11.ts` (NIVEL_FINAL=11): se desbloquea al completar el
  nivel 10 (botón dorado bajo la rejilla del menú). Se juega con el 10.
- `src/game/boss.ts`: **el Comecubos**, jefe con 3 corazones que patrulla
  la arena (acotado para no acercarse a la jaula). Pisotón → reto
  matemático: acierto = pierde un corazón y acelera; fallo/cerrar = nada.
  Tocarlo de lado = respawn. Tercer acierto → cae y la jaula se abre.
- **Xiana** (hermana de Joel, rubia con coletas y vestido rosa) espera
  enjaulada al final; al liberarla celebra con corazones y tocarla termina
  el nivel con el título "❤️ ¡Has salvado a Xiana!".
- Mapa: chars nuevos `B` (jefe) y `X` (Xiana = meta sin bandera; goal.w=0).
  Validador actualizado (meta = M o X; B y X deben pisar suelo).
- Nota: renderer.ts tenía mojibake por una edición con PowerShell sin
  codificación correcta (p. ej. el ✓ del checkpoint); reescrito limpio.

## Mecánicas del personaje y del mundo (fase 2)

- Coyote time (en tiempo de juego, no de reloj) + jump buffer + salto variable.
- **Doble salto SIEMPRE activo** (feedback de Vaquero 2026-06-11: en los
  niveles 2-6 había monedas inalcanzables sin él). Consecuencia: la zona de
  detección de las puertas ocupa toda la columna (de suelo a cielo), para
  que no se puedan cruzar por encima sin responder. El salto extra en el
  aire siempre cuenta como el último disponible (no hay triple salto).
- **Monedas** con contador en HUD y en resultados (se guarda el máximo).
- **Enemigos** que patrullan (giran en paredes y bordes): pisotón desde
  arriba los aplasta con rebote; tocarlos de lado = volver al respawn.
- **Plataformas móviles** (senoidales, h/v) que arrastran al jugador,
  **caedizas** (tiemblan 0,45 s y caen; se recolocan al morir) y
  **puntos de control** que mueven el respawn.
- Avisos tipo toast al entrar en nivel con mecánica nueva.

## Estado

- [x] **Fase 0** — Scaffold, PWA, iconos, git (2026-06-11)
- [x] **Fase 1** — Nivel 1 jugable de extremo a extremo (2026-06-11)
- [x] **Fase 2** — (2026-06-11) Niveles 2–10 con dificultad y longitud
      crecientes (60→150 columnas, 1→4 puertas), todas las mecánicas
      nuevas, y `Salta Numeros.exe`. Verificado con pasos simulados:
      física, puertas, meta, guardado, pisotón/golpe, monedas, checkpoints,
      móviles, caedizas, doble salto (solo niv. 7+), desbloqueo del menú
      y 200 preguntas generadas sin fallos.
- [ ] **Fase 3** — Pulido (animaciones, pantalla de victoria final al acabar
      el 10) y despliegue HTTPS para la tablet (GitHub Pages o Netlify).

## Notas técnicas

- El preview de Claude lanza el dev server vía
  `C:\Users\Usuario\.claude\run-salta-numeros.cmd` (rutas con espacios).
- Si la pestaña del preview está oculta, `requestAnimationFrame` se congela:
  para probar existe `window.__debug.step(frames)` (solo en dev), que avanza
  el bucle a mano. `__debug` también da `teleport`, `empezarNivel`, etc.
- El test de "salto en el aire" debe hacerse lejos del suelo: cerca de él
  el jump buffer (ventana de 120 ms de reloj real) aterriza y salta legítimo.
