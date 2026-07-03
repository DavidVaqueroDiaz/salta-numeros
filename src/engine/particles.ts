// Partículas ligeras para dar "jugo" al juego: chispas al coger monedas,
// polvo al aterrizar y estrellitas al pisotear bichos. Sin dependencias:
// el renderer las dibuja y main.ts las actualiza y las emite.

interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
  vidaMax: number
  radio: number
  color: string
  gravedad: number
}

export class Particulas {
  private readonly lista: Particula[] = []

  /** Chispas doradas que explotan en círculo (coger una moneda). */
  moneda(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2
      const vel = 90 + (i % 3) * 40
      this.lista.push({
        x,
        y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel - 40,
        vida: 0.45,
        vidaMax: 0.45,
        radio: 3,
        color: i % 2 === 0 ? '#ffd60a' : '#fff3b0',
        gravedad: 300,
      })
    }
  }

  /** Nubecillas de polvo a los lados (aterrizaje fuerte). */
  polvo(x: number, y: number): void {
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        this.lista.push({
          x: x + lado * 6,
          y: y - 3,
          vx: lado * (50 + i * 35),
          vy: -30 - i * 15,
          vida: 0.35,
          vidaMax: 0.35,
          radio: 4 - i,
          color: 'rgba(255,255,255,0.8)',
          gravedad: 150,
        })
      }
    }
  }

  /** Estrellitas al aplastar un bicho (pisotón o cubo). */
  pisoton(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI * (0.15 + 0.7 * (i / 5))
      this.lista.push({
        x,
        y,
        vx: Math.cos(ang) * 130,
        vy: Math.sin(ang) * 130,
        vida: 0.5,
        vidaMax: 0.5,
        radio: 3,
        color: i % 2 === 0 ? '#ffd60a' : '#e63946',
        gravedad: 420,
      })
    }
  }

  update(dt: number): void {
    for (const p of this.lista) {
      p.vida -= dt
      p.vy += p.gravedad * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    // quita las muertas sin recolocar el array entero cada frame
    for (let i = this.lista.length - 1; i >= 0; i--) {
      if (this.lista[i].vida <= 0) this.lista.splice(i, 1)
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.lista) {
      const f = p.vida / p.vidaMax
      ctx.globalAlpha = f
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radio * (0.5 + 0.5 * f), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /** Vacía todas (al cambiar de nivel). */
  limpiar(): void {
    this.lista.length = 0
  }
}
