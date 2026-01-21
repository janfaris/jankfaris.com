import './index.css'
import './App.css'

const experiences = [
  {
    company: 'Microsoft',
    role: 'Software Engineer II',
    period: 'Jul 2025 - Present',
    description: "Front-End Software Engineer on Microsoft's Central Fraud and Abuse Risk (CFAR) team, building solutions to combat fraud and service abuse across the Microsoft ecosystem.",
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    current: true,
  },
  {
    company: 'Xtillion',
    role: 'Associate Engineer',
    period: 'Jan 2024 - Jul 2025',
    description: 'Led data migration from SQL Server to Snowflake. Redesigned reporting infrastructure with Retool. Implemented DevSecOps best practices.',
    logo: 'https://media.licdn.com/dms/image/v2/C4E0BAQG6jLNl7hXqFQ/company-logo_100_100/company-logo_100_100/0/1630628186847/xtillion_logo',
  },
  {
    company: 'Pratt & Whitney',
    role: 'Co-Op Software Engineer',
    period: 'Aug 2021 - Aug 2023',
    description: 'Contributed to military digital transformation for the Joint Strike Fighter. Built CI/CD pipelines resulting in 90% build time reduction.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Pratt_%26_Whitney_logo.svg/1280px-Pratt_%26_Whitney_logo.svg.png',
  },
];

const projects = [
  {
    name: 'Wandr',
    description: 'AI-powered travel planner that creates personalized itineraries in seconds. Real-time collaboration, smart packing lists, and the Compass feature for on-the-fly adjustments.',
    tech: ['React', 'TypeScript', 'Supabase', 'Gemini AI'],
    link: 'https://wandrtravelai.com',
    github: 'https://github.com/jankfaris/wandr',
    featured: true,
  },
  {
    name: 'UPRConnect',
    description: 'Student-centered platform for University of Puerto Rico with AI-powered assistance and OCR for streamlined course management.',
    tech: ['React', 'Node.js', 'AI/ML', 'OCR'],
    link: null,
    github: null,
  },
];

const skills = [
  { category: 'Frontend', items: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'SQL', 'C'] },
  { category: 'Cloud & Data', items: ['Azure', 'AWS', 'Snowflake', 'dbt Cloud'] },
  { category: 'Tools', items: ['Git', 'Docker', 'Airflow', 'Retool'] },
];

function App() {
  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav glass">
        <div className="container nav-content">
          <a href="#" className="nav-logo">
            <span className="gradient-text">JF</span>
          </a>
          <div className="nav-links">
            <a href="#about" className="link-underline">About</a>
            <a href="#experience" className="link-underline">Experience</a>
            <a href="#projects" className="link-underline">Projects</a>
            <a href="#contact" className="nav-cta">Get in Touch</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero section">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-status">
              <span className="status-dot"></span>
              <span>Available for opportunities</span>
            </div>
            <h1 className="hero-title animate-fade-in">
              Hi, I'm <span className="gradient-text">Jan Faris</span>
            </h1>
            <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Software Engineer at <strong>Microsoft</strong>
            </p>
            <p className="hero-description animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Building secure applications for fraud prevention, AI integration, and digital transformations. 
              Passionate about creating impact through innovative solutions.
            </p>
            <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <a href="#projects" className="btn btn-primary">
                View My Work
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
              <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                LinkedIn
              </a>
              <a href="https://github.com/jankfaris" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                GitHub
              </a>
            </div>
          </div>
          <div className="hero-visual animate-float">
            <div className="hero-avatar gradient-border">
              <div className="avatar-inner">
                <span className="avatar-emoji">👨‍💻</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">
            <span className="gradient-text">About Me</span>
          </h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Front-End Software Engineer at Microsoft's Central Fraud and Abuse Risk (CFAR) team. 
                I specialize in building secure React applications for fraud prevention, data engineering, 
                AI integration, and digital transformations.
              </p>
              <p>
                With experience from Pratt & Whitney's military aerospace projects to healthcare data migrations at Xtillion, 
                I bring a unique perspective on building reliable, scalable systems that matter.
              </p>
              <p>
                When I'm not coding at Microsoft, I'm building <a href="https://wandrtravelai.com" target="_blank" rel="noopener noreferrer" className="gradient-text">Wandr</a> — 
                an AI travel companion that's changing how people plan trips.
              </p>
            </div>
            <div className="skills-grid">
              {skills.map((skillGroup) => (
                <div key={skillGroup.category} className="skill-card glass hover-lift">
                  <h3>{skillGroup.category}</h3>
                  <div className="skill-tags">
                    {skillGroup.items.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="section">
        <div className="container">
          <h2 className="section-title">
            <span className="gradient-text">Experience</span>
          </h2>
          <div className="timeline">
            {experiences.map((exp, index) => (
              <div key={index} className={`timeline-item glass hover-lift ${exp.current ? 'current' : ''}`}>
                <div className="timeline-header">
                  <img src={exp.logo} alt={exp.company} className="company-logo" />
                  <div className="timeline-info">
                    <h3>{exp.role}</h3>
                    <p className="company-name">{exp.company}</p>
                    <p className="period">{exp.period}</p>
                  </div>
                  {exp.current && <span className="current-badge">Current</span>}
                </div>
                <p className="timeline-description">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="section">
        <div className="container">
          <h2 className="section-title">
            <span className="gradient-text">Featured Projects</span>
          </h2>
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.name} className={`project-card glass hover-lift ${project.featured ? 'featured gradient-border' : ''}`}>
                <div className="project-header">
                  <h3>{project.name}</h3>
                  {project.featured && <span className="featured-badge">Featured</span>}
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-tech">
                  {project.tech.map((tech) => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                </div>
                <div className="project-links">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      Live Demo
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section">
        <div className="container contact-container">
          <h2 className="section-title">
            <span className="gradient-text">Let's Connect</span>
          </h2>
          <p className="contact-subtitle">
            I'm always open to discussing new opportunities, interesting projects, or just having a chat about tech.
          </p>
          <div className="contact-links">
            <a href="mailto:jankfaris@gmail.com" className="contact-card glass hover-lift">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>jankfaris@gmail.com</span>
            </a>
            <a href="https://linkedin.com/in/jan-faris-garcia" target="_blank" rel="noopener noreferrer" className="contact-card glass hover-lift">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/jankfaris" target="_blank" rel="noopener noreferrer" className="contact-card glass hover-lift">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <span>GitHub</span>
            </a>
            <a href="https://twitter.com/jankfaris" target="_blank" rel="noopener noreferrer" className="contact-card glass hover-lift">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
              <span>@jankfaris</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <p>© 2026 Jan Faris. Built with React & TypeScript.</p>
          <p className="footer-location">📍 Puerto Rico</p>
        </div>
      </footer>
    </div>
  )
}

export default App
