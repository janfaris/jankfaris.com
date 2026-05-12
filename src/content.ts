// All site copy in one place. EN + ES.
export type Lang = 'en' | 'es'

export interface Metric { label: string; value: string }
export interface Project {
  name: string
  tag: string
  year: string
  description: string
  link: string
  tech: string[]
  metrics?: Metric[]
  featured?: boolean
  span?: 'wide'
  /** Slug for /demos/<slug>.{mp4,jpg} — when set, card renders an autoplaying muted loop with poster fallback */
  media?: string
}
export interface ExperienceItem {
  company: string
  role: string
  period: string
  note: string
}
export interface PressItem {
  date: string
  outlet: string
  title: string
  link?: string
}

export interface Content {
  meta: {
    title: string
    description: string
  }
  nav: {
    en: string
    es: string
    writing: string
  }
  hero: {
    display: { lead: string; em: string; tail: string }
    lede: React.ReactNode | string
    metaItems: { key: string; val: string }[]
  }
  sections: {
    work: string
    writing: string
    press: string
    now: string
    experience: string
    available: string
    connect: string
  }
  projects: Project[]
  experience: ExperienceItem[]
  press: PressItem[]
  pressEmptyHint: string
  now: { headline: string; lines: string[]; updated: string }
  available: {
    headline: { lead: string; em: string; tail: string }
    body: string
    channels: {
      key: string
      title: string
      desc: string
      cta: string
      href: string
    }[]
    aside: { key: string; val: string }[]
  }
  writingCta: string
  allWriting: string
  footer: string
}

export const content: Record<Lang, Content> = {
  en: {
    meta: {
      title: 'Jan Faris — AI products from Puerto Rico',
      description:
        'Software engineer building Spanish-first AI products from Puerto Rico. Microsoft engineer. Creator of Lupa, demotape, and usableai.',
    },
    nav: { en: 'EN', es: 'ES', writing: 'Writing' },
    hero: {
      display: { lead: 'I build ', em: 'AI products', tail: '\u00A0from Puerto\u00A0Rico.' },
      lede:
        'Software Engineer at Microsoft. Spanish-first by default. Seven shipped products, one on the App Store, one on npm. Currently shipping Lupa, demotape, and usableai.',
      metaItems: [
        { key: 'Role', val: 'SWE II @ Microsoft' },
        { key: 'Based', val: 'San Juan, PR' },
        { key: 'Focus', val: 'AI products, devtools' },
        { key: 'Shipped', val: '7 products · 1 npm · 1 App Store' },
      ],
    },
    sections: {
      work: 'Selected Work',
      writing: 'Writing',
      press: 'Press & Speaking',
      now: 'Currently Building',
      experience: 'Experience',
      available: 'Work With Me',
      connect: 'Connect',
    },
    projects: [
      {
        name: 'Lupa',
        media: 'lupa',
        tag: 'AI Sales Tool',
        year: '2026',
        description:
          'Discovers Puerto Rico local businesses with Gemini 3 + Maps grounding, audits their sites with PageSpeed, and auto-generates a personalized Spanish demo site per lead. One-click WhatsApp pitch with view tracking.',
        link: 'https://lupa-seven.vercel.app',
        tech: ['Next.js 16', 'React 19', 'Gemini 3', 'Supabase', 'Stripe'],
        metrics: [
          { label: 'Demos generated', value: '120+' },
          { label: 'Categories', value: '7' },
          { label: 'Avg. fixability score', value: '6.4 / 10' },
        ],
        featured: true,
        span: 'wide',
      },
      {
        name: 'demotape',
        media: 'demotape',
        tag: 'Open Source · npm',
        year: '2026',
        description:
          'CLI that records production-quality demo videos of web apps from a JSON config. Auth-aware, skeleton-free, multi-format. Replaces an entire category of $30/mo SaaS tools.',
        link: 'https://github.com/janfaris/demotape',
        tech: ['TypeScript', 'Playwright', 'FFmpeg', 'Zod', 'MIT'],
        metrics: [
          { label: 'Package', value: 'demotape' },
          { label: 'License', value: 'MIT' },
          { label: 'Auth providers', value: '3' },
        ],
        featured: true,
        span: 'wide',
      },
      {
        name: 'Vantage',
        media: 'vantage',
        tag: 'Real Estate',
        year: '2025',
        description:
          'AI-powered real estate platform for Puerto Rico — listings, voice search, agent tools.',
        link: 'https://vantagepr.vercel.app',
        tech: ['Next.js', 'Claude', 'ElevenLabs', 'Stripe'],
      },
      {
        name: 'usableai',
        media: 'usableai',
        tag: 'Brand · Instagram',
        year: '2026',
        description:
          'Spanish-first daily AI digest for LATAM. Automated pipeline: RSS + curated X → GPT-5.5 → Instagram carousels with QA-validated slides.',
        link: 'https://instagram.com/usableai',
        tech: ['Node 22', 'GPT-5.5', 'GPT Image 2', 'Canvas'],
      },
      {
        name: 'Wandr',
        media: 'wandr',
        tag: 'Travel',
        year: '2025',
        description: 'AI travel planner with itineraries, flights, and local events.',
        link: 'https://wandrtravelai.com',
        tech: ['React', 'Supabase', 'Gemini', 'SerpAPI'],
      },
      {
        name: 'Janga',
        media: 'janga',
        tag: 'iOS App',
        year: '2025',
        description: 'Find where to hang out — live on the App Store.',
        link: 'https://apps.apple.com/us/app/janga/id6744530407',
        tech: ['Expo', 'React Native', 'Supabase'],
      },
      {
        name: 'Blok',
        media: 'blok',
        span: 'wide',
        tag: 'PropTech',
        year: '2025',
        description: 'AI condo management for Puerto Rico over WhatsApp.',
        link: 'https://www.blokpr.co',
        tech: ['Next.js', 'WhatsApp API', 'Twilio', 'Claude'],
      },
    ],
    experience: [
      {
        company: 'Microsoft',
        role: 'Software Engineer II',
        period: '2025 — Present',
        note: 'Full-time engineering at Microsoft. Working on production systems at hyperscale.',
      },
      {
        company: 'Xtillion',
        role: 'Associate Engineer',
        period: '2024 — 2025',
        note: 'Shipped enterprise software for U.S. clients. Full-stack TypeScript, React, Node.',
      },
      {
        company: 'Pratt & Whitney',
        role: 'Co-Op Software Engineer',
        period: '2021 — 2023',
        note: 'Two-year co-op writing production code in the aerospace propulsion stack.',
      },
    ],
    press: [],
    pressEmptyHint:
      'First mentions coming soon. If you write, podcast, or organize on AI / tech in Puerto Rico — I\u2019m happy to talk.',
    now: {
      headline: 'Lupa — AI sales tool for Puerto Rico local businesses.',
      lines: [
        'Shipping daily on usableai (Spanish-first AI digest, Instagram).',
        'Writing one essay per month on building AI products from Puerto Rico.',
        'Open to one consulting engagement this quarter.',
      ],
      updated: 'Updated monthly',
    },
    available: {
      headline: {
        lead: 'Three ways to ',
        em: 'work with me',
        tail: '.',
      },
      body:
        'I split my time between Microsoft, my own AI products, and a small amount of work for founders and teams who want to ship something real. If any of these fit, let\u2019s talk.',
      channels: [
        {
          key: 'hire',
          title: 'Hire me · full-time',
          desc:
            'Founding engineer, staff engineer, or tech lead at AI-native startups. Especially agents, devtools, or LATAM / Spanish-first products.',
          cta: 'Email me',
          href: 'mailto:jankfaris@gmail.com?subject=Full-time%20role',
        },
        {
          key: 'consult',
          title: 'Work with me · project',
          desc:
            'AI audits, build sprints, prompt architecture, or 0→1 product builds. Limited slots per quarter. Best fit: founders shipping for PR / LATAM.',
          cta: 'Book an intro',
          href: 'https://cal.com/janfaris/intro',
        },
        {
          key: 'speak',
          title: 'Talk with me · speaking',
          desc:
            'Talks, panels, podcasts, and workshops on AI in Puerto Rico, Spanish-first products, and shipping with LLMs. Bilingual.',
          cta: 'Pitch a topic',
          href: 'mailto:jankfaris@gmail.com?subject=Speaking%20invite',
        },
      ],
      aside: [
        { key: 'Stack', val: 'TypeScript, Next.js, Python, LLMs, Supabase' },
        { key: 'Domains', val: 'AI agents, devtools, vertical SaaS, LATAM' },
        { key: 'Location', val: 'San Juan, PR · Remote or hybrid SF' },
        { key: 'Languages', val: 'English · Spanish (PR / LATAM register)' },
      ],
    },
    writingCta: 'All writing →',
    allWriting: 'All writing',
    footer: 'Built in Puerto Rico · © 2026 Jan Faris',
  },

  es: {
    meta: {
      title: 'Jan Faris — Productos de IA desde Puerto Rico',
      description:
        'Ingeniero de software construyendo productos de IA en español desde Puerto Rico. Ingeniero en Microsoft. Creador de Lupa, demotape y usableai.',
    },
    nav: { en: 'EN', es: 'ES', writing: 'Ensayos' },
    hero: {
      display: {
        lead: 'Construyo ',
        em: 'productos de IA',
        tail: '\u00A0desde Puerto\u00A0Rico.',
      },
      lede:
        'Ingeniero de software en Microsoft. Español primero, por defecto. Siete productos lanzados, uno en el App Store, uno en npm. Actualmente embarcando Lupa, demotape y usableai.',
      metaItems: [
        { key: 'Rol', val: 'SWE II @ Microsoft' },
        { key: 'Base', val: 'San Juan, PR' },
        { key: 'Foco', val: 'Productos de IA, devtools' },
        { key: 'Lanzados', val: '7 productos · 1 npm · 1 App Store' },
      ],
    },
    sections: {
      work: 'Trabajo Seleccionado',
      writing: 'Ensayos',
      press: 'Prensa y Charlas',
      now: 'Actualmente Construyendo',
      experience: 'Experiencia',
      available: 'Trabaja Conmigo',
      connect: 'Contacto',
    },
    projects: [
      {
        name: 'Lupa',
        media: 'lupa',
        tag: 'IA · Ventas',
        year: '2026',
        description:
          'Descubre negocios locales en Puerto Rico con Gemini 3 + Google Maps, audita sus webs con PageSpeed y genera una página demo personalizada en español para cada lead. Pitch directo por WhatsApp con tracking de vistas.',
        link: 'https://lupa-seven.vercel.app',
        tech: ['Next.js 16', 'React 19', 'Gemini 3', 'Supabase', 'Stripe'],
        metrics: [
          { label: 'Demos generados', value: '120+' },
          { label: 'Categorías', value: '7' },
          { label: 'Score de fixability', value: '6.4 / 10' },
        ],
        featured: true,
        span: 'wide',
      },
      {
        name: 'demotape',
        media: 'demotape',
        tag: 'Open Source · npm',
        year: '2026',
        description:
          'CLI que graba videos demo de calidad producción para apps web desde un config en JSON. Maneja autenticación, evita estados de loading, y exporta múltiples formatos. Reemplaza toda una categoría de SaaS de $30/mes.',
        link: 'https://github.com/janfaris/demotape',
        tech: ['TypeScript', 'Playwright', 'FFmpeg', 'Zod', 'MIT'],
        metrics: [
          { label: 'Paquete', value: 'demotape' },
          { label: 'Licencia', value: 'MIT' },
          { label: 'Auth providers', value: '3' },
        ],
        featured: true,
        span: 'wide',
      },
      {
        name: 'Vantage',
        media: 'vantage',
        tag: 'Bienes Raíces',
        year: '2025',
        description:
          'Plataforma de bienes raíces con IA para Puerto Rico — listings, búsqueda por voz, herramientas para agentes.',
        link: 'https://vantagepr.vercel.app',
        tech: ['Next.js', 'Claude', 'ElevenLabs', 'Stripe'],
      },
      {
        name: 'usableai',
        media: 'usableai',
        tag: 'Marca · Instagram',
        year: '2026',
        description:
          'Digest diario de IA en español para LATAM. Pipeline automatizado: RSS + X curado → GPT-5.5 → carruseles de Instagram con QA visual.',
        link: 'https://instagram.com/usableai',
        tech: ['Node 22', 'GPT-5.5', 'GPT Image 2', 'Canvas'],
      },
      {
        name: 'Wandr',
        media: 'wandr',
        tag: 'Viajes',
        year: '2025',
        description: 'Planificador de viajes con IA — itinerarios, vuelos y eventos locales.',
        link: 'https://wandrtravelai.com',
        tech: ['React', 'Supabase', 'Gemini', 'SerpAPI'],
      },
      {
        name: 'Janga',
        media: 'janga',
        tag: 'App iOS',
        year: '2025',
        description: 'Encuentra dónde janguear — disponible en el App Store.',
        link: 'https://apps.apple.com/us/app/janga/id6744530407',
        tech: ['Expo', 'React Native', 'Supabase'],
      },
      {
        name: 'Blok',
        media: 'blok',
        span: 'wide',
        tag: 'PropTech',
        year: '2025',
        description: 'IA para administración de condominios en Puerto Rico, sobre WhatsApp.',
        link: 'https://www.blokpr.co',
        tech: ['Next.js', 'WhatsApp API', 'Twilio', 'Claude'],
      },
    ],
    experience: [
      {
        company: 'Microsoft',
        role: 'Software Engineer II',
        period: '2025 — Presente',
        note: 'Ingeniería full-time en Microsoft. Sistemas de producción a escala.',
      },
      {
        company: 'Xtillion',
        role: 'Associate Engineer',
        period: '2024 — 2025',
        note: 'Software empresarial para clientes en EE.UU. Full-stack TypeScript, React, Node.',
      },
      {
        company: 'Pratt & Whitney',
        role: 'Co-Op Software Engineer',
        period: '2021 — 2023',
        note: 'Dos años de co-op escribiendo código de producción para sistemas aeroespaciales.',
      },
    ],
    press: [],
    pressEmptyHint:
      'Primeras menciones próximamente. Si escribes, haces podcasts u organizas eventos sobre IA o tecnología en Puerto Rico — escríbeme.',
    now: {
      headline: 'Lupa — herramienta de ventas con IA para negocios locales en PR.',
      lines: [
        'Publicando diariamente en usableai (digest de IA en español, Instagram).',
        'Escribiendo un ensayo al mes sobre construir productos de IA desde Puerto Rico.',
        'Abierto a un proyecto de consultoría este trimestre.',
      ],
      updated: 'Actualizado mensualmente',
    },
    available: {
      headline: {
        lead: 'Tres formas de ',
        em: 'trabajar conmigo',
        tail: '.',
      },
      body:
        'Divido mi tiempo entre Microsoft, mis propios productos de IA, y una pequeña cantidad de trabajo para founders y equipos que quieren lanzar algo real. Si encajas en alguna, hablemos.',
      channels: [
        {
          key: 'hire',
          title: 'Contrátame · full-time',
          desc:
            'Founding engineer, staff engineer o tech lead en startups de IA. Especialmente agentes, devtools, o productos para LATAM / mercados en español.',
          cta: 'Escríbeme',
          href: 'mailto:jankfaris@gmail.com?subject=Rol%20full-time',
        },
        {
          key: 'consult',
          title: 'Proyecto · consultoría',
          desc:
            'Auditorías de IA, sprints de construcción, arquitectura de prompts, o builds 0→1. Cupos limitados por trimestre. Encaja mejor con founders en PR / LATAM.',
          cta: 'Agenda una intro',
          href: 'https://cal.com/janfaris/intro',
        },
        {
          key: 'speak',
          title: 'Charla · speaking',
          desc:
            'Charlas, paneles, podcasts y workshops sobre IA en Puerto Rico, productos en español primero, y cómo lanzar con LLMs. Bilingüe.',
          cta: 'Propón un tema',
          href: 'mailto:jankfaris@gmail.com?subject=Invitación%20a%20hablar',
        },
      ],
      aside: [
        { key: 'Stack', val: 'TypeScript, Next.js, Python, LLMs, Supabase' },
        { key: 'Áreas', val: 'Agentes IA, devtools, vertical SaaS, LATAM' },
        { key: 'Ubicación', val: 'San Juan, PR · Remoto o híbrido SF' },
        { key: 'Idiomas', val: 'Español (registro PR / LATAM) · Inglés' },
      ],
    },
    writingCta: 'Todos los ensayos →',
    allWriting: 'Todos los ensayos',
    footer: 'Hecho en Puerto Rico · © 2026 Jan Faris',
  },
}
