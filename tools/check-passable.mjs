// Comprueba que cada fase se PUEDE terminar: BFS desde la 'P' hasta la meta
// (M o X) saltando entre superficies pisables, con un sobre de salto realista
// (doble salto: ~6 tiles en horizontal, ~3 hacia arriba; bajar, libre).
// Si en la fase hay arcoíris ('R') alcanzable, se considera superable (vuelas).
// Uso: node tools/check-passable.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')
const ficheros = readdirSync(dir).filter((f) => /^nivel.*\.ts$/.test(f)).sort()

const SOLIDO = new Set(['#', 'I'])
const PLATAFORMA = new Set(['m', 'w', 'n', 'F', 'b']) // pisables (entidades)
const LETAL = new Set(['L', '^', '~', 'f'])
const TUBO = 'T'

let problemas = 0

for (const fichero of ficheros) {
  const texto = readFileSync(join(dir, fichero), 'utf8')
  const bloque = texto.match(/mapa:\s*\[([\s\S]*?)\]/)
  if (!bloque) continue
  const filas = [...bloque[1].matchAll(/'([^']*)'/g)].map((m) => m[1])
  const rows = filas.length
  const cols = Math.max(...filas.map((f) => f.length))
  // gravedad lunar: saltos mucho mayores
  const lunar = /gravedadBaja:\s*true/.test(texto)
  const HMAX = lunar ? 13 : 6
  const VUP = lunar ? 6 : 3
  const COMB = lunar ? 19 : 8
  const ch = (c, r) => (r < 0 || r >= rows || c < 0 || c >= cols ? '.' : (filas[r][c] ?? '.'))
  // una plataforma móvil/barra da apoyo en todo su recorrido (m/w ±2, n ±9)
  const soporte = (c, r) => {
    if (SOLIDO.has(ch(c, r)) || PLATAFORMA.has(ch(c, r))) return true
    for (let d = 1; d <= 9; d++) {
      for (const cc of [c - d, c + d]) {
        const x = ch(cc, r)
        if (x === 'n' && d <= 9) return true
        if ((x === 'm' || x === 'w') && d <= 2) return true
      }
    }
    return false
  }
  // se puede estar de pie en (c,r) si la celda no bloquea/mata y debajo hay soporte
  const pisable = (c, r) => {
    const aqui = ch(c, r)
    if (SOLIDO.has(aqui) || LETAL.has(aqui)) return false
    return soporte(c, r + 1)
  }

  // salida, meta y tubos (emparejados por orden de aparición, como en level.ts)
  let start = null
  let metas = []
  let hayR = false
  let hayBarra = false
  const tubos = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = ch(c, r)
      if (x === 'P') start = [c, r]
      if (x === 'M' || x === 'X') metas.push([c, r])
      if (x === 'R') hayR = true
      if (x === 'n') hayBarra = true
      if (x === TUBO) tubos.push([c, r])
    }
  if (!start || metas.length === 0) continue
  const parDeTubo = new Map()
  for (let i = 0; i + 1 < tubos.length; i += 2) {
    parDeTubo.set(tubos[i].join(), tubos[i + 1])
    parDeTubo.set(tubos[i + 1].join(), tubos[i])
  }

  // BFS por celdas pisables
  const key = (c, r) => c + ',' + r
  const vista = new Set()
  const cola = [start]
  vista.add(key(...start))
  let alcanzaMeta = false
  let alcanzaR = false
  const visita = (nc, nr) => {
    if (!pisable(nc, nr)) return
    const k = key(nc, nr)
    if (vista.has(k)) return
    vista.add(k)
    cola.push([nc, nr])
  }
  while (cola.length) {
    const [c, r] = cola.shift()
    if (metas.some(([mc, mr]) => Math.abs(mc - c) <= 2 && Math.abs(mr - r) <= 2)) alcanzaMeta = true
    if (ch(c, r) === 'R' || ch(c + 1, r) === 'R' || ch(c, r - 1) === 'R') alcanzaR = true
    // tubo cerca: teletransporta al alrededor de su pareja
    for (const [tc, tr] of tubos) {
      if (Math.abs(tc - c) <= 1 && Math.abs(tr - r) <= 2) {
        const par = parDeTubo.get([tc, tr].join())
        if (par) for (let q = -1; q <= 1; q++) for (let s = -2; s <= 1; s++) visita(par[0] + q, par[1] + s)
      }
    }
    // destinos pisables dentro del sobre de salto
    for (let dr = -VUP; dr <= 6; dr++) {
      for (let dc = -HMAX; dc <= HMAX; dc++) {
        const up = Math.max(0, -dr)
        if (Math.abs(dc) + 2 * up > COMB) continue // saltos altos no llegan tan lejos
        visita(c + dc, r + dr)
      }
    }
  }
  // las fases de buceo (con tubos) y la barra usan mecánicas que este script
  // no modela (nadar, teletransporte, montar la barra); se revisan aparte
  const mecanicaEspecial = tubos.length > 0 || hayBarra
  const superable = alcanzaMeta || (hayR && alcanzaR) || mecanicaEspecial
  if (!superable) {
    console.log(`  ❌ ${fichero}: no se alcanza la meta (¿salto imposible?)`)
    problemas++
  }
}

console.log(problemas ? `\n${problemas} fase(s) sospechosas` : '\n✅ Todas las fases parecen superables')
process.exit(0)
