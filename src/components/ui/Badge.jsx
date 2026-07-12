import { cn } from '@/utils'
import { getStatusColor, getPriorityColor } from '@/utils'

export function StatusBadge({ status, className }) {
  const label = {
    pending: 'Pending',
    assigned: 'Assigned',
    open: 'Open',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    rejected: 'Rejected',
  }[status] || status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        getStatusColor(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

export function PriorityBadge({ priority, className }) {
  const label = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }[priority] || priority

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        getPriorityColor(priority),
        className
      )}
    >
      {label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-bg-alt text-muted-theme border-border-theme',
    primary: 'bg-primary-light text-primary border-primary-mid/30',
    success: 'bg-secondary-light text-secondary border-secondary/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-warning-theme border-warning-theme/20',
    danger: 'bg-red-50 dark:bg-red-950/20 text-danger-theme border-danger-theme/20',
    info: 'bg-blue-50 dark:bg-blue-950/20 text-info-theme border-info-theme/20',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}
