// Ajustes del juego, guardados en el dispositivo.

export interface Ajustes {
  sonido: boolean
  controlesGrandes: boolean
  /** todos los niveles desbloqueados (protegido por contraseña) */
  desbloqueado: boolean
}

const CLAVE = 'salta-numeros-ajustes'

const PREDETERMINADOS: Ajustes = {
  sonido: true,
  controlesGrandes: false,
  desbloqueado: false,
}

export function cargarAjustes(): Ajustes {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? { ...PREDETERMINADOS, ...JSON.parse(raw) } : { ...PREDETERMINADOS }
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
