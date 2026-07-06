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
import FunnelFormPage from '@features/transaksi/FunnelForm'
import SummaryPage from '@features/transaksi/SummaryPage'
import DistribusiPage from '@features/distribusi/DistribusiPage'
import LaporanPage from '@features/laporan/LaporanPage'
import DemografiPage from '@features/demografi/DemografiPage'
import RTDetailPage from '@features/demografi/RTDetailPage'
import LandingPage from '@features/public/LandingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
          <Route path="/transaksi/baru" element={<FunnelFormPage />} />
          <Route path="/transaksi/:id" element={<SummaryPage />} />
        </Route>
      </Route>

      {/* Admin-only Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin_masjid']} />}>
        <Route element={<AppLayout />}>
          <Route path="/mustahik/verifikasi" element={<VerifikasiPage />} />
          <Route path="/distribusi" element={<DistribusiPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
          <Route path="/demografi" element={<DemografiPage />} />
          <Route path="/demografi/:rtId" element={<RTDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
