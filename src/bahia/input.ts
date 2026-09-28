// Shared between the page and the scene. Kept free of three.js so the page can
// render its text before the WebGL chunk arrives.
export type BayTargets = {
  /** Camera: 0 is eye level over the water, 1 is the aerial view of the island. */
  lift: number
  /** Particles: 0 loose in the water, 1 settled into the coastline. */
  morph: number
  /** 0..1 after the island: the camera drifts back down over the water. */
  settle: number
  /** 0..1 quiets the water under dense content. */
  dim: number
  /** 0..1 extra brightness for the closing section. */
  boost: number
}

export type BayInput = {
  targets: BayTargets
  /** Signed scroll velocity in px/s, written by the page's ScrollTrigger. */
  velocity: { value: number }
  /** Pointer in normalised device coordinates. */
  pointer: { x: number; y: number; moved: boolean; lastMove: number }
  /** Taps and clicks waiting to become ripples, in normalised device coordinates. */
  splashes: { x: number; y: number; strength: number }[]
  /** Where San Juan sits on screen, so the page can pin a label to it. */
  onBeacon?: (x: number, y: number, opacity: number) => void
  /** Frames the WebGL scene has produced; the page falls back to 2D if this stays at 0. */
  frames: number
  /** Set when a shader fails to compile on this device. */
  failed: boolean
}

export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function createBayInput(onBeacon?: BayInput['onBeacon']): BayInput {
  return {
    onBeacon,
    targets: { lift: 0, morph: 0, settle: 0, dim: 0, boost: 0 },
    velocity: { value: 0 },
    pointer: { x: 0, y: 0, moved: false, lastMove: -Infinity },
    splashes: [],
    frames: 0,
    failed: false,
  }
}
