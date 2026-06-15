// Ajustes del juego, guardados en el dispositivo.

export type TamanoControles = 'pequeno' | 'mediano' | 'grande'

export interface Ajustes {
  sonido: boolean
  tamanoControles: TamanoControles
  /** todos los niveles desbloqueados (protegido por contraseña) */
  desbloqueado: boolean
}

const CLAVE = 'salta-numeros-ajustes'

const PREDETERMINADOS: Ajustes = {
  sonido: true,
  tamanoControles: 'mediano',
  desbloqueado: false,
}

export function cargarAjustes(): Ajustes {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return { ...PREDETERMINADOS }
    const guardado = JSON.parse(raw)
    const ajustes = { ...PREDETERMINADOS, ...guardado }
    // migración del ajuste antiguo (booleano "controlesGrandes")
    if (guardado.controlesGrandes === true && !guardado.tamanoControles) {
      ajustes.tamanoControles = 'grande'
    }
    return ajustes
  } catch {
    return { ...PREDETERMINADOS }
  }
}

export function guardarAjustes(ajustes: Ajustes): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ajustes))
  } catch {
    // sin almacenamiento: los ajustes duran solo la sesión
  }
}

// --- Tutoriales vistos (uno por tipo de ítem, solo la primera vez) ---

const CLAVE_TUTOS = 'salta-numeros-tutoriales'

export function tutorialVisto(tipo: string): boolean {
  try {
    const raw = localStorage.getItem(CLAVE_TUTOS)
    return raw ? JSON.parse(raw)[tipo] === true : false
  } catch {
    return false
  }
}

export function marcarTutorialVisto(tipo: string): void {
  try {
    const raw = localStorage.getItem(CLAVE_TUTOS)
    const vistos = raw ? JSON.parse(raw) : {}
    vistos[tipo] = true
    localStorage.setItem(CLAVE_TUTOS, JSON.stringify(vistos))
  } catch {
    // sin almacenamiento: se repetirá, no pasa nada
  }
}
