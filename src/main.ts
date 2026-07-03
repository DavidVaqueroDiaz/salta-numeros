import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { startLoop } from './engine/loop'
import { resetInput, setupInput } from './engine/input'
import { Renderer } from './engine/renderer'
import { Level, TILE, seSolapan, type Door } from './game/level'
import { CuboVolando } from './game/entities'
import { Player } from './game/player'
import { sonido } from './game/sound'
import { iniciarMusica, setTemaMusica } from './game/music'
import { MUNDOS, NIVELES, esNivelFinal, mundoDe } from './levels/index'
import { generarPregunta, puertaAjustada } from './math/questions'
import { abrirPuertaMatematica } from './ui/mathDoor'
import { dificultadActual, paramsDificultad } from './game/dificultad'
import {
  aplicarAjustes,
  formatearTiempo,
  mostrarMenu,
  mostrarResultados,
  mostrarTutorialPoder,
  ocultarPantallas,
} from './ui/screens'
import { marcarTutorialVisto, tutorialVisto } from './storage/settings'
import { añadirMonedas, cargarPersonajes } from './storage/shop'
import {
  cargarDesdeFichero,
  guardarEnFichero,
  guardarEnFicheroAlCerrar,
} from './storage/sync'
import { guardarResultado } from './storage/progress'
import { registrarPregunta } from './storage/informe'
import { Intro } from './ui/intro'
import { Cinematica } from './ui/cinematica2'

registerSW({ immediate: true })

type Estado = 'intro' | 'cinematica' | 'menu' | 'jugando' | 'pausa' | 'puerta' | 'resultados'

let estado: Estado = 'intro'
let intro: Intro | null = new Intro()
let cinematica2: Cinematica | null = null
let trasCinematica: (() => void) | null = null
let personajeEquipado = cargarPersonajes().equipado
let level: Level | null = null
let nivelActual = 1
let tiempoMs = 0
let erroresPuertas = 0
let vidas = Infinity // vidas restantes en esta fase (Infinity = modo sin vidas)
let vidasMax = 0 // vidas con las que empieza la fase (para pintar los corazones)
const player = new Player()

const canvasJuego = document.getElementById('game') as HTMLCanvasElement
const renderer = new Renderer(canvasJuego)
setupInput()

// La intro y la cinemática se saltan tocando en cualquier parte
window.addEventListener('pointerdown', () => {
  if (estado === 'intro' && intro) intro.terminado = true
  if (estado === 'cinematica' && cinematica2) cinematica2.terminado = true
})

// La música solo puede arrancar tras el primer toque (política de autoplay)
window.addEventListener('pointerdown', () => iniciarMusica(), { once: true })

const hud = document.getElementById('hud')!
const hudLevel = document.getElementById('hud-level')!
const hudTimer = document.getElementById('hud-timer')!
const hudCoins = document.getElementById('hud-coins')!
const hudLives = document.getElementById('hud-lives')!
const controles = document.getElementById('controls')!
document.getElementById('hud-exit')!.addEventListener('click', irAlMenu)

// --- Pausa: botón ⏸ del HUD, tocar el overlay, o teclas P / Escape ---
const overlayPausa = document.getElementById('pausa')!
function alternarPausa(): void {
  if (estado === 'jugando') {
    estado = 'pausa'
    resetInput()
    overlayPausa.classList.remove('hidden')
  } else if (estado === 'pausa') {
    estado = 'jugando'
    overlayPausa.classList.add('hidden')
  }
}
document.getElementById('hud-pause')!.addEventListener('click', alternarPausa)
overlayPausa.addEventListener('click', alternarPausa)
window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') alternarPausa()
})

function actualizarMonedasHud(): void {
  if (!level) return
  const recogidas = level.monedas.filter((m) => m.recogida).length
  hudCoins.textContent = `● ${recogidas}/${level.monedas.length}`
  hudCoins.classList.toggle('hidden', level.monedas.length === 0)
}

/** Pinta los corazones de vidas (solo en modos con vidas, p. ej. Difícil). */
function actualizarVidasHud(): void {
  if (vidas === Infinity) {
    hudLives.classList.add('hidden')
    return
  }
  const llenos = Math.max(0, vidas)
  hudLives.textContent = '❤️'.repeat(llenos) + '🖤'.repeat(Math.max(0, vidasMax - llenos))
  hudLives.classList.remove('hidden')
}

/** Vibración táctil suave (tablet); silenciosa si el aparato no vibra. */
function vibrar(patron: number | number[]): void {
  try {
    navigator.vibrate?.(patron)
  } catch {
    // sin vibración: no pasa nada
  }
}

let toastTimer = 0
function avisar(texto: string): void {
  const toast = document.getElementById('toast')!
  toast.textContent = texto
  toast.classList.remove('hidden')
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 3500)
}

function irAlMenu(): void {
  estado = 'menu'
  level = null
  setTemaMusica('normal')
  overlayPausa.classList.add('hidden')
  hud.classList.add('hidden')
  controles.classList.add('hidden')
  document.getElementById('poderes')!.classList.add('hidden')
  ocultarPantallas()
  mostrarMenu(empezarNivel, reproducirCinematica)
}

/** Reproduce la cinemática de un mundo (al elegirlo en el selector) y sigue. */
function reproducirCinematica(mundo: number, despues: () => void): void {
  personajeEquipado = cargarPersonajes().equipado
  cinematica2 = new Cinematica(mundo, personajeEquipado)
  trasCinematica = despues
  estado = 'cinematica'
  level = null
  hud.classList.add('hidden')
  controles.classList.add('hidden')
  document.getElementById('poderes')!.classList.add('hidden')
  ocultarPantallas()
}

/**
 * En móvil/tablet abierto desde el navegador, pide pantalla completa para
 * ocultar la barra de direcciones (instalada como app ya va sin barra).
 */
function pantallaCompletaSiTactil(): void {
  const esTactil = window.matchMedia('(pointer: coarse)').matches
  const instalada = window.matchMedia(
    '(display-mode: fullscreen), (display-mode: standalone)',
  ).matches
  if (!esTactil || instalada || document.fullscreenElement) return
  document.documentElement
    .requestFullscreen?.({ navigationUI: 'hide' })
    .catch(() => {})
}

function empezarNivel(n: number): void {
  const data = NIVELES[n]
  if (!data) return
  pantallaCompletaSiTactil() // venimos de un toque: el navegador lo permite
  nivelActual = n
  // el modo de dificultad ya está fijado desde el menú; Level lo lee al nacer
  const vidasModo = paramsDificultad().vidas
  vidasMax = vidasModo ?? 0
  vidas = vidasModo ?? Infinity
  level = new Level(data)
  personajeEquipado = cargarPersonajes().equipado
  player.empezar(level)
  setTemaMusica(level.jefe ? 'jefe' : 'normal')
  renderer.particulas.limpiar()
  overlayPausa.classList.add('hidden')
  tiempoMs = 0
  erroresPuertas = 0
  resetInput()
  ocultarPantallas()
  hudLevel.textContent = String(n)
  hudLevel.style.background = data.color
  hud.classList.remove('hidden')
  controles.classList.remove('hidden')
  actualizarMonedasHud()
  actualizarVidasHud()
  if (data.aviso) avisar(data.aviso)
  estado = 'jugando'
}

/** Si el jugador llega a una puerta cerrada, pausa el juego y pregunta. */
function comprobarPuertas(): void {
  if (!level) return
  const cerca = {
    x: player.x - 6,
    y: player.y - 4,
    w: player.w + 12,
    h: player.h + 8,
  }
  for (const d of level.doors) {
    // la zona de detección ocupa TODA la columna: con doble salto tampoco
    // se puede cruzar una puerta por encima sin responder
    const zona = { x: d.rect.x, y: 0, w: d.rect.w, h: level.heightPx }
    if (d.abierta || !seSolapan(cerca, zona)) continue
    estado = 'puerta' // el cronómetro se pausa: las mates se piensan con calma
    resetInput()
    const spec = puertaAjustada(d.spec, paramsDificultad().mates)
    const preg = generarPregunta(spec)
    abrirPuertaMatematica(preg, (res) => {
      registrarPregunta(nivelActual, spec.tipo, preg.texto, res.errores, res.acertada)
      erroresPuertas += res.errores
      if (res.acertada) {
        d.abierta = true
        // En Difícil: acertar tras fallar 2 veces (por descarte) cuesta una vida
        if (vidas !== Infinity && res.errores >= 2) {
          if (!quitarVida()) avisar('😅 Acertaste por descarte: ¡pierdes una vida! ❤️')
        }
      } else {
        retroceder(d)
      }
      estado = 'jugando'
    })
    return
  }
}

/** Tras cerrar el modal sin acertar, aparta al jugador para no reabrirlo. */
function retroceder(d: Door): void {
  if (player.x + player.w / 2 < d.rect.x + d.rect.w / 2) {
    player.x = d.rect.x - player.w - 20
  } else {
    player.x = d.rect.x + d.rect.w + 20
  }
}

/** Fase que viene después de `n` (la siguiente, el jefe, o el mundo siguiente). */
function nivelSiguiente(n: number): number | null {
  const m = mundoDe(n)
  if (n === m.final) {
    const sig = MUNDOS.find((x) => x.num === m.num + 1)
    return sig ? sig.primero : null
  }
  if (n === m.ultimo) return m.final
  return n + 1 in NIVELES ? n + 1 : null
}

function terminarNivel(): void {
  if (!level) return
  estado = 'resultados'
  sonido.victoria()
  vibrar([60, 40, 60])
  const ms = Math.round(tiempoMs)
  // 1 estrella por completar, +1 sin fallos en las puertas, +1 por rapidez
  const estrellas =
    1 + (erroresPuertas === 0 ? 1 : 0) + (ms <= level.data.parMs ? 1 : 0)
  const monedas = level.monedas.filter((m) => m.recogida).length
  const { progreso, esNuevoRecord } = guardarResultado(
    nivelActual,
    ms,
    estrellas,
    monedas,
    dificultadActual(),
  )
  añadirMonedas(monedas) // a la hucha (para la tienda de personajes)
  void guardarEnFichero() // copia en el fichero del lanzador
  controles.classList.add('hidden')
  document.getElementById('poderes')!.classList.add('hidden')
  mostrarResultados(
    {
      nivel: nivelActual,
      tiempoMs: ms,
      estrellas,
      mejorMs: progreso[nivelActual].bestMs,
      esNuevoRecord,
      monedas,
      totalMonedas: level.monedas.length,
      titulo:
        esNivelFinal(nivelActual) ? '❤️ ¡Has salvado a Xiana!' : undefined,
    },
    () => empezarNivel(nivelActual),
    irAlMenu,
    (() => {
      const sig = nivelSiguiente(nivelActual)
      return sig !== null ? () => empezarNivel(sig) : undefined
    })(),
  )
}

/**
 * Resta una vida en los modos que las usan (Difícil). Si se acaban, reinicia
 * la fase entera desde el principio (ignorando los puntos de control) y
 * devuelve true. En los modos sin vidas no hace nada y devuelve false.
 */
function quitarVida(): boolean {
  if (vidas === Infinity) return false
  vidas--
  actualizarVidasHud()
  if (vidas <= 0) {
    const n = nivelActual
    empezarNivel(n) // vuelve al inicio de la fase, con las vidas otra vez llenas
    avisar('💀 ¡Te quedaste sin vidas! Empiezas la fase otra vez')
    return true
  }
  return false
}

function morir(forzar = false): void {
  if (!level) return
  // recién reaparecido no se muere otra vez (salvo caer fuera del mapa)
  if (!forzar && player.invulnerableT > 0) return
  sonido.golpe()
  vibrar(80)
  if (quitarVida()) return // sin vidas: ya se reinició toda la fase
  player.respawn() // con vidas restantes: reaparece en el último punto de control
  player.limpiarPoderes()
  // todo lo reintentable vuelve a su sitio
  level.caedizas.forEach((p) => p.reset())
  level.items.forEach((i) => (i.recogido = false))
  level.vigilantes.forEach((v) => (v.enfadado = false))
  level.cubosVolando.length = 0
  if (level.jefe) level.jefe.bolas.length = 0
}

// --- Iconos de poderes (lado izquierdo): tocar para activar ---
const poderes = document.getElementById('poderes')!
const botonPoder = {
  gafas: document.getElementById('poder-gafas')!,
  arcoiris: document.getElementById('poder-arcoiris')!,
  sombrero: document.getElementById('poder-sombrero')!,
  cubo: document.getElementById('poder-cubo')!,
  estrella: document.getElementById('poder-estrella')!,
}

botonPoder.gafas.addEventListener('click', () => {
  if (estado !== 'jugando' || player.inventario.gafas <= 0 || player.invisibleT > 0) return
  player.inventario.gafas--
  player.invisibleT = 8
  sonido.acierto()
  avisar('🕶️ ¡Invisible 8 segundos! Los vigilantes no te ven')
})
botonPoder.arcoiris.addEventListener('click', () => {
  if (estado !== 'jugando' || player.inventario.arcoiris <= 0 || player.volarT > 0) return
  player.inventario.arcoiris--
  player.volarT = 10
  sonido.acierto()
  avisar('🌈 ¡Puedes VOLAR 10 segundos! Mantén pulsado el salto')
})
botonPoder.sombrero.addEventListener('click', () => {
  if (estado !== 'jugando' || player.inventario.sombrero <= 0 || player.teleUsos > 0) return
  player.inventario.sombrero--
  player.teleUsos = 1
  sonido.acierto()
  avisar('🎩 Toca la pantalla a donde quieras teletransportarte')
})
botonPoder.cubo.addEventListener('click', () => {
  if (estado !== 'jugando' || !level || player.inventario.cubo <= 0) return
  player.inventario.cubo--
  const cx = player.x + player.w / 2 + player.mirando * (player.w / 2 + 8)
  const cy = player.y + player.h / 2
  level.cubosVolando.push(new CuboVolando(cx, cy, player.mirando))
  sonido.salto() // chasquido de lanzamiento
})
botonPoder.estrella.addEventListener('click', () => {
  if (estado !== 'jugando' || player.inventario.estrella <= 0 || player.estrellaT > 0) return
  player.inventario.estrella--
  player.estrellaT = 9
  sonido.acierto()
  avisar('🌟 ¡Estrella! Atropella a los bichos sin recibir daño')
})

// Atajos de teclado: 1 = gafas, 2 = arcoíris, 3 = sombrero, 4 = cubo de
// Rubik, 5 = estrella (mismo orden que los iconos de la izquierda)
window.addEventListener('keydown', (e) => {
  if (estado !== 'jugando') return
  if (e.key === '1') botonPoder.gafas.click()
  else if (e.key === '2') botonPoder.arcoiris.click()
  else if (e.key === '3') botonPoder.sombrero.click()
  else if (e.key === '4') botonPoder.cubo.click()
  else if (e.key === '5') botonPoder.estrella.click()
})

const EMOJI_PODER = {
  gafas: '🕶️',
  arcoiris: '🌈',
  sombrero: '🎩',
  cubo: '🎲',
  estrella: '🌟',
} as const
const TECLA_PODER = { gafas: '1', arcoiris: '2', sombrero: '3', cubo: '4', estrella: '5' } as const

function actualizarPoderHud(): void {
  const hudPoder = document.getElementById('hud-power')!
  const partes: string[] = []
  if (player.invisibleT > 0) partes.push(`🕶️ ${Math.ceil(player.invisibleT)}`)
  if (player.volarT > 0) partes.push(`🌈 ${Math.ceil(player.volarT)}`)
  if (player.teleUsos > 0) partes.push('🎩 toca el destino')
  if (player.estrellaT > 0) partes.push(`🌟 ${Math.ceil(player.estrellaT)}`)
  hudPoder.textContent = partes.join('  ')
  hudPoder.classList.toggle('hidden', partes.length === 0)

  // segundos restantes de cada poder con tiempo (el cubo no tiene "activo")
  const activoT = {
    gafas: player.invisibleT,
    arcoiris: player.volarT,
    sombrero: player.teleUsos > 0 ? 1 : 0,
    cubo: 0,
    estrella: player.estrellaT,
  } as const
  let algunoVisible = false
  for (const tipo of ['gafas', 'arcoiris', 'sombrero', 'cubo', 'estrella'] as const) {
    const btn = botonPoder[tipo]
    const cuantos = player.inventario[tipo]
    const activo = activoT[tipo] > 0
    const visible = cuantos > 0 || activo
    btn.classList.toggle('hidden', !visible)
    btn.classList.toggle('activo', activo)
    if (visible) {
      algunoVisible = true
      const emoji = EMOJI_PODER[tipo]
      btn.textContent = activo
        ? tipo === 'sombrero'
          ? `${emoji}…`
          : `${emoji}${Math.ceil(activoT[tipo])}`
        : `${TECLA_PODER[tipo]}·${emoji}×${cuantos}`
    }
  }
  poderes.classList.toggle('hidden', !algunoVisible || estado !== 'jugando')
}

function update(dt: number): void {
  if (estado === 'intro' && intro) {
    intro.update(dt)
    if (intro.terminado) {
      intro = null
      irAlMenu()
    }
    return
  }
  if (estado === 'cinematica' && cinematica2) {
    cinematica2.update(dt)
    if (cinematica2.terminado) {
      cinematica2 = null
      estado = 'menu'
      const cb = trasCinematica
      trasCinematica = null
      cb?.()
    }
    return
  }
  if (estado !== 'jugando' || !level) return
  tiempoMs += dt * 1000
  hudTimer.textContent = formatearTiempo(tiempoMs)

  level.moviles.forEach((p) => p.update(dt))
  level.caedizas.forEach((p) => p.update(dt))
  level.parpadeantes.forEach((p) => p.update(dt))
  level.enemigos.forEach((e) => e.update(dt, level!))

  player.update(dt, level)

  // jugo visual: polvo al aterrizar fuerte + avance de las partículas vivas
  if (player.aterrizoFuerte) {
    renderer.particulas.polvo(player.x + player.w / 2, player.y + player.h)
  }
  renderer.particulas.update(dt)

  // Ítems de poder: se guardan en el inventario (iconos de la izquierda)
  for (const item of level.items) {
    if (item.recogido || !seSolapan(player.rect(), item.rect())) continue
    item.recogido = true
    sonido.checkpoint()
    // el cubo de Rubik da 3 lanzamientos por ítem; el resto, 1 uso
    if (item.tipo === 'cubo') player.inventario.cubo += 3
    else player.inventario[item.tipo]++
    if (!tutorialVisto(item.tipo)) {
      // primera vez: tarjeta explicativa con el juego en pausa
      marcarTutorialVisto(item.tipo)
      estado = 'puerta'
      resetInput()
      mostrarTutorialPoder(item.tipo, () => {
        estado = 'jugando'
      })
      break
    }
    const nombres = {
      gafas: '🕶️ Gafas guardadas',
      arcoiris: '🌈 Arcoíris guardado',
      sombrero: '🎩 Sombrero guardado',
      cubo: '🎲 ¡3 cubos de Rubik!',
      estrella: '🌟 Estrella guardada',
    }
    avisar(`${nombres[item.tipo]} — toca su icono cuando lo necesites`)
  }

  // Con la estrella activa atropellas a los bichos sin recibir daño
  const invisible = player.invisibleT > 0
  const estrella = player.estrellaT > 0

  // Vigilantes: te persiguen si te ven (y no estás invisible)
  for (const v of level.vigilantes) {
    v.update(dt, level, player.rect(), invisible)
    if (v.muerto || !seSolapan(player.rect(), v.rect())) continue
    const piesJugador = player.y + player.h
    if (estrella || (player.vy > 100 && piesJugador < v.y + v.h * 0.7)) {
      v.muerto = true
      v.squashT = 0.4
      if (!estrella) player.vy = -340 // con estrella no rebotas: lo atropellas
      sonido.pisoton()
      renderer.particulas.pisoton(v.x + v.w / 2, v.y)
    } else {
      morir()
      break
    }
  }

  // Peces con pinchos: no se pueden pisar, solo esquivar (la estrella te protege)
  for (const pez of level.peces) {
    pez.update(dt, level)
    if (!estrella && seSolapan(player.rect(), pez.rect())) {
      morir()
      break
    }
  }

  // Medusas: flotan arriba y abajo en el agua; tocarlas = respawn
  for (const med of level.medusas) {
    med.update(dt)
    if (!estrella && seSolapan(player.rect(), med.rect())) {
      morir()
      break
    }
  }

  // Trampolines: caerles encima te lanza altísimo (torres del Mundo 4)
  for (const tr of level.trampolines) {
    tr.update(dt)
    if (player.vy > 60 && seSolapan(player.rect(), tr.rect())) {
      player.vy = -880
      player.impulsoT = 0.6 // que el salto variable no recorte el bote
      tr.compresionT = 0.25
      sonido.salto()
      renderer.particulas.polvo(tr.x + tr.w / 2, tr.y)
    }
  }

  // Tubos: tocar la boca te lleva al tubo pareja
  if (player.tuboCooldownT <= 0) {
    for (const tubo of level.tubos) {
      if (!tubo.par || !seSolapan(player.rect(), tubo.rect())) continue
      player.x = tubo.par.x + 4
      player.y = tubo.par.y - player.h - 8
      player.vy = 0
      player.tuboCooldownT = 1.2
      sonido.moneda()
      break
    }
  }

  // Jefe final: pisotón → reto matemático → pierde un corazón
  const jefe = level.jefe
  if (jefe) {
    jefe.update(dt, level, player.rect(), invisible)
    for (const bola of jefe.bolas) {
      if (seSolapan(player.rect(), bola.rect())) {
        if (estrella) continue // la estrella te hace inmune a sus ataques
        bola.viva = false
        morir()
        break
      }
    }
    if (!jefe.muerto && seSolapan(player.rect(), jefe.rect())) {
      const piesJugador = player.y + player.h
      const esPisoton = player.vy > 100 && piesJugador < jefe.y + jefe.h * 0.5
      if (esPisoton) {
        player.vy = -380 // rebote
        sonido.pisoton()
        if (jefe.invulT <= 0) {
          jefe.invulT = 1.2
          estado = 'puerta'
          resetInput()
          const pregJefe = generarPregunta({ tipo: 'reto', max: 5 })
          abrirPuertaMatematica(pregJefe, (res) => {
            registrarPregunta(nivelActual, 'reto', pregJefe.texto, res.errores, res.acertada)
            erroresPuertas += res.errores
            if (res.acertada) {
              jefe.golpear()
              if (jefe.muerto) {
                sonido.victoria()
                if (level?.xiana) level.xiana.libre = true
                avisar('💛 ¡La jaula se ha abierto! Corre con Xiana')
              } else {
                avisar(`💜 ¡Al Comecubos le quedan ${jefe.vidas} corazones!`)
              }
              if (vidas !== Infinity && res.errores >= 2) quitarVida()
            } else {
              avisar('💪 ¡Salta sobre él y prueba otra vez!')
            }
            estado = 'jugando'
          })
        }
      } else if (jefe.tipo === 'tornado') {
        // el Remolino te hace girar y te lanza fuera de la plataforma
        if (!estrella && jefe.flingT <= 0) {
          const dir = player.x + player.w / 2 < jefe.x + jefe.w / 2 ? -1 : 1
          player.empujar(dir * 460, -440)
          jefe.flingT = 1.1
          sonido.golpe()
        }
      } else if (!estrella) {
        morir() // con estrella no te hace daño, pero tampoco le dañas a él
      }
    }
  }

  // Xiana: tocarla (ya libre) completa el nivel final
  if (level.xiana?.libre && seSolapan(player.rect(), level.xiana.rect())) {
    terminarNivel()
  }

  // Enemigos: saltar encima los aplasta; chocar de lado manda al respawn
  for (const e of level.enemigos) {
    if (e.muerto || !seSolapan(player.rect(), e.rect())) continue
    const piesJugador = player.y + player.h
    if (estrella || (player.vy > 100 && piesJugador < e.y + e.h * 0.7)) {
      e.muerto = true
      e.squashT = 0.4
      if (!estrella) player.vy = -340 // rebote (con estrella lo atropellas)
      sonido.pisoton()
      renderer.particulas.pisoton(e.x + e.w / 2, e.y)
    } else {
      morir()
      break
    }
  }

  // Cubos de Rubik lanzados: ruedan y aplastan hasta 2 bichos o dañan al jefe
  for (const cubo of level.cubosVolando) {
    cubo.update(dt, level)
    if (!cubo.viva) continue
    if (jefe && !jefe.muerto && jefe.invulT <= 0 && seSolapan(cubo.rect(), jefe.rect())) {
      jefe.invulT = 0.6
      jefe.golpear()
      sonido.pisoton()
      cubo.viva = false
      if (jefe.muerto) {
        sonido.victoria()
        if (level.xiana) level.xiana.libre = true
        avisar('💛 ¡La jaula se ha abierto! Corre con Xiana')
      } else {
        avisar(`💜 ¡Al Comecubos le quedan ${jefe.vidas} corazones!`)
      }
      continue
    }
    for (const bicho of [...level.enemigos, ...level.vigilantes]) {
      if (bicho.muerto || !seSolapan(cubo.rect(), bicho.rect())) continue
      bicho.muerto = true
      bicho.squashT = 0.4
      cubo.kills++
      sonido.pisoton()
      renderer.particulas.pisoton(bicho.x + bicho.w / 2, bicho.y)
      if (cubo.kills >= 2) {
        cubo.viva = false
        break
      }
    }
  }
  if (level.cubosVolando.some((c) => !c.viva)) {
    level.cubosVolando.splice(
      0,
      level.cubosVolando.length,
      ...level.cubosVolando.filter((c) => c.viva),
    )
  }

  // caer fuera del mapa mata SIEMPRE; pinchos/lava respetan la invulnerabilidad
  if (player.y > level.heightPx + 100) morir(true)
  else if (player.haMuerto(level)) morir()

  // Monedas
  for (const m of level.monedas) {
    if (!m.recogida && seSolapan(player.rect(), m.rect())) {
      m.recogida = true
      sonido.moneda()
      renderer.particulas.moneda(m.cx, m.cy)
      actualizarMonedasHud()
    }
  }

  // Puntos de control
  for (const c of level.checkpoints) {
    if (!c.activado && seSolapan(player.rect(), c.rect())) {
      c.activado = true
      player.fijarRespawn(c.x + 4, c.y)
      sonido.checkpoint()
      avisar('🚩 ¡Punto de control!')
    }
  }

  comprobarPuertas()

  actualizarPoderHud()

  if (level.goal.w > 0 && seSolapan(player.rect(), level.goal)) terminarNivel()
}

// 🎩 Teletransporte: con sombrero, tocar la pantalla te lleva allí
document.getElementById('game')!.addEventListener('pointerdown', (e) => {
  if (estado !== 'jugando' || !level || player.teleUsos <= 0) return
  const destino = renderer.pantallaAMundo(e.clientX, e.clientY)
  const c = Math.max(0, Math.min(level.cols - 1, Math.floor(destino.x / TILE)))
  // busca hueco libre subiendo desde el punto tocado (sin meterse en bloques)
  let r = Math.max(0, Math.min(level.rows - 1, Math.floor(destino.y / TILE)))
  let intentos = 0
  while (intentos++ < 8 && (level.esSolido(c, r) || level.esSolido(c, r - 1))) r--
  if (r < 1) return // no había sitio: no gasta el sombrero
  player.teleUsos = 0
  player.x = c * TILE + (TILE - player.w) / 2
  player.y = r * TILE + TILE - player.h - 0.01
  player.vy = 0
  sonido.acierto()
})

function render(): void {
  if (estado === 'intro' && intro) intro.draw(canvasJuego)
  else if (estado === 'cinematica' && cinematica2) cinematica2.draw(canvasJuego)
  else if (level) renderer.draw(level, player, personajeEquipado)
}

aplicarAjustes() // sonido y tamaño de controles guardados en el dispositivo
startLoop(update, render)
ocultarPantallas() // la intro arranca a pantalla limpia; al acabar va al menú

// Recupera el progreso del fichero del lanzador (si existe) y fusiónalo
void cargarDesdeFichero().then((habia) => {
  if (!habia) return
  aplicarAjustes()
  personajeEquipado = cargarPersonajes().equipado
  if (estado === 'menu') mostrarMenu(empezarNivel, reproducirCinematica) // refresca
})

// Al cerrar u ocultar la ventana, vuelca el progreso al fichero
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') guardarEnFicheroAlCerrar()
})

// Gancho de depuración solo en desarrollo (npm run dev)
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__debug = {
    get estado() {
      return estado
    },
    get player() {
      return player
    },
    get level() {
      return level
    },
    empezarNivel,
    teleport(x: number, y: number) {
      player.x = x
      player.y = y
      player.vy = 0
    },
    /** Avanza el juego a mano (para probar aunque la pestaña esté oculta). */
    step(frames = 1, dt = 1 / 60) {
      for (let i = 0; i < frames; i++) update(dt)
      render()
    },
  }
}
