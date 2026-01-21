import './index.css'
import './App.css'

const projects = [
  {
    name: 'Wandr',
    description: 'An AI travel planner',
    link: 'https://wandrtravelai.com',
  },
  {
    name: 'Janga',
    description: 'Find where to hang out',
    link: 'https://apps.apple.com/us/app/janga/id6744530407',
  },
  {
    name: 'Blok',
    description: 'AI condo management for Puerto Rico',
    link: 'https://www.blokpr.co',
  },
  {
    name: 'UPRConnect',
    description: 'A student-centered platform',
    link: null,
  },
]

const articles = [
  {
    title: 'How I Built the "Cursor" for Trip Planning in 30 Days',
    description: 'Tech stack, lessons, and the AI tools that made it possible',
    link: 'https://x.com/jankfaris/status/2014011668271948178',
    date: 'Jan 2026',
  },
]

const links = [
  { label: 'LinkedIn', url: 'https://linkedin.com/in/jan-faris-garcia' },
  { label: 'GitHub', url: 'https://github.com/janfaris' },
  { label: 'X / Twitter', url: 'https://twitter.com/jankfaris' },
  { label: 'Email', url: 'mailto:jankfaris@gmail.com' },
]

function App() {
  return (
    <div className="app">
      <main className="container">
        {/* Profile Section */}
        <section className="profile">
          <img 
            src="/jan-profile.jpg" 
            alt="Jan Faris" 
            className="profile-image"
          />
          <h1 className="name">Jan Faris</h1>
          <p className="title">Software Engineer @ Microsoft</p>
          <p className="bio">
            Full-time at Microsoft by day. Building cool stuff for Puerto Rico by night.
          </p>
        </section>

        {/* Projects */}
        <section className="section">
          <h2 className="section-title">Projects</h2>
          <div className="link-list">
            {projects.map((project) => (
              <a 
                key={project.name}
                href={project.link || '#'}
                target={project.link ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="link-item"
              >
                <span className="link-name">{project.name}</span>
                <span className="link-description">{project.description}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Writing */}
        <section className="section">
          <h2 className="section-title">Writing</h2>
          <div className="link-list">
            {articles.map((article) => (
              <a 
                key={article.title}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item article-item"
              >
                <div className="article-content">
                  <span className="link-name">{article.title}</span>
                  <span className="link-description">{article.description}</span>
                </div>
                <span className="article-date">{article.date}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="section">
          <h2 className="section-title">Experience</h2>
          <div className="link-list">
            <div className="link-item">
              <span className="link-name">Microsoft</span>
              <span className="link-description">Software Engineer II · 2025 - Present</span>
            </div>
            <div className="link-item">
              <span className="link-name">Xtillion</span>
              <span className="link-description">Associate Engineer · 2024 - 2025</span>
            </div>
            <div className="link-item">
              <span className="link-name">Pratt & Whitney</span>
              <span className="link-description">Co-Op Software Engineer · 2021 - 2023</span>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="section">
          <h2 className="section-title">Connect</h2>
          <div className="link-list">
            {links.map((link) => (
              <a 
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item"
              >
                <span className="link-name">{link.label}</span>
                <span className="link-arrow">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 Jan Faris</p>
        </footer>
      </main>
    </div>
  )
}

export default App
