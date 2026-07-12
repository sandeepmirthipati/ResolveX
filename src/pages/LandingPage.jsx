import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Mail, Lock, Eye, EyeOff,
  User, Shield, Zap, Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils'
import { formatAuthError } from '@/utils/authError'
import { validatePhoneInput } from '@/utils/phone'

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'user',  label: 'User',  icon: User  },
  { id: 'admin', label: 'Admin', icon: Shield },
]

const PASSWORD_RULES = [
  { label: 'At least 8 characters',   test: v => v.length >= 8 },
  { label: 'Contains uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'Contains number',          test: v => /\d/.test(v) },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  const bar = ['bg-danger-theme', 'bg-warning-theme', 'bg-secondary']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < passed ? bar[passed - 1] : 'bg-border-theme'
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={i}
            className={cn(
              'flex items-center gap-1 text-[11px] transition-colors',
              rule.test(password) ? 'text-secondary' : 'text-subtle-theme'
            )}
          >
            <CheckCircle2
              className={cn(
                'w-3 h-3 shrink-0',
                rule.test(password) ? 'text-secondary' : 'text-border-theme'
              )}
            />
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Role Segmented Control ───────────────────────────────────────────────────
function RoleSwitch({ role, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Select role"
      className="flex bg-bg-alt border border-border-theme rounded-xl p-1 mb-5"
    >
      {ROLES.map(r => {
        const Icon = r.icon
        const active = role === r.id
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r.id)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5',
              'py-2 px-3 text-sm font-medium rounded-lg',
              'transition-colors duration-150 select-none',
              active ? 'text-text-theme' : 'text-muted-theme hover:text-text-theme'
            )}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 bg-card border border-border-soft rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
            <span className="relative z-10">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Shared PasswordInput ─────────────────────────────────────────────────────
function PasswordInput({ name, label, placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        name={name}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={error}
        leftIcon={Lock}
        required
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-[38px] text-muted-theme hover:text-primary transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

import { useAuth } from '@/context/AuthContext'

// ─── Sign-In Panel ────────────────────────────────────────────────────────────
function SignInPanel({ role, onRoleChange, onSwitchMode }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [signedInProfile, setSignedInProfile] = useState(null)

  function validate() {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    try {
      const { profile } = await signIn(form.email, form.password)
      setSignedInProfile(profile)
      setDone(true)
    } catch (err) {
      setErrors({ form: formatAuthError(err) })
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const isAdmin = ['admin', 'super_admin'].includes(signedInProfile?.role)
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard'
    const triedAdminPortal = role === 'admin' && !isAdmin

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-6 gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-success-theme/15 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-success-theme" />
        </div>
        <div>
          <p className="font-semibold text-text-theme">Signed in successfully!</p>
          <p className="text-sm text-muted-theme mt-1">
            Welcome back, {isAdmin ? 'Admin' : signedInProfile?.full_name || 'User'}.
          </p>
          {triedAdminPortal && (
            <p className="text-sm text-warning-theme mt-2">
              This account is registered as a customer. Use the <strong>User</strong> option next time for sign-in.
            </p>
          )}
        </div>
        <Button size="sm" rightIcon={ArrowRight} onClick={() => navigate(dashboardPath)}>
          Go to Dashboard
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <RoleSwitch role={role} onChange={onRoleChange} />

      {errors.form && (
        <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
          &#9888; {errors.form}
        </div>
      )}

      <Input
        type="email"
        name="email"
        label="Email Address"
        placeholder="you@example.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        leftIcon={Mail}
        required
        autoComplete="email"
      />

      <div className="space-y-1">
        <PasswordInput
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />
        <div className="flex justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        id="hero-signin-btn"
        type="submit"
        size="lg"
        className="w-full"
        loading={loading}
        rightIcon={!loading ? ArrowRight : undefined}
      >
        {loading ? 'Signing in…' : `Sign In as ${role === 'admin' ? 'Admin' : 'User'}`}
      </Button>

      {/* Switch to register */}
      <p className="text-center text-xs text-muted-theme pt-1">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-primary font-semibold hover:text-primary-hover transition-colors"
        >
          Create one
        </button>
      </p>
    </form>
  )
}

// ─── Register Panel ───────────────────────────────────────────────────────────
function RegisterPanel({ role, onRoleChange, onSwitchMode }) {
  const { signUp } = useAuth()
  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    const phoneCheck = validatePhoneInput(form.phone)
    if (!phoneCheck.valid) e.phone = phoneCheck.error
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    try {
      await signUp(form.email, form.password, form.fullName, form.phone, role)
      setDone(true)
    } catch (err) {
      setErrors({ form: formatAuthError(err) })
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-6 gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-secondary" />
        </div>
        <div>
          <p className="font-semibold text-text-theme">Account created!</p>
          <p className="text-sm text-muted-theme mt-1">Welcome to ResolveX, {form.fullName.split(' ')[0]}.</p>
        </div>
        <button
          type="button"
          onClick={() => { setDone(false); onSwitchMode() }}
          className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
        >
          Sign in now →
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <RoleSwitch role={role} onChange={onRoleChange} />

      {errors.form && (
        <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
          &#9888; {errors.form}
        </div>
      )}

      <Input
        name="fullName"
        label="Full Name"
        placeholder="John Doe"
        value={form.fullName}
        onChange={handleChange}
        error={errors.fullName}
        leftIcon={User}
        required
        autoComplete="name"
      />

      <Input
        type="email"
        name="email"
        label="Email Address"
        placeholder="you@example.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        leftIcon={Mail}
        required
        autoComplete="email"
      />

      <Input
        type="tel"
        name="phone"
        label="Phone Number"
        placeholder="+919876543210"
        value={form.phone}
        onChange={handleChange}
        error={errors.phone}
        leftIcon={Phone}
        required
        autoComplete="tel"
        hint="Required — international format (E.164), e.g. +919876543210"
      />

      <div className="space-y-1">
        <PasswordInput
          name="password"
          label="Password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrength password={form.password} />
      </div>

      <PasswordInput
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Repeat your password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button
        id="hero-register-btn"
        type="submit"
        size="lg"
        className="w-full"
        loading={loading}
        rightIcon={!loading ? ArrowRight : undefined}
      >
        {loading ? 'Creating Account…' : 'Create Account'}
      </Button>

      {/* Switch to sign-in */}
      <p className="text-center text-xs text-muted-theme pt-1">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-primary font-semibold hover:text-primary-hover transition-colors"
        >
          Sign In
        </button>
      </p>
    </form>
  )
}

// ─── Auth Card ────────────────────────────────────────────────────────────────
function AuthCard() {
  const [mode, setMode] = useState('signin')   // 'signin' | 'register'
  const [role, setRole] = useState('user')     // 'user'   | 'admin'

  const isSignIn = mode === 'signin'

  function toggleMode() {
    setMode(m => m === 'signin' ? 'register' : 'signin')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full max-w-[420px]',
        'bg-card/96 backdrop-blur-xl',
        'border border-border-theme rounded-2xl',
        'shadow-lg overflow-hidden',
        'p-7 lg:p-8'
      )}
      aria-label="Authentication panel"
    >
      {/* Decorative warm glow */}
      <div
        className="absolute -top-20 -right-20 w-56 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 w-40 h-40 bg-secondary/6 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Brand header */}
      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-text-theme leading-tight">
            Resolve<span className="text-primary">X</span>
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={isSignIn ? 'sub-signin' : 'sub-register'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-muted-theme"
            >
              {isSignIn ? 'Welcome back — sign in to continue' : 'Create your account to get started'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border-soft mb-6" />

      {/* Form panels with slide animation */}
      <AnimatePresence mode="wait" initial={false}>
        {isSignIn ? (
          <motion.div
            key="signin-panel"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <SignInPanel
              role={role}
              onRoleChange={setRole}
              onSwitchMode={toggleMode}
            />
          </motion.div>
        ) : (
          <motion.div
            key="register-panel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <RegisterPanel
              role={role}
              onRoleChange={setRole}
              onSwitchMode={toggleMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-start px-4 py-3 bg-card border border-border-theme rounded-xl shadow-sm">
      <span className="text-xl font-bold text-text-theme leading-none">{value}</span>
      <span className="text-[11px] text-muted-theme mt-0.5 uppercase tracking-wide font-medium">
        {label}
      </span>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-bg"
      aria-label="Hero"
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-[580px] h-[580px] bg-primary-light/70 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-10 right-0 w-[420px] h-[420px] bg-secondary-light/60 rounded-full blur-3xl opacity-50" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.025]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="container-custom relative z-10 pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── LEFT: Marketing ── */}
          <div className="flex flex-col">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border-theme text-sm font-medium text-muted-theme shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-success-theme animate-pulse" />
                Real-time SMS &amp; WhatsApp Updates
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl md:text-6xl xl:text-7xl font-bold text-text-theme leading-[1.08] tracking-tight mb-5"
            >
              Complaint management{' '}
              <span className="gradient-text">done right.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18 }}
              className="text-lg text-muted-theme leading-relaxed mb-8 max-w-lg"
            >
              ResolveX helps businesses track, manage, and resolve customer complaints
              with real-time SMS &amp; WhatsApp updates. Turn frustrated customers into
              loyal advocates.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <StatPill value="3.2×" label="Faster Resolution" />
              <StatPill value="+41%" label="CSAT Lift" />
              <StatPill value="SMS · WA" label="Channels" />
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-theme"
            >
              {[
                'No credit card required',
                'SOC 2 Compliant',
                'GDPR Ready',
                '99.9% uptime SLA',
              ].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success-theme shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Auth Card ── */}
          <div className="flex justify-center lg:justify-end">
            <AuthCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-bg text-text-theme">
      <Hero />
    </main>
  )
}