import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-amber-50 dark:bg-amber-950/10 text-warning-theme border-warning-theme/20',
    assigned: 'bg-primary-light text-primary border-primary-mid/20',
    open: 'bg-primary-light text-primary border-primary-mid/20',
    'in-progress': 'bg-blue-50 dark:bg-blue-950/10 text-info-theme border-info-theme/20',
    resolved: 'bg-secondary-light text-secondary border-secondary/20',
    closed: 'bg-bg-alt text-muted-theme border-border-theme',
    rejected: 'bg-red-50 dark:bg-red-950/10 text-danger-theme border-danger-theme/20',
  }
  return colors[status] || colors.pending
}

export function getPriorityColor(priority) {
  const colors = {
    low: 'bg-secondary-light text-secondary border-secondary/20',
    medium: 'bg-amber-50 dark:bg-amber-950/10 text-warning-theme border-warning-theme/20',
    high: 'bg-orange-50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 border-orange-200/30',
    critical: 'bg-red-50 dark:bg-red-950/10 text-danger-theme border-danger-theme/20',
  }
  return colors[priority] || colors.medium
}

export function truncate(str, length = 50) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}
