import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BarChart3, Bell, Settings, LogOut,
  Menu, X, Shield, Sun, Moon, ChevronDown, Search
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabaseClient'
import { cn } from '@/utils'

const NAV_ITEMS = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/admin/complaints',     icon: FileText,        label: 'Complaints' },
  { to: '/admin/analytics',      icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/notifications',  icon: Bell,            label: 'Notifications' },
  { to: '/admin/settings',       icon: Settings,        label: 'Settings' },
]

function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const name = user?.full_name || 'Admin'
  const email = user?.email || ''
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-40 w-64 bg-[#1E1A16] flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">ResolveX</span>
              <span className="ml-1.5 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Admin</span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60"><X className="w-4 h-4" /></button>
        </div>

        {/* Admin user */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{name}</p>
              <p className="text-xs text-white/50 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Management</p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 px-3 py-3">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150 text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

function TopBar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const name = user?.full_name || 'Admin'
  const email = user?.email || ''
  const firstName = name.split(' ')[0]
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  useEffect(() => {
    async function loadPendingCount() {
      const { count, error } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'assigned'])
      if (!error && count !== null) {
        setPendingCount(count)
      }
    }
    loadPendingCount()
    
    // Set up real-time listener for changes in complaints status to keep the count updated live!
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        loadPendingCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <header className="h-14 bg-card border-b border-border-theme flex items-center gap-3 px-4 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-bg-alt text-muted-theme"><Menu className="w-5 h-5" /></button>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none" />
        <input
          type="text"
          placeholder="Search complaints, customers…"
          className="w-full h-9 pl-10 pr-4 bg-bg border border-border-theme rounded-xl text-sm text-text-theme placeholder:text-subtle-theme focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Theme */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl border border-border-theme flex items-center justify-center text-muted-theme hover:text-primary hover:border-primary/40 hover:bg-primary-light transition-all duration-200"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <Link to="/admin/complaints" className="w-9 h-9 rounded-xl border border-border-theme flex items-center justify-center text-muted-theme hover:text-primary hover:border-primary/40 hover:bg-primary-light transition-all duration-200 relative">
        <Bell className="w-4 h-4" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-theme text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </Link>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(o => !o)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-bg-alt transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#1E1A16] flex items-center justify-center text-white font-bold text-xs">{initials}</div>
          <span className="text-sm font-medium text-text-theme hidden sm:block">{firstName}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-theme transition-transform duration-200', profileOpen && 'rotate-180')} />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-11 w-48 bg-card border border-border-theme rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-border-theme">
              <p className="text-sm font-semibold text-text-theme">{name}</p>
              <p className="text-xs text-muted-theme truncate">{email}</p>
            </div>
            <div className="p-1.5">
              <NavLink to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-theme hover:bg-bg-alt transition-colors">
                <Settings className="w-3.5 h-3.5 text-muted-theme" /> Settings
              </NavLink>
            </div>
            <div className="p-1.5 border-t border-border-theme">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger-theme hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
