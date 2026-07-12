import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/services/supabaseClient'
import { formatAuthError } from '@/utils/authError'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function validate() {
    if (!email) return 'Email address is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    const redirectTo = `${window.location.origin}/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (resetError) {
      setError(formatAuthError(resetError))
      return
    }
    setSent(true)
  }

  async function handleResend() {
    setLoading(true)
    const redirectTo = `${window.location.origin}/reset-password`
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="animate-fadeUp text-center">
        <div className="w-20 h-20 rounded-full bg-secondary-light border border-secondary/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-text-theme mb-3">Check your inbox</h1>
        <p className="text-muted-theme text-sm mb-2">
          We've sent a password reset link to
        </p>
        <p className="text-primary font-semibold text-sm mb-6 font-mono">{email}</p>
        <p className="text-xs text-subtle-theme mb-8 leading-relaxed">
          Didn't receive it? Check your spam folder. The link expires in 30 minutes.
        </p>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Try a different email
          </Button>
          <Link to="/">
            <Button variant="ghost" size="lg" className="w-full" leftIcon={ArrowLeft}>
              Back to Sign In
            </Button>
          </Link>
        </div>

        <p className="text-xs text-subtle-theme mt-6">
          Still not received?{' '}
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Resend email
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary-mid/30 flex items-center justify-center mb-5">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text-theme mb-2">Forgot your password?</h1>
        <p className="text-muted-theme text-sm">
          Enter your registered email and we'll send you a secure link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
            ⚠ {error}
          </div>
        )}
        <Input
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); if (error) setError('') }}
          error={error && !email ? error : ''}
          leftIcon={Mail}
          required
          autoComplete="email"
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          rightIcon={!loading ? ArrowRight : undefined}
        >
          {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-theme hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-text-theme">
          Resolve<span className="text-primary">X</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
