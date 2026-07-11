import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, MessageSquare, CheckCircle2,
  AlertCircle, ShieldCheck, Phone, Mail,
  FileText, Send, UserCheck, XCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Input'
import { complaintsApi } from '@/services/apiClient'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime, cn } from '@/utils'

const STATUS_STAGES = [
  { key: 'pending', label: 'Submitted', icon: AlertCircle },
  { key: 'assigned', label: 'Assigned', icon: UserCheck },
  { key: 'in-progress', label: 'In Progress', icon: Clock },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'closed', label: 'Closed', icon: ShieldCheck },
]

function getStageIndex(status) {
  const idx = STATUS_STAGES.findIndex(s => s.key === status)
  return idx === -1 ? 0 : idx
}

export default function AdminComplaintDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: adminUser } = useAuth()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replySent, setReplySent] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const loadComplaint = useCallback(async () => {
    setLoading(true)
    try {
      const data = await complaintsApi.get(id)
      setComplaint(data)
    } catch {
      setComplaint(null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadComplaint()
  }, [loadComplaint])

  async function handleSendReply(e) {
    e.preventDefault()
    if (!note.trim()) return
    setSendingReply(true)
    setReplyError('')
    try {
      const data = await complaintsApi.addReply(id, note.trim())
      setComplaint(prev => ({
        ...prev,
        replies: [...(prev.replies || []), data],
      }))
      setReplySent(true)
      setNote('')
      setTimeout(() => setReplySent(false), 3000)
    } catch (err) {
      setReplyError(err.message)
    } finally {
      setSendingReply(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    setUpdateError('')
    try {
      const updates = { status: newStatus }
      if (newStatus === 'assigned') updates.assigned_to = adminUser?.id
      const data = await complaintsApi.update(id, updates)
      setComplaint(data)
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeUp text-center">
        <div className="w-16 h-16 rounded-full bg-danger-theme/10 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-danger-theme" />
        </div>
        <h2 className="text-xl font-bold text-text-theme mb-2">Complaint Not Found</h2>
        <p className="text-sm text-muted-theme mb-6">No complaint matches ID: <span className="font-mono font-semibold">{id}</span></p>
        <Button onClick={() => navigate('/admin/complaints')}>Back to Complaints</Button>
      </div>
    )
  }

  const currentStage = getStageIndex(complaint.status)
  const replies = complaint.replies || []
  const timeline = complaint.timeline || []

  return (
    <div className="space-y-6 animate-fadeUp">
      <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-sm text-muted-theme hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Complaints
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-theme font-mono">{complaint.complaint_number || complaint.id}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <h2 className="text-lg font-semibold text-text-theme">{complaint.title}</h2>
          <p className="text-sm text-muted-theme mt-1">{complaint.category_name || '—'} · Filed {formatDateTime(complaint.created_at)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {complaint.status === 'pending' && (
            <Button variant="outline" size="sm" loading={updating} onClick={() => handleStatusChange('assigned')}>
              Assign to Me
            </Button>
          )}
          {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
            <>
              <Button variant="outline" size="sm" loading={updating} onClick={() => handleStatusChange('in-progress')}>
                Start Progress
              </Button>
              <Button variant="secondary" size="sm" leftIcon={CheckCircle2} loading={updating} onClick={() => handleStatusChange('resolved')}>
                Mark Resolved
              </Button>
              <Button variant="outline" size="sm" loading={updating} onClick={() => handleStatusChange('closed')}>
                Close Case
              </Button>
            </>
          )}
        </div>
      </div>

      {updateError && (
        <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
          ⚠ {updateError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-theme mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Complaint Details
            </h3>
            <p className="text-sm text-muted-theme leading-relaxed">{complaint.description}</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-theme mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Status Timeline
            </h3>
            <div className="flex items-center gap-2 mb-6">
              {STATUS_STAGES.map((stage, i) => {
                const Icon = stage.icon
                const done = i <= currentStage
                const active = i === currentStage
                return (
                  <div key={stage.key} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                      done
                        ? active ? 'bg-primary border-primary text-white' : 'bg-secondary border-secondary text-white'
                        : 'bg-bg-alt border-border-theme text-subtle-theme'
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {i < STATUS_STAGES.length - 1 && (
                      <div className={cn('h-0.5 flex-1 rounded-full', i < currentStage ? 'bg-secondary' : 'bg-border-theme')} />
                    )}
                  </div>
                )
              })}
            </div>

            {timeline.length > 0 && (
              <div className="mt-6 space-y-3">
                {timeline.map((entry, idx) => (
                  <div key={entry.id || idx} className="flex items-start gap-3 p-3 bg-bg-alt rounded-xl border border-border-theme">
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-theme">{entry.action}</p>
                      <p className="text-[10px] text-subtle-theme mt-0.5">{entry.by} · {formatDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-theme mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-secondary" /> Admin Notes & Replies
            </h3>
            {replies.length > 0 && (
              <div className="space-y-3 mb-5">
                {replies.map((r, idx) => (
                  <div key={r.id || idx} className="bg-secondary-light border border-secondary/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white text-[10px] font-bold">
                        {(r.admin_name || 'A').split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-semibold text-text-theme">{r.admin_name || 'Admin'}</span>
                      <span className="text-[10px] text-subtle-theme">· {formatDateTime(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-theme leading-relaxed">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            {replySent && (
              <div className="bg-secondary-light border border-secondary/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-xs text-secondary font-medium">Reply sent successfully</span>
              </div>
            )}

            {replyError && (
              <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 mb-4 text-xs text-danger-theme">
                ⚠ {replyError}
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <Textarea
                placeholder="Write a reply or internal note…"
                value={note}
                onChange={e => { setNote(e.target.value); setReplySent(false) }}
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <Button type="submit" size="sm" leftIcon={Send} loading={sendingReply} disabled={!note.trim()}>
                  {sendingReply ? 'Sending…' : 'Send Reply'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-muted-theme uppercase tracking-wider mb-3">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                  {(complaint.customer_name || 'C').split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-theme">{complaint.customer_name || '—'}</p>
                  <p className="text-xs text-muted-theme">Customer</p>
                </div>
              </div>
              {complaint.customer_email && (
                <div className="flex items-center gap-2 text-xs text-muted-theme">
                  <Mail className="w-3.5 h-3.5" />{complaint.customer_email}
                </div>
              )}
              {complaint.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-theme">
                  <Phone className="w-3.5 h-3.5" />{complaint.phone}
                </div>
              )}
            </div>
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

          <Card className="p-5">
            <h3 className="text-xs font-semibold text-muted-theme uppercase tracking-wider mb-3">Details</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Created', value: formatDateTime(complaint.created_at) },
                { label: 'Updated', value: formatDateTime(complaint.updated_at) },
                { label: 'Category', value: complaint.category_name || '—' },
                { label: 'Priority', value: complaint.priority },
                { label: 'Status', value: complaint.status },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-muted-theme">{row.label}</span>
                  <span className="text-text-theme font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
