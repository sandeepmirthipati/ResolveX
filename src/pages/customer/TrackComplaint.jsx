import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, CheckCircle2, Clock, MessageSquare, ArrowRight,
  AlertCircle, ShieldCheck, Calendar, ArrowLeft, Bell, UserCheck
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { complaintsApi } from '@/services/apiClient'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime, cn } from '@/utils'

const STATUS_STAGES = [
  { key: 'pending', label: 'Submitted', icon: AlertCircle, desc: 'Complaint received and queued for review' },
  { key: 'assigned', label: 'Assigned', icon: UserCheck, desc: 'Assigned to the relevant department' },
  { key: 'in-progress', label: 'In Progress', icon: Clock, desc: 'Team is actively working on it' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, desc: 'Issue has been resolved' },
  { key: 'closed', label: 'Closed', icon: ShieldCheck, desc: 'Case closed and verified' },
]

function getStageIndex(status) {
  const idx = STATUS_STAGES.findIndex(s => s.key === status)
  return idx === -1 ? 0 : idx
}

function Timeline({ complaint }) {
  const currentStage = getStageIndex(complaint.status)
  const timeline = complaint.timeline || []

  return (
    <div className="space-y-0">
      {STATUS_STAGES.map((stage, i) => {
        const Icon = stage.icon
        const done = i <= currentStage
        const active = i === currentStage
        const isLast = i === STATUS_STAGES.length - 1

        const timelineEntry = timeline.find(t => t.new_status === stage.key)

        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500',
                done
                  ? active
                    ? 'bg-primary border-primary text-white shadow-[0_0_0_4px_rgba(200,107,60,0.15)]'
                    : 'bg-secondary border-secondary text-white'
                  : 'bg-bg-alt border-border-theme text-subtle-theme'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && (
                <div className={cn(
                  'w-0.5 flex-1 min-h-[40px] transition-colors duration-300',
                  i < currentStage ? 'bg-secondary' : 'bg-border-theme'
                )} />
              )}
            </div>

            <div className={cn('pb-6 pt-1.5', isLast && 'pb-0')}>
              <p className={cn(
                'text-sm font-semibold',
                done ? 'text-text-theme' : 'text-subtle-theme'
              )}>
                {stage.label}
                {active && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary-light text-primary text-[10px] font-semibold">
                    Current
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-theme mt-0.5">{stage.desc}</p>
              {timelineEntry && (
                <div className="mt-2 bg-bg-alt rounded-lg px-3 py-2 border border-border-theme">
                  <p className="text-xs text-text-theme">{timelineEntry.action}</p>
                  <p className="text-[10px] text-subtle-theme mt-0.5">
                    {timelineEntry.by} · {formatDateTime(timelineEntry.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ComplaintDetails({ complaint }) {
  const replies = complaint.replies || []

  return (
    <div className="space-y-6 animate-fadeUp">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-theme hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-text-theme font-mono">{complaint.complaint_number || complaint.id}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <h2 className="text-lg font-semibold text-text-theme">{complaint.title}</h2>
          <p className="text-sm text-muted-theme mt-1">{complaint.category_name || '—'} · Filed {formatDateTime(complaint.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-theme mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Complaint Timeline
            </h3>
            <Timeline complaint={complaint} />
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-theme mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Description
            </h3>
            <p className="text-sm text-muted-theme leading-relaxed">{complaint.description}</p>
          </Card>

          {replies.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-text-theme mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary" /> Admin Replies
              </h3>
              <div className="space-y-3">
                {replies.map((r, idx) => (
                  <div key={r.id || idx} className="bg-bg-alt border border-border-theme rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                        {(r.admin_name || 'A').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-theme">{r.admin_name || 'Admin'}</p>
                        <p className="text-[10px] text-subtle-theme">{formatDateTime(r.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-theme leading-relaxed">{r.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-muted-theme uppercase tracking-wider mb-3">Estimated Resolution</h3>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-text-theme">
                {complaint.resolved_at ? formatDateTime(complaint.resolved_at) : '2–5 business days'}
              </span>
            </div>
            <p className="text-xs text-subtle-theme">
              {complaint.resolved_at ? 'Resolved on this date' : 'Based on complaint category and priority'}
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold text-muted-theme uppercase tracking-wider mb-3">Assigned To</h3>
            {complaint.assigned_to_name ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-info-theme/10 flex items-center justify-center text-info-theme text-xs font-bold">
                  {complaint.assigned_to_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-theme">{complaint.assigned_to_name}</p>
                  <p className="text-xs text-muted-theme">{complaint.category_name} Department</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-subtle-theme">Not yet assigned</p>
            )}
          </Card>

          <Card className="p-5 bg-primary-light border-primary-mid/30">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Notifications</h3>
            </div>
            <p className="text-xs text-muted-theme">
              You will receive SMS and WhatsApp updates as this complaint progresses.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function TrackComplaint() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const paramId = searchParams.get('id')
  const [searchInput, setSearchInput] = useState(paramId || '')
  const [searchedId, setSearchedId] = useState(paramId || '')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchedId || !user?.id) {
      setComplaint(null)
      setNotFound(false)
      return
    }
    async function fetchComplaint() {
      setLoading(true)
      setNotFound(false)
      setError('')
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const data = uuidRegex.test(searchedId)
          ? await complaintsApi.get(searchedId)
          : await complaintsApi.track(searchedId)
        setComplaint(data)
      } catch (err) {
        setComplaint(null)
        setNotFound(true)
        setError(err.message)
      }
      setLoading(false)
    }
    fetchComplaint()
  }, [searchedId, user?.id])

  function handleSearch(e) {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchedId(searchInput.trim())
      setSearchParams({ id: searchInput.trim() })
    }
  }

  if (complaint) {
    return <ComplaintDetails complaint={complaint} />
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="text-2xl font-bold text-text-theme">Track Complaint</h1>
        <p className="text-muted-theme text-sm mt-1">
          Enter your complaint number to view its current status and timeline.
        </p>
      </div>

      <Card className="p-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-light border border-primary-mid/20 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-theme mb-1">Search by Complaint Number</h2>
          <p className="text-sm text-muted-theme">
            Your complaint number looks like <span className="font-mono font-medium text-primary">RX-YYYYMMDD-0001</span>
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none" />
            <input
              type="text"
              placeholder="Enter complaint number (e.g. RX-20260710-0001)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-bg border border-border-theme rounded-xl text-sm text-text-theme placeholder:text-subtle-theme focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            />
          </div>
          <Button type="submit" size="lg" rightIcon={ArrowRight} loading={loading}>
            {loading ? 'Searching…' : 'Track'}
          </Button>
        </form>

        {notFound && !loading && (
          <div className="mt-6 bg-red-50 dark:bg-red-950/20 border border-danger-theme/20 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-danger-theme shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-danger-theme">Complaint not found</p>
              <p className="text-xs text-muted-theme mt-1">
                {error || `No complaint was found with the number ${searchedId}. Please check the number and try again.`}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
