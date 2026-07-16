/**
 * Dev-only URL hooks for automated visual verification (no-ops in prod).
 * The WebGL layer can't be screenshotted through browser automation on this
 * machine, so the page snapshots itself and POSTs to a local receiver:
 *
 *   ?screen=garage            jump straight to a screen
 *   ?carve=wedge              apply a starter template on boot
 *   ?snap=name[&snapdelay=ms] capture the canvas after a delay and POST it
 *                             to http://localhost:5198/?name=<name>
 */
export function installDevHooks(): void {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(location.search)

  const screen = params.get('screen')
  const carve = params.get('carve')
  const snap = params.get('snap')

  // defer store access so module init order doesn't matter
  setTimeout(async () => {
    if (screen) {
      const { useAppStore } = await import('../state/appStore')
      useAppStore.getState().setScreen(screen as never)
    }
    if (carve) {
      const [{ useGarageStore }, { TEMPLATES }] = await Promise.all([
        import('../state/garageStore'),
        import('../content/templates'),
      ])
      const template = TEMPLATES.find((t) => t.id === carve)
      if (template) useGarageStore.getState().applyTemplate(template.ops)
    }
  }, 50)

  if (snap) {
    const delay = Number(params.get('snapdelay') ?? 4000)
    setTimeout(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return
      const scale = Math.min(1, 1000 / canvas.width)
      const off = document.createElement('canvas')
      off.width = Math.round(canvas.width * scale)
      off.height = Math.round(canvas.height * scale)
      off.getContext('2d')!.drawImage(canvas, 0, 0, off.width, off.height)
      fetch(`http://localhost:5198/?name=${encodeURIComponent(snap)}`, {
        method: 'POST',
        body: off.toDataURL('image/jpeg', 0.8),
      }).catch(() => {})
    }, delay)
  }
}
