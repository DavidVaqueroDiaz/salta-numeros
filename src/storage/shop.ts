// La hucha de monedas y los personajes comprados/equipados.

const CLAVE_MONEDERO = 'salta-numeros-monedero'
const CLAVE_PERSONAJES = 'salta-numeros-personajes'

export interface Personajes {
  comprados: number[]
  equipado: number
}

/** Precio de cada personaje en la tienda. El 1 es gratis (inicial). */
export function precioPersonaje(numero: number): number {
  return numero * 5
}

export function cargarMonedero(): number {
  try {
    return Math.max(0, Number(localStorage.getItem(CLAVE_MONEDERO)) || 0)
  } catch {
    return 0
  }
}

export function añadirMonedas(cuantas: number): void {
  try {
    localStorage.setItem(CLAVE_MONEDERO, String(cargarMonedero() + Math.max(0, cuantas)))
  } catch {
    // sin almacenamiento
  }
}

export function cargarPersonajes(): Personajes {
  try {
    const raw = localStorage.getItem(CLAVE_PERSONAJES)
    if (raw) {
      const p = JSON.parse(raw) as Personajes
      if (Array.isArray(p.comprados) && p.comprados.includes(1)) return p
    }
  } catch {
    // valores por defecto
  }
  return { comprados: [1], equipado: 1 }
}

function guardarPersonajes(p: Personajes): void {
  try {
    localStorage.setItem(CLAVE_PERSONAJES, JSON.stringify(p))
  } catch {
    // sin almacenamiento
  }
}

/** Compra (si hay monedas) y equipa el personaje. Devuelve si pudo. */
export function comprarPersonaje(numero: number): boolean {
  const p = cargarPersonajes()
  if (p.comprados.includes(numero)) return true
  const precio = precioPersonaje(numero)
  const monedero = cargarMonedero()
  if (monedero < precio) return false
  try {
    localStorage.setItem(CLAVE_MONEDERO, String(monedero - precio))
  } catch {
    return false
  }
  p.comprados.push(numero)
  p.equipado = numero
  guardarPersonajes(p)
  return true
}

export function equiparPersonaje(numero: number): void {
  const p = cargarPersonajes()
  if (!p.comprados.includes(numero)) return
  p.equipado = numero
  guardarPersonajes(p)
}
