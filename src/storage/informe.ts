// Informe para papá: registro de TODAS las preguntas de mates que responde el
// jugador (pregunta, fallos, si acertó, nivel y fecha) + resumen por tipo de
// operación. Se consulta y descarga desde Ajustes → 📊 Informe.

export interface RegistroPregunta {
  /** fecha y hora (ISO) en que se respondió */
  fecha: string
  nivel: number
  tipo: string
  pregunta: string
  /** respuestas equivocadas antes de acertar (o de rendirse) */
  fallos: number
  acertada: boolean
}

export interface Informe {
  registros: RegistroPregunta[]
}

const CLAVE = 'salta-numeros-informe'
const MAX_REGISTROS = 1000 // de sobra para meses de juego; evita crecer sin fin

/** Nombres bonitos de cada tipo de puerta, para el informe. */
export const NOMBRE_TIPO: Record<string, string> = {
  suma: 'Sumas',
  resta: 'Restas',
  mixta: 'Sumas y restas',
  descomposicion: 'Descomponer números',
  multiplicacion: 'Tablas de multiplicar',
  division: 'Divisiones',
  logica: 'Series lógicas',
  logica2: 'Series difíciles',
  operacion: 'Operaciones de dos pasos',
  reto: 'Reto mezclado',
  reto2: 'Reto difícil',
  reto3: 'Reto muy difícil',
  mitadDoble: 'Dobles y mitades',
  problema: 'Problemas',
}

export function cargarInforme(): Informe {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) {
      const inf = JSON.parse(raw) as Informe
      if (Array.isArray(inf.registros)) return inf
    }
  } catch {
    // sin datos: informe vacío
  }
  return { registros: [] }
}

/** Apunta una pregunta respondida (se llama al cerrar cada puerta/reto). */
export function registrarPregunta(
  nivel: number,
  tipo: string,
  pregunta: string,
  fallos: number,
  acertada: boolean,
): void {
  try {
    const inf = cargarInforme()
    inf.registros.push({
      fecha: new Date().toISOString(),
      nivel,
      tipo,
      pregunta,
      fallos,
      acertada,
    })
    if (inf.registros.length > MAX_REGISTROS) {
      inf.registros.splice(0, inf.registros.length - MAX_REGISTROS)
    }
    localStorage.setItem(CLAVE, JSON.stringify(inf))
  } catch {
    // sin almacenamiento: el juego sigue sin registrar
  }
}

export interface ResumenTipo {
  tipo: string
  nombre: string
  preguntas: number
  alaPrimera: number
  fallosTotales: number
}

/** Resumen por tipo de operación (para la tabla del informe). */
export function resumenPorTipo(inf: Informe = cargarInforme()): ResumenTipo[] {
  const porTipo = new Map<string, ResumenTipo>()
  for (const r of inf.registros) {
    let s = porTipo.get(r.tipo)
    if (!s) {
      s = {
        tipo: r.tipo,
        nombre: NOMBRE_TIPO[r.tipo] ?? r.tipo,
        preguntas: 0,
        alaPrimera: 0,
        fallosTotales: 0,
      }
      porTipo.set(r.tipo, s)
    }
    s.preguntas++
    if (r.acertada && r.fallos === 0) s.alaPrimera++
    s.fallosTotales += r.fallos
  }
  return [...porTipo.values()].sort((a, b) => b.preguntas - a.preguntas)
}

/** Texto plano del informe completo (lo que se descarga). */
export function textoInforme(): string {
  const inf = cargarInforme()
  const lineas: string[] = []
  lineas.push('📊 INFORME DE MATES — Salta Números')
  lineas.push(`Generado: ${new Date().toLocaleString('es-ES')}`)
  lineas.push(`Preguntas registradas: ${inf.registros.length}`)
  lineas.push('')
  lineas.push('=== RESUMEN POR TIPO DE OPERACIÓN ===')
  for (const s of resumenPorTipo(inf)) {
    const pct = Math.round((s.alaPrimera / s.preguntas) * 100)
    lineas.push(
      `· ${s.nombre}: ${s.preguntas} preguntas, ${s.alaPrimera} a la primera (${pct} %), ${s.fallosTotales} fallos en total`,
    )
  }
  lineas.push('')
  lineas.push('=== TODAS LAS PREGUNTAS (de la más reciente a la más antigua) ===')
  lineas.push('FECHA Y HORA | NIVEL | PREGUNTA | FALLOS | RESULTADO')
  for (const r of [...inf.registros].reverse()) {
    const fecha = new Date(r.fecha).toLocaleString('es-ES')
    const resultado = r.acertada ? (r.fallos === 0 ? '✓ a la primera' : `✓ tras ${r.fallos} fallo(s)`) : '✗ sin acertar'
    lineas.push(`${fecha} | nivel ${r.nivel} | ${r.pregunta} | ${r.fallos} | ${resultado}`)
  }
  return lineas.join('\r\n')
}

/** Descarga el informe como fichero de texto. */
export function descargarInforme(): void {
  const blob = new Blob(['﻿' + textoInforme()], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informe-mates-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
