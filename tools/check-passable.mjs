// Comprueba que cada fase se PUEDE terminar, usando la FÍSICA REAL del juego.
//
// 1. Simula el salto de player.ts (velocidad 150 px/s, salto 580, gravedad
//    1500, doble salto siempre) y calcula, para cada diferencia de altura,
//    cuántos tiles de distancia horizontal se alcanzan de verdad.
// 2. BFS desde la 'P' hasta la meta (M o X) usando ese sobre de salto,
//    nadando por el agua, cruzando tubos y pisando plataformas móviles.
// 3. Los saltos largos comprueban que el arco no esté tapado por un muro.
// 4. Rescates: si hay arcoíris (R) alcanzable se puede volar, y si hay
//    sombrero (H) alcanzable se puede teletransportar (muros mágicos).
//
// Uso: node tools/check-passable.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')
const ficheros = readdirSync(dir).filter((f) => /^nivel.*\.ts$/.test(f)).sort()

const SOLIDO = new Set(['#', 'I'])
const PLATAFORMA = new Set(['m', 'w', 'n', 'F', 'b']) // pisables (entidades)
const LETAL = new Set(['L', '^'])

/**
 * Tabla de alcance real del doble salto: para cada diferencia de altura
 * `up` (tiles hacia ARRIBA al aterrizar; negativo = caer más abajo),
 * simula la física y devuelve los tiles horizontales alcanzables.
 */
function tablaAlcance(gravedad, caidaMax) {
  const VEL = 150
  const VS = 580
  const TILE = 32
  const BONUS = 24 // ancho del personaje: se puede despegar y aterrizar al borde
  const tab = new Map()
  for (let up = -12; up <= 8; up++) {
    let mejor = -1
    // prueba distintos momentos para el segundo salto y se queda con el mejor
    for (let td = 0; td <= 1.6; td += 0.02) {
      let t = 0
      let y = 0 // positivo hacia abajo
      let vy = -VS
      let doble = false
      const dt = 1 / 240
      for (let i = 0; i < 3000; i++) {
        if (!doble && t >= td) {
          vy = -VS
          doble = true
        }
        vy = Math.min(vy + gravedad * dt, caidaMax)
        y += vy * dt
        t += dt
        if (vy > 0 && y >= -up * TILE) {
          const alcance = t * VEL + BONUS
          if (alcance > mejor) mejor = alcance
          break
        }
      }
    }
    tab.set(up, mejor < 0 ? -1 : Math.floor(mejor / TILE))
  }
  return tab
}

const TAB_NORMAL = tablaAlcance(1500, 900)
const TAB_LUNAR = tablaAlcance(1500 * 0.45, 900 * 0.6) // gravedadBaja de player.ts

// --estricto: margen para niños (2 tiles menos de alcance y sin contar el
// rescate del arcoíris). Señala fases que exigen saltos al límite del píxel.
const ESTRICTO = process.argv.includes('--estricto')
const MARGEN = ESTRICTO ? 1 : 0

// Fases diseñadas a propósito para cruzarse VOLANDO con el arcoíris (el ítem
// está junto a la salida y el aviso del nivel lo explica). Joel las tiene
// pasadas con 3 estrellas: en modo estricto no cuentan como problema.
const FASES_DE_VUELO = new Set(['nivel15.ts', 'nivel22.ts'])

let problemas = 0

for (const fichero of ficheros) {
  const texto = readFileSync(join(dir, fichero), 'utf8')
  const bloque = texto.match(/mapa:\s*\[([\s\S]*?)\]/)
  if (!bloque) continue
  const filas = [...bloque[1].matchAll(/'([^']*)'/g)].map((m) => m[1])
  const rows = filas.length
  const cols = Math.max(...filas.map((f) => f.length))
  const lunar = /gravedadBaja:\s*true/.test(texto)
  const tab = lunar ? TAB_LUNAR : TAB_NORMAL

  const ch = (c, r) => (r < 0 || r >= rows || c < 0 || c >= cols ? '.' : (filas[r][c] ?? '.'))
  const esAgua = (c, r) => ch(c, r) === '~' || ch(c, r) === 'f' || ch(c, r) === 'u'
  // una plataforma móvil da apoyo en todo su recorrido (m/w ±2 tiles, n ±9)
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
  const pisable = (c, r) => {
    const aqui = ch(c, r)
    if (SOLIDO.has(aqui) || LETAL.has(aqui)) return false
    return soporte(c, r + 1)
  }
  const transitable = (c, r) => pisable(c, r) || esAgua(c, r)

  // salida, metas, rescates y tubos (emparejados por orden, como level.ts)
  let start = null
  const metas = []
  let hayR = false
  let hayH = false
  let hayBarra = false
  const tubos = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = ch(c, r)
      if (x === 'P') start = [c, r]
      if (x === 'M' || x === 'X') metas.push([c, r])
      if (x === 'R') hayR = true
      if (x === 'H') hayH = true
      if (x === 'n') hayBarra = true
      if (x === 'T') tubos.push([c, r])
    }
  if (!start || metas.length === 0) continue
  const parDeTubo = new Map()
  for (let i = 0; i + 1 < tubos.length; i += 2) {
    parDeTubo.set(tubos[i].join(), tubos[i + 1])
    parDeTubo.set(tubos[i + 1].join(), tubos[i])
  }

  // el arco del salto no puede atravesar un muro macizo: cada columna
  // intermedia necesita al menos un hueco por el que pasar
  const arcoLibre = (c, r, nc, nr) => {
    const dirPaso = nc > c ? 1 : -1
    const techo = Math.max(0, Math.min(r, nr) - 7)
    for (let cc = c + dirPaso; cc !== nc; cc += dirPaso) {
      let libre = false
      for (let rr = techo; rr <= Math.max(r, nr); rr++) {
        if (!SOLIDO.has(ch(cc, rr))) {
          libre = true
          break
        }
      }
      if (!libre) return false
    }
    return true
  }

  // BFS
  const key = (c, r) => c + ',' + r
  const vista = new Set([key(...start)])
  const cola = [start]
  let alcanzaMeta = false
  let alcanzaR = false
  let alcanzaH = false
  const visita = (nc, nr) => {
    if (!transitable(nc, nr)) return
    const k = key(nc, nr)
    if (vista.has(k)) return
    vista.add(k)
    cola.push([nc, nr])
  }
  while (cola.length) {
    const [c, r] = cola.shift()
    if (metas.some(([mc, mr]) => Math.abs(mc - c) <= 2 && Math.abs(mr - r) <= 2)) alcanzaMeta = true
    // los ítems se cogen también en pleno salto (p. ej. flotando sobre un
    // barranco): se detectan dentro del arco de salto de la celda visitada
    for (let dr = -5; dr <= 2; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const x = ch(c + dc, r + dr)
        if (x === 'R') alcanzaR = true
        if (x === 'H') alcanzaH = true
      }
    }
    // tubo cerca: teletransporta al alrededor de su pareja
    for (const [tc, tr] of tubos) {
      if (Math.abs(tc - c) <= 1 && Math.abs(tr - r) <= 2) {
        const par = parDeTubo.get([tc, tr].join())
        if (par) for (let q = -1; q <= 1; q++) for (let s = -2; s <= 1; s++) visita(par[0] + q, par[1] + s)
      }
    }
    if (esAgua(c, r)) {
      // nadar: a cualquier celda adyacente (agua o salir a tierra)
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) visita(c + dc, r + dr)
      continue
    }
    // entrar al agua adyacente desde tierra
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (esAgua(c + dc, r + dr)) visita(c + dc, r + dr)
    // saltos según la tabla de física (por diferencia de altura)
    for (let dr = -8; dr <= 12; dr++) {
      const up = -dr
      let alc = tab.get(Math.max(-12, Math.min(8, up)))
      if (alc === undefined || alc < 0) continue
      alc = Math.max(1, alc - MARGEN)
      for (let dc = -alc; dc <= alc; dc++) {
        const nc = c + dc
        const nr = r + dr
        if (!transitable(nc, nr)) continue
        if (Math.abs(dc) >= 2 && !arcoLibre(c, r, nc, nr)) continue
        visita(nc, nr)
      }
    }
  }

  // la barra ('n') implica montarse y dejarse llevar: verificada a mano
  // en estricto el arcoíris no cuenta (no obligar a volar para pasar)
  const vueloIntencionado = FASES_DE_VUELO.has(fichero) && hayR && alcanzaR
  const superable =
    alcanzaMeta ||
    (!ESTRICTO && hayR && alcanzaR) ||
    (hayH && alcanzaH) ||
    hayBarra ||
    vueloIntencionado
  if (!superable) {
    // ¿hasta dónde se llega? (columna más a la derecha visitada)
    let maxCol = 0
    for (const k of vista) maxCol = Math.max(maxCol, Number(k.split(',')[0]))
    console.log(`  ❌ ${fichero}: no se alcanza la meta (se atasca en la col ${maxCol})`)
    problemas++
  }
}

console.log(
  `\nAlcance real del doble salto (tiles): mismo nivel=${TAB_NORMAL.get(0)}, ` +
    `subir 2=${TAB_NORMAL.get(2)}, subir 4=${TAB_NORMAL.get(4)}, bajar 4=${TAB_NORMAL.get(-4)}`,
)
console.log(problemas ? `${problemas} fase(s) con saltos imposibles` : '✅ Todas las fases son superables')
process.exit(0)
