import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createIsland } from './island'
import { createIslandParticles } from './island-particles'
import { PUERTO_RICO_COASTLINE } from './island-shape'
import { islandProjects } from './projects'
import type { PointerInput, SceneFactory } from './types'

const STEP = 1 / 120
const INTRO_DURATION = 2
const BLOCK_HEIGHT = 0.82
const BLOCK_DEPTH = 0.66

type ProjectBlock = {
  group: THREE.Group
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  labelMaterial: THREE.MeshBasicMaterial
  home: THREE.Vector3
  target: THREE.Vector3
  rotation: THREE.Quaternion
  velocity: THREE.Vector3
  spin: THREE.Vector3
  width: number
}

type SurfaceMaterial = {
  material: THREE.Material
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

export const createCombined: SceneFactory = (context) => {
  const { scene, camera, renderer, reducedMotion, onInfo, onSelectProject } = context
  const world = new THREE.Group()
  world.name = 'combined-island-world'
  scene.add(world)

  // A Scene is also an Object3D. Nesting it preserves the island factory's
  // contract while the host continues to own lighting and resource disposal.
  const islandScene = new THREE.Scene()
  islandScene.name = 'combined-island-surface'
  world.add(islandScene)
  const islandController = createIsland({ ...context, scene: islandScene })
  const islandRoot = islandScene.children[0]
  camera.position.set(0, 4.5, 8.5)
  camera.fov = 38
  camera.lookAt(0, 0.48, 0)
  camera.updateProjectionMatrix()

  const surfaceMaterials: SurfaceMaterial[] = []
  const seenMaterials = new Set<THREE.Material>()
  const waterMaterials: THREE.ShaderMaterial[] = []
  islandScene.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.material) return
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seenMaterials.has(material)) continue
      seenMaterials.add(material)
      if (material instanceof THREE.ShaderMaterial) {
        // The island's water shader owns its alpha, so fade that alpha directly.
        material.uniforms.uCombinedReveal = { value: reducedMotion ? 1 : 0 }
        material.fragmentShader = 'uniform float uCombinedReveal;\n' + material.fragmentShader.replace(
          '#include <tonemapping_fragment>',
          'gl_FragColor.a *= uCombinedReveal;\n#include <tonemapping_fragment>',
        )
        waterMaterials.push(material)
      } else {
        surfaceMaterials.push({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite })
      }
    }
  })

  let disposed = false
  const redrawLabels: (() => void)[] = []
  const blocks: ProjectBlock[] = islandProjects.map((project, index) => {
    const width = index === 2 ? 2.04 : 1.9
    const group = new THREE.Group()
    group.name = `combined-project-${index}`
    const home = new THREE.Vector3((index - 1) * 2.13, index === 1 ? 1.68 : 1.46, index === 1 ? -0.92 : -0.72)
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, (index - 1) * -0.045, 0))
    const material = new THREE.MeshPhysicalMaterial({
      color: index === 0 ? '#218ad0' : index === 1 ? '#fcfefe' : '#d5eaff',
      roughness: 0.3,
      metalness: 0.04,
      clearcoat: 0.38,
      clearcoatRoughness: 0.27,
      emissive: project.color,
      emissiveIntensity: 0,
    })
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, BLOCK_HEIGHT, BLOCK_DEPTH, 4, 0.105), material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round(1024 * (BLOCK_HEIGHT - 0.12) / (width - 0.15))
    const drawing = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
    const redraw = () => {
      if (!drawing) return
      drawing.clearRect(0, 0, canvas.width, canvas.height)
      drawing.fillStyle = index === 0 ? '#145982' : index === 1 ? '#246f68' : '#264c7a'
      drawing.textAlign = 'center'
      drawing.textBaseline = 'middle'
      drawing.font = '600 202px Archivo, sans-serif'
      const fontSize = Math.min(202, 202 * 884 / Math.max(1, drawing.measureText(project.name).width))
      drawing.font = `600 ${fontSize}px Archivo, sans-serif`
      drawing.fillText(project.name, 512, canvas.height * 0.51)
      texture.needsUpdate = true
    }
    redraw()
    redrawLabels.push(redraw)
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.15, BLOCK_HEIGHT - 0.12), labelMaterial)
    label.position.z = BLOCK_DEPTH / 2 + 0.002
    group.add(label)
    group.position.copy(home)
    group.quaternion.copy(rotation)
    world.add(group)
    return { group, mesh, labelMaterial, home, rotation, width, target: home.clone(), velocity: new THREE.Vector3(), spin: new THREE.Vector3() }
  })
  void document.fonts.ready.then(() => {
    if (!disposed) redrawLabels.forEach(redraw => redraw())
  })

  const localCoastline = PUERTO_RICO_COASTLINE.map(([longitude, latitude]) => new THREE.Vector3(
    (longitude + 66.44) * 2.96,
    0.09,
    -(latitude - 18.24) * 3.12,
  ))
  const coastline = localCoastline.map(point => point.clone())
  const localBeacon = new THREE.Vector3((-66.1057 + 66.44) * 2.96, 0.655, -(18.4655 - 18.24) * 3.12)
  const beacon = localBeacon.clone()
  const surfaceMatrix = new THREE.Matrix4()
  const blockPositions = blocks.map(block => block.group.position)
  const lowPower = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  const particles = createIslandParticles({ parent: world, coastline, beacon, lowPower, reducedMotion })

  let sceneTime = 0
  let introTime = reducedMotion ? INTRO_DURATION : 0
  let accumulator = 0
  let selected: number | null = null
  let hovered: number | null = null
  let held: number | null = null
  let gesture: 'block' | 'world' | null = null
  let moved = false
  let touchGesture = false
  let targetYaw = 0
  let targetTilt = 0
  let nudgeCount = 0
  const pointerStart = new THREE.Vector2()
  const pointer = new THREE.Vector2()
  const dragPlane = new THREE.Plane()
  const dragTarget = new THREE.Vector3()
  const dragStart = new THREE.Vector3()
  const dragOffset = new THREE.Vector3()
  const dragPoint = new THREE.Vector3()
  const raycaster = new THREE.Raycaster()
  const temporary = new THREE.Vector3()
  const previousPosition = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const angularStep = new THREE.Quaternion()
  const blockMeshes = blocks.map(block => block.mesh)

  function updateSurface(reveal: number) {
    islandScene.visible = reveal > 0.001
    islandScene.position.y = (1 - reveal) * -0.18
    islandScene.scale.setScalar(0.97 + reveal * 0.03)
    for (const { material, opacity, transparent, depthWrite } of surfaceMaterials) {
      material.opacity = opacity * reveal
      const nextTransparent = reveal < 0.999 ? true : transparent
      if (material.transparent !== nextTransparent) {
        material.transparent = nextTransparent
        material.needsUpdate = true
      }
      material.depthWrite = reveal > 0.6 && depthWrite
    }
    for (const material of waterMaterials) material.uniforms.uCombinedReveal.value = reveal
    islandScene.updateMatrix()
    islandRoot.updateMatrix()
    surfaceMatrix.multiplyMatrices(islandScene.matrix, islandRoot.matrix)
    coastline.forEach((point, index) => point.copy(localCoastline[index]).applyMatrix4(surfaceMatrix))
    beacon.copy(localBeacon).applyMatrix4(surfaceMatrix)
  }

  function completeIntro() {
    if (introTime >= INTRO_DURATION) return
    introTime = INTRO_DURATION
    blocks.forEach(block => {
      block.group.position.copy(block.home)
      block.group.quaternion.copy(block.rotation)
      block.velocity.set(0, 0, 0)
      block.spin.set(0, 0, 0)
      block.group.scale.setScalar(1)
      block.mesh.material.opacity = 1
      block.labelMaterial.opacity = 1
      block.group.visible = true
    })
    updateSurface(1)
  }

  function cancelGesture() {
    if (held !== null) {
      blocks[held].velocity.set(0, 0, 0)
      blocks[held].spin.set(0, 0, 0)
    }
    islandController.pointer?.('cancel', { x: pointer.x, y: pointer.y, dx: 0, dy: 0, pressed: false })
    held = null
    hovered = null
    gesture = null
    moved = false
    renderer.domElement.style.cursor = ''
  }

  function selectProject(index: number | null) {
    if (index !== null && (!Number.isInteger(index) || !islandProjects[index])) return
    completeIntro()
    selected = index
    onSelectProject?.(index)
    if (index === null) onInfo('Made in Puerto Rico', 'Three projects. One place to begin.')
    else onInfo(islandProjects[index].name, islandProjects[index].description)
  }

  function reset(replay = false) {
    cancelGesture()
    targetYaw = 0
    targetTilt = 0
    selected = null
    onSelectProject?.(null)
    onInfo('Made in Puerto Rico', 'Three projects. One place to begin.')
    introTime = replay && !reducedMotion ? 0 : INTRO_DURATION
    if (replay) sceneTime = 0
    blocks.forEach((block, index) => {
      block.velocity.set(0, 0, 0)
      block.spin.set(0, 0, 0)
      if (replay || reducedMotion) {
        block.group.position.copy(block.home)
        block.group.quaternion.copy(block.rotation)
        if (!reducedMotion) {
          block.group.position.y += 0.52 + index * 0.05
          angularStep.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, (index - 1) * 0.14)
          block.group.quaternion.multiply(angularStep)
        }
      }
    })
    if (reducedMotion) world.rotation.set(0, 0, 0)
  }

  function updateTargets() {
    for (const [index, block] of blocks.entries()) {
      block.target.copy(block.home)
      if (selected === index) {
        block.target.x *= 0.84
        block.target.y += 0.12
        block.target.z += 1.05
      } else if (selected !== null) {
        block.target.x *= 1.025
        block.target.y -= 0.03
        block.target.z -= 0.27
      }
      if (!reducedMotion && introTime < INTRO_DURATION) {
        const entrance = THREE.MathUtils.smoothstep(introTime, 0.95 + index * 0.1, 1.65 + index * 0.1)
        block.target.y += (1 - entrance) * 0.36
        block.target.z -= (1 - entrance) * 0.12
      }
      if (!reducedMotion && selected === null && held === null && introTime >= INTRO_DURATION) {
        block.target.y += Math.sin(sceneTime * 0.65 + index * 1.7) * 0.014
      }
    }
  }

  function physics(dt: number) {
    for (const [index, block] of blocks.entries()) {
      if (held === index) {
        previousPosition.copy(block.group.position)
        block.group.position.lerp(dragTarget, 1 - Math.exp(-30 * dt))
        block.velocity.copy(block.group.position).sub(previousPosition).divideScalar(dt).clampLength(0, 6)
      } else {
        block.velocity.addScaledVector(temporary.copy(block.target).sub(block.group.position), 34 * dt)
        block.velocity.multiplyScalar(Math.exp(-9 * dt))
        block.group.position.addScaledVector(block.velocity, dt)
      }
      const speed = block.spin.length()
      if (speed > 0.001) {
        temporary.copy(block.spin).divideScalar(speed)
        angularStep.setFromAxisAngle(temporary, speed * dt)
        block.group.quaternion.premultiply(angularStep)
      }
      block.spin.multiplyScalar(Math.exp(-7 * dt))
      block.group.quaternion.slerp(block.rotation, 1 - Math.exp(-8 * dt))
      const position = block.group.position
      position.x = THREE.MathUtils.clamp(position.x, -3.35 + block.width / 2, 3.35 - block.width / 2)
      position.y = THREE.MathUtils.clamp(position.y, 0.95, 2.65)
      position.z = THREE.MathUtils.clamp(position.z, -1.55, 1.05)
    }
    // Three lightweight box proxies provide contact when pieces are pushed.
    // The spring return is deterministic; no external physics runtime is used.
    for (let a = 0; a < blocks.length; a++) {
      for (let b = a + 1; b < blocks.length; b++) {
        const first = blocks[a]
        const second = blocks[b]
        temporary.copy(second.group.position).sub(first.group.position)
        const x = (first.width + second.width) / 2 + 0.025 - Math.abs(temporary.x)
        const y = BLOCK_HEIGHT - Math.abs(temporary.y)
        const z = BLOCK_DEPTH + 0.05 - Math.abs(temporary.z)
        if (x <= 0 || y <= 0 || z <= 0) continue
        const penetration = Math.min(x, y, z)
        normal.set(0, 0, 0)
        if (penetration === x) normal.x = Math.sign(temporary.x) || 1
        else if (penetration === y) normal.y = Math.sign(temporary.y) || 1
        else normal.z = Math.sign(temporary.z) || 1
        const firstMass = held === a ? 0 : 1
        const secondMass = held === b ? 0 : 1
        const total = firstMass + secondMass
        first.group.position.addScaledVector(normal, -penetration * firstMass / total)
        second.group.position.addScaledVector(normal, penetration * secondMass / total)
        const closing = temporary.copy(second.velocity).sub(first.velocity).dot(normal)
        if (closing < 0) {
          first.velocity.addScaledVector(normal, closing * firstMass / total)
          second.velocity.addScaledVector(normal, -closing * secondMass / total)
        }
      }
    }
  }

  function cast(input: PointerInput) {
    pointer.set(input.x, input.y)
    scene.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
  }

  function hitBlock() {
    const hit = raycaster.intersectObjects(blockMeshes, false)[0]
    if (!hit) return null
    const index = blockMeshes.indexOf(hit.object as ProjectBlock['mesh'])
    return index >= 0 && blocks[index].group.visible ? { index, point: hit.point } : null
  }

  reset(true)
  updateSurface(reducedMotion ? 1 : 0)
  blocks.forEach(block => { block.group.visible = reducedMotion })

  return {
    update(_elapsed, delta) {
      const dt = Math.min(delta, 0.05)
      sceneTime += dt
      introTime = Math.min(INTRO_DURATION, introTime + dt)
      const reveal = reducedMotion ? 1 : THREE.MathUtils.smoothstep(introTime, 0.4, 1.35)
      islandController.update(sceneTime, dt)
      updateSurface(reveal)
      world.rotation.y = THREE.MathUtils.damp(world.rotation.y, targetYaw, 8, dt)
      world.rotation.x = THREE.MathUtils.damp(world.rotation.x, targetTilt, 8, dt)
      updateTargets()
      accumulator += dt
      while (accumulator >= STEP) {
        physics(STEP)
        accumulator -= STEP
      }
      for (const [index, block] of blocks.entries()) {
        const entrance = reducedMotion ? 1 : THREE.MathUtils.smoothstep(introTime, 0.95 + index * 0.1, 1.65 + index * 0.1)
        const size = (selected === index ? 1.045 : selected !== null ? 0.94 : 1) * (0.91 + entrance * 0.09)
        block.group.visible = entrance > 0.001
        block.group.scale.setScalar(THREE.MathUtils.damp(block.group.scale.x, size, 9, dt))
        block.mesh.material.opacity = entrance
        const transparent = entrance < 0.999
        if (block.mesh.material.transparent !== transparent) {
          block.mesh.material.transparent = transparent
          block.mesh.material.needsUpdate = true
        }
        block.labelMaterial.opacity = entrance
        const highlight = selected === index ? 0.1 : hovered === index || held === index ? 0.05 : 0
        block.mesh.material.emissiveIntensity = THREE.MathUtils.damp(block.mesh.material.emissiveIntensity, highlight, 10, dt)
      }
      particles.update(sceneTime, dt, { intro: introTime / INTRO_DURATION, blocks: blockPositions, selected, dragging: held })
    },
    pointer(type, input) {
      if (type === 'cancel') { cancelGesture(); return }
      if (type === 'down') completeIntro()
      cast(input)
      if (type === 'down') {
        pointerStart.copy(pointer)
        moved = false
        touchGesture = input.pointerType === 'touch'
        const hit = hitBlock()
        if (hit) {
          held = hit.index
          gesture = 'block'
          const block = blocks[held]
          camera.getWorldDirection(normal)
          dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point)
          block.group.getWorldPosition(dragOffset).sub(hit.point)
          dragTarget.copy(block.group.position)
          dragStart.copy(dragTarget)
          block.spin.set(0, 0, 0)
          renderer.domElement.style.cursor = 'grabbing'
        } else {
          gesture = 'world'
          islandController.pointer?.('down', input)
          renderer.domElement.style.cursor = 'grabbing'
        }
      } else if (type === 'move') {
        if (gesture && input.pressed) {
          const dx = pointer.x - pointerStart.x
          const dy = pointer.y - pointerStart.y
          // Let a vertical touch gesture belong to the page immediately. The
          // viewport's pan-y policy subsequently delivers pointercancel too.
          if (touchGesture && !moved && Math.abs(dy) > 0.025 && Math.abs(dy) > Math.abs(dx) * 1.15) {
            cancelGesture()
            return
          }
          moved ||= Math.hypot(dx, dy) > (touchGesture ? 0.035 : 0.025)
          if (held !== null && raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
            dragPoint.add(dragOffset)
            world.worldToLocal(dragPoint)
            dragTarget.copy(dragPoint)
            if (touchGesture) {
              dragTarget.y = dragStart.y + (dragTarget.y - dragStart.y) * 0.14
              dragTarget.z = dragStart.z
            }
            const block = blocks[held]
            dragTarget.x = THREE.MathUtils.clamp(dragTarget.x, -3.25 + block.width / 2, 3.25 - block.width / 2)
            dragTarget.y = THREE.MathUtils.clamp(dragTarget.y, 1, 2.6)
            dragTarget.z = THREE.MathUtils.clamp(dragTarget.z, -1.5, 1)
          } else if (gesture === 'world') {
            targetYaw = THREE.MathUtils.clamp(targetYaw + input.dx * 0.65, -0.35, 0.35)
            targetTilt = THREE.MathUtils.clamp(targetTilt - input.dy * (touchGesture ? 0.08 : 0.3), -0.14, 0.14)
          }
        } else if (!input.pressed) {
          hovered = hitBlock()?.index ?? null
          renderer.domElement.style.cursor = hovered !== null ? 'grab' : ''
        }
      } else if (type === 'up') {
        if (held !== null) {
          const index = held
          const block = blocks[index]
          held = null
          if (!moved) selectProject(index)
          else {
            block.velocity.clampLength(0, touchGesture ? 4.2 : 5.2)
            if (touchGesture) block.velocity.y *= 0.2
            block.spin.set(block.velocity.z * 0.16, block.velocity.x * 0.07, -block.velocity.x * 0.2)
          }
        } else if (gesture === 'world') {
          islandController.pointer?.(moved ? 'cancel' : 'up', input)
        }
        gesture = null
        renderer.domElement.style.cursor = ''
      }
    },
    action(action, value) {
      if (action === 'project' && value !== undefined) { cancelGesture(); selectProject(value) }
      if (action === 'close') { cancelGesture(); selectProject(null) }
      if (action === 'reset') reset()
      if (action === 'replay') reset(true)
      if (action === 'nudge') {
        completeIntro()
        cancelGesture()
        nudgeCount++
        blocks.forEach((block, index) => {
          const sign = (index + nudgeCount) % 2 ? -1 : 1
          block.velocity.set(sign * 1.8, 1.2 - index * 0.2, sign * 0.3)
          block.spin.set(0.2, sign * 0.55, sign * 0.45)
        })
      }
    },
    dispose() {
      disposed = true
      cancelGesture()
      islandController.dispose?.()
      particles.dispose?.()
    },
  }
}
