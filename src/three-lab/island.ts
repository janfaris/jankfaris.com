import * as THREE from 'three'
import type { SceneFactory } from './types'
import {
  PUERTO_RICO_COASTLINE,
  VIEQUES_COASTLINE,
} from './island-shape'
import type { CoastCoordinate } from './island-shape'

const TAU = Math.PI * 2
const SEA_LEVEL = -0.25
const LAND_LEVEL = 0.065

// East is +x; north is -z. Latitude is corrected for the local projection.
const project = ([longitude, latitude]: CoastCoordinate) => new THREE.Vector2(
  (longitude + 66.44) * 2.96,
  (latitude - 18.24) * 3.12,
)

const coastline = PUERTO_RICO_COASTLINE.map(project)

function makeShape(points: readonly THREE.Vector2[]) {
  const shape = new THREE.Shape()
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.y)
    else shape.lineTo(point.x, point.y)
  })
  shape.closePath()
  return shape
}

function containsPoint(x: number, north: number) {
  let inside = false
  for (let i = 0, j = coastline.length - 1; i < coastline.length; j = i++) {
    const a = coastline[i]
    const b = coastline[j]
    if ((a.y > north) !== (b.y > north)
      && x < (b.x - a.x) * (north - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function shoreDistance(x: number, north: number) {
  let distance = Infinity
  for (let i = 1; i < coastline.length; i++) {
    const a = coastline[i - 1]
    const b = coastline[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const t = THREE.MathUtils.clamp(((x - a.x) * dx + (north - a.y) * dy) / (dx * dx + dy * dy), 0, 1)
    distance = Math.min(distance, Math.hypot(x - a.x - t * dx, north - a.y - t * dy))
  }
  return distance
}

function terrainHeight(x: number, north: number) {
  // An illustrative Cordillera Central and northeastern El Yunque massif.
  // Coastline and city position are geographic; relief is deliberately stylized.
  const ridge = Math.exp(-Math.pow((north + 0.22 + Math.sin(x * 1.2) * 0.08) / 0.35, 2))
    * Math.exp(-Math.pow((x + 0.35) / 2.05, 4))
  const yunque = Math.exp(-Math.pow((x - 1.9) / 0.34, 2) - Math.pow((north - 0.12) / 0.3, 2))
  const folds = 0.65 + 0.2 * Math.sin(x * 6.2 + north * 4) + 0.15 * Math.sin(x * 10.4 - north * 8.4)
  const coast = THREE.MathUtils.smoothstep(shoreDistance(x, north), 0.025, 0.27)
  return LAND_LEVEL + coast * (0.47 * ridge * folds + 0.31 * yunque)
}

function createTerrain() {
  const columns = 104
  const rows = 42
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const inside: boolean[] = []
  const sand = new THREE.Color('#7eaf7c')
  const green = new THREE.Color('#207b68')
  const peak = new THREE.Color('#9ab573')
  const color = new THREE.Color()

  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const x = -2.48 + column / columns * 4.96
      const north = -0.94 + row / rows * 1.86
      const height = terrainHeight(x, north)
      positions.push(x, height, -north)
      inside.push(containsPoint(x, north))
      const altitude = height - LAND_LEVEL
      if (altitude < 0.18) color.copy(sand).lerp(green, altitude / 0.18)
      else color.copy(green).lerp(peak, THREE.MathUtils.clamp((altitude - 0.18) / 0.31, 0, 1))
      colors.push(color.r, color.g, color.b)
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column
      const b = a + 1
      const c = a + columns + 1
      const d = c + 1
      if (inside[a] && inside[b] && inside[c]) indices.push(a, b, c)
      if (inside[b] && inside[d] && inside[c]) indices.push(b, d, c)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.04,
    flatShading: true,
  }))
}

function makeLand(points: readonly THREE.Vector2[], miniature = false) {
  const geometry = new THREE.ExtrudeGeometry(makeShape(points), {
    depth: miniature ? 0.12 : 0.21,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: miniature ? 0.014 : 0.025,
    bevelThickness: 0.027,
    curveSegments: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  const land = new THREE.Mesh(geometry, [
    new THREE.MeshStandardMaterial({ color: '#79ac80', roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: '#aaa780', roughness: 0.72 }),
  ])
  land.position.y = miniature ? LAND_LEVEL - 0.12 : LAND_LEVEL - 0.21
  land.castShadow = true
  land.receiveShadow = true
  return land
}

function labelSprite() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 160
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = 'rgba(250, 254, 255, 0.97)'
  context.beginPath()
  context.roundRect(5, 5, 502, 150, 74)
  context.fill()
  context.strokeStyle = 'rgba(52, 112, 149, 0.15)'
  context.lineWidth = 2
  context.stroke()
  context.fillStyle = '#2188db'
  context.beginPath()
  context.arc(69, 80, 12, 0, TAU)
  context.fill()
  context.fillStyle = '#183d55'
  context.font = '600 53px system-ui, sans-serif'
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText('San Juan', 108, 79)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, depthTest: false, transparent: true, toneMapped: false,
  }))
  sprite.scale.set(1.35, 0.422, 1)
  sprite.renderOrder = 5
  return sprite
}

export const createIsland: SceneFactory = ({ scene, camera, reducedMotion, onInfo }) => {
  const island = new THREE.Group()
  island.position.y = -0.25
  island.position.x = -0.38
  island.rotation.y = -0.045
  scene.add(island)
  camera.position.set(0, 4.5, 5.8)
  camera.lookAt(0, 0.1, 0)

  const seaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.35, 3.29, 0.07, 128),
    [
      new THREE.MeshStandardMaterial({ color: '#147b9b', roughness: 0.36, metalness: 0.12 }),
      new THREE.MeshPhysicalMaterial({ color: '#2cacc1', roughness: 0.28, metalness: 0.1, transparent: true, opacity: 0.88 }),
      new THREE.MeshStandardMaterial({ color: '#147b9b', roughness: 0.4 }),
    ],
  )
  seaBase.scale.z = 0.63
  seaBase.position.y = SEA_LEVEL - 0.08
  seaBase.position.x = 0.32
  seaBase.receiveShadow = true
  island.add(seaBase)

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vPosition;
      uniform float uTime;
      void main() {
        vPosition = position.xy;
        vec3 p = position;
        p.z += sin(p.x * 5.0 + uTime * 0.7) * cos(p.y * 4.0 - uTime * 0.5) * 0.008;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vPosition;
      uniform float uTime;
      void main() {
        float radial = length(vPosition) / 3.35;
        float wave = sin(vPosition.x * 13.0 + sin(vPosition.y * 8.0 + uTime * 0.55) + uTime * 0.7);
        float glint = pow(max(wave, 0.0), 16.0) * 0.13;
        vec3 color = mix(vec3(0.02, 0.36, 0.52), vec3(0.24, 0.75, 0.83), glint + 0.08);
        float edge = 1.0 - smoothstep(0.88, 1.0, radial);
        gl_FragColor = vec4(color, edge * (0.4 + glint));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.35, 112), waterMaterial)
  water.rotation.x = -Math.PI / 2
  water.scale.y = 0.63
  water.position.y = SEA_LEVEL - 0.015
  water.position.x = 0.32
  island.add(water)

  const shoreMaterial = new THREE.MeshStandardMaterial({
    color: '#20b9bb', roughness: 0.25, transparent: true, opacity: 0.76,
    metalness: 0.06, depthWrite: false,
  })
  const shallows = new THREE.Mesh(new THREE.ShapeGeometry(makeShape(coastline)), shoreMaterial)
  shallows.rotation.x = -Math.PI / 2
  shallows.scale.set(1.095, 1.16, 1)
  shallows.position.y = SEA_LEVEL + 0.012
  island.add(shallows)

  island.add(makeLand(coastline))
  const terrain = createTerrain()
  terrain.castShadow = true
  terrain.receiveShadow = true
  island.add(terrain)

  // Vieques uses the same public-domain coastline source. Culebra is not
  // resolved by this dataset's scale; do not substitute an invented outline.
  island.add(makeLand(VIEQUES_COASTLINE.map(project), true))

  const shoreWaves: THREE.LineLoop[] = []
  for (let index = 0; index < 3; index++) {
    const points = coastline.slice(0, -1).map(point => new THREE.Vector3(point.x, SEA_LEVEL + 0.022, -point.y))
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({
      color: index === 0 ? '#dcffff' : '#54b2d7', transparent: true, opacity: 0.45, depthWrite: false,
    }))
    shoreWaves.push(line)
    island.add(line)
  }

  const sanJuan = project([-66.1057, 18.4655])
  const beacon = new THREE.Group()
  beacon.position.set(sanJuan.x, LAND_LEVEL + 0.02, -sanJuan.y)
  island.add(beacon)
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.017, 0.55, 10),
    new THREE.MeshBasicMaterial({ color: '#258cd6' }),
  )
  stem.position.y = 0.28
  beacon.add(stem)
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.084, 24, 16),
    new THREE.MeshStandardMaterial({ color: '#239aec', emissive: '#1789f5', emissiveIntensity: 0.6, roughness: 0.23, metalness: 0.2 }),
  )
  marker.position.y = 0.57
  beacon.add(marker)
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 12),
    new THREE.MeshBasicMaterial({ color: '#51b9ff', transparent: true, opacity: 0.13, depthWrite: false }),
  )
  glow.position.y = marker.position.y
  beacon.add(glow)
  const markerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.132, 64),
    new THREE.MeshBasicMaterial({ color: '#2e9de1', transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false }),
  )
  markerRing.rotation.x = -Math.PI / 2
  markerRing.position.y = 0.023
  beacon.add(markerRing)

  const label = labelSprite()
  if (label) {
    label.position.set(0, 0.96, 0)
    beacon.add(label)
  }
  // Invisible hit area keeps the tiny visible beacon easy to activate on touch.
  const hitArea = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  )
  hitArea.position.y = marker.position.y
  beacon.add(hitArea)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const down = new THREE.Vector2()
  const baseRotation = -0.045
  let targetX = 0
  let targetY = baseRotation
  let dragging = false
  let moved = false
  let markerEmphasis = 0
  let pointerDistance = 0

  const showMarker = () => {
    markerEmphasis = 1
    onInfo('San Juan, Puerto Rico', 'Built in Puerto Rico. A local perspective, with work that reaches beyond the island.')
  }

  return {
    update(elapsed, delta) {
      const motionTime = reducedMotion ? 0 : elapsed
      const damping = 1 - Math.exp(-Math.min(delta, 0.05) * 10)
      island.rotation.x = THREE.MathUtils.lerp(island.rotation.x, targetX, damping)
      island.rotation.y = THREE.MathUtils.lerp(island.rotation.y, targetY, damping)
      island.position.y = -0.25 + Math.sin(motionTime * 0.62) * 0.025
      waterMaterial.uniforms.uTime.value = motionTime
      shoreWaves.forEach((line, index) => {
        const phase = (motionTime * 0.1 + index / shoreWaves.length) % 1
        line.scale.set(1.025 + phase * 0.14, 1, 1.055 + phase * 0.22)
        const material = line.material as THREE.LineBasicMaterial
        material.opacity = (1 - phase) * 0.4
      })
      markerEmphasis = Math.max(0, markerEmphasis - delta * 0.6)
      const pulse = 1 + Math.sin(motionTime * 1.7) * 0.07 + markerEmphasis * 0.3
      glow.scale.setScalar(pulse)
      markerRing.scale.setScalar(1 + Math.sin(motionTime * 1.3) * 0.09 + markerEmphasis * 0.4)
    },
    pointer(type, input) {
      if (type === 'cancel') { dragging = false; moved = false; pointerDistance = 0; return }
      pointer.set(input.x, input.y)
      if (type === 'down') {
        down.copy(pointer)
        dragging = true
        moved = false
        pointerDistance = 0
      }
      if (type === 'move' && dragging && input.pressed) {
        pointerDistance += Math.hypot(input.dx, input.dy)
        moved = moved || pointerDistance > 0.035 || down.distanceTo(pointer) > 0.035
        targetY = THREE.MathUtils.clamp(targetY + input.dx * 0.7, -0.62, 0.62)
        targetX = THREE.MathUtils.clamp(targetX - input.dy * 0.4, -0.2, 0.26)
      }
      if (type === 'up') {
        if (dragging && !moved) {
          scene.updateMatrixWorld(true)
          raycaster.setFromCamera(pointer, camera)
          const targets: THREE.Object3D[] = label ? [hitArea, label] : [hitArea]
          if (raycaster.intersectObjects(targets, false).length > 0) showMarker()
        }
        dragging = false
      }
    },
    action(action) {
      if (action === 'recenter') {
        dragging = false
        targetX = 0
        targetY = baseRotation
        onInfo('Puerto Rico', 'Drag to explore the island. Tap the blue beacon to find San Juan.')
      }
      if (action === 'marker') showMarker()
    },
  }
}
