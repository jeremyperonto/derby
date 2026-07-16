import { CanvasTexture, SRGBColorSpace } from 'three'
import { decalById } from '../content/decals'
import { PALETTE } from '../content/palette'

/**
 * Canvas-drawn textures for the racing-number roundel and emoji sticker
 * quads. Cached per key — a handful of tiny canvases total.
 */

const cache = new Map<string, CanvasTexture>()

function makeTexture(key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void): CanvasTexture {
  const existing = cache.get(key)
  if (existing) return existing
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

/** classic painted roundel: paper circle, ink ring, big ink number */
export function numberTexture(n: number): CanvasTexture {
  return makeTexture(`num:${n}`, (ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.paper
    ctx.fill()
    ctx.lineWidth = s * 0.05
    ctx.strokeStyle = PALETTE.ink
    ctx.stroke()
    ctx.fillStyle = PALETTE.ink
    ctx.font = `900 ${s * 0.52}px 'Trebuchet MS', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), s / 2, s / 2 + s * 0.03)
  })
}

/** floating place medal shown over each car as it crosses the line */
export function medalTexture(place: number): CanvasTexture {
  const glyphs = ['🥇', '🥈', '🥉', '4']
  const glyph = glyphs[Math.min(place, glyphs.length - 1)]!
  return makeTexture(`medal:${place}`, (ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    if (place < 3) {
      ctx.font = `${s * 0.8}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(glyph, s / 2, s / 2 + s * 0.05)
    } else {
      // plain "4th" chip
      ctx.beginPath()
      ctx.arc(s / 2, s / 2, s * 0.36, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.paper
      ctx.fill()
      ctx.lineWidth = s * 0.04
      ctx.strokeStyle = PALETTE.ink
      ctx.stroke()
      ctx.fillStyle = PALETTE.ink
      ctx.font = `900 ${s * 0.4}px 'Trebuchet MS', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('4th', s / 2, s / 2 + s * 0.03)
    }
  })
}

export function decalTexture(decalId: string): CanvasTexture | null {
  const decal = decalById(decalId)
  if (!decal) return null
  return makeTexture(`decal:${decalId}`, (ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    ctx.font = `${s * 0.82}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(decal.glyph, s / 2, s / 2 + s * 0.05)
  })
}
