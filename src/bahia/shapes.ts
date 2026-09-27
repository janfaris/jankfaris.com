import { CULEBRA_COASTLINE, PUERTO_RICO_COASTLINE, VIEQUES_COASTLINE, type CoastCoordinate } from '../three-lab/island-shape'

/**
 * Geographic helpers for the bay scene. World space: x runs east, z runs
 * south, y is up. One world unit is 20 km, so the main island plus Vieques
 * spans roughly 10.5 units and the composition stays true to the real map.
 */
const KM_PER_UNIT = 20
const KM_PER_DEG_LAT = 110.6
const CENTER = { lon: -66.23, lat: 18.22 }
const KM_PER_DEG_LON = 111.32 * Math.cos(CENTER.lat * Math.PI / 180)

export const SAN_JUAN: CoastCoordinate = [-66.1057, 18.4655]

export function toWorld([lon, lat]: CoastCoordinate): [number, number] {
  return [
    (lon - CENTER.lon) * KM_PER_DEG_LON / KM_PER_UNIT,
    -(lat - CENTER.lat) * KM_PER_DEG_LAT / KM_PER_UNIT,
  ]
}

type Polygon = [number, number][]

// Main island, Vieques (home of Mosquito Bay), and Culebra. Mona sits far to
// the west and would land under the copy column, so the swarm leaves it out.
export const ISLANDS: Polygon[] = [PUERTO_RICO_COASTLINE, VIEQUES_COASTLINE, CULEBRA_COASTLINE].map(coast => coast.map(toWorld))

function area(polygon: Polygon) {
  let sum = 0
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) sum += (polygon[j][0] + polygon[i][0]) * (polygon[j][1] - polygon[i][1])
  return Math.abs(sum / 2)
}

function inside(x: number, z: number, polygon: Polygon) {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i]
    const [xj, zj] = polygon[j]
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) hit = !hit
  }
  return hit
}

function edgeDistance(x: number, z: number, polygon: Polygon) {
  let best = Infinity
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, az] = polygon[j]
    const [bx, bz] = polygon[i]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t))
  }
  return best
}

/** Seeded PRNG so the island looks identical on every visit. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Stylized relief, not elevation data: a Cordillera Central ridge through the
 * west and centre, and a softer rise in the north-east for the Luquillo range.
 */
function relief(x: number, z: number) {
  const ridge = Math.exp(-((z - 0.05 - x * 0.03) ** 2) / 0.35) * Math.exp(-((x + 1.2) ** 2) / 14)
  const luquillo = Math.exp(-((x - 2.9) ** 2 + (z + 0.45) ** 2) / 0.45)
  return ridge * 0.26 + luquillo * 0.16
}

export type IslandPoint = { x: number; y: number; z: number; edge: number }

/**
 * Fills the three coastlines with points. A share of them sit exactly on the
 * coast so the outline reads crisply once the swarm settles.
 */
export function sampleIsland(count: number, random: () => number): IslandPoint[] {
  const areas = ISLANDS.map(area)
  const perimeter = ISLANDS.map(polygon => polygon.reduce((sum, point, i) => {
    const next = polygon[(i + 1) % polygon.length]
    return sum + Math.hypot(next[0] - point[0], next[1] - point[1])
  }, 0))
  const totalArea = areas.reduce((a, b) => a + b, 0)
  const totalPerimeter = perimeter.reduce((a, b) => a + b, 0)
  const coastCount = Math.round(count * .16)
  const fillCount = count - coastCount
  const points: IslandPoint[] = []

  ISLANDS.forEach((polygon, index) => {
    const xs = polygon.map(p => p[0])
    const zs = polygon.map(p => p[1])
    const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
    const target = index === ISLANDS.length - 1 ? fillCount - points.length : Math.round(fillCount * areas[index] / totalArea)
    let placed = 0
    let guard = 0
    while (placed < target && guard < target * 60) {
      guard++
      const x = minX + random() * (maxX - minX)
      const z = minZ + random() * (maxZ - minZ)
      if (!inside(x, z, polygon)) continue
      const edge = Math.exp(-edgeDistance(x, z, polygon) / .09)
      points.push({ x, y: relief(x, z) + random() * .035, z, edge })
      placed++
    }
  })

  ISLANDS.forEach((polygon, index) => {
    const target = index === ISLANDS.length - 1 ? coastCount - (points.length - fillCount) : Math.round(coastCount * perimeter[index] / totalPerimeter)
    for (let n = 0; n < target; n++) {
      let distance = random() * perimeter[index]
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i]
        const b = polygon[(i + 1) % polygon.length]
        const length = Math.hypot(b[0] - a[0], b[1] - a[1])
        if (distance <= length) {
          const t = distance / length
          const jitter = (random() - .5) * .025
          points.push({ x: a[0] + (b[0] - a[0]) * t + jitter, y: .01, z: a[1] + (b[1] - a[1]) * t + jitter, edge: 1 })
          break
        }
        distance -= length
      }
    }
  })
  return points
}

/** Normalised position of each vertex along its coastline, for draw-on lines. */
export function coastLoops() {
  return ISLANDS.map(polygon => {
    let travelled = 0
    const lengths = polygon.map((point, i) => {
      const next = polygon[(i + 1) % polygon.length]
      return Math.hypot(next[0] - point[0], next[1] - point[1])
    })
    const total = lengths.reduce((a, b) => a + b, 0)
    const positions: number[] = []
    const progress: number[] = []
    for (let i = 0; i <= polygon.length; i++) {
      const [x, z] = polygon[i % polygon.length]
      positions.push(x, .02, z)
      progress.push(travelled / total)
      travelled += lengths[i % polygon.length] ?? 0
    }
    return { positions, progress }
  })
}

/** SVG path data for the static map fallback (reduced motion or no WebGL). */
export function coastPaths(width: number, height: number, padding = 0.04) {
  const all = ISLANDS.flat()
  const xs = all.map(p => p[0])
  const zs = all.map(p => p[1])
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  const scale = Math.min(width * (1 - padding * 2) / (maxX - minX), height * (1 - padding * 2) / (maxZ - minZ))
  const offsetX = (width - (maxX - minX) * scale) / 2
  const offsetY = (height - (maxZ - minZ) * scale) / 2
  const map = ([x, z]: [number, number]) => [offsetX + (x - minX) * scale, offsetY + (z - minZ) * scale] as const
  const paths = ISLANDS.map(polygon => polygon.map((point, i) => {
    const [px, py] = map(point)
    return `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`
  }).join(' ') + 'Z')
  const [sjx, sjy] = map(toWorld(SAN_JUAN))
  return { paths, sanJuan: { x: sjx, y: sjy } }
}
