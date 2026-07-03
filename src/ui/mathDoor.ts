import type { Pregunta } from '../math/questions'
import { sonido } from '../game/sound'

/** Fila de bloquecitos de colores (estilo Numberblocks) para contar. */
function filaBloques(cuantos: number, color: string, tachados = 0): HTMLElement {
  const fila = document.createElement('div')
  fila.className = 'fila-bloques'
  for (let i = 0; i < cuantos; i++) {
    const b = document.createElement('span')
    b.className = 'bloq'
    b.style.background = color
    if (i >= cuantos - tachados) b.classList.add('bloq-tachado')
    fila.appendChild(b)
  }
  return fila
}

/**
 * PISTA visual al fallar: dibuja la operación con bloquecitos para contarla.
 * Entiende "a + b", "a − b", "a × b", "a ÷ b", "DOBLE de a" y "MITAD de a";
 * para el resto (series, problemas) da un ánimo para pensar con calma.
 */
function crearPista(texto: string): HTMLElement {
  const caja = document.createElement('div')
  caja.className = 'puerta-pista'
  const op = texto.match(/(\d+)\s*([+−×÷])\s*(\d+)/)
  const doble = texto.match(/DOBLE de (\d+)/)
  const mitad = texto.match(/MITAD de (\d+)/)
  const ROJO = '#e63946'
  const AZUL = '#3a86ff'

  if (op) {
    const a = Number(op[1])
    const b = Number(op[3])
    const simbolo = op[2]
    if (simbolo === '+' && a <= 12 && b <= 12) {
      caja.append(filaBloques(a, ROJO), texto1('y'), filaBloques(b, AZUL), texto1('¡Cuéntalos todos!'))
      return caja
    }
    if (simbolo === '−' && a <= 14) {
      caja.append(filaBloques(a, ROJO, b), texto1(`Tacha ${b} y cuenta los que quedan`))
      return caja
    }
    if (simbolo === '×' && a <= 9 && b <= 9) {
      for (let i = 0; i < a; i++) caja.appendChild(filaBloques(b, i % 2 ? AZUL : ROJO))
      caja.appendChild(texto1(`${a} filas de ${b}: ¡cuéntalos!`))
      return caja
    }
    if (simbolo === '÷' && a <= 48 && b <= 9) {
      const porFila = a / b
      if (Number.isInteger(porFila) && porFila <= 12) {
        for (let i = 0; i < b; i++) caja.appendChild(filaBloques(porFila, i % 2 ? AZUL : ROJO))
        caja.appendChild(texto1(`${a} repartidos en ${b} filas iguales`))
        return caja
      }
    }
  }
  if (doble) {
    const a = Number(doble[1])
    if (a <= 12) {
      caja.append(filaBloques(a, ROJO), filaBloques(a, AZUL), texto1('Dos veces lo mismo'))
      return caja
    }
  }
  if (mitad) {
    const a = Number(mitad[1])
    if (a <= 24) {
      caja.append(filaBloques(a / 2, ROJO), filaBloques(a / 2, AZUL), texto1('Repártelos en dos partes iguales'))
      return caja
    }
  }
  caja.appendChild(texto1('🧮 Piénsalo despacio, paso a paso. ¡Tú puedes!'))
  return caja
}

function texto1(t: string): HTMLElement {
  const p = document.createElement('p')
  p.className = 'pista-texto'
  p.textContent = t
  return p
}

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
        // al primer fallo, aparece la pista visual con bloquecitos
        if (errores === 1) caja.appendChild(crearPista(pregunta.texto))
      }
    })
    fila.appendChild(btn)
  })

  caja.append(cerrar, texto, fila)
  modal.appendChild(caja)
  modal.classList.remove('hidden')
}
