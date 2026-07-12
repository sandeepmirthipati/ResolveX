import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import {
  FileText, CheckCircle2, AlertCircle, Users, TrendingUp,
  ChevronRight, Eye, XCircle, UserCheck
} from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { complaintsApi } from '@/services/apiClient'
import { formatDate, cn } from '@/utils'

const CHART_COLORS = ['#C86B3C', '#7A9E7E', '#D4820A', '#4A7FA5', '#C0392B']
const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }

// Chart data derived from live complaints
function buildMonthlyData(complaints) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const year = new Date().getFullYear()
  return months.slice(0, new Date().getMonth() + 1).map((month, idx) => {
    const monthComplaints = complaints.filter(c => {
      const d = new Date(c.created_at)
      return d.getFullYear() === year && d.getMonth() === idx
    })
    return {
      month,
      complaints: monthComplaints.length,
      resolved: monthComplaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
      pending: monthComplaints.filter(c => ['pending', 'assigned'].includes(c.status)).length,
    }
  })
}

function buildCategoryData(complaints) {
  const counts = {}
  complaints.forEach(c => {
    const name = c.category_name || 'Others'
    counts[name] = (counts[name] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function MiniBarChart({ data }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-theme">Complaints by Month</h3>
        <span className="text-xs text-muted-theme">2026</span>
      </div>
      <div className="w-full overflow-x-auto">
        <BarChart width={340} height={220} data={data} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="complaints" fill="#C86B3C" radius={[6, 6, 0, 0]} />
          <Bar dataKey="resolved" fill="#7A9E7E" radius={[6, 6, 0, 0]} />
        </BarChart>
      </div>
    </Card>
  )
}

function MiniPieChart({ data }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-theme">By Category</h3>
      </div>
      <div className="flex justify-center">
        <PieChart width={260} height={220}>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </div>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-xs text-muted-theme">{c.name} ({c.value}%)</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MiniLineChart({ data }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-theme">Resolution Trend</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <LineChart width={340} height={220} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="resolved" stroke="#7A9E7E" strokeWidth={2.5} dot={{ r: 4, fill: '#7A9E7E' }} />
          <Line type="monotone" dataKey="pending" stroke="#D4820A" strokeWidth={2} dot={{ r: 3, fill: '#D4820A' }} strokeDasharray="5 5" />
        </LineChart>
      </div>
    </Card>
  )
}

const ACTIVITY_ICONS = {
  resolved: { icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary-light' },
  new: { icon: FileText, color: 'text-primary', bg: 'bg-primary-light' },
  escalated: { icon: AlertCircle, color: 'text-danger-theme', bg: 'bg-red-50 dark:bg-red-950/20' },
  update: { icon: TrendingUp, color: 'text-info-theme', bg: 'bg-blue-50 dark:bg-blue-950/20' },
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({
    total: 0, pending: 0, inProgress: 0, resolvedToday: 0, closed: 0, customers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const allComplaints = await complaintsApi.list()
        setComplaints(allComplaints)
        const today = new Date().toISOString().split('T')[0]
        setStats({
          total: allComplaints.length,
          pending: allComplaints.filter(c => ['pending', 'assigned'].includes(c.status)).length,
          inProgress: allComplaints.filter(c => c.status === 'in-progress').length,
          resolvedToday: allComplaints.filter(c =>
            c.status === 'resolved' && c.updated_at?.startsWith(today)
          ).length,
          closed: allComplaints.filter(c => c.status === 'closed').length,
          customers: new Set(allComplaints.map(c => c.user_id)).size,
        })
      } catch {
        setComplaints([])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const STATS = [
    { title: "Today's Complaints", value: loading ? '—' : complaints.filter(c => c.created_at?.startsWith(new Date().toISOString().split('T')[0])).length.toString(), icon: FileText, iconBg: 'bg-primary-light', iconColor: 'text-primary' },
    { title: 'Pending Review', value: loading ? '—' : stats.pending.toString(), icon: AlertCircle, iconBg: 'bg-amber-50 dark:bg-amber-950/20', iconColor: 'text-warning-theme', change: `${stats.pending} need attention`, changeType: 'neutral' },
    { title: 'In Progress', value: loading ? '—' : stats.inProgress.toString(), icon: UserCheck, iconBg: 'bg-blue-50 dark:bg-blue-950/20', iconColor: 'text-info-theme', description: 'Currently being handled' },
    { title: 'Resolved Today', value: loading ? '—' : stats.resolvedToday.toString(), icon: CheckCircle2, iconBg: 'bg-secondary-light', iconColor: 'text-secondary', change: 'Resolved today', changeType: 'up' },
    { title: 'Closed', value: loading ? '—' : stats.closed.toString(), icon: XCircle, iconBg: 'bg-bg-alt', iconColor: 'text-muted-theme', description: 'Total cases closed' },
    { title: 'Active Customers', value: loading ? '—' : stats.customers.toString(), icon: Users, iconBg: 'bg-purple-50 dark:bg-purple-950/20', iconColor: 'text-purple-600 dark:text-purple-400' },
  ]

  const monthlyData = buildMonthlyData(complaints)
  const categoryData = buildCategoryData(complaints)
  const recentComplaints = complaints.slice(0, 5)

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-theme">Admin Dashboard</h1>
          <p className="text-muted-theme text-sm mt-1">Overview of complaints and system performance.</p>
        </div>
        <Link to="/admin/complaints">
          <Button leftIcon={FileText}>View All Complaints</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MiniBarChart data={monthlyData} />
        <MiniPieChart data={categoryData} />
        <MiniLineChart data={monthlyData} />
      </div>

      {/* Recent complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border-theme">
            <h3 className="text-sm font-semibold text-text-theme flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Recent Complaints
            </h3>
            <Link to="/admin/complaints" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-theme">No complaints yet</div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-theme bg-bg-alt">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">ID</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">Customer</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">Category</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">Priority</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-theme uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme">
                    {recentComplaints.map(c => (
                      <tr key={c.id} className="hover:bg-bg-alt/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{c.complaint_number || c.id}</td>
                        <td className="px-5 py-3 text-text-theme text-xs">{c.customer_name || '—'}</td>
                        <td className="px-5 py-3 text-muted-theme text-xs">{c.category_name || '—'}</td>
                        <td className="px-5 py-3"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3">
                          <Link to={`/admin/complaints/${c.id}`}><Button variant="ghost" size="xs" leftIcon={Eye}>View</Button></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile view */}
              <div className="sm:hidden divide-y divide-border-theme">
                {recentComplaints.map(c => (
                  <Link key={c.id} to={`/admin/complaints/${c.id}`} className="block px-4 py-3 hover:bg-bg-alt transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-primary">{c.complaint_number || c.id}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-text-theme truncate">{c.customer_name || '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-theme">{c.category_name || '—'}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Recent activity (DB-driven once activity log table exists) */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border-theme">
            <h3 className="text-sm font-semibold text-text-theme flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Recent Activity
            </h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-theme">No activity yet</div>
          ) : (
            <div className="divide-y divide-border-theme">
              {complaints.slice(0, 5).map(c => {
                const isResolved = ['resolved', 'closed'].includes(c.status)
                const type = isResolved ? 'resolved' : c.status === 'in-progress' ? 'update' : 'new'
                const cfg = ACTIVITY_ICONS[type] || ACTIVITY_ICONS.update
                const Icon = cfg.icon
                return (
                  <div key={c.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-theme leading-relaxed truncate">{c.title}</p>
                      <p className="text-[10px] text-subtle-theme mt-0.5">{formatDate(c.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
