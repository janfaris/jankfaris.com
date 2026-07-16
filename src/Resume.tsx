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
  details?: string[]
  current?: boolean
}

const copy = {
  en: {
    title: 'Résumé',
    status: 'Open to remote roles · San Juan, PR',
    download: 'Download PDF',
    email: 'Email me',
    back: '← jankfaris.com',
    eyebrow: 'AI Engineer / Software Engineer',
    summary: 'Full-stack AI engineer operating across the entire product lifecycle — design, build, deploy, and operate. Ex-Microsoft, with 8 AI products shipped in 18 months as a solo engineer.',
    experience: 'Professional experience',
    managers: 'What managers say',
    education: 'Education & certification',
    numbers: 'The numbers',
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
    eyebrow: 'Ingeniero de IA / Ingeniero de Software',
    summary: 'Ingeniero full-stack de IA trabajando en todo el ciclo del producto — diseñar, construir, desplegar y operar. Ex-Microsoft, con 8 productos de IA lanzados en 18 meses como ingeniero independiente.',
    experience: 'Experiencia profesional',
    managers: 'Lo que dicen mis managers',
    education: 'Educación y certificación',
    numbers: 'Los números',
    current: {
      period: '2026 - Hoy',
      org: 'Independiente',
      role: 'Productos de IA, de punta a punta',
      note: 'Construyendo Lupa (adquisición de clientes con IA), demotape (npm, CLI de videos demo), spanish-tone-spec (npm, control de tono en español para LLMs) y usableai (digest de IA en español automatizado). Buscando mi próximo rol full-time.',
    },
  },
}

const resumeExperience: Record<Lang, Stop[]> = {
  en: [
    {
      period: 'Jul 2025 - Jul 2026',
      org: 'Microsoft',
      role: 'Software Engineer II · Trust Platform',
      note: 'Fraud and abuse prevention systems for Microsoft’s commerce ecosystem.',
      details: [
        'Built PRPilot, an autonomous AI PR-review agent using Copilot CLI, Microsoft Scout, custom skills, and MCP servers; monitored 7+ repositories and graded roughly 5 PRs daily.',
        'Maintained compliance-critical transaction-risk APIs across multiple Microsoft products and countries.',
        'Shipped TypeScript, React, Python, and Azure Kubernetes Service features from prototype through production.',
        'Co-designed and delivered a 21-session, org-wide AI learning program and onboarded roughly 15 PMs to agentic tooling.',
        'Led security, compliance, accessibility, and production observability work with OpenTelemetry and Geneva.',
      ],
    },
    {
      period: 'Jan 2024 - Jul 2025',
      org: 'Xtillion',
      role: 'Associate Engineer',
      note: 'End-to-end enterprise delivery across healthcare reporting, analytics, and data platforms.',
      details: [
        'Led a 12-month migration from SQL Server and SSRS to Retool, Snowflake, dbt, and GitHub Actions, generating 5,000+ reports per day.',
        'Solo-built HIPAA-compliant delivery over encrypted AWS SES email and OpenText Fax API.',
        'Built conversational analytics with Databricks Genie and cut cloud costs by eliminating a SQL Server instance.',
      ],
    },
    {
      period: 'Aug 2021 - Aug 2023',
      org: 'Pratt & Whitney',
      role: 'Software Engineer',
      note: 'Production software and DevSecOps work in the F-135 aerospace propulsion stack.',
      details: [
        'Cut build time 90% by automating and securing CI/CD for the F-135 military DevSecOps transformation.',
        'Modernized a legacy database with Perl, Python, and SQL, then built C code-generation and blade-assembly validation tooling.',
      ],
    },
    {
      period: 'Earlier',
      org: 'BrainHi · UPRConnect',
      role: 'Support Engineer · Founder',
      note: 'Supported a SaaS product at BrainHi and founded an AI-powered student platform at UPRM, leading engineers and designers.',
    },
  ],
  es: [
    {
      period: 'Jul 2025 - Jul 2026',
      org: 'Microsoft',
      role: 'Software Engineer II · Trust Platform',
      note: 'Sistemas de prevención de fraude y abuso para el ecosistema de comercio de Microsoft.',
      details: [
        'Construí PRPilot, un agente autónomo para revisar PRs con Copilot CLI, Microsoft Scout, skills y servidores MCP; monitoreó 7+ repositorios.',
        'Mantuve APIs críticas de riesgo transaccional para múltiples productos y países.',
        'Llevé features en TypeScript, React, Python y Azure Kubernetes Service de prototipo a producción.',
        'Co-diseñé un programa de IA de 21 sesiones para toda la organización y capacité a unos 15 PMs.',
      ],
    },
    {
      period: 'Ene 2024 - Jul 2025',
      org: 'Xtillion',
      role: 'Associate Engineer',
      note: 'Entrega empresarial end-to-end en reportes de salud, analytics y plataformas de datos.',
      details: [
        'Lideré una migración de 12 meses de SQL Server y SSRS a Retool, Snowflake, dbt y GitHub Actions, generando 5,000+ reportes diarios.',
        'Construí solo la entrega HIPAA-compliant por AWS SES y OpenText Fax API.',
        'Desarrollé analytics conversacional con Databricks Genie y reduje costos cloud eliminando una instancia de SQL Server.',
      ],
    },
    {
      period: 'Ago 2021 - Ago 2023',
      org: 'Pratt & Whitney',
      role: 'Software Engineer',
      note: 'Software de producción y DevSecOps para la plataforma de propulsión aeroespacial F-135.',
      details: [
        'Reduje el build time 90% automatizando y asegurando CI/CD para la transformación DevSecOps del F-135.',
        'Modernicé una base de datos legacy con Perl, Python y SQL, y construí tooling de generación en C y validación de ensamblaje.',
      ],
    },
    {
      period: 'Antes',
      org: 'BrainHi · UPRConnect',
      role: 'Support Engineer · Fundador',
      note: 'Apoyé un producto SaaS en BrainHi y fundé una plataforma estudiantil con IA en UPRM, liderando ingenieros y diseñadores.',
    },
  ],
}

const managerQuotes = [
  {
    quote: 'I’ve made a lot of hiring decisions over my career, and bringing Jan onto my team was one of the best… a true force multiplier. I’d hire Jan again tomorrow.',
    author: 'Ryan McDonald',
    role: 'Principal, Microsoft · direct manager',
  },
  {
    quote: 'A true 10x engineer… the type of person you can trust with ambiguous, high-impact problems and know he’ll deliver a solution that exceeds expectations.',
    author: 'Javier Román',
    role: 'Data & AI Leader · direct manager, Xtillion',
  },
]

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
        {stop.details && (
          <ul className="tl-details">
            {stop.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        )}
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
    ...resumeExperience[lang],
  ]

  return (
    <div className="app resume-page">
      <div className="topbar">
        <nav className="lang-switch">
          <Link to={lang === 'es' ? '/resume' : '/es/resume'}>
            {lang === 'es' ? 'EN' : 'ES'}
          </Link>
        </nav>
      </div>

      <div className="container resume-container">
        <header className="resume-head">
          <HeroField />
          <Link to={lang === 'es' ? '/es' : '/'} className="resume-back">{t.back}</Link>
          <span className="resume-eyebrow">{t.eyebrow}</span>
          <h1 className="resume-name">Jan Faris</h1>
          <p className="resume-summary">{t.summary}</p>
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
        <section className="resume-block resume-experience">
          <h2 className="section-title">{t.experience}</h2>
          <ol className="timeline">
            {stops.map((s, i) => (
              <TimelineStop key={s.org} stop={s} index={i} />
            ))}
          </ol>
        </section>

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
          <h2 className="section-title">{t.managers}</h2>
          <div className="resume-quotes">
            {managerQuotes.map((item) => (
              <blockquote className="resume-quote" key={item.author}>
                <p>“{item.quote}”</p>
                <footer>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <h2 className="section-title">{t.education}</h2>
          <div className="resume-education">
            <div>
              <strong>University of Puerto Rico, Mayagüez</strong>
              <span>B.S. Software Engineering · Dec 2023</span>
            </div>
            <div>
              <strong>GitHub Copilot Certified (GH-300)</strong>
              <span>Microsoft · Jun 2026</span>
            </div>
          </div>
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
