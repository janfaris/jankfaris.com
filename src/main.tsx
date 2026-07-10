import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Writing from './Writing.tsx'
import Post from './Post.tsx'
import WritingEs from './WritingEs.tsx'
import PostEs from './PostEs.tsx'
import Resume from './Resume.tsx'
import AiReadiness from './AiReadiness.tsx'
import { RouteMeta, ScrollToTop } from './RouteUtilities.tsx'

const storedTheme = localStorage.getItem('theme')
document.documentElement.classList.toggle('light', storedTheme !== 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App lang="en" />} />
        <Route path="/es" element={<App lang="es" />} />
        <Route path="/writing" element={
          <RouteMeta
            title="Ship Notes — Jan Faris"
            description="Numbered field notes on AI products, developer tools, and Spanish-first software from production."
          >
            <Writing />
          </RouteMeta>
        } />
        <Route path="/writing/:slug" element={<Post />} />
        <Route path="/es/writing" element={
          <RouteMeta
            title="Ship Notes — Jan Faris"
            description="Notas numeradas sobre productos de IA, herramientas para developers y software en español."
          >
            <WritingEs />
          </RouteMeta>
        } />
        <Route path="/es/writing/:slug" element={<PostEs />} />
        <Route path="/ai-readiness" element={
          <RouteMeta
            title="Should This Be AI? — Jan Faris"
            description="Answer ten production questions and get a clear recommendation: validate, prototype, pilot, or plan production."
          >
            <AiReadiness />
          </RouteMeta>
        } />
        <Route path="/es/ai-readiness" element={
          <RouteMeta
            title="¿Esto debería usar IA? — Jan Faris"
            description="Contesta diez preguntas de producción y recibe una recomendación clara: valida, prototipa, haz un piloto o planifica producción."
          >
            <AiReadiness lang="es" />
          </RouteMeta>
        } />
        <Route path="/resume" element={<Resume lang="en" />} />
        <Route path="/es/resume" element={<Resume lang="es" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
