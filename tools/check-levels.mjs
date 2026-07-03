// Validador de mapas: node tools/check-levels.mjs
// Comprueba reglas básicas de cada nivelXX.ts sin necesidad de compilar TS.
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'levels')
const ficheros = readdirSync(dir).filter((f) => /^nivel\d+\.ts$/.test(f)).sort()
let errores = 0

function fallo(fichero, msg) {
  console.log(`  ❌ ${fichero}: ${msg}`)
  errores++
}

for (const fichero of ficheros) {
  const texto = readFileSync(join(dir, fichero), 'utf8')
  const bloque = texto.match(/mapa:\s*\[([\s\S]*?)\]/)
  if (!bloque) {
    fallo(fichero, 'no se encontró el array mapa')
    continue
  }
  const filas = [...bloque[1].matchAll(/'([^']*)'/g)].map((m) => m[1])
  console.log(`${fichero}: ${filas.length} filas × ${filas[0]?.length} cols`)

  // 1. Todas las filas igual de largas
  const ancho = filas[0].length
  filas.forEach((f, i) => {
    if (f.length !== ancho)
      fallo(fichero, `fila ${i} mide ${f.length}, esperaba ${ancho}`)
  })

  // 2. Una P, y una meta: 'M' (bandera) o 'X' (Xiana, nivel final)
  const todo = filas.join('')
  const nP = todo.split('P').length - 1
  if (nP !== 1) fallo(fichero, `hay ${nP} 'P' (aparición), esperaba 1`)
  const nMetas = todo.split('M').length - 1 + (todo.split('X').length - 1)
  if (nMetas !== 1) fallo(fichero, `hay ${nMetas} metas (M o X), esperaba 1`)

  const get = (c, r) => (r < 0 || r >= filas.length ? '.' : (filas[r][c] ?? '.'))
  // suelo donde pueden apoyarse entidades y puertas: tierra o hielo
  const esSuelo = (ch) => ch === '#' || ch === 'I'

  // 3. Puertas: columnas de D contiguas, con suelo debajo y techo encima
  const colsD = new Set()
  filas.forEach((f) => [...f].forEach((ch, c) => ch === 'D' && colsD.add(c)))
  for (const c of colsD) {
    const filasD = filas.map((f, r) => (f[c] === 'D' ? r : -1)).filter((r) => r >= 0)
    const contiguas = filasD.every((r, i) => i === 0 || r === filasD[i - 1] + 1)
    if (!contiguas) fallo(fichero, `puerta col ${c}: filas D no contiguas (${filasD})`)
    const debajo = get(c, filasD[filasD.length - 1] + 1)
    if (!esSuelo(debajo)) fallo(fichero, `puerta col ${c}: no apoya en suelo (hay '${debajo}')`)
    const encima = get(c, filasD[0] - 1)
    if (filasD.length < 4 && encima !== '#')
      fallo(fichero, `puerta col ${c}: saltable (altura ${filasD.length} sin techo)`)
  }

  // 4. Pinchos, enemigos, jefe, Xiana, P y M: todos sobre suelo (no lava)
  filas.forEach((f, r) =>
    [...f].forEach((ch, c) => {
      if ('^EPMBXVZKJ'.includes(ch) && !esSuelo(get(c, r + 1)))
        fallo(fichero, `'${ch}' en (col ${c}, fila ${r}) sin suelo debajo`)
    }),
  )

  // 5. Huecos del suelo: anchura máxima razonable
  // con arcoíris (R, vuelo) o gravedad lunar se permiten barrancos grandes
  const lunar = /gravedadBaja:\s*true/.test(texto)
  const maxHueco = todo.includes('R') ? 14 : lunar ? 12 : 7
  const suelo = filas[filas.length - 1]
  let inicio = -1
  for (let c = 0; c <= suelo.length; c++) {
    // tierra, hielo, lava y agua cuentan como fondo (no son caída al vacío)
    const esHueco = c < suelo.length && !'#IL~'.includes(suelo[c])
    if (esHueco && inicio < 0) inicio = c
    if (!esHueco && inicio >= 0) {
      const anchoHueco = c - inicio
      if (anchoHueco > maxHueco)
        fallo(fichero, `hueco de ${anchoHueco} tiles en cols ${inicio}-${c - 1}`)
      inicio = -1
    }
  }
}

console.log(errores ? `\n${errores} problema(s) encontrados` : '\n✅ Todos los mapas pasan')
process.exit(errores ? 1 : 0)
