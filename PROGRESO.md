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

## Mecánicas del personaje y del mundo (fase 2)

- Coyote time (en tiempo de juego, no de reloj) + jump buffer + salto variable.
- **Doble salto** a partir del nivel 7 (`dobleSalto: true` en el nivel).
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
