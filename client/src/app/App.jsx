import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<div className="p-8 text-center">Halaman Login</div>} />
      <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard</div>} />
    </Routes>
  )
}

export default App
