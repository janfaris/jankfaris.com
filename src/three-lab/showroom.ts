import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneFactory } from './types'

export const showroomProjects = [
  { name: 'Wandr', detail: 'AI travel planning, from the first idea to the daily itinerary.', image: '/demos/wandr.jpg', url: 'https://wandrtravelai.com' },
  { name: 'Janga', detail: 'A mobile app, designed and shipped to the App Store.', image: '/demos/janga.jpg', url: 'https://apps.apple.com/us/app/janga/id6744530407' },
  { name: 'demotape', detail: 'Turn a working product into a recorded demo.', image: '/demos/demotape.jpg', url: 'https://github.com/janfaris/demotape' },
]

export const createShowroom: SceneFactory = ({ scene, camera, renderer, reducedMotion, onInfo }) => {
  camera.position.set(0, 1.9, 8.8)
  camera.lookAt(0, 0, 0)
  const root = new THREE.Group()
  root.rotation.y = -.17
  scene.add(root)
  const aluminum = new THREE.MeshStandardMaterial({ color: '#c1cedb', metalness: .85, roughness: .28 })
  const bezel = new THREE.MeshStandardMaterial({ color: '#10171e', metalness: .45, roughness: .25 })
  const keys = new THREE.MeshStandardMaterial({ color: '#2c3742', roughness: .45, metalness: .4 })
  const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, radius = .07) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  const laptop = new THREE.Group()
  laptop.position.set(-.55, -.15, -.2)
  root.add(laptop)
  const lid = new THREE.Group()
  lid.position.set(0, -.64, 0)
  lid.rotation.x = -.09
  laptop.add(lid)
  lid.add(box(3.95, 2.55, .13, aluminum, 0, 1.2, 0, .1))
  lid.add(box(3.82, 2.39, .045, bezel, 0, 1.22, .08, .08))
  const displayMaterial = new THREE.MeshBasicMaterial({ color: '#e3edf5', toneMapped: false })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.61, 2.14), displayMaterial)
  screen.position.set(0, 1.24, .106)
  lid.add(screen)
  const webcam = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), new THREE.MeshBasicMaterial({ color: '#31424f' }))
  webcam.position.set(0, 2.38, .115)
  lid.add(webcam)
  laptop.add(box(4.01, .12, 2.4, aluminum, 0, -.76, 1.1, .08))
  laptop.add(box(3.5, .012, .96, keys, 0, -.691, .69, .03))
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 13; col++) {
      const key = box(.225, .024, .14, aluminum, -1.51 + col * .252, -.668, .32 + row * .174, .018)
      laptop.add(key)
    }
  }
  laptop.add(box(.92, .014, .17, keys, 0, -.653, 1.105, .025))
  laptop.add(box(1.3, .008, .67, new THREE.MeshStandardMaterial({ color: '#9aabba', metalness: .65, roughness: .42 }), 0, -.694, 1.76, .05))

  const phone = new THREE.Group()
  phone.position.set(1.93, .1, 1.18)
  phone.rotation.set(-.09, -.24, -.08)
  root.add(phone)
  phone.add(box(1.16, 2.37, .15, aluminum, 0, 0, 0, .15))
  phone.add(box(1.09, 2.29, .07, bezel, 0, 0, .082, .135))
  const phoneMaterial = new THREE.MeshBasicMaterial({ color: '#dbeeff', toneMapped: false })
  const mobileScreen = new THREE.Mesh(new THREE.PlaneGeometry(.99, 2.12), phoneMaterial)
  mobileScreen.position.set(0, 0, .122)
  phone.add(mobileScreen)
  phone.add(box(.32, .085, .025, bezel, 0, .98, .15, .04))
  phone.add(box(.32, .017, .014, new THREE.MeshBasicMaterial({ color: '#e8eff5' }), 0, -1.01, .15, .007))

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, .12, 96), new THREE.MeshStandardMaterial({ color: '#e1eaf1', roughness: .48, metalness: .15 }))
  plinth.position.set(0, -1.49, .45)
  plinth.receiveShadow = true
  plinth.castShadow = true
  scene.add(plinth)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25, .009, 8, 96), new THREE.MeshBasicMaterial({ color: '#7ebcff' }))
  ring.rotation.x = Math.PI / 2
  ring.position.copy(plinth.position).y += .063
  scene.add(ring)

  let selected = 0
  let disposed = false
  let impulse = 0
  let dxTotal = 0
  let yaw = -.17
  let tilt = -.025
  const textures: THREE.Texture[] = []
  const mobileTextures: THREE.Texture[] = []
  const loader = new THREE.TextureLoader()
  showroomProjects.forEach((project, index) => {
    const texture = loader.load(project.image, (loaded) => {
      if (disposed) { loaded.dispose(); return }
      loaded.colorSpace = THREE.SRGBColorSpace
      loaded.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
      const canvas = document.createElement('canvas')
      canvas.width = 500
      canvas.height = 1060
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#f5f8fb'
      ctx.fillRect(0, 0, 500, 1060)
      ctx.fillStyle = '#133b62'
      ctx.font = '600 32px Arial'
      ctx.fillText(project.name, 30, 92)
      const source = loaded.image as HTMLImageElement
      const cropWidth = Math.min(source.width, source.height * .82)
      ctx.drawImage(source, (source.width - cropWidth) / 2, 0, cropWidth, source.height, 20, 130, 460, 735)
      ctx.fillStyle = '#258bea'
      ctx.beginPath()
      ctx.roundRect(30, 924, 440, 60, 16)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '500 22px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Explore ' + project.name, 250, 963)
      const mobile = new THREE.CanvasTexture(canvas)
      mobile.colorSpace = THREE.SRGBColorSpace
      mobileTextures[index] = mobile
      if (selected === index) { displayMaterial.map = loaded; phoneMaterial.map = mobile; displayMaterial.color.set('white'); phoneMaterial.color.set('white'); displayMaterial.needsUpdate = true; phoneMaterial.needsUpdate = true }
    })
    textures.push(texture)
  })

  function select(index: number) {
    selected = (index + showroomProjects.length) % showroomProjects.length
    const project = showroomProjects[selected]
    if (textures[selected]?.image) { displayMaterial.map = textures[selected]; displayMaterial.color.set('white'); displayMaterial.needsUpdate = true }
    if (mobileTextures[selected]) { phoneMaterial.map = mobileTextures[selected]; phoneMaterial.color.set('white'); phoneMaterial.needsUpdate = true }
    impulse = reducedMotion ? 0 : 1
    onInfo(project.name, project.detail)
  }
  select(0)
  return {
    update(elapsed, delta) {
      impulse = THREE.MathUtils.damp(impulse, 0, 5, delta)
      root.rotation.y = THREE.MathUtils.damp(root.rotation.y, yaw + (reducedMotion ? 0 : Math.sin(elapsed * .42) * .055), 5, delta)
      root.rotation.x = THREE.MathUtils.damp(root.rotation.x, tilt, 5, delta)
      root.position.y = (reducedMotion ? 0 : Math.sin(elapsed * .9) * .035) + impulse * .12
      phone.rotation.z = -.08 - impulse * .06
    },
    pointer(type, pointer) {
      if (type === 'cancel') { dxTotal = 0; return }
      if (type === 'down') dxTotal = 0
      if (type === 'move') {
        if (pointer.pressed) dxTotal += pointer.dx
        yaw = THREE.MathUtils.clamp(pointer.x * .2 - .17, -.5, .2)
        tilt = pointer.y * -.035
      }
      if (type === 'up' && Math.abs(dxTotal) > .16) select(selected + (dxTotal < 0 ? 1 : -1))
    },
    action(action, value) {
      if (action === 'next') select(selected + 1)
      if (action === 'previous') select(selected - 1)
      if (action === 'project' && value !== undefined) select(value)
      if (action === 'recenter') { yaw = -.17; tilt = -.025 }
    },
    dispose() { disposed = true; textures.forEach(t => t.dispose()); mobileTextures.forEach(t => t.dispose()) },
  }
}
