// Entrada táctil (botones grandes en pantalla) + teclado (para probar en PC).
// El salto se "encola" con marca de tiempo para permitir jump buffering:
// si el niño pulsa saltar una fracción antes de tocar suelo, el salto sale igual.

export interface InputState {
  left: boolean
  right: boolean
  jumpHeld: boolean
  /** performance.now() de la última pulsación de salto, 0 si ya consumida */
  jumpQueuedAt: number
}

export const input: InputState = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpQueuedAt: 0,
}

function pressJump(): void {
  input.jumpHeld = true
  input.jumpQueuedAt = performance.now()
}

function bindButton(el: HTMLElement, down: () => void, up: () => void): void {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    el.setPointerCapture(e.pointerId)
    el.classList.add('pressed')
    down()
  })
  const release = (e: PointerEvent): void => {
    e.preventDefault()
    el.classList.remove('pressed')
    up()
  }
  el.addEventListener('pointerup', release)
  el.addEventListener('pointercancel', release)
}

export function setupInput(): void {
  bindButton(
    document.getElementById('ctl-left')!,
    () => (input.left = true),
    () => (input.left = false),
  )
  bindButton(
    document.getElementById('ctl-right')!,
    () => (input.right = true),
    () => (input.right = false),
  )
  bindButton(
    document.getElementById('ctl-jump')!,
    pressJump,
    () => (input.jumpHeld = false),
  )

  // Teclado: flechas/AD para moverse, espacio o flecha arriba para saltar
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = true
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = true
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') pressJump()
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = false
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = false
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') input.jumpHeld = false
  })
}

/** Consume el salto encolado si se pulsó hace menos de `bufferMs`. */
export function consumeJump(bufferMs = 120): boolean {
  if (input.jumpQueuedAt && performance.now() - input.jumpQueuedAt < bufferMs) {
    input.jumpQueuedAt = 0
    return true
  }
  return false
}

export function resetInput(): void {
  input.left = false
  input.right = false
  input.jumpHeld = false
  input.jumpQueuedAt = 0
}
