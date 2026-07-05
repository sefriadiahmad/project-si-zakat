import { Routes, Route, Navigate } from 'react-router-dom'
import AdminOnlyPlaceholder from '@features/auth/AdminOnlyPlaceholder'
import LoginPage from '@features/auth/LoginPage'
import ProtectedRoute from '@features/auth/ProtectedRoute'
import DashboardPage from '@features/dashboard/DashboardPage'
import AppLayout from '@shared/components/AppLayout'
import MuzakkiListPage from '@features/muzakki/MuzakkiListPage'
import MuzakkiFormPage from '@features/muzakki/MuzakkiFormPage'
import MustahikListPage from '@features/mustahik/MustahikListPage'
import MustahikFormPage from '@features/mustahik/MustahikFormPage'
import VerifikasiPage from '@features/mustahik/VerifikasiPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes for Admin & Amil */}
      <Route element={<ProtectedRoute allowedRoles={['admin_masjid', 'kasir_amil']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/muzakki" element={<MuzakkiListPage />} />
          <Route path="/muzakki/baru" element={<MuzakkiFormPage />} />
          <Route path="/muzakki/:id/edit" element={<MuzakkiFormPage />} />
          <Route path="/mustahik" element={<MustahikListPage />} />
          <Route path="/mustahik/baru" element={<MustahikFormPage />} />
        </Route>
      </Route>

      {/* Admin-only Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin_masjid']} />}>
        <Route element={<AppLayout />}>
          <Route path="/mustahik/verifikasi" element={<VerifikasiPage />} />
          <Route path="/laporan" element={<AdminOnlyPlaceholder />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
