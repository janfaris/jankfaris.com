import './index.css'
import './App.css'

const projects = [
  {
    name: 'Wandr',
    description: 'An AI travel planner',
    link: 'https://wandrtravelai.com',
    tech: ['React', 'TypeScript', 'Supabase', 'Gemini'],
  },
  {
    name: 'Janga',
    description: 'Find where to hang out',
    link: 'https://apps.apple.com/us/app/janga/id6744530407',
    tech: ['Expo', 'React Native', 'Supabase'],
  },
  {
    name: 'Blok',
    description: 'AI condo management for Puerto Rico',
    link: 'https://www.blokpr.co',
    tech: ['React', 'Supabase', 'WhatsApp API', 'Twilio'],
  },
  {
    name: 'UPRConnect',
    description: 'A student-centered platform',
    link: null,
    tech: ['React', 'Node.js', 'AI/ML'],
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
  { 
    label: 'LinkedIn', 
    url: 'https://linkedin.com/in/jan-faris-garcia',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  },
  { 
    label: 'GitHub', 
    url: 'https://github.com/janfaris',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )
  },
  { 
    label: 'X', 
    url: 'https://twitter.com/jankfaris',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  { 
    label: 'Email', 
    url: 'mailto:jankfaris@gmail.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    )
  },
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
                className="link-item project-item"
              >
                <div className="project-info">
                  <span className="link-name">{project.name}</span>
                  <span className="link-description">{project.description}</span>
                  <div className="tech-badges">
                    {project.tech.map((tech) => (
                      <span key={tech} className="tech-badge">{tech}</span>
                    ))}
                  </div>
                </div>
                <span className="link-arrow">→</span>
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
          <div className="social-grid">
            {links.map((link) => (
              <a 
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                {link.icon}
                <span>{link.label}</span>
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
