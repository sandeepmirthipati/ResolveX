import { useState, useEffect } from 'react'
import {
  Building2, Sun, Moon, Bell, User, Shield, Save,
  CheckCircle2, Mail, Phone, Globe, Lock, Eye, EyeOff, MessageSquare
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabaseClient'
import { cn } from '@/utils'

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

function CompanyInfo() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      setError('')
      const { data, error: settingsError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'company')
        .maybeSingle()

      if (settingsError) {
        setError(settingsError.message)
      } else if (data?.value) {
        setForm(prev => ({ ...prev, ...data.value }))
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert({ key: 'company', value: form, updated_by: user?.id || null }, { onConflict: 'key' })
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSaved(true)
    }
  }

  return (
    <Card className="p-6">
      <SectionHeader icon={Building2} title="Company Information" desc="Your organization details" />
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="name" label="Company Name" value={form.name} onChange={handleChange} leftIcon={Building2} disabled={loading} />
          <Input name="email" label="Support Email" value={form.email} onChange={handleChange} leftIcon={Mail} disabled={loading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="phone" label="Phone" value={form.phone} onChange={handleChange} leftIcon={Phone} disabled={loading} />
          <Input name="website" label="Website" value={form.website} onChange={handleChange} leftIcon={Globe} disabled={loading} />
        </div>
        <Input name="address" label="Address" value={form.address} onChange={handleChange} disabled={loading} />
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving || loading} leftIcon={!saving && !loading ? Save : undefined}>{saving ? 'Saving...' : loading ? 'Loading...' : 'Save Changes'}</Button>
          {saved && <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
        </div>
      </form>
    </Card>
  )
}

function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  return (
    <Card className="p-6">
      <SectionHeader icon={Sun} title="Theme Settings" desc="Customize the application appearance" />
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {[
          { value: 'light', label: 'Light Mode', icon: Sun, desc: 'Bright, clean interface' },
          { value: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Reduced eye strain' },
        ].map(opt => {
          const Icon = opt.icon
          const selected = theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all duration-200',
                selected ? 'border-primary bg-primary-light' : 'border-border-theme hover:border-primary/40'
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

function NotificationSettings() {
  const { user: profile } = useAuth()
  const [prefs, setPrefs] = useState({ sms: true, whatsapp: true, email: true, marketing: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    setPrefs({
      sms: profile.notification_sms ?? true,
      whatsapp: profile.notification_whatsapp ?? true,
      email: profile.notification_email ?? true,
      marketing: profile.notification_marketing ?? false,
    })
  }, [profile])

  function toggle(key) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    if (!profile?.id) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('profiles').update({
      notification_sms: prefs.sms,
      notification_whatsapp: prefs.whatsapp,
      notification_email: prefs.email,
      notification_marketing: prefs.marketing,
    }).eq('id', profile.id)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSaved(true)
    }
  }

  const items = [
    { key: 'sms', label: 'SMS Notifications', desc: 'Receive complaint updates by text message', icon: Phone },
    { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Receive complaint updates through WhatsApp', icon: MessageSquare },
    { key: 'email', label: 'Email Notifications', desc: 'Receive complaint updates by email', icon: Mail },
    { key: 'marketing', label: 'Marketing & Updates', desc: 'Receive product news and feature updates', icon: Globe },
  ]

  return (
    <Card className="p-6">
      <SectionHeader icon={Bell} title="Notification Settings" desc="Configure admin notification preferences" />
      {error && <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 mb-4 text-xs text-danger-theme">{error}</div>}
      <div className="space-y-3">
        {items.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-bg-alt rounded-xl border border-border-theme">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-theme" />
              <div>
                <p className="text-sm font-medium text-text-theme">{label}</p>
                <p className="text-xs text-muted-theme">{desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={cn('w-11 h-6 rounded-full transition-all duration-200 relative shrink-0', prefs[key] ? 'bg-primary' : 'bg-border-theme')}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200', prefs[key] ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={handleSave} loading={saving} leftIcon={!saving ? Save : undefined}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
        {saved && <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
      </div>
    </Card>
  )
}

function ProfileSettings() {
  const { user: profile, session } = useAuth()
  const authUser = session?.user || null
  const [form, setForm] = useState({ name: profile?.full_name || authUser?.user_metadata?.full_name || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) setForm({ name: profile.full_name || '' })
  }, [profile])

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setSaved(false); setError('') }
  async function handleSave(e) {
    e.preventDefault()
    if (!authUser?.id) return
    setSaving(true)
    setError('')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: form.name })
      .eq('id', authUser.id)
    setSaving(false)
    if (profileError) setError(profileError.message)
    else setSaved(true)
  }

  const initials = form.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD'

  return (
    <Card className="p-6">
      <SectionHeader icon={User} title="Profile Settings" desc="Your admin account details" />
      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        {error && <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">{error}</div>}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1E1A16] flex items-center justify-center text-white text-xl font-bold">{initials}</div>
          <div>
            <p className="text-sm font-semibold text-text-theme">{form.name || 'Admin'}</p>
            <p className="text-xs text-muted-theme">{authUser?.email || ''}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold bg-primary-light text-primary border border-primary-mid/20">
              <Shield className="w-2.5 h-2.5" /> {profile?.role || 'Admin'}
            </span>
          </div>
        </div>
        <Input name="name" label="Full Name" value={form.name} onChange={handleChange} leftIcon={User} />
        <Input name="email" label="Email" value={authUser?.email || ''} onChange={() => {}} leftIcon={Mail} disabled hint="Contact system admin to change" />
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving} leftIcon={!saving ? Save : undefined}>{saving ? 'Saving...' : 'Save'}</Button>
          {saved && <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
        </div>
      </form>
    </Card>
  )
}

function SecuritySettings() {
  const [form, setForm] = useState({ newPass: '', confirm: '' })
  const [show, setShow] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
    setSaved(false)
    setServerError('')
  }
  
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.newPass) errs.newPass = 'Required'
    else if (form.newPass.length < 8) errs.newPass = 'Min 8 characters'
    if (form.newPass !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    
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

  return (
    <Card className="p-6">
      <SectionHeader icon={Lock} title="Security Settings" desc="Update your password and security options" />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {serverError && <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">{serverError}</div>}
        {[
          { name: 'newPass', label: 'New Password', auto: 'new-password' },
          { name: 'confirm', label: 'Confirm New Password', auto: 'new-password' },
        ].map(f => (
          <div key={f.name} className="relative">
            <Input
              type={show[f.name] ? 'text' : 'password'}
              name={f.name}
              label={f.label}
              value={form[f.name]}
              onChange={handleChange}
              error={errors[f.name]}
              leftIcon={Lock}
              autoComplete={f.auto}
            />
            <button type="button" onClick={() => setShow(s => ({ ...s, [f.name]: !s[f.name] }))} className="absolute right-3 top-[38px] text-muted-theme hover:text-primary">
              {show[f.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving} leftIcon={!saving ? Save : undefined}>{saving ? 'Updating...' : 'Update Password'}</Button>
          {saved && <span className="flex items-center gap-1.5 text-xs text-secondary font-medium animate-fadeUp"><CheckCircle2 className="w-3.5 h-3.5" /> Updated</span>}
        </div>
      </form>
    </Card>
  )
}

export default function AdminSettings() {
  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="text-2xl font-bold text-text-theme">Settings</h1>
        <p className="text-muted-theme text-sm mt-1">Manage your organization and account settings.</p>
      </div>
      <CompanyInfo />
      <ThemeSettings />
      <NotificationSettings />
      <ProfileSettings />
      <SecuritySettings />
    </div>
  )
}