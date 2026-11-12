import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// Ukoresheje "page" aho kuba "pages" kuko ariko folder yawe yitwa
import AdminLogin from './page/admin'
import AdminDashboard from './page/admin.dashboard'
import AdminMoviesManager from './page/admin.movies'
import AdminSeriesManager from './page/admin.series'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/movies" element={<AdminMoviesManager />} />
        <Route path="/admin/series" element={<AdminSeriesManager />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)