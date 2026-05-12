import { Link, useParams } from 'react-router-dom'
import './index.css'
import './App.css'
import { getPostEs } from './posts.es'
import { JFMark } from './JFMark.tsx'

function renderMarkdown(body: string) {
  const blocks = body.split(/\n\n+/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) return <h2 key={i} className="prose-h2">{inline(block.slice(3))}</h2>
    if (block.startsWith('> ')) return <blockquote key={i} className="prose-quote">{inline(block.slice(2))}</blockquote>
    if (block.startsWith('```')) {
      const code = block.replace(/^```\w*\n?/, '').replace(/```$/, '')
      return <pre key={i} className="prose-pre"><code>{code}</code></pre>
    }
    if (/^\d+\.\s/.test(block) || block.startsWith('- ')) {
      const items = block.split('\n').filter((l) => l.trim())
      const ordered = /^\d+\.\s/.test(items[0])
      const Tag = ordered ? 'ol' : 'ul'
      return (
        <Tag key={i} className="prose-list">
          {items.map((it, j) => (<li key={j}>{inline(it.replace(/^(\d+\.\s|- )/, ''))}</li>))}
        </Tag>
      )
    }
    return <p key={i} className="prose-p">{inline(block)}</p>
  })
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIdx = 0; let m: RegExpExecArray | null; let key = 0
  while ((m = regex.exec(text))) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) parts.push(<code key={key++} className="prose-code">{tok.slice(1, -1)}</code>)
    else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>)
    lastIdx = m.index + tok.length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

export default function PostEs() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostEs(slug) : undefined

  if (!post) {
    return (
      <div className="app">
        <div className="container">
          <header className="post-hero">
            <Link to="/es/writing" className="back-link">← Volver a ensayos</Link>
            <h1 className="post-display">No encontrado.</h1>
            <p className="post-lede">Ese ensayo aún no existe.</p>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <article className="post container">
        <Link to="/es/writing" className="back-link">← Todos los ensayos</Link>
        <div className="post-meta">
          <span>{post.date}</span>
          <span className="post-meta-dot">·</span>
          <span>{post.readTime} lectura</span>
        </div>
        <h1 className="post-display">{post.title}</h1>
        <p className="post-lede">{post.description}</p>
        <hr className="post-rule" />
        <div className="prose">{renderMarkdown(post.body)}</div>
      </article>

      <footer className="footer container">
        <Link to="/es" className="foot-mark">
          <JFMark size={20} />
          <span>· 2026</span>
        </Link>
        <span className="foot-text">
          <span>San Juan, PR</span>
          <span>·</span>
          <a href="mailto:jankarlo.faris@outlook.com">jankarlo.faris@outlook.com</a>
        </span>
      </footer>
    </div>
  )
}
