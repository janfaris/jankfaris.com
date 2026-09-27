import { useEffect, useRef } from 'react'

const BASE = { wdth: 112, wght: 600 }
const PEAK = { wdth: 125, wght: 900 }
const WORDS = ['JAN', 'FARIS']

/**
 * The name as the hero visual. Each letter is a variable-font glyph: near the
 * pointer or a finger it swells wider and heavier, like water pushed aside by
 * a hand. Mouse devices also get a slow swell before the first move. On touch
 * devices the loop sleeps as soon as the letters settle.
 */
export function KineticName({ reduced }: { reduced: boolean }) {
  const line = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = line.current
    if (!root || reduced) return
    const glyphs = Array.from(root.querySelectorAll<HTMLElement>('.b-glyph'))
    const state = glyphs.map(() => ({ wdth: BASE.wdth, wght: BASE.wght, lift: 0 }))
    const touchOnly = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const pointer = { x: 0, y: 0, active: false, until: 0 }
    let fontSize = parseFloat(getComputedStyle(root).fontSize) || 100
    let visible = true
    let running = false
    let frame = 0

    const tick = (now: number) => {
      if (!visible) { running = false; return }
      if (pointer.until && now > pointer.until) { pointer.active = false; pointer.until = 0 }
      const swell = !touchOnly && !pointer.active
      const radius = fontSize * .82
      // Only measure letters while something is actually near them.
      const rects = pointer.active ? glyphs.map(glyph => glyph.getBoundingClientRect()) : null
      let moving = false
      glyphs.forEach((glyph, i) => {
        let influence = 0
        if (rects) {
          const rect = rects[i]
          const dx = pointer.x - (rect.left + rect.width / 2)
          const dy = (pointer.y - (rect.top + rect.height / 2)) * 1.25
          influence = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))
        }
        const wave = swell ? Math.sin(now / 1000 * 1.1 - i * .62) : 0
        const wdth = BASE.wdth + (PEAK.wdth - BASE.wdth) * influence + wave * 6
        const wght = BASE.wght + (PEAK.wght - BASE.wght) * influence + wave * 55
        const s = state[i]
        s.wdth += (wdth - s.wdth) * .14
        s.wght += (wght - s.wght) * .14
        s.lift += (influence - s.lift) * .14
        if (Math.abs(wdth - s.wdth) > .05 || Math.abs(wght - s.wght) > .5 || Math.abs(influence - s.lift) > .002) moving = true
        glyph.style.fontVariationSettings = `'wdth' ${s.wdth.toFixed(1)}, 'wght' ${s.wght.toFixed(0)}`
        glyph.style.transform = `translate3d(0, ${(-s.lift * .05).toFixed(4)}em, 0)`
      })
      if (pointer.active || swell || moving) frame = requestAnimationFrame(tick)
      else running = false
    }
    const wake = () => {
      if (running || !visible) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
      pointer.until = 0
      wake()
    }
    const touch = (event: TouchEvent) => {
      const point = event.touches[0]
      if (!point) return
      pointer.x = point.clientX
      pointer.y = point.clientY
      pointer.active = true
      pointer.until = performance.now() + 700
      wake()
    }
    const leave = () => { pointer.active = false }
    const resize = new ResizeObserver(() => { fontSize = parseFloat(getComputedStyle(root).fontSize) || fontSize })
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) wake()
    })
    resize.observe(root)
    intersection.observe(root)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('touchstart', touch, { passive: true })
    window.addEventListener('touchmove', touch, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    wake()

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('touchstart', touch)
      window.removeEventListener('touchmove', touch)
      document.documentElement.removeEventListener('pointerleave', leave)
      glyphs.forEach(glyph => { glyph.style.fontVariationSettings = ''; glyph.style.transform = '' })
    }
  }, [reduced])

  return <h1 className="b-name">
    <span className="sr-only">Jan Faris</span>
    <span className="b-name-line" aria-hidden="true" ref={line}>
      {WORDS.map(word => <span className="b-word" key={word}>
        {word.split('').map((letter, i) => <span className="b-letter" key={i}><span className="b-glyph">{letter}</span></span>)}
      </span>)}
    </span>
  </h1>
}
