import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, Eye,
  FileText, Inbox, SlidersHorizontal
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { complaintsApi } from '@/services/apiClient'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { formatDate, cn } from '@/utils'

const STATUSES = ['all', 'pending', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected']
const PAGE_SIZE = 5

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light border border-primary-mid/20 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-text-theme mb-1">
        {hasFilters ? 'No matching complaints' : 'No complaints yet'}
      </h3>
      <p className="text-sm text-muted-theme mb-5 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or filter criteria.'
          : "When you raise a complaint, it will appear here."
        }
      </p>
      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
      ) : (
        <Link to="/dashboard/raise"><Button size="sm">Raise a Complaint</Button></Link>
      )}
    </div>
  )
}

export default function ComplaintHistory() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('name').order('name')
      if (data) setCategories(data.map(c => c.name))
    }
    loadCategories()
  }, [])

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

  const filtered = useMemo(() => {
    let data = [...complaints]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(c =>
        (c.complaint_number || c.id).toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.category_name || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter)
    }
    if (categoryFilter !== 'all') {
      data = data.filter(c => c.category_name === categoryFilter)
    }
    return data
  }, [complaints, search, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || statusFilter !== 'all' || categoryFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-theme">Complaint History</h1>
          <p className="text-muted-theme text-sm mt-1">
            View and manage all your past complaints.
          </p>
        </div>
        <Link to="/dashboard/raise" className="hidden sm:block">
          <Button leftIcon={FileText}>New Complaint</Button>
        </Link>
      </div>

      {/* Search + filters bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, title, or category…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full h-10 pl-10 pr-4 bg-bg border border-border-theme rounded-xl text-sm text-text-theme placeholder:text-subtle-theme focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="md"
            leftIcon={SlidersHorizontal}
            onClick={() => setShowFilters(v => !v)}
          >
            Filters
            {hasFilters && (
              <span className="ml-1 w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {[statusFilter !== 'all', categoryFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border-theme">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-theme">Status:</span>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-8 bg-bg border border-border-theme rounded-lg px-2 text-xs text-text-theme cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-theme">Category:</span>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                className="h-8 bg-bg border border-border-theme rounded-lg px-2 text-xs text-text-theme cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {['all', ...categories].map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary font-medium hover:underline ml-auto">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-theme">
          {loading ? 'Loading…' : `Showing ${paginated.length} of ${filtered.length} complaint${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-theme bg-bg-alt">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Complaint ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Title</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Priority</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {paginated.map(c => (
                    <tr key={c.id} className="hover:bg-bg-alt/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">{c.complaint_number || c.id}</td>
                      <td className="px-5 py-3.5 text-text-theme max-w-[200px] truncate">{c.title}</td>
                      <td className="px-5 py-3.5 text-muted-theme">{c.category_name || '—'}</td>
                      <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5 text-muted-theme text-xs">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/dashboard/track?id=${c.id}`}>
                          <Button variant="ghost" size="xs" leftIcon={Eye}>View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border-theme">
              {paginated.map(c => (
                <Link key={c.id} to={`/dashboard/track?id=${c.id}`} className="block p-4 hover:bg-bg-alt transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-primary">{c.complaint_number || c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-medium text-text-theme truncate">{c.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-theme">{c.category_name || '—'}</span>
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-subtle-theme ml-auto">{formatDate(c.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-theme bg-bg-alt">
            <p className="text-xs text-muted-theme">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-primary text-white'
                      : 'text-muted-theme hover:bg-bg hover:text-text-theme'
                  )}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
