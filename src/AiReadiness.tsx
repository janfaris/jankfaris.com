import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { JFMark } from './JFMark.tsx'

type Language = 'en' | 'es'
type Answer = 'yes' | 'not-yet'
type Answers = Partial<Record<string, Answer>>
type GroupId = 'problem' | 'system' | 'production'
type OutcomeId = 'foundation' | 'prototype' | 'gates' | 'pilot' | 'production'

interface ChecklistItem {
  id: string
  group: GroupId
  title: string
  detail: string
  critical?: boolean
}

const checklist = {
  en: {
    back: '← Back home',
    eyebrow: 'Product decision tool · 3 minutes',
    title: 'Should this be AI?',
    lede: 'Answer 10 production questions. Get a clear recommendation: validate the problem, prototype one workflow, run a pilot, or plan production.',
    proof: ['10 questions', '3 decision layers', '0 data sent'],
    introTitle: 'Readiness is not a vibe.',
    introBody: 'A high score helps. Missing one critical gate can still stop a launch. Answer for the system you can ship today, not the roadmap in your head.',
    scoreLabel: 'Ready signals',
    answered: 'answered',
    privacy: 'Your answers stay in this browser. Nothing is stored or sent.',
    yes: 'Yes',
    notYet: 'Not yet',
    groups: {
      problem: { number: '01', title: 'The problem', body: 'Prove the job deserves AI before choosing a model.' },
      system: { number: '02', title: 'The system', body: 'Design for wrong answers, cost, and user trust.' },
      production: { number: '03', title: 'Production', body: 'Make quality measurable and failure recoverable.' },
    },
    items: [
      { id: 'recurring', group: 'problem', title: 'The workflow happens often enough to matter.', detail: 'You can name the user, frequency, and current cost of the problem.' },
      { id: 'judgable', group: 'problem', title: 'A domain expert can recognize a good result.', detail: 'Quality is observable, even when it cannot be reduced to one exact answer.', critical: true },
      { id: 'advantage', group: 'problem', title: 'AI earns its place over deterministic software.', detail: 'The job requires ambiguity, language, perception, or generation—not a rules engine in disguise.' },
      { id: 'context', group: 'system', title: 'The required context is available and permitted.', detail: 'Inputs are reliable, current, consented to, and usable in the target environment.' },
      { id: 'fallback', group: 'system', title: 'Users can recover when the model is wrong.', detail: 'There is review, undo, correction, escalation, or a non-AI path.', critical: true },
      { id: 'limits', group: 'system', title: 'The interface communicates scope and uncertainty.', detail: 'Users know what the system did, what it did not do, and when to verify.' },
      { id: 'budget', group: 'system', title: 'Latency and cost have explicit budgets.', detail: 'The experience still works at expected volume, response time, and unit economics.' },
      { id: 'evals', group: 'production', title: 'Representative examples exist before launch.', detail: 'You can test known good, known bad, edge, and adversarial cases repeatedly.', critical: true },
      { id: 'owner', group: 'production', title: 'A person owns quality after release.', detail: 'Monitoring, feedback, incidents, and prompt or model changes have an accountable owner.', critical: true },
      { id: 'rollout', group: 'production', title: 'The first rollout is narrow and reversible.', detail: 'A limited cohort, kill switch, and success threshold are defined before launch.', critical: true },
    ] satisfies ChecklistItem[],
    remaining: (count: number) => `${count} question${count === 1 ? '' : 's'} left before your recommendation.`,
    resultEyebrow: 'Your recommendation',
    missingGate: 'Critical gate still open',
    reset: 'Reset answers',
    copy: 'Copy result',
    share: 'Share check',
    copied: 'Result copied.',
    shared: 'Share sheet opened.',
    copyError: 'Could not copy the result. Try again from a secure browser window.',
    cta: 'Want a second opinion?',
    ctaBody: 'I help teams turn ambiguous AI ideas into scoped, testable product systems.',
    ctaLink: 'Book an AI product review',
    outcomes: {
      foundation: { title: 'Stay with the problem.', body: 'The AI layer is ahead of the evidence. Validate frequency, value, and what “good” means before prototyping.' },
      prototype: { title: 'Prototype one narrow workflow.', body: 'There is enough signal to learn, but not enough control to promise reliability. Keep the user and blast radius small.' },
      gates: { title: 'Promising, with a production gate open.', body: 'The score is strong, but one missing critical control can erase the rest. Close the flagged gate before expanding access.' },
      pilot: { title: 'Ready for a scoped pilot.', body: 'The problem and system are credible. Launch to a controlled cohort, measure real failures, and earn broader rollout.' },
      production: { title: 'Ready for production planning.', body: 'The fundamentals are in place. Define launch thresholds, operating ownership, and the evidence required to scale.' },
    },
  },
  es: {
    back: '← Volver al inicio',
    eyebrow: 'Herramienta de decisión · 3 minutos',
    title: '¿Esto debería usar IA?',
    lede: 'Contesta 10 preguntas de producción. Recibe una recomendación clara: valida el problema, prototipa un flujo, haz un piloto o planifica producción.',
    proof: ['10 preguntas', '3 capas de decisión', '0 datos enviados'],
    introTitle: 'La preparación no es una corazonada.',
    introBody: 'Una puntuación alta ayuda. Una sola barrera crítica puede detener el lanzamiento. Contesta para el sistema que puedes lanzar hoy, no para el roadmap ideal.',
    scoreLabel: 'Señales listas',
    answered: 'contestadas',
    privacy: 'Tus respuestas se quedan en este navegador. No se guarda ni se envía nada.',
    yes: 'Sí',
    notYet: 'Todavía no',
    groups: {
      problem: { number: '01', title: 'El problema', body: 'Demuestra que el trabajo merece IA antes de escoger un modelo.' },
      system: { number: '02', title: 'El sistema', body: 'Diseña para errores, costo y confianza del usuario.' },
      production: { number: '03', title: 'Producción', body: 'Haz que la calidad se pueda medir y los errores se puedan revertir.' },
    },
    items: [
      { id: 'recurring', group: 'problem', title: 'El flujo ocurre con suficiente frecuencia para importar.', detail: 'Puedes nombrar al usuario, la frecuencia y el costo actual del problema.' },
      { id: 'judgable', group: 'problem', title: 'Una persona experta puede reconocer un buen resultado.', detail: 'La calidad se puede observar, aunque no exista una sola respuesta exacta.', critical: true },
      { id: 'advantage', group: 'problem', title: 'La IA aporta más que software determinista.', detail: 'El trabajo requiere ambigüedad, lenguaje, percepción o generación; no es un motor de reglas disfrazado.' },
      { id: 'context', group: 'system', title: 'El contexto necesario está disponible y permitido.', detail: 'Los inputs son confiables, actuales, consentidos y utilizables en el entorno final.' },
      { id: 'fallback', group: 'system', title: 'El usuario puede recuperarse cuando el modelo falla.', detail: 'Existe revisión, deshacer, corrección, escalación o una ruta sin IA.', critical: true },
      { id: 'limits', group: 'system', title: 'La interfaz comunica alcance e incertidumbre.', detail: 'El usuario sabe qué hizo el sistema, qué no hizo y cuándo debe verificar.' },
      { id: 'budget', group: 'system', title: 'La latencia y el costo tienen presupuestos claros.', detail: 'La experiencia funciona al volumen, tiempo de respuesta y economía esperados.' },
      { id: 'evals', group: 'production', title: 'Hay ejemplos representativos antes del lanzamiento.', detail: 'Puedes repetir casos buenos, malos, extremos y adversariales.', critical: true },
      { id: 'owner', group: 'production', title: 'Una persona es dueña de la calidad después del release.', detail: 'Monitoreo, feedback, incidentes y cambios de prompt o modelo tienen responsable.', critical: true },
      { id: 'rollout', group: 'production', title: 'El primer rollout es limitado y reversible.', detail: 'La cohorte, el kill switch y el umbral de éxito están definidos antes de lanzar.', critical: true },
    ] satisfies ChecklistItem[],
    remaining: (count: number) => `Falta${count === 1 ? '' : 'n'} ${count} pregunta${count === 1 ? '' : 's'} para tu recomendación.`,
    resultEyebrow: 'Tu recomendación',
    missingGate: 'Barrera crítica pendiente',
    reset: 'Reiniciar',
    copy: 'Copiar resultado',
    share: 'Compartir evaluación',
    copied: 'Resultado copiado.',
    shared: 'Menú para compartir abierto.',
    copyError: 'No se pudo copiar. Intenta desde una ventana segura del navegador.',
    cta: '¿Quieres una segunda opinión?',
    ctaBody: 'Ayudo a equipos a convertir ideas ambiguas de IA en sistemas de producto definidos y medibles.',
    ctaLink: 'Agenda una revisión de producto IA',
    outcomes: {
      foundation: { title: 'Quédate con el problema.', body: 'La capa de IA va por delante de la evidencia. Valida frecuencia, valor y qué significa “bueno” antes de prototipar.' },
      prototype: { title: 'Prototipa un flujo específico.', body: 'Hay señal suficiente para aprender, pero no para prometer confiabilidad. Mantén pequeño el grupo y el impacto de un error.' },
      gates: { title: 'Prometedor, con una barrera de producción abierta.', body: 'La puntuación es fuerte, pero un control crítico pendiente puede borrar el resto. Ciérralo antes de ampliar el acceso.' },
      pilot: { title: 'Listo para un piloto limitado.', body: 'El problema y el sistema son creíbles. Lanza a una cohorte controlada, mide fallos reales y gana el próximo rollout.' },
      production: { title: 'Listo para planificar producción.', body: 'Los fundamentos están. Define umbrales de lanzamiento, responsabilidad operativa y la evidencia necesaria para escalar.' },
    },
  },
} as const

function getOutcome(score: number, missingCritical: boolean): OutcomeId {
  if (score <= 3) return 'foundation'
  if (score <= 6) return 'prototype'
  if (missingCritical) return 'gates'
  if (score <= 8) return 'pilot'
  return 'production'
}

export default function AiReadiness({ lang = 'en' }: { lang?: Language }) {
  const copy = checklist[lang]
  const homePath = lang === 'es' ? '/es' : '/'
  const [answers, setAnswers] = useState<Answers>({})
  const [feedback, setFeedback] = useState('')
  const answeredCount = copy.items.filter((item) => answers[item.id]).length
  const score = copy.items.filter((item) => answers[item.id] === 'yes').length
  const complete = answeredCount === copy.items.length
  const missingCriticalItems = copy.items.filter((item) => item.critical && answers[item.id] !== 'yes')
  const outcome = copy.outcomes[getOutcome(score, missingCriticalItems.length > 0)]

  const resultText = useMemo(() => {
    const missing = missingCriticalItems.map((item) => `- ${item.title}`).join('\n')
    return [
      `${copy.title}: ${score}/10`,
      `${copy.resultEyebrow}: ${outcome.title}`,
      outcome.body,
      missing ? `\n${copy.missingGate}:\n${missing}` : '',
      `\nhttps://jankfaris.com${lang === 'es' ? '/es/ai-readiness' : '/ai-readiness'}?utm_source=result_share&utm_medium=referral&utm_campaign=ai_readiness`,
    ].filter(Boolean).join('\n')
  }, [copy, lang, missingCriticalItems, outcome, score])

  function setAnswer(id: string, answer: Answer) {
    setAnswers((current) => ({ ...current, [id]: answer }))
    setFeedback('')
  }

  async function copyResult() {
    if (!navigator.clipboard) {
      setFeedback(copy.copyError)
      return
    }

    try {
      await navigator.clipboard.writeText(resultText)
      setFeedback(copy.copied)
    } catch {
      setFeedback(copy.copyError)
    }
  }

  async function shareResult() {
    if (!navigator.share) {
      await copyResult()
      return
    }

    try {
      await navigator.share({
        title: copy.title,
        text: `${score}/10 · ${outcome.title}`,
        url: `https://jankfaris.com${lang === 'es' ? '/es/ai-readiness' : '/ai-readiness'}?utm_source=native_share&utm_medium=referral&utm_campaign=ai_readiness`,
      })
      setFeedback(copy.shared)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setFeedback(copy.copyError)
    }
  }

  return (
    <div className="app readiness-page">
      <main className="readiness-shell">
        <header className="readiness-hero">
          <div>
            <Link to={homePath} className="back-link">{copy.back}</Link>
            <span className="readiness-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p className="readiness-lede">{copy.lede}</p>
          </div>
          <div className="readiness-proof" aria-label={copy.proof.join(', ')}>
            {copy.proof.map((item, index) => (
              <span key={item}><strong>{index === 2 ? '0' : index === 1 ? '3' : '10'}</strong>{item.replace(/^\d+\s/, '')}</span>
            ))}
          </div>
        </header>

        <section className="readiness-intro">
          <span className="readiness-intro-index">00</span>
          <div>
            <h2>{copy.introTitle}</h2>
            <p>{copy.introBody}</p>
          </div>
        </section>

        <div className="readiness-layout">
          <aside className="readiness-rail">
            <div className="readiness-score-card">
              <span>{copy.scoreLabel}</span>
              <strong>{score}<small>/10</small></strong>
              <p>{answeredCount}/10 {copy.answered}</p>
              <div className="readiness-progress" aria-hidden="true">
                <span style={{ transform: `scaleX(${answeredCount / 10})` }} />
              </div>
            </div>
            <p className="readiness-privacy">{copy.privacy}</p>
          </aside>

          <div className="readiness-questions">
            {(Object.keys(copy.groups) as GroupId[]).map((groupId) => {
              const group = copy.groups[groupId]
              return (
                <section className="readiness-group" key={groupId} aria-labelledby={`group-${groupId}`}>
                  <header>
                    <span>{group.number}</span>
                    <div>
                      <h2 id={`group-${groupId}`}>{group.title}</h2>
                      <p>{group.body}</p>
                    </div>
                  </header>
                  <ol>
                    {copy.items.filter((item) => item.group === groupId).map((item) => (
                      <li className="readiness-question" key={item.id}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.detail}</p>
                          {item.critical && <span className="readiness-critical">{copy.missingGate}</span>}
                        </div>
                        <div className="readiness-answer" aria-label={item.title}>
                          <button
                            type="button"
                            className={answers[item.id] === 'yes' ? 'is-selected is-yes' : ''}
                            aria-pressed={answers[item.id] === 'yes'}
                            onClick={() => setAnswer(item.id, 'yes')}
                          >
                            {copy.yes}
                          </button>
                          <button
                            type="button"
                            className={answers[item.id] === 'not-yet' ? 'is-selected is-not-yet' : ''}
                            aria-pressed={answers[item.id] === 'not-yet'}
                            onClick={() => setAnswer(item.id, 'not-yet')}
                          >
                            {copy.notYet}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )
            })}

            {!complete ? (
              <div className="readiness-pending" aria-live="polite">
                <span>{String(10 - answeredCount).padStart(2, '0')}</span>
                <p>{copy.remaining(10 - answeredCount)}</p>
              </div>
            ) : (
              <section className="readiness-result" aria-labelledby="readiness-result-title">
                <span className="readiness-result-eyebrow">{copy.resultEyebrow}</span>
                <div className="readiness-result-score">{score}<small>/10</small></div>
                <h2 id="readiness-result-title">{outcome.title}</h2>
                <p>{outcome.body}</p>
                {missingCriticalItems.length > 0 && (
                  <div className="readiness-gates">
                    <strong>{copy.missingGate}</strong>
                    <ul>{missingCriticalItems.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
                  </div>
                )}
                <div className="readiness-result-actions">
                  <button type="button" onClick={copyResult}>{copy.copy}</button>
                  <button type="button" onClick={shareResult}>{copy.share}</button>
                  <button type="button" className="readiness-reset" onClick={() => { setAnswers({}); setFeedback('') }}>{copy.reset}</button>
                </div>
                <p className="readiness-feedback" aria-live="polite">{feedback}</p>
              </section>
            )}

            <section className="readiness-cta">
              <div>
                <span>{copy.cta}</span>
                <h2>{copy.ctaBody}</h2>
              </div>
              <a href={`mailto:jankarlo.faris@outlook.com?subject=${encodeURIComponent(lang === 'es' ? 'Revisión de producto IA' : 'AI product readiness review')}`}>
                {copy.ctaLink} <span aria-hidden="true">↗</span>
              </a>
            </section>
          </div>
        </div>
      </main>

      <footer className="footer readiness-footer">
        <Link to={homePath} className="foot-mark">
          <JFMark size={20} />
          <span>· 2026</span>
        </Link>
        <span className="foot-text">
          <span>San Juan, PR</span>
          <span>·</span>
          <a href={lang === 'es' ? '/ai-readiness' : '/es/ai-readiness'}>{lang === 'es' ? 'English' : 'Español'}</a>
        </span>
      </footer>
    </div>
  )
}
