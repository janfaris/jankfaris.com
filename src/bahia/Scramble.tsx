import { useLayoutEffect, useRef, type ElementType } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzñáéíóú¿¡0123456789'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Decodes `from` into `to` one character at a time, left to right. */
function decode(element: HTMLElement, from: string, to: string, duration: number) {
  const length = Math.max(from.length, to.length)
  const settle = Array.from({ length }, (_, i) => .18 + i / length * .6 + Math.random() * .2)
  const start = performance.now()
  let frame = 0
  const draw = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    if (progress >= 1) { element.textContent = to; return }
    let text = ''
    for (let i = 0; i < length; i++) {
      const target = to[i] ?? ''
      if (progress >= settle[i]) text += target
      else if (target === ' ' || target === '') text += target
      else text += GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    element.textContent = text
    frame = requestAnimationFrame(draw)
  }
  frame = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(frame)
}

/**
 * Text that decodes itself when it changes, used for the EN/ES switch and
 * hover states. Screen readers get the final string; the animated copy is
 * aria-hidden and owned entirely by this component, never by React.
 */
export function Scramble({ text, as: Tag = 'span', className, replay = 0, duration = 720 }: {
  text: string
  as?: ElementType
  className?: string
  replay?: number
  duration?: number
}) {
  const visible = useRef<HTMLSpanElement>(null)
  const shown = useRef(text)
  const played = useRef(replay)

  useLayoutEffect(() => {
    const element = visible.current
    if (!element) return
    const changed = shown.current !== text
    const replayed = played.current !== replay
    const from = changed ? shown.current : text
    shown.current = text
    played.current = replay
    if ((!changed && !replayed) || reducedMotion()) {
      element.textContent = text
      return
    }
    const cancel = decode(element, from, text, replayed && !changed ? duration * .7 : duration)
    return () => { cancel(); element.textContent = text }
  }, [text, replay, duration])

  return <Tag className={className}>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true" ref={visible} />
  </Tag>
}
