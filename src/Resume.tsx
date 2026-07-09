import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'
import { HeroField } from './HeroField.tsx'
import { content as siteContent, type Lang } from './content'

interface Props { lang?: Lang }

interface Stop {
  period: string
  org: string
  role: string
  note: string
  current?: boolean
}

const copy = {
  en: {
    title: 'Résumé',
    status: 'Open to remote roles · San Juan, PR',
    download: 'Download PDF',
    email: 'Email me',
    back: '← jankfaris.com',
    numbers: 'The numbers',
    stack: 'Stack',
    current: {
      period: '2026 - Now',
      org: 'Independent',
      role: 'AI products, end to end',
      note: 'Building Lupa (AI client acquisition), demotape (npm, demo-video CLI), spanish-tone-spec (npm, Spanish tone control for LLMs), and usableai (automated Spanish AI digest). Looking for the next full-time role.',
    },
  },
  es: {
    title: 'Résumé',
    status: 'Disponible para roles remotos · San Juan, PR',
    download: 'Descargar PDF',
    email: 'Escríbeme',
    back: '← jankfaris.com',
    numbers: 'Los números',
    stack: 'Stack',
    current: {
      period: '2026 - Hoy',
      org: 'Independiente',
      role: 'Productos de IA, de punta a punta',
      note: 'Construyendo Lupa (adquisición de clientes con IA), demotape (npm, CLI de videos demo), spanish-tone-spec (npm, control de tono en español para LLMs) y usableai (digest de IA en español automatizado). Buscando mi próximo rol full-time.',
    },
  },
}

function TimelineStop({ stop, index }: { stop: Stop; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <li
      ref={ref}
      className={`tl-stop ${visible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className={`tl-dot ${stop.current ? 'tl-dot-current' : ''}`} aria-hidden="true">
        {stop.current && <span className="pulse" />}
      </span>
      <div className="tl-body">
        <span className="tl-period">{stop.period}</span>
        <h3 className="tl-org">
          {stop.org}
          <span className="tl-role"> · {stop.role}</span>
        </h3>
        <p className="tl-note">{stop.note}</p>
      </div>
    </li>
  )
}

export default function Resume({ lang = 'en' }: Props) {
  const c = siteContent[lang]
  const t = copy[lang]

  useEffect(() => {
    document.title = `Jan Faris — ${t.title}`
    document.documentElement.lang = lang === 'es' ? 'es' : 'en'
  }, [lang, t.title])

  const stops: Stop[] = [
    { ...t.current, current: true },
    ...c.experience.map((e) => ({
      period: e.period,
      org: e.company,
      role: e.role,
      note: e.note,
    })),
  ]

  return (
    <div className="app resume-page">
      {/* the signature wave, fixed behind the whole page; scrolling feeds it energy */}
      <div className="resume-wave" aria-hidden="true">
        <HeroField />
      </div>

      <div className="topbar">
        <nav className="lang-switch">
          <Link to={lang === 'es' ? '/resume' : '/es/resume'}>
            {lang === 'es' ? 'EN' : 'ES'}
          </Link>
        </nav>
      </div>

      <div className="container resume-container">
        <header className="resume-head">
          <Link to={lang === 'es' ? '/es' : '/'} className="resume-back">{t.back}</Link>
          <h1 className="resume-name">Jan Faris</h1>
          <p className="resume-status">
            <span className="pulse" /> {t.status}
          </p>
          <div className="hero-cta resume-actions">
            <a className="btn-primary" href="/resume.pdf" target="_blank" rel="noopener">
              {t.download}
            </a>
            <a className="btn-secondary" href="mailto:jankfaris@gmail.com?subject=Full-time%20role">
              {t.email}
            </a>
          </div>
        </header>

        {/* career as a dot-and-line timeline, newest first */}
        <ol className="timeline">
          {stops.map((s, i) => (
            <TimelineStop key={s.org} stop={s} index={i} />
          ))}
        </ol>

        <section className="resume-block">
          <h2 className="section-title">{t.numbers}</h2>
          <div className="proofbar resume-proofbar">
            {c.proofBar.map((item) => (
              <div key={item.label} className="proofbar-item">
                <span className="proofbar-value">{item.value}</span>
                <span className="proofbar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <h2 className="section-title">{t.stack}</h2>
          <dl className="stack-proof">
            {c.stackProof.map((row) => (
              <div key={row.claim} className="stack-row">
                <dt className="stack-claim">{row.claim}</dt>
                <dd className="stack-evidence">{row.evidence}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="footer">
          <span className="foot-mark">
            <JFMark size={20} />
            <span>· 2026</span>
          </span>
          <span className="foot-text">
            <span>San Juan, PR</span>
            <a href="mailto:jankfaris@gmail.com">jankfaris@gmail.com</a>
            <a href="https://github.com/janfaris" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer">LinkedIn</a>
          </span>
        </footer>
      </div>
    </div>
  )
}
