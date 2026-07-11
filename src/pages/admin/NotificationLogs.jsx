import { useState, useEffect, useMemo } from 'react'
import {
  Search, ChevronLeft, ChevronRight, MessageSquare, Phone,
  CheckCircle2, XCircle, Clock, Inbox
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { complaintsApi } from '@/services/apiClient'
import { formatDateTime, cn, truncate } from '@/utils'

const TYPE_CONFIG = {
  sms: { icon: Phone, label: 'SMS', color: 'bg-blue-50 dark:bg-blue-950/20 text-info-theme border-info-theme/20' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'bg-secondary-light text-secondary border-secondary/20' },
}
const STATUS_CONFIG = {
  delivered: { icon: CheckCircle2, label: 'Delivered', color: 'text-secondary' },
  sent: { icon: CheckCircle2, label: 'Sent', color: 'text-info-theme' },
  pending: { icon: Clock, label: 'Pending', color: 'text-warning-theme' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-danger-theme' },
}

const TYPES = ['all', 'sms', 'whatsapp']
const STATUSES = ['all', 'delivered', 'sent', 'pending', 'failed']
const PAGE_SIZE = 10

function mapLog(n) {
  return {
    id: n.id,
    type: n.notification_type,
    recipient: n.recipient_name,
    phone: n.recipient_phone,
    message: n.message,
    status: n.delivery_status,
    sent_at: n.sent_at,
  }
}

export default function NotificationLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError('')
      try {
        const data = await complaintsApi.notifications()
        setLogs((data || []).map(mapLog))
      } catch (err) {
        setError(err.message)
        setLogs([])
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtered = useMemo(() => {
    let data = [...logs]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(n =>
        (n.recipient || '').toLowerCase().includes(q) ||
        (n.phone || '').includes(q) ||
        (n.message || '').toLowerCase().includes(q)
      )
    }
    if (typeFilter !== 'all') data = data.filter(n => n.type === typeFilter)
    if (statusFilter !== 'all') data = data.filter(n => n.status === statusFilter)
    return data
  }, [logs, search, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="text-2xl font-bold text-text-theme">Notification Logs</h1>
        <p className="text-muted-theme text-sm mt-1">Track all SMS and WhatsApp notifications sent to customers.</p>
      </div>

      {error && (
        <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: loading ? '—' : logs.length, color: 'text-text-theme' },
          { label: 'Delivered', value: loading ? '—' : logs.filter(n => n.status === 'delivered').length, color: 'text-secondary' },
          { label: 'Pending', value: loading ? '—' : logs.filter(n => n.status === 'pending').length, color: 'text-warning-theme' },
          { label: 'Failed', value: loading ? '—' : logs.filter(n => n.status === 'failed').length, color: 'text-danger-theme' },
        ].map((s, i) => (
          <Card key={i} className="p-4 text-center">
            <p className="text-xs text-muted-theme font-medium">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none" />
            <input
              type="text"
              placeholder="Search by recipient, phone, or message…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full h-10 pl-10 pr-4 bg-bg border border-border-theme rounded-xl text-sm text-text-theme placeholder:text-subtle-theme focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              className="h-10 bg-bg border border-border-theme rounded-xl px-3 text-sm text-text-theme cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TYPES.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-10 bg-bg border border-border-theme rounded-xl px-3 text-sm text-text-theme cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-light border border-primary-mid/20 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-text-theme mb-1">No notifications found</h3>
            <p className="text-sm text-muted-theme">Notifications appear here when complaints trigger SMS or WhatsApp updates.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-theme bg-bg-alt">
                    {['Type', 'Recipient', 'Phone', 'Message', 'Status', 'Sent At'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {paginated.map(n => {
                    const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.sms
                    const statusConf = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending
                    const TypeIcon = typeConf.icon
                    const StatusIcon = statusConf.icon
                    return (
                      <tr key={n.id} className="hover:bg-bg-alt/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', typeConf.color)}>
                            <TypeIcon className="w-3 h-3" />{typeConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-theme font-medium whitespace-nowrap">{n.recipient || '—'}</td>
                        <td className="px-4 py-3 text-muted-theme whitespace-nowrap">{n.phone || '—'}</td>
                        <td className="px-4 py-3 text-muted-theme max-w-[240px]">
                          <span className="truncate block" title={n.message}>{truncate(n.message, 60)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', statusConf.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />{statusConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-theme text-xs whitespace-nowrap">{formatDateTime(n.sent_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border-theme">
              {paginated.map(n => {
                const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.sms
                const statusConf = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending
                const TypeIcon = typeConf.icon
                const StatusIcon = statusConf.icon
                return (
                  <div key={n.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border', typeConf.color)}>
                        <TypeIcon className="w-3 h-3" />{typeConf.label}
                      </span>
                      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', statusConf.color)}>
                        <StatusIcon className="w-3 h-3" />{statusConf.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-theme">{n.recipient || '—'}</p>
                    <p className="text-xs text-muted-theme mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-subtle-theme mt-1.5">{formatDateTime(n.sent_at)}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-theme bg-bg-alt">
            <p className="text-xs text-muted-theme">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors', p === page ? 'bg-primary text-white' : 'text-muted-theme hover:bg-bg')}>{p}</button>
              ))}
              <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
