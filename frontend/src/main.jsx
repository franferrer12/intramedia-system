import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/jobs-design-system.css'  // 🍎 Jobs-Style UX Design System (ANTES de index.css)
import './index.css'  // Tailwind después para no sobrescribir Jobs-Style

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
