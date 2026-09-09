import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { PointerInput, SceneFactory } from './types'

const FLOOR_Y = -1.6
const GRAVITY = 9.8
const STEP = 1 / 120

const projects = [
  { name: 'Wandr', line: 'A little further.', detail: 'Itineraries, flights, and local events in one AI-assisted trip plan.' },
  { name: 'Janga', line: 'Find your people.', detail: 'An iOS app for finding where to hang out. Shipped on the App Store.' },
  { name: 'demotape', line: 'From script to screen.', detail: 'An open-source CLI that turns a reusable JSON script into a polished demo video.' },
]

type BlockDefinition = {
  size: [number, number, number]
  at: [number, number, number]
  yaw: number
  color: string
  project?: number
  symbol?: 'asterisk' | 'arrow'
}

type Block = {
  group: THREE.Group
  shell: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  half: THREE.Vector3
  extent: THREE.Vector3
  target: THREE.Vector3
  rotation: THREE.Quaternion
  velocity: THREE.Vector3
  spin: THREE.Vector3
  age: number
  project?: number
}

// A deliberately small custom spring/collision simulation. Rotated box bounds
// are conservative; this is a tactile portfolio interaction, not a rigid-body engine.
export const createBlocks: SceneFactory = ({ scene, camera, renderer, reducedMotion, onInfo }) => {
  camera.position.set(3.4, 2.65, 8.4)
  camera.fov = 32
  camera.lookAt(0, -0.25, 0)
  camera.updateProjectionMatrix()

  const definitions: BlockDefinition[] = [
    { size: [3.35, 0.84, 1.15], at: [-0.36, 0.42, 0.12], yaw: -0.07, color: '#e9f2fa', project: 2 },
    { size: [2.72, 0.84, 1.12], at: [0.28, 1.28, 0.04], yaw: 0.08, color: '#167dcc', project: 0 },
    { size: [2.04, 0.84, 1.08], at: [0.61, 2.14, 0.06], yaw: -0.10, color: '#fcfdff', project: 1 },
    { size: [0.87, 0.87, 0.87], at: [-2.61, 0.435, 0.10], yaw: 0.20, color: '#218bd5', symbol: 'asterisk' },
    { size: [0.80, 0.80, 0.80], at: [2.28, 0.40, -0.01], yaw: -0.18, color: '#b5d9f2', symbol: 'arrow' },
  ]
  const labelTextures: THREE.CanvasTexture[] = []

  function makeLabel(definition: BlockDefinition) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(512 * (definition.size[0] - 0.16) / (definition.size[1] - 0.13))
    canvas.height = 512
    const context = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
    labelTextures.push(texture)
    if (!context) return { texture, redraw: () => undefined }

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      const dark = definition.color === '#167dcc' || definition.color === '#218bd5'
      context.fillStyle = dark ? '#ffffff' : '#17639e'
      context.strokeStyle = context.fillStyle
      context.lineCap = 'round'
      context.lineJoin = 'round'
      if (definition.project !== undefined) {
        const project = projects[definition.project]
        context.font = '500 47px Archivo, sans-serif'
        context.fillText(project.line, 75, 114)
        context.font = '600 218px Archivo, sans-serif'
        context.fillText(project.name, 67, 341)
        context.globalAlpha = 0.55
        context.font = '500 42px Archivo, sans-serif'
        context.textAlign = 'right'
        context.fillText(`0${definition.project + 1}`, canvas.width - 74, 437)
        context.textAlign = 'left'
        context.globalAlpha = 1
        context.lineWidth = 8
        context.beginPath()
        context.moveTo(canvas.width - 128, 109)
        context.lineTo(canvas.width - 76, 57)
        context.moveTo(canvas.width - 126, 57)
        context.lineTo(canvas.width - 76, 57)
        context.lineTo(canvas.width - 76, 108)
        context.stroke()
      } else if (definition.symbol === 'asterisk') {
        context.lineWidth = 31
        for (let arm = 0; arm < 6; arm++) {
          const angle = arm * Math.PI / 3
          context.beginPath()
          context.moveTo(256 + Math.cos(angle) * 52, 256 + Math.sin(angle) * 52)
          context.lineTo(256 + Math.cos(angle) * 153, 256 + Math.sin(angle) * 153)
          context.stroke()
        }
      } else {
        context.lineWidth = 25
        context.beginPath()
        context.moveTo(142, 360)
        context.lineTo(351, 151)
        context.moveTo(149, 151)
        context.lineTo(351, 151)
        context.lineTo(351, 352)
        context.stroke()
      }
      texture.needsUpdate = true
    }
    draw()
    return { texture, redraw: draw }
  }

  const redrawLabels: (() => void)[] = []
  const blocks: Block[] = definitions.map((definition) => {
    const [width, height, depth] = definition.size
    const geometry = new RoundedBoxGeometry(width, height, depth, 5, 0.095)
    const material = new THREE.MeshPhysicalMaterial({
      color: definition.color,
      roughness: 0.31,
      metalness: 0.035,
      clearcoat: 0.38,
      clearcoatRoughness: 0.3,
      emissive: '#176fb9',
      emissiveIntensity: 0,
    })
    const shell = new THREE.Mesh(geometry, material)
    shell.castShadow = true
    shell.receiveShadow = true
    const group = new THREE.Group()
    group.add(shell)
    const { texture, redraw } = makeLabel(definition)
    redrawLabels.push(redraw)
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.16, height - 0.13),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
    )
    label.position.z = depth / 2 + 0.002
    group.add(label)
    const target = new THREE.Vector3(...definition.at)
    target.y += FLOOR_Y
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, definition.yaw, 0))
    group.position.copy(target)
    group.quaternion.copy(rotation)
    scene.add(group)
    return {
      group, shell, target, rotation,
      half: new THREE.Vector3(width / 2, height / 2, depth / 2),
      extent: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      age: 10,
      project: definition.project,
    }
  })

  let disposed = false
  // A font may finish loading after the canvas texture has been created.
  void document.fonts.ready.then(() => {
    if (!disposed) redrawLabels.forEach((redraw) => redraw())
  })

  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const dragPlane = new THREE.Plane()
  const dragPoint = new THREE.Vector3()
  const dragOffset = new THREE.Vector3()
  const dragTarget = new THREE.Vector3()
  const previousPosition = new THREE.Vector3()
  const angularAxis = new THREE.Vector3()
  const angularStep = new THREE.Quaternion()
  const rotationMatrix = new THREE.Matrix4()
  const normal = new THREE.Vector3()
  const relative = new THREE.Vector3()
  const pointerStart = new THREE.Vector2()
  let held: Block | undefined
  let hover: Block | undefined
  let wasSettled = false
  let moved = false
  let selectedProject = -1
  let accumulator = 0
  let shuffleNumber = 0

  const random = (seed: number) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return value - Math.floor(value)
  }

  function scatter(entrance: boolean) {
    shuffleNumber++
    held = undefined
    blocks.forEach((block, index) => {
      const seed = index * 8 + shuffleNumber * 43
      block.age = entrance ? -index * 0.11 : 0
      if (entrance) {
        block.group.position.copy(block.target)
        block.group.position.y += 1.8 + index * 0.36
        block.group.position.x += (random(seed) - 0.5) * 0.8
        block.group.quaternion.setFromEuler(new THREE.Euler(
          (random(seed + 1) - 0.5) * 0.6,
          (random(seed + 2) - 0.5) * 1.3,
          (random(seed + 3) - 0.5) * 0.65,
        ))
      }
      block.velocity.set((random(seed + 4) - 0.5) * 4.2, entrance ? 0 : 3.8 + random(seed + 5) * 2, (random(seed + 6) - 0.5) * 2)
      block.spin.set((random(seed + 1) - 0.5) * 3, (random(seed + 2) - 0.5) * 3, (random(seed + 3) - 0.5) * 3)
    })
  }

  function reset() {
    held = undefined
    selectedProject = -1
    blocks.forEach((block) => {
      block.age = 3
      block.velocity.set(0, 0, 0)
      block.spin.set(0, 0, 0)
      if (reducedMotion) {
        block.group.position.copy(block.target)
        block.group.quaternion.copy(block.rotation)
      }
    })
    renderer.domElement.style.cursor = ''
  }

  function updateExtent(block: Block) {
    rotationMatrix.makeRotationFromQuaternion(block.group.quaternion)
    const elements = rotationMatrix.elements
    const half = block.half
    block.extent.set(
      Math.abs(elements[0]) * half.x + Math.abs(elements[4]) * half.y + Math.abs(elements[8]) * half.z,
      Math.abs(elements[1]) * half.x + Math.abs(elements[5]) * half.y + Math.abs(elements[9]) * half.z,
      Math.abs(elements[2]) * half.x + Math.abs(elements[6]) * half.y + Math.abs(elements[10]) * half.z,
    )
  }

  function physics(dt: number) {
    for (const block of blocks) {
      const position = block.group.position
      block.age += dt
      if (block === held) {
        previousPosition.copy(position)
        position.lerp(dragTarget, 1 - Math.exp(-28 * dt))
        block.velocity.copy(position).sub(previousPosition).divideScalar(dt).clampLength(0, 14)
        block.group.quaternion.slerp(block.rotation, 1 - Math.exp(-9 * dt))
      } else {
        const magnet = THREE.MathUtils.smoothstep(block.age, 0.8, 2.4)
        // Gravity yields progressively to each block's magnetic docking point.
        block.velocity.y -= GRAVITY * (1 - magnet) * dt
        block.velocity.addScaledVector(relative.copy(block.target).sub(position), 21 * magnet * dt)
        block.velocity.multiplyScalar(Math.exp(-(0.36 + magnet * 8.2) * dt))
        position.addScaledVector(block.velocity, dt)
        const angularSpeed = block.spin.length()
        if (angularSpeed > 0.001) {
          angularAxis.copy(block.spin).divideScalar(angularSpeed)
          angularStep.setFromAxisAngle(angularAxis, angularSpeed * dt)
          block.group.quaternion.premultiply(angularStep)
        }
        block.spin.multiplyScalar(Math.exp(-(0.65 + magnet * 6) * dt))
        block.group.quaternion.slerp(block.rotation, 1 - Math.exp(-magnet * 8 * dt))
      }
      updateExtent(block)
      const floor = FLOOR_Y + block.extent.y
      if (position.y < floor) {
        position.y = floor
        if (block.velocity.y < 0) block.velocity.y *= -0.27
        block.velocity.x *= 0.94
        block.velocity.z *= 0.94
        block.spin.multiplyScalar(0.91)
      }
      // Soft invisible bounds keep an enthusiastic flick inside the exhibit.
      for (const axis of ['x', 'z'] as const) {
        const bound = axis === 'x' ? 4.1 : 2.6
        if (Math.abs(position[axis]) > bound) {
          position[axis] = THREE.MathUtils.clamp(position[axis], -bound, bound)
          block.velocity[axis] *= -0.32
        }
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      for (let first = 0; first < blocks.length; first++) {
        for (let second = first + 1; second < blocks.length; second++) {
          const a = blocks[first]
          const b = blocks[second]
          relative.copy(b.group.position).sub(a.group.position)
          const overlapX = a.extent.x + b.extent.x - Math.abs(relative.x)
          const overlapY = a.extent.y + b.extent.y - Math.abs(relative.y)
          const overlapZ = a.extent.z + b.extent.z - Math.abs(relative.z)
          if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) continue
          const penetration = Math.min(overlapX, overlapY, overlapZ)
          normal.set(0, 0, 0)
          if (penetration === overlapX) normal.x = Math.sign(relative.x) || 1
          else if (penetration === overlapY) normal.y = Math.sign(relative.y) || 1
          else normal.z = Math.sign(relative.z) || 1
          const massA = a === held ? 0 : 1
          const massB = b === held ? 0 : 1
          const mass = massA + massB
          if (!mass) continue
          a.group.position.addScaledVector(normal, -(penetration + 0.001) * massA / mass)
          b.group.position.addScaledVector(normal, (penetration + 0.001) * massB / mass)
          const approach = relative.copy(b.velocity).sub(a.velocity).dot(normal)
          if (approach < 0) {
            const impulse = -1.18 * approach / mass
            a.velocity.addScaledVector(normal, -impulse * massA)
            b.velocity.addScaledVector(normal, impulse * massB)
            a.spin.multiplyScalar(0.87)
            b.spin.multiplyScalar(0.87)
          }
        }
      }
    }
  }

  function cast(input: PointerInput) {
    ndc.set(input.x, input.y)
    raycaster.setFromCamera(ndc, camera)
  }

  function hitBlock() {
    const hit = raycaster.intersectObjects(blocks.map((block) => block.shell), false)[0]
    return hit ? { block: blocks.find((block) => block.shell === hit.object), point: hit.point } : undefined
  }

  function showProject(index: number) {
    const project = projects[index]
    if (!project) return
    selectedProject = index
    onInfo(project.name, project.detail)
  }

  if (!reducedMotion) scatter(true)

  return {
    update(elapsed, delta) {
      accumulator += Math.min(delta, 0.06)
      while (accumulator >= STEP) {
        physics(STEP)
        accumulator -= STEP
      }
      for (const [index, block] of blocks.entries()) {
        const highlighted = block === hover || block === held || (selectedProject >= 0 && block.project === selectedProject)
        block.shell.material.emissiveIntensity = THREE.MathUtils.damp(block.shell.material.emissiveIntensity, highlighted ? 0.13 : 0, 9, delta)
        if (!reducedMotion && block !== held && block.age > 5 && block.velocity.lengthSq() < 0.002) {
          // A tiny slow yaw gives the resting material a changing highlight.
          angularStep.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.sin(elapsed * 0.5 + index * 1.7) * 0.007)
          block.group.quaternion.copy(block.rotation).multiply(angularStep)
        }
      }
    },
    pointer(type, input) {
      if (type === 'cancel') {
        if (held) { held.velocity.set(0, 0, 0); held.spin.set(0, 0, 0); held.age = 0 }
        held = undefined
        hover = undefined
        moved = false
        renderer.domElement.style.cursor = ''
        return
      }
      cast(input)
      if (type === 'down') {
        const hit = hitBlock()
        if (!hit?.block) return
        held = hit.block
        wasSettled = held.age > 3 && held.velocity.lengthSq() < 0.2
        moved = false
        pointerStart.set(input.x, input.y)
        camera.getWorldDirection(normal)
        dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point)
        dragOffset.copy(held.group.position).sub(hit.point)
        dragTarget.copy(held.group.position)
        held.spin.set(0, 0, 0)
        renderer.domElement.style.cursor = 'grabbing'
      } else if (type === 'move') {
        if (held) {
          moved ||= pointerStart.distanceTo(ndc) > 0.022
          if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
            dragTarget.copy(dragPoint).add(dragOffset)
            dragTarget.x = THREE.MathUtils.clamp(dragTarget.x, -3.9, 3.9)
            dragTarget.y = THREE.MathUtils.clamp(dragTarget.y, FLOOR_Y + held.half.y, 3.2)
            dragTarget.z = THREE.MathUtils.clamp(dragTarget.z, -2.4, 2.4)
          }
        } else {
          hover = hitBlock()?.block
          renderer.domElement.style.cursor = hover ? 'grab' : ''
        }
      } else if (type === 'up' && held) {
        const released = held
        held = undefined
        if (!moved && wasSettled && released.project !== undefined) showProject(released.project)
        released.age = moved ? 0 : 3
        released.velocity.clampLength(0, 11)
        released.spin.set(released.velocity.z * 0.24, released.velocity.x * 0.12, -released.velocity.x * 0.32)
        renderer.domElement.style.cursor = hover ? 'grab' : ''
      }
    },
    action(action, value) {
      if (action === 'shuffle') scatter(false)
      if (action === 'reset') reset()
      if (action === 'project' && value !== undefined) showProject(value)
    },
    dispose() {
      disposed = true
      renderer.domElement.style.cursor = ''
      // The host owns scene-resource disposal, including these label textures.
      labelTextures.length = 0
    },
  }
}
