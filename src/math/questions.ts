import type { DoorSpec } from '../levels/types'

export interface Pregunta {
  texto: string
  opciones: string[]
  correcta: number // índice de la opción correcta
}

const azar = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1))

function barajar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Monta la pregunta con la respuesta correcta y 2 distractores cercanos.
 * `techo` acota los distractores al rango del nivel (p. ej. sumas hasta 5).
 */
function conDistractores(texto: string, correcto: number, techo?: number): Pregunta {
  const opciones = new Set<number>([correcto])
  while (opciones.size < 3) {
    const desvio = azar(1, 3) * (Math.random() < 0.5 ? -1 : 1)
    const candidato = correcto + desvio
    if (candidato >= 0 && (techo === undefined || candidato <= techo)) {
      opciones.add(candidato)
    }
  }
  const lista = barajar([...opciones]).map(String)
  return { texto, opciones: lista, correcta: lista.indexOf(String(correcto)) }
}

export function generarPregunta(spec: DoorSpec): Pregunta {
  switch (spec.tipo) {
    case 'suma': {
      const a = azar(1, spec.max - 1)
      const b = azar(1, spec.max - a)
      return conDistractores(`${a} + ${b} = ?`, a + b, spec.max)
    }
    case 'resta': {
      const a = azar(2, spec.max)
      const b = azar(1, a - 1)
      return conDistractores(`${a} − ${b} = ?`, a - b, spec.max)
    }
    case 'mixta':
      return generarPregunta({
        tipo: Math.random() < 0.5 ? 'suma' : 'resta',
        max: spec.max,
      })
    case 'descomposicion': {
      const total = azar(Math.max(3, spec.max - 2), spec.max)
      const a = azar(1, total - 1)
      const correcto = `${a} y ${total - a}`
      const opciones = new Set<string>([correcto])
      while (opciones.size < 3) {
        const x = azar(1, total)
        const y = azar(1, total)
        if (x + y !== total) opciones.add(`${x} y ${y}`)
      }
      const lista = barajar([...opciones])
      return {
        texto: `¿Qué dos números forman el ${total}?`,
        opciones: lista,
        correcta: lista.indexOf(correcto),
      }
    }
    case 'multiplicacion': {
      const a = azar(2, Math.min(9, spec.max))
      const b = azar(2, Math.min(9, spec.max))
      return conDistractores(`${a} × ${b} = ?`, a * b)
    }
    case 'division': {
      const b = azar(2, Math.min(9, spec.max))
      const c = azar(2, Math.min(9, spec.max))
      return conDistractores(`${b * c} ÷ ${b} = ?`, c)
    }
    case 'logica2': {
      const patron = azar(1, 3)
      if (patron === 1) {
        // serie geométrica: cada número es el doble
        const a = azar(1, 3)
        return conDistractores(`${a}, ${a * 2}, ${a * 4}, ¿?`, a * 8)
      }
      if (patron === 2) {
        // serie descendente
        const paso = azar(2, 4)
        const inicio = azar(paso * 3 + 1, 20)
        const serie = [inicio, inicio - paso, inicio - paso * 2]
        return conDistractores(`${serie.join(', ')}, ¿?`, inicio - paso * 3)
      }
      // saltos grandes
      const paso = azar(4, 6)
      const inicio = azar(1, 6)
      const serie = [inicio, inicio + paso, inicio + paso * 2]
      return conDistractores(`${serie.join(', ')}, ¿?`, inicio + paso * 3)
    }
    case 'operacion': {
      if (Math.random() < 0.5) {
        const a = azar(1, 4)
        const b = azar(1, 4)
        const c = azar(2, 3)
        return conDistractores(`(${a} + ${b}) × ${c} = ?`, (a + b) * c)
      }
      const a = azar(2, 5)
      const b = azar(2, 4)
      const c = azar(1, Math.min(5, a * b - 1))
      return conDistractores(`${a} × ${b} − ${c} = ?`, a * b - c)
    }
    case 'reto2': {
      const tipos = ['multiplicacion', 'division', 'logica2', 'operacion'] as const
      return generarPregunta({
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        max: 9,
      })
    }
    case 'reto': {
      const tipos = ['multiplicacion', 'division', 'logica'] as const
      return generarPregunta({
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        max: spec.max,
      })
    }
    case 'logica': {
      // Serie: continúa la secuencia (saltos de 2 o 3)
      const paso = azar(2, 3)
      const inicio = azar(1, 4)
      const serie = [inicio, inicio + paso, inicio + paso * 2]
      return conDistractores(`${serie.join(', ')}, ¿?`, inicio + paso * 3)
    }
  }
}
