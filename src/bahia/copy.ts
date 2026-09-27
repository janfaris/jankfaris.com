import type { Lang } from '../content'

// Every claim here comes from content.ts, posts.ts, or the current homepage.
export const EMAIL = 'jankarlo.faris@outlook.com'

type Text = Record<Lang, string>

export type FeaturedProject = {
  name: string
  link: string
  linkLabel: Text
  meta: Text
  body: Text
  note?: Text
  tech: string[]
  video?: { src: string; poster: string }
  pipeline?: Record<Lang, string[]>
  stats?: { value: string; label: Text }[]
}

export type SmallProject = {
  name: string
  link: string
  linkLabel: Text
  meta: Text
  body: Text
  image?: string
  code?: string
}

export const featured: FeaturedProject[] = [
  {
    name: 'Lupa',
    link: 'https://lupa-seven.vercel.app',
    linkLabel: { en: 'Open Lupa', es: 'Abrir Lupa' },
    meta: { en: 'Internal tool · 2026', es: 'Herramienta interna · 2026' },
    body: {
      en: 'Turns a weak website into a concrete sales conversation. Lupa audits local businesses, builds a personalized Spanish demo for each lead, and sends the pitch over WhatsApp.',
      es: 'Convierte una web con problemas en una propuesta concreta. Lupa audita negocios locales, genera una demo personalizada en español para cada prospecto y envía la propuesta por WhatsApp.',
    },
    note: {
      en: 'Used by me and my partner to pitch local businesses in Puerto Rico.',
      es: 'Mi socio y yo lo usamos para presentar propuestas a negocios locales en Puerto Rico.',
    },
    tech: ['Next.js 16', 'React 19', 'Gemini 3', 'Supabase', 'Stripe'],
    pipeline: {
      en: ['Maps search', 'AI audit', 'Spanish demo site', 'WhatsApp pitch'],
      es: ['Búsqueda en Maps', 'Auditoría IA', 'Demo en español', 'Pitch por WhatsApp'],
    },
    stats: [
      { value: '120+', label: { en: 'demo sites generated', es: 'sitios demo generados' } },
      { value: '7', label: { en: 'business categories', es: 'categorías de negocio' } },
    ],
  },
  {
    name: 'Vantage',
    link: 'https://vantagepr.vercel.app',
    linkLabel: { en: 'Open Vantage', es: 'Abrir Vantage' },
    meta: { en: 'Real estate · 2025', es: 'Bienes raíces · 2025' },
    body: {
      en: 'Find properties in Puerto Rico by describing them aloud. Voice search, listings, and tools for agents.',
      es: 'Encuentra propiedades en Puerto Rico describiéndolas en voz alta. Búsqueda por voz, listings y herramientas para agentes.',
    },
    tech: ['Next.js', 'Claude', 'ElevenLabs', 'Stripe'],
    video: { src: '/demos/vantage.mp4', poster: '/demos/vantage.jpg' },
  },
  {
    name: 'demotape',
    link: 'https://github.com/janfaris/demotape',
    linkLabel: { en: 'View on GitHub', es: 'Ver en GitHub' },
    meta: { en: 'Open source · npm · 2026', es: 'Open source · npm · 2026' },
    body: {
      en: 'Recording a new demo should not mean repeating every click by hand. A CLI that turns a JSON script into a video, handling login, page readiness, and export formats.',
      es: 'Grabar otra demo no debería exigir repetir cada clic a mano. Un CLI que convierte un guion JSON en video: maneja el login, espera a que cargue la página y exporta en varios formatos.',
    },
    note: { en: 'This clip was recorded with demotape.', es: 'Este clip se grabó con demotape.' },
    tech: ['TypeScript', 'Playwright', 'FFmpeg', 'Zod'],
    video: { src: '/demos/demotape.mp4', poster: '/demos/demotape.jpg' },
  },
  {
    name: 'Blok',
    link: 'https://www.blokpr.co',
    linkLabel: { en: 'Open Blok', es: 'Abrir Blok' },
    meta: { en: 'PropTech · 2025', es: 'PropTech · 2025' },
    body: {
      en: 'Brings condo management into WhatsApp, where residents and administrators already communicate.',
      es: 'Lleva la administración del condominio a WhatsApp, donde ya se comunican residentes y administradores.',
    },
    tech: ['Next.js', 'WhatsApp API', 'Twilio', 'Claude'],
    video: { src: '/demos/blok.mp4', poster: '/demos/blok.jpg' },
  },
  {
    name: 'Wandr',
    link: 'https://wandrtravelai.com',
    linkLabel: { en: 'Open Wandr', es: 'Abrir Wandr' },
    meta: { en: 'Travel · 2025', es: 'Viajes · 2025' },
    body: {
      en: 'Brings itineraries, flights, and local events into one AI-assisted trip plan.',
      es: 'Reúne itinerarios, vuelos y eventos locales en un plan de viaje asistido por IA.',
    },
    tech: ['React', 'Supabase', 'Gemini', 'SerpAPI'],
    video: { src: '/demos/wandr.mp4', poster: '/demos/wandr.jpg' },
  },
]

export const alsoShipped: SmallProject[] = [
  {
    name: 'Janga',
    link: 'https://apps.apple.com/us/app/janga/id6744530407',
    linkLabel: { en: 'View on the App Store', es: 'Ver en el App Store' },
    meta: { en: 'iOS app · 2025', es: 'App iOS · 2025' },
    body: { en: 'Helps people find where to hang out. Live on the App Store.', es: 'Ayuda a encontrar dónde janguear. Disponible en el App Store.' },
    image: '/demos/janga.jpg',
  },
  {
    name: 'spanish-tone-spec',
    link: 'https://www.npmjs.com/package/spanish-tone-spec',
    linkLabel: { en: 'View on npm', es: 'Ver en npm' },
    meta: { en: 'Open source · npm · 2026', es: 'Open source · npm · 2026' },
    body: {
      en: 'Helps LLMs write for a specific Spanish-speaking region, with tone controlled in the prompt.',
      es: 'Ayuda a los LLMs a escribir para una región hispanohablante específica; el tono se controla desde el prompt.',
    },
    code: 'npm i spanish-tone-spec',
  },
  {
    name: 'usableai',
    link: 'https://instagram.com/usableai',
    linkLabel: { en: 'See @usableai', es: 'Ver @usableai' },
    meta: { en: 'Content engine · 2026', es: 'Motor de contenido · 2026' },
    body: {
      en: 'Turns curated AI news into Spanish Instagram carousels with visual QA. The private engine behind @usableai.',
      es: 'Convierte noticias curadas de IA en carruseles en español con QA visual. El motor privado detrás de @usableai.',
    },
  },
]

export const stops = [
  {
    company: 'Pratt & Whitney',
    role: 'Software Engineer',
    period: { en: '2021 - 2023', es: '2021 - 2023' },
    body: {
      en: 'F-135 DevSecOps. Cut build time 90% by automating and securing CI/CD.',
      es: 'DevSecOps para el F-135. Reduje el build time 90% automatizando y asegurando CI/CD.',
    },
  },
  {
    company: 'Xtillion',
    role: 'Associate Engineer',
    period: { en: '2024 - 2025', es: '2024 - 2025' },
    body: {
      en: 'Led a 12-month migration from SQL Server and SSRS to Retool, Snowflake, dbt, and GitHub Actions, generating 5,000+ reports daily.',
      es: 'Lideré una migración de 12 meses de SQL Server y SSRS a Retool, Snowflake, dbt y GitHub Actions, que genera 5,000+ reportes diarios.',
    },
  },
  {
    company: 'Microsoft',
    role: 'Software Engineer II',
    period: { en: '2025 - 2026', es: '2025 - 2026' },
    body: {
      en: 'Trust Platform, Commerce Core. Built PRPilot, an autonomous PR-review agent across 7+ repositories that processed 50-100 PRs a week.',
      es: 'Trust Platform, Commerce Core. Construí PRPilot, un agente autónomo que revisaba PRs en 7+ repositorios y procesaba 50-100 PRs por semana.',
    },
  },
  {
    company: 'Cencora',
    role: 'Lead AI Engineer',
    period: { en: 'Aug 2026 - Present', es: 'Ago 2026 - Presente' },
    body: {
      en: 'Leading the engineering and production delivery of AI capabilities for healthcare and pharmaceutical supply-chain analytics.',
      es: 'Liderando la ingeniería y la puesta en producción de capacidades de IA para salud y analítica de la cadena de suministro farmacéutica.',
    },
  },
]

export const socials = [
  { label: 'GitHub', href: 'https://github.com/janfaris' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/jan-faris-garcia' },
  { label: 'X', href: 'https://x.com/jankfaris' },
  { label: 'Instagram', href: 'https://www.instagram.com/jankfaris/' },
]

const en = {
  metaTitle: 'Jan Faris | AI engineer in Puerto Rico',
  metaDescription: 'Lead AI Engineer at Cencora, previously Microsoft. Building AI products from San Juan, Puerto Rico.',
  skip: 'Skip to content',
  nav: { work: 'Work', notes: 'Ship Notes', resume: 'Résumé', menu: 'Menu', close: 'Close menu', switchLabel: 'Leer en español', switchTo: 'ES' },
  sound: { on: 'Sound on', off: 'Sound off', label: 'Night sounds: coquís and waves' },
  hello: 'Say hello',
  hero: {
    eyebrow: 'AI engineer in San Juan, Puerto Rico',
    sub: 'I build AI products that hold up in the real world. Lead AI Engineer at Cencora, previously Microsoft.',
    work: 'See the work',
  },
  island: {
    steps: [
      { title: 'Built in Puerto Rico.', body: 'I grew up here, and I build here. Local context is a moat, and Spanish-first software is bigger than people think.' },
      { title: 'Native, not translated.', body: 'Lupa pitches local businesses in Puerto Rican Spanish. I open-sourced the tone system behind it as spanish-tone-spec.' },
    ],
    caption: 'The glow on this page is a nod to Mosquito Bay in Vieques, where the water lights up when you move through it.',
    mapLabel: 'Map of Puerto Rico with San Juan marked',
  },
  work: {
    title: 'Things I’ve shipped.',
    sub: 'Eight products built end to end. Two on npm, one on the App Store.',
    stats: [
      { value: '08', label: 'products shipped' },
      { value: '2', label: 'npm packages' },
      { value: '1', label: 'App Store app' },
    ],
    also: 'Also shipped',
    pipeline: 'How it works',
  },
  path: {
    title: 'From jet engines to AI agents.',
    intro: 'Hey, I’m Jan. I’ve shipped software for jet engines, healthcare data, and Microsoft’s commerce platform. Now I’m Lead AI Engineer at Cencora.',
    resume: 'Full résumé',
    portrait: 'Jan Faris',
  },
  notes: {
    title: 'Ship Notes',
    sub: 'What I learn shipping AI products, written down and numbered.',
    all: 'All Ship Notes',
    english: 'EN',
    tool: 'Weighing an AI idea? Try',
    toolName: 'Should this be AI?',
    toolTail: 'a 3-minute decision tool.',
  },
  contact: {
    title: 'Good work starts with a conversation.',
    body: 'For conversations about useful AI, open source, or the tech community in Puerto Rico, say hello.',
    copy: 'Copy email',
    copied: 'Copied',
  },
  footer: 'Hecho en Puerto Rico · © 2026 Jan Faris',
}

const es: typeof en = {
  metaTitle: 'Jan Faris | Ingeniero de IA en Puerto Rico',
  metaDescription: 'Lead AI Engineer en Cencora, antes en Microsoft. Construyendo productos de IA desde San Juan, Puerto Rico.',
  skip: 'Saltar al contenido',
  nav: { work: 'Trabajo', notes: 'Ship Notes', resume: 'Résumé', menu: 'Menú', close: 'Cerrar menú', switchLabel: 'Read in English', switchTo: 'EN' },
  sound: { on: 'Sonido sí', off: 'Sonido no', label: 'Sonidos de noche: coquíes y olas' },
  hello: 'Hablemos',
  hero: {
    eyebrow: 'Ingeniero de IA en San Juan, Puerto Rico',
    sub: 'Construyo productos de IA que funcionan en el mundo real. Lead AI Engineer en Cencora, antes en Microsoft.',
    work: 'Ver el trabajo',
  },
  island: {
    steps: [
      { title: 'Hecho en Puerto Rico.', body: 'Crecí aquí y construyo aquí. El contexto local es una ventaja, y el software en español primero es más grande de lo que parece.' },
      { title: 'Nativo, no traducido.', body: 'Lupa le presenta propuestas a negocios locales en español puertorriqueño. El sistema de tono detrás está en npm como spanish-tone-spec.' },
    ],
    caption: 'El brillo de esta página es un guiño a la Bahía Mosquito en Vieques, donde el agua se ilumina cuando te mueves en ella.',
    mapLabel: 'Mapa de Puerto Rico con San Juan marcado',
  },
  work: {
    title: 'Lo que he lanzado.',
    sub: 'Ocho productos de principio a fin. Dos en npm y uno en el App Store.',
    stats: [
      { value: '08', label: 'productos lanzados' },
      { value: '2', label: 'paquetes npm' },
      { value: '1', label: 'app en el App Store' },
    ],
    also: 'También lancé',
    pipeline: 'Cómo funciona',
  },
  path: {
    title: 'De motores de avión a agentes de IA.',
    intro: '¡Hola! Soy Jan. He lanzado software para motores de avión, datos de salud y la plataforma de comercio de Microsoft. Hoy soy Lead AI Engineer en Cencora.',
    resume: 'Résumé completo',
    portrait: 'Jan Faris',
  },
  notes: {
    title: 'Ship Notes',
    sub: 'Lo que aprendo lanzando productos de IA, por escrito y numerado.',
    all: 'Todas las Ship Notes',
    english: 'EN',
    tool: '¿Evaluando una idea con IA? Prueba',
    toolName: '¿Esto debería usar IA?',
    toolTail: 'una herramienta de decisión de 3 minutos.',
  },
  contact: {
    title: 'Las buenas ideas se conversan.',
    body: 'Para conversar sobre IA útil, open source o la comunidad tech de Puerto Rico, escríbeme.',
    copy: 'Copiar email',
    copied: 'Copiado',
  },
  footer: 'Hecho en Puerto Rico · © 2026 Jan Faris',
}

export const copy: Record<Lang, typeof en> = { en, es }
