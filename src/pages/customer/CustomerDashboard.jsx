import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText, Clock, CheckCircle2, AlertCircle, PlusCircle,
  Search, History, ArrowRight, TrendingUp, MessageSquare,
  ChevronRight, Inbox
} from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { complaintsApi } from '@/services/apiClient'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils'

const QUICK_ACTIONS = [
  {
    to: '/dashboard/raise',
    icon: PlusCircle,
    label: 'Raise Complaint',
    desc: 'Submit a new complaint',
    color: 'bg-primary-light border-primary-mid/30 text-primary',
    iconColor: 'text-primary',
  },
  {
    to: '/dashboard/track',
    icon: Search,
    label: 'Track Complaint',
    desc: 'Check complaint status',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/40 text-info-theme',
    iconColor: 'text-info-theme',
  },
  {
    to: '/dashboard/history',
    icon: History,
    label: 'Complaint History',
    desc: 'View all past complaints',
    color: 'bg-secondary-light border-secondary/20 text-secondary',
    iconColor: 'text-secondary',
  },
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light border border-primary-mid/20 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-text-theme mb-1">No complaints yet</h3>
      <p className="text-sm text-muted-theme mb-5">When you raise a complaint, it will appear here.</p>
      <Link to="/dashboard/raise">
        <Button size="sm" leftIcon={PlusCircle}>Raise First Complaint</Button>
      </Link>
    </div>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    async function fetchComplaints() {
      setLoading(true)
      try {
        const data = await complaintsApi.list()
        setComplaints(data)
      } catch {
        setComplaints([])
      }
      setLoading(false)
    }
    fetchComplaints()
  }, [user?.id])

  const totalComplaints = complaints.length
  const pendingCount = complaints.filter(c => ['pending', 'assigned'].includes(c.status)).length
  const inProgressCount = complaints.filter(c => c.status === 'in-progress').length
  const resolvedCount = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length

  const STATS = [
    {
      title: 'Total Complaints',
      value: loading ? '—' : totalComplaints,
      icon: FileText,
      iconBg: 'bg-primary-light',
      iconColor: 'text-primary',
      description: 'All time complaints',
    },
    {
      title: 'Pending',
      value: loading ? '—' : pendingCount,
      icon: AlertCircle,
      iconBg: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-warning-theme',
      change: pendingCount > 0 ? 'Awaiting review' : 'All reviewed',
      changeType: 'neutral',
    },
    {
      title: 'In Progress',
      value: loading ? '—' : inProgressCount,
      icon: Clock,
      iconBg: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-info-theme',
      description: 'Being handled now',
    },
    {
      title: 'Resolved',
      value: loading ? '—' : resolvedCount,
      icon: CheckCircle2,
      iconBg: 'bg-secondary-light',
      iconColor: 'text-secondary',
      change: resolvedCount > 0 && totalComplaints > 0 ? `${Math.round((resolvedCount / totalComplaints) * 100)}% resolution rate` : '',
      changeType: 'up',
    },
  ]

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const recentComplaints = complaints.slice(0, 5)

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-theme">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-muted-theme text-sm mt-1">
            Here's what's happening with your complaints today.
          </p>
        </div>
        <Link to="/dashboard/raise">
          <Button leftIcon={PlusCircle} className="hidden sm:inline-flex">
            Raise Complaint
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-theme uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc, color, iconColor }) => (
            <Link key={to} to={to}>
              <div className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-[var(--shadow-md)] transition-all duration-200 hover:-translate-y-0.5 ${color}`}>
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/10 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs opacity-70">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent complaints */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border-theme">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-theme">Recent Complaints</h2>
          </div>
          <Link to="/dashboard/history" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : recentComplaints.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border-theme">
            {recentComplaints.map(complaint => (
              <div
                key={complaint.id}
                onClick={() => navigate(`/dashboard/track?id=${complaint.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-bg-alt transition-colors cursor-pointer group"
              >
                {/* Complaint ID */}
                <div className="hidden sm:block">
                  <p className="text-xs font-mono font-semibold text-primary">{complaint.complaint_number || complaint.id}</p>
                  <p className="text-[10px] text-subtle-theme mt-0.5">{formatDate(complaint.created_at)}</p>
                </div>

                {/* Title & category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-theme truncate group-hover:text-primary transition-colors">
                    {complaint.title}
                  </p>
                  <p className="text-xs text-muted-theme mt-0.5">{complaint.category_name || '—'}</p>
                </div>

                {/* Priority */}
                <PriorityBadge priority={complaint.priority} className="hidden md:inline-flex" />

                {/* Status */}
                <StatusBadge status={complaint.status} />

                <ChevronRight className="w-4 h-4 text-muted-theme group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Complaint Progress */}
      {complaints.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border-theme">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-theme">Complaint Progress</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {complaints.slice(0, 5).map(c => {
              const stages = ['pending', 'assigned', 'in-progress', 'resolved', 'closed']
              const idx = stages.indexOf(c.status)
              const pct = Math.max(10, ((idx + 1) / stages.length) * 100)
              const isResolved = ['resolved', 'closed'].includes(c.status)
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-theme font-medium truncate max-w-xs">{c.title}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="w-full h-1.5 bg-bg-alt rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isResolved ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
