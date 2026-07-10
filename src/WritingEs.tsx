import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { formatNoteNumber } from './posts'
import { postsEs } from './posts.es'
import { JFMark } from './JFMark.tsx'

export default function WritingEs() {
  return (
    <div className="app">
      <div className="container">
        <header className="post-hero">
          <Link to="/es" className="back-link">← Volver al inicio</Link>
          <h1 className="post-display">Ship Notes.</h1>
          <p className="post-lede">
            Notas numeradas desde producción sobre productos de IA, herramientas para developers y software en español.
          </p>
          <Link to="/es/ai-readiness?utm_source=ship_notes&utm_medium=owned&utm_campaign=ai_readiness" className="post-resource-link">
            Evalúa tu idea de producto IA <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <section className="section" style={{ paddingTop: 0, borderBottom: 'none' }}>
          <div className="writing-list">
            {postsEs.map((p) => (
              <Link key={p.slug} to={`/es/writing/${p.slug}`} className="writing-row">
                <span className="writing-index">
                  <span className="writing-note-id">Nota {formatNoteNumber(p.noteNumber)}</span>
                  <span className="writing-date">{p.date}</span>
                </span>
                <div>
                  <div className="writing-title">{p.title}</div>
                  <p className="writing-desc">{p.description}</p>
                </div>
                <span className="writing-time">{p.readTime}</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="footer">
          <Link to="/es" className="foot-mark">
            <JFMark size={20} />
            <span>· 2026</span>
          </Link>
          <span className="foot-text">
            <span>San Juan, PR</span>
            <span>·</span>
            <a href="mailto:jankarlo.faris@outlook.com">jankarlo.faris@outlook.com</a>
            <span>·</span>
            <a href="https://github.com/janfaris" target="_blank" rel="noreferrer">GitHub</a>
          </span>
        </footer>
      </div>
    </div>
  )
}
