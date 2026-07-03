import { COLORES, NIVELES, MUNDOS } from '../levels/index'
import { cargarProgreso, nivelDesbloqueado } from '../storage/progress'
import {
  cargarAjustes,
  guardarAjustes,
  cinematicaVista,
  marcarCinematicaVista,
  type Ajustes,
} from '../storage/settings'
import { setSonidoActivado } from '../game/sound'
import {
  cargarMonedero,
  cargarPersonajes,
  comprarPersonaje,
  equiparPersonaje,
  precioPersonaje,
} from '../storage/shop'
import { guardarEnFichero } from '../storage/sync'
import { dibujarPersonaje, FORMAS, oscurecer } from '../engine/character'
import {
  dificultadActual,
  fijarDificultad,
  NOMBRE_DIFICULTAD,
  type Dificultad,
} from '../game/dificultad'

const CONTRASENA_DESBLOQUEO = '1566'

/** Mundo que se está viendo en el menú (1 o 2). La flecha ▶ avanza al siguiente. */
let mundoVista = 1
/** Callback para reproducir la cinemática de un mundo (lo da main.ts). */
let cbCinematica: ((mundo: number, despues: () => void) => void) | null = null

/** Aplica los ajustes guardados (al arrancar y al cambiarlos). */
export function aplicarAjustes(ajustes: Ajustes = cargarAjustes()): void {
  setSonidoActivado(ajustes.sonido)
  document.body.classList.toggle('controles-grandes', ajustes.tamanoControles === 'grande')
  document.body.classList.toggle('controles-pequenos', ajustes.tamanoControles === 'pequeno')
}

export function formatearTiempo(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

export function estrellasTexto(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n)
}

/** Pinta el menú principal con la rejilla de niveles. */
export function mostrarMenu(
  alElegir: (nivel: number) => void,
  alCinematica?: (mundo: number, despues: () => void) => void,
): void {
  if (alCinematica) cbCinematica = alCinematica
  const pantalla = document.getElementById('screen-menu')!
  const dificultad = dificultadActual()
  const progreso = cargarProgreso(dificultad)
  const ajustes = cargarAjustes()
  const modoAbierto = ajustes.desbloqueado

  pantalla.innerHTML = ''
  const titulo = document.createElement('h1')
  titulo.className = 'titulo'
  titulo.textContent = '🔢 Salta Números'
  const subtitulo = document.createElement('p')
  subtitulo.className = 'subtitulo'
  subtitulo.textContent = modoAbierto ? '🔓 Todos los niveles abiertos' : 'Elige un nivel'

  // Selector de modo: cada modo guarda su propio progreso por separado.
  const modos = document.createElement('div')
  modos.className = 'modos'
  for (const m of ['facil', 'medio', 'dificil'] as Dificultad[]) {
    const btn = document.createElement('button')
    btn.className = 'modo-btn'
    btn.textContent = NOMBRE_DIFICULTAD[m]
    if (m === dificultad) btn.classList.add('activo')
    btn.addEventListener('click', () => {
      if (m === dificultad) return
      fijarDificultad(m)
      mundoVista = 1 // cada modo empieza viendo el Mundo 1
      mostrarMenu(alElegir) // re-pinta con el progreso de ese modo
    })
    modos.appendChild(btn)
  }

  // ¿qué mundo se ve? (clampado por si el modo no lo tiene desbloqueado)
  if (mundoVista > MUNDOS.length) mundoVista = MUNDOS.length
  const finalAnterior = mundoVista > 1 ? MUNDOS[mundoVista - 2].final : 0
  const mundoAccesible = mundoVista === 1 || modoAbierto || progreso[finalAnterior]?.completed
  if (!mundoAccesible) mundoVista = 1
  const mundo = MUNDOS[mundoVista - 1]

  // Título del mundo + botón para abrir el selector de mundos (la "landing")
  const nav = document.createElement('div')
  nav.className = 'mundo-nav'
  // estrellas conseguidas / posibles del mundo en vista (motiva el 100 %)
  let estrellasMundo = 0
  for (let n = mundo.primero; n <= mundo.ultimo; n++) estrellasMundo += progreso[n]?.stars ?? 0
  estrellasMundo += progreso[mundo.final]?.stars ?? 0
  const estrellasPosibles = (mundo.ultimo - mundo.primero + 2) * 3
  const etiquetaMundo = document.createElement('span')
  etiquetaMundo.className = 'mundo-titulo'
  etiquetaMundo.textContent =
    estrellasMundo >= estrellasPosibles
      ? `🗺️ Mundo ${mundo.num} · 👑 ¡100 %!`
      : `🗺️ Mundo ${mundo.num} · ⭐ ${estrellasMundo}/${estrellasPosibles}`
  const btnMundos = document.createElement('button')
  btnMundos.className = 'mundo-flecha'
  btnMundos.textContent = '🪐'
  btnMundos.title = 'Elegir mundo'
  btnMundos.addEventListener('click', () => mostrarLanding(alElegir))
  nav.append(etiquetaMundo, btnMundos)

  const rejilla = document.createElement('div')
  rejilla.className = 'niveles'

  for (let n = mundo.primero; n <= mundo.ultimo; n++) {
    const btn = document.createElement('button')
    btn.className = 'nivel-btn'
    const desbloqueado = (modoAbierto || nivelDesbloqueado(n, progreso)) && n in NIVELES

    if (desbloqueado) {
      btn.style.background = COLORES[((n - 1) % 10) + 1]
      const num = document.createElement('span')
      num.textContent = String(n)
      const estrellas = document.createElement('span')
      estrellas.className = 'estrellas'
      estrellas.textContent = estrellasTexto(progreso[n]?.stars ?? 0)
      btn.append(num, estrellas)
      btn.addEventListener('click', () => alElegir(n))
    } else {
      btn.classList.add('bloqueado')
      btn.textContent = '🔒'
      btn.disabled = true
    }
    rejilla.appendChild(btn)
  }

  // Botón del jefe final del mundo (se abre al completar su última fase)
  const btnFinal = document.createElement('button')
  btnFinal.className = 'final-btn'
  if ((modoAbierto || nivelDesbloqueado(mundo.final, progreso)) && mundo.final in NIVELES) {
    const hecho = progreso[mundo.final]?.completed
    btnFinal.textContent = hecho
      ? `⭐ ¡Salva a Xiana otra vez! ${estrellasTexto(progreso[mundo.final]?.stars ?? 0)}`
      : '⭐ JEFE FINAL: ¡salva a Xiana!'
    btnFinal.addEventListener('click', () => alElegir(mundo.final))
  } else {
    btnFinal.classList.add('bloqueado')
    btnFinal.textContent = `🔒 Completa la fase ${mundo.ultimo} para salvar a Xiana`
    btnFinal.disabled = true
  }

  // Fila inferior: tienda, guardar, ajustes y desbloqueo con contraseña
  const fila = document.createElement('div')
  fila.className = 'fila-botones'

  const btnTienda = document.createElement('button')
  btnTienda.className = 'boton-grande'
  btnTienda.textContent = `🛍️ Tienda · 🪙 ${cargarMonedero()}`
  btnTienda.addEventListener('click', () => mostrarTienda(alElegir))

  const btnGuardar = document.createElement('button')
  btnGuardar.className = 'boton-grande secundario'
  btnGuardar.textContent = '💾 Guardar'
  btnGuardar.addEventListener('click', () => {
    btnGuardar.textContent = '💾 …'
    void guardarEnFichero().then((enFichero) => {
      btnGuardar.textContent = enFichero ? '✅ ¡Guardado!' : '✅ Guardado (navegador)'
      setTimeout(() => (btnGuardar.textContent = '💾 Guardar'), 2000)
    })
  })

  const btnAjustes = document.createElement('button')
  btnAjustes.className = 'boton-grande secundario'
  btnAjustes.textContent = '⚙️ Ajustes'
  btnAjustes.addEventListener('click', () => abrirAjustes(alElegir))

  const btnDesbloquear = document.createElement('button')
  btnDesbloquear.className = 'boton-grande secundario'
  btnDesbloquear.textContent = modoAbierto ? '🔒 Volver a bloquear' : '🔓 Desbloquear todo'
  btnDesbloquear.addEventListener('click', () => {
    if (modoAbierto) {
      guardarAjustes({ ...ajustes, desbloqueado: false })
      mostrarMenu(alElegir)
    } else {
      pedirContrasena(alElegir)
    }
  })

  fila.append(btnTienda, btnGuardar, btnAjustes, btnDesbloquear)

  // Pantalla completa (útil en el navegador del móvil; instalada no hace falta)
  const instalada = window.matchMedia(
    '(display-mode: fullscreen), (display-mode: standalone)',
  ).matches
  if (document.documentElement.requestFullscreen && !instalada) {
    const btnPantalla = document.createElement('button')
    btnPantalla.className = 'boton-grande secundario'
    btnPantalla.textContent = '⛶ Pantalla completa'
    btnPantalla.addEventListener('click', () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen()
      } else {
        document.documentElement
          .requestFullscreen({ navigationUI: 'hide' })
          .catch(() => {})
      }
    })
    fila.appendChild(btnPantalla)
  }

  pantalla.append(titulo, subtitulo, modos, nav, rejilla, btnFinal, fila)
  pantalla.classList.remove('hidden')
}

/** Dibuja un planeta de colores con un brillo y un anillo opcional. */
function dibujarPlaneta(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.25, color)
  g.addColorStop(1, oscurecer(color, 0.55))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // manchas/cráteres
  ctx.fillStyle = oscurecer(color, 0.7)
  ctx.beginPath()
  ctx.arc(cx + r * 0.3, cy + r * 0.25, r * 0.18, 0, Math.PI * 2)
  ctx.arc(cx - r * 0.35, cy + r * 0.4, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
}

/** Icono del jefe final de cada mundo, para ponerlo encima del planeta. */
function dibujarIconoJefe(ctx: CanvasRenderingContext2D, mundo: number, cx: number, cy: number, s: number): void {
  if (mundo === 3) {
    // Remolino (embudo girando)
    const capas = 6
    for (let i = 0; i < capas; i++) {
      const f = i / (capas - 1)
      const ey = cy + s * 0.45 - f * s * 0.9
      const ew = (0.16 + f * 0.7) * s
      ctx.fillStyle = i % 2 === 0 ? '#7896b4' : '#bcd2e4'
      ctx.beginPath()
      ctx.ellipse(cx + (i % 2 ? 3 : -3), ey, ew / 2, s * 0.06 + 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(cx + lado * s * 0.13, cy - s * 0.18, s * 0.08, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3557'
      ctx.beginPath()
      ctx.arc(cx + lado * s * 0.13, cy - s * 0.18, s * 0.04, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  if (mundo === 2) {
    // Mago Oscuro
    ctx.fillStyle = '#3a0ca3'
    ctx.beginPath()
    ctx.moveTo(cx, cy - s * 0.1)
    ctx.lineTo(cx + s * 0.4, cy + s * 0.5)
    ctx.lineTo(cx - s * 0.4, cy + s * 0.5)
    ctx.closePath()
    ctx.fill()
    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#e0aaff'
      ctx.beginPath()
      ctx.arc(cx + lado * s * 0.15, cy + s * 0.05, s * 0.09, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#240a6b'
    ctx.beginPath()
    ctx.ellipse(cx, cy - s * 0.08, s * 0.42, s * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.moveTo(cx + s * 0.06, cy - s * 0.6)
    ctx.lineTo(cx + s * 0.22, cy - s * 0.08)
    ctx.lineTo(cx - s * 0.22, cy - s * 0.08)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd60a'
    ctx.font = `${Math.round(s * 0.22)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', cx + s * 0.06, cy - s * 0.55)
  } else {
    // Comecubos
    ctx.fillStyle = '#5a189a'
    ctx.beginPath()
    ctx.roundRect(cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8, s * 0.14)
    ctx.fill()
    ctx.strokeStyle = '#3c096c'
    ctx.lineWidth = 2
    ctx.stroke()
    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx + lado * s * 0.16, cy - s * 0.08, s * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#c1121f'
      ctx.beginPath()
      ctx.arc(cx + lado * s * 0.16, cy - s * 0.08, s * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 3; i++) {
      const dx = cx - s * 0.24 + i * s * 0.24
      ctx.beginPath()
      ctx.moveTo(dx, cy + s * 0.36)
      ctx.lineTo(dx + s * 0.08, cy + s * 0.2)
      ctx.lineTo(dx + s * 0.16, cy + s * 0.36)
      ctx.closePath()
      ctx.fill()
    }
  }
}

/**
 * Selector de mundos ("landing" espacial): cada mundo es un planeta con el
 * monstruo de su jefe final encima. Muestra los mundos que existen y otros que
 * llegarán próximamente. Al elegir un mundo se reproduce su cinemática (la
 * primera vez) y se entra a su rejilla de niveles.
 */
function mostrarLanding(alElegir: (nivel: number) => void): void {
  const dialogo = document.getElementById('dialogo')!
  const progreso = cargarProgreso(dificultadActual())
  const modoAbierto = cargarAjustes().desbloqueado
  dialogo.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'landing'

  const titulo = document.createElement('p')
  titulo.className = 'landing-titulo'
  titulo.textContent = '🪐 Elige un mundo'
  caja.appendChild(titulo)

  const galaxia = document.createElement('div')
  galaxia.className = 'planetas'

  const COLORES_PLANETA = ['#52b788', '#9d4edd', '#4cc9f0', '#f77f00']
  const NOMBRES = ['Pradera y castillo', 'Magia y misterio', 'Cielo y tormenta', '???']

  // mundos reales (existentes)
  MUNDOS.forEach((m, i) => {
    const desbloqueado =
      m.num === 1 || modoAbierto || progreso[MUNDOS[i - 1]?.final]?.completed
    const hecho = progreso[m.final]?.completed
    const card = document.createElement('button')
    card.className = 'planeta-card' + (desbloqueado ? '' : ' bloqueado')

    const lienzo = document.createElement('canvas')
    lienzo.width = 130
    lienzo.height = 140
    const ctx = lienzo.getContext('2d')!
    dibujarPlaneta(ctx, 65, 95, 42, COLORES_PLANETA[i % COLORES_PLANETA.length])
    if (desbloqueado) dibujarIconoJefe(ctx, m.num, 65, 44, 52)
    else {
      ctx.fillStyle = '#ced4da'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🔒', 65, 44)
    }

    const etiqueta = document.createElement('span')
    etiqueta.className = 'planeta-nombre'
    etiqueta.textContent = desbloqueado
      ? `Mundo ${m.num}${hecho ? ' ✓' : ''}`
      : `Mundo ${m.num} 🔒`
    const sub = document.createElement('span')
    sub.className = 'planeta-sub'
    sub.textContent = desbloqueado
      ? NOMBRES[i]
      : `Pásate el Mundo ${m.num - 1}`

    card.append(lienzo, etiqueta, sub)
    if (desbloqueado) {
      card.addEventListener('click', () => {
        mundoVista = m.num
        cerrarDialogo()
        const entrar = (): void => mostrarMenu(alElegir)
        if (!cinematicaVista(m.num) && cbCinematica) {
          marcarCinematicaVista(m.num)
          cbCinematica(m.num, entrar)
        } else {
          entrar()
        }
      })
    } else {
      card.disabled = true
    }
    galaxia.appendChild(card)
  })

  // planetas "próximamente"
  for (let k = 0; k < 2; k++) {
    const card = document.createElement('button')
    card.className = 'planeta-card proximamente'
    card.disabled = true
    const lienzo = document.createElement('canvas')
    lienzo.width = 130
    lienzo.height = 140
    const ctx = lienzo.getContext('2d')!
    dibujarPlaneta(ctx, 65, 95, 42, '#6c757d')
    ctx.fillStyle = '#f8f9fa'
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', 65, 44)
    const etiqueta = document.createElement('span')
    etiqueta.className = 'planeta-nombre'
    etiqueta.textContent = `Mundo ${MUNDOS.length + 1 + k}`
    const sub = document.createElement('span')
    sub.className = 'planeta-sub'
    sub.textContent = '✨ Próximamente'
    card.append(lienzo, etiqueta, sub)
    galaxia.appendChild(card)
  }

  caja.appendChild(galaxia)

  const cerrar = document.createElement('button')
  cerrar.className = 'boton-grande'
  cerrar.textContent = 'Cerrar'
  cerrar.addEventListener('click', () => {
    cerrarDialogo()
    mostrarMenu(alElegir)
  })
  caja.appendChild(cerrar)

  dialogo.appendChild(caja)
  dialogo.classList.remove('hidden')
}

/** Tienda: se juega con el 1; los demás personajes se compran con monedas. */
function mostrarTienda(alElegir: (nivel: number) => void): void {
  const dialogo = document.getElementById('dialogo')!
  dialogo.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'dialogo-caja'

  const titulo = document.createElement('p')
  titulo.className = 'puerta-pregunta'
  titulo.textContent = `🛍️ Tienda · 🪙 ${cargarMonedero()}`

  const pista = document.createElement('p')
  pista.className = 'tutorial-texto'
  pista.textContent = 'Consigue monedas en los niveles para comprar personajes'

  const rejilla = document.createElement('div')
  rejilla.className = 'tienda-rejilla'

  const personajes = cargarPersonajes()
  for (let n = 1; n <= 25; n++) {
    const celda = document.createElement('button')
    celda.className = 'tienda-celda'

    const mini = document.createElement('canvas')
    mini.width = 56
    mini.height = 66
    const ctx = mini.getContext('2d')!
    const forma = FORMAS[n]
    const colsF = Math.max(...forma.map(([c]) => c)) + 1
    const rowsF = Math.max(...forma.map(([, r]) => r)) + 1
    dibujarPersonaje(ctx, n, 28, 62, 1, Math.min(40 / colsF, 56 / rowsF))

    const etiqueta = document.createElement('span')
    const comprado = personajes.comprados.includes(n)
    const equipado = personajes.equipado === n
    if (equipado) {
      etiqueta.textContent = '✔ Puesto'
      celda.classList.add('equipado')
    } else if (comprado) {
      etiqueta.textContent = 'Elegir'
    } else {
      etiqueta.textContent = `🪙 ${precioPersonaje(n)}`
      if (cargarMonedero() < precioPersonaje(n)) celda.classList.add('caro')
    }

    celda.addEventListener('click', () => {
      if (equipado) return
      if (comprado) {
        equiparPersonaje(n)
      } else if (!comprarPersonaje(n)) {
        etiqueta.textContent = '¡Faltan 🪙!'
        setTimeout(() => (etiqueta.textContent = `🪙 ${precioPersonaje(n)}`), 1200)
        return
      }
      void guardarEnFichero()
      mostrarTienda(alElegir) // re-pinta con el nuevo estado
    })

    celda.append(mini, etiqueta)
    rejilla.appendChild(celda)
  }

  const cerrar = document.createElement('button')
  cerrar.className = 'boton-grande'
  cerrar.textContent = 'Cerrar'
  cerrar.addEventListener('click', () => {
    cerrarDialogo()
    mostrarMenu(alElegir) // refresca la hucha del botón
  })

  caja.append(titulo, pista, rejilla, cerrar)
  dialogo.appendChild(caja)
  dialogo.classList.remove('hidden')
}

function cerrarDialogo(): void {
  const dialogo = document.getElementById('dialogo')!
  dialogo.classList.add('hidden')
  dialogo.innerHTML = ''
}

const TUTORIALES: Record<string, { emoji: string; titulo: string; texto: string }> = {
  gafas: {
    emoji: '🕶️',
    titulo: '¡Gafas de invisibilidad!',
    texto:
      'Te hacen INVISIBLE 8 segundos: los vigilantes no podrán verte. Se guardan en tu mochila — toca su icono a la izquierda cuando las necesites.',
  },
  arcoiris: {
    emoji: '🌈',
    titulo: '¡Arcoíris volador!',
    texto:
      'Te deja VOLAR 10 segundos manteniendo pulsado el botón de salto. Toca su icono a la izquierda cuando quieras despegar.',
  },
  sombrero: {
    emoji: '🎩',
    titulo: '¡Sombrero mágico!',
    texto:
      'Te TELETRANSPORTA: actívalo con su icono a la izquierda y después toca el lugar de la pantalla al que quieras viajar.',
  },
  cubo: {
    emoji: '🎲',
    titulo: '¡Cubo de Rubik!',
    texto:
      'Es tu ARMA: te da 3 cubos para lanzar. Toca su icono (o la tecla 4) y el cubo rueda hacia delante; aplasta hasta 2 bichos o le quita una vida al monstruo final.',
  },
  estrella: {
    emoji: '🌟',
    titulo: '¡Estrella invencible!',
    texto:
      'Actívala con su icono (o la tecla 5): durante unos segundos atropellas a todos los bichos y no te hacen daño. ¡Cuidado, el monstruo final no muere con ella!',
  },
}

/** Tarjeta explicativa de un ítem (primera vez que se recoge). */
export function mostrarTutorialPoder(tipo: string, alCerrar: () => void): void {
  const info = TUTORIALES[tipo]
  if (!info) {
    alCerrar()
    return
  }
  const dialogo = document.getElementById('dialogo')!
  dialogo.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'dialogo-caja'

  const emoji = document.createElement('div')
  emoji.className = 'tutorial-emoji'
  emoji.textContent = info.emoji

  const titulo = document.createElement('p')
  titulo.className = 'puerta-pregunta'
  titulo.textContent = info.titulo

  const texto = document.createElement('p')
  texto.className = 'tutorial-texto'
  texto.textContent = info.texto

  const ok = document.createElement('button')
  ok.className = 'boton-grande'
  ok.textContent = '¡Entendido!'
  ok.addEventListener('click', () => {
    cerrarDialogo()
    alCerrar()
  })

  caja.append(emoji, titulo, texto, ok)
  dialogo.appendChild(caja)
  dialogo.classList.remove('hidden')
}

/** Diálogo de contraseña para desbloquear todos los niveles. */
function pedirContrasena(alElegir: (nivel: number) => void): void {
  const dialogo = document.getElementById('dialogo')!
  dialogo.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'dialogo-caja'

  const texto = document.createElement('p')
  texto.className = 'puerta-pregunta'
  texto.textContent = '🔐 Contraseña'

  const entrada = document.createElement('input')
  entrada.className = 'entrada-clave'
  entrada.type = 'password'
  entrada.inputMode = 'numeric'
  entrada.maxLength = 8
  entrada.placeholder = '····'

  const error = document.createElement('p')
  error.className = 'dialogo-error'

  const fila = document.createElement('div')
  fila.className = 'fila-botones'
  const ok = document.createElement('button')
  ok.className = 'boton-grande'
  ok.textContent = 'Entrar'
  const comprobar = (): void => {
    if (entrada.value === CONTRASENA_DESBLOQUEO) {
      guardarAjustes({ ...cargarAjustes(), desbloqueado: true })
      cerrarDialogo()
      mostrarMenu(alElegir)
    } else {
      error.textContent = '❌ Contraseña incorrecta'
      entrada.value = ''
      entrada.focus()
    }
  }
  ok.addEventListener('click', comprobar)
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') comprobar()
  })
  const cancelar = document.createElement('button')
  cancelar.className = 'boton-grande secundario'
  cancelar.textContent = 'Cancelar'
  cancelar.addEventListener('click', cerrarDialogo)
  fila.append(ok, cancelar)

  caja.append(texto, entrada, error, fila)
  dialogo.appendChild(caja)
  dialogo.classList.remove('hidden')
  entrada.focus()
}

/** Diálogo de ajustes: sonido, controles grandes y borrar progreso. */
function abrirAjustes(alElegir: (nivel: number) => void): void {
  const dialogo = document.getElementById('dialogo')!
  dialogo.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'dialogo-caja'

  const texto = document.createElement('p')
  texto.className = 'puerta-pregunta'
  texto.textContent = '⚙️ Ajustes'
  caja.appendChild(texto)

  const filaOpcion = (
    etiqueta: string,
    valor: boolean,
    alCambiar: (v: boolean) => void,
    iconoOn = '🔔',
    iconoOff = '🔕',
  ): HTMLButtonElement => {
    const btn = document.createElement('button')
    btn.className = 'ajuste-fila'
    let actual = valor
    const pintar = (): void => {
      btn.textContent = `${actual ? iconoOn : iconoOff} ${etiqueta}: ${actual ? 'SÍ' : 'NO'}`
    }
    btn.addEventListener('click', () => {
      actual = !actual
      alCambiar(actual)
      pintar()
    })
    pintar()
    return btn
  }

  const ajustes = cargarAjustes()
  const filaSonido = filaOpcion('Sonido', ajustes.sonido, (v) => {
    const a = { ...cargarAjustes(), sonido: v }
    guardarAjustes(a)
    aplicarAjustes(a)
  })

  // Tamaño de los botones táctiles: pequeño → mediano → grande (cíclico)
  const TAMANOS = ['pequeno', 'mediano', 'grande'] as const
  const NOMBRE_TAMANO = { pequeno: 'PEQUEÑOS', mediano: 'MEDIANOS', grande: 'GRANDES' }
  const filaControles = document.createElement('button')
  filaControles.className = 'ajuste-fila'
  const pintarTamano = (): void => {
    filaControles.textContent = `🎮 Botones táctiles: ${NOMBRE_TAMANO[cargarAjustes().tamanoControles]}`
  }
  filaControles.addEventListener('click', () => {
    const a = cargarAjustes()
    const siguiente = TAMANOS[(TAMANOS.indexOf(a.tamanoControles) + 1) % TAMANOS.length]
    const nuevo = { ...a, tamanoControles: siguiente }
    guardarAjustes(nuevo)
    aplicarAjustes(nuevo)
    pintarTamano()
  })
  pintarTamano()
  caja.append(filaSonido, filaControles)

  const borrar = document.createElement('button')
  borrar.className = 'ajuste-fila peligro'
  borrar.textContent = '🗑️ Borrar progreso'
  borrar.addEventListener('click', () => {
    if (borrar.dataset.confirmar !== '1') {
      borrar.dataset.confirmar = '1'
      borrar.textContent = '⚠️ ¿Seguro? Estrellas, monedas y personajes. Toca otra vez'
      return
    }
    // borrado total: niveles, hucha, personajes comprados y tutoriales
    localStorage.removeItem('salta-numeros-v1')
    localStorage.removeItem('salta-numeros-monedero')
    localStorage.removeItem('salta-numeros-personajes')
    localStorage.removeItem('salta-numeros-tutoriales')
    void guardarEnFichero() // que el fichero del lanzador no lo "resucite"
    cerrarDialogo()
    mostrarMenu(alElegir)
  })
  caja.appendChild(borrar)

  const cerrar = document.createElement('button')
  cerrar.className = 'boton-grande'
  cerrar.textContent = 'Cerrar'
  cerrar.addEventListener('click', () => {
    cerrarDialogo()
    mostrarMenu(alElegir) // refresca por si se borró el progreso
  })
  caja.appendChild(cerrar)

  dialogo.appendChild(caja)
  dialogo.classList.remove('hidden')
}

export interface DatosResultado {
  nivel: number
  tiempoMs: number
  estrellas: number
  mejorMs: number
  esNuevoRecord: boolean
  monedas: number
  totalMonedas: number
  /** título alternativo (p. ej. el del nivel final) */
  titulo?: string
}

/** Pantalla de fin de nivel: estrellas, tiempo, récord y botones. */
export function mostrarResultados(
  datos: DatosResultado,
  alRepetir: () => void,
  alMenu: () => void,
): void {
  const pantalla = document.getElementById('screen-results')!
  pantalla.innerHTML = ''

  const caja = document.createElement('div')
  caja.className = 'resultado-caja'

  const titulo = document.createElement('h2')
  titulo.className = 'titulo'
  titulo.style.fontSize = '40px'
  titulo.textContent = datos.titulo ?? `¡Nivel ${datos.nivel} superado!`

  const estrellas = document.createElement('div')
  estrellas.className = 'resultado-estrellas'
  estrellas.textContent = estrellasTexto(datos.estrellas)
  estrellas.style.color = '#ffb703'

  const tiempo = document.createElement('p')
  tiempo.className = 'resultado-tiempo'
  tiempo.textContent = `Tiempo: ${formatearTiempo(datos.tiempoMs)}`

  const record = document.createElement('p')
  record.className = 'resultado-record'
  record.textContent = datos.esNuevoRecord
    ? '🎉 ¡Nuevo récord!'
    : `Mejor tiempo: ${formatearTiempo(datos.mejorMs)}`

  const monedas = document.createElement('p')
  monedas.className = 'resultado-tiempo'
  monedas.textContent =
    datos.totalMonedas > 0 ? `Monedas: ${datos.monedas} / ${datos.totalMonedas}` : ''

  const fila = document.createElement('div')
  fila.className = 'fila-botones'
  const btnRepetir = document.createElement('button')
  btnRepetir.className = 'boton-grande'
  btnRepetir.textContent = '🔁 Repetir'
  btnRepetir.addEventListener('click', alRepetir)
  const btnMenu = document.createElement('button')
  btnMenu.className = 'boton-grande secundario'
  btnMenu.textContent = '🏠 Niveles'
  btnMenu.addEventListener('click', alMenu)
  fila.append(btnRepetir, btnMenu)

  caja.append(titulo, estrellas, tiempo, monedas, record, fila)
  pantalla.appendChild(caja)
  pantalla.classList.remove('hidden')
  lanzarConfeti(datos.estrellas)
}

/** Lluvia de confeti al superar un nivel (más cantidad con más estrellas). */
function lanzarConfeti(estrellas: number): void {
  const EMOJIS = ['🎉', '⭐', '🎊', '✨', '🟥', '🟨', '🟦', '🟩']
  const cuantos = 14 + estrellas * 8
  for (let i = 0; i < cuantos; i++) {
    const s = document.createElement('span')
    s.className = 'confeti'
    s.textContent = EMOJIS[(i * 7 + estrellas) % EMOJIS.length]
    s.style.left = `${((i * 37 + 13) % 96) + 2}%`
    s.style.animationDuration = `${1.8 + ((i * 13) % 10) / 6}s`
    s.style.animationDelay = `${((i * 11) % 8) / 10}s`
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 4200)
  }
}

export function ocultarPantallas(): void {
  document.getElementById('screen-menu')!.classList.add('hidden')
  document.getElementById('screen-results')!.classList.add('hidden')
  document.getElementById('door-modal')!.classList.add('hidden')
  document.getElementById('dialogo')!.classList.add('hidden')
}
