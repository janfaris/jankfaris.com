import * as THREE from 'three'
import type { SceneFactory } from './types'

const COUNT = 4200
const WIDTH = 840
const HEIGHT = 420

function randomGenerator(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function shapePoints(shape: number) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  if (shape === 0) {
    ctx.font = '800 340px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('JF', WIDTH / 2, HEIGHT / 2 + 21)
  } else if (shape === 1) {
    // A deliberately legible island silhouette, rather than an abstract point cloud.
    const outline = [[.095,.33],[.16,.27],[.24,.29],[.34,.28],[.45,.3],[.54,.285],[.64,.315],[.72,.31],[.81,.35],[.88,.42],[.9,.49],[.84,.52],[.85,.57],[.79,.6],[.77,.68],[.72,.71],[.68,.67],[.59,.7],[.49,.68],[.43,.705],[.34,.685],[.29,.65],[.22,.67],[.16,.64],[.105,.62],[.09,.53],[.105,.45]]
    ctx.beginPath()
    outline.forEach(([x, y], i) => i ? ctx.lineTo(x * WIDTH, y * HEIGHT) : ctx.moveTo(x * WIDTH, y * HEIGHT))
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(.932 * WIDTH, .666 * HEIGHT, 19, 6, -.18, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(.939 * WIDTH, .442 * HEIGHT, 7, 4, -.3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.roundRect(110, 48, 620, 327, 19)
    ctx.stroke()
    ctx.fillRect(113, 97, 614, 5)
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(137 + i * 19, 75, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.roundRect(235, 66, 333, 16, 5)
    ctx.stroke()
    ctx.fillRect(144, 128, 101, 14)
    for (let i = 0; i < 5; i++) ctx.fillRect(145, 164 + i * 31, 73 - i % 2 * 17, 7)
    ctx.fillRect(267, 127, 268, 17)
    ctx.fillRect(267, 158, 391, 6)
    ctx.lineWidth = 5
    ctx.strokeRect(269, 190, 419, 114)
    ctx.beginPath()
    ;[[290,281],[346,249],[400,267],[461,217],[517,247],[581,216],[668,239]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y))
    ctx.stroke()
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.roundRect(270 + i * 145, 326, 129, 22, 4)
      ctx.stroke()
    }
  }
  const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data
  const samples: [number, number][] = []
  for (let y = 0; y < HEIGHT; y += 2) {
    for (let x = 0; x < WIDTH; x += 2) {
      if (pixels[(y * WIDTH + x) * 4 + 3] > 120) samples.push([x, y])
    }
  }
  const random = randomGenerator(3419 + shape * 532)
  const positions = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const [x, y] = samples[Math.floor(random() * samples.length)]
    positions[i * 3] = (x / WIDTH - .5) * 6 + (random() - .5) * .02
    positions[i * 3 + 1] = (.5 - y / HEIGHT) * 3
    positions[i * 3 + 2] = (random() - .5) * .24
  }
  return positions
}

export const createParticles: SceneFactory = ({ scene, camera, renderer, reducedMotion, onInfo }) => {
  camera.fov = 38
  camera.position.set(0, 0, 6.8)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
  const shapes = [shapePoints(0), shapePoints(1), shapePoints(2)]
  const positions = new Float32Array(shapes[0])
  const from = new Float32Array(positions)
  const offsets = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)
  const random = randomGenerator(81723)
  for (let i = 0; i < COUNT; i++) seeds[i] = random()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uPixelRatio: { value: Math.min(renderer.getPixelRatio(), 2) } },
    vertexShader: `
      attribute float aSeed;
      uniform float uPixelRatio;
      varying float vSeed;
      void main() {
        vSeed = aSeed;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = (2.2 + aSeed * 2.2) * uPixelRatio * clamp(6.5 / -viewPosition.z, 0.6, 1.5);
      }
    `,
    fragmentShader: `
      varying float vSeed;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        if (radius > 1.0) discard;
        float alpha = pow(1.0 - radius, 0.6) * 0.9;
        vec3 color = mix(vec3(0.015, 0.19, 0.53), vec3(0.025, 0.65, 0.91), vSeed);
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  scene.add(points)
  const names = ['JF · the builder', 'Puerto Rico · where I build', 'Products · what I make']
  let targetShape = 0
  let transition = 1
  let dwell = 0
  let pinned = false
  let pointerX = 0
  let pointerY = 0
  let pointerStrength = 0
  let pressed = false
  const raycaster = new THREE.Raycaster()
  const cursor = new THREE.Vector3()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const ndc = new THREE.Vector2()

  function setShape(index: number) {
    const next = THREE.MathUtils.clamp(Math.round(index), 0, 2)
    from.set(positions)
    offsets.fill(0)
    targetShape = next
    transition = reducedMotion ? 1 : 0
    dwell = 0
    onInfo(names[next], 'Touch the points. They find their way back.')
  }

  function scatter() {
    for (let i = 0; i < COUNT; i++) {
      const theta = random() * Math.PI * 2
      const radius = .4 + random() * 1.25
      offsets[i * 3] += Math.cos(theta) * radius
      offsets[i * 3 + 1] += Math.sin(theta) * radius
      offsets[i * 3 + 2] += (random() - .5) * 1.4
    }
    dwell = 0
  }
  onInfo(names[0], 'One cloud. Three things to know about me.')

  return {
    update(_elapsed, delta) {
      const dt = Math.min(delta, .08)
      if (!reducedMotion && !pinned && !pressed) {
        dwell += dt
        if (dwell > 5.5) setShape((targetShape + 1) % 3)
      }
      transition = Math.min(1, transition + dt / 1.7)
      const blend = transition * transition * (3 - 2 * transition)
      const target = shapes[targetShape]
      const decay = Math.exp(-dt * (pressed ? 2.3 : 3.3))
      pointerStrength *= Math.exp(-dt * 4)
      for (let i = 0; i < COUNT; i++) {
        const at = i * 3
        const x = from[at] + (target[at] - from[at]) * blend
        const y = from[at + 1] + (target[at + 1] - from[at + 1]) * blend
        const z = from[at + 2] + (target[at + 2] - from[at + 2]) * blend
        const dx = x - pointerX
        const dy = y - pointerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (pointerStrength > .01 && distance < .9) {
          const force = (1 - distance / .9) * pointerStrength * dt * 6
          offsets[at] += dx / Math.max(distance, .025) * force
          offsets[at + 1] += dy / Math.max(distance, .025) * force
          offsets[at + 2] += Math.sin(seeds[i] * 30) * force
        }
        for (let axis = 0; axis < 3; axis++) offsets[at + axis] *= decay
        positions[at] = x + offsets[at]
        positions[at + 1] = y + offsets[at + 1]
        positions[at + 2] = z + offsets[at + 2] + (reducedMotion ? 0 : Math.sin(transition * Math.PI) * Math.sin(seeds[i] * 40) * .35)
      }
      geometry.attributes.position.needsUpdate = true
    },
    pointer(type, input) {
      if (type === 'cancel') { pressed = false; pointerStrength = 0; return }
      pressed = type !== 'up' && input.pressed
      if (type === 'up') return
      ndc.set(input.x, input.y)
      raycaster.setFromCamera(ndc, camera)
      if (raycaster.ray.intersectPlane(plane, cursor)) {
        pointerX = cursor.x
        pointerY = cursor.y
        pointerStrength = input.pressed ? 1.4 : .55
        if (input.pressed) dwell = 0
      }
    },
    action(action, value) {
      if (action === 'shape' && typeof value === 'number') { pinned = true; setShape(value) }
      if (action === 'scatter') scatter()
      if (action === 'replay') { pinned = false; setShape(0) }
    },
  }
}
