import { COLORES, NIVELES, NIVEL_FINAL, TOTAL_NIVELES } from '../levels/index'
import { cargarProgreso, nivelDesbloqueado } from '../storage/progress'

export function formatearTiempo(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

export function estrellasTexto(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n)
}

// Truco para papás: 7 toques en el título desbloquean todos los niveles
// (solo durante la sesión; no toca el progreso guardado)
let modoAbierto = false
let toquesTitulo = 0

/** Pinta el menú principal con la rejilla de niveles. */
export function mostrarMenu(alElegir: (nivel: number) => void): void {
  const pantalla = document.getElementById('screen-menu')!
  const progreso = cargarProgreso()

  pantalla.innerHTML = ''
  const titulo = document.createElement('h1')
  titulo.className = 'titulo'
  titulo.textContent = '🔢 Salta Números'
  titulo.addEventListener('click', () => {
    if (++toquesTitulo >= 7 && !modoAbierto) {
      modoAbierto = true
      mostrarMenu(alElegir)
    }
  })
  const subtitulo = document.createElement('p')
  subtitulo.className = 'subtitulo'
  subtitulo.textContent = modoAbierto ? '🔓 Todos los niveles abiertos' : 'Elige un nivel'

  const rejilla = document.createElement('div')
  rejilla.className = 'niveles'

  for (let n = 1; n <= TOTAL_NIVELES; n++) {
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
      btn.textContent = n in NIVELES || n <= TOTAL_NIVELES ? '🔒' : '?'
      btn.disabled = true
    }
    rejilla.appendChild(btn)
  }

  // Botón del nivel final: se abre al completar el nivel 10
  const btnFinal = document.createElement('button')
  btnFinal.className = 'final-btn'
  if ((modoAbierto || nivelDesbloqueado(NIVEL_FINAL, progreso)) && NIVEL_FINAL in NIVELES) {
    const hecho = progreso[NIVEL_FINAL]?.completed
    btnFinal.textContent = hecho
      ? `⭐ ¡Salva a Xiana otra vez! ${estrellasTexto(progreso[NIVEL_FINAL]?.stars ?? 0)}`
      : '⭐ NIVEL FINAL: ¡salva a Xiana!'
    btnFinal.addEventListener('click', () => alElegir(NIVEL_FINAL))
  } else {
    btnFinal.classList.add('bloqueado')
    btnFinal.textContent = `🔒 Completa el nivel ${TOTAL_NIVELES} para salvar a Xiana`
    btnFinal.disabled = true
  }

  pantalla.append(titulo, subtitulo, rejilla, btnFinal)
  pantalla.classList.remove('hidden')
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
}

export function ocultarPantallas(): void {
  document.getElementById('screen-menu')!.classList.add('hidden')
  document.getElementById('screen-results')!.classList.add('hidden')
  document.getElementById('door-modal')!.classList.add('hidden')
}
