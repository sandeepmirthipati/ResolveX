import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, User, LogOut,
  Bell, Sun, Moon, Menu, X, Shield, ChevronDown,
  PlusCircle, History, Search, HelpCircle
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabaseClient'
import { cn, formatDateTime } from '@/utils'

const NAV_ITEMS = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',          end: true },
  { to: '/dashboard/raise',   icon: PlusCircle,      label: 'Raise Complaint' },
  { to: '/dashboard/history', icon: History,         label: 'Complaint History' },
  { to: '/dashboard/track',   icon: Search,          label: 'Track Complaint' },
  { to: '/dashboard/profile', icon: User,            label: 'My Profile' },
]

function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const name = user?.full_name || 'Customer'
  const email = user?.email || ''
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full z-40 w-64 bg-sidebar border-r border-border-theme flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-theme">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-text-theme text-lg tracking-tight">ResolveX</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-bg-alt text-muted-theme transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-primary-light border border-primary-mid/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-theme truncate">{name}</p>
              <p className="text-xs text-muted-theme truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-subtle-theme uppercase tracking-wider">Main Menu</p>
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
                  : 'text-muted-theme hover:bg-bg-alt hover:text-text-theme'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-border-theme px-3 py-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-theme hover:bg-bg-alt hover:text-text-theme transition-all duration-150">
            <HelpCircle className="w-4 h-4 shrink-0" />
            Help & Support
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-theme hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 text-left"
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
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const name = user?.full_name || 'Customer'
  const email = user?.email || ''
  const firstName = name.split(' ')[0]
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  useEffect(() => {
    if (!user?.id) return
    async function loadNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(5)
      if (!error && data) {
        setNotifications(data)
      }
    }
    loadNotifications()
  }, [user?.id])

  // Count notifications sent in the last 24 hours as unread
  const unreadCount = notifications.filter(n => new Date(n.sent_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length

  return (
    <header className="h-14 bg-card border-b border-border-theme flex items-center gap-3 px-4 sticky top-0 z-20">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-bg-alt text-muted-theme transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page breadcrumb / search area */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl border border-border-theme flex items-center justify-center text-muted-theme hover:text-primary hover:border-primary/40 hover:bg-primary-light transition-all duration-200"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
          className="w-9 h-9 rounded-xl border border-border-theme flex items-center justify-center text-muted-theme hover:text-primary hover:border-primary/40 hover:bg-primary-light transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-card">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-11 w-80 bg-card border border-border-theme rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-border-theme flex items-center justify-between">
              <span className="text-sm font-semibold text-text-theme">Notifications</span>
              {unreadCount > 0 && <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>}
            </div>
            <div className="divide-y divide-border-theme max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-theme">No notifications yet.</div>
              ) : (
                notifications.map(n => {
                  const isNew = new Date(n.sent_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  return (
                    <div key={n.id} className={cn('p-3 hover:bg-bg-alt/50 transition-colors cursor-pointer flex gap-3', isNew && 'bg-primary-light/20')}>
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 opacity-80" />
                      <div>
                        <p className="text-xs text-text-theme leading-normal">{n.message}</p>
                        <p className="text-[10px] text-subtle-theme mt-1">{formatDateTime(n.sent_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile drop-down */}
      <div className="relative">
        <button
          onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-bg-alt transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
          <span className="text-sm font-medium text-text-theme hidden sm:block">{firstName}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-theme transition-transform duration-200', profileOpen && 'rotate-180')} />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-11 w-52 bg-card border border-border-theme rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-border-theme">
              <p className="text-sm font-semibold text-text-theme">{name}</p>
              <p className="text-xs text-muted-theme truncate">{email}</p>
            </div>
            <div className="p-1.5">
              <NavLink
                to="/dashboard/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-theme hover:bg-bg-alt transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted-theme" /> My Profile
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

export default function CustomerDashboardLayout() {
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
