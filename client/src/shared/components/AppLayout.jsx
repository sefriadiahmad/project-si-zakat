/* eslint-disable react-hooks/static-components */
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/AuthContext'
import {
  LogOut,
  LayoutDashboard,
  Users,
  UserCheck,
  Receipt,
  Scale,
  FileSpreadsheet,
  MapPin,
  Menu,
  X,
  Activity,
} from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  const NavContent = () => (
    <div className="flex h-full flex-col w-full safe-area-top safe-area-bottom">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2 sm:gap-3" onClick={closeSidebar}>
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-500/10">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <span className="block text-xs sm:text-sm font-semibold tracking-tight text-slate-900 leading-none">
              Masjid Al-Ikhlas
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
              SIKAT
            </span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeSidebar}
          className="h-8 w-8 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0.5 sm:space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-2 sm:gap-3 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-200 p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <div className="mb-1.5 sm:mb-2 rounded-lg bg-slate-50 p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-semibold">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {user?.fullName}
              </p>
              <Badge
                variant="outline"
                className={`mt-0.5 border-none px-1 py-0 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
                  user?.role === 'admin_masjid'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {user?.role === 'admin_masjid' ? 'Admin' : 'Amil'}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="w-full justify-center gap-1.5 sm:gap-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs sm:text-sm py-1.5 sm:py-2"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Keluar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900">
    {/* Desktop Sidebar (lg+) */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-white lg:border-r lg:border-slate-200 lg:shadow-sm lg:z-30`}>
        <NavContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-80 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <NavContent />
      </aside>

      {/* Mobile Header (Top Bar) - Hidden on Desktop */}
      <header className="fixed top-0 left-0 right-0 z-30 lg:hidden flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-4 safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 sm:h-10 sm:w-10 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-semibold border border-emerald-300">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-14 sm:pt-16 lg:pt-0 lg:ml-64 overflow-hidden">
        <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
