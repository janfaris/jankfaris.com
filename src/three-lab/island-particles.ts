import * as THREE from 'three'

export type IslandParticleOptions = {
  /** Every supplied position is local to this parent, including the coastline. */
  parent: THREE.Object3D
  coastline: THREE.Vector3[]
  beacon: THREE.Vector3
  lowPower: boolean
  reducedMotion?: boolean
}

export type IslandParticleState = {
  intro: number
  blocks: THREE.Vector3[]
  selected: number | null
  dragging: number | null
}

const BLOCK_COUNT = 3
const TRAIL_LIFETIME = 0.64
const TAU = Math.PI * 2
const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const seed = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

/**
 * A single draw call for three connected gestures: coastline discovery,
 * connections from San Juan to projects, and brief trails on moving blocks.
 * All buffers and history slots are allocated once; update allocates nothing.
 */
export function createIslandParticles({
  parent,
  coastline,
  beacon,
  lowPower,
  reducedMotion = false,
}: IslandParticleOptions) {
  const count = lowPower ? 250 : 500
  const routeCount = lowPower ? 72 : 144
  const trailPerBlock = lowPower ? 15 : 30
  const trailCount = trailPerBlock * BLOCK_COUNT
  const coastCount = count - routeCount - trailCount
  const trailStart = coastCount + routeCount
  const routePerBlock = routeCount / BLOCK_COUNT

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const opacities = new Float32Array(count)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const trailAges = new Float32Array(trailCount).fill(Infinity)
  const trailHeads = new Uint8Array(BLOCK_COUNT)
  const trailCooldown = new Float32Array(BLOCK_COUNT)
  const previousPositions = new Float32Array(BLOCK_COUNT * 3)
  const previousValid = new Uint8Array(BLOCK_COUNT)

  const lengths = new Float64Array(coastline.length + 1)

  const cyan = new THREE.Color('#139bb8')
  const blue = new THREE.Color('#147bd1')
  const deepBlue = new THREE.Color('#216ce0')
  const color = new THREE.Color()
  for (let index = 0; index < count; index++) {
    phases[index] = seed(index + 1)
    if (index < coastCount) color.copy(cyan).lerp(blue, phases[index] * 0.4)
    else if (index < trailStart) color.copy(blue).lerp(cyan, phases[index] * 0.35)
    else color.copy(deepBlue).lerp(cyan, phases[index] * 0.35)
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
  const opacityAttribute = new THREE.BufferAttribute(opacities, 1).setUsage(THREE.DynamicDrawUsage)
  const sizeAttribute = new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aOpacity', opacityAttribute)
  geometry.setAttribute('aSize', sizeAttribute)

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: false,
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aOpacity;
      attribute float aSize;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vColor = aColor;
        vOpacity = aOpacity;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * 7.0 / max(3.0, -viewPosition.z), 1.0, 6.0) * uPixelRatio;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vec2 point = gl_PointCoord * 2.0 - 1.0;
        float radius = length(point);
        float circle = 1.0 - smoothstep(0.3, 1.0, radius);
        float alpha = circle * vOpacity;
        if (alpha < 0.005) discard;
        float core = (1.0 - smoothstep(0.0, 0.36, radius)) * 0.12;
        gl_FragColor = vec4(mix(vColor, vec3(0.58, 0.88, 1.0), core), alpha);
        #include <colorspace_fragment>
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.name = 'island-story-particles'
  points.visible = !reducedMotion
  points.frustumCulled = false
  points.renderOrder = 3
  points.onBeforeRender = renderer => {
    material.uniforms.uPixelRatio.value = Math.min(renderer.getPixelRatio(), 2)
  }
  parent.add(points)

  let previousSelection: number | null = null
  let selectionAge = 10
  let disposed = false

  return {
    update(elapsed: number, delta: number, state: IslandParticleState) {
      if (disposed || reducedMotion) return
      const step = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
      const time = reducedMotion || !Number.isFinite(elapsed) ? 0 : elapsed
      const intro = reducedMotion ? 1 : clamp01(Number.isFinite(state.intro) ? state.intro : 1)
      const trace = THREE.MathUtils.smoothstep(intro, 0.015, 0.62)
      const dissolve = THREE.MathUtils.smoothstep(intro, 0.6, 1)
      const routeReveal = THREE.MathUtils.smoothstep(intro, 0.42, 0.95)
      if (state.selected !== previousSelection) {
        previousSelection = state.selected
        selectionAge = reducedMotion ? 10 : 0
      } else selectionAge = Math.min(10, selectionAge + step)
      const selectionPulse = reducedMotion ? 0 : Math.exp(-selectionAge * 2.7)

      // The caller reuses and transforms these vectors during the island's
      // reveal/idle motion. Resample the live polyline only while it is visible.
      let centerX = 0
      let centerZ = 0
      if (intro < 1) {
        for (let index = 0; index < coastline.length; index++) {
          const point = coastline[index]
          const next = coastline[(index + 1) % coastline.length]
          lengths[index + 1] = lengths[index] + point.distanceTo(next)
          centerX += point.x
          centerZ += point.z
        }
        centerX /= Math.max(1, coastline.length)
        centerZ /= Math.max(1, coastline.length)
      }
      const perimeter = lengths[coastline.length]
      const coastIsValid = intro < 1 && coastline.length > 1 && perimeter > 0
      let segment = 0
      for (let index = 0; index < coastCount; index++) {
        const offset = index * 3
        const progress = (index + 0.5) / coastCount
        const head = Math.max(0, 1 - Math.abs(progress - trace) / 0.055)
        const revealed = clamp01((trace - progress) / 0.012)
        if (coastIsValid) {
          const distance = progress * perimeter
          while (segment < coastline.length - 1 && lengths[segment + 1] <= distance) segment++
          const start = coastline[segment]
          const end = coastline[(segment + 1) % coastline.length]
          const segmentLength = lengths[segment + 1] - lengths[segment]
          const fraction = segmentLength > 0 ? (distance - lengths[segment]) / segmentLength : 0
          const x = start.x + (end.x - start.x) * fraction
          const z = start.z + (end.z - start.z) * fraction
          const radialLength = Math.max(0.001, Math.hypot(x - centerX, z - centerZ))
          positions[offset] = x + (x - centerX) / radialLength * dissolve * 0.055
          positions[offset + 1] = start.y + (end.y - start.y) * fraction + 0.035
            + dissolve * (0.06 + phases[index] * 0.07)
          positions[offset + 2] = z + (z - centerZ) / radialLength * dissolve * 0.055
        }
        opacities[index] = coastIsValid ? (revealed * 0.64 + head * 0.42) * (1 - dissolve) : 0
        sizes[index] = 2.35 + head * 1.75 + phases[index] * 0.6
      }

      for (let block = 0; block < BLOCK_COUNT; block++) {
        const destination = state.blocks[block]
        const selected = state.selected === block
        const dragged = state.dragging === block
        const routeOffset = coastCount + block * routePerBlock
        if (destination) {
          const dx = destination.x - beacon.x
          const dz = destination.z - beacon.z
          const distance = Math.max(0.01, Math.hypot(dx, dz))
          const arc = -Math.min(0.24, 0.1 + distance * 0.04)
          const side = (block - 1) * 0.08
          for (let slot = 0; slot < routePerBlock; slot++) {
            const index = routeOffset + slot
            const offset = index * 3
            const progress = ((slot + phases[index] * 0.45) / routePerBlock + time * 0.038) % 1
            const bow = Math.sin(progress * Math.PI)
            positions[offset] = beacon.x + dx * progress - dz / distance * bow * side
            positions[offset + 1] = beacon.y + (destination.y - beacon.y) * progress + bow * arc + 0.018
            positions[offset + 2] = beacon.z + dz * progress + dx / distance * bow * side
            const shimmer = Math.max(0, Math.sin(time * 0.56 + phases[index] * TAU))
            const sparse = shimmer * shimmer * shimmer * shimmer
            const travelHead = clamp01(1 - Math.abs(progress - Math.min(1, selectionAge * 1.05)) / 0.2)
            const idle = 0.18 + sparse * 0.45
            const emphasis = selected ? 0.15 + selectionPulse * (0.16 + travelHead * 0.48) : 0
            opacities[index] = routeReveal * clamp01(idle + emphasis) * (dragged ? 0.65 : 1)
            sizes[index] = 3.4 + sparse * 1.2 + (selected ? selectionPulse * (0.4 + travelHead * 1.2) : 0)
          }

          const previousOffset = block * 3
          const movementX = destination.x - previousPositions[previousOffset]
          const movementY = destination.y - previousPositions[previousOffset + 1]
          const movementZ = destination.z - previousPositions[previousOffset + 2]
          const movement = movementX * movementX + movementY * movementY + movementZ * movementZ
          trailCooldown[block] += step
          if (!reducedMotion && intro > 0.82 && step > 0 && previousValid[block]
            && movement > 0.000009 && trailCooldown[block] >= (lowPower ? 0.033 : 0.02)) {
            const historySlot = block * trailPerBlock + trailHeads[block]
            const particle = trailStart + historySlot
            const offset = particle * 3
            positions[offset] = previousPositions[previousOffset]
            positions[offset + 1] = previousPositions[previousOffset + 1] - 0.055
            positions[offset + 2] = previousPositions[previousOffset + 2]
            trailAges[historySlot] = 0
            trailHeads[block] = (trailHeads[block] + 1) % trailPerBlock
            trailCooldown[block] = 0
          }
          previousPositions[previousOffset] = destination.x
          previousPositions[previousOffset + 1] = destination.y
          previousPositions[previousOffset + 2] = destination.z
          previousValid[block] = 1
        } else {
          previousValid[block] = 0
          for (let slot = 0; slot < routePerBlock; slot++) opacities[routeOffset + slot] = 0
        }

        for (let slot = 0; slot < trailPerBlock; slot++) {
          const historySlot = block * trailPerBlock + slot
          const particle = trailStart + historySlot
          trailAges[historySlot] += step
          const remaining = reducedMotion || !destination ? 0 : clamp01(1 - trailAges[historySlot] / TRAIL_LIFETIME)
          opacities[particle] = remaining * remaining * (dragged ? 0.82 : 0.66) * routeReveal
          sizes[particle] = 2 + remaining * 1.7
        }
      }

      positionAttribute.needsUpdate = true
      opacityAttribute.needsUpdate = true
      sizeAttribute.needsUpdate = true
    },
    dispose() {
      if (disposed) return
      disposed = true
      parent.remove(points)
      geometry.dispose()
      material.dispose()
    },
  }
}
