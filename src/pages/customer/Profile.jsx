import { useState } from 'react'
import {
  User, Mail, Phone, Shield, Bell, Sun, Moon, Camera,
  Save, Eye, EyeOff, Lock, CheckCircle2, Globe, Calendar,
  MessageSquare
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn, formatDate } from '@/utils'
import { validatePhoneInput } from '@/utils/phone'

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border-theme">
      <div className="w-9 h-9 rounded-xl bg-primary-light border border-primary-mid/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-text-theme">{title}</h2>
        {desc && <p className="text-xs text-muted-theme">{desc}</p>}
      </div>
    </div>
  )
}

function PersonalDetails({ authUser, profile }) {
  const [form, setForm] = useState({
    fullName: profile?.full_name || authUser?.user_metadata?.full_name || '',
    phone: profile?.phone_number || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const phoneCheck = validatePhoneInput(form.phone)
    if (!phoneCheck.valid) {
      setError(phoneCheck.error)
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.fullName, phone_number: phoneCheck.normalized })
      .eq('id', authUser.id)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
    }
  }

  return (
    <Card className="p-6">
      <SectionHeader icon={User} title="Personal Information" desc="Manage your personal details" />
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
            ⚠ {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="fullName"
            label="Full Name"
            value={form.fullName}
            onChange={handleChange}
            leftIcon={User}
          />
          <Input
            type="email"
            name="email"
            label="Email Address"
            value={authUser?.email || ''}
            onChange={() => {}}
            leftIcon={Mail}
            disabled
            hint="Contact support to change your email"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="tel"
            name="phone"
            label="Phone Number"
            value={form.phone}
            onChange={handleChange}
            leftIcon={Phone}
            hint="Used for SMS & WhatsApp notifications"
          />
          <div>
            <label className="block text-sm font-medium text-text-theme mb-1.5">Member Since</label>
            <div className="h-11 flex items-center gap-2 px-3.5 bg-bg-alt border border-border-theme rounded-xl text-sm text-muted-theme">
              <Calendar className="w-4 h-4 text-muted-theme" />
              {authUser?.created_at ? formatDate(authUser.created_at) : '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving} leftIcon={!saving ? Save : undefined}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp">
              <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}

function ChangePassword() {
  const [form, setForm] = useState({ newPass: '', confirm: '' })
  const [show, setShow] = useState({ newPass: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setSaved(false)
    setServerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.newPass) errs.newPass = 'New password is required'
    else if (form.newPass.length < 8) errs.newPass = 'Must be at least 8 characters'
    if (form.newPass !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password: form.newPass })
    setSaving(false)
    if (error) {
      setServerError(error.message)
    } else {
      setSaved(true)
      setForm({ newPass: '', confirm: '' })
    }
  }

  function toggleShow(key) {
    setShow(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card className="p-6">
      <SectionHeader icon={Lock} title="Change Password" desc="Update your account password" />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {serverError && (
          <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
            ⚠ {serverError}
          </div>
        )}
        <div className="relative">
          <Input
            type={show.newPass ? 'text' : 'password'}
            name="newPass"
            label="New Password"
            value={form.newPass}
            onChange={handleChange}
            error={errors.newPass}
            leftIcon={Lock}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => toggleShow('newPass')} className="absolute right-3 top-[38px] text-muted-theme hover:text-primary">
            {show.newPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={show.confirm ? 'text' : 'password'}
            name="confirm"
            label="Confirm New Password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
            leftIcon={Lock}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-[38px] text-muted-theme hover:text-primary">
            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving} leftIcon={!saving ? Save : undefined}>
            {saving ? 'Updating…' : 'Update Password'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp">
              <CheckCircle2 className="w-3.5 h-3.5" /> Password updated
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}

function NotificationPreferences({ authUser, profile }) {
  const [prefs, setPrefs] = useState({
    sms: profile?.notification_sms ?? true,
    whatsapp: profile?.notification_whatsapp ?? true,
    email: profile?.notification_email ?? true,
    marketing: profile?.notification_marketing ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(key) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles').update({
      notification_sms: prefs.sms,
      notification_whatsapp: prefs.whatsapp,
      notification_email: prefs.email,
      notification_marketing: prefs.marketing,
    }).eq('id', authUser.id)
    setSaving(false)
    setSaved(true)
  }

  const items = [
    { key: 'sms', label: 'SMS Notifications', desc: 'Receive complaint updates via text message', icon: Phone },
    { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Get updates through WhatsApp messages', icon: MessageSquare },
    { key: 'email', label: 'Email Notifications', desc: 'Get complaint updates via email', icon: Mail },
    { key: 'marketing', label: 'Marketing & Updates', desc: 'Receive product news and feature updates', icon: Globe },
  ]

  return (
    <Card className="p-6">
      <SectionHeader icon={Bell} title="Notification Preferences" desc="Choose how you want to be notified" />
      <div className="space-y-3">
        {items.map(({ key, label, desc, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-bg-alt rounded-xl border border-border-theme"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-theme" />
              <div>
                <p className="text-sm font-medium text-text-theme">{label}</p>
                <p className="text-xs text-muted-theme">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(key)}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative shrink-0',
                prefs[key] ? 'bg-primary' : 'bg-border-theme'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                prefs[key] ? 'left-[22px]' : 'left-0.5'
              )} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={handleSave} loading={saving} leftIcon={!saving ? Save : undefined}>
          {saving ? 'Saving…' : 'Save Preferences'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp">
            <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved
          </span>
        )}
      </div>
    </Card>
  )
}

function ThemePreference() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
  ]

  return (
    <Card className="p-6">
      <SectionHeader icon={Sun} title="Theme Preference" desc="Choose your preferred appearance" />
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map(opt => {
          const Icon = opt.icon
          const selected = theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all duration-200',
                selected
                  ? 'border-primary bg-primary-light'
                  : 'border-border-theme hover:border-primary/40'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-2', selected ? 'text-primary' : 'text-muted-theme')} />
              <p className="text-sm font-semibold text-text-theme">{opt.label}</p>
              <p className="text-xs text-muted-theme mt-0.5">{opt.desc}</p>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default function Profile() {
  const { user: profile, session } = useAuth()
  // authUser is the raw Supabase Auth user from the session
  const authUser = session?.user || null

  const name = profile?.full_name || authUser?.user_metadata?.full_name || 'User'
  const email = profile?.email || authUser?.email || ''
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header with avatar */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <button className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-text-theme">{name}</h1>
            <p className="text-sm text-muted-theme">{email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-light text-secondary border border-secondary/20">
                <Shield className="w-3 h-3" /> {profile?.role === 'admin' ? 'Admin' : 'Customer'}
              </span>
              {authUser?.created_at && (
                <span className="text-xs text-subtle-theme">Member since {formatDate(authUser.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {authUser && (
        <>
          <PersonalDetails authUser={authUser} profile={profile} />
          <ChangePassword />
          <NotificationPreferences authUser={authUser} profile={profile} />
        </>
      )}
      <ThemePreference />
    </div>
  )
}
