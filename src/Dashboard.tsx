import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, AtSign, BookOpen, BriefcaseBusiness, CircleHelp, Clock3, Code2, FileText, FolderOpen, Laptop, Mail, Menu, Moon, Radio, Search, Sparkles, Sun, X } from 'lucide-react'
import { JFMark } from './JFMark'
import { DashboardGuide } from './DashboardGuide'
import { content, type Lang, type Project } from './content'
import { posts } from './posts'
import { postsEs } from './posts.es'
import './Dashboard.css'
import './DashboardIsland.css'

const IslandExperience = lazy(() => import('./three-lab/IslandExperience'))

const PHOTO_PROJECTS = [
  { name: 'Wandr', image: '/demos/wandr.jpg', link: 'https://wandrtravelai.com', detail: 'AI travel planning', detailEs: 'Viajes con IA' },
  { name: 'Janga', image: '/demos/janga.jpg', link: 'https://apps.apple.com/us/app/janga/id6744530407', detail: 'On the App Store', detailEs: 'En el App Store' },
  { name: 'demotape', image: '/demos/demotape.jpg', link: 'https://github.com/janfaris/demotape', detail: 'A recorded demo', detailEs: 'Una demo grabada' },
]

const words = {
  en: { home: 'Home', work: 'Work', writing: 'Ship Notes', resume: 'Résumé', about: 'About me', greeting: "Hey! I’m", bio: 'An AI engineer based in San Juan, building useful products from idea to production.', facts: 'A few things about me', factList: ['Lead AI Engineer at Cencora', 'Previously at Microsoft', '8 products built end to end', '2 npm packages · 1 App Store app', 'English, español, and a little TypeScript'], contact: 'Contact', contactBody: 'Building something interesting? Find me on', or: 'or drop me a line at', role: 'Right now', roleTitle: 'Building AI at Cencora', roleDetail: 'Lead AI Engineer · Healthcare', time: 'My local time', location: 'San Juan, Puerto Rico', photos: 'Project snapshots', current: 'On my workbench', currentCaption: 'AI for local businesses', playground: 'Playground', orbital: 'Orbit · made with Three.js', socials: 'Around the internet', collection: 'Selected work', tools: 'What I build with', code: 'Code & data', product: 'Product & delivery', note: 'From the notebook', read: 'Read the note', viewWork: 'Open my work', viewAll: 'All projects', open: 'Visit project', intro: 'A collection of things I’ve built, shipped, and learned from.', featured: 'Things I’ve built', light: 'Switch to light theme', dark: 'Switch to dark theme', appearance: 'Make yourself at home', previews: 'Project previews', copy: 'Copy email', copied: 'Email copied', close: 'Close preview', previous: 'Previous project', next: 'Next project' },
  es: { home: 'Inicio', work: 'Trabajo', writing: 'Ship Notes', resume: 'Résumé', about: 'Sobre mí', greeting: '¡Hola! Soy', bio: 'Ingeniero de IA en San Juan. Construyo productos útiles, de idea a producción.', facts: 'Un poco sobre mí', factList: ['Lead AI Engineer en Cencora', 'Antes en Microsoft', '8 productos de principio a fin', '2 paquetes npm · 1 app en el App Store', 'Inglés, español y un poco de TypeScript'], contact: 'Contacto', contactBody: '¿Construyes algo interesante? Encuéntrame en', or: 'o escríbeme a', role: 'Ahora mismo', roleTitle: 'Construyendo IA en Cencora', roleDetail: 'Lead AI Engineer · Salud', time: 'Mi hora local', location: 'San Juan, Puerto Rico', photos: 'Vistazos a mi trabajo', current: 'En mi mesa de trabajo', currentCaption: 'IA para negocios locales', playground: 'Experimentos', orbital: 'Orbit · hecho con Three.js', socials: 'Por el internet', collection: 'Trabajo seleccionado', tools: 'Con qué construyo', code: 'Código y datos', product: 'Producto y entrega', note: 'De mi libreta', read: 'Leer la nota', viewWork: 'Explora mi trabajo', viewAll: 'Todos los proyectos', open: 'Ver proyecto', intro: 'Una colección de cosas que he construido, lanzado y aprendido.', featured: 'Cosas que he construido', light: 'Cambiar a tema claro', dark: 'Cambiar a tema oscuro', appearance: 'Ponte cómodo', previews: 'Vistas de proyectos', copy: 'Copiar email', copied: 'Email copiado', close: 'Cerrar vista', previous: 'Proyecto anterior', next: 'Próximo proyecto' },
}

function tiltCard(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 3}deg`)
  event.currentTarget.style.setProperty('--tilt-x', `${-((event.clientY - rect.top) / rect.height - .5) * 3}deg`)
}
function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--tilt-y', '0deg')
  event.currentTarget.style.setProperty('--tilt-x', '0deg')
}
function Card({ title, icon, className = '', children }: { title?: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`desk-card ${className}`} onPointerMove={tiltCard} onPointerLeave={resetTilt}>
    {title && <h2 className="desk-card-heading">{icon}{title}</h2>}{children}
  </section>
}
function LocalClock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return <div className="desk-clock-body"><time dateTime={now.toISOString()}>{now.toLocaleTimeString(lang === 'es' ? 'es-PR' : 'en-US', { timeZone: 'America/Puerto_Rico', hour: '2-digit', minute: '2-digit', hour12: false })}<span className="desk-clock-seconds">:{String(now.getSeconds()).padStart(2, '0')}</span></time><span>{now.toLocaleDateString(lang === 'es' ? 'es-PR' : 'en-US', { timeZone: 'America/Puerto_Rico', weekday: 'long' })} · UTC−4</span></div>
}

function WorkFolder({ href, label }: { href: string; label: string }) {
  // The reference's folder is built from layered DOM surfaces and previews.
  return <Link className="desk-folder-card" to={href} aria-label={label}>
    <div className="desk-folder">
      <div className="desk-folder-back"><span /></div>
      {PHOTO_PROJECTS.map((project, index) => <img key={project.name} src={project.image} alt="" className={`desk-folder-paper paper-${index}`} />)}
      <div className="desk-folder-front"><FolderOpen size={28} strokeWidth={1.2} /><span>{label}<ArrowUpRight size={14} /></span></div>
    </div>
  </Link>
}

function PhotoStack({ active, onOpen, title }: { active: number; onOpen: (index: number) => void; title: string }) {
  return <div className="desk-photo-stack">
    {PHOTO_PROJECTS.map((project, index) => {
      const order = (index - active + PHOTO_PROJECTS.length) % PHOTO_PROJECTS.length
      return <button key={project.name} className={`desk-polaroid desk-polaroid-${order}`} onClick={() => onOpen(index)} tabIndex={order === 0 ? 0 : -1} aria-hidden={order !== 0} aria-label={`${title}: ${project.name}`}>
        <img src={project.image} alt={project.name} /><span><FolderOpen size={14} />{title}<ArrowUpRight size={12} /></span>
      </button>
    })}
  </div>
}

function ImagePreview({ index, onClose, setIndex, lang }: { index: number; onClose: () => void; setIndex: (index: number) => void; lang: Lang }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const project = PHOTO_PROJECTS[index]
  const text = words[lang]
  useEffect(() => {
    const node = dialog.current
    const focused = document.activeElement as HTMLElement | null
    node?.showModal()
    return () => { node?.close(); focused?.focus() }
  }, [])
  return <dialog className="desk-lightbox" ref={dialog} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }} onKeyDown={event => {
    if (event.key === 'ArrowRight') setIndex((index + 1) % PHOTO_PROJECTS.length)
    if (event.key === 'ArrowLeft') setIndex((index + PHOTO_PROJECTS.length - 1) % PHOTO_PROJECTS.length)
  }} aria-label={project.name}>
    <button className="desk-lightbox-close" onClick={onClose} aria-label={text.close}><X size={24} /></button>
    <div className="desk-lightbox-content"><img src={project.image} alt={`${project.name} preview`} /><div className="desk-lightbox-meta"><strong>{project.name}</strong><a href={project.link} target="_blank" rel="noreferrer">{text.open}<ArrowUpRight size={16} /></a></div><div className="desk-lightbox-thumbs">{PHOTO_PROJECTS.map((item, i) => <button key={item.name} onClick={() => setIndex(i)} aria-label={item.name} aria-pressed={index === i}><img src={item.image} alt="" /></button>)}</div></div>
  </dialog>
}

function WorkPage({ lang, projects, onOpen }: { lang: Lang; projects: Project[]; onOpen: (index: number) => void }) {
  const text = words[lang]
  return <div className="desk-page-content"><img className="desk-page-avatar" src="/jan-profile.jpg" alt="Jan Faris" /><h1>{text.intro}</h1><p className="desk-page-eyebrow">{text.featured}</p>
    <div className="desk-projects-page">{projects.map(project => {
      const preview = PHOTO_PROJECTS.findIndex(item => item.name.toLowerCase() === project.name.toLowerCase())
      return <article key={project.name}><div className="desk-work-title"><h2>{project.name}</h2><span>{project.year}</span></div><p>{project.description}</p>{project.outcome && <p className="desk-work-outcome">{project.outcome}</p>}
        {preview >= 0 && <button className="desk-work-preview" onClick={() => onOpen(preview)} aria-label={`${text.previews}: ${project.name}`}><img src={PHOTO_PROJECTS[preview].image} alt={`${project.name} preview`} /></button>}
        <div className="desk-work-links"><span>{project.tech.slice(0, 4).join(' · ')}</span><a href={project.link} target="_blank" rel="noreferrer">{text.open}<ArrowUpRight size={14} /></a></div>
      </article>
    })}</div>
  </div>
}

export default function Dashboard({ lang = 'en' }: { lang?: Lang }) {
  const text = words[lang]
  const [search] = useSearchParams()
  const view = search.get('view') === 'work' ? 'work' : search.get('view') === 'writing' ? 'writing' : 'home'
  const base = lang === 'es' ? '/es' : '/'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('jan-desk-theme') === 'light' ? 'light' : 'dark')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileLayout, setMobileLayout] = useState(() => window.matchMedia('(max-width: 980px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)')
    const change = () => setMobileLayout(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  const [imageIndex, setImageIndex] = useState<number | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [copied, setCopied] = useState(false)
  const resetCopy = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const main = useRef<HTMLElement>(null)
  const mobileNav = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const notes = lang === 'es' ? postsEs : posts
  const headlineNote = notes[1] ?? notes[0]
  const allProjects = content[lang].projects

  useEffect(() => {
    document.body.classList.add('dashboard-route')
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('jan-desk-theme', theme)
    document.title = 'Jan Faris — AI engineer & builder'
    document.documentElement.lang = lang
    return () => document.body.classList.remove('dashboard-route')
  }, [theme, lang])
  useEffect(() => {
    main.current?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view, lang])
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.querySelector('.desk-lightbox[open]') && !document.activeElement?.closest('.desk-sidebar-gallery, .desk-photo-stack')) setActivePhoto(index => (index + 1) % PHOTO_PROJECTS.length)
    }, 6500)
    return () => { window.clearInterval(interval); clearTimeout(resetCopy.current) }
  }, [])
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('jankarlo.faris@outlook.com')
      setCopied(true)
      clearTimeout(resetCopy.current)
      resetCopy.current = setTimeout(() => setCopied(false), 2400)
    } catch { window.location.href = 'mailto:jankarlo.faris@outlook.com' }
  }
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    const opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    mobileNav.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); return }
      if (event.key !== 'Tab') return
      const links = Array.from(mobileNav.current?.querySelectorAll<HTMLElement>('a') ?? [])
      const controls = [menuButton.current, ...links].filter((node): node is HTMLElement => node !== null)
      const index = controls.indexOf(document.activeElement as HTMLElement)
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus() }
      else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0]?.focus() }
    }
    const onResize = () => { if (window.innerWidth > 600) setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [menuOpen])
  const goHome = () => {
    setMenuOpen(false)
    main.current?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const nav = <><Link to={base} className={view === 'home' ? 'is-active' : ''} onClick={goHome}>{text.home}</Link><Link to={`${base}?view=work`} className={view === 'work' ? 'is-active' : ''} onClick={() => setMenuOpen(false)}>{text.work}</Link><Link to={`${base}?view=writing`} className={view === 'writing' ? 'is-active' : ''} onClick={() => setMenuOpen(false)}>{text.writing}</Link><Link to={lang === 'es' ? '/es/resume' : '/resume'}>{text.resume}</Link></>

  const island = <div className="desk-island-slot"><Suspense fallback={<div className="desk-island-loading">{lang === 'es' ? 'Abriendo la isla…' : 'Opening the island…'}</div>}><IslandExperience embedded lang={lang} theme={theme} /></Suspense></div>

  return <div className="desk-shell" data-theme={theme}>
    <a href="#desk-main" className="desk-skip">{lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
    <header className="desk-header"><Link className="desk-wordmark" inert={menuOpen} to={base} onClick={goHome} aria-label="Jan Faris home"><span><JFMark size={32} /></span>JAN FARIS</Link><nav aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}>{nav}</nav><div className="desk-header-actions"><Link className="desk-language" inert={menuOpen} to={`${lang === 'es' ? '/' : '/es'}${search.size ? `?${search.toString()}` : ''}`}>{lang === 'es' ? 'EN' : 'ES'}</Link><button className="desk-mobile-menu-toggle" ref={menuButton} aria-label={menuOpen ? (lang === 'es' ? 'Cerrar menú' : 'Close menu') : (lang === 'es' ? 'Abrir menú' : 'Open menu')} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></header>
    {menuOpen && <div className="desk-mobile-menu"><nav ref={mobileNav} aria-label={lang === 'es' ? 'Menú móvil' : 'Mobile menu'}>{nav}</nav></div>}
    {view === 'home' ? <div className="desk-layout" inert={menuOpen}>
      {mobileLayout && island}
      <aside className="desk-profile">
        <div className="desk-about"><div className="desk-sidebar-heading"><h2><Sparkles size={15} />{text.about}</h2><div><a href="https://github.com/janfaris" target="_blank" rel="noreferrer" aria-label="GitHub"><Code2 size={18} /></a><a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img className="desk-inline-brand" src="/dashboard/linkedin.svg" alt="" /></a><Link to={lang === 'es' ? '/es/resume' : '/resume'} aria-label={text.resume}><FileText size={18} /></Link></div></div>
          <div className="desk-intro"><img src="/jan-profile.jpg" alt="Jan Faris" /><div><h1>{text.greeting} <span>Jan.</span></h1><p>{text.bio}</p></div></div>
          <div className="desk-facts"><h2><CircleHelp size={15} />{text.facts}</h2><ul>{text.factList.map(fact => <li key={fact}>{fact}</li>)}</ul></div>
        </div>
        <div className="desk-sidebar-gallery" aria-label={text.previews}>{PHOTO_PROJECTS.map((project, index) => <button key={project.name} className={index === activePhoto ? 'is-current' : ''} onClick={() => setImageIndex(index)} tabIndex={index === activePhoto ? 0 : -1} aria-hidden={index !== activePhoto}><img src={project.image} alt={project.name} /><span>{project.name}<ArrowUpRight size={15} /></span></button>)}</div>
        <div className="desk-contact"><h2><Mail size={15} />{text.contact}</h2><p>{text.contactBody} <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer">LinkedIn</a> {text.or} <a href="mailto:jankarlo.faris@outlook.com">jankarlo.faris@outlook.com</a>.</p></div>
      </aside>
      <main id="desk-main" ref={main} className="desk-main" tabIndex={-1}>
        {!mobileLayout && island}
        <div className="desk-grid desk-grid-with-island">
          <Card title={text.role} icon={<Radio size={15} />} className="desk-status"><div className="desk-status-content"><span className="desk-status-dot" /><div><strong>{text.roleTitle}</strong><span>{text.roleDetail}</span></div></div></Card>
          <Card title={text.time} icon={<Clock3 size={15} />} className="desk-time"><LocalClock lang={lang} /></Card>
          <div className="desk-photos"><PhotoStack active={activePhoto} onOpen={setImageIndex} title={text.photos} /></div>
          <Card title={text.current} icon={<BriefcaseBusiness size={15} />} className="desk-current"><a href="https://lupa-seven.vercel.app" target="_blank" rel="noreferrer"><div className="desk-app-icon"><Search size={58} strokeWidth={1.5} /></div><strong>Lupa</strong><span>{text.currentCaption}</span><small>{lang === 'es' ? 'Herramienta interna · 120+ demos' : 'Internal tool · 120+ demos'}</small></a></Card>
          <WorkFolder href={`${base}?view=work`} label={text.viewWork} />
          <Card className="desk-theme"><span>{text.appearance}</span><button aria-label={theme === 'dark' ? text.light : text.dark} aria-pressed={theme === 'light'} className={`desk-theme-switch ${theme}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><span>{theme === 'dark' ? <Moon size={27} fill="currentColor" /> : <Sun size={27} />}</span></button></Card>
          <Card title={text.note} icon={<BookOpen size={15} />} className="desk-note"><div className="desk-note-art"><img src="/jan-profile.jpg" alt="" /></div><div className="desk-note-copy"><span>Ship Note {String(headlineNote.noteNumber).padStart(3, '0')}</span><h3>{headlineNote.title}</h3><p>{lang === 'es' ? 'Lecciones de construir un agente de revisión de código en Microsoft.' : 'Lessons from building an AI pull-request reviewer at Microsoft.'}</p><Link to={lang === 'es' ? `/es/writing/${headlineNote.slug}` : `/writing/${headlineNote.slug}`}>{text.read}<ArrowUpRight size={15} /></Link></div></Card>
          <Card title={text.socials} icon={<AtSign size={15} />} className="desk-socials"><div className="desk-social-grid"><a href="https://github.com/janfaris" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="/dashboard/github.png" alt="GitHub" /></a><a href="https://www.instagram.com/jankfaris/" target="_blank" rel="noreferrer" aria-label="Instagram @jankfaris"><img src="/dashboard/instagram.png" alt="Instagram" /></a><a className="desk-social-x" href="https://x.com/jankfaris" target="_blank" rel="noreferrer" aria-label="X @jankfaris"><img src="/dashboard/x.svg" alt="X" /></a><a className="desk-social-linkedin" href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img src="/dashboard/linkedin.svg" alt="" /></a><button className="desk-social-mail" onClick={copyEmail} aria-label={text.copy}><Mail size={29} /></button></div><span className="desk-copy-status" role="status">{copied ? text.copied : lang === 'es' ? 'Sigamos en contacto.' : 'Let’s connect.'}</span></Card>
          <Card title={text.tools} icon={<Laptop size={15} />} className="desk-tools"><div className="desk-tool-groups"><div><h3>{text.code}</h3>{[['TypeScript','typescript'],['React','react'],['Next.js','nextdotjs'],['Python','python'],['PostgreSQL','postgresql'],['Supabase','supabase']].map(([name,icon])=><span key={name}><img src={`/icons/tech/${icon}.svg`} alt="" />{name}</span>)}</div><div><h3>{text.product}</h3>{[['Playwright',''],['GitHub Actions','githubactions'],['FFmpeg','ffmpeg'],['Claude','claude'],['Copilot','githubcopilot'],['Vercel','vercel']].map(([name,icon])=><span key={name}>{icon?<img src={`/icons/tech/${icon}.svg`} alt="" />:<Code2 size={16} />}{name}</span>)}</div></div><Link className="desk-tools-foot" to={lang === 'es'?'/es/resume':'/resume'}><ArrowDownToLine size={14}/>{text.resume}<ArrowUpRight size={13}/></Link></Card>
          <div className="desk-guide-slot"><DashboardGuide lang={lang} /></div>
        </div>
      </main>
    </div> : <main id="desk-main" className="desk-secondary-main" inert={menuOpen} ref={main} tabIndex={-1}>
      <Link className="desk-back" to={base}><ArrowLeft size={15}/>{text.home}</Link>
      {view === 'work' ? <WorkPage lang={lang} projects={allProjects} onOpen={setImageIndex} /> : <div className="desk-page-content"><span className="desk-page-eyebrow">{text.writing}</span><h1>{lang === 'es' ? 'Notas desde el trabajo.' : 'Notes from the work.'}</h1><p className="desk-page-description">{lang === 'es' ? 'IA, herramientas y lo que aprendo construyendo.' : 'AI, tools, and what I learn while building.'}</p><div className="desk-notes-list">{notes.map(note=><Link key={note.slug} to={`${lang === 'es'?'/es':''}/writing/${note.slug}`}><span>#{String(note.noteNumber).padStart(3,'0')} · {note.date}</span><h2>{note.title}</h2><p>{note.description}</p><span>{note.readTime}<ArrowUpRight size={16}/></span></Link>)}</div></div>}
      <button className="desk-floating-theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={theme==='dark'?text.light:text.dark}>{theme==='dark'?<Moon size={20}/>:<Sun size={20}/>}</button>
    </main>}
    {imageIndex !== null && <ImagePreview index={imageIndex} setIndex={setImageIndex} onClose={() => setImageIndex(null)} lang={lang} />}
  </div>
}
