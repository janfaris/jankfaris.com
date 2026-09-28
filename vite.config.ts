import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { posts } from './src/posts'
import { postsEs } from './src/posts.es'

const SITE = 'https://www.janfaris.com'

type RouteMeta = { path: string; title?: string; description?: string; pair?: [string, string] }

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function routes(): RouteMeta[] {
  const spanish = new Set(postsEs.map(post => post.slug))
  const pair = (en: string): [string, string] => [en, en === '/' ? '/es' : `/es${en}`]
  return [
    { path: '/', pair: pair('/') },
    { path: '/es', title: 'Jan Faris | Ingeniero de IA en Puerto Rico', description: 'Lead AI Engineer en Cencora, antes en Microsoft. Construyendo productos de IA desde San Juan, Puerto Rico.', pair: pair('/') },
    { path: '/writing', title: 'Ship Notes — Jan Faris', description: 'Numbered field notes on AI products, developer tools, and Spanish-first software from production.', pair: pair('/writing') },
    { path: '/es/writing', title: 'Ship Notes — Jan Faris', description: 'Notas numeradas sobre productos de IA, herramientas para developers y software en español.', pair: pair('/writing') },
    ...posts.map(post => ({ path: `/writing/${post.slug}`, title: `${post.title} — Jan Faris`, description: post.description, pair: spanish.has(post.slug) ? pair(`/writing/${post.slug}`) : undefined })),
    ...postsEs.map(post => ({ path: `/es/writing/${post.slug}`, title: `${post.title} — Jan Faris`, description: post.description, pair: pair(`/writing/${post.slug}`) })),
    { path: '/resume', title: 'Jan Faris — Résumé', pair: pair('/resume') },
    { path: '/es/resume', title: 'Jan Faris — Résumé', pair: pair('/resume') },
    { path: '/ai-readiness', title: 'Should This Be AI? — Jan Faris', description: 'Answer ten production questions and get a clear recommendation: validate, prototype, pilot, or plan production.', pair: pair('/ai-readiness') },
    { path: '/es/ai-readiness', title: '¿Esto debería usar IA? — Jan Faris', description: 'Contesta diez preguntas de producción y recibe una recomendación clara: valida, prototipa, haz un piloto o planifica producción.', pair: pair('/ai-readiness') },
    { path: '/lab/island' },
    { path: '/lab/three' },
  ]
}

/**
 * Writes a copy of index.html for every known route with its own canonical,
 * og:url, hreflang pair, title, and description, so crawlers that do not run
 * JavaScript see the right tags. Vercel serves these files before the SPA
 * fallback rewrite; CanonicalSync keeps the tags right during client navigation.
 */
function routeMeta(): Plugin {
  let outDir = 'dist'
  return {
    name: 'route-meta',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() {
      const shell = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const route of routes()) {
        const url = SITE + route.path
        let html = shell
          .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
          .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
          .replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>/g, '')
        if (route.pair) {
          const [en, es] = route.pair
          const alternates = [['en', en], ['es', es], ['x-default', en]].map(([lang, path]) => `\n    <link rel="alternate" hreflang="${lang}" href="${SITE}${path}" />`).join('')
          html = html.replace(/(<link rel="canonical" href="[^"]*" \/>)/, `$1${alternates}`)
        }
        if (route.title) {
          const title = escape(route.title)
          html = html
            .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
            .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
            .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`)
        }
        if (route.description) {
          const description = escape(route.description)
          html = html
            .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
            .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`)
            .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`)
        }
        if (route.path.startsWith('/es')) html = html.replace('<html lang="en">', '<html lang="es">')
        const file = route.path === '/' ? resolve(outDir, 'index.html') : resolve(outDir, `.${route.path}/index.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), routeMeta()],
})
