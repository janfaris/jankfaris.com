import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { formatNoteNumber, posts } from './posts'
import { JFMark } from './JFMark.tsx'

export default function Writing() {
  return (
    <div className="app">
      <div className="container">
        <header className="post-hero">
          <Link to="/" className="back-link">← Back to home</Link>
          <h1 className="post-display">Ship Notes.</h1>
          <p className="post-lede">
            Numbered field notes from building AI products, developer tools, and Spanish-first software in production.
          </p>
          <Link to="/ai-readiness?utm_source=ship_notes&utm_medium=owned&utm_campaign=ai_readiness" className="post-resource-link">
            Score your AI product idea <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <section className="section" style={{ paddingTop: 0, borderBottom: 'none' }}>
          <div className="writing-list">
            {posts.map((p) => (
              <Link key={p.slug} to={`/writing/${p.slug}`} className="writing-row">
                <span className="writing-index">
                  <span className="writing-note-id">Ship Note {formatNoteNumber(p.noteNumber)}</span>
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
          <Link to="/" className="foot-mark">
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
