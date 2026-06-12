import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { startLoop } from './engine/loop'
import { resetInput, setupInput } from './engine/input'
import { Renderer } from './engine/renderer'
import { Level, TILE, seSolapan, type Door } from './game/level'
import { Player } from './game/player'
import { sonido } from './game/sound'
import { NIVELES, NIVEL_FINAL } from './levels/index'
import { generarPregunta } from './math/questions'
import { abrirPuertaMatematica } from './ui/mathDoor'
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
import { Intro } from './ui/intro'

registerSW({ immediate: true })

type Estado = 'intro' | 'menu' | 'jugando' | 'puerta' | 'resultados'

let estado: Estado = 'intro'
let intro: Intro | null = new Intro()
let personajeEquipado = cargarPersonajes().equipado
let level: Level | null = null
let nivelActual = 1
let tiempoMs = 0
let erroresPuertas = 0
const player = new Player()

const canvasJuego = document.getElementById('game') as HTMLCanvasElement
const renderer = new Renderer(canvasJuego)
setupInput()

// La intro se salta tocando en cualquier parte
window.addEventListener('pointerdown', () => {
  if (estado === 'intro' && intro) intro.terminado = true
})

const hud = document.getElementById('hud')!
const hudLevel = document.getElementById('hud-level')!
const hudTimer = document.getElementById('hud-timer')!
const hudCoins = document.getElementById('hud-coins')!
const controles = document.getElementById('controls')!
document.getElementById('hud-exit')!.addEventListener('click', irAlMenu)

function actualizarMonedasHud(): void {
  if (!level) return
  const recogidas = level.monedas.filter((m) => m.recogida).length
  hudCoins.textContent = `● ${recogidas}/${level.monedas.length}`
  hudCoins.classList.toggle('hidden', level.monedas.length === 0)
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
  hud.classList.add('hidden')
  controles.classList.add('hidden')
  document.getElementById('poderes')!.classList.add('hidden')
  ocultarPantallas()
  mostrarMenu(empezarNivel)
}

function empezarNivel(n: number): void {
  const data = NIVELES[n]
  if (!data) return
  nivelActual = n
  level = new Level(data)
  personajeEquipado = cargarPersonajes().equipado
  player.empezar(level)
  tiempoMs = 0
  erroresPuertas = 0
  resetInput()
  ocultarPantallas()
  hudLevel.textContent = String(n)
  hudLevel.style.background = data.color
  hud.classList.remove('hidden')
  controles.classList.remove('hidden')
  actualizarMonedasHud()
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
    abrirPuertaMatematica(generarPregunta(d.spec), (res) => {
      erroresPuertas += res.errores
      if (res.acertada) d.abierta = true
      else retroceder(d)
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

function terminarNivel(): void {
  if (!level) return
  estado = 'resultados'
  sonido.victoria()
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
        nivelActual === NIVEL_FINAL ? '❤️ ¡Has salvado a Xiana!' : undefined,
    },
    () => empezarNivel(nivelActual),
    irAlMenu,
  )
}

function morir(): void {
  if (!level) return
  sonido.golpe()
  player.respawn()
  player.limpiarPoderes()
  // todo lo reintentable vuelve a su sitio
  level.caedizas.forEach((p) => p.reset())
  level.items.forEach((i) => (i.recogido = false))
  level.vigilantes.forEach((v) => (v.enfadado = false))
  if (level.jefe) level.jefe.bolas.length = 0
}

// --- Iconos de poderes (lado izquierdo): tocar para activar ---
const poderes = document.getElementById('poderes')!
const botonPoder = {
  gafas: document.getElementById('poder-gafas')!,
  arcoiris: document.getElementById('poder-arcoiris')!,
  sombrero: document.getElementById('poder-sombrero')!,
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

// Atajos de teclado: 1 = gafas, 2 = arcoíris, 3 = sombrero (y siguientes
// números para futuros poderes, en el mismo orden que los iconos)
window.addEventListener('keydown', (e) => {
  if (estado !== 'jugando') return
  if (e.key === '1') botonPoder.gafas.click()
  else if (e.key === '2') botonPoder.arcoiris.click()
  else if (e.key === '3') botonPoder.sombrero.click()
})

function actualizarPoderHud(): void {
  const hudPoder = document.getElementById('hud-power')!
  const partes: string[] = []
  if (player.invisibleT > 0) partes.push(`🕶️ ${Math.ceil(player.invisibleT)}`)
  if (player.volarT > 0) partes.push(`🌈 ${Math.ceil(player.volarT)}`)
  if (player.teleUsos > 0) partes.push('🎩 toca el destino')
  hudPoder.textContent = partes.join('  ')
  hudPoder.classList.toggle('hidden', partes.length === 0)

  // iconos: visibles si tienes el ítem o si su poder está activo
  const estadoPorTipo = {
    gafas: { activoT: player.invisibleT, sufijo: 's' },
    arcoiris: { activoT: player.volarT, sufijo: 's' },
    sombrero: { activoT: player.teleUsos > 0 ? 1 : 0, sufijo: '' },
  } as const
  let algunoVisible = false
  for (const tipo of ['gafas', 'arcoiris', 'sombrero'] as const) {
    const btn = botonPoder[tipo]
    const cuantos = player.inventario[tipo]
    const activo = estadoPorTipo[tipo].activoT > 0
    const visible = cuantos > 0 || activo
    btn.classList.toggle('hidden', !visible)
    btn.classList.toggle('activo', activo)
    if (visible) {
      algunoVisible = true
      const emoji = tipo === 'gafas' ? '🕶️' : tipo === 'arcoiris' ? '🌈' : '🎩'
      const tecla = tipo === 'gafas' ? '1' : tipo === 'arcoiris' ? '2' : '3'
      btn.textContent = activo
        ? tipo === 'sombrero'
          ? `${emoji}…`
          : `${emoji}${Math.ceil(estadoPorTipo[tipo].activoT)}`
        : `${tecla}·${emoji}×${cuantos}`
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
  if (estado !== 'jugando' || !level) return
  tiempoMs += dt * 1000
  hudTimer.textContent = formatearTiempo(tiempoMs)

  level.moviles.forEach((p) => p.update(dt))
  level.caedizas.forEach((p) => p.update(dt))
  level.parpadeantes.forEach((p) => p.update(dt))
  level.enemigos.forEach((e) => e.update(dt, level!))

  player.update(dt, level)

  // Ítems de poder: se guardan en el inventario (iconos de la izquierda)
  for (const item of level.items) {
    if (item.recogido || !seSolapan(player.rect(), item.rect())) continue
    item.recogido = true
    sonido.checkpoint()
    player.inventario[item.tipo]++
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
    }
    avisar(`${nombres[item.tipo]} — toca su icono cuando lo necesites`)
  }

  // Vigilantes: te persiguen si te ven (y no estás invisible)
  const invisible = player.invisibleT > 0
  for (const v of level.vigilantes) {
    v.update(dt, level, player.rect(), invisible)
    if (v.muerto || !seSolapan(player.rect(), v.rect())) continue
    const piesJugador = player.y + player.h
    if (player.vy > 100 && piesJugador < v.y + v.h * 0.7) {
      v.muerto = true
      v.squashT = 0.4
      player.vy = -340
      sonido.pisoton()
    } else {
      morir()
      break
    }
  }

  // Peces con pinchos: no se pueden pisar, solo esquivar
  for (const pez of level.peces) {
    pez.update(dt, level)
    if (seSolapan(player.rect(), pez.rect())) {
      morir()
      break
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
          abrirPuertaMatematica(generarPregunta({ tipo: 'reto', max: 5 }), (res) => {
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
            } else {
              avisar('💪 ¡Salta sobre él y prueba otra vez!')
            }
            estado = 'jugando'
          })
        }
      } else {
        morir()
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
    if (player.vy > 100 && piesJugador < e.y + e.h * 0.7) {
      e.muerto = true
      e.squashT = 0.4
      player.vy = -340 // rebote
      sonido.pisoton()
    } else {
      morir()
      break
    }
  }

  if (player.haMuerto(level)) morir()

  // Monedas
  for (const m of level.monedas) {
    if (!m.recogida && seSolapan(player.rect(), m.rect())) {
      m.recogida = true
      sonido.moneda()
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
  if (estado === 'menu') mostrarMenu(empezarNivel) // refresca candados/estrellas
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
