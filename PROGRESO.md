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
- [ ] **Fase 3** — Despliegue HTTPS para la tablet (GitHub Pages o Netlify).

## 🌐 Publicado en GitHub Pages (2026-06-12)

- Repo público: https://github.com/DavidVaqueroDiaz/salta-numeros
- **URL del juego: https://davidvaquerodiaz.github.io/salta-numeros/**
- Despliegue automático: cada `git push` a master reconstruye y publica
  (workflow `.github/workflows/deploy.yml`). La tablet se actualiza sola.
- Instalación en tablet: abrir la URL en Chrome → ⋮ → "Añadir a pantalla
  de inicio". Tras la primera carga funciona offline.
- El progreso de la tablet vive en su navegador (separado del pen/PC).
- También está la carpeta portable **Desktop\Juego Joel** (exe + LEEME.txt)
  para jugar en cualquier PC desde pen; para actualizarla basta
  sobrescribir el exe (el progreso está en progreso-salta-numeros.json).

## Ajustes de juego (2026-06-12, tarde)

- **Gafas al principio de cada fase** (feedback Vaquero): todos los ítems
  'G' están ahora en las columnas 14-19, lejos del vigilante; el niño las
  guarda y decide cuándo activarlas al VER al monstruo. (Con el
  inventario, el momento de recogida ya no importa.)
- **Hielo mucho más resbaladizo**: fricción asimétrica en player.ts —
  empujar agarra 2.0, soltar 0.8 → derrapada de ~5,6 tiles (antes ~1).
  Además, en el aire sin pulsar nada se conserva el impulso brevemente
  (decae 4/s) para que salir despedido del hielo no corte el salto.

## ✅ Gran expansión COMPLETADA (2026-06-12)

Todo lo planificado abajo quedó hecho y verificado:
- **Tienda de personajes** (botón 🛍️ en el menú, con la hucha 🪙 visible):
  se juega con el personaje EQUIPADO (por defecto el 1); los 2-25 se
  compran a nº×5 monedas. La hucha suma las monedas de cada nivel
  completado. `src/storage/shop.ts` + tienda en `screens.ts` (mini-canvas
  por personaje). Comprar también equipa.
- **Niveles 26-35 + jefe en el 36** (TOTAL_NIVELES=35, rejilla 7×5):
  26-28 hielo resbaladizo ('I', inercia en player.vx), 29-31 gravedad
  lunar (`gravedadBaja`, salto ~244px vs 134), 32-35 castillo con lava
  mortal ('L') y plataformas parpadeantes ('b', ciclo 2,8 s con aviso).
- **Temas visuales** (`tema` en LevelData, TEMAS en renderer): pradera 1-5,
  bosque 6-10, cueva 11-15, volcán 16-20, nieve 21-28, espacio 29-31,
  castillo 32-36. Cielos, astros, siluetas, copos/ascuas/estrellas y
  paleta de suelo propios por mundo.
- **Xiana rediseñada** estilo dibujo animado (ojazos con iris azul y
  brillo, flequillo de tres puntas, coletas con goma rosa, mofletes,
  vestido con vuelo, zapatitos; boca abierta de alegría al liberarla).
- **Atajos de teclado**: 1=gafas, 2=arcoíris, 3=sombrero (los iconos
  muestran el número: "1·🕶️×1").
- **Progreso a prueba de balas**: lanzador SIEMPRE en el puerto 38754
  (espera a que se libere; si hay otra copia, abre su navegador y sale);
  endpoints GET/POST `/api/progreso` que guardan
  `progreso-salta-numeros.json` junto al exe (UTF-8 sin BOM); el juego
  fusiona fichero↔navegador al arrancar (lo mejor de cada uno) y vuelca
  al completar nivel, comprar, con el botón **💾 Guardar** del menú y al
  ocultar la ventana (sendBeacon). `src/storage/sync.ts`.
- Mates nuevas en niveles 26+: `mitadDoble` y `reto3` (tablas hasta 12).

## ⏸️ Plan original de la expansión (ya ejecutado, sesión 2026-06-11)

Decisiones tomadas con Vaquero antes de pausar:
- **PC primero**: nada de hosting/tablet por ahora; el exe es la plataforma.
- **Tienda de personajes**: se juega SIEMPRE con el Numberblock 1; los
  personajes 2-25 se compran con monedas (precio orientativo: nº × 5).
  Las monedas de cada nivel completado se suman a una hucha persistente.
- **10 niveles nuevos (26-35) con mecánicas nuevas**, jefe pasa al 36:
  26-28 hielo resbaladizo ('I'), 29-31 gravedad lunar (`gravedadBaja`),
  32-35 castillo con lava mortal ('L') y plataformas parpadeantes ('b').
- **Temas visuales por mundos** (campo `tema` en LevelData): 1-5 pradera,
  6-10 bosque, 11-15 cueva, 16-20 volcán, 21-28 nieve, 29-31 espacio,
  32-36 castillo. Cada tema = cielo + suelo + detalles propios.
- **Xiana rediseñada** estilo dibujo animado (ojazos con brillo, flequillo,
  coletas con gomas, mofletes, vestido con vuelo) — la actual no le gusta.

YA HECHO (commiteado, compila):
- `types.ts`: TipoPuerta + `mitadDoble` y `reto3`; tipo `Tema`; campos
  `tema` y `gravedadBaja` en LevelData; leyenda de mapa con I/L/b.
- `questions.ts`: generadores de `mitadDoble` (dobles y mitades) y `reto3`
  (×/÷ hasta 12 + mitadDoble + operacion + logica2).

PENDIENTE (en orden previsto):
1. `entities.ts`: clase PlataformaParpadeante (ciclo ~2,8 s, aviso parpadeo).
2. `level.ts`: tiles HIELO=4 y LAVA=5; parsear 'I', 'L', 'b'; esSolido
   incluye hielo; esLetal (pincho o lava); array parpadeantes en pisables.
3. `player.ts`: física de hielo (vx con inercia cuando pisa hielo),
   gravedad lunar (`level.data.gravedadBaja` → gravedad ×0,45), morir
   con esLetal en vez de solo esPincho.
4. `src/storage/shop.ts`: hucha (cargar/añadir/gastar) + personajes
   (comprados[], equipado; por defecto [1], 1).
5. `screens.ts`: pantalla Tienda (rejilla con mini-canvas de cada personaje
   vía dibujarPersonaje, precio/Elegir/✔ Puesto), hucha visible en menú,
   botón 🛍️ Tienda.
6. `renderer.ts`: TEMAS (fondo y paleta de tiles por tema: estrellas,
   copos, ascuas, estalactitas, siluetas…), dibujo de hielo/lava/
   parpadeantes, parámetro numeroPersonaje en draw() (el equipado, ya no
   level.data.numero), y reescritura bonita de xianaDibujo.
7. `main.ts`: personaje equipado, sumar monedas a la hucha en
   terminarNivel, refrescar tras cerrar tienda.
   7b. **Atajos de teclado para los poderes** (pedido 2026-06-11 noche):
   tecla `1` = gafas, `2` = arcoíris, `3` = sombrero, y siguientes números
   para futuros poderes (mismo orden que los iconos de la izquierda).
   Mostrar el numerito en cada icono para que se aprendan solos.
   7c. **PRIORITARIO — el progreso "se pierde" al salir rápido del exe**
   (reportado por Vaquero). Diagnóstico casi seguro: el lanzador busca
   puerto libre desde 38754 hacia arriba; si se cierra y reabre rápido,
   el puerto viejo sigue ocupado unos segundos → arranca en 38755 →
   localStorage es POR ORIGEN → parece que faltan niveles (en realidad
   están en el otro puerto; al reabrir más tarde "vuelven"). Arreglo:
   a) lanzador SIEMPRE en 38754: reintentar unos segundos y, si sigue
      ocupado, abrir el navegador contra la instancia ya viva y salir;
   b) a prueba de balas: endpoints /api/progreso (GET/POST) en el
      lanzador que guardan un JSON junto al exe, y el juego sincroniza
      localStorage↔fichero al cargar y al guardar resultado;
   c) botón **💾 Guardar progreso** en el menú de niveles (pedido) que
      fuerza el volcado y confirma "guardado" (aunque b) ya lo haga solo).
8. `gen-levels.mjs`: añadir `tema` a 11-25 y generar 26-35 nuevos;
   `nivel06-10` añadir tema a mano; nivelfinal tema castillo y clave 36;
   `index.ts` TOTAL_NIVELES=35, NIVEL_FINAL=36; CSS rejilla 7 columnas.
9. `check-levels.mjs`: suelo válido = '#' o 'I' (L es letal, no asienta
   entidades); hueco máximo mayor si `gravedadBaja`.
10. Verificar con __debug.step, build, exe, PROGRESO, commit.

## Modos de dificultad: Fácil / Medio / Difícil (2026-06-15)

Tres modos elegibles en el menú (selector arriba: 😀 Fácil / 🙂 Medio /
😬 Difícil). Implementados como **modificador global** que se lee al construir
el nivel y al actualizar enemigos/jefe — sin tocar los 36 mapas. **El modo
Fácil queda byte a byte como el juego original** (Joel no pierde nada).

- `src/game/dificultad.ts`: tipo `Dificultad`, tabla `PARAMS` por modo
  (velMul, bichosFactor, vidas, jefeAgil, jefeSaltoCada, jefeTeleCada, mates),
  y get/set persistente en localStorage `salta-numeros-dificultad`.
- **Progreso SEPARADO por modo** (decisión de Vaquero): Fácil sigue en la clave
  de siempre `salta-numeros-v1` (intacta); Medio y Difícil estrenan
  `salta-numeros-medio-v1` y `salta-numeros-dificil-v1`. `progress.ts` es
  ahora mode-aware (`CLAVES_PROGRESO`, `cargarProgreso(modo)`,
  `guardarResultado(...,modo)`). El menú pinta el progreso/desbloqueo del modo
  elegido. `sync.ts` vuelca y fusiona también las dos claves nuevas + el modo.
- **Medio**: más bichos (enemigos extra colocados solos en suelo firme con
  hueco, lejos de salida/meta/puertas/checkpoints — `Level.generarBichosExtra`,
  ~1,2 por cada 10 columnas), mates un poco más altas (números mayores), jefe
  ágil. Sin vidas (infinitas, como Fácil).
- **Difícil**: mismos bichos que Medio pero **más rápidos** (velMul 1,55,
  aplicado en `entities.ts` a Enemigo/Vigilante/Pez y al jefe), **3 vidas por
  nivel** (HUD de corazones `#hud-lives`): morir con vidas reaparece en el
  punto de control; al perder las 3 se reinicia la fase entera desde el
  principio (ignora checkpoints) y se rellenan las vidas (`quitarVida` /
  `morir` en main). Mates: **problemas de varios pasos** (`tipo 'problema'` en
  questions.ts: grupos, reparto, compra, sumas de 3 pasos, bolsas−comidas,
  diferencia — de coger papel) ~60 % de las puertas; el resto, como Medio.
  **Penalización por descarte**: si acierta tras fallar 2 veces (la última
  opción que queda), pierde una vida (puertas normales y reto del jefe).
- **Jefe ágil** (Medio y Difícil, pedido de Vaquero): el Comecubos ahora tiene
  gravedad y **salta** (~100 px) y **se teletransporta** a otro punto de su
  zona con suelo (`Jefe.buscarHueco`). En Fácil no salta ni cae (idéntico).
- Verificado en preview (1280×720): selector visible; Fácil nivel 1 = 0
  enemigos extra y sin HUD de vidas; Difícil nivel 1 = 7 enemigos + 3
  corazones + reinicio al morir 3 veces; problemas multipaso con respuesta
  correcta entre las opciones; jefe salta y teletransporta sin errores.
  `npm run build` (typecheck + build) y `check-levels.mjs` en verde.
- PENDIENTE manual de Vaquero: regenerar el exe (`build-exe.ps1`) y/o
  `git push` para que la tablet (GitHub Pages) reciba los modos nuevos.

## Armas e ítems de ayuda: cubo de Rubik y estrella (2026-06-15)

Dos ítems nuevos **en todos los modos** (también Fácil, para ayudar a Joel),
colocados solos en suelo seguro sin tocar los mapas (`Level.generarItemsEspeciales`
/ `colocarItem`, reutilizan `candidatosSuelo`):

- **🎲 Cubo de Rubik (arma)** en las **fases impares** (y 3 en la arena del
  jefe). Cada ítem da **3 lanzamientos** (`inventario.cubo += 3`). Icono
  izquierdo / tecla **4**: lanza un `CuboVolando` (entities.ts) que **rueda
  hacia delante** (gravedad + avance en `player.mirando`), **mata hasta 2
  bichos** cercanos (enemigos y vigilantes) o **quita una vida al jefe**
  (`jefe.golpear()` directo, sin mates); se apaga al chocar con pared, salir
  del mapa o a los 2,6 s. La gestión de muertes/daño está en el `update` de
  main.ts; se limpian al morir.
- **🌟 Estrella invencible** en las **fases pares** (2, 4, 6, 8…). Icono / tecla
  **5**: `player.estrellaT = 9` s. Mientras dura, **atropella** a enemigos,
  vigilantes (y es inmune a peces) **sin recibir daño**; con el **jefe** eres
  inmune a sus bolas de fuego y a su contacto, **pero la estrella no le hace
  daño** (hay que seguir usando pisotón→mates o cubos). Aura dorada parpadeante
  alrededor del personaje (renderer).
- **Jefe final con 5 vidas en Difícil** (`jefeVidas` en `dificultad.ts`; Fácil y
  Medio siguen con 3), para compensar que ahora se le puede dañar con cubos.
- HUD de poderes ampliado a 5 iconos (1🕶️ 2🌈 3🎩 4🎲 5🌟); tutoriales de
  primera vez para cubo y estrella (screens.ts). Dibujo de cubo de Rubik 3×3 y
  de estrella de 5 puntas en renderer.ts (`dibujarCubo`, `dibujarEstrella`).
- Verificado en preview: cubo impares / estrella pares / arena del jefe con
  cubos; lanzar gasta 1 de 3 y mata al enemigo al rodar; cubo baja al jefe de 5
  a 4 en Difícil; estrella atropella sin morir; jefe = 5 vidas en Difícil.
  `npm run build` y `check-levels.mjs` en verde.

## Personaje 7 rediseñado como la referencia (2026-06-15)

El personaje 7 de la tienda (precio 35) se rediseñó para clavarlo a la imagen
de referencia de Vaquero (Numberblock arcoíris): **7 cubos** = cuerpo **2×3 con
un color exacto por cubo** (abajo rojo `#e92e2a` / naranja `#f7931e`, medio
amarillo `#ffd400` / verde `#5cbf3b`, arriba cian `#33bdec` / morado `#7b3ec4`)
+ una **cabeza morada arriba a un lado** (cubo `[0,3]`) con la cara y la melena.
Detalles: **melena de 5 púas** arcoíris en abanico, **ojos grandes con borde
dorado** `#f2b705` y **brazos/piernas morados** `#6e3aa8`. En `character.ts`:
`FORMAS[7] = [...rect(2,3), [0,3]]`; se quita el coloreado por filas (`ARCOIRIS`)
y se usa el mapa `COLORES_7` (incluye la cabeza `0,3` morada); ojos del 7 más
grandes y juntos (caben en el cubo de la cabeza); brazos, borde de ojos y melena
con casos propios del 7. Verificado por muestreo de píxeles del mini-canvas de
la tienda (los 6 colores del cuerpo coinciden) y captura ampliada.

## MUNDO 2: 35 fases nuevas + el Mago Oscuro (2026-06-15)

Sistema de **mundos** con flecha ▶ en el menú: al pasarte el jefe de un mundo
aparece la flecha para avanzar al siguiente (◀ para volver). Funciona en los
tres modos (el progreso sigue siendo por modo). `index.ts`: `MUNDOS` = [{1-35,
jefe 36}, {37-71, jefe 72}], `esNivelFinal()`, `mundoDe()`; `TOTAL_NIVELES=35`
pasa a ser "fases por mundo". El desbloqueo encadena por número (`progreso[n-1]`),
así 37 se abre al completar el 36. El menú (`screens.ts`) tiene `mundoVista` y
pinta la rejilla/jefe del mundo en vista; la flecha ▶ se activa solo si el jefe
del mundo actual está hecho (o con "desbloquear todo").

- **35 fases nuevas (37-71)** generadas con `tools/gen-levels2.mjs` (mismo
  estilo que gen-levels). Zonas: 37-41 **agua** (buceo, muchos peces),
  42-46 **lava** (parpadeantes/móviles/caedizas), 47-51 **obstáculos**
  (saltar entre plataformas, móviles, caedizas), 52-56 **hielo**, 57-61
  **espacio** (gravedad lunar), 62-66 **laberinto** (muros que se trepan y
  muros mágicos con sombrero 'H'), 67-71 **mezcla** (todo junto). Mates altas
  (reto2/reto3/operacion/mitadDoble). Los bichos extra y la subida de mates
  siguen escalando por dificultad en tiempo de ejecución.
- **Nuevo jefe: el Mago Oscuro** (`boss.ts`, clase `MagoOscuro`, char `'Z'`):
  se teletransporta sin parar (`buscarSitio`), invoca enemigos (tope 5 vivos) y
  lanza **rayos mágicos** rectos hacia el jugador (`RayoMagico`). Pisotón→reto o
  cubo de Rubik le quitan corazón; vidas = `jefeVidas` (3 normal / 5 Difícil).
  Comparte interfaz con `Jefe` vía `type JefeFinal` y discriminador `tipo`
  ('comecubos' | 'mago'); `level.jefe: JefeFinal`. Fase `nivelfinal2.ts` (72,
  castillo nocturno) con Xiana, puerta, ítems y cubos en la arena.
- **Renderer**: `jefeDibujo` se parte en `comecubosCuerpo` y `magoCuerpo`
  (túnica morada, gorro de pico con estrella, ojos brillantes); los proyectiles
  se pintan como orbes morados (mago) o bolas de fuego (comecubos).
- `check-levels.mjs`: la 'Z' (mago) también debe pisar suelo. Las 71 fases
  pasan el validador; `npm run build` en verde (98 módulos).
- Verificado en preview: flecha ▶ bloqueada hasta el jefe 36 y desbloqueada
  tras él; Mundo 2 muestra 37-71 + jefe; fase de agua con peces; el Mago se
  teletransporta/invoca/lanza rayos y pierde vida con el cubo.

### Retoques tras pruebas de Vaquero (2026-06-15)

- **Fases con varios caminos a distintas alturas** (feedback "demasiado
  fáciles"): `estandar` añade ahora una **ruta alta** (`rutaAlta`, ON por
  defecto) de plataformas escalonadas (filas 3-6, cada 10 cols) con monedas de
  premio y enemigos de reto — se salta de una a otra como circuito de
  obstáculos, además del camino de suelo.
- **Mago Oscuro más grande** (78×100, antes 48×62) y **al final de la fase**:
  `nivelfinal2` pasa a 190 cols con recorrido de obstáculos (barrancos con
  plataformas, foso de lava con parpadeantes, puerta, vigilantes, checkpoint)
  y el Mago ('Z') esperando en col 165 con Xiana al fondo (col 182).
- **Cinemática del Mundo 2** (`src/ui/cinematica2.ts`, clase `CinematicaMundo2`):
  al pulsar la flecha ▶ se reproduce (estado `'cinematica'` en main.ts, se salta
  tocando): tu personaje equipado y Xiana juegan en un parque → aparece el Mago
  → con un hechizo (rayo + destellos) la mete en una jaula → se van volando
  arriba-derecha. `screens.ts` lanza el callback `cbCinematica` al avanzar al
  Mundo 2; al terminar, muestra el menú del Mundo 2. Verificado en preview.

### Selector de mundos, cinemáticas por mundo y más monedas (2026-06-15)

Segunda ronda de feedback de Vaquero:
- **Selector de mundos tipo "landing" espacial** (`screens.ts: mostrarLanding`):
  sustituye a las flechas ◀▶. Botón 🪐 en el menú abre un panel espacial con un
  **planeta por mundo** y el **monstruo del jefe final encima** (Comecubos /
  Mago Oscuro, dibujados con `dibujarIconoJefe`/`dibujarPlaneta`), más planetas
  **"✨ Próximamente"** (mundos 3-4 bloqueados). Elegir un mundo desbloqueado
  entra a su rejilla; los bloqueados muestran "Pásate el Mundo N".
- **Cinemática propia por mundo** (`cinematica2.ts` ahora clase `Cinematica`
  con `mundo` + `personaje`): Mundo 1 = los dos amigos juegan y empieza la
  aventura (~7,5 s); Mundo 2 = secuestro del Mago (**14 s, más lenta** para leer
  los subtítulos). Se reproduce **solo la primera vez** que se elige cada mundo
  (`cinematicaVista`/`marcarCinematicaVista` en settings.ts, clave
  `salta-numeros-cinematicas`, sincronizada). main.ts: `reproducirCinematica(mundo, despues)`.
- **Más monedas, escondidas y difíciles** (`gen-levels2.mjs`): la ruta alta da
  monedas en casi todas las plataformas + monedas altas escondidas; monedas
  flotando sobre los barrancos; y en las fases de agua, monedas en el fondo (hay
  que bucear). Verificado: niv. 47 ≈ 32 monedas, niv. 52 ≈ 27.
- Verificado en preview: selector con 4 planetas y monstruos; elegir Mundo 2
  (1ª vez) lanza su cinemática de 14 s y entra; build + check-levels en verde.

## MUNDO 3: fases aéreas + el Remolino (2026-06-15)

Tercer mundo (niveles 73-107 + jefe 108), **fases aéreas**: casi sin suelo —
el fondo es lava o agua llena de peces que atacan; se avanza **saltando de
plataforma en plataforma**. `tools/gen-levels3.mjs` con el constructor `aereo`
(repisas de salida/meta, camino de plataformas a distintas alturas con saltos
exigentes, móviles/caedizas/parpadeantes, monedas altas escondidas, peces en el
agua, puertas sobre plataformas anchas). Zonas: lava (73-78), agua+peces
(79-84), lava+mecánicas (85-90), agua difícil (91-96), tormenta final (97-107).
Tema espacio, mates reto3/operacion/mitadDoble.

- **Nuevo jefe: el Remolino** (`boss.ts` clase `Tornado`, char `'Y'`,
  `nivelfinal3.ts`=108): flota en una arena aérea sobre lava y persigue al
  jugador; su ataque al tocarte te hace **girar y te lanza por los aires**
  (main.ts: `player.empujar(vx,vy)` + `girandoT`; el peligro es caer a la lava).
  Para dañarlo: subir por las plataformas y caerle ENCIMA (pisotón→mates) o
  con cubo de Rubik. Comparte interfaz vía `type JefeFinal` + `tipo='tornado'`.
- `MUNDOS` añade `{73-107, jefe 108}`; el selector "landing" muestra ya 3
  planetas (Mundo 3 = "Cielo y tormenta" con icono de remolino) + 2
  "Próximamente". **Cinemática del Mundo 3** (cielo de tormenta: el Remolino se
  lleva a Xiana a las nubes, ~9 s).
- `check-levels.mjs`: el agua '~' del fondo cuenta como suelo (no caída al
  vacío), para validar las fases aéreas con mar.
- Renderer: `tornadoCuerpo` (embudo girando con cara) y giro del personaje al
  ser lanzado. Verificado en preview: fase 79 (agua, 10 peces, plataformas),
  jefe 108 lanza/daña (pisotón→mates y cubo 3→2); build (253 KB) y check-levels
  en verde.

### Arreglos tras pruebas: jefe Mundo 3, variedad y fase de la barra (2026-06-15)

- **Arena del Remolino (108) rehecha** (era imposible: todo lava, sin checkpoint
  → cada lanzamiento = muerte). Ahora hay una **isla de lucha SÓLIDA** (no lava)
  con **punto de control** (reapareces en la isla), plataformas de re-subida a
  los lados (al ser lanzado caes y vuelves), plataformas altas para caerle
  encima y sombrero de rescate. Lava solo en los fosos. Verificado: isla sólida,
  checkpoint, pisotón abre mates.
- **Más variedad**: el patrón de alturas de las plataformas (ruta alta del
  Mundo 2 y camino aéreo del Mundo 3) y el ancho de las fases aéreas ahora
  varían por fase (`PATRONES` + semilla), para que no se parezcan tanto.
- **Fase nueva "monta en la barra" (nivel 90)**: barra verde ANCHA y lenta
  (`PlataformaMovil` con `rango`/`velAng`/`anchoTiles`, char `'n'`) que va de un
  lado a otro sobre la lava; sin bajarte saltas a por monedas y los ítems
  (sombrero + arcoíris) que hacen falta al final para cruzar el muro mágico y
  volar sobre el último foso de lava. `check-levels` y build en verde.
- **Alcanzabilidad arreglada** (el cambio de variedad había dejado plataformas
  inalcanzables): los patrones de altura ahora **empiezan bajos** (cerca del
  suelo/repisa) y suben **≤2 tiles** entre plataformas, y la ruta alta del
  Mundo 2 va cada 8 cols (hueco ~4, salto cómodo). En las fases aéreas la repisa
  de salida se alargó a la col 9. La **barra** del nivel 90 arranca pegada a la
  repisa (col 17, a 1 tile) para subirse al instante. Verificado: 1ª plataforma
  del 71 en fila 8, barra a 1 tile.

### Monedas en agua, saltos imposibles y verificación de todas las fases (2026-06-15)

- **Monedas bajo el agua sin cuadrado vacío**: el carácter `o` borraba el `~`,
  dejando un hueco sin agua. `level.ts` ahora, tras parsear, devuelve el agua a
  las casillas de monedas rodeadas de agua (se ven flotando).
- **Saltos imposibles arreglados**: arcoíris (volar) en la repisa de salida de
  TODAS las fases aéreas del Mundo 3 (red de seguridad), y arcoíris + plataformas
  más bajas en el nivel 47. La **arena del Tornado (108)** tenía el acceso roto
  (repisa a col 12, primera plataforma a col 22 = salto de 10, e ítems sobre la
  lava); rehecha con escalera de plataformas cada ~6 e ítems sobre la repisa.
- **Verificador de superabilidad** (`tools/check-passable.mjs`): BFS desde la
  'P' a la meta con sobre de salto realista (doble salto ~6×3, lunar ~13×6),
  modela tubos y plataformas móviles, y considera el arcoíris alcanzable como
  rescate. Excluye buceo/barra (mecánicas no modeladas). Tras los arreglos:
  **todas las fases pasan**. check-levels y build, en verde.

### Fases de agua bloqueadas por pilares (2026-06-15)

- **Pilares submarinos que tapaban el paso**: en las fases de buceo (37-41)
  había pilares de roca de altura COMPLETA (filas 11-18) que cerraban el agua →
  fase imposible (38, 39, 41). Ahora en el constructor `agua` los pilares solo
  suben desde el fondo hasta la fila 14: siempre queda un **carril por arriba
  (filas 11-13)** para nadar por encima. Paso garantizado.
- **Verificador con buceo**: `check-passable.mjs` ahora modela NADAR (el agua es
  transitable en todas direcciones) además de saltos y tubos, así detecta estos
  bloqueos submarinos. Con el arreglo, todas las fases pasan.

### Revisión total de saltos con física real (2026-07-03, Fable 5)

- **`check-passable.mjs` reescrito con la FÍSICA REAL de player.ts**: simula el
  doble salto (vel 150, salto 580, gravedad 1500) y calcula el alcance exacto
  por diferencia de altura (llano 7 tiles, subir 4 → 6, bajar 4 → 8; tabla
  aparte para gravedad lunar). El BFS usa esa tabla, comprueba que el arco no
  atraviese muros, recoge ítems en pleno salto, nada, cruza tubos y pisa
  móviles. **Modo `--estricto`**: margen infantil (–1 tile, sin contar el
  arcoíris como rescate) — calibrado con el Mundo 1, que Joel tiene a 3★.
  El 15 y el 22 están en una lista de "fases de vuelo intencionadas".
- **Causa raíz de los saltos imposibles del Mundo 3** (74, 75, 89, 99, 101,
  107): el camino de plataformas paraba en la col W−12 pero la repisa de la
  meta empieza en W−7 → el ÚLTIMO salto podía quedar de 8-9 tiles. `aereo`
  ahora añade **dos plataformas de aterrizaje fijas** (cols W−15 y W−11, fila
  8) para que el salto final siempre sea corto. Verificado en juego: el peor
  hueco de esas 6 fases es ahora de 3-4 tiles.
- Estado: estricto ✅, normal ✅, check-levels ✅, build ✅.

- Hosting HTTPS/tablet: ✅ ya hecho (GitHub Pages).

## 🎨 PLAN DE PULIDO PROFESIONAL (2026-07-03, Fable 5) — EN CURSO

Objetivo: que el juego se sienta "de verdad" y encante a Joel. Se implementa
por fases con commit al final de cada una. **Si esta sesión se corta, retomar
por la primera casilla sin marcar** (cada fase es independiente).

### Fase A — Game feel (jugo visual) ✅ HECHA
- [x] **Squash & stretch**: el personaje se estira al saltar/caer y se aplasta
      al aterrizar fuerte (`player.squashT` + escala anclada a los pies en
      `renderer.personajeConEfectos`).
- [x] **Partículas** (`src/engine/particles.ts`, clase `Particulas` en el
      renderer, update desde main): chispas doradas al coger moneda, polvo al
      aterrizar fuerte, estrellitas al pisotear un bicho.
- [x] **Confeti** en la pantalla de resultados (spans emoji con animación CSS
      `confeti-cae`, en `mostrarResultados`).
- [x] **Botón pausa** ⏸ en el HUD (estado `'pausa'`, overlay #pausa, tecla P o
      Escape; el cronómetro no corre en pausa).
- [x] **Contador de estrellas del mundo** en el menú (junto al título del
      mundo: ⭐ conseguidas/posibles del mundo en vista).

### Fase B — Música chiptune ✅ HECHA
- [x] `src/game/music.ts`: secuenciador WebAudio (osciladores, sin ficheros),
      melodía cuadrada + bajo triangular. Tema NORMAL (Do mayor, alegre) en
      fases y menú; tema JEFE (La menor, rápido) en las peleas finales
      (`setTemaMusica` desde empezarNivel/irAlMenu).
- [x] Ajuste **🎵 Música ON/OFF** separado del sonido (settings.ts `musica`,
      fila en Ajustes, aplicado en `aplicarAjustes`; la clave de ajustes ya se
      sincronizaba entera). Arranca tras el primer toque (autoplay).

### Fase C — Pistas educativas en las puertas ✅ HECHA
- [x] Al PRIMER fallo en una puerta aparece una pista visual con bloquecitos
      estilo Numberblocks (`crearPista` en mathDoor.ts + CSS .puerta-pista):
      suma → dos grupos de colores para contar; resta → bloques tachados ✖;
      multiplicación → rejilla de filas; división → reparto en filas iguales;
      doble/mitad → dos filas iguales. Series y problemas → ánimo para pensar
      con calma. Verificado: "3 + 1" muestra 3 rojos + 1 azul.

### Fase D — Informe para papá ✅ HECHA (ampliada a petición de Vaquero)
- [x] `src/storage/informe.ts`: registro de CADA pregunta respondida (fecha,
      nivel, tipo, enunciado, fallos, acertada) en `salta-numeros-informe`
      (tope 1000). Se apunta en main.ts en las puertas y en los retos de jefe.
- [x] Pantalla **📊 Informe de mates** en Ajustes: resumen por tipo (% a la
      primera con color verde/ámbar/rojo, nº de preguntas), lista de las
      últimas 12 con ✅/⚠️ fallos/❌, y botón **⬇️ Descargar informe** que baja
      un .txt con el resumen y TODAS las preguntas (fecha | nivel | pregunta |
      fallos | resultado). `textoInforme()`/`descargarInforme()`.
- [x] sync.ts: la clave viaja al fichero del lanzador; al fusionar gana el
      lado con más preguntas registradas. Verificado en preview: 2 respuestas
      (una a la primera, otra con 1 fallo) → botón "(2 preguntas)", resumen
      "Sumas 50 % a la primera" y lista correcta.

## 🗼 MUNDO 4 VERTICAL (2026-07-03, Fable 5) — EN CURSO

Niveles 109-143 + jefe 144. Fases VERTICALES: **torres** (subir saltando de
plataforma en plataforma hasta la meta arriba) y **abismos marinos** (bajar
buceando esquivando pinchos, peces y medusas hasta la meta en el fondo).

- [x] Mecánicas nuevas en el motor:
      · **Trampolín** ('J', entities.ts `Trampolin`): al caerle encima te lanza
        vy −880 (~7,7 tiles de subida). OJO: el salto variable recortaba
        cualquier subida a −200 → nuevo `player.impulsoT` (el impulso de
        trampolín/Remolino no se recorta). Muelle rojo/blanco que se comprime.
      · **Medusa** ('u', entities.ts `Medusa`): flota arriba/abajo en el agua
        (±2,2 tiles); solo se esquiva (la estrella protege). Rosa translúcida.
      · **El Kraken** ('K', boss.ts `Kraken` + `Burbuja`): patrulla el lecho
        marino y lanza burbujas que SUBEN meciéndose hacia ti; pisotón
        buceando → mates; el cubo le quita vida. Vidas = jefeVidas por modo.
- [x] `tools/gen-levels4.mjs`: `torre()` (zigzag ping-pong de plataformas de 5,
      subida 2 filas, puerta de mates en un piso, trampolines/vigilantes/
      pinchos según zona) y `sima()` (pozo de agua con salientes alternos,
      pinchos, checkpoint a media bajada, puerta junto al fondo; bichos SOLO
      en celdas de agua). Zonas: torres 109-115, simas 116-122, torres duras
      123-129, simas profundas 130-136, mixto 137-143. Arena del Kraken (144).
- [x] Integración: index.ts (MUNDOS 4º = 109-143 + 144), landing (planeta
      azul "Torre y abismo" + icono kraken; Mundo 5-6 "próximamente"),
      cinemática del Mundo 4 (playa: el Kraken surge del mar, atrapa a Xiana
      y se la lleva al fondo, 12 s), validadores ('K','J' pisan suelo; 'u' es
      agua en check-passable).
- [x] Verificado: torre 109 (spawn abajo, meta arriba, bote −880 real), sima
      116 (spawn arriba, meta en el fondo, peces+medusas), Kraken (burbujas,
      cubo 3→2), landing con 4 mundos. Los 3 checkers y build en verde.

### Rediseño del Mundo 4 tras las pruebas de Vaquero (2026-07-04)

Feedback: demasiado fáciles, sin monedas, la sima se pasaba cayendo recto,
trampolines decorativos, y faltaba avanzar a la derecha. Rediseño total:
- **Torre (66×30, antes 30×24)**: recorrido estilo Mario clásico que sube Y
  avanza → pasillo bajo con techo (hueco 3: a los enemigos hay que
  cronometrarles el salto) → **trampolín OBLIGATORIO** (subida 10, imposible
  con doble salto) → puente de parpadeantes sobre foso de pinchos (esperar el
  ciclo) → checkpoint + puerta → **2º trampolín obligatorio** (subida 9) →
  cornisas con vigilante → meta arriba a la DERECHA. 15 monedas por el camino.
- **Sima (60×32)**: laberinto en S de estanterías de roca (cada una con UN
  hueco alternando lado); cada hueco tiene guardián (pez u medusa: hay que
  ESPERAR a que se aparte) y pinchos en el borde; **0 columnas de caída
  recta** (verificado). Cámara de la meta sellada: la única entrada es la
  puerta de mates. 18 monedas + premios en rincones.
- Variantes por espejo horizontal (v impar) + `dura` (más patrullas, huecos
  de 5, caediza traicionera en el puente).
- **`check-passable --sin-trampolin`**: demuestra que los trampolines son
  obligatorios (las 18 torres salen imposibles sin ellos; con ellos, todo
  pasa). parMs subido a 175-245 s.

### Arreglo crítico: trampolines tapados por bloques (2026-07-04)

Vaquero encontró la fase 109 imposible: la cornisa de llegada estaba JUSTO
ENCIMA del trampolín → el bote chocaba con los bloques. Doble arreglo:
- **Diseño**: los dos trampolines de cada torre tienen ahora CIELO ABIERTO
  (la cornisa/plataforma de llegada queda AL LADO: botas recto y derivas);
  el techo del pasillo se recortó (col ≤25) para que no haya atajo por la
  azotea, y la puerta de mates lleva techo (no se salta). Verificado en juego:
  36/36 trampolines con 10 filas libres encima; bote real de 7,8 tiles.
- **Verificador endurecido (permanente)**: `arcoLibre` ahora exige un camino
  en L despejado para CADA salto y bote (subir en la columna de despegue y
  cruzar a la altura de llegada, o cruzar primero y subir en la de destino):
  los techos frenan la subida como en el juego real. Con este modelo, el fallo
  de "bloques sobre el trampolín" es imposible que vuelva a colarse. Los 4
  modos en verde (mapas, normal, estricto, y sin-trampolín = solo 18 torres).

### Fase F — Flujo y confort ✅ HECHA (2026-07-04, Fable 5)
- [x] **➡️ Siguiente** en resultados (botón protagonista; Repetir pasa a
      secundario): encadena fases sin ir al menú. `nivelSiguiente(n)` en main:
      n+1 → jefe del mundo → primera del mundo siguiente.
- [x] **▶️ Continuar · fase N** en el menú: salta a la primera fase sin
      completar del modo (recorre todos los mundos y cambia mundoVista); el
      botón de esa fase **late** (clase `siguiente`, animación `late`).
- [x] **Invulnerabilidad 1,2 s tras reaparecer** (`player.invulnerableT`,
      parpadeo en renderer): morir(forzar) — tocar bichos/pinchos no mata en
      cadena; caer fuera del mapa mata siempre. Verificado: sobrevive al bicho
      durante la ventana.
- [x] **Vibración táctil** (`vibrar()` en main, navigator.vibrate con guarda):
      80 ms al morir, patrón [60,40,60] al completar nivel.

### Fase E — Cierre con premio ⏳ PENDIENTE
- [ ] Cinemática de cierre al completar el jefe del Mundo 3 (los tres
      monstruos vencidos, Xiana y el personaje celebran).
- [ ] Premio al 100 %: mensaje/corona especial si todas las fases de un mundo
      están a 3 estrellas.

## Notas técnicas

- El preview de Claude lanza el dev server vía
  `C:\Users\Usuario\.claude\run-salta-numeros.cmd` (rutas con espacios).
- Si la pestaña del preview está oculta, `requestAnimationFrame` se congela:
  para probar existe `window.__debug.step(frames)` (solo en dev), que avanza
  el bucle a mano. `__debug` también da `teleport`, `empezarNivel`, etc.
- El test de "salto en el aire" debe hacerse lejos del suelo: cerca de él
  el jump buffer (ventana de 120 ms de reloj real) aterriza y salta legítimo.
