import { COLORES, NIVELES, TOTAL_NIVELES } from '../levels/index'
import { cargarProgreso, nivelDesbloqueado } from '../storage/progress'

export function formatearTiempo(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

export function estrellasTexto(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n)
}

/** Pinta el menú principal con la rejilla de niveles 1–10. */
export function mostrarMenu(alElegir: (nivel: number) => void): void {
  const pantalla = document.getElementById('screen-menu')!
  const progreso = cargarProgreso()

  pantalla.innerHTML = ''
  const titulo = document.createElement('h1')
  titulo.className = 'titulo'
  titulo.textContent = '🔢 Salta Números'
  const subtitulo = document.createElement('p')
  subtitulo.className = 'subtitulo'
  subtitulo.textContent = 'Elige un nivel'

  const rejilla = document.createElement('div')
  rejilla.className = 'niveles'

  for (let n = 1; n <= TOTAL_NIVELES; n++) {
    const btn = document.createElement('button')
    btn.className = 'nivel-btn'
    const desbloqueado = nivelDesbloqueado(n, progreso) && n in NIVELES

    if (desbloqueado) {
      btn.style.background = COLORES[n]
      const num = document.createElement('span')
      num.textContent = String(n)
      const estrellas = document.createElement('span')
      estrellas.className = 'estrellas'
      estrellas.textContent = estrellasTexto(progreso[n]?.stars ?? 0)
      btn.append(num, estrellas)
      btn.addEventListener('click', () => alElegir(n))
    } else {
      btn.classList.add('bloqueado')
      btn.textContent = n in NIVELES || n <= TOTAL_NIVELES ? '🔒' : '?'
      btn.disabled = true
    }
    rejilla.appendChild(btn)
  }

  pantalla.append(titulo, subtitulo, rejilla)
  pantalla.classList.remove('hidden')
}

export interface DatosResultado {
  nivel: number
  tiempoMs: number
  estrellas: number
  mejorMs: number
  esNuevoRecord: boolean
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
  titulo.textContent = `¡Nivel ${datos.nivel} superado!`

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

  caja.append(titulo, estrellas, tiempo, record, fila)
  pantalla.appendChild(caja)
  pantalla.classList.remove('hidden')
}

export function ocultarPantallas(): void {
  document.getElementById('screen-menu')!.classList.add('hidden')
  document.getElementById('screen-results')!.classList.add('hidden')
  document.getElementById('door-modal')!.classList.add('hidden')
}
