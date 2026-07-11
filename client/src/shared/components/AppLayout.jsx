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

const SIDEBAR_WIDTH = 'w-64'

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
    <div className="flex h-full flex-col w-70">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-3" onClick={closeSidebar}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-500/10">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-sm font-semibold tracking-tight text-slate-900 leading-none">
              Masjid Al-Ikhlas
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              SIKAT
            </span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeSidebar}
          className="lg:hidden h-8 w-8 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        <div className="mb-2 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.fullName}
              </p>
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
          </div>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="w-full justify-start gap-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900">
    {/* Desktop Sidebar (lg+) */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:${SIDEBAR_WIDTH} lg:bg-white lg:border-r lg:border-slate-200 lg:shadow-sm lg:z-30`}>
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
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-${SIDEBAR_WIDTH} flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <NavContent />
      </aside>

      {/* Mobile Header (Top Bar) */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-10 w-10 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Sistem Informasi Zakat</span>
        </Link>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 lg:pt-0 lg:ml-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
