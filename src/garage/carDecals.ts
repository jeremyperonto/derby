import { CanvasTexture, SRGBColorSpace } from 'three'
import { PALETTE } from '../content/palette'

/**
 * Canvas-drawn textures for the racing-number roundel, vector stickers,
 * and place medals. All hand-drawn paths — no emoji glyphs anywhere.
 * Cached per key; a handful of tiny canvases total.
 */

const cache = new Map<string, CanvasTexture>()
const dataUrlCache = new Map<string, string>()

type Draw = (ctx: CanvasRenderingContext2D, size: number) => void

function drawToCanvas(draw: Draw, size = 128): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  return canvas
}

function makeTexture(key: string, draw: Draw): CanvasTexture {
  const existing = cache.get(key)
  if (existing) return existing
  const texture = new CanvasTexture(drawToCanvas(draw))
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

/** classic painted roundel: paper circle, accent ring (ink by default), big ink number */
export function numberTexture(n: number, ring: string = PALETTE.ink): CanvasTexture {
  return makeTexture(`num:${n}:${ring}`, (ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.paper
    ctx.fill()
    ctx.lineWidth = s * 0.07
    ctx.strokeStyle = ring
    ctx.stroke()
    ctx.fillStyle = PALETTE.ink
    ctx.font = `600 ${s * 0.5}px Oswald, 'Arial Narrow', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), s / 2, s / 2 + s * 0.04)
  })
}

// --- vector stickers ---

const ink = PALETTE.ink

function outline(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineWidth = s * 0.05
  ctx.strokeStyle = ink
  ctx.lineJoin = 'round'
  ctx.stroke()
}

const STICKER_DRAWS: Record<string, Draw> = {
  flame: (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.08)
    ctx.bezierCurveTo(s * 0.68, s * 0.3, s * 0.85, s * 0.42, s * 0.8, s * 0.65)
    ctx.bezierCurveTo(s * 0.76, s * 0.85, s * 0.62, s * 0.92, s * 0.5, s * 0.92)
    ctx.bezierCurveTo(s * 0.38, s * 0.92, s * 0.24, s * 0.85, s * 0.2, s * 0.65)
    ctx.bezierCurveTo(s * 0.16, s * 0.45, s * 0.3, s * 0.32, s * 0.36, s * 0.22)
    ctx.bezierCurveTo(s * 0.42, s * 0.3, s * 0.46, s * 0.22, s * 0.5, s * 0.08)
    ctx.closePath()
    ctx.fillStyle = PALETTE.orange
    ctx.fill()
    outline(ctx, s)
    // inner tongue
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.42)
    ctx.bezierCurveTo(s * 0.62, s * 0.56, s * 0.62, s * 0.7, s * 0.5, s * 0.8)
    ctx.bezierCurveTo(s * 0.38, s * 0.7, s * 0.38, s * 0.56, s * 0.5, s * 0.42)
    ctx.fillStyle = PALETTE.mustard
    ctx.fill()
  },
  bolt: (ctx, s) => {
    ctx.beginPath()
    const pts = [
      [0.62, 0.06],
      [0.3, 0.55],
      [0.47, 0.55],
      [0.38, 0.94],
      [0.72, 0.42],
      [0.54, 0.42],
    ]
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x! * s, y! * s) : ctx.moveTo(x! * s, y! * s)))
    ctx.closePath()
    ctx.fillStyle = PALETTE.mustard
    ctx.fill()
    outline(ctx, s)
  },
  star: (ctx, s) => {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = (i % 2 === 0 ? 0.42 : 0.18) * s
      const x = s / 2 + r * Math.cos(a)
      const y = s / 2 + r * Math.sin(a)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = PALETTE.mustard
    ctx.fill()
    outline(ctx, s)
  },
  checker: (ctx, s) => {
    const n = 4
    const cell = (s * 0.8) / n
    const o = s * 0.1
    ctx.fillStyle = PALETTE.paper
    ctx.fillRect(o, o, cell * n, cell * n)
    ctx.fillStyle = ink
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if ((i + j) % 2 === 0) ctx.fillRect(o + i * cell, o + j * cell, cell, cell)
    ctx.lineWidth = s * 0.045
    ctx.strokeStyle = ink
    ctx.strokeRect(o, o, cell * n, cell * n)
  },
  heart: (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.88)
    ctx.bezierCurveTo(s * 0.12, s * 0.55, s * 0.16, s * 0.18, s * 0.5, s * 0.36)
    ctx.bezierCurveTo(s * 0.84, s * 0.18, s * 0.88, s * 0.55, s * 0.5, s * 0.88)
    ctx.closePath()
    ctx.fillStyle = PALETTE.brickRed
    ctx.fill()
    outline(ctx, s)
  },
  clover: (ctx, s) => {
    ctx.fillStyle = PALETTE.forest
    for (const [cx, cy] of [
      [0.5, 0.28],
      [0.3, 0.5],
      [0.7, 0.5],
    ]) {
      ctx.beginPath()
      ctx.arc(cx! * s, cy! * s, s * 0.17, 0, Math.PI * 2)
      ctx.fill()
      outline(ctx, s)
    }
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.5)
    ctx.quadraticCurveTo(s * 0.46, s * 0.75, s * 0.58, s * 0.9)
    ctx.lineWidth = s * 0.06
    ctx.strokeStyle = PALETTE.forest
    ctx.stroke()
  },
  eyes: (ctx, s) => {
    for (const cx of [0.32, 0.68]) {
      ctx.beginPath()
      ctx.ellipse(cx * s, s * 0.5, s * 0.16, s * 0.24, 0, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.paper
      ctx.fill()
      outline(ctx, s)
      ctx.beginPath()
      ctx.arc(cx * s + s * 0.04, s * 0.58, s * 0.07, 0, Math.PI * 2)
      ctx.fillStyle = ink
      ctx.fill()
    }
  },
  boom: (ctx, s) => {
    ctx.beginPath()
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12
      const r = (i % 2 === 0 ? 0.44 : 0.26) * s
      const x = s / 2 + r * Math.cos(a)
      const y = s / 2 + r * Math.sin(a)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = PALETTE.orange
    ctx.fill()
    outline(ctx, s)
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.mustard
    ctx.fill()
  },
  stripes: (ctx, s) => {
    ctx.save()
    ctx.translate(s / 2, s / 2)
    ctx.rotate(-Math.PI / 4)
    ctx.fillStyle = PALETTE.brickRed
    ctx.fillRect(-s * 0.5, -s * 0.16, s, s * 0.13)
    ctx.fillStyle = PALETTE.navy
    ctx.fillRect(-s * 0.5, 0.03 * s, s, s * 0.13)
    ctx.restore()
  },
  arrow: (ctx, s) => {
    ctx.fillStyle = PALETTE.brickRed
    for (let k = 0; k < 3; k++) {
      const o = s * 0.12 + k * s * 0.22
      ctx.beginPath()
      ctx.moveTo(o, s * 0.24)
      ctx.lineTo(o + s * 0.18, s * 0.5)
      ctx.lineTo(o, s * 0.76)
      ctx.lineTo(o + s * 0.1, s * 0.76)
      ctx.lineTo(o + s * 0.28, s * 0.5)
      ctx.lineTo(o + s * 0.1, s * 0.24)
      ctx.closePath()
      ctx.fill()
      outline(ctx, s)
    }
  },
  wings: (ctx, s) => {
    // two feather fans spreading from a center dot
    for (const dir of [1, -1]) {
      for (let f = 0; f < 3; f++) {
        const spread = 0.16 + f * 0.14
        ctx.beginPath()
        ctx.moveTo(s * 0.5, s * 0.55)
        ctx.quadraticCurveTo(
          s * (0.5 + dir * spread),
          s * (0.36 - f * 0.06),
          s * (0.5 + dir * (spread + 0.16)),
          s * (0.42 - f * 0.05),
        )
        ctx.quadraticCurveTo(s * (0.5 + dir * spread), s * (0.52 - f * 0.03), s * 0.5, s * 0.62)
        ctx.closePath()
        ctx.fillStyle = f % 2 ? PALETTE.paper : PALETTE.skyBlue
        ctx.fill()
        outline(ctx, s)
      }
    }
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.58, s * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.brickRed
    ctx.fill()
    outline(ctx, s)
  },
  crown: (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s * 0.18, s * 0.72)
    ctx.lineTo(s * 0.14, s * 0.32)
    ctx.lineTo(s * 0.32, s * 0.5)
    ctx.lineTo(s * 0.5, s * 0.22)
    ctx.lineTo(s * 0.68, s * 0.5)
    ctx.lineTo(s * 0.86, s * 0.32)
    ctx.lineTo(s * 0.82, s * 0.72)
    ctx.closePath()
    ctx.fillStyle = PALETTE.mustard
    ctx.fill()
    outline(ctx, s)
    for (const cx of [0.32, 0.5, 0.68]) {
      ctx.beginPath()
      ctx.arc(s * cx, s * 0.62, s * 0.045, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.brickRed
      ctx.fill()
    }
  },
  trophy: (ctx, s) => {
    ctx.fillStyle = PALETTE.mustard
    // cup
    ctx.beginPath()
    ctx.moveTo(s * 0.32, s * 0.18)
    ctx.lineTo(s * 0.68, s * 0.18)
    ctx.quadraticCurveTo(s * 0.66, s * 0.52, s * 0.5, s * 0.58)
    ctx.quadraticCurveTo(s * 0.34, s * 0.52, s * 0.32, s * 0.18)
    ctx.closePath()
    ctx.fill()
    outline(ctx, s)
    // handles
    for (const dir of [1, -1]) {
      ctx.beginPath()
      ctx.arc(s * (0.5 + dir * 0.26), s * 0.28, s * 0.09, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = s * 0.05
      ctx.stroke()
    }
    // stem + base
    ctx.fillRect(s * 0.45, s * 0.58, s * 0.1, s * 0.12)
    ctx.fillStyle = PALETTE.mustard
    ctx.beginPath()
    ctx.moveTo(s * 0.32, s * 0.82)
    ctx.lineTo(s * 0.68, s * 0.82)
    ctx.lineTo(s * 0.62, s * 0.7)
    ctx.lineTo(s * 0.38, s * 0.7)
    ctx.closePath()
    ctx.fill()
    outline(ctx, s)
  },
  sun: (ctx, s) => {
    // triangular rays around an orange disc
    ctx.fillStyle = PALETTE.mustard
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      ctx.beginPath()
      ctx.moveTo(s / 2 + Math.cos(a) * s * 0.28, s / 2 + Math.sin(a) * s * 0.28)
      ctx.lineTo(s / 2 + Math.cos(a - 0.13) * s * 0.47, s / 2 + Math.sin(a - 0.13) * s * 0.47)
      ctx.lineTo(s / 2 + Math.cos(a + 0.13) * s * 0.47, s / 2 + Math.sin(a + 0.13) * s * 0.47)
      ctx.closePath()
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.26, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.orange
    ctx.fill()
    outline(ctx, s)
  },
  diamond: (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.14)
    ctx.lineTo(s * 0.82, s * 0.42)
    ctx.lineTo(s * 0.5, s * 0.88)
    ctx.lineTo(s * 0.18, s * 0.42)
    ctx.closePath()
    ctx.fillStyle = PALETTE.skyBlue
    ctx.fill()
    outline(ctx, s)
    // facets
    ctx.beginPath()
    ctx.moveTo(s * 0.18, s * 0.42)
    ctx.lineTo(s * 0.82, s * 0.42)
    ctx.moveTo(s * 0.5, s * 0.14)
    ctx.lineTo(s * 0.36, s * 0.42)
    ctx.lineTo(s * 0.5, s * 0.88)
    ctx.moveTo(s * 0.5, s * 0.14)
    ctx.lineTo(s * 0.64, s * 0.42)
    ctx.lineTo(s * 0.5, s * 0.88)
    ctx.lineWidth = s * 0.03
    ctx.strokeStyle = PALETTE.navy
    ctx.stroke()
  },
  shield: (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.12)
    ctx.lineTo(s * 0.82, s * 0.24)
    ctx.lineTo(s * 0.82, s * 0.54)
    ctx.quadraticCurveTo(s * 0.8, s * 0.82, s * 0.5, s * 0.92)
    ctx.quadraticCurveTo(s * 0.2, s * 0.82, s * 0.18, s * 0.54)
    ctx.lineTo(s * 0.18, s * 0.24)
    ctx.closePath()
    ctx.fillStyle = PALETTE.navy
    ctx.fill()
    // band, clipped to the shield
    ctx.save()
    ctx.clip()
    ctx.fillStyle = PALETTE.mustard
    ctx.fillRect(s * 0.1, s * 0.44, s * 0.8, s * 0.14)
    ctx.restore()
    outline(ctx, s)
  },
  eight: (ctx, s) => {
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.42, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.ink
    ctx.fill()
    ctx.beginPath()
    ctx.arc(s / 2, s * 0.47, s * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.paper
    ctx.fill()
    ctx.fillStyle = PALETTE.ink
    ctx.font = `700 ${s * 0.28}px Oswald, 'Arial Narrow', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('8', s / 2, s * 0.49)
  },
  shark: (ctx, s) => {
    // toothy grin — red mouth with white teeth
    ctx.beginPath()
    ctx.ellipse(s * 0.5, s * 0.5, s * 0.4, s * 0.32, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.brickRed
    ctx.fill()
    outline(ctx, s)
    ctx.fillStyle = PALETTE.paper
    const teeth = 5
    const span = s * 0.6
    const w = span / teeth
    for (let i = 0; i < teeth; i++) {
      const x0 = s * 0.2 + i * w
      ctx.beginPath() // upper row, points down to center
      ctx.moveTo(x0, s * 0.4)
      ctx.lineTo(x0 + w, s * 0.4)
      ctx.lineTo(x0 + w / 2, s * 0.5)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath() // lower row, points up to center
      ctx.moveTo(x0, s * 0.6)
      ctx.lineTo(x0 + w, s * 0.6)
      ctx.lineTo(x0 + w / 2, s * 0.5)
      ctx.closePath()
      ctx.fill()
    }
  },
}

export function decalTexture(decalId: string): CanvasTexture | null {
  const draw = STICKER_DRAWS[decalId]
  if (!draw) return null
  return makeTexture(`decal:${decalId}`, (ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    draw(ctx, s)
  })
}

/** small preview image for UI buttons (same drawing, as a data URL) */
export function stickerDataURL(decalId: string): string | null {
  const cached = dataUrlCache.get(decalId)
  if (cached) return cached
  const draw = STICKER_DRAWS[decalId]
  if (!draw) return null
  const url = drawToCanvas((ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    draw(ctx, s)
  }, 64).toDataURL()
  dataUrlCache.set(decalId, url)
  return url
}

/** drawn place medal: ribbon + disc + numeral */
function drawMedal(ctx: CanvasRenderingContext2D, s: number, place: number): void {
  const disc = [PALETTE.mustard, '#b9bec7', '#c08850', PALETTE.paper][Math.min(place, 3)]!
  ctx.clearRect(0, 0, s, s)
  // ribbon tails
  ctx.fillStyle = PALETTE.brickRed
  ctx.beginPath()
  ctx.moveTo(s * 0.38, s * 0.06)
  ctx.lineTo(s * 0.5, s * 0.4)
  ctx.lineTo(s * 0.3, s * 0.42)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = PALETTE.navy
  ctx.beginPath()
  ctx.moveTo(s * 0.62, s * 0.06)
  ctx.lineTo(s * 0.5, s * 0.4)
  ctx.lineTo(s * 0.7, s * 0.42)
  ctx.closePath()
  ctx.fill()
  // disc
  ctx.beginPath()
  ctx.arc(s / 2, s * 0.62, s * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = disc
  ctx.fill()
  ctx.lineWidth = s * 0.045
  ctx.strokeStyle = PALETTE.ink
  ctx.stroke()
  ctx.fillStyle = PALETTE.ink
  ctx.font = `600 ${s * 0.3}px Oswald, 'Arial Narrow', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(place + 1), s / 2, s * 0.64)
}

export function medalTexture(place: number): CanvasTexture {
  return makeTexture(`medal:${place}`, (ctx, s) => drawMedal(ctx, s, place))
}

/** same medal as a data URL for DOM use (results list, winner plaque) */
export function medalDataURL(place: number): string {
  const key = `medal:${place}`
  const cached = dataUrlCache.get(key)
  if (cached) return cached
  const url = drawToCanvas((ctx, s) => drawMedal(ctx, s, place), 96).toDataURL()
  dataUrlCache.set(key, url)
  return url
}
