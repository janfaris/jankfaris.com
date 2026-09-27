import * as THREE from 'three'
import type { SceneController, SceneFactory } from '../three-lab/types'
import type { BayInput } from './input'
import { coastLoops, mulberry32, sampleIsland, SAN_JUAN, toWorld } from './shapes'

/**
 * The bay: one particle system that runs behind the whole page. The water
 * glows where it is disturbed (pointer, taps, scroll), the way Mosquito Bay
 * in Vieques does, and on scroll the same particles swarm into the real
 * Natural Earth coastline of Puerto Rico. The page writes scroll targets and
 * pointer input into a shared object; the scene reads it every frame.
 */

const RIPPLES = 6

// Simplex noise by Ian McEwan and Stefan Gustavson (MIT), used for the drift.
const NOISE = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const particleVertex = (trail: number) => /* glsl */ `
#define TRAIL ${trail}
#define RIPPLES ${RIPPLES}
uniform float uTime;
uniform float uMorph;
uniform float uIntro;
uniform float uPixels;
uniform float uIslandSize;
uniform float uBright;
uniform float uAgitation;
uniform float uMaxPoint;
uniform float uScale;
uniform vec3 uBeacon;
uniform vec3 uDrop;
uniform vec4 uTrail[TRAIL];
uniform vec4 uRipples[RIPPLES];
attribute vec3 aIsland;
attribute vec4 aRand;
attribute float aKind;
attribute float aEdge;
varying float vGlow;
varying float vAlpha;
${NOISE}
void main() {
  float t = uTime;
  vec3 home = position;
  float n1 = snoise(vec3(home.xz * 0.16, t * 0.045 + aRand.y));
  float n2 = snoise(vec3(home.xz * 0.16 + 17.3, t * 0.045 - aRand.y));
  vec3 water = home + vec3(n1, 0.0, n2) * 0.42;
  water.y += (sin(home.x * 0.8 + t * 0.7 + aRand.y * 6.2831) + sin(home.z * 1.1 - t * 0.5)) * 0.018;

  float land = step(0.5, aKind) * smoothstep(aRand.z * 0.5, aRand.z * 0.5 + 0.5, uMorph);
  float flight = land * (1.0 - land) * 4.0;
  vec3 p = mix(water, aIsland, land);
  p.y += flight * (0.35 + aRand.w * 1.4);
  float swirl = flight * (aRand.y - 0.5) * 2.6;
  vec2 rel = p.xz - aIsland.xz;
  p.xz = aIsland.xz + mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl)) * rel;

  float glow = 0.0;
  vec2 push = vec2(0.0);
  for (int i = 0; i < TRAIL; i++) {
    vec4 tr = uTrail[i];
    float age = t - tr.z;
    if (tr.w <= 0.0 || age < 0.0 || age > 3.2) continue;
    vec2 d = p.xz - tr.xy;
    float radius = 0.26 + age * 0.5;
    float f = tr.w * exp(-dot(d, d) / (radius * radius)) * exp(-age * 1.35);
    glow += f;
    vec2 dir = d / (length(d) + 0.0001);
    push += (dir * 0.6 + vec2(-dir.y, dir.x) * (aRand.y - 0.5) * 1.8) * f;
  }
  for (int i = 0; i < RIPPLES; i++) {
    vec4 rp = uRipples[i];
    float age = t - rp.z;
    if (rp.w <= 0.0 || age < 0.0 || age > 4.5) continue;
    float dist = length(p.xz - rp.xy);
    float ring = exp(-pow((dist - age * 2.1) * 2.6, 2.0)) * exp(-age * 0.85) * rp.w;
    glow += ring * 1.25;
    p.y += ring * 0.1;
  }
  p.xz += push * 0.16 * (1.0 - 0.6 * land);
  p.y += glow * 0.04;

  float spark = pow(max(0.0, sin(t * (0.35 + aRand.x * 1.1) + aRand.y * 91.0)), 28.0);
  float agitation = uAgitation * (0.55 + 0.45 * n1);
  float fromSanJuan = length(p.xz - uBeacon.xz);
  float pulse = exp(-pow((fromSanJuan - mod(t * 2.3, 16.0)) * 1.8, 2.0));
  float island = land * (0.3 + aEdge * 0.8 + 0.14 * sin(p.x * 1.4 - t * 1.6 + p.z * 0.8) + pulse * 0.55);
  float beacon = land * exp(-fromSanJuan * fromSanJuan * 7.0) * (0.9 + 0.5 * sin(t * 3.2));
  float g = glow + spark * 0.85 + agitation * 0.9 + island + beacon * 1.6;
  vGlow = g;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.001);
  float size = (0.7 + aRand.x * 1.5) * mix(1.0, uIslandSize, land) * (1.0 + min(g, 2.0) * 0.6);
  float pixels = size * uScale * uPixels * 0.0105 / depth;
  gl_PointSize = clamp(pixels, 1.0, uMaxPoint);
  float reveal = clamp(uIntro * 14.0 - length(water.xz - uDrop.xz) * 0.9, 0.0, 1.0);
  float fog = smoothstep(52.0, 20.0, depth);
  vAlpha = reveal * fog * uBright * clamp(pixels, 0.0, 1.0);
}
`

const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uCyan;
uniform vec3 uWhite;
varying float vGlow;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float g = clamp(vGlow, 0.0, 3.0);
  float core = exp(-r2 * 5.5);
  float halo = exp(-r2 * 1.8) * 0.3 * smoothstep(0.2, 1.4, g);
  vec3 color = mix(uDeep, uCyan, smoothstep(0.05, 0.9, g));
  color = mix(color, uWhite, smoothstep(1.1, 2.6, g) * core);
  float alpha = (core + halo) * vAlpha * (0.16 + 0.84 * smoothstep(0.0, 1.2, g));
  gl_FragColor = vec4(color, alpha);
}
`

const BACKGROUND_VERTEX = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`

const BACKGROUND_FRAGMENT = /* glsl */ `
uniform float uHorizon;
uniform float uTime;
uniform float uAspect;
uniform float uLift;
uniform float uBright;
uniform vec2 uIsland;
varying vec2 vNdc;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float y = vNdc.y;
  float above = smoothstep(uHorizon - 0.004, uHorizon + 0.004, y);
  float sk = clamp((y - uHorizon) / max(1.0 - uHorizon, 0.001), 0.0, 1.0);
  vec3 sky = mix(vec3(0.035, 0.07, 0.125), vec3(0.01, 0.018, 0.038), pow(sk, 0.55));
  float wk = clamp((uHorizon - y) / (uHorizon + 1.0), 0.0, 1.0);
  vec3 water = mix(vec3(0.018, 0.045, 0.085), vec3(0.005, 0.012, 0.025), pow(wk, 0.5));
  vec3 color = mix(water, sky, above);
  color += vec3(0.05, 0.12, 0.2) * exp(-abs(y - uHorizon) * 38.0) * 0.55;
  if (y > uHorizon) {
    vec2 grid = vec2(vNdc.x * uAspect, y) * 95.0;
    vec2 cell = floor(grid);
    vec2 f = fract(grid) - 0.5;
    float h = hash(cell);
    float star = step(0.9925, h) * exp(-dot(f, f) * 42.0) * (0.55 + 0.45 * sin(uTime * (0.8 + h * 2.4) + h * 60.0));
    color += vec3(0.62, 0.78, 1.0) * star * 0.42 * smoothstep(uHorizon, uHorizon + 0.12, y);
  }
  vec2 fromIsland = (vNdc - uIsland) * vec2(uAspect * 0.55, 1.0);
  color += vec3(0.02, 0.055, 0.1) * exp(-dot(fromIsland, fromIsland) * 1.6) * uLift;
  float vignette = length(vNdc * vec2(0.85, 1.05));
  color *= 1.0 - 0.38 * smoothstep(0.55, 1.5, vignette);
  color *= mix(0.82, 1.0, uBright);
  color += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0 * 1.5;
  gl_FragColor = vec4(color, 1.0);
}
`

const BEACON_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  float r = length(c);
  float rings = 0.0;
  for (int i = 0; i < 3; i++) {
    float phase = fract(uTime * 0.42 + float(i) / 3.0);
    rings += exp(-pow((r - phase) * 15.0, 2.0)) * (1.0 - phase);
  }
  float core = exp(-r * r * 110.0);
  float alpha = (rings * 0.5 + core) * uOpacity * (1.0 - smoothstep(0.85, 1.0, r));
  gl_FragColor = vec4(vec3(0.62, 0.9, 1.0), alpha);
}
`

const damp = (current: number, target: number, lambda: number, delta: number) => current + (target - current) * (1 - Math.exp(-lambda * delta))
const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function createBay(input: BayInput): SceneFactory {
  return ({ scene, camera, renderer, reducedMotion }): SceneController => {
    const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    const count = compact ? 22000 : 64000
    // Phones: shorter wake history and smaller halos keep additive overdraw in check.
    const TRAIL = compact ? 32 : 48
    const random = mulberry32(19650)

    // This scene is all additive light: no shadows, fog, or lit materials.
    renderer.shadowMap.enabled = false
    scene.background = null
    scene.fog = null
    scene.environment = null
    camera.fov = 42
    camera.near = .05
    camera.far = 120

    // Portrait phones look further down at the water so it fills the screen
    // instead of leaving the top half as empty sky.
    const portrait = window.innerWidth / Math.max(window.innerHeight, 1) < .8
    const heroPos = portrait ? new THREE.Vector3(0, 2, 7.4) : new THREE.Vector3(0, 1.15, 7.4)
    const heroLook = portrait ? new THREE.Vector3(0, 0, -1.2) : new THREE.Vector3(0, 0, -2.6)
    const restPos = new THREE.Vector3(0, 2.3, 8.6)
    const restLook = new THREE.Vector3(0, 0, -3.4)

    // Water homes: sampled uniformly on screen from the hero camera, plus a
    // wider field that fills the view once the camera rises over the island.
    const sampler = new THREE.PerspectiveCamera(42, Math.max(window.innerWidth / Math.max(window.innerHeight, 1), 1.3), .05, 120)
    sampler.position.copy(heroPos)
    sampler.lookAt(heroLook)
    sampler.updateMatrixWorld()
    const horizonProbe = new THREE.Vector3(0, 0, -1e4).add(heroPos).project(sampler)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hit = new THREE.Vector3()

    const homes = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      let x = 0
      let z = 0
      if (random() < .74) {
        for (let tries = 0; tries < 8; tries++) {
          ndc.set(random() * 2.16 - 1.08, -1.06 + random() * (horizonProbe.y - .015 + 1.06))
          ray.setFromCamera(ndc, sampler)
          if (ray.ray.intersectPlane(plane, hit) && hit.distanceTo(heroPos) < 58) { x = hit.x; z = hit.z; break }
        }
      } else {
        x = (random() * 2 - 1) * 17
        z = -13 + random() * 22
      }
      homes[i * 3] = x
      homes[i * 3 + 1] = -random() * .22
      homes[i * 3 + 2] = z
    }

    const islandShare = Math.round(count * .62)
    const islandPoints = sampleIsland(islandShare, random)
    // Shuffle so any prefix of the buffer (see the quality governor) still
    // samples the coast, Vieques, and Culebra, not just the main island fill.
    for (let i = islandPoints.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[islandPoints[i], islandPoints[j]] = [islandPoints[j], islandPoints[i]]
    }
    const island = new Float32Array(count * 3)
    const kind = new Float32Array(count)
    const edge = new Float32Array(count)
    const rand = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      rand[i * 4] = Math.pow(random(), 2.2)
      rand[i * 4 + 1] = random()
      rand[i * 4 + 2] = random()
      rand[i * 4 + 3] = random()
    }
    // Spread island duty evenly through the buffer so the swarm comes from everywhere.
    for (let n = 0; n < islandShare; n++) {
      const i = Math.floor(n * count / islandShare)
      const point = islandPoints[n]
      island[i * 3] = point.x
      island[i * 3 + 1] = point.y
      island[i * 3 + 2] = point.z
      kind[i] = point.edge >= 1 ? 2 : 1
      edge[i] = point.edge
      // Coast points arrive last so the outline draws itself around the fill.
      if (point.edge >= 1) rand[i * 4 + 2] = .55 + random() * .45
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(homes, 3))
    geometry.setAttribute('aIsland', new THREE.BufferAttribute(island, 3))
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4))
    geometry.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
    geometry.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1))

    const [sjX, sjZ] = toWorld(SAN_JUAN)
    const beaconWorld = new THREE.Vector3(sjX, .04, sjZ)
    const drop = new THREE.Vector3(-1.1, 0, 2.6)
    ndc.set(-.3, -.45)
    ray.setFromCamera(ndc, sampler)
    if (ray.ray.intersectPlane(plane, hit)) drop.set(hit.x, 0, hit.z)
    const trail = Array.from({ length: TRAIL }, () => new THREE.Vector4(0, 0, -100, 0))
    const ripples = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0))
    const particleUniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uIntro: { value: reducedMotion ? 1 : 0 },
      uPixels: { value: 800 },
      uIslandSize: { value: 2.6 },
      uBright: { value: 1 },
      uAgitation: { value: 0 },
      uMaxPoint: { value: compact ? 36 : 56 },
      uScale: { value: compact ? 1.3 : 1 },
      uBeacon: { value: beaconWorld },
      uDrop: { value: drop },
      uTrail: { value: trail },
      uRipples: { value: ripples },
      uDeep: { value: new THREE.Color(.09, .22, .52) },
      uCyan: { value: new THREE.Color(.32, .82, 1) },
      uWhite: { value: new THREE.Color(.86, .97, 1) },
    }
    const particles = new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms: particleUniforms,
      vertexShader: particleVertex(TRAIL),
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    particles.frustumCulled = false
    particles.renderOrder = 1
    scene.add(particles)

    const backgroundUniforms = {
      uHorizon: { value: .3 },
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
      uLift: { value: 0 },
      uBright: { value: 1 },
      uIsland: { value: new THREE.Vector2(0, 0) },
    }
    const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: backgroundUniforms,
      vertexShader: BACKGROUND_VERTEX,
      fragmentShader: BACKGROUND_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    }))
    background.frustumCulled = false
    background.renderOrder = -10
    scene.add(background)

    const coastUniforms = { uDraw: { value: 0 }, uOpacity: { value: 0 } }
    const coastMaterial = new THREE.ShaderMaterial({
      uniforms: coastUniforms,
      vertexShader: 'attribute float aProgress; varying float vProgress; void main() { vProgress = aProgress; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uDraw; uniform float uOpacity; varying float vProgress; void main() { gl_FragColor = vec4(0.58, 0.87, 1.0, (1.0 - smoothstep(uDraw - 0.02, uDraw, vProgress)) * uOpacity); }',
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const coastGroup = new THREE.Group()
    for (const loop of coastLoops()) {
      const line = new THREE.BufferGeometry()
      line.setAttribute('position', new THREE.Float32BufferAttribute(loop.positions, 3))
      line.setAttribute('aProgress', new THREE.Float32BufferAttribute(loop.progress, 1))
      const mesh = new THREE.Line(line, coastMaterial)
      mesh.frustumCulled = false
      mesh.renderOrder = 2
      coastGroup.add(mesh)
    }
    scene.add(coastGroup)

    const beaconUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } }
    const beacon = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.ShaderMaterial({
      uniforms: beaconUniforms,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: BEACON_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    beacon.rotation.x = -Math.PI / 2
    beacon.position.copy(beaconWorld)
    beacon.renderOrder = 3
    scene.add(beacon)

    // Quality governor. One-way: if a device cannot hold ~48fps it draws fewer
    // particles at a lower pixel ratio, at most two steps. If a step does not
    // help (a phone capped at 30fps in Low Power Mode), it stops stepping.
    const tiers = [{ share: 1, pixelRatio: Infinity }, { share: .65, pixelRatio: 1.25 }, { share: .42, pixelRatio: 1 }]
    const governor = { tier: 0, frames: [] as number[], settleUntil: performance.now() + 3500, previous: 0, stopped: reducedMotion, last: performance.now() }
    const applyTier = () => {
      geometry.setDrawRange(0, Math.floor(count * tiers[governor.tier].share))
      renderer.domElement.dataset.quality = String(governor.tier)
    }
    // Dev only: ?quality=0|1|2 pins a tier so each one can be checked by eye.
    const pinned = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('quality') ?? NaN) : NaN
    if (pinned >= 0 && pinned < tiers.length) { governor.tier = pinned; governor.stopped = true }
    applyTier()
    const govern = () => {
      const now = performance.now()
      const frame = now - governor.last
      governor.last = now
      // SceneViewport resets the pixel ratio on resize; keep this tier's cap.
      const cap = tiers[governor.tier].pixelRatio
      if (renderer.getPixelRatio() > cap + .001) renderer.setPixelRatio(cap)
      if (governor.stopped || governor.tier === tiers.length - 1 || now < governor.settleUntil || frame > 100) return
      governor.frames.push(frame)
      if (governor.frames.length < 90) return
      const average = governor.frames.reduce((sum, value) => sum + value, 0) / governor.frames.length
      governor.frames.length = 0
      if (average <= 21) {
        if (governor.previous) governor.stopped = true
        return
      }
      if (governor.previous && average > governor.previous * .9) { governor.stopped = true; return }
      governor.previous = average
      governor.tier++
      governor.settleUntil = now + 2000
      applyTier()
    }

    const state = { lift: 0, morph: 0, settle: 0, dim: 0, boost: 0, agitation: 0 }
    let trailIndex = 0
    let rippleIndex = 0
    const lastTrail = new THREE.Vector2(1e3, 1e3)
    let lastTrailTime = -1
    let lastScrollWake = 0
    let lastSwim = 0
    let nextDrop = 3.2
    let introRipple = false
    const aerialPos = new THREE.Vector3()
    const aerialLook = new THREE.Vector3()
    const cameraPos = new THREE.Vector3().copy(heroPos)
    const cameraLook = new THREE.Vector3().copy(heroLook)
    const tempPos = new THREE.Vector3()
    const tempLook = new THREE.Vector3()
    const projected = new THREE.Vector3()
    const size = new THREE.Vector2()
    const parallax = new THREE.Vector2()

    const addTrail = (x: number, z: number, strength: number, time: number) => {
      trail[trailIndex].set(x, z, time, strength)
      trailIndex = (trailIndex + 1) % TRAIL
    }
    const addRipple = (x: number, z: number, strength: number, time: number) => {
      ripples[rippleIndex].set(x, z, time, strength)
      rippleIndex = (rippleIndex + 1) % RIPPLES
    }
    const toWater = (x: number, y: number) => {
      ndc.set(x, y)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(plane, hit) ? hit : null
    }

    const frameAerial = (aspect: number) => {
      const wide = aspect > 1.05
      const pitch = THREE.MathUtils.degToRad(wide ? 57 : 72)
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const tanH = tanV * aspect
      const span = wide ? 11.4 : 10.4
      const fill = wide ? .54 : .94
      const distance = Math.max(span / 2 / (tanH * fill), 7)
      const back = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch))
      const up = new THREE.Vector3(0, Math.cos(pitch), -Math.sin(pitch))
      // Desktop: the island sits right of centre, clear of the copy on the left.
      // Portrait: it sits in the upper half, above the copy.
      const shiftX = wide ? -.34 * distance * tanH : 0
      const shiftY = wide ? .02 * distance * tanV : -.3 * distance * tanV
      aerialLook.set(shiftX, 0, .05).addScaledVector(up, shiftY)
      aerialPos.copy(aerialLook).addScaledVector(back, distance)
      particleUniforms.uIslandSize.value = THREE.MathUtils.clamp(distance * .17, 2.1, 5.2)
    }

    return {
      update(elapsed, delta) {
        govern()
        const time = reducedMotion ? 6 : elapsed
        const step = reducedMotion ? 1 : Math.min(delta, .05)
        const targets = input.targets
        renderer.getDrawingBufferSize(size)
        const aspect = size.x / Math.max(size.y, 1)

        state.lift = damp(state.lift, targets.lift, 3.2, step)
        state.morph = damp(state.morph, targets.morph, 2.6, step)
        state.settle = damp(state.settle, targets.settle, 2.4, step)
        state.dim = damp(state.dim, targets.dim, 3, step)
        state.boost = damp(state.boost, targets.boost, 2.2, step)
        const speed = Math.min(Math.abs(input.velocity.value) / 2600, 1)
        // ScrollTrigger only reports while the page moves, so let it fade out here.
        input.velocity.value *= Math.exp(-step * 4)
        state.agitation = damp(state.agitation, reducedMotion ? 0 : speed, speed > state.agitation ? 6 : 1.6, step)

        frameAerial(aspect)
        const lift = ease(THREE.MathUtils.clamp(state.lift, 0, 1))
        const settle = ease(THREE.MathUtils.clamp(state.settle, 0, 1))
        tempPos.lerpVectors(heroPos, aerialPos, lift).lerp(restPos, settle)
        tempLook.lerpVectors(heroLook, aerialLook, lift).lerp(restLook, settle)
        if (!reducedMotion) {
          parallax.x = damp(parallax.x, input.pointer.x, 2, step)
          parallax.y = damp(parallax.y, input.pointer.y, 2, step)
          tempPos.x += parallax.x * .22 * (1 - lift * .7) + Math.sin(time * .11) * .12
          tempPos.y += parallax.y * .07 + Math.sin(time * .17) * .03
        }
        cameraPos.copy(tempPos)
        cameraLook.copy(tempLook)
        camera.position.copy(cameraPos)
        camera.lookAt(cameraLook)
        camera.zoom = 1
        camera.updateProjectionMatrix()
        camera.updateMatrixWorld()

        if (!reducedMotion) {
          if (!introRipple && time > .25) { introRipple = true; addRipple(drop.x, drop.z, 1.35, time) }
          particleUniforms.uIntro.value = Math.min(1, time / 2.4)

          if (input.pointer.moved) {
            input.pointer.moved = false
            const point = toWater(input.pointer.x, input.pointer.y)
            if (point) {
              const travelled = Math.hypot(point.x - lastTrail.x, point.z - lastTrail.y)
              if (travelled > .07 || time - lastTrailTime > .12) {
                const pace = travelled / Math.max(time - lastTrailTime, .016)
                addTrail(point.x, point.z, THREE.MathUtils.clamp(.3 + pace * .035, .3, .95), time)
                lastTrail.set(point.x, point.z)
                lastTrailTime = time
              }
            }
          }
          for (const splash of input.splashes.splice(0)) {
            const point = toWater(splash.x, splash.y)
            if (!point) continue
            addRipple(point.x, point.z, splash.strength, time)
            addTrail(point.x, point.z, splash.strength, time)
          }
          // Scrolling pushes a wake across the water, which is what makes the
          // bay come alive on phones where there is no hover.
          if (speed > .12 && time - lastScrollWake > .06) {
            lastScrollWake = time
            const point = toWater(Math.random() * 1.8 - .9, -.35 - Math.random() * .55)
            if (point) addTrail(point.x, point.z, .35 + speed * .8, time)
          }
          // Two unseen swimmers keep the water moving when nobody is touching it.
          // Their paths are defined on screen, so they stay in view on a narrow
          // phone as well as a wide desktop, then projected onto the water.
          const idle = performance.now() - input.pointer.lastMove > 2500
          const waterTop = Math.min(backgroundUniforms.uHorizon.value - .12, .55)
          if (time - lastSwim > .075) {
            lastSwim = time
            const strength = (idle ? (compact ? .62 : .42) : .2) * (1 - state.dim * .5)
            const a = toWater(Math.sin(time * .31) * .78, THREE.MathUtils.lerp(-.9, waterTop, .45 + Math.sin(time * .47 + 1.3) * .35))
            if (a) addTrail(a.x, a.z, strength, time)
            const b = toWater(Math.cos(time * .23 + 2.1) * .7, THREE.MathUtils.lerp(-.9, waterTop, .3 + Math.sin(time * .19) * .25))
            if (b) addTrail(b.x, b.z, strength * .8, time)
          }
          // Now and then a drop lands somewhere in view and rings out.
          if (idle && time > nextDrop) {
            nextDrop = time + 2.4 + Math.random() * 2.2
            const point = toWater(Math.random() * 1.5 - .75, THREE.MathUtils.lerp(-.85, waterTop, Math.random()))
            if (point) addRipple(point.x, point.z, (compact ? .85 : .65) * (1 - state.dim * .6), time)
          }
        }

        const bright = (1 - state.dim * .5) * (1 + state.boost * .75)
        particleUniforms.uTime.value = time
        particleUniforms.uMorph.value = state.morph
        particleUniforms.uBright.value = bright
        particleUniforms.uAgitation.value = state.agitation
        particleUniforms.uPixels.value = size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))

        const flatForward = tempLook.clone().sub(tempPos).setY(0)
        if (flatForward.lengthSq() > 1e-6) {
          projected.copy(flatForward.normalize().multiplyScalar(1e4)).add(camera.position).setY(0).project(camera)
          backgroundUniforms.uHorizon.value = projected.z < 1 ? THREE.MathUtils.clamp(projected.y, -1, 3) : 3
        } else backgroundUniforms.uHorizon.value = 3
        backgroundUniforms.uTime.value = time
        backgroundUniforms.uAspect.value = aspect
        backgroundUniforms.uLift.value = lift * (1 - settle)
        backgroundUniforms.uBright.value = Math.min(bright, 1)
        projected.set(0, 0, .05).project(camera)
        backgroundUniforms.uIsland.value.set(projected.x, projected.y)

        const landed = THREE.MathUtils.smoothstep(state.morph, .35, .97)
        coastUniforms.uDraw.value = landed * 1.03
        coastUniforms.uOpacity.value = landed * .55 * bright
        beaconUniforms.uTime.value = time
        const beaconOpacity = THREE.MathUtils.smoothstep(state.morph, .72, .98)
        beaconUniforms.uOpacity.value = beaconOpacity
        beacon.visible = beaconOpacity > .001
        coastGroup.visible = landed > .001

        if (input.onBeacon) {
          projected.copy(beaconWorld).project(camera)
          const width = renderer.domElement.clientWidth
          const height = renderer.domElement.clientHeight
          input.onBeacon((projected.x * .5 + .5) * width, (-projected.y * .5 + .5) * height, beaconOpacity)
        }
      },
      dispose() {
        geometry.dispose()
        particles.material.dispose()
        background.geometry.dispose()
        background.material.dispose()
        coastMaterial.dispose()
        coastGroup.children.forEach(child => (child as THREE.Line).geometry.dispose())
        beacon.geometry.dispose()
        beacon.material.dispose()
      },
    }
  }
}
