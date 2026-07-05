import { Routes, Route, Navigate } from 'react-router-dom'
import AdminOnlyPlaceholder from '@features/auth/AdminOnlyPlaceholder'
import LoginPage from '@features/auth/LoginPage'
import ProtectedRoute from '@features/auth/ProtectedRoute'
import DashboardPage from '@features/dashboard/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={['admin_masjid', 'kasir_amil']} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin_masjid']} />}>
        <Route path="/laporan" element={<AdminOnlyPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
