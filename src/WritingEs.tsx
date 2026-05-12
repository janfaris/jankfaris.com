import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { postsEs } from './posts.es'
import { JFMark } from './JFMark.tsx'

export default function WritingEs() {
  return (
    <div className="app">
      <div className="container">
        <header className="post-hero">
          <Link to="/es" className="back-link">← Volver al inicio</Link>
          <h1 className="post-display">Ensayos.</h1>
          <p className="post-lede">
            Notas sobre construir productos de IA, lanzar desde Puerto Rico, y lo que aprendo en el camino.
          </p>
        </header>

        <section className="section" style={{ paddingTop: 0, borderBottom: 'none' }}>
          <div className="writing-list">
            {postsEs.map((p) => (
              <Link key={p.slug} to={`/es/writing/${p.slug}`} className="writing-row">
                <span className="writing-date">{p.date}</span>
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
