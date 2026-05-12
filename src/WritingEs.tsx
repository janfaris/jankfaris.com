import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { postsEs } from './posts.es'
import { JFMark } from './JFMark.tsx'

export default function WritingEs() {
  return (
    <div className="app">
      <header className="hero container post-hero">
        <Link to="/es" className="back-link">← Volver al inicio</Link>
        <h1 className="display post-display">Escritos</h1>
        <p className="lede">
          Notas sobre construir productos de AI, embarcar desde Puerto Rico, y lo que aprendo en el proceso.
        </p>
      </header>

      <hr className="rule container-rule" />

      <section className="section container">
        <div className="list">
          {postsEs.map((p) => (
            <Link key={p.slug} to={`/es/writing/${p.slug}`} className="list-row">
              <span className="row-date">{p.date}</span>
              <div className="row-body">
                <h4 className="row-title">{p.title}</h4>
                <p className="row-desc">{p.description}</p>
                <span className="row-readtime">{p.readTime} de lectura</span>
              </div>
              <span className="row-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="footer container">
        <Link to="/es" className="foot-mark"><JFMark size={22} /></Link>
        <span className="foot-text">Hecho en Puerto Rico · © 2026 Jan Faris</span>
      </footer>
    </div>
  )
}
