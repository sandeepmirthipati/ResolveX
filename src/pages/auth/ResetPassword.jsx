import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/services/supabaseClient'
import { cn } from '@/utils'
import { formatAuthError } from '@/utils/authError'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: v => v.length >= 8 },
  { label: 'Contains uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'Contains number', test: v => /\d/.test(v) },
]

function ResetPasswordForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setSessionError('Invalid or expired reset link. Please request a new password reset.')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true)
        setSessionError('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function validate() {
    const e = {}
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })
    setLoading(false)
    if (error) {
      setErrors({ form: formatAuthError(error) })
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="animate-fadeUp text-center">
        <div className="w-20 h-20 rounded-full bg-secondary-light border border-secondary/20 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-text-theme mb-3">Password reset!</h1>
        <p className="text-muted-theme text-sm mb-8 leading-relaxed">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <Button
          size="lg"
          className="w-full"
          rightIcon={ArrowRight}
          onClick={() => navigate('/')}
        >
          Sign In
        </Button>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="animate-fadeUp text-center">
        <p className="text-sm text-danger-theme mb-4">{sessionError}</p>
        <Link to="/forgot-password">
          <Button variant="outline">Request new reset link</Button>
        </Link>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary-mid/30 flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text-theme mb-2">Reset your password</h1>
        <p className="text-muted-theme text-sm">
          Create a new, strong password for your ResolveX account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {errors.form && (
          <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
            ⚠ {errors.form}
          </div>
        )}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="New Password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={Lock}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-[38px] text-muted-theme hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {form.password && (
            <div className="bg-bg-alt rounded-lg p-3 border border-border-theme space-y-1.5">
              {PASSWORD_RULES.map((rule, i) => (
                <div key={i} className={cn('flex items-center gap-2 text-xs transition-colors', rule.test(form.password) ? 'text-secondary' : 'text-subtle-theme')}>
                  <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0', rule.test(form.password) ? 'text-secondary' : 'text-border-theme')} />
                  {rule.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Repeat your new password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={Lock}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-[38px] text-muted-theme hover:text-primary transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          rightIcon={!loading ? ArrowRight : undefined}
        >
          {loading ? 'Resetting Password…' : 'Reset Password'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-theme mt-6">
        Remember your password?{' '}
        <Link to="/" className="text-primary font-semibold hover:text-primary-hover transition-colors">
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-text-theme">
          Resolve<span className="text-primary">X</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
