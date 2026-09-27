import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

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
