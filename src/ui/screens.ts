import { COLORES, NIVELES, NIVEL_FINAL, TOTAL_NIVELES } from '../levels/index'
import { cargarProgreso, nivelDesbloqueado } from '../storage/progress'
import { cargarAjustes, guardarAjustes, type Ajustes } from '../storage/settings'
import { setSonidoActivado } from '../game/sound'

const CONTRASENA_DESBLOQUEO = '1566'

/** Aplica los ajustes guardados (al arrancar y al cambiarlos). */
export function aplicarAjustes(ajustes: Ajustes = cargarAjustes()): void {
  setSonidoActivado(ajustes.sonido)
  document.body.classList.toggle('controles-grandes', ajustes.controlesGrandes)
}

export function formatearTiempo(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

export function estrellasTexto(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n)
}

/** Pinta el menú principal con la rejilla de niveles. */
export function mostrarMenu(alElegir: (nivel: number) => void): void {
  const pantalla = document.getElementById('screen-menu')!
  const progreso = cargarProgreso()
  const ajustes = cargarAjustes()
  const modoAbierto = ajustes.desbloqueado

  pantalla.innerHTML = ''
  const titulo = document.createElement('h1')
  titulo.className = 'titulo'
  titulo.textContent = '🔢 Salta Números'
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

  // Fila inferior: ajustes y desbloqueo con contraseña
  const fila = document.createElement('div')
  fila.className = 'fila-botones'

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

  fila.append(btnAjustes, btnDesbloquear)

  pantalla.append(titulo, subtitulo, rejilla, btnFinal, fila)
  pantalla.classList.remove('hidden')
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
  const filaControles = filaOpcion(
    'Botones gigantes',
    ajustes.controlesGrandes,
    (v) => {
      const a = { ...cargarAjustes(), controlesGrandes: v }
      guardarAjustes(a)
      aplicarAjustes(a)
    },
    '🎮',
    '🎮',
  )
  caja.append(filaSonido, filaControles)

  const borrar = document.createElement('button')
  borrar.className = 'ajuste-fila peligro'
  borrar.textContent = '🗑️ Borrar progreso'
  borrar.addEventListener('click', () => {
    if (borrar.dataset.confirmar !== '1') {
      borrar.dataset.confirmar = '1'
      borrar.textContent = '⚠️ ¿Seguro? Se pierden estrellas y tiempos. Toca otra vez'
      return
    }
    localStorage.removeItem('salta-numeros-v1')
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
}

export function ocultarPantallas(): void {
  document.getElementById('screen-menu')!.classList.add('hidden')
  document.getElementById('screen-results')!.classList.add('hidden')
  document.getElementById('door-modal')!.classList.add('hidden')
  document.getElementById('dialogo')!.classList.add('hidden')
}
