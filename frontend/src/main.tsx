import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SharedViewer from './pages/SharedViewer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 主编辑工作台 */}
        <Route path="/" element={<App />} />
        {/* AI Agent 共享图表只读页 */}
        <Route path="/share/:uuid" element={<SharedViewer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
