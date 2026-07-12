import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Eye,
  SlidersHorizontal, ChevronLeft, ChevronRight,
  Inbox
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { complaintsApi } from '@/services/apiClient'
import { supabase } from '@/services/supabaseClient'
import { formatDate, cn } from '@/utils'

const STATUSES = ['all', 'pending', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected']
const PRIORITIES = ['all', 'low', 'medium', 'high', 'critical']
const PAGE_SIZE = 6

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const [priorityFilter, setPriorityFilter] = useState('all')
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
  }, [])

  const filtered = useMemo(() => {
    let data = [...complaints]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(c =>
        (c.complaint_number || c.id).toLowerCase().includes(q) ||
        (c.customer_name || '').toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
      )
    }
    if (statusFilter !== 'all') data = data.filter(c => c.status === statusFilter)
    if (categoryFilter !== 'all') data = data.filter(c => c.category_name === categoryFilter)
    if (priorityFilter !== 'all') data = data.filter(c => c.priority === priorityFilter)
    return data
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'

  function clearFilters() {
    setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setPriorityFilter('all'); setPage(1)
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-theme">Complaint Management</h1>
          <p className="text-muted-theme text-sm mt-1">
            {loading ? 'Loading…' : `${complaints.length} total complaints · ${complaints.filter(c => ['pending', 'assigned'].includes(c.status)).length} pending review`}
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, name, phone, or title…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full h-10 pl-10 pr-4 bg-bg border border-border-theme rounded-xl text-sm text-text-theme placeholder:text-subtle-theme focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="md"
            leftIcon={SlidersHorizontal}
            onClick={() => setShowFilters(v => !v)}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border-theme">
            {[
              { label: 'Status', value: statusFilter, setter: setStatusFilter, options: STATUSES },
              { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: ['all', ...categories] },
              { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: PRIORITIES },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-theme">{f.label}:</span>
                <select
                  value={f.value}
                  onChange={e => { f.setter(e.target.value); setPage(1) }}
                  className="h-8 bg-bg border border-border-theme rounded-lg px-2 text-xs text-text-theme cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {f.options.map(o => (
                    <option key={o} value={o}>
                      {o === 'all' ? `All ${f.label}` : o.charAt(0).toUpperCase() + o.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary font-medium hover:underline ml-auto">Clear all</button>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
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
            <h3 className="text-base font-semibold text-text-theme mb-1">No complaints found</h3>
            <p className="text-sm text-muted-theme mb-4">{hasFilters ? 'Try adjusting your filters.' : 'No complaints have been submitted yet.'}</p>
            {hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-theme bg-bg-alt">
                    {['Complaint #', 'Customer', 'Phone', 'Category', 'Priority', 'Status', 'Created', 'Assigned To', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-theme uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {paginated.map(c => (
                    <tr key={c.id} className="hover:bg-bg-alt/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary whitespace-nowrap">{c.complaint_number || c.id}</td>
                      <td className="px-4 py-3 text-text-theme text-xs whitespace-nowrap">{c.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-muted-theme text-xs whitespace-nowrap">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-muted-theme text-xs">{c.category_name || '—'}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-muted-theme text-xs whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {c.assigned_to_name ? (
                          <span className="text-text-theme">{c.assigned_to_name}</span>
                        ) : (
                          <span className="text-subtle-theme italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/complaints/${c.id}`}>
                            <Button variant="ghost" size="icon-sm" title="View Details"><Eye className="w-3.5 h-3.5" /></Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet/Mobile */}
            <div className="lg:hidden divide-y divide-border-theme">
              {paginated.map(c => (
                <div key={c.id} className="p-4 hover:bg-bg-alt transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-primary">{c.complaint_number || c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-medium text-text-theme truncate mb-1">{c.customer_name || '—'}</p>
                  <p className="text-xs text-muted-theme truncate mb-2">{c.title}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-theme">{c.category_name || '—'}</span>
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-subtle-theme ml-auto">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/complaints/${c.id}`} className="flex-1">
                      <Button variant="outline" size="xs" className="w-full" leftIcon={Eye}>View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-theme bg-bg-alt">
            <p className="text-xs text-muted-theme">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors', p === page ? 'bg-primary text-white' : 'text-muted-theme hover:bg-bg hover:text-text-theme')}
                >
                  {p}
                </button>
              ))}
              <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
