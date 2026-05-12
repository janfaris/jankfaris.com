import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Writing from './Writing.tsx'
import Post from './Post.tsx'
import WritingEs from './WritingEs.tsx'
import PostEs from './PostEs.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App lang="en" />} />
        <Route path="/es" element={<App lang="es" />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<Post />} />
        <Route path="/es/writing" element={<WritingEs />} />
        <Route path="/es/writing/:slug" element={<PostEs />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
