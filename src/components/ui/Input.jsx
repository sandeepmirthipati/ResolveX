import { cn } from '@/utils'
import { forwardRef } from 'react'

export const Input = forwardRef(({ className, type = 'text', label, error, hint, leftIcon: LeftIcon, rightIcon: RightIcon, wrapperClassName, ...props }, ref) => {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-theme mb-1.5">
          {label}
          {props.required && <span className="text-danger-theme ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <LeftIcon className="h-4 w-4 text-muted-theme" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full h-11 bg-card border border-border-theme',
            'rounded-xl px-3.5 text-sm text-text-theme',
            'placeholder:text-subtle-theme',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-alt',
            error && 'border-danger-theme/60 focus:border-danger-theme focus:ring-danger-theme/20',
            LeftIcon && 'pl-10',
            RightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <RightIcon className="h-4 w-4 text-muted-theme" />
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger-theme flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-theme">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

export const Textarea = forwardRef(({ className, label, error, hint, wrapperClassName, ...props }, ref) => {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-theme mb-1.5">
          {label}
          {props.required && <span className="text-danger-theme ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-card border border-border-theme',
          'rounded-xl px-3.5 py-3 text-sm text-text-theme',
          'placeholder:text-subtle-theme',
          'transition-all duration-150 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger-theme/60 focus:border-danger-theme focus:ring-danger-theme/20',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger-theme flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-theme">{hint}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({ className, label, error, hint, children, wrapperClassName, ...props }, ref) => {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-theme mb-1.5">
          {label}
          {props.required && <span className="text-danger-theme ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full h-11 bg-card border border-border-theme',
          'rounded-xl px-3.5 text-sm text-text-theme',
          'transition-all duration-150 cursor-pointer appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger-theme/60',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger-theme flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-theme">{hint}</p>}
    </div>
  )
})
Select.displayName = 'Select'
