import { Link } from 'react-router-dom'
import './index.css'
import './App.css'
import { posts } from './posts'

export default function Writing() {
  return (
    <div className="app">
      <header className="hero container post-hero">
        <Link to="/" className="back-link">← Back to home</Link>
        <h1 className="display post-display">Writing</h1>
        <p className="lede">
          Notes on building AI products, shipping in Puerto Rico, and what I learn along the way.
        </p>
      </header>

      <hr className="rule container-rule" />

      <section className="section container">
        <div className="list">
          {posts.map((p) => (
            <Link key={p.slug} to={`/writing/${p.slug}`} className="list-row">
              <span className="row-date">{p.date}</span>
              <div className="row-body">
                <h4 className="row-title">{p.title}</h4>
                <p className="row-desc">{p.description}</p>
                <span className="row-readtime">{p.readTime} read</span>
              </div>
              <span className="row-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="footer container">
        <Link to="/" className="foot-mark">JF</Link>
        <span className="foot-text">Built in Puerto Rico · © 2026 Jan Faris</span>
      </footer>
    </div>
  )
}
