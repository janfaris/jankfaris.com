import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { postsEs } from './posts.es'

const withoutLanguage = (pathname: string) => pathname.replace(/^\/es(?=\/|$)/, '') || '/'

export function ScrollToTop() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  useEffect(() => {
    const from = previous.current
    previous.current = pathname
    // The homepage switches EN/ES in place, keeping the reader's position.
    if (from !== pathname && withoutLanguage(from) === '/' && withoutLanguage(pathname) === '/') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

export function RouteMeta({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [description, title])

  return children
}

const SITE = 'https://www.janfaris.com'
// Routes that exist in both languages (Ship Notes only where a translation exists).
const BILINGUAL = new Set(['/', '/writing', '/resume', '/ai-readiness', ...postsEs.map(post => `/writing/${post.slug}`)])

function setLink(selector: string, attributes: Record<string, string>) {
  let link = document.head.querySelector<HTMLLinkElement>(selector)
  if (!link) {
    link = document.createElement('link')
    document.head.appendChild(link)
  }
  for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value)
}

/**
 * The HTML shell ships the homepage's canonical; this keeps canonical, og:url,
 * and hreflang pointing at the page actually being viewed.
 */
export function CanonicalSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
    const url = SITE + path
    setLink('link[rel="canonical"]', { rel: 'canonical', href: url })
    document.head.querySelector('meta[property="og:url"]')?.setAttribute('content', url)
    const english = withoutLanguage(path)
    const alternates = document.head.querySelectorAll('link[rel="alternate"][hreflang]')
    if (!BILINGUAL.has(english)) {
      alternates.forEach(link => link.remove())
      return
    }
    const spanish = english === '/' ? '/es' : `/es${english}`
    setLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: SITE + english })
    setLink('link[rel="alternate"][hreflang="es"]', { rel: 'alternate', hreflang: 'es', href: SITE + spanish })
    setLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: SITE + english })
  }, [pathname])

  return null
}
