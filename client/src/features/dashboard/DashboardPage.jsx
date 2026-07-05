import { LogOut } from 'lucide-react'
import { Button } from '@shared/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/card'
import { ROLE_LABELS } from '@shared/constants'
import { useAuth } from '@features/auth/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Sistem Informasi Zakat</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </header>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">Selamat datang, {user?.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Peran akun: {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
