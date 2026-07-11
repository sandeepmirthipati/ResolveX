import { cn } from '@/utils'
import { forwardRef } from 'react'

export const Card = forwardRef(({ className, children, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-card border border-border-theme rounded-2xl shadow-[var(--shadow-sm)]',
      hover && 'transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pb-0', className)} {...props}>
    {children}
  </div>
))
CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props}>
    {children}
  </div>
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0 flex items-center', className)} {...props}>
    {children}
  </div>
))
CardFooter.displayName = 'CardFooter'

export const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-semibold text-text-theme leading-snug', className)} {...props}>
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-theme mt-1', className)} {...props}>
    {children}
  </p>
))
CardDescription.displayName = 'CardDescription'

// Stat card for dashboards
export function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', description, iconColor, iconBg, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-theme">{title}</p>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-theme">{value}</p>
      {(change || description) && (
        <p className={cn(
          'text-xs mt-2 font-medium',
          description ? 'text-muted-theme' :
          changeType === 'up' ? 'text-success-theme' :
          changeType === 'down' ? 'text-danger-theme' : 'text-muted-theme'
        )}>
          {change && (changeType === 'up' ? '↑ ' : changeType === 'down' ? '↓ ' : '')}{change || description}
        </p>
      )}
    </Card>
  )
}
