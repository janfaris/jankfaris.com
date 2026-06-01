import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Writing from './Writing.tsx'
import Post from './Post.tsx'
import { ScrollToTop } from './ScrollToTop.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App lang="en" />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<Post />} />
        <Route path="/es" element={<Navigate to="/" replace />} />
        <Route path="/es/writing" element={<Navigate to="/writing" replace />} />
        <Route path="/es/writing/:slug" element={<Navigate to="/writing" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
