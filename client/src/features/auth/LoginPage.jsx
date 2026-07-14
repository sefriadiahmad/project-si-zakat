import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, LogIn, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@shared/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/card'
import { Input } from '@shared/components/input'
import { Label } from '@shared/components/label'
import { useAuth } from './AuthContext'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi').max(50, 'Username maksimal 50 karakter'),
  password: z.string().min(1, 'Password wajib diisi').max(50, 'Password maksimal 50 karakter'),
})

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(values) {
    setApiError('')

    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (error) {
      setApiError(error.response?.data?.message || 'Username atau password salah')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 safe-area-top">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl px-4 py-6 sm:py-8 sm:px-6 lg:py-0 lg:px-8">
        {/* Mobile: Kembali button di atas */}
        <div className="flex w-full flex-col items-center justify-center gap-4 sm:gap-6 lg:flex-row lg:gap-8">
          {/* Desktop: Teks di kiri, Mobile: Teks disembunyikan di sini */}
          <div className="hidden lg:block lg:w-1/2">
            <p className="mb-3 text-sm font-medium text-emerald-700">Sistem Informasi Zakat</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-950">
              Operasional zakat masjid dalam satu ruang kerja yang tertib.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Masuk untuk mengelola data muzakki, mustahik, transaksi, distribusi, dan laporan sesuai peran akun.
            </p>
          </div>

          {/* Form Login Card */}
          <div className="flex w-full flex-col gap-4 lg:w-[420px]">
            {/* Mobile: Kembali button */}
            <div className="w-full sm:w-[420px]">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Kembali ke Beranda
              </Link>
            </div>

            <Card className="w-full sm:w-[420px] rounded-lg border-slate-200 shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Masuk</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gunakan akun Admin Masjid atau Kasir Amil.</CardDescription>
              </CardHeader>
            <CardContent>
              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="username"
                      autoComplete="username"
                      maxLength={50}
                      className="pl-9 h-10 sm:h-11"
                      aria-invalid={Boolean(errors.username)}
                      {...register('username')}
                    />
                  </div>
                  {errors.username ? (
                    <p className="text-xs sm:text-sm text-red-600">{errors.username.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      maxLength={50}
                      className="pl-9 pr-10 h-10 sm:h-11"
                      aria-invalid={Boolean(errors.password)}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs sm:text-sm text-red-600">{errors.password.message}</p>
                  ) : null}
                </div>

                {apiError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                    {apiError}
                  </div>
                ) : null}

                <Button type="submit" className="w-full h-10 sm:h-11" disabled={isSubmitting}>
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>
            </CardContent>
          </Card>

            {/* Mobile: Teks di bawah card */}
            <div className="lg:hidden text-center mt-4 sm:mt-6 px-2">
              <p className="mb-2 text-xs sm:text-sm font-medium text-emerald-700">Sistem Informasi Zakat</p>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Operasional zakat masjid dalam satu ruang kerja yang tertib.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Masuk untuk mengelola data muzakki, mustahik, transaksi, distribusi, dan laporan sesuai peran akun.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
