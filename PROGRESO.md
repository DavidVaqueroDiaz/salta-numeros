# Salta Números — Diario de progreso

Minijuego de plataformas educativo para Joel (8 años). PWA jugable en Chrome
de tablet Android, instalable en pantalla de inicio, funciona offline.

## Cómo retomar el proyecto

```
cd "C:\Users\Usuario\Desktop\minijuego Joel"
npm run dev        # abre http://localhost:5173
npm run build      # comprueba tipos + genera dist/ con la PWA
```

En PC se juega con flechas (o A/D) y espacio. En tablet, botones táctiles.

## Arquitectura (decidida 2026-06-11)

- **Vite + TypeScript vanilla**, sin motor de juegos: micro-motor propio
  (gravedad, salto, colisiones AABB contra rejilla de tiles) en `src/engine/`.
- **Canvas** para el mundo del juego; **DOM/CSS** para menús, HUD, controles
  táctiles y puertas matemáticas (botones grandes, tipografía legible).
- **Niveles como datos**: mapa ASCII + metadatos en `src/levels/nivelXX.ts`.
  Leyenda: `#` sólido, `D` puerta, `M` meta, `P` aparición, `^` pinchos.
- **Preguntas generadas** en `src/math/questions.ts` según tipo y nivel
  (suma/resta 1–3, descomposición 4–6, multiplicación/división/lógica 7–10).
- **Progreso en localStorage** (`salta-numeros-v1`): estrellas, mejor tiempo
  y completado por nivel. Nivel n se desbloquea al completar n−1.
- **Estrellas**: 1 por completar, +1 sin fallos en puertas, +1 si el tiempo
  ≤ `parMs` del nivel. El cronómetro se PAUSA durante las puertas (las mates
  se piensan con calma; la velocidad se mide en el plataformeo).
- **PWA**: vite-plugin-pwa con precacheo total (offline tras primera carga),
  manifest fullscreen + landscape. Iconos generados con `tools\make-icons.ps1`.

## Estado

- [x] **Fase 0** — Scaffold, PWA, iconos, git (2026-06-11)
- [x] **Fase 1** — Nivel 1 jugable de extremo a extremo (2026-06-11):
      controles táctiles + teclado, física con coyote time y jump buffer,
      puerta de sumas, meta, cronómetro, estrellas, guardado. Verificado con
      partida real: 3★ en 11,9 s, progreso persistido y reflejado en el menú.
- [ ] **Fase 2** — Niveles 2–10 (personaje con forma de bloques de su número,
      ya soportado en `renderer.ts` con FORMAS 1–10; colores en `levels/index.ts`)
- [ ] **Fase 3** — Pulido (animaciones, pantalla de victoria final) y
      despliegue HTTPS (hosting pendiente de decidir: GitHub Pages o Netlify)

## Notas técnicas

- El preview de Claude lanza el dev server vía
  `C:\Users\Usuario\.claude\run-salta-numeros.cmd` (la ruta del proyecto
  tiene espacios y el lanzador no las soporta en runtimeExecutable).
- Gancho de depuración solo en dev: `window.__debug` (estado, player,
  teleport, empezarNivel).
- Mejora pendiente menor: los distractores de las opciones pueden superar
  el rango del nivel (p. ej. "8" en sumas hasta 5); valorar acotarlos.
