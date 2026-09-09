import type * as THREE from 'three'

export type PointerInput = {
  x: number
  y: number
  dx: number
  dy: number
  pressed: boolean
  pointerType?: string
}

export type SceneContext = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  reducedMotion: boolean
  onInfo: (label: string, detail?: string) => void
  onSelectProject?: (index: number | null) => void
}

export type SceneController = {
  update: (elapsed: number, delta: number) => void
  getProgress?: () => number
  pointer?: (type: 'down' | 'move' | 'up' | 'cancel', input: PointerInput) => void
  action?: (action: string, value?: number) => void
  dispose?: () => void
}

export type SceneFactory = (context: SceneContext) => SceneController
