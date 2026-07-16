/**
 * Dev-only URL hooks for automated visual verification (no-ops in prod).
 * The WebGL layer can't be screenshotted through browser automation on this
 * machine, so the page snapshots itself and POSTs to a local receiver:
 *
 *   ?screen=garage            jump straight to a screen
 *   ?carve=wedge              apply a starter template on boot
 *   ?race=1                   start a practice race on boot
 *   ?snap=name[&snapdelay=ms] capture the canvas after a delay and POST it
 *                             to http://localhost:5198/?name=<name>
 *   ?snap=a@1000,b@4000       multiple timed captures
 */
export function installDevHooks(): void {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(location.search)

  const screen = params.get('screen')
  const carve = params.get('carve')
  const snap = params.get('snap')

  // defer store access so module init order doesn't matter
  setTimeout(async () => {
    // expose stores for console debugging
    const stores = await Promise.all([
      import('../state/appStore'),
      import('../state/garageStore'),
      import('../state/raceStore'),
    ])
    ;(window as never as Record<string, unknown>).__stores = {
      app: stores[0].useAppStore,
      garage: stores[1].useGarageStore,
      race: stores[2].useRaceStore,
    }
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
    if (params.has('race')) {
      const [{ useGarageStore }, { useRaceStore }, { PRACTICE_RIVALS }] = await Promise.all([
        import('../state/garageStore'),
        import('../state/raceStore'),
        import('../garage/GarageScreen'),
      ])
      useRaceStore.getState().startRace(useGarageStore.getState().design, PRACTICE_RIVALS)
    }
  }, 50)

  // ?report=<ms>: POST app/race state as text after a delay (headless verification)
  const report = params.get('report')
  if (report) {
    setTimeout(async () => {
      const [{ useAppStore }, { useRaceStore }] = await Promise.all([
        import('../state/appStore'),
        import('../state/raceStore'),
      ])
      const race = useRaceStore.getState()
      const payload = JSON.stringify({
        screen: useAppStore.getState().screen,
        order: race.raceData?.order,
        times: race.raceData?.lanes.map((l) => Number(l.finishTime.toFixed(3))),
        margins: race.raceData?.marginLengths.map((m) => Number(m.toFixed(2))),
        playbackT: Number(race.playback.t.toFixed(2)),
      })
      fetch('http://localhost:5198/?name=report', {
        method: 'POST',
        body: 'data:text/plain;base64,' + btoa(payload),
      }).catch(() => {})
    }, Number(report))
  }

  if (snap) {
    const capture = (name: string) => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return
      const scale = Math.min(1, 1000 / canvas.width)
      const off = document.createElement('canvas')
      off.width = Math.round(canvas.width * scale)
      off.height = Math.round(canvas.height * scale)
      off.getContext('2d')!.drawImage(canvas, 0, 0, off.width, off.height)
      fetch(`http://localhost:5198/?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        body: off.toDataURL('image/jpeg', 0.8),
      }).catch(() => {})
    }
    for (const part of snap.split(',')) {
      const [name, delayStr] = part.split('@')
      setTimeout(() => capture(name!), Number(delayStr ?? params.get('snapdelay') ?? 4000))
    }
  }
}
