import type { Pregunta } from '../math/questions'
import { sonido } from '../game/sound'

export interface ResultadoPuerta {
  acertada: boolean
  errores: number
}

/**
 * Muestra el modal de la puerta matemática.
 * - Acertar: animación verde y callback con los errores cometidos.
 * - Fallar: la opción se tacha y puede seguir intentando.
 * - ✕: cierra sin abrir la puerta (el jugador retrocede y volverá a intentarlo).
 */
export function abrirPuertaMatematica(
  pregunta: Pregunta,
  alTerminar: (resultado: ResultadoPuerta) => void,
): void {
  const modal = document.getElementById('door-modal')!
  let errores = 0
  let resuelto = false

  modal.innerHTML = ''
  const caja = document.createElement('div')
  caja.className = 'puerta-caja'

  const cerrar = document.createElement('button')
  cerrar.className = 'puerta-cerrar'
  cerrar.textContent = '✕'
  cerrar.addEventListener('click', () => {
    if (resuelto) return
    modal.classList.add('hidden')
    alTerminar({ acertada: false, errores })
  })

  const texto = document.createElement('p')
  texto.className = 'puerta-pregunta'
  texto.textContent = pregunta.texto

  const fila = document.createElement('div')
  fila.className = 'puerta-opciones'

  pregunta.opciones.forEach((opcion, i) => {
    const btn = document.createElement('button')
    btn.className = 'opcion-btn'
    btn.textContent = opcion
    btn.addEventListener('click', () => {
      if (resuelto) return
      if (i === pregunta.correcta) {
        resuelto = true
        btn.classList.add('ok')
        sonido.acierto()
        setTimeout(() => {
          modal.classList.add('hidden')
          alTerminar({ acertada: true, errores })
        }, 550)
      } else {
        errores++
        btn.classList.add('mal')
        sonido.fallo()
      }
    })
    fila.appendChild(btn)
  })

  caja.append(cerrar, texto, fila)
  modal.appendChild(caja)
  modal.classList.remove('hidden')
}
