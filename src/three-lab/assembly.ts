import * as THREE from 'three'
import type { SceneFactory } from './types'

const smooth = (a: number, b: number, t: number) => {
  const v = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
  return v * v * (3 - 2 * v)
}

function layerTexture(kind: 'interface' | 'logic' | 'data') {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 576
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = kind === 'data' ? '#8bc6ee' : kind === 'logic' ? '#bfdff7' : '#f2faff'
  ctx.fillRect(0, 0, 1024, 576)
  ctx.fillStyle = kind === 'data' ? '#4d9cd6' : kind === 'logic' ? '#7bb9e5' : '#b3dcf7'
  ctx.fillRect(0, 0, 1024, 56)
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(29 + i * 25, 28, 6, 0, Math.PI * 2)
    ctx.fillStyle = ['#398bd2', '#6bbbe8', '#9bd1ed'][i]
    ctx.fill()
  }
  ctx.fillStyle = '#185784'
  ctx.font = '500 19px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(kind === 'interface' ? 'wandr.app' : kind === 'logic' ? 'application / logic' : 'application / data', 512, 35)
  ctx.textAlign = 'left'
  if (kind === 'interface') {
    ctx.fillStyle = '#e2eff9'
    ctx.fillRect(28, 83, 179, 460)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === 0 ? '#8fc8ee' : '#c3dbee'
      ctx.fillRect(46, 104 + i * 58, 140 - (i % 2) * 25, 17)
    }
    ctx.fillStyle = '#afd6f1'
    ctx.fillRect(240, 96, 430, 27)
    ctx.fillStyle = '#dfedf7'
    ctx.fillRect(240, 144, 690, 14)
    ctx.fillRect(240, 191, 740, 257)
    ctx.strokeStyle = '#58a7df'
    ctx.lineWidth = 5
    ctx.beginPath()
    ;[[275, 385], [370, 342], [479, 363], [587, 279], [704, 307], [810, 228], [925, 260]].forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.stroke()
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#c6e1f3'
      ctx.fillRect(240 + 253 * i, 475, 234, 67)
    }
    ctx.strokeStyle = '#4b99d1'
    ctx.lineWidth = 3
    ctx.strokeRect(28, 83, 179, 460)
    ctx.strokeRect(240, 191, 740, 257)
    for (let i = 0; i < 3; i++) ctx.strokeRect(240 + 253 * i, 475, 234, 67)
  } else if (kind === 'logic') {
    const nodes = [[92, 185, 'INPUT'], [392, 185, 'LOGIC'], [692, 185, 'OUTPUT']]
    ctx.strokeStyle = '#1b73b1'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(178, 234)
    ctx.lineTo(790, 234)
    ctx.stroke()
    nodes.forEach(([x, y, text]) => {
      ctx.fillStyle = '#f5fbff'
      ctx.fillRect(Number(x), Number(y), 217, 104)
      ctx.strokeRect(Number(x), Number(y), 217, 104)
      ctx.font = '500 24px monospace'
      ctx.fillStyle = '#165d93'
      ctx.fillText(String(text), Number(x) + 34, Number(y) + 60)
    })
    ctx.fillStyle = '#276fa2'
    ctx.font = '26px monospace'
    ctx.fillText('request → validate → respond', 206, 385)
    ctx.fillStyle = '#bfdcec'
    ctx.fillRect(206, 421, 606, 9)
    ctx.fillRect(206, 445, 448, 9)
  } else {
    ctx.font = '500 23px monospace'
    ctx.fillStyle = '#185782'
    ctx.fillText('id', 91, 118)
    ctx.fillText('collection', 290, 118)
    ctx.fillText('status', 747, 118)
    const rows = ['itineraries', 'places', 'activities', 'saved_trips', 'preferences']
    rows.forEach((row, i) => {
      const y = 168 + i * 72
      ctx.fillStyle = i % 2 ? '#75b3df' : '#afd8f3'
      ctx.fillRect(58, y - 29, 908, 63)
      ctx.fillStyle = '#175783'
      ctx.fillText(`0${i + 1}`, 91, y + 9)
      ctx.fillText(row, 290, y + 9)
      ctx.fillStyle = '#155f90'
      ctx.fillText('ready', 747, y + 9)
    })
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function labelTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 88
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1268a9'
  ctx.beginPath()
  ctx.roundRect(0, 0, 512, 88, 30)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 29px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 45)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const createAssembly: SceneFactory = ({ scene, camera, reducedMotion, onInfo }) => {
  camera.fov = 36
  camera.position.set(0, .15, 7.9)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
  const assembly = new THREE.Group()
  scene.add(assembly)
  const kinds = ['data', 'logic', 'interface'] as const
  const labels = ['03 / DATA', '02 / LOGIC', '01 / INTERFACE']
  const layers = kinds.map((kind, i) => {
    const group = new THREE.Group()
    assembly.add(group)
    const shellMaterial = new THREE.MeshPhysicalMaterial({ color: i === 2 ? '#b9dff8' : '#489ed9', metalness: .12, roughness: .28, clearcoat: .65, transparent: true, depthWrite: false, opacity: 1 })
    const shell = new THREE.Mesh(new THREE.BoxGeometry(4.08, 2.36, .065), shellMaterial)
    shell.renderOrder = i * 3
    group.add(shell)
    const faceMaterial = new THREE.MeshBasicMaterial({ map: layerTexture(kind), transparent: true, depthWrite: false, toneMapped: false })
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.98, 2.24), faceMaterial)
    face.position.z = .04
    face.renderOrder = i * 3 + 1
    group.add(face)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: '#1470b3', transparent: true, opacity: .9 })
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), edgeMaterial)
    edge.renderOrder = i * 3 + 2
    group.add(edge)
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture(labels[i]), transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
    const label = new THREE.Sprite(labelMaterial)
    label.renderOrder = 100 + i
    label.scale.set(1.3, .223, 1)
    label.position.set(-1.33, 1.39, .03)
    group.add(label)
    return { group, shellMaterial, faceMaterial, edgeMaterial, labelMaterial }
  })

  let disposed = false
  const screenMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, color: '#ffffff', toneMapped: false })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.91, 2.10), screenMaterial)
  screen.renderOrder = 10
  screen.position.set(0, -.065, .052)
  layers[2].group.add(screen)
  new THREE.TextureLoader().load('/demos/wandr.jpg', (texture) => {
    if (disposed) { texture.dispose(); return }
    texture.colorSpace = THREE.SRGBColorSpace
    screenMaterial.map = texture
    screenMaterial.needsUpdate = true
  })

  const wireMaterial = new THREE.LineBasicMaterial({ color: '#258acb', transparent: true })
  const connectorPoints = new Float32Array(4 * 2 * 3)
  const connectors = new THREE.BufferGeometry()
  connectors.setAttribute('position', new THREE.BufferAttribute(connectorPoints, 3))
  const connectorLines = new THREE.LineSegments(connectors, wireMaterial)
  assembly.add(connectorLines)

  let clock = 0
  let manualProgress: number | null = reducedMotion ? .79 : null
  let lastLabel = ''
  let dragProgress = 0

  function renderPhase(progress: number) {
    const t = progress * 8
    const open = smooth(.6, 2.3, t) * (1 - smooth(3.6, 5, t))
    const fill = smooth(.05, 1.4, t)
    const finish = smooth(4.2, 5.0, t)
    assembly.rotation.y = -.3 * open
    assembly.rotation.x = .07 * open
    assembly.position.y = -.12 * open
    layers.forEach((layer, i) => {
      const index = i - 1
      layer.group.position.set(index * 1.02 * open, index * .51 * open, index * .87 * open + i * .075)
      layer.shellMaterial.opacity = (i === 2 ? .22 + .78 * fill : .75 * fill) * (1 - open * .65) * (i === 2 ? 1 : 1 - finish)
      layer.faceMaterial.opacity = (i === 2 ? .78 + .22 * fill : fill) * (1 - open * .12) * (i === 2 ? 1 : 1 - finish)
      layer.edgeMaterial.opacity = i === 2 ? .95 - .6 * finish : .7 * (1 - finish)
      layer.labelMaterial.opacity = i === 2 ? open : open * (1 - finish)
    })
    screenMaterial.opacity = finish
    wireMaterial.opacity = open * .35
    const corners = [[-1.9, -1.08], [1.9, -1.08], [-1.9, 1.08], [1.9, 1.08]]
    corners.forEach(([x, y], i) => {
      for (let end = 0; end < 2; end++) {
        const layer = layers[end * 2].group
        const at = (i * 2 + end) * 3
        connectorPoints[at] = x + layer.position.x
        connectorPoints[at + 1] = y + layer.position.y
        connectorPoints[at + 2] = layer.position.z
      }
    })
    connectors.attributes.position.needsUpdate = true
    const phase = t < 1.25 ? '01 · Sketch the idea' : t < 4.0 ? '02 · Connect interface, logic, and data' : '03 · Ship a real product'
    if (phase !== lastLabel) {
      lastLabel = phase
      onInfo(phase, t < 1.25 ? 'A wireframe becomes a working product.' : t < 4 ? 'Drag horizontally to explore the layers.' : 'Wandr · an AI-assisted travel planner.')
    }
  }
  renderPhase(manualProgress ?? 0)

  return {
    getProgress() { return manualProgress ?? clock / 8 },
    update(_elapsed, delta) {
      if (manualProgress === null) {
        clock += Math.min(delta, .1)
        if (clock >= 8) {
          if (reducedMotion) manualProgress = .79
          else clock %= 8
        }
      }
      renderPhase(manualProgress ?? clock / 8)
    },
    pointer(type, input) {
      if (type === 'down') {
        dragProgress = manualProgress ?? clock / 8
        manualProgress = dragProgress
      } else if (type === 'move' && input.pressed) {
        dragProgress = THREE.MathUtils.clamp(dragProgress + input.dx * .55, 0, 1)
        manualProgress = dragProgress
      }
    },
    action(action, value) {
      if (action === 'progress' && typeof value === 'number') manualProgress = THREE.MathUtils.clamp(value, 0, 1)
      if (action === 'replay') { clock = 0; manualProgress = null }
    },
    dispose() { disposed = true },
  }
}
