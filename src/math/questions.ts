import type { DoorSpec } from '../levels/types'
import type { Dificultad } from '../game/dificultad'

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
    case 'mitadDoble': {
      if (Math.random() < 0.5) {
        const a = azar(2, Math.min(12, spec.max))
        return conDistractores(`¿El DOBLE de ${a}?`, a * 2)
      }
      const mitad = azar(2, Math.min(12, spec.max))
      return conDistractores(`¿La MITAD de ${mitad * 2}?`, mitad)
    }
    case 'reto3': {
      const tipos = ['multiplicacion', 'division', 'mitadDoble', 'operacion', 'logica2'] as const
      return generarPregunta({
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        max: 12,
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
    case 'problema':
      return problemaMultipaso()
  }
}

/**
 * Problema de varios pasos para el modo difícil. Números pequeños pero hay que
 * hacer dos cuentas seguidas (de las de coger papel y boli), no responder de
 * memoria. Las tres opciones son resultados cercanos para que no valga adivinar.
 */
function problemaMultipaso(): Pregunta {
  const plantilla = azar(1, 6)
  switch (plantilla) {
    case 1: {
      // grupos iguales: a cajas × b cosas
      const a = azar(2, 5)
      const b = azar(3, 6)
      return conDistractores(
        `Hay ${a} cajas y en cada caja ${b} pelotas. ¿Cuántas pelotas hay en total?`,
        a * b,
      )
    }
    case 2: {
      // reparto exacto: total ÷ niños
      const cada = azar(2, 6)
      const ninos = azar(2, 5)
      return conDistractores(
        `${cada * ninos} caramelos se reparten entre ${ninos} niños por igual. ¿Cuántos le tocan a cada uno?`,
        cada,
      )
    }
    case 3: {
      // compra: tienes m, gastas k cromos de p
      const p = azar(2, 5)
      const k = azar(2, 4)
      const sobra = azar(2, 8)
      const m = k * p + sobra
      return conDistractores(
        `Tienes ${m} monedas. Compras ${k} cromos que cuestan ${p} monedas cada uno. ¿Cuántas monedas te quedan?`,
        sobra,
      )
    }
    case 4: {
      // suma de tres pasos
      const a = azar(3, 9)
      const b = azar(2, 8)
      const c = azar(2, 7)
      return conDistractores(
        `En el árbol hay ${a} pájaros. Llegan ${b} y después ${c} más. ¿Cuántos pájaros hay ahora?`,
        a + b + c,
      )
    }
    case 5: {
      // grupos menos una parte: a bolsas de b, se comen c
      const a = azar(2, 4)
      const b = azar(3, 5)
      const c = azar(1, a * b - 1)
      return conDistractores(
        `Compras ${a} bolsas con ${b} manzanas cada una y te comes ${c}. ¿Cuántas manzanas quedan?`,
        a * b - c,
      )
    }
    default: {
      // diferencia de dos grupos
      const a = azar(4, 9)
      const b = azar(4, 9)
      const grandes = Math.max(a, b)
      const peques = Math.min(a, b)
      return conDistractores(
        `Ana tiene ${grandes} cromos y Luis tiene ${peques}. ¿Cuántos cromos más tiene Ana que Luis?`,
        grandes - peques,
      )
    }
  }
}

/**
 * Ajusta la puerta según el modo de dificultad.
 * - Fácil: la puerta tal cual la define el nivel.
 * - Medio: los mismos tipos de operación pero con números un poco más grandes.
 * - Difícil: la mayoría de las veces, un problema de varios pasos; el resto,
 *   como en Medio. (Las preguntas del jefe ya vienen sin tocar.)
 */
export function puertaAjustada(spec: DoorSpec, mates: Dificultad): DoorSpec {
  if (mates === 'facil') return spec
  if (mates === 'dificil' && Math.random() < 0.6) {
    return { tipo: 'problema', max: spec.max }
  }
  const subida = mates === 'dificil' ? 6 : 4
  return { tipo: spec.tipo, max: spec.max + subida }
}
