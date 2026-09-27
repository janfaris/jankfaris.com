import { useEffect, useMemo, useRef, useState } from 'react'
import { SceneViewport } from '../three-lab/SceneViewport'
import type { SceneController } from '../three-lab/types'
import { createBay } from './bay'
import type { BayInput } from './input'

const noop = () => undefined

/**
 * Fixed, decorative layer behind the page. It reuses SceneViewport for
 * sizing, DPR caps, and reduced motion; pointer input arrives through the
 * shared BayInput because the page content sits on top. If the GPU drops the
 * context (iOS does this when you switch apps), the page shows its static map
 * and the scene is rebuilt once the tab is visible again.
 */
export default function BayBackdrop({ input, onLost }: { input: BayInput; onLost: (lost: boolean) => void }) {
  const controller = useRef<SceneController | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const [generation, setGeneration] = useState(0)
  const factory = useMemo(() => createBay(input), [input])
  const compact = useMemo(() => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches, [])

  useEffect(() => {
    const element = host.current
    if (!element) return
    let lost = false
    let attempts = 0
    let timer = 0
    const restore = () => {
      if (!lost || document.hidden || attempts >= 3) return
      lost = false
      attempts++
      onLost(false)
      setGeneration(value => value + 1)
    }
    const handleLost = (event: Event) => {
      if (!(event.target instanceof HTMLCanvasElement) || !event.target.isConnected) return
      lost = true
      onLost(true)
      window.clearTimeout(timer)
      if (!document.hidden) timer = window.setTimeout(restore, 1200)
    }
    element.addEventListener('webglcontextlost', handleLost, true)
    document.addEventListener('visibilitychange', restore)
    return () => {
      element.removeEventListener('webglcontextlost', handleLost, true)
      document.removeEventListener('visibilitychange', restore)
      window.clearTimeout(timer)
    }
  }, [onLost])

  return <div className="b-backdrop" ref={host} aria-hidden="true">
    <SceneViewport key={generation} factory={factory} name="Bioluminescent bay" paused={false} controllerRef={controller} onInfo={noop} allowPageScroll fitAspect={.01} theme="dark" showFloor={false} antialias={!compact} />
  </div>
}
