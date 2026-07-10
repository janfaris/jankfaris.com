import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'
import App from './App.tsx'
import Writing from './Writing.tsx'
import Post from './Post.tsx'
import WritingEs from './WritingEs.tsx'
import PostEs from './PostEs.tsx'
import Resume from './Resume.tsx'

const storedTheme = localStorage.getItem('theme')
document.documentElement.classList.toggle('light', storedTheme !== 'dark')

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App lang="en" />} />
        <Route path="/es" element={<App lang="es" />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<Post />} />
        <Route path="/es/writing" element={<WritingEs />} />
        <Route path="/es/writing/:slug" element={<PostEs />} />
        <Route path="/resume" element={<Resume lang="en" />} />
        <Route path="/es/resume" element={<Resume lang="es" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
