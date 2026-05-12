import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { posts } from './posts'
import { content as siteContent, type Lang } from './content'

interface Props { lang?: Lang }

function Eyebrow({ index, label }: { index: string; label: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.6, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`eyebrow ${visible ? 'is-visible' : ''}`}>
      <span className="eyebrow-num">{index}</span>
      <span className="eyebrow-rule" />
      <span className="eyebrow-label">{label}</span>
    </div>
  )
}

/** Split a string into individual words wrapped in .reveal-word spans for staggered animation. */
function splitWords(text: string): React.ReactNode[] {
  return text.split(/(\s+)/).map((tok, i) => {
    if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>
    return (
      <span key={i} className="reveal-word">
        {tok}
      </span>
    )
  })
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}

function TopBar({ lang }: { lang: Lang }) {
  const { theme, toggle } = useTheme()
  return (
    <div className="topbar">
      <button onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
        {theme === 'dark' ? (
          // sun
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          // moon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <nav className="lang-switch">
        <Link to="/" className={lang === 'en' ? 'lang-active' : ''} aria-label="English">EN</Link>
        <span className="lang-divider">·</span>
        <Link to="/es" className={lang === 'es' ? 'lang-active' : ''} aria-label="Español">ES</Link>
      </nav>
    </div>
  )
}

export default function App({ lang = 'en' }: Props) {
  const c = siteContent[lang]

  useEffect(() => {
    document.title = c.meta.title
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', c.meta.description)
    document.documentElement.lang = lang
  }, [c.meta.title, c.meta.description, lang])

  const writingHref = '/writing'

  return (
    <div className="app">
      <TopBar lang={lang} />

      {/* HERO */}
      <header className="hero container">
        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="display">
              {splitWords(c.hero.display.lead)}
              <em>{splitWords(c.hero.display.em)}</em>
              {splitWords(c.hero.display.tail)}
            </h1>
            <p className="lede">{c.hero.lede as string}</p>
          </div>

          <figure className="portrait">
            <div className="portrait-frame">
              <img src="/jan-profile.jpg" alt="Jan Faris" />
            </div>
            <figcaption className="portrait-caption">
              <span className="portrait-mark"><JFMark size={26} /></span>
              <span className="portrait-loc">San Juan · PR</span>
            </figcaption>
          </figure>
        </div>

        <div className="hero-meta">
          {c.hero.metaItems.map((m) => (
            <div key={m.key} className="meta-item">
              <span className="meta-key">{m.key}</span>
              <span className="meta-val">{m.val}</span>
            </div>
          ))}
        </div>
      </header>

      <hr className="rule container-rule" />

      {/* NOW */}
      <section className="section container now-section">
        <Eyebrow index="01" label={c.sections.now} />
        <div className="now-card">
          <div className="now-pulse"><span /></div>
          <div className="now-body">
            <h2 className="now-headline">{c.now.headline}</h2>
            <ul className="now-lines">
              {c.now.lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <span className="now-updated">{c.now.updated}</span>
          </div>
        </div>
      </section>

      <hr className="rule container-rule" />

      {/* WORK */}
      <section className="section container">
        <Eyebrow index="02" label={c.sections.work} />
        <div className="bento">
          {c.projects.map((p) => (
            <a
              key={p.name}
              href={p.link}
              target="_blank"
              rel="noreferrer"
              className={`card ${p.featured ? 'card-featured' : ''} ${p.span === 'wide' ? 'card-wide' : ''} ${p.media ? 'card-with-media' : ''}`}
            >
              {p.media && (
                <div className="card-media">
                  <video
                    className="card-media-video"
                    src={`/demos/${p.media}.mp4`}
                    poster={`/demos/${p.media}.jpg`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      // If video fails, fall back to poster image via parent class
                      const v = e.currentTarget
                      v.style.display = 'none'
                    }}
                  />
                  {/* Static poster fallback for projects without video (Janga, usableai) */}
                  <img className="card-media-poster" src={`/demos/${p.media}.jpg`} alt="" loading="lazy" />
                </div>
              )}
              <div className="card-body">
                <div className="card-top">
                  <span className="card-tag">{p.tag}</span>
                  <span className="card-year">{p.year}</span>
                </div>
                <h3 className="card-title">{p.name}</h3>
                <p className="card-desc">{p.description}</p>

                {p.metrics && (
                  <div className="card-metrics">
                    {p.metrics.map((m) => (
                      <div key={m.label} className="metric">
                        <span className="metric-val">{m.value}</span>
                        <span className="metric-label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="card-bottom">
                  <div className="card-tech">
                    {p.tech.map((t) => <span key={t} className="tech">{t}</span>)}
                  </div>
                  <span className="card-arrow" aria-hidden>↗</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <hr className="rule container-rule" />

      {/* WRITING */}
      <section className="section container">
        <Eyebrow index="03" label={c.sections.writing} />
        <div className="list">
          {posts.map((post) => (
            <Link key={post.slug} to={`${writingHref}/${post.slug}`} className="list-row">
              <span className="row-date">{post.date}</span>
              <div className="row-body">
                <h4 className="row-title">{post.title}</h4>
                <p className="row-desc">{post.description}</p>
                <span className="row-readtime">{post.readTime} read</span>
              </div>
              <span className="row-arrow">→</span>
            </Link>
          ))}
        </div>
        <div className="section-cta">
          <Link to="/writing" className="cta-link">{c.writingCta}</Link>
        </div>
      </section>

      <hr className="rule container-rule" />

      {/* PRESS & SPEAKING */}
      <section className="section container">
        <Eyebrow index="04" label={c.sections.press} />
        {c.press.length === 0 ? (
          <div className="press-empty">
            <p>{c.pressEmptyHint}</p>
          </div>
        ) : (
          <div className="list">
            {c.press.map((p) => (
              <a key={p.title} href={p.link || '#'} target="_blank" rel="noreferrer" className="list-row">
                <span className="row-date">{p.date}</span>
                <div className="row-body">
                  <h4 className="row-title">{p.title}</h4>
                  <p className="row-desc">{p.outlet}</p>
                </div>
                <span className="row-arrow">→</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <hr className="rule container-rule" />

      {/* EXPERIENCE */}
      <section className="section container">
        <Eyebrow index="05" label={c.sections.experience} />
        <div className="list">
          {c.experience.map((e) => (
            <div key={e.company} className="list-row exp-row">
              <span className="row-date">{e.period}</span>
              <div className="row-body">
                <h4 className="row-title">
                  {e.role} <span className="exp-co">· {e.company}</span>
                </h4>
                <p className="row-desc">{e.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="rule container-rule" />

      {/* WORK WITH ME — hidden for now
      <section className="section container available-section">
        <Eyebrow index="06" label={c.sections.available} />
        <div className="available-grid">
          <div className="available-text">
            <h2 className="available-headline">
              {c.available.headline.lead}
              <em>{c.available.headline.em}</em>
              {c.available.headline.tail}
            </h2>
            <p className="available-body">{c.available.body}</p>

            <div className="channels">
              {c.available.channels.map((ch) => (
                <a key={ch.key} href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="channel">
                  <div className="channel-head">
                    <span className="channel-title">{ch.title}</span>
                    <span className="channel-arrow">↗</span>
                  </div>
                  <p className="channel-desc">{ch.desc}</p>
                  <span className="channel-cta">{ch.cta}</span>
                </a>
              ))}
            </div>
          </div>

          <aside className="available-aside">
            {c.available.aside.map((row) => (
              <div key={row.key} className="aside-row">
                <span className="aside-key">{row.key}</span>
                <span className="aside-val">{row.val}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <hr className="rule container-rule" />
      */}

      {/* CONNECT */}
      <section className="section container connect">
        <Eyebrow index="06" label={c.sections.connect} />
        <div className="connect-grid">
          {[
            { label: 'LinkedIn', url: 'https://linkedin.com/in/jan-faris-garcia' },
            { label: 'GitHub', url: 'https://github.com/janfaris' },
            { label: 'X / Twitter', url: 'https://twitter.com/jankfaris' },
            { label: 'Email', url: 'mailto:jankfaris@gmail.com' },
          ].map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="connect-link">
              <span>{l.label}</span>
              <span className="connect-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="footer container">
        <span className="foot-mark"><JFMark size={22} /></span>
        <span className="foot-text">{c.footer}</span>
      </footer>
    </div>
  )
}
