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
const controles = document.getElementById('controls')!
document.getElementById('hud-exit')!.addEventListener('click', irAlMenu)

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
  player.respawn(level)
  tiempoMs = 0
  erroresPuertas = 0
  resetInput()
  renderer.setRows(level.rows)
  ocultarPantallas()
  hudLevel.textContent = String(n)
  hudLevel.style.background = data.color
  hud.classList.remove('hidden')
  controles.classList.remove('hidden')
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
  const { progreso, esNuevoRecord } = guardarResultado(nivelActual, ms, estrellas)
  controles.classList.add('hidden')
  mostrarResultados(
    {
      nivel: nivelActual,
      tiempoMs: ms,
      estrellas,
      mejorMs: progreso[nivelActual].bestMs,
      esNuevoRecord,
    },
    () => empezarNivel(nivelActual),
    irAlMenu,
  )
}

function update(dt: number): void {
  if (estado !== 'jugando' || !level) return
  tiempoMs += dt * 1000
  hudTimer.textContent = formatearTiempo(tiempoMs)

  player.update(dt, level)

  if (player.haMuerto(level)) {
    sonido.golpe()
    player.respawn(level)
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
  }
}
