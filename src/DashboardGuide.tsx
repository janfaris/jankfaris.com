import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp, ArrowUpRight, MessageSquareText } from 'lucide-react'
import { content } from './content'
import type { Lang } from './content'
import './DashboardGuide.css'

type Topic = 'projects' | 'experience' | 'tools' | 'contact'
type GuideLink = { label: string; href: string }
type Answer = { paragraphs: string[]; links?: GuideLink[] }
type Turn = { id: number; question: string; topic?: Topic }

const EMAIL = 'mailto:jankarlo.faris@outlook.com'
const GITHUB = 'https://github.com/janfaris'
const LINKEDIN = 'https://linkedin.com/in/jan-faris-garcia'

const labels = {
  en: {
    label: 'Portfolio guide',
    hello: 'Curious about my work?',
    intro: 'Ask about my projects, experience, or the tools I build with.',
    placeholder: 'Ask me something…',
    input: 'Your question about Jan’s portfolio',
    send: 'Send question',
    source: 'Answers from this portfolio',
    you: 'You',
    guide: 'Portfolio guide',
    topics: {
      projects: 'What are you building?',
      experience: 'Your experience',
      tools: 'Your toolkit',
      contact: 'Get in touch',
    },
  },
  es: {
    label: 'Guía del portafolio',
    hello: '¿Quieres conocer mi trabajo?',
    intro: 'Pregunta por mis proyectos, mi experiencia o las herramientas que uso.',
    placeholder: 'Hazme una pregunta…',
    input: 'Tu pregunta sobre el portafolio de Jan',
    send: 'Enviar pregunta',
    source: 'Respuestas de este portafolio',
    you: 'Tú',
    guide: 'Guía del portafolio',
    topics: {
      projects: '¿Qué estás creando?',
      experience: 'Tu experiencia',
      tools: 'Tus herramientas',
      contact: 'Hablemos',
    },
  },
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getAnswer(question: string, lang: Lang, topic?: Topic): Answer {
  const copy = content[lang]
  const spanish = lang === 'es'
  const query = normalize(question)
  const project = copy.projects.find((item) => query.includes(normalize(item.name)))

  if (!topic && project) {
    return {
      paragraphs: [project.description, ...(project.outcome ? [project.outcome] : [])],
      links: [{ label: project.name, href: project.link }],
    }
  }

  if (!topic && /who are|about yourself|about jan|quien eres|sobre ti|quien es jan/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Soy Jan Faris, Lead AI Engineer en Cencora. Construyo productos de IA para salud y herramientas independientes desde San Juan, Puerto Rico. Antes trabajé en Microsoft, Xtillion y Pratt & Whitney.'
        : 'I’m Jan Faris, Lead AI Engineer at Cencora. I build AI products for healthcare and independent tools from San Juan, Puerto Rico. Previously, I worked at Microsoft, Xtillion, and Pratt & Whitney.'],
      links: [{ label: spanish ? 'Ver résumé' : 'View résumé', href: '/resume.pdf' }],
    }
  }

  if (topic === 'contact' || /contact|email|correo|linkedin|github|reach|connect|hello|hola|hablar|hablemos|contrat|hiring|available|disponib/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Mi enfoque está en la ingeniería de IA en Cencora y mis proyectos independientes. Me interesa conversar sobre IA útil, código abierto y tecnología en Puerto Rico.'
        : 'My focus is AI engineering at Cencora and my independent projects. I’m happy to compare notes on useful AI, open source, and technology in Puerto Rico.'],
      links: [
        { label: spanish ? 'Escríbeme' : 'Email me', href: EMAIL },
        { label: 'LinkedIn', href: LINKEDIN },
        { label: 'GitHub', href: GITHUB },
      ],
    }
  }

  if (topic === 'tools' || /stack|tool|herramient|tech|tecnolog|programming language|lenguaje|typescript|python|react|framework|skill|habilidad/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Trabajo con TypeScript, React, Next.js, Python y SQL. Para IA, construyo agentes, integraciones con modelos y flujos multimodales; para probar y entregar, uso Playwright y GitHub Actions.'
        : 'I work with TypeScript, React, Next.js, Python, and SQL. For AI, I build agents, model integrations, and multimodal workflows; for testing and delivery, I use Playwright and GitHub Actions.',
      spanish
        ? 'La herramienta depende del problema: desde React Native para Janga hasta Playwright y FFmpeg para demotape.'
        : 'The tools follow the problem: from React Native for Janga to Playwright and FFmpeg for demotape.'],
      links: [{ label: 'GitHub', href: GITHUB }],
    }
  }

  if (topic === 'experience' || /experience|experiencia|career|carrera|previous|antes|microsoft|xtillion|pratt|resume|curriculum|trayectoria/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Soy Lead AI Engineer en Cencora. Antes fui Software Engineer II en Microsoft, Associate Engineer en Xtillion y Software Engineer en Pratt & Whitney.'
        : 'I’m Lead AI Engineer at Cencora. Previously, I was a Software Engineer II at Microsoft, an Associate Engineer at Xtillion, and a Software Engineer at Pratt & Whitney.',
      spanish
        ? 'Mi trabajo abarca agentes de IA, sistemas de comercio, plataformas de datos para salud y herramientas de producción en entornos regulados.'
        : 'My work spans AI agents, commerce systems, healthcare data platforms, and production tools in regulated environments.'],
      links: [
        { label: spanish ? 'Ver résumé' : 'View résumé', href: '/resume.pdf' },
        { label: 'LinkedIn', href: LINKEDIN },
      ],
    }
  }

  if (/cencora|healthcare|salud|role|cargo|job|empleo|current role|a que te dedicas|what do you do|where do you work|donde trabajas/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Desde agosto de 2026 soy Lead AI Engineer en Cencora, trabajando en la entrega de capacidades de IA para salud y analítica de la cadena de suministro farmacéutica.'
        : 'Since August 2026, I’ve been Lead AI Engineer at Cencora, working on the production delivery of AI capabilities for healthcare and pharmaceutical supply-chain analytics.'],
      links: [{ label: 'LinkedIn', href: LINKEDIN }],
    }
  }

  if (/where|location|based|live|puerto rico|san juan|ubicacion|donde|idioma|language|bilingual|bilingue|spanish|espanol/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Estoy en San Juan, Puerto Rico. Trabajo en español e inglés, y varios de mis productos responden a necesidades locales: adquisición de clientes, propiedades y descubrimiento de lugares.'
        : 'I’m based in San Juan, Puerto Rico, and work in English and Spanish. Several of my products address local needs: client acquisition, property search, and discovering places.'],
      links: [{ label: spanish ? 'Por qué construyo para Puerto Rico' : 'Why I build for Puerto Rico', href: `${spanish ? '/es' : ''}/writing/ai-products-puerto-rico` }],
    }
  }

  if (/writ|essay|article|blog|ship note|escrib|ensayo|articulo|nota/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'En Ship Notes comparto lo que aprendo al construir: desde el tono puertorriqueño de Lupa hasta publicar paquetes en npm y dar observabilidad a los envíos de email.'
        : 'In Ship Notes, I share what I learn while building: from Lupa’s Puerto Rican Spanish to publishing npm packages and making email sends observable.'],
      links: [{ label: 'Ship Notes', href: `${spanish ? '/es' : ''}/writing` }],
    }
  }

  if (topic === 'projects' || /project|proyecto|build|crea|constru|making|work|trabaj|now|ahora|actual|ship|open source|npm/.test(query)) {
    return {
      paragraphs: [spanish
        ? 'Entre mis proyectos están Lupa, una herramienta interna de adquisición de clientes para negocios locales, y demotape, un CLI de código abierto que convierte una configuración JSON en un video demo.'
        : 'My projects include Lupa, an internal client-acquisition tool for local businesses, and demotape, an open-source CLI that turns a JSON config into a demo video.',
      spanish
        ? 'También publiqué spanish-tone-spec en npm y Janga en el App Store. Puedes preguntar por cualquier proyecto por su nombre.'
        : 'I also published spanish-tone-spec on npm and Janga on the App Store. Ask about any project by name.'],
      links: copy.projects.filter((item) => ['Lupa', 'demotape', 'Janga'].includes(item.name)).map((item) => ({ label: item.name, href: item.link })),
    }
  }

  return {
    paragraphs: [spanish
      ? 'Puedo orientarte sobre la información publicada aquí: proyectos, experiencia, herramientas y contacto. Prueba con “demotape”, “tu experiencia” o “¿qué estás creando?”.'
      : 'I can help with what’s published here: projects, experience, tools, and contact details. Try “demotape,” “your experience,” or “what are you building?”'],
    links: [{ label: spanish ? 'Hablar con Jan' : 'Ask Jan directly', href: EMAIL }],
  }
}

export function DashboardGuide({ lang }: { lang: Lang }) {
  const copy = labels[lang]
  const headingId = useId()
  const inputId = useId()
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const nextId = useRef(1)
  const conversationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const conversation = conversationRef.current
    if (conversation) conversation.scrollTop = conversation.scrollHeight
  }, [turns])

  function ask(value: string, topic?: Topic) {
    const trimmed = value.trim()
    if (!trimmed) return
    const turn = { id: nextId.current++, question: trimmed, topic }
    setTurns((previous) => [...previous.slice(-3), turn])
    setQuestion('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask(question)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      ask(question)
    }
  }

  return (
    <section className="dashboard-guide" aria-labelledby={headingId}>
      <header className="dashboard-guide__header">
        <MessageSquareText size={15} strokeWidth={1.5} aria-hidden="true" />
        <h2 id={headingId}>{copy.label}</h2>
        <span className="dashboard-guide__status" aria-hidden="true" />
      </header>

      <div className="dashboard-guide__conversation" ref={conversationRef} role="log" aria-live="polite" aria-label={copy.guide}>
        <div className="dashboard-guide__welcome">
          <p className="dashboard-guide__hello">{copy.hello}</p>
          <p>{copy.intro}</p>
        </div>
        {turns.map((turn) => {
          const answer = getAnswer(turn.question, lang, turn.topic)
          return (
            <div className="dashboard-guide__turn" key={turn.id}>
              <p className="dashboard-guide__question" aria-label={`${copy.you}: ${turn.question}`}>{turn.question}</p>
              <div className="dashboard-guide__answer">
                {answer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {answer.links && (
                  <div className="dashboard-guide__links">
                    {answer.links.map((link) => (
                      <a key={link.href} href={link.href} {...(link.href.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                        {link.label}<ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-guide__bottom">
        <div className="dashboard-guide__topics" aria-label={lang === 'es' ? 'Preguntas sugeridas' : 'Suggested questions'}>
          {(Object.keys(copy.topics) as Topic[]).slice(0, turns.length ? 4 : 3).map((topic) => (
            <button key={topic} type="button" onClick={() => ask(copy.topics[topic], topic)}>{copy.topics[topic]}</button>
          ))}
        </div>
        <form className="dashboard-guide__form" onSubmit={submit}>
          <label htmlFor={inputId} className="dashboard-guide__sr-only">{copy.input}</label>
          <textarea id={inputId} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={onKeyDown} placeholder={copy.placeholder} rows={1} maxLength={320} />
          <button className="dashboard-guide__send" type="submit" aria-label={copy.send} disabled={!question.trim()}>
            <ArrowUp size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </form>
        <p className="dashboard-guide__source">{copy.source}</p>
      </div>
    </section>
  )
}
