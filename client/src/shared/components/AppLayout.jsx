import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/AuthContext'
import { LogOut, LayoutDashboard, Users, UserCheck, Receipt, Scale, FileSpreadsheet, MapPin } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const allNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin_masjid', 'kasir_amil'],
    },
    {
      label: 'Muzakki',
      path: '/muzakki',
      icon: Users,
      roles: ['admin_masjid', 'kasir_amil'],
    },
    {
      label: 'Mustahik',
      path: '/mustahik',
      icon: UserCheck,
      roles: ['admin_masjid', 'kasir_amil'],
    },
    {
      label: 'Transaksi Baru',
      path: '/transaksi/baru',
      icon: Receipt,
      roles: ['admin_masjid', 'kasir_amil'],
    },
    {
      label: 'Distribusi',
      path: '/distribusi',
      icon: Scale,
      roles: ['admin_masjid'],
    },
    {
      label: 'Laporan',
      path: '/laporan',
      icon: FileSpreadsheet,
      roles: ['admin_masjid'],
    },
    {
      label: 'Demografi per RT',
      path: '/demografi',
      icon: MapPin,
      roles: ['admin_masjid'],
    },
  ]

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role))

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 text-slate-900">
      {/* Premium Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Branding */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-500/10">
                ZI
              </span>
              <div className="hidden sm:block">
                <span className="block text-sm font-semibold tracking-tight text-slate-900 leading-none">
                  Zakat Al-Ikhlas
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Sistem Informasi Zakat
                </span>
              </div>
            </Link>

            {/* Navigation links (Desktop) */}
            <nav className="hidden lg:flex lg:items-center lg:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-900">
                {user?.fullName}
              </span>
              <Badge
                variant="outline"
                className={`mt-0.5 border-none px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider ${
                  user?.role === 'admin_masjid'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {user?.role === 'admin_masjid' ? 'Admin' : 'Amil'}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title="Keluar Aplikasi"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex border-t border-slate-100 bg-white px-2 py-1 lg:hidden overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-medium transition-all duration-200 min-w-[70px] ${
                  isActive
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
