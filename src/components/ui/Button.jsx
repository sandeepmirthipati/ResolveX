import { cn } from '@/utils'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover active:opacity-90 shadow-sm hover:shadow-md',
        secondary: 'bg-secondary text-white hover:bg-secondary-hover active:opacity-90 shadow-sm hover:shadow-md',
        outline: 'border border-border-theme bg-card text-text-theme hover:bg-bg-alt hover:border-primary/50',
        ghost: 'text-text-theme hover:bg-bg-alt',
        danger: 'bg-danger-theme text-white hover:opacity-90 shadow-sm',
        success: 'bg-success-theme text-white hover:opacity-90 shadow-sm',
        link: 'text-primary hover:underline underline-offset-4 p-0 h-auto',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-base rounded-2xl',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
        'icon-lg': 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export function Button({
  className,
  variant,
  size,
  children,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : LeftIcon ? (
        <LeftIcon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4 shrink-0" />}
    </button>
  )
}
