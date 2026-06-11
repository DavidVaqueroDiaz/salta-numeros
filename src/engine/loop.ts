// Bucle principal: llama a update con un dt acotado (en segundos) y luego a render.
// El tope de 0.05 s evita "saltos" enormes si la pestaña estuvo en segundo plano.
export function startLoop(update: (dt: number) => void, render: () => void): void {
  let last = performance.now()

  function frame(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    update(dt)
    render()
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
