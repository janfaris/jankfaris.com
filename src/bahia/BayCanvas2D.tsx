import { useEffect, useRef } from 'react'
import { startBay2D } from './bay2d'
import type { BayInput } from './input'

/** Canvas 2D stand-in for the WebGL bay; see bay2d.ts. */
export default function BayCanvas2D({ input, reduced }: { input: BayInput; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    return startBay2D(canvas, input, reduced)
  }, [input, reduced])
  return <canvas className="b-backdrop b-backdrop-2d" ref={ref} aria-hidden="true" />
}
