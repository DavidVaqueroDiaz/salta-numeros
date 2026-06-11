import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { startLoop } from './engine/loop'
import { resetInput, setupInput } from './engine/input'
import { Renderer } from './engine/renderer'
import { Level, seSolapan, type Door } from './game/level'
import { Player } from './game/player'
import { sonido } from './game/sound'
import { NIVELES } from './levels/index'
import { generarPregunta } from './math/questions'
import { abrirPuertaMatematica } from './ui/mathDoor'
import {
  formatearTiempo,
  mostrarMenu,
  mostrarResultados,
  ocultarPantallas,
} from './ui/screens'
import { guardarResultado } from './storage/progress'

registerSW({ immediate: true })

type Estado = 'menu' | 'jugando' | 'puerta' | 'resultados'

let estado: Estado = 'menu'
let level: Level | null = null
let nivelActual = 1
let tiempoMs = 0
let erroresPuertas = 0
const player = new Player()

const renderer = new Renderer(document.getElementById('game') as HTMLCanvasElement)
setupInput()

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
  ocultarPantallas()
  mostrarMenu(empezarNivel)
}

function empezarNivel(n: number): void {
  const data = NIVELES[n]
  if (!data) return
  nivelActual = n
  level = new Level(data)
  player.empezar(level)
  player.maxSaltos = data.dobleSalto ? 2 : 1
  tiempoMs = 0
  erroresPuertas = 0
  resetInput()
  renderer.setRows(level.rows)
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
    if (d.abierta || !seSolapan(cerca, d.rect)) continue
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
  controles.classList.add('hidden')
  mostrarResultados(
    {
      nivel: nivelActual,
      tiempoMs: ms,
      estrellas,
      mejorMs: progreso[nivelActual].bestMs,
      esNuevoRecord,
      monedas,
      totalMonedas: level.monedas.length,
    },
    () => empezarNivel(nivelActual),
    irAlMenu,
  )
}

function morir(): void {
  if (!level) return
  sonido.golpe()
  player.respawn()
  // las plataformas caídas vuelven a su sitio para poder reintentar
  level.caedizas.forEach((p) => p.reset())
}

function update(dt: number): void {
  if (estado !== 'jugando' || !level) return
  tiempoMs += dt * 1000
  hudTimer.textContent = formatearTiempo(tiempoMs)

  level.moviles.forEach((p) => p.update(dt))
  level.caedizas.forEach((p) => p.update(dt))
  level.enemigos.forEach((e) => e.update(dt, level!))

  player.update(dt, level)

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

  if (seSolapan(player.rect(), level.goal)) terminarNivel()
}

function render(): void {
  if (level) renderer.draw(level, player)
}

startLoop(update, render)
irAlMenu()

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
