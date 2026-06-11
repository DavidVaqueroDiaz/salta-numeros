// Cinemática de inicio:
//   1. "Juego creado por David Vaquero"
//   2. "Para Joel Vaquero" ❤
//   3. Un cubo de Rubik gira… y estalla convirtiéndose en los 10 personajes.
// Se salta tocando la pantalla.
import { dibujarPersonaje, COLOR_CUERPO } from '../engine/character'

const DURACION = 13.5
const PALETA_RUBIK = ['#e63946', '#f77f00', '#ffd60a', '#52b788', '#3a86ff', '#ffffff']

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const easeOut = (v: number): number => 1 - (1 - v) ** 3
/** rebote elástico sencillo para los "pop" */
const pop = (v: number): number =>
  v >= 1 ? 1 : 1 - 2 ** (-8 * v) * Math.cos(v * 9) * (1 - v)

function fade(t: number, entrada: number, plenoFin: number, salida: number): number {
  if (t < entrada || t > salida) return 0
  if (t < entrada + 0.5) return clamp01((t - entrada) / 0.5)
  if (t > plenoFin) return clamp01(1 - (t - plenoFin) / (salida - plenoFin))
  return 1
}

export class Intro {
  t = 0
  terminado = false

  update(dt: number): void {
    this.t += dt
    if (this.t >= DURACION) this.terminado = true
  }

  draw(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const t = this.t
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Fondo nocturno con estrellas que parpadean
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1d3557')
    g.addColorStop(1, '#3d5a80')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 40; i++) {
      const sx = (i * 977) % w
      const sy = (i * 389) % Math.round(h * 0.7)
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`
      ctx.fillRect(sx, sy, 2, 2)
    }

    const fuente = (px: number): string => `bold ${Math.round(px)}px 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // --- Créditos ---
    const a1 = fade(t, 0.3, 2.6, 3.4)
    if (a1 > 0) {
      ctx.globalAlpha = a1
      ctx.fillStyle = '#a8dadc'
      ctx.font = fuente(h * 0.045)
      ctx.fillText('Juego creado por', w / 2, h * 0.4)
      ctx.fillStyle = '#ffffff'
      ctx.font = fuente(h * 0.085)
      ctx.fillText('David Vaquero', w / 2, h * 0.5)
      ctx.globalAlpha = 1
    }
    const a2 = fade(t, 3.6, 5.4, 6.1)
    if (a2 > 0) {
      ctx.globalAlpha = a2
      ctx.fillStyle = '#a8dadc'
      ctx.font = fuente(h * 0.045)
      ctx.fillText('Para', w / 2, h * 0.38)
      ctx.fillStyle = '#ffd60a'
      ctx.font = fuente(h * 0.09)
      ctx.fillText('Joel Vaquero', w / 2, h * 0.48)
      ctx.font = fuente(h * 0.07)
      ctx.fillText('❤️', w / 2, h * 0.6)
      ctx.globalAlpha = 1
    }

    // --- Cubo de Rubik ---
    const cuboCx = w / 2
    const cuboCy = h * 0.45
    const R = h * 0.13
    if (t >= 6 && t < 9.6) {
      const entrada = easeOut(clamp01((t - 6) / 0.5))
      const salida = t > 9.2 ? clamp01(1 - (t - 9.2) / 0.4) : 1
      const esc = entrada * salida
      if (esc > 0.01) {
        this.cubo(ctx, cuboCx, cuboCy + Math.sin(t * 2.4) * h * 0.012, R * esc, (t - 6) * 1.6)
      }
    }

    // --- Estallido y personajes en fila ---
    const bs = Math.min(h * 0.052, w / 30)
    const colsPorNumero = [1, 1, 1, 2, 1, 2, 2, 2, 3, 2]
    const hueco = bs * 0.9
    const totalW = colsPorNumero.reduce((s, c) => s + c * bs, 0) + hueco * 9
    const sueloY = h * 0.8
    if (t >= 9.2) {
      // suelo de césped
      ctx.fillStyle = '#67c26b'
      ctx.fillRect(0, sueloY, w, h * 0.045)
      ctx.fillStyle = '#b07d4f'
      ctx.fillRect(0, sueloY + h * 0.045, w, h)

      let cursor = (w - totalW) / 2
      for (let n = 1; n <= 10; n++) {
        const anchoN = colsPorNumero[n - 1] * bs
        const cx = cursor + anchoN / 2
        cursor += anchoN + hueco
        const tVuelo = 9.2 + (n - 1) * 0.14
        if (t < tVuelo) continue
        const vuelo = clamp01((t - tVuelo) / 0.4)
        if (vuelo < 1) {
          // cubito de color volando del cubo a su sitio
          const vx = cuboCx + (cx - cuboCx) * easeOut(vuelo)
          const vy = cuboCy + (sueloY - bs - cuboCy) * easeOut(vuelo) - Math.sin(vuelo * Math.PI) * h * 0.12
          ctx.fillStyle = COLOR_CUERPO[n]
          ctx.save()
          ctx.translate(vx, vy)
          ctx.rotate(vuelo * Math.PI * 2)
          ctx.fillRect(-bs / 2, -bs / 2, bs, bs)
          ctx.restore()
        } else {
          // ¡pop! aparece el personaje
          const esc = pop(clamp01((t - tVuelo - 0.4) / 0.5))
          ctx.save()
          ctx.translate(cx, sueloY)
          ctx.scale(esc, esc)
          dibujarPersonaje(ctx, n, 0, 0, 1, bs)
          ctx.restore()
        }
      }
    }

    // --- Título final ---
    if (t >= 10.8) {
      const caida = pop(clamp01((t - 10.8) / 0.7))
      ctx.fillStyle = '#ffd60a'
      ctx.font = fuente(h * 0.11)
      ctx.fillText('Salta Números', w / 2, h * (0.55 - 0.35 * caida))
    }

    // --- Pista para saltar ---
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4)
    ctx.fillStyle = '#ffffff'
    ctx.font = fuente(h * 0.032)
    ctx.fillText(t > 10.8 ? 'Toca para empezar' : 'Toca para saltar la intro', w / 2, h * 0.94)
    ctx.globalAlpha = 1
  }

  /** Cubo de Rubik con falsa perspectiva, girando sobre su eje vertical. */
  private cubo(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    R: number,
    giro: number,
  ): void {
    const alto = R * 1.7
    // 4 esquinas de la sección horizontal del cubo, proyectadas
    const esquinas = [0, 1, 2, 3].map((i) => {
      const a = giro + i * (Math.PI / 2) + Math.PI / 4
      return {
        x: cx + Math.cos(a) * R,
        d: Math.sin(a), // profundidad: >0 = hacia el espectador
      }
    })
    const topY = (e: { d: number }): number => cy - alto / 2 + e.d * R * 0.32

    const quad = (
      p: { x: number; y: number }[],
      relleno: (u: number, v: number) => string,
    ): void => {
      // pinta una cara 3×3 interpolando el cuadrilátero
      const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, f: number) => ({
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      })
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const m = 0.06
          const u0 = i / 3 + m / 3
          const u1 = (i + 1) / 3 - m / 3
          const v0 = j / 3 + m / 3
          const v1 = (j + 1) / 3 - m / 3
          const punto = (u: number, v: number) =>
            lerp(lerp(p[0], p[1], u), lerp(p[3], p[2], u), v)
          const e1 = punto(u0, v0)
          const e2 = punto(u1, v0)
          const e3 = punto(u1, v1)
          const e4 = punto(u0, v1)
          ctx.fillStyle = relleno(i, j)
          ctx.beginPath()
          ctx.moveTo(e1.x, e1.y)
          ctx.lineTo(e2.x, e2.y)
          ctx.lineTo(e3.x, e3.y)
          ctx.lineTo(e4.x, e4.y)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    // fondo oscuro SOLO dentro de cada cara (las juntas entre pegatinas)
    const caraFondo = (p: { x: number; y: number }[]): void => {
      ctx.fillStyle = '#101418'
      ctx.beginPath()
      ctx.moveTo(p[0].x, p[0].y)
      for (let k = 1; k < p.length; k++) ctx.lineTo(p[k].x, p[k].y)
      ctx.closePath()
      ctx.fill()
    }

    // caras laterales visibles
    for (let i = 0; i < 4; i++) {
      const e1 = esquinas[i]
      const e2 = esquinas[(i + 1) % 4]
      if (e1.d + e2.d <= 0) continue // mira hacia atrás
      const y1 = topY(e1)
      const y2 = topY(e2)
      const sombra = 0.75 + 0.25 * ((e1.d + e2.d) / 2)
      const cara = [
        { x: e1.x, y: y1 },
        { x: e2.x, y: y2 },
        { x: e2.x, y: y2 + alto },
        { x: e1.x, y: y1 + alto },
      ]
      caraFondo(cara)
      quad(
        cara,
        (u, v) => {
          const base = PALETA_RUBIK[(i * 7 + u * 3 + v * 5) % 6]
          const n = parseInt(base.slice(1), 16)
          const r = Math.round(((n >> 16) & 255) * sombra)
          const gg = Math.round(((n >> 8) & 255) * sombra)
          const b = Math.round((n & 255) * sombra)
          return `rgb(${r},${gg},${b})`
        },
      )
    }

    // cara superior
    const caraTop = esquinas.map((e) => ({ x: e.x, y: topY(e) }))
    caraFondo(caraTop)
    quad(caraTop, (u, v) => PALETA_RUBIK[(u * 5 + v * 7 + 2) % 6])
  }
}
